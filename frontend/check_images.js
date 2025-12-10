const http = require('http');

http.get('http://localhost:4000/api/catalog/products?search=Men', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const products = JSON.parse(data);
            if (products.length > 0) {
                console.log('Sample ImageURL:', products[0].ImageURL);
            } else {
                console.log('No products found');
            }
        } catch (e) {
            console.error(e.message);
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
