




function getUserInfo() {
    // Send a request to the user info endpoint
    return fetch('http://127.0.0.1:5000/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            // If the response status is not ok (e.g., 401 Unauthorized), redirect the user
            window.location.href = 'http://127.0.0.1:5500/frontend/index.html';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data && data.error) {
            // Handle the error
            console.error(data.error);
            return null;
        } else if (data) {
            // Return the user info
            return {
                username: data.username,
                userId: data.userId,
                uaids: data.uaids
            };
        }
    })
    .catch(error => {
        // Handle the error
        console.error(error);
        return null;
    });
}
    
async function getTrades() {
    // Send a request to the trades endpoint
    return fetch('http://127.0.0.1:5000/trades', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data && data.error) {
            // Handle the error
            console.error(data.error);
            return null;
        } else if (data) {
            return {
                outbound: data.outbound,
                inbound: data.inbound,
                inactive: data.inactive,
                completed: data.completed
            };
        }
    })
    .catch(error => {
        // Handle the error
        console.error(error);
        return null;
    });
}

let myid = null
    
    getUserInfo().then(userInfo => {
        if (userInfo) {
            console.log(`Username: ${userInfo.username}`);
            console.log(`User ID: ${userInfo.userId}`);
            myid = userInfo.userId
        }
    });
let trades = {};

async function fetchTradesAndTriggerChange() {
    let tradesinfo = await getTrades();
    if (tradesinfo) {
        trades = tradesinfo;
        
    }
}

document.addEventListener('DOMContentLoaded', fetchTradesAndTriggerChange);



let tradeId2 = null;
document.getElementById('trade-status-selector').addEventListener('change', function() {
    // Get the selected category
    var selectedCategory = this.value.toLowerCase();
    var acceptBtn = document.getElementById('accept-button');
    var declineBtn = document.getElementById('decline-button');
    var counterBtn = document.getElementById('counter-button');
    if (selectedCategory === 'inbound') {
        acceptBtn.style.display = 'block';
        declineBtn.style.display = 'block';
        counterBtn.style.display = 'block';
    } else if (selectedCategory === 'outbound') {
        declineBtn.style.display = 'block';
        counterBtn.style.display = 'block';
        acceptBtn.style.display = 'none';
    } else {
        acceptBtn.style.display = 'none';
        declineBtn.style.display = 'none';
        counterBtn.style.display = 'none';
    }
    // Get the array of trades for the selected category
    var tradesArray = trades[selectedCategory];
    var rightContainer = document.querySelector('#right-container');
    rightContainer.style.display = 'none';
    // Sort the trades by date in descending order
    tradesArray.sort(function(a, b) {
        return Date.parse(b.date) - Date.parse(a.date);
    });

    // Get the container where the trades will be displayed
    var tradeContainer = document.getElementById('tradeList');

    // Clear the container
    tradeContainer.innerHTML = '';

    // Loop through the array of sorted trades
    tradesArray.forEach(function(trade) {
        // Create a new div element for the trade
        var tradeDiv = document.createElement('div');
        tradeDiv.className = 'trade-notification';

        // Add the tradeid attribute to the div
        tradeDiv.setAttribute('tradeId', trade.tradeId);

        // Create a Date object from the date string
        var date = new Date(trade.date);

        // Create HTML for the trade data
        var tradeHTML = `
            <span class="username">${trade.showname}</span>
            <span class="username">${date.toLocaleString()}</span>
        `;

        // Set the innerHTML of the div to the trade data
        tradeDiv.innerHTML = tradeHTML;

        // Add an event listener to the div
        tradeDiv.addEventListener('click', function() {
            // Get the tradeId from the div
            var tradeId = this.getAttribute('tradeId');
            tradeId2 = tradeId
            // Send a POST request to the tradeinfo endpoint
            fetch('http://127.0.0.1:5000/tradeinfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tradeId: tradeId }),
                credentials: 'include'
            })
                .then(function(response) {
                    // Check if the request was successful
                    if (!response.ok) {
                        throw new Error('HTTP error ' + response.status);
                    }

                    // Parse the response as JSON
                    return response.json();
                })
                // ...
                .then(function(trade) {
                    // Get the right-container element
              

                     
                    // Make the right-container visible and wider
                    rightContainer.style.display = 'block';
                    rightContainer.style.width = '60%'; // Adjust this value as needed
                    var tinfo = document.querySelector('.tradeInfo');
                    // Get the items-give and items-receive divs
                    var itemsGiveDiv = rightContainer.querySelector('.items-give');
                    var itemsReceiveDiv = rightContainer.querySelector('.items-receive');

                    // Get the first empty-box element as a template
                    var templateDiv = rightContainer.querySelector('.empty-box');
                    var titleheading = document.querySelector('#partnerName');
                    if (myid.toString() === trade.senderId) {
                        titleheading.innerHTML = 'Trade with: ' + trade.receiverName;
                    }
                    else {
                        titleheading.innerHTML = 'Trade with: ' + trade.senderName;
                    }

                    tinfo.prepend(titleheading);
                    // Clear the divs
                    itemsGiveDiv.innerHTML = '';
                    itemsReceiveDiv.innerHTML = '';
                    let giveRap = 0;
                    let receiveRap = 0;
                    // Populate the items-give div with the items the user gives
                    trade.sendItems.forEach(function(item) {
                        
                        var itemDiv = templateDiv.cloneNode(true);
                        itemDiv.innerHTML = `
                            <img id="itemImage" src="${item.imageURL}" alt="${item.name}">
                            <span id ="itemRap">${item.rap}</span>
                            <span>${item.name}</span>
                        `;
                        if (myid.toString() === trade.senderId) {
                            itemsGiveDiv.appendChild(itemDiv);
                            giveRap += item.rap;
                        } else {
                            itemsReceiveDiv.appendChild(itemDiv);
                            receiveRap += item.rap;
                        }
                    });

                    // Populate the items-receive div with the items the user receives
                    trade.receiveItems.forEach(function(item) {
                        
                        var itemDiv = templateDiv.cloneNode(true);
                        itemDiv.innerHTML = `
                        <img id="itemImage" src="${item.imageURL}" alt="${item.name}">
                        <span id ="itemRap">${item.rap}</span>
                        <span>${item.name}</span>
                        `;
                        if (myid.toString() === trade.receiverId) {
                            itemsGiveDiv.appendChild(itemDiv);
                            giveRap += item.rap;
                        } else {
                            itemsReceiveDiv.appendChild(itemDiv);
                            receiveRap += item.rap;
                        }
                    });
                    document.getElementById('giveTitle').innerHTML = "You give - RAP: " + giveRap;
                    document.getElementById('recieveTitle').innerHTML = "You receive - RAP: " + receiveRap;
                })
                    
                .catch(function(error) {
                    console.error('Failed to fetch trade information:', error);
                });
        });
        // Add the div to the container
        tradeContainer.appendChild(tradeDiv);
    });
});

window.onload = function() {
    
};
let successMessage = document.getElementById('success-message');
document.getElementById('decline-button').addEventListener('click', function() {
    // Get the tradeId from the selected trade
    if (!tradeId2) {
        console.error('No trade selected');
        return;
    }

    // Send a POST request to the decline endpoint
    fetch('http://127.0.0.1:5000/declinetrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeId: tradeId2 }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // if the trade was declined successfully, show success message
        console.log('Response is OK');
        successMessage.style.backgroundColor = '#64ff73';
        successMessage.textContent = 'Trade successfully declined';
        successMessage.style.display = 'block';
        setTimeout(() => {
            console.log('Hiding message');
            successMessage.style.display = 'none';
            location.reload()
        }, 500);
    })
    .catch(error => {
        // Handle the error
        console.error('Error:', error);
        successMessage.style.backgroundColor = 'red';
        successMessage.textContent = 'Failed to decline trade';
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
            location.reload()
        }, 2000);
    });
});

document.getElementById('counter-button').addEventListener('click', function() {
    // Get the tradeId from the selected trade
    if (!tradeId2) {
        console.error('No trade selected');
        return;
    }

    // Send a POST request to the counter endpoint
    fetch('http://127.0.0.1:5000/declinetrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeId: tradeId2 }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle the response
        var titleheading = document.querySelector('#partnerName').textContent;
        let username = titleheading.split(': ')[1];
        let url = 'http://127.0.0.1:5500/frontend/maketrade.html?username=' + username;
        window.location.href = url;
    })
    .catch(error => {
        // Handle the error
        console.error('Error:', error);
        successMessage.style.backgroundColor = 'red';
        successMessage.textContent = 'Failed to counter trade';
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
            location.reload()
        }, 2000);
    });
});

document.getElementById('accept-button').addEventListener('click', function() {
    // Get the tradeId from the selected trade
    if (!tradeId2) {
        console.error('No trade selected');
        return;
    }

    // Send a POST request to the accept endpoint
    fetch('http://127.0.0.1:5000/accepttrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeId: tradeId2 }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Handle the response
        console.log('Response is OK');
        successMessage.style.backgroundColor = '#64ff73';
        successMessage.textContent = 'Trade successfully accepted';
        successMessage.style.display = 'block';
        setTimeout(() => {
            console.log('Hiding message');
            successMessage.style.display = 'none';
            location.reload()
        }, 2000);
    })
    .catch(error => {
        // Handle the error
        console.error('Error:', error);
        successMessage.style.backgroundColor = 'red';
        successMessage.textContent = 'Trade failed to accept';
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
            location.reload()
        }, 2000);
    });
});

document.getElementById('new-trade-button').addEventListener('click', function() {
    window.location.href = 'maketrade.html';
});