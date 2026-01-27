

async function testRegister() {
    console.log("Testing POST /api/register-admin...");

    const payload = {
        fullName: "Test Admin",
        email: `test_admin_${Date.now()}@example.com`,
        password: "password123",
        companyName: `Test Company ${Date.now()}`,
        location: "Test Location, MX",
        lat: 19.4326,
        lng: -99.1332,
        zone: [] // Sending empty array for zone
    };

    try {
        const res = await fetch('http://localhost:3000/api/register-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log("Response Body:", JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Request Failed:", err.message);
    }
}

testRegister();
