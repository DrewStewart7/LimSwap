document.querySelectorAll('.faq-card').forEach(card => {
    card.addEventListener('click', () => {
        card.querySelector('.faq-card-inner').classList.toggle('is-flipped');
    });
});

document.getElementById('login').addEventListener('click', function(event) {
    event.preventDefault();
    document.getElementById('loginModal').style.display = 'block';
});

document.getElementsByClassName('close')[0].addEventListener('click', function() {
    document.getElementById('loginModal').style.display = 'none';
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
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // Handle the error
            console.error(data.error);
            return null;
        } else {
            // Return the user info
            loginButton = document.getElementById('login');
            loginButton.style.display = 'none';
            
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


getUserInfo().then(userInfo => {
    if (userInfo) {
        console.log(`Username: ${userInfo.username}`);
        console.log(`User ID: ${userInfo.userId}`);
    }
});

// Get the form elements
const loginForm = document.getElementById('loginFormBtn');
const roblosecurityInput = document.getElementById('roblosecurity');

// Add an event listener for the form submission
loginForm.addEventListener('click', function(event) {
    // Prevent the form from being submitted normally
    event.preventDefault();

    // Get the user's input
    const roblosecurity = roblosecurityInput.value;
    console.log(roblosecurity);
    // Send a request to the login endpoint
    fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            roblosecurity: roblosecurity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            // Show an error message
            const errorMessage = document.createElement('div');
            errorMessage.textContent = data.error;
            errorMessage.style.backgroundColor = 'red';
            errorMessage.style.color = 'white';
            errorMessage.style.position = 'fixed';
            errorMessage.style.top = '0';
            errorMessage.style.margin = '5px';
            errorMessage.style.left = '50%';
            errorMessage.style.transform = 'translateX(-50%)';
            errorMessage.style.borderRadius = '5px';
            errorMessage.style.padding = '10px';
            errorMessage.style.zIndex = '1000';
            errorMessage.style.width = 'auto';
            document.body.appendChild(errorMessage);

            // Remove the error message after a few seconds
            setTimeout(() => {
                document.body.removeChild(errorMessage);
            }, 3000);
        } else {
            // Save the user's session and update the UI
            console.log('User is logged in');
            window.location.href = 'http://127.0.0.1:5500/frontend/dashboard.html';
        }
    })
    .catch(error => {
        // Show an error message
        // Show an error message
        const errorMessage = document.createElement('div');
        errorMessage.textContent = error;
        errorMessage.style.backgroundColor = 'red';
        errorMessage.style.color = 'white';
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '0';
        errorMessage.style.margin = '5px';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translateX(-50%)';
        errorMessage.style.borderRadius = '5px';
        errorMessage.style.padding = '10px';
        errorMessage.style.zIndex = '1000';
        errorMessage.style.width = 'auto';
        document.body.appendChild(errorMessage);


        // Remove the error message after a few seconds
        setTimeout(() => {
            document.body.removeChild(errorMessage);
        }, 3000);
        console.error('Error:', error);
    });
});

// Get the buttons
const depositButton = document.getElementById('depositButton');
const tradeButton = document.getElementById('tradeButton');
const withdrawButton = document.getElementById('withdrawButton');
const profileButton = document.getElementById('profileButton');

// Get the login modal
const loginModal = document.getElementById('loginModal');



// Function to show the login modal
document.addEventListener('DOMContentLoaded', function() {
    // Function to show the login modal
    function showLoginModal() {
        loginModal.style.display = 'block';
    }

    // Add event listeners to the buttons
    depositButton.addEventListener('click', function(event) {
        if (!isAuthCookieValid()) {
            event.preventDefault();
            showLoginModal();
        }
    });
    tradeButton.addEventListener('click', function(event) {
        if (!isAuthCookieValid()) {
            event.preventDefault();
            showLoginModal();
        }
    });
    withdrawButton.addEventListener('click', function(event) {
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