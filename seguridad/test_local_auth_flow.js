const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testFlow() {
    const timestamp = Date.now();
    const email = `test_auto_${timestamp}@example.com`;
    const userData = {
        fullName: 'Test Automation',
        email: email,
        companyName: 'Test Corp',
        street: '123 Test St',
        lat: 0,
        lng: 0,
        zone: 'TestZone'
    };

    try {
        // 1. Register
        console.log(`1. Registering ${email}...`);
        const regRes = await axios.post(`${API_URL}/register-admin`, userData);

        if (regRes.status !== 201) {
            throw new Error(`Registration failed: ${regRes.status}`);
        }

        const generatedPassword = regRes.data.password;
        console.log('   Success! Generated Password:', generatedPassword);

        if (!generatedPassword) {
            throw new Error('No password returned from registration!');
        }

        // 2. Login
        console.log(`2. Attempting login with ${email} and password: ${generatedPassword}...`);
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: email,
            password: generatedPassword
        });

        if (loginRes.status === 200) {
            console.log('   LOGIN SUCCESS! The generated password works correctly.');
        } else {
            console.log('   LOGIN FAILED with status:', loginRes.status);
        }

    } catch (error) {
        console.error('FLOW FAILED:', error.response ? error.response.data : error.message);
    }
}

testFlow();
                 