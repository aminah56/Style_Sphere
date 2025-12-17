const http = require('http');
const fs = require('fs');

http.get('http://localhost:4000/api/catalog/categories/tree', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        fs.writeFileSync('categories_out.json', JSON.stringify(JSON.parse(data), null, 2));
    });
}).on('error', (err) => {
    console.error(err);
});
