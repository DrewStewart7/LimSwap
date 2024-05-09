document.addEventListener('DOMContentLoaded', function() {

    // Add event listeners to the buttons
    
    tradeButton.addEventListener('click', function(event) {
        if (!isAuthCookieValid()) {
            event.preventDefault();
            showLoginModal();
        }
    });
    profileButton.addEventListener('click', function(event) {
        if (!isAuthCookieValid()) {
            event.preventDefault();
            showLoginModal();
        }
    });
    
});

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
                uaids: data.uaids,
                rap: data.onSiteRap
            };
        }
    })
    .catch(error => {
        // Handle the error
        console.error(error);
        return null;
    });
}

document.getElementById('logout-button').addEventListener('click', function() {
    fetch('http://127.0.0.1:5000/logout', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        window.location.href = 'http://127.0.0.1:5500/frontend/index.html';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});



function fetchItemsForTrade(username) {
    fetch('http://127.0.0.1:5000/itemsfortrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({username: username})
    })
    .then(response => response.json())
    .then(data => {
        const itemsContent = document.getElementById('items-content');
        data.data.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <img src="${item.imageURL}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p>RAP: ${item.rap}</p>
            `;
            itemsContent.appendChild(itemDiv);
        });
        $(".item h3, .item p").fitText();
    });
}


getUserInfo().then(userInfo => {
    if (userInfo) {
        console.log(`Username: ${userInfo.username}`);
        console.log(`User ID: ${userInfo.userId}`);
        // Set the rapLabel to the value of userInfo.rap
        document.getElementById('rapLabel').textContent = 'LimSwap RAP: ' + userInfo.rap;
        document.getElementById('usernameLabel').textContent = 'Username: ' + userInfo.username;
        document.getElementById('idLabel').textContent = 'User ID: ' + userInfo.userId;
        let usdval = ((userInfo.rap/1000) * 3.5).toFixed(2);
        document.getElementById('usdLabel').textContent = 'USD Equivalent: $' + usdval;
        fetchItemsForTrade(userInfo.username);
        
    }
});



document.getElementById('new-trade-button').addEventListener('click', function() {
    window.location.href = 'maketrade.html';
});

document.getElementById('view-trades-button').addEventListener('click', function() {
    window.location.href = 'trade.html';
});