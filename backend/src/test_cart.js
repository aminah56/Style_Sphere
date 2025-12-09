
async function addToCart() {
    try {
        const payload = { customerId: 1, variantId: 18, quantity: 1 };
        console.log('Sending:', payload);
        const res = await fetch('http://localhost:4000/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);
    } catch (e) {
        console.error(e.message);
    }
}

addToCart();
