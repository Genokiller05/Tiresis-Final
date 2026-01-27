const http = require('http');

const email = 'emiliopena777@gmail.com';
const url = `http://localhost:3000/api/admins/${email}`;

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const admin = JSON.parse(data);
            console.log('Admin Data from API:');
            console.log(`Name: ${admin.fullName}`);
            console.log(`Location: ${admin.location}`);
            console.log(`Lat/Lng: ${admin.lat}, ${admin.lng}`);
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
