const http = require('https');

http.get('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=37.566&longitude=126.9784&current=pm10,pm2_5&timezone=auto', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(data));
});
