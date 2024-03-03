const loginEndpoint = 'http://127.0.0.1:8080/api/users/login';
const registrationEndpoint = 'http://127.0.0.1:8080/api/users/register'; 
const userUpdateEndpoint = 'http://127.0.0.1:8080/api/users/update';
const userGetEndpoint =  'http://127.0.0.1:8080/api/users/';

// Function to perform the login
async function loginUser(email, password) {
  try {
    const requestBody = {
      email: email,
      password: password
    };

    // Make the POST request using Fetch API
    const response = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful:', data);
    } else {

      console.error('Login failed:', response.status);
    }
  } catch (error) {
    console.error('Error occurred during login:', error);
  }
}

//user login
/*
const email = 'dhara@gmail.com';
const password = '123456';
loginUser(email, password);
*/


// Function to perform user registration
async function registerUser(userName, email, password) {
  try {
    // Define the request body
    const requestBody = {
      userName: userName,
      email: email,
      password: password
    };

    // Make the POST request using Fetch API
    const response = await fetch(registrationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      console.log('Registration successful:', data);
    } else {
      console.error('Registration failed:', response.status);
    }
  } catch (error) {
    console.error('Error occurred during registration:', error);
  }
}
//user registration
/*
const userName = 'dhara10'; 
const email = 'dhara@gmail.com';
const password = '123456';
registerUser(userName, email, password);
*/


// Function to update user information
async function updateUser(token, id, experience) {
  try {
    // Define the request body
    const requestBody = {
      id: id,
      experience: experience
    };

    // Make the PUT request using Fetch API
    const response = await fetch(userUpdateEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      console.log('User update successful:', data);
    } else {
      console.error('User update failed:', response.status);
    }
  } catch (error) {
    console.error('Error occurred during user update:', error);
  }
}

// update user info
/*
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaGFyYUBnbWFpbC5jb20iLCJ1c2VySWQiOjIsImV4cCI6MTcwOTQ2NzQyNX0.kaVdpkqTZrYw2s7Aqvz-MLuGa0cwdD-wKB2kH3fIvek';
const id = 2;
const experience = 30;
updateUser(token, id, experience);
*/



// Function to fetch user information
async function getUser(token, id) {
  try {
    // Make the GET request using Fetch API
    const response = await fetch(userGetEndpoint+id, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    // Check if the response is successful
    if (response.ok) {
      const data = await response.json();
      console.log('User information:', data);
    } else {
      console.error('Failed to fetch user information:', response.status);
    }
  } catch (error) {
    console.error('Error occurred during user retrieval:', error);
  }
}

// get user by id
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaGFyYUBnbWFpbC5jb20iLCJ1c2VySWQiOjIsImV4cCI6MTcwOTQ2ODgwNn0.kkdEwWtQpkAsLzGziOw-MX_cNevHEmkc3k7G2wUpFPc";
const userId = 2;
getUser(token, userId);




