// Fetch and display users when the page loads
window.onload = function() {
    fetchUsers();
};

// Fetch users from the backend
function fetchUsers() {
    fetch('http://127.0.0.1:5000/users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); // Debugging line
        const userDirectory = document.getElementById('userDirectory');
        // Clear the user directory
        userDirectory.innerHTML = '';
        // Append a card for each user
        data.forEach(user => {
            console.log(user); // Debugging line
            const userCard = document.createElement('div');
            userCard.innerHTML = `<h2>${user.username}</h2><p>RAP: ${user.rap}</p>`;
            userCard.addEventListener('click', function() {
                //window.open(`http://127.0.0.1:5500/frontend/lookup.html?username=${encodeURIComponent(user.username)}`, '_blank');
                window.location.href = ('http://127.0.0.1:5500/frontend/lookup.html?username=' + encodeURIComponent(user.username));
            });
            userDirectory.appendChild(userCard);
        });
    });
}