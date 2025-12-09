
async function check() {
    try {
        const res = await fetch('http://localhost:4000/api/catalog/products/11');
        const data = await res.json();
        console.log('Product 11:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e.message);
    }
}

check();
