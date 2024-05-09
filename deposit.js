

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

document.getElementById('logout').addEventListener('click', function() {
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


let successMessage = document.getElementById('success-message');
let depositList = [];
function getItems() {
    const itemsEndpoint = `http://127.0.0.1:5000/items`;

    return fetch(itemsEndpoint, {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const itemsContainer = document.getElementById('items-container');
        const selectedItemsContainer = document.getElementById('selected-items-container');
        // Set the flex-direction property to row-reverse
        selectedItemsContainer.style.flexDirection = 'row-reverse';
        
        return Promise.all(data.map(item => {
            const itemDiv = document.createElement('div');
            const itemImg = document.createElement('img');
            const itemName = document.createElement('p');

            // Add styles to itemDiv
            itemDiv.style.display = 'flex'; // Use Flexbox
            itemDiv.style.flexDirection = 'column'; // Stack the children vertically
            itemDiv.style.justifyContent = 'space-between'; // Distribute space evenly between the children
            itemDiv.style.width = '20%'; // 100% / 4 items = 25% per item
            itemDiv.style.height = '200px'; // Set a fixed height
            itemDiv.style.boxSizing = 'border-box'; // Include padding and border in element's total width and height
            itemDiv.style.padding = '10px'; // Add some padding
            itemDiv.style.background = '#204a75'; // Set a background color
            itemDiv.style.margin = '1%'; // Add some margin
            itemDiv.style.borderRadius = '12px'; // Add a border radius
            itemDiv.style.cursor = 'pointer'; // Change the cursor to a pointer when hovering over the itemDiv

            // Add styles to itemImg
            itemImg.style.maxWidth = '100%'; // Limit the width of the image to the width of the itemDiv
            itemImg.style.maxHeight = '70%'; // Limit the height of the image to 70% of the height of the itemDiv

            // Add styles to itemName
            itemName.style.maxWidth = '100%'; // Limit the width of the itemName to the width of the itemDiv
            itemName.style.overflow = 'hidden'; // Hide any text that doesn't fit within the boundaries of the itemName
            itemName.style.textOverflow = 'ellipsis'; // Add an ellipsis (...) when the text overflows
            itemName.style.whiteSpace = 'nowrap'; // Prevent the text from wrapping onto the next line


            itemName.textContent = item.name;
            itemDiv.title = item.name;
            itemImg.src = item.imageURL; // Set the src attribute to the imageURL property of the item
            itemDiv.appendChild(itemImg);
            itemDiv.appendChild(itemName);
            itemsContainer.appendChild(itemDiv);
            

            // Add an event listener to itemDiv
            itemDiv.addEventListener('click', () => {
                if (itemsContainer.contains(itemDiv)) {
                    // Check if depositList length is less than 4
                    if (depositList.length < 4) {
                        // Move itemDiv to selectedItemsContainer
                        itemsContainer.removeChild(itemDiv);
                        selectedItemsContainer.appendChild(itemDiv); // Use appendChild instead of prepend
                        // Add item to depositList
                        depositList.push({ uaid: item.userAssetId, assetId: item.assetId });
                    } else {
                        alert('You can only deposit a maximum of 4 items at once.');
                    }
                } else {
                    // Move itemDiv back to itemsContainer
                    selectedItemsContainer.removeChild(itemDiv);
                    itemsContainer.appendChild(itemDiv);

                    // Remove item from depositList
                    depositList = depositList.filter(i => i.uaid !== item.userAssetId);
                }
            });
        }));
    })
    .catch(error => console.error('Error:', error));
}

// Get the Deposit button
const depositButton = document.getElementById('deposit-button');

// Get the modal and the close button
let modal = document.getElementById('modal');

let depoId = null;
document.getElementById('confirm-button').addEventListener('click', function() {
    fetch('http://127.0.0.1:5000/confirm', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            depoId: depoId
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        successMessage.style.backgroundColor = '#64ff73';
        successMessage.textContent = 'Trade successfully declined';
        successMessage.style.display = 'block';
        setTimeout(() => {
            console.log('Hiding message');
            successMessage.style.display = 'none';
            location.reload()
        }, 3000);
    })
    .catch((error) => {
        console.error('Error:', error);
        successMessage.style.backgroundColor = 'red';
        successMessage.textContent = 'Failed to decline trade';
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
            location.reload()
        }, 3000);
    });
});


document.getElementById('cancel-button').addEventListener('click', function() {
    fetch('http://127.0.0.1:5000/cancel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            depoId: depoId
        }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Close the modal
        document.getElementById('modal').style.display = 'none';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

// Add an event listener to the Deposit button
depositButton.addEventListener('click', () => {
    // Send a POST request with the depositList
    fetch('http://127.0.0.1:5000/initdepo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositList),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        // Open the modal with the desired message
        let sendItemsList = data.sendItems.map(item => `<li>${item.name}</li>`).join("");
        let modalContent = `
            <p>Please send these items to <a href="https://www.roblox.com/users/${data.botId}/trade" target="_blank">${data.botUsername}</a> - ID: ${data.botId}:</p>
            <ul>${sendItemsList}</ul>
            <p>Request in return from the bot: ${data.receiveItem.name}</p>
        `;
        // Set the modal content
        document.getElementById('modal-text').innerHTML = modalContent;
        // Display the modal
        modal.style.display = 'block';
        depoId = data.depoId;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


getUserInfo().then(userInfo => {
    if (userInfo) {
        console.log(`Username: ${userInfo.username}`);
        console.log(`User ID: ${userInfo.userId}`);
        getItems()
    }
});