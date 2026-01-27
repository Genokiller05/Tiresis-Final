const https = require('https');

const addresses = [
    "C. 17 119, Centro, 97370 Kanasín, Yuc.",
    "Calle 17 119, Centro, Kanasín, Yucatán",
    "Calle 17, Kanasín, Yucatán",
    "Kanasín, Yucatán"
];

function search(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;

    // User-Agent is required by Nominatim usage policy
    const options = {
        headers: {
            'User-Agent': 'TestScript/1.0'
        }
    };

    https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const results = JSON.parse(data);
                if (results.length > 0) {
                    console.log(`\nQuery: "${query}"`);
                    console.log(`Found: ${results[0].display_name}`);
                    console.log(`Lat: ${results[0].lat}, Lng: ${results[0].lon}`);
                    console.log(`Type: ${results[0].type}`);
                } else {
                    console.log(`\nQuery: "${query}" - NOT FOUND`);
                }
            } catch (e) {
                console.error("Error parsing JSON", e);
            }
        });
    }).on('error', (e) => {
        console.error(e);
    });
}

addresses.forEach(addr => search(addr));
