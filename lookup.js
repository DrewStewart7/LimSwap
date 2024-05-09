
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



let username = ''

document.getElementById('userSearchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const username = document.getElementById('username').value;

    fetch('http://127.0.0.1:5000/itemsfortrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username }),
        credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            // Clear the previous user information and items
            document.getElementById('userInfo').innerHTML = '<h2>User Information</h2>';
            document.getElementById('userItems').innerHTML = '<h2>User Items</h2>';

            // Add the new user information
            const userInfo = document.createElement('p');
            userInfo.textContent = `User ID: ${data.targetId}`;
            document.getElementById('userInfo').appendChild(userInfo);

            // Add the new user items
            const itemsContainer = document.createElement('div');
            itemsContainer.id = 'itemsContainer';

            // Calculate the total user RAP
            const totalRAP = data.data.reduce((total, item) => total + item.rap, 0);

            // Add the total user RAP to the user information
            const totalRAPElement = document.createElement('p');
            totalRAPElement.textContent = `Total RAP: ${totalRAP}`;
            document.getElementById('userInfo').appendChild(totalRAPElement);

            // Add a button to trade with the user
            const tradeButton = document.createElement('button');
            tradeButton.textContent = `Trade with ${username}`;
            tradeButton.onclick = function() {
                window.location.href = ('http://127.0.0.1:5500/frontend/maketrade.html?username=' + username);
                //window.open('http://127.0.0.1:5500/frontend/maketrade.html?username=' + username, '_blank');
            };
            tradeButton.style.backgroundColor = '#4CAF50'; // Green background
            tradeButton.style.border = 'none'; // No border
            tradeButton.style.color = 'white'; // White text
            tradeButton.style.padding = '15px 32px'; // Padding
            tradeButton.style.textAlign = 'center'; // Centered text
            tradeButton.style.textDecoration = 'none'; // No underline
            tradeButton.style.display = 'inline-block';
            tradeButton.style.fontSize = '16px'; // Text size
            tradeButton.style.margin = '4px 2px'; // Margin
            tradeButton.style.cursor = 'pointer'; // Cursor style
            tradeButton.style.borderRadius = '10px'; // Rounded corners
            document.getElementById('userInfo').appendChild(tradeButton);

            data.data.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.innerHTML = `
                    <img src="${item.imageURL}" alt="${item.name}">
                    <p>Name: ${item.name}</p>
                    <p>User Asset ID: ${item.uaid}</p>
                    <p>RAP: ${item.rap}</p>
                `;
                itemsContainer.appendChild(itemElement);
            });
            document.getElementById('userItems').appendChild(itemsContainer);
        })
        .catch(error => console.error('Error:', error));
        });

        getUserInfo().then(userInfo => {
            if (userInfo) {
                console.log(`Username: ${userInfo.username}`);
                console.log(`User ID: ${userInfo.userId}`);
                username = userInfo.username;
                // Set the rapLabel to the value of userInfo.rap
            }
        });


let params = new URLSearchParams(window.location.search);
let partnerName = params.get('username');
if (partnerName != null) {
    let form = document.getElementById('userSearchForm');
    let input = form.querySelector('input'); // Replace with the actual selector for your input field

    input.value = partnerName;
    let event = new Event('submit', { cancelable: true });
    form.dispatchEvent(event);
} 