const http = require('http');

const runTest = () => {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            full_name: "Test Guard Area",
            document_id: "TEST-AREA-1",
            email: "testarea@segcdmx.mx",
            telefono: "1111111111",
            direccion: "Test Address",
            area: "Edificio Test"
        });

        const optionsPost = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/guards',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const reqPost = http.request(optionsPost, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log("--- TEST 1: CREATE GUARD WITH AREA ---");
                console.log("Status:", res.statusCode);
                const parsed = JSON.parse(data);
                console.log("Response:", parsed);
                if (parsed.guard && parsed.guard.area === "Edificio Test") {
                    console.log("✅ SUCCESS: Guard created and area assigned correctly!");
                } else {
                    console.log("❌ FAILED: Area was not assigned.");
                }

                // Test GET Old Guard
                const optionsGetOld = {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/api/guards/00012345',
                    method: 'GET'
                };

                const reqGetOld = http.request(optionsGetOld, (res2) => {
                    let data2 = '';
                    res2.on('data', (chunk) => { data2 += chunk; });
                    res2.on('end', () => {
                        console.log("\n--- TEST 2: GET OLD GUARD BY IDEMPLEADO ---");
                        console.log("Status:", res2.statusCode);
                        if (res2.statusCode === 200) {
                            const oldGuard = JSON.parse(data2);
                            console.log(`✅ SUCCESS: Old guard found: ${oldGuard.nombre}, Area: ${oldGuard.area}`);
                        } else {
                            console.log("❌ FAILED: Old guard not found.");
                        }
                        resolve();
                    });
                });

                reqGetOld.on('error', (e) => reject(e));
                reqGetOld.end();
            });
        });

        reqPost.on('error', (e) => reject(e));
        reqPost.write(postData);
        reqPost.end();
    });
};

runTest().catch(console.error);
