const fs = require('fs');
const path = require('path');

const buildingsPath = path.join(__dirname, '..', '..', 'data', 'buildings.json');

// Coordinates adjusted to be unmistakably inside the user's visible zone (UTM Campus)
const buildings = [
    {
        id: "utm-edificio-central",
        name: "Edificio Central",
        type: "custom",
        geometry: [
            [20.9402, -89.6155],
            [20.9402, -89.6150],
            [20.9398, -89.6150],
            [20.9398, -89.6155]
        ]
    },
    {
        id: "utm-canchas",
        name: "Área Deportiva",
        type: "custom",
        geometry: [
            [20.9400, -89.6140],
            [20.9400, -89.6135],
            [20.9390, -89.6135],
            [20.9390, -89.6140]
        ]
    },
    {
        id: "utm-entrada",
        name: "Entrada Principal",
        type: "custom",
        geometry: [
            [20.9412, -89.6160],
            [20.9412, -89.6158],
            [20.9410, -89.6158],
            [20.9410, -89.6160]
        ]
    }
];

fs.writeFileSync(buildingsPath, JSON.stringify(buildings, null, 2));
console.log('Populated buildings in exact center.');
