const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/buildings',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log("Status Code:", res.statusCode);
        console.log("Response Data:", data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});
req.end();
