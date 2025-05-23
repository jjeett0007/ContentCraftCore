// Simple script to test the login functionality
import fetch from 'node-fetch';

async function testLogin() {
  try {
    // Try login with the default admin user
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.token) {
      console.log('Login successful! Authentication is working with MongoDB.');
    } else {
      console.log('Login failed. Check MongoDB connection and user credentials.');
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

testLogin();