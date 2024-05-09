#TODO: Handle region-based cookie
#DONE: Deposit
#TODO: Withdraw
#DONE: Trade
#DONE: User stats
#DONE: Make sure dupe trades cant get sent
#DONE: Make sure multiple of the same item cant get sent in same trade
#DONE: Clear myOffer and theirOffer on trade completion
#DONE: Fix "You get" item layout - make horozontal
#DONE: Place to look at different user's stats
#TODO: Marketing material
#TODO: Onsite chat/messaging
#TODO: Notifications/news?
#TODO: Leaderboard?
#TODO: HTTPS/SSL!!!!!
#DONE: RAP Updating

import requests, random, time, secrets, os, threading
import flask
from flask import Flask, request, jsonify, make_response
import hmac, base64, struct, hashlib, time, json
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import DataRequired
from datetime import datetime, timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address




sqlpw = os.environ.get("SQLPW")
app = Flask(__name__)
app.config['SECRET_KEY'] = 'zewwsftw124mkwo'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://root:{sqlpw}@localhost/limswap'
db = SQLAlchemy(app)
limiter = Limiter(app=app, key_func=get_remote_address)
regionUrl = "https://api.country.is/"
baseUsersUrl = "https://users.roblox.com/"


class LoginForm(FlaskForm):
    roblosecurity = StringField('roblosecurity', validators=[DataRequired()])

class User(db.Model):
    __tablename__ = 'users'
    userid = db.Column(db.String(100), primary_key=True)
    username = db.Column(db.String(45), nullable=False)
    uaids = db.Column(db.JSON, nullable=False)
    roblosecurity = db.Column(db.String(2000), unique=True, nullable=False)
    sessiontoken = db.Column(db.String(100), unique=True, nullable=False, primary_key=True)
    


class Item(db.Model):
    __tablename__ = 'items'
    uaid = db.Column(db.String(100), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    onHold = db.Column(db.Boolean)
    assetId = db.Column(db.String(100))
    inUse = db.Column(db.Boolean, nullable=False)
    rap = db.Column(db.Integer)
    ownerId = db.Column(db.String(100), primary_key=True, nullable=False)
    holdExpire = db.Column(db.DateTime)
    botid = db.Column(db.String(100))

class Deposit(db.Model):
    __tablename__ = 'depositsQueue'
    depositId = db.Column(db.Integer, primary_key=True)
    userId = db.Column(db.Integer, nullable=False)
    uaids = db.Column(db.JSON, nullable=False)
    botCookie = db.Column(db.String(2000), nullable=False)
    botuaid = db.Column(db.String(100))
    botid = db.Column(db.String(100))

class Trade(db.Model):
    __tablename__ = 'trades'
    tradeId = db.Column(db.String(100), primary_key=True)
    senderid = db.Column(db.String(100), nullable=False)
    recieverid = db.Column(db.String(100), nullable=False)
    senderuaids = db.Column(db.JSON, nullable=False)
    recieveruaids = db.Column(db.JSON)
    status = db.Column(db.String(45), nullable=False)
    sendername = db.Column(db.String(100), nullable=False)
    recievername = db.Column(db.String(100), nullable=False)
    date = db.Column(db.DateTime, default=datetime.now)

class Image(db.Model):
    __tablename__ = 'assetImages'
    assetid = db.Column(db.String(100), primary_key=True)
    url = db.Column(db.String(300), nullable=False)

CORS(app, origins=["http://127.0.0.1:5500"], supports_credentials=True)


def get2fa(userid):
    
    

    def get_hotp_token(secret, intervals_no):
        """This is where the magic happens."""
        key = base64.b32decode(normalize(secret), True) # True is to fold lower into uppercase
        msg = struct.pack(">Q", intervals_no)
        h = bytearray(hmac.new(key, msg, hashlib.sha1).digest())
        o = h[19] & 15
        h = str((struct.unpack(">I", h[o:o+4])[0] & 0x7fffffff) % 1000000)
        return prefix0(h)


    def get_totp_token(secret):
        """The TOTP token is just a HOTP token seeded with every 30 seconds."""
        return get_hotp_token(secret, intervals_no=int(time.time())//30)


    def normalize(key):
        """Normalizes secret by removing spaces and padding with = to a multiple of 8"""
        k2 = key.strip().replace(' ','')
        # k2 = k2.upper()	# skipped b/c b32decode has a foldcase argument
        if len(k2)%8 != 0:
            k2 += '='*(8-len(k2)%8)
        return k2


    def prefix0(h):
        """Prefixes code with leading zeros if missing."""
        if len(h) < 6:
            h = '0'*(6-len(h)) + h
        return h
    
    def main():
        rel = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
        with open(os.path.join(rel,'secrets.json'), 'r') as f:
            secrets = json.load(f)
            secrets = secrets[str(userid)]
        for label, key in sorted(list(secrets.items())):
            token = get_totp_token(key)
            print("{}:\t{}".format(label, token))
            return token
            


    if __name__ == "__main__":
        token = main()

        return token

#get2fa(367207514)
#exit()

def validate_token_and_get_user_info(session_token):
    user = User.query.filter_by(sessiontoken=session_token).first()
    if user is None:
        return None
    else:
        username = user.username
        userId = user.userid
        uaids = user.uaids
        items = Item.query.filter_by(ownerId=userId).all()
        rap = 0
        for x in items:
            rap += x.rap
        return {
            "username": username,
            "userId": userId,
            "uaids": uaids,
            "onSiteRap": rap
        }

def checkUser(info):
    user = User.query.filter_by(userid=info["id"]).first()
    sessiontoken = secrets.token_hex(40)
    if user is None:
        new_user = User(userid=str(info["id"]), username=info["username"], uaids={"uaids":[]}, roblosecurity=info["roblosecurity"], sessiontoken=sessiontoken)
        db.session.add(new_user)
    else:
        user.sessiontoken = sessiontoken
    db.session.commit()
    return sessiontoken






@app.route('/login', methods=['POST'])
@limiter.limit("10/minute")
def login():
    data = request.get_json()
    if not data or 'roblosecurity' not in data:
        return jsonify({"error": "Invalid input data"}), 400

    roblosec = data['roblosecurity']
    if not roblosec:
        return jsonify({"error": "Invalid input data"}), 400
    ip_address = request.remote_addr
    ip_address = "1.0.0.0"
    print(ip_address)
    location = requests.get(f"{regionUrl}{ip_address}")
    location = location.json()["country"]

    user = request.get_json()
    roblosec = user["roblosecurity"]
    s = requests.Session()
    s.cookies[".ROBLOSECURITY"] = roblosec
    authUrl = baseUsersUrl + "v1/users/authenticated"
    authreq = s.get(authUrl)
    if authreq.status_code == 200:
        userId = authreq.json()["id"]
        info = {
            "id": userId,
            "username": authreq.json()["name"],
            "roblosecurity": roblosec
        }
        
        session_token = checkUser(info)
        output = {
        "sessionToken": session_token,
        }
        print(f"Login - {info['username']}")
        

        # Set the expiration date to 30 years in the future
        expires = datetime.now()
        expires = expires + timedelta(days=30*365)
        response = make_response(jsonify(output), 200)
        response.set_cookie('sessionToken', session_token, httponly=False, samesite='Lax', secure=False, path='/', expires=expires)
        return response
    else:
        return jsonify({"error": "Invalid roblosecurity"}), 401

@app.route('/user', methods=['GET'])
@limiter.limit("60/minute")
def user():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    
    user_info = validate_token_and_get_user_info(session_token)

    if user_info is None:
        return jsonify({"error": "Invalid session token"}), 401

    return jsonify(user_info), 200

@app.route('/logout', methods=['GET'])
def logout():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return jsonify({"error": "No session token"}), 401
    user = User.query.filter_by(sessiontoken=session_token).first()
    if user is None:
        return jsonify({"error": "Invalid session token"}), 401
    user.sessiontoken = secrets.token_hex(40)
    db.session.commit()
    response = make_response(jsonify({"success": "Logged out"}), 200)
    response.set_cookie('sessionToken', '', httponly=False, samesite='Lax', secure=False, path='/', expires=0)
    return response

@app.route('/users', methods=['GET'])
@limiter.limit("60/minute")
def users():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    user_info = validate_token_and_get_user_info(session_token)
    if user_info is None:
        return jsonify({"error": "Invalid session token"}), 401
    users = User.query.all()
    if len(users) > 50:
        users = random.sample(users, 50)
    ret = []
    for x in users:
        items = Item.query.filter_by(ownerId=x.userid).all()
        rap = 0
        for y in items:
            rap += y.rap
        ret.append({
            "username": x.username,
            "userId": x.userid,
            "rap": rap
        })
    return jsonify(ret), 200


@app.route('/tradeinfo', methods=['POST'])
@limiter.limit("60/minute")
def tradeinfo():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
    userId = user_info["userId"]
    tradeId = request.get_json()["tradeId"]
    
    trade = Trade.query.filter_by(tradeId=tradeId).first()
    if trade is None:
        return jsonify({"error": "Invalid trade ID"}), 400
    if (str(trade.senderid) != str(userId)) and (str(trade.recieverid) != str(userId)):
        return jsonify({"error": "Not a member of the trade"}), 400
    

    senditems = []
    for x in trade.senderuaids:
        item = Item.query.filter_by(uaid=x).first()
        if item is None:
            return jsonify({"error": "Invalid item"}), 400
        image = Image.query.filter_by(assetid=item.assetId).first()
        senditems.append({
            "uaid": item.uaid,
            "name": item.name,
            "rap": item.rap,
            "inUse": item.inUse,
            "imageURL": image.url
        })
    receiveitems = []
    if trade.recieveruaids is not None:
        for x in trade.recieveruaids:
            item = Item.query.filter_by(uaid=x).first()
            image = Image.query.filter_by(assetid=item.assetId).first()
            receiveitems.append({
                "uaid": item.uaid,
                "name": item.name,
                "rap": item.rap,
                "inUse": item.inUse,
                "imageURL": image.url
            })
    img = Image.query.filter_by(assetid=trade.recieveruaids[0]).first()

    ret = {
        "tradeId": trade.tradeId,
        "senderId": trade.senderid,
        "receiverId": trade.recieverid,
        "status": trade.status,
        "date": trade.date,
        "senderName": trade.sendername,
        "receiverName": trade.recievername,
        "senderuaids": trade.senderuaids,
        "receiveruaids": trade.recieveruaids,
        "sendItems": senditems,
        "receiveItems": receiveitems
    }
    return jsonify(ret), 200
    
@app.route('/declinetrade', methods=['POST'])
@limiter.limit("60/minute")
def declinetrade():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
    userId = user_info["userId"]
    tradeId = request.get_json()["tradeId"]
    trade = Trade.query.filter_by(tradeId=tradeId).first()
    if trade is None:
        return jsonify({"error": "Invalid trade ID"}), 400
    if trade.recieverid != userId and trade.senderid != userId:
        return jsonify({"error": "You cant decline this trade"}), 400
    if trade.status != "active":
        return jsonify({"error": "Trade is not active"}), 400
    trade.status = "inactive"
    db.session.commit()
    return jsonify({"success": "Trade declined"}), 200

@app.route('/accepttrade', methods=['POST'])
@limiter.limit("60/minute")
def accepttrade():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
    userId = user_info["userId"]
    tradeId = request.get_json()["tradeId"]
    trade = Trade.query.filter_by(tradeId=tradeId).first()
    if trade is None:
        return jsonify({"error": "Invalid trade ID"}), 400
    if trade.recieverid != str(userId):
        return jsonify({"error": "You cant accept this trade"}), 400
    if trade.status != "active":
        return jsonify({"error": "Trade is not active"}), 400
    sender = User.query.filter_by(userid=trade.senderid).first()
    reciever = User.query.filter_by(userid=trade.recieverid).first()
    senderItems = Item.query.filter(Item.uaid.in_(trade.senderuaids), Item.ownerId == sender.userid).all()
    recieverItems = Item.query.filter(Item.uaid.in_(trade.recieveruaids), Item.ownerId == reciever.userid).all()
    if len(senderItems) != len(trade.senderuaids) or len(recieverItems) != len(trade.recieveruaids):
        trade.status = "inactive"
        db.session.commit()
        return jsonify({"error": "Rejected due to error"}), 400
    for x in senderItems:
        x.ownerId = reciever.userid
    for x in recieverItems:
        x.ownerId = sender.userid
    trade.status = "completed"
    db.session.commit()
    return jsonify({"success": "Trade accepted"}), 200
    


@app.route('/trades', methods=['GET'])
@limiter.limit("60/minute")
def trades():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
    userId = user_info["userId"]
    outbounds = Trade.query.filter_by(senderid=userId, status="active").all()
    outbound = []
    for x in outbounds:
        reciever = User.query.filter_by(userid=x.recieverid).first()
        outbound.append({
            "tradeId": x.tradeId,
            "reciever": reciever.username,
            "recieverId": reciever.userid,
            "date": x.date,
            "sender": user_info["username"],
            "senderId": userId,
            "showname": reciever.username
        })
    inbounds = Trade.query.filter_by(recieverid=userId, status='active').all()
    inbound = []
    for x in inbounds:
        sender = User.query.filter_by(userid=x.senderid).first()
        inbound.append({
            "tradeId": x.tradeId,
            "sender": sender.username,
            "senderId": sender.userid,
            "date": x.date,
            "reciever": user_info["username"],
            "recieverId": userId,
            "showname": sender.username
        })
    completeds = Trade.query.filter_by(senderid=userId, status="completed").all()
    c2 = (Trade.query.filter_by(recieverid=userId, status="completed").all())
    for x in c2:
        completeds.append(x)
    completed = []
    for x in completeds:
        sender = User.query.filter_by(userid=x.senderid).first()
        reciever = User.query.filter_by(userid=x.recieverid).first()
        if x.senderid == userId:
            showname = reciever.username
        else:
            showname = sender.username
        completed.append({
            "tradeId": x.tradeId,
            "sender": sender.username,
            "senderId": sender.userid,
            "reciever": reciever.username,
            "recieverId": reciever.userid,
            "date": x.date,
            "showname": showname
        })

    inactives = Trade.query.filter_by(senderid=userId, status="inactive").all()
    i2 = (Trade.query.filter_by(recieverid=userId, status="inactive").all())
    for x in i2:
        inactives.append(x)
    inactive = []
    for x in inactives:
        sender = User.query.filter_by(userid=x.senderid).first()
        reciever = User.query.filter_by(userid=x.recieverid).first()
        if x.senderid == userId:
            showname = reciever.username
        else:
            showname = sender.username
        inactive.append({
            "tradeId": x.tradeId,
            "sender": sender.username,
            "senderId": sender.userid,
            "reciever": reciever.username,
            "recieverId": reciever.userid,
            "date": x.date,
            "showname": showname
        })
    rval = {
        "outbound":outbound,
        "inbound":inbound,
        "completed":completed,
        "inactive":inactive
    }
    print(rval)
    return jsonify(rval), 200



@app.route('/createtrade', methods=['POST'])
@limiter.limit("60/minute")
def createtrade():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
    send = request.get_json()["offer"]
    recieve = request.get_json()["recieve"]
    targetid = request.get_json()["targetId"]
    if user_info["userId"] == targetid:
        return jsonify({"error": "You cannot trade with yourself"}), 400
    if len(send) < 1 or len(recieve) < 1:
        return jsonify({"error": "Too few items"}), 400
    if len(send) > 4 or len(recieve) > 4:
        return jsonify({"error": "Too many items"}), 400
    for b in send:
        x = b["uaid"]
        item = Item.query.filter_by(uaid=x).first()
        if item is None:
            return jsonify({"error": "Invalid item - Not in system"}), 400
        if item.ownerId != str(user_info["userId"]):
            return jsonify({"error": "Invalid item - Dont own"}), 400
    for b in recieve:
        x = b["uaid"]
        item = Item.query.filter_by(uaid=x).first()
        if item is None:
            return jsonify({"error": "Invalid item - Not in system"}), 400
        if item.ownerId != str(targetid):
            return jsonify({"error": "Invalid item - They dont own"}), 400
    tradeId = secrets.token_hex(20)
    recieveruaids = [x["uaid"] for x in recieve]
    senderuaids = [x["uaid"] for x in send]
    reciever = User.query.filter_by(userid=targetid).first()

    # Check for duplicates within recieveruaids and senderuaids
    if len(recieveruaids) != len(set(recieveruaids)) or len(senderuaids) != len(set(senderuaids)):
        return jsonify({"error": "Duplicate items in trade"}), 400
    # Fetch all trades involving the same sender and receiver
    existing_trades = Trade.query.filter_by(senderid=user_info["userId"], recieverid=targetid, status="active").all()

    # Check each trade to see if it's a duplicate
    for trade in existing_trades:
        # Sort the items in the trade and the request to ensure a correct comparison
        if sorted(trade.senderuaids) == sorted(senderuaids) and sorted(trade.recieveruaids) == sorted(recieveruaids):
            return jsonify({"error": "Trade already exists"}), 400

    # If no duplicate trade was found, proceed with creating the new trade
    new_trade = Trade(tradeId=tradeId, senderid=user_info["userId"], recieverid=targetid, senderuaids=senderuaids, recieveruaids=recieveruaids, status="active", sendername=user_info["username"], recievername=reciever.username, date=datetime.now())
    db.session.add(new_trade)
    db.session.commit()
    return jsonify({"tradeId": tradeId}), 200

def findDepoBot(iters):
    # Open the file and read the lines
            if iters > 5:
                return None
            with open('cookies.txt', 'r') as f:
                lines = f.readlines()

            # Choose a random line (cookie)
            random_cookie = random.choice(lines).strip()

            # Use the random cookie
            s = requests.Session()
            s.cookies[".ROBLOSECURITY"] = random_cookie
            authUrl = baseUsersUrl + "v1/users/authenticated"
            authreq = s.get(authUrl)
            if authreq.status_code != 200:
                print("Bot cookie didn't work")
                findDepoBot(iters+1)
            else:
                botId = authreq.json()["id"]
                print("Bot authenticated - " + str(botId))
                botUsername = authreq.json()["name"]
                info = {
                    "username": botUsername,
                    "userId": botId,
                    "cookie": random_cookie
                }
                itemsUrl = f"https://inventory.roblox.com/v1/users/{botId}/assets/collectibles"
                itemsreq = s.get(itemsUrl)
                if itemsreq.status_code != 200:
                    findDepoBot(iters+1)
                botitems = itemsreq.json()["data"]
                # Filter out items where "onHold" is True
                botitems = [item for item in botitems if not item["isOnHold"]]
                botitems = [item for item in botitems if item["recentAveragePrice"] < 200]
                print(botitems)
                if len(botitems) < 1:
                    print("No items")
                    findDepoBot(iters+1)
                else:
                    small = random.choice(botitems)
                    info["item"] = small
                    return info


@app.route('/initdepo', methods=['POST'])
@limiter.limit("5/minute")
def initdepo():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
        elif len(request.get_json()) > 4:
            return jsonify({"error": "Too many items"}), 400
        elif len(request.get_json()) < 1:
            return jsonify({"error": "Too few items"}), 400

        else:
            userId = user_info["userId"]
            print("Initiating deposit - " + str(user_info["username"]) + " - " + str(userId))
            items = request.get_json()
            print(items)
            # Check if user has the items and assign a holder to the items
            roblosecurity = User.query.filter_by(userid=userId).first().roblosecurity
            s = requests.Session()
            #s.cookies[".ROBLOSECURITY"] = roblosecurity
            itemsUrl = f"https://inventory.roblox.com/v1/users/{userId}/assets/collectibles"
            itemsreq = s.get(itemsUrl)
            if itemsreq.status_code != 200:
                return jsonify({"error": "Failed to get your items"}), 500
            userItems = itemsreq.json()["data"]
            userItems = [item for item in userItems if not item["isOnHold"]]
            print(userItems)
            userItems = [item for item in userItems if item["recentAveragePrice"] > 200]
            userAssetIds = [item['userAssetId'] for item in userItems]
            # Create a new list of items with the name included
            items_with_name = []
            for item in items:
                # Find the item in userItems with the same userAssetId
                user_item = next((i for i in userItems if i['userAssetId'] == item['uaid']), None)
                if user_item is not None:
                    # Add the item to items_with_name with the name included
                    items_with_name.append({ 'uaid': item['uaid'], 'assetId': item['assetId'], 'name': user_item['name'] })
                else:
                    return jsonify({"error": "User does not have the item(s)"}), 400
            items = items_with_name
            botInfo = findDepoBot(0)
            if botInfo is None:
                return jsonify({"error": "No bots available"}), 500
            uaids = [item["uaid"] for item in items]
            depoId = secrets.token_hex(20)
            new_deposit = Deposit(userId=userId, uaids=uaids, botCookie=botInfo["cookie"], depositId=depoId, botuaid=botInfo["item"]["userAssetId"], botid=botInfo["userId"])
            db.session.add(new_deposit)
            db.session.commit()
            tradeInfo = {
                "sendItems": items,
                "receiveItem": [botInfo["item"]],
                "botUsername": botInfo["username"],
                "botId": botInfo["userId"],
                "depoId": depoId
            }
            print(tradeInfo["receiveItem"])
            tradeInfo["receiveItem"] = tradeInfo["receiveItem"][0]
            botItem = Item.query.filter_by(uaid=tradeInfo["receiveItem"]["userAssetId"]).first()
            if botItem is None:
                new_item = Item(uaid=tradeInfo["receiveItem"]["userAssetId"], name=tradeInfo["receiveItem"]["name"], onHold=False, assetId=tradeInfo["receiveItem"]["assetId"], inUse=True, rap=tradeInfo["receiveItem"]["recentAveragePrice"], ownerId=tradeInfo["botId"], holdExpire=None)
                db.session.add(new_item)
            else:
                botItem.inUse = True
            db.session.commit()
            return jsonify(tradeInfo), 200




@app.route('/confirm', methods=['POST'])
@limiter.limit("3/minute")
def confirm():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
    depoId = request.get_json()["depoId"]
    depo = Deposit.query.filter_by(depositId=depoId).first()
    if depo is None:
        return jsonify({"error": "Invalid deposit ID"}), 400
    userId = depo.userId
    roblosecurity = depo.botCookie
    s = requests.Session()
    s.cookies[".ROBLOSECURITY"] = roblosecurity
    s.headers["Referer"] = "https://www.roblox.com/"
    tradeUrl = "https://trades.roblox.com/v1/trades/inbound?cursor=&limit=100&sortOrder=Desc"
    tradesReq = s.get(tradeUrl)
    if tradesReq.status_code != 200:
        print(tradesReq.text)
        return jsonify({"error": "Failed to get bot trades"}), 500
    trades = tradesReq.json()["data"]
    tradeIds = []
    message = None
    for x in trades:
        if str(x["user"]["id"]) == depo.userId:
            tradeIds.append(x["id"])
    for tradeId in tradeIds:
        if tradeId is None:
            return jsonify({"error": "Bot trade not found"}), 500
        tradeUrl = f"https://trades.roblox.com/v1/trades/{tradeId}"
        tradeReq = s.get(tradeUrl)
        if tradeReq.status_code != 200:
            message = {"error": "Failed to get bot trade"}
            continue
        trade = tradeReq.json()
        if trade["isActive"] == False:
            message = {"error": "Trade is not active"}
            continue
        if trade["status"] != "Open":
            message = {"error": "Trade is not open"}
        offers = trade["offers"]
        them = [x for x in offers if str(x["user"]["id"]) == depo.userId]
        me = [x for x in offers if str(x["user"]["id"]) != depo.userId]
        me = me[0]
        them = them[0]
        for x in me["userAssets"]:
            if x["id"] != depo.botuaid:
                message = {"error": "Invalid bot offer"}
                continue
        for x in them["userAssets"]:
            if x["id"] not in depo.uaids:
                message = {"error": "Invalid user offer"}
                continue
        if len(me["userAssets"]) != 1:
            message = {"error": "Invalid bot offer"}
            continue
        if len(them["userAssets"]) != len(depo.uaids):
            message = {"error": "Invalid user offer"}
            continue
        url = f"https://trades.roblox.com/v1/trades/{tradeId}/accept"
        acceptReq = s.post(url)
        if acceptReq.status_code != 200:
            print(acceptReq.text)
            message = {"error": "Failed to accept trade"}
            csrf = acceptReq.headers["x-csrf-token"]
            s.headers["x-csrf-token"] = csrf
            url = f"https://trades.roblox.com/v1/trades/{tradeId}/accept"
            acceptReq = s.post(url)
            if("Challenge" in acceptReq.text):
                meta = acceptReq.headers["Rblx-Challenge-Metadata"]
                challengeid = acceptReq.headers["Rblx-Challenge-Id"]
                code = get2fa(depo.botid)
                datas = {
                    "challengeId": challengeid,
                    "actionType": "Generic",
                    "code": code
                }
                verUrl = f"https://twostepverification.roblox.com/v1/users/{depo.botid}/challenges/authenticator/verify"
                verReq = s.post(verUrl, json=datas)
                print(verReq.text)
                if verReq.status_code == 200:
                    s.headers["Rblx-Challenge-Id"] = challengeid
                    s.headers["Rblx-Challenge-Metadata"] = meta
                    s.headers["Rblx-Challenge-Type"] = "twostepverification"
                    acceptReq = s.post(url)
                    print(acceptReq.text)
                    if acceptReq.status_code != 200:
                        message = {"error": "Failed to accept trade"}
                        continue
                    
        
        botItem = Item.query.filter_by(uaid=depo.botuaid).first()
        if acceptReq.status_code == 200:
            for x in them["userAssets"]:
                existing_item = Item.query.filter_by(uaid=x["id"]).first()
                if existing_item is None:
                    new_item = Item(uaid=x["id"], name=x["name"], onHold=True, assetId=x["assetId"], inUse=False, rap=x["recentAveragePrice"], ownerId=them["user"]["id"], holdExpire=datetime.now() + timedelta(days=2), botid=depo.botid)
                    db.session.add(new_item)
                else:
                    existing_item.ownerId = them["user"]["id"]
            db.session.delete(depo)
            db.session.delete(botItem)
            db.session.commit()
        
            return jsonify({"success": "Trade accepted"}), 200
    botItem = Item.query.filter_by(uaid=depo.botuaid).first()
    botItem.inUse = False
    db.session.delete(depo)
    db.session.commit()
    return jsonify(message), 400

@app.route('/cancel', methods=['POST'])
@limiter.limit("60/minute")
def cancel():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    
    user_info = validate_token_and_get_user_info(session_token)
    if user_info is None:
        return jsonify({"error": "Invalid session token"}), 401
    depoId = request.get_json()["depoId"]
    depo = Deposit.query.filter_by(depositId=depoId).first()
    if depo is None:
        return jsonify({"error": "Invalid deposit ID"}), 400
    db.session.delete(depo)
    botItem = Item.query.filter_by(uaid=depo.botuaid).first()
    botItem.inUse = False
    db.session.commit()
    return jsonify({"success": "Deposit cancelled"}), 200



@app.route('/itemsfortrade', methods=['POST'])
@limiter.limit("60/minute")
def itemsfortrade():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    
    user_info = validate_token_and_get_user_info(session_token)
    if user_info is None:
        return jsonify({"error": "Invalid session token"}), 401
    username = request.get_json()["username"]
    username = username.lower()
    user = User.query.filter_by(username=username).first()
    if user is None:
        return jsonify({"error": "Invalid user"}), 400
    userId = user.userid
    items = Item.query.filter_by(ownerId=userId).all()
   
    
    ret = []
    for x in items:
        image = Image.query.filter_by(assetid=x.assetId).first()
        ret.append({
            "uaid": x.uaid,
            "name": x.name,
            "assetId":x.assetId,
            "rap": x.rap,
            "imageURL": image.url
        })
    ret = {
        "data": ret,
        "targetId": user.userid
    }
    return jsonify(ret), 200





@app.route('/items', methods=['GET'])
@limiter.limit("5/minute")
def items():
    session_token = request.cookies.get('sessionToken')
    if session_token is None:
        return "No session token", 401
    else:
        user_info = validate_token_and_get_user_info(session_token)
        if user_info is None:
            return jsonify({"error": "Invalid session token"}), 401
        else:
            userId = user_info["userId"]
            print("Getting items - " + str(user_info["username"]) + " - " + str(userId))
            roblosecurity = User.query.filter_by(userid=userId).first().roblosecurity
            s = requests.Session()
            #s.cookies[".ROBLOSECURITY"] = roblosecurity
            itemsUrl = f"https://inventory.roblox.com/v1/users/{userId}/assets/collectibles"
            itemsreq = s.get(itemsUrl)
            if itemsreq.status_code != 200:
                return jsonify({"error": "Failed to get items"}), 500
            items = itemsreq.json()["data"]
            # Filter out items where "onHold" is True
            items = [item for item in items if not item["isOnHold"] and item["recentAveragePrice"] > 200]
            url = "https://thumbnails.roblox.com/v1/assets"
            assetIds = []
            datas = []
            for img in items:
                assetIds = [(img["assetId"])]
                req = requests.get(url, params={"assetIds": assetIds,"format": "Png","isCircular": "false","size": "420x420"})
                req_data = req.json()["data"]
                datas.append(req_data[0])
                image = Image.query.filter_by(assetid=img["assetId"]).first()
                if image is None:
                    new_image = Image(assetid=img["assetId"], url=req_data[0]["imageUrl"])
                    db.session.add(new_image)
                    db.session.commit()
            for i in range(len(items)):
                if i < len(datas):
                    items[i]["imageURL"] = datas[i]["imageUrl"]
                else:
                    items[i]["imageURL"] = None  # or some default image URL
            return jsonify(items), 200
        
    



from sqlalchemy import text



def update_database():
    with app.app_context():
        while True:
            print("Updating database RAP")
            sql = text("""
            SELECT *
            FROM items
            WHERE uaid IN (
                SELECT MIN(uaid)
                FROM items
                GROUP BY assetId
            )
            """)
            items = db.session.execute(sql)
            
            for x in items:
                assetId = x.assetId
                url = f"https://economy.roblox.com/v1/assets/{assetId}/resale-data"
                req = requests.get(url)
                if req.status_code == 200:
                    data = req.json()
                    if "recentAveragePrice" in data:
                        rap = data["recentAveragePrice"]
                        items = Item.query.filter_by(assetId=assetId).all()
                        for y in items:
                            y.rap = rap
                        db.session.commit()
                        print(f"Updated {assetId} to {rap}")
                else:
                    print(req.text)
                time.sleep(2)
            time.sleep(30)  # Sleep for 30 seconds

if __name__ == '__main__':
    # Only start the update_database function in the main process
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        update_thread = threading.Thread(target=update_database)
        update_thread.start()

    def start():
        try:
            app.run(debug=True)
        except Exception as e:
            print(e)
            start()
    start()


