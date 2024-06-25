// login.js
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.querySelector('#login-form');
  
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault(); 
      const email = loginForm['email'].value;
      const password = loginForm['password'].value;
  
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          if (user.email === 'jyannnvalencia@gmail.com') {
            // Allow access to admin features
            window.location.href = '/AdminDashboard.html';
          } else {
            console.log('Unauthorized access');
          }
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(errorMessage);
          // Handle errors, such as incorrect credentials
          alert(errorMessage); // Display error to the user
        });
    });
  });