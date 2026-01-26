const http = require('http');

const data = JSON.stringify({
    full_name: "Guardia Test Completo",
    document_id: "TEST9999",
    email: "test@guardia.com",
    telefono: "555-1234-567",
    direccion: "Calle Falsa 123",
    area: "Entrada principal",
    photo_url: "/uploads/test.jpg"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/guards',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log("Enviando payload corregido:", data);

const req = http.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => responseData += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`RESPONSE: ${responseData}`);
    });
});

req.on('error', (error) => {
    console.error("ERROR:", error);
});

req.write(data);
req.end();
