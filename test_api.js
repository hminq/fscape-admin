import https from 'https';
import fs from 'fs';
https.get('https://fscape-api.onrender.com/api/rooms?limit=1', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.data && json.data[0]) {
                fs.writeFileSync('room_structure.json', JSON.stringify(json.data[0], null, 2));
                console.log('Saved to room_structure.json');
            } else {
                console.log('No data found');
            }
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
        }
    });
}).on('error', (err) => console.log(err.message));
