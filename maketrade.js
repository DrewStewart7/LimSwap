

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

let myOffer = [];
let theirOffer = [];
let targetId = null;
function getItems(myusername) {
    const itemsEndpoint = `http://127.0.0.1:5000/itemsfortrade`;

    return fetch(itemsEndpoint, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: myusername})
    })
    .then(response => response.json())
    .then(data => {
        const itemsContainer = document.getElementById('your-items');
        const selectedItemsContainer = document.getElementById('your-selected-items');
        
        // Set the flex-direction property to row-reverse
        selectedItemsContainer.style.flexDirection = 'row-reverse';
        
        return Promise.all(data.data.map(item => {
            const itemDiv = document.createElement('div');
            const itemImg = document.createElement('img');
            const itemRap = document.createElement('p');
            const itemName = document.createElement('p');

            // Add styles to itemDiv
            itemDiv.style.display = 'flex'; // Use Flexbox
            itemDiv.style.flexDirection = 'column'; // Stack the children vertically
            itemDiv.style.justifyContent = 'space-between'; // Distribute space evenly between the children
            itemDiv.style.width = '20%'; // 100% / 4 items = 25% per item
            itemDiv.style.height = '200px'; // Set a fixed height
            itemDiv.style.boxSizing = 'border-box'; // Include padding and border in element's total width and height
            itemDiv.style.padding = '2px'; // Add some padding
            itemDiv.style.background = '#204a75'; // Set a background color
            itemDiv.style.margin = '1%'; // Add some margin
            itemDiv.style.borderRadius = '12px'; // Add a border radius
            itemDiv.style.cursor = 'pointer'; // Change the cursor to a pointer when hovering over the itemDiv

            // Add styles to itemImg
            itemImg.style.maxWidth = '100%'; // Limit the width of the image to the width of the itemDiv
            itemImg.style.maxHeight = '70%'; // Limit the height of the image to 70% of the height of the itemDiv

            // Add styles to itemRap
            itemRap.style.maxWidth = '100%'; // Limit the width of the itemRap to the width of the itemDiv
            itemRap.style.overflow = 'hidden'; // Hide any text that doesn't fit within the boundaries of the itemRap
            itemRap.style.textOverflow = 'ellipsis'; // Add an ellipsis (...) when the text overflows
            itemRap.style.whiteSpace = 'nowrap'; // Prevent the text from wrapping onto the next line

            // Add styles to itemName
            itemName.style.maxWidth = '100%'; // Limit the width of the itemName to the width of the itemDiv
            itemName.style.overflow = 'hidden'; // Hide any text that doesn't fit within the boundaries of the itemName
            itemName.style.textOverflow = 'ellipsis'; // Add an ellipsis (...) when the text overflows
            itemName.style.whiteSpace = 'nowrap'; // Prevent the text from wrapping onto the next line


            itemName.textContent = item.name;
            itemRap.textContent = "RAP: " + item.rap; // Set the text content to the item's rap
            itemDiv.title = item.name;
            itemImg.src = item.imageURL; // Set the src attribute to the imageURL property of the item
            itemDiv.appendChild(itemImg);
            itemDiv.appendChild(itemRap); // Append the itemRap to the itemDiv
            itemDiv.appendChild(itemName);
            itemsContainer.appendChild(itemDiv);
            // Dynamically adjust the font size
            const adjustFontSize = (element) => {
                // Recalculate the maxWidth each time adjustFontSize is called
                const maxWidth = parseFloat(window.getComputedStyle(element).width);
                let fontSize = 40; // Start with a large font size

                // Decrease the font size until the text fits within its container
                while (element.scrollWidth > maxWidth && fontSize > 10) {
                    fontSize--;
                    element.style.fontSize = fontSize + 'px';
                }
            };
            adjustFontSize(itemName);
            adjustFontSize(itemRap);

            // Add an event listener to itemDiv
            itemDiv.addEventListener('click', () => {
                if (itemsContainer.contains(itemDiv)) {
                    // Check if depositList length is less than 4
                    if (myOffer.length < 4) {
                        // Move itemDiv to selectedItemsContainer
                        itemsContainer.removeChild(itemDiv);
                        selectedItemsContainer.appendChild(itemDiv); // Use appendChild instead of prepend
                        adjustFontSize(itemName);
                        adjustFontSize(itemRap);

                        const yourRap = document.getElementById('your-rap');
                        let rap = 0;
                        // Add item to depositList
                        myOffer.push({ uaid: item.uaid, assetId: item.assetId, rap: item.rap });
                        myOffer.forEach(item => {
                            rap += item.rap;
                        });
                        yourRap.textContent = `Total RAP: ${rap}`;
                    } else {
                        alert('You can only trade a maximum of 4 items at once.');
                    }
                } else {
                    // Move itemDiv back to itemsContainer
                    selectedItemsContainer.removeChild(itemDiv);
                    itemsContainer.appendChild(itemDiv);
                    console.log(myOffer)
                    // Remove item from thieroffer
                    myOffer = myOffer.filter(i => i.uaid !== item.uaid);
                    const yourRap = document.getElementById('your-rap');
                    let rap = 0;
                    myOffer.forEach(item => {
                        rap += item.rap;
                    });
                    yourRap.textContent = `Total RAP: ${rap}`;
                }
            });
        }));
    })
    .catch(error => console.error('Error:', error));
}




const itemDiv = document.createElement('div');
            const itemImg = document.createElement('img');
            const itemRap = document.createElement('p');
            const itemName = document.createElement('p');

            // Add styles to itemDiv
            itemDiv.style.display = 'flex'; // Use Flexbox
            itemDiv.style.flexDirection = 'column'; // Stack the children vertically
            itemDiv.style.justifyContent = 'space-between'; // Distribute space evenly between the children
            itemDiv.style.width = '20%'; // 100% / 4 items = 25% per item
            itemDiv.style.height = '200px'; // Set a fixed height
            itemDiv.styl

let myid = null
    
    getUserInfo().then(userInfo => {
        if (userInfo) {
            console.log(`Username: ${userInfo.username}`);
            console.log(`User ID: ${userInfo.userId}`);
            myid = userInfo.userId
            getItems(userInfo.username)
        }
    });




document.getElementById('userSearchForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const username = document.getElementById('usernameInput').value;
     // Move all items from the selected items container back to the items container
     const myItemsContainer = document.getElementById('your-items');
     const mySelectedItemsContainer = document.getElementById('your-selected-items');
     while (mySelectedItemsContainer.firstChild) {
         myItemsContainer.appendChild(mySelectedItemsContainer.firstChild);
     }
 
     // Remove all items from the other user's items container
     const theirItemsContainer = document.getElementById('their-items');
     while (theirItemsContainer.firstChild) {
         theirItemsContainer.removeChild(theirItemsContainer.firstChild);
     }
     // Remove all items from the other user's items container
     const theirSelectedItemsContainer = document.getElementById('their-selected-items');
     while (theirSelectedItemsContainer.firstChild) {
        theirSelectedItemsContainer.removeChild(theirSelectedItemsContainer.firstChild);
     }
 
     // Clear the theirOffer array
     theirOffer = [];
     myOffer = [];
    fetch('http://127.0.0.1:5000/itemsfortrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username }),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        // Handle the response data here
        const itemsContainer = document.getElementById('their-items');
        const selectedItemsContainer = document.getElementById('their-selected-items');
        // Set the flex-direction property to row-reverse
        selectedItemsContainer.style.flexDirection = 'row-reverse';
        targetId = data.targetId;
        return Promise.all(data.data.map(item => {
            const itemDiv = document.createElement('div');
            const itemImg = document.createElement('img');
            const itemRap = document.createElement('p');
            const itemName = document.createElement('p');

            // Add styles to itemDiv
            itemDiv.style.display = 'flex'; // Use Flexbox
            itemDiv.style.flexDirection = 'column'; // Stack the children vertically
            itemDiv.style.justifyContent = 'space-between'; // Distribute space evenly between the children
            itemDiv.style.width = '20%'; // 100% / 4 items = 25% per item
            itemDiv.style.height = '200px'; // Set a fixed height
            itemDiv.style.boxSizing = 'border-box'; // Include padding and border in element's total width and height
            itemDiv.style.padding = '2px'; // Add some padding
            itemDiv.style.background = '#204a75'; // Set a background color
            itemDiv.style.margin = '1%'; // Add some margin
            itemDiv.style.borderRadius = '12px'; // Add a border radius
            itemDiv.style.cursor = 'pointer'; // Change the cursor to a pointer when hovering over the itemDiv

            // Add styles to itemImg
            itemImg.style.maxWidth = '100%'; // Limit the width of the image to the width of the itemDiv
            itemImg.style.maxHeight = '70%'; // Limit the height of the image to 70% of the height of the itemDiv

            // Add styles to itemRap
            itemRap.style.maxWidth = '100%'; // Limit the width of the itemRap to the width of the itemDiv
            itemRap.style.overflow = 'hidden'; // Hide any text that doesn't fit within the boundaries of the itemRap
            itemRap.style.textOverflow = 'ellipsis'; // Add an ellipsis (...) when the text overflows
            itemRap.style.whiteSpace = 'nowrap'; // Prevent the text from wrapping onto the next line

            // Add styles to itemName
            itemName.style.maxWidth = '100%'; // Limit the width of the itemName to the width of the itemDiv
            itemName.style.overflow = 'hidden'; // Hide any text that doesn't fit within the boundaries of the itemName
            itemName.style.textOverflow = 'ellipsis'; // Add an ellipsis (...) when the text overflows
            itemName.style.whiteSpace = 'nowrap'; // Prevent the text from wrapping onto the next line


            itemName.textContent = item.name;
            itemRap.textContent = "RAP: " + item.rap; // Set the text content to the item's rap
            itemDiv.title = item.name;
            itemImg.src = item.imageURL; // Set the src attribute to the imageURL property of the item
            itemDiv.appendChild(itemImg);
            itemDiv.appendChild(itemRap); // Append the itemRap to the itemDiv
            itemDiv.appendChild(itemName);
            itemsContainer.appendChild(itemDiv);
            // Dynamically adjust the font size
            const adjustFontSize = (element) => {
                // Recalculate the maxWidth each time adjustFontSize is called
                const maxWidth = parseFloat(window.getComputedStyle(element).width);
                let fontSize = 40; // Start with a large font size

                // Decrease the font size until the text fits within its container
                while (element.scrollWidth > maxWidth && fontSize > 10) {
                    fontSize--;
                    element.style.fontSize = fontSize + 'px';
                }
            };
            adjustFontSize(itemName);
            adjustFontSize(itemRap);

            // Add an event listener to itemDiv
            itemDiv.addEventListener('click', () => {
                if (itemsContainer.contains(itemDiv)) {
                    // Check if depositList length is less than 4
                    if (theirOffer.length < 4) {
                        // Move itemDiv to selectedItemsContainer
                        itemsContainer.removeChild(itemDiv);
                        selectedItemsContainer.appendChild(itemDiv); // Use appendChild instead of prepend
                        adjustFontSize(itemName);
                        adjustFontSize(itemRap);

                        const theirRap = document.getElementById('their-rap');
                        let rap = 0;
                        // Add item to depositList
                        theirOffer.push({ uaid: item.uaid, assetId: item.assetId, rap: item.rap });
                        theirOffer.forEach(item => {
                            rap += item.rap;
                        });
                        theirRap.textContent = `Total RAP: ${rap}`;
                    } else {
                        alert('You can only trade a maximum of 4 items at once.');
                    }
                } else {
                    // Move itemDiv back to itemsContainer
                    selectedItemsContainer.removeChild(itemDiv);
                    itemsContainer.appendChild(itemDiv);

                    // Remove item from thieroffer
                    theirOffer = theirOffer.filter(i => i.uaid !== item.uaid);
                    const theirRap = document.getElementById('their-rap');
                    let rap = 0;
                    theirOffer.forEach(item => {
                        rap += item.rap;
                    });
                    theirRap.textContent = `Total RAP: ${rap}`;
                }
            });
        }));
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});


// Get the button element
const placeTradeButton = document.getElementById('place-trade-btn');
const successMessage = document.getElementById('success-message');

// Add an event listener to the button
placeTradeButton.addEventListener('click', () => {
    console.log(myOffer);
    console.log(theirOffer);
    // Send a POST request
    // Send a POST request
    fetch('http://127.0.0.1:5000/createtrade', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            offer: myOffer,
            recieve: theirOffer,
            targetId: targetId
        }),
        credentials: 'include'
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(response => {
        if (response.status === 200) {
            // Show the success message
            successMessage.style.backgroundColor = '#64ff73';
            successMessage.textContent = 'Trade successfully sent';
            successMessage.style.display = 'block';
            // Move all items from the selected items container back to the items container
            const myItemsContainer = document.getElementById('your-items');
            const mySelectedItemsContainer = document.getElementById('your-selected-items');
            while (mySelectedItemsContainer.firstChild) {
                myItemsContainer.appendChild(mySelectedItemsContainer.firstChild);
            }
        
            
            // Remove all items from the other user's items container
            const theirSelectedItemsContainer = document.getElementById('their-selected-items');
            const theirItemsContainer = document.getElementById('their-items');
            myOffer = [];
            theirOffer = [];
            while (theirSelectedItemsContainer.firstChild) {
                theirItemsContainer.appendChild(theirSelectedItemsContainer.firstChild);
            }


            const theirRap = document.getElementById('their-rap');
                    let rap = 0;
                    theirOffer.forEach(item => {
                        rap += item.rap;
                    });
                    theirRap.textContent = `Total RAP: ${rap}`;
                    const yourRap = document.getElementById('your-rap');
                    rap = 0;
                    myOffer.forEach(item => {
                        rap += item.rap;
                    });
                    yourRap.textContent = `Total RAP: ${rap}`;
            // Hide the success message after 2 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 2000);
        } else {
            
            successMessage.style.backgroundColor = 'red';
            successMessage.textContent = 'Trade failed - ' + response.body.error;
            successMessage.style.display = 'block';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
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

