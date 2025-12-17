const express = require('express');
const Stripe = require('stripe');
const { getPool, sql } = require('../db');

const router = express.Router();
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn('Stripe key missing - payment routes will fail.');
}

router.post('/create-payment-intent', async (req, res) => {
    try {
        const { customerId, shippingMethod } = req.body;

        // Calculate total amount from server side to be secure
        const pool = await getPool();
        const request = pool.request();
        request.input('CustomerID', sql.Int, customerId);

        const result = await request.query(`
            SELECT 
                SUM(ci.Quantity * ci.UnitPrice) as Subtotal
            FROM CartItem ci
            INNER JOIN Cart c ON c.CartID = ci.CartID
            WHERE c.CustomerID = @CustomerID
        `);

        let subtotal = result.recordset[0].Subtotal || 0;

        // Shipping cost logic (should match frontend)
        const shippingCost = shippingMethod === 'express' ? 300 : 150;
        const total = subtotal + shippingCost;

        if (total <= 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        if (!stripe) {
            return res.status(500).json({ message: 'Stripe is not configured on the server.' });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(total * 100), // Stripe expects amount in cents
            currency: 'pkr', // Assuming currency is PKR based on frontend
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/update-payment-intent', async (req, res) => {
    try {
        const { paymentIntentId, customerId, shippingMethod } = req.body;

        // Calculate total amount from server side to be secure
        const pool = await getPool();
        const request = pool.request();
        request.input('CustomerID', sql.Int, customerId);

        const result = await request.query(`
             SELECT 
                 SUM(ci.Quantity * ci.UnitPrice) as Subtotal
             FROM CartItem ci
             INNER JOIN Cart c ON c.CartID = ci.CartID
             WHERE c.CustomerID = @CustomerID
         `);

        let subtotal = result.recordset[0].Subtotal || 0;
        const shippingCost = shippingMethod === 'express' ? 300 : 150;
        const total = subtotal + shippingCost;

        if (total <= 0) return res.status(400).json({ message: 'Cart is empty' });

        if (!stripe) return res.status(500).json({ message: 'Stripe not configured' });

        await stripe.paymentIntents.update(paymentIntentId, {
            amount: Math.round(total * 100),
        });

        res.json({ message: 'Payment intent updated' });

    } catch (error) {
        console.error('Error updating payment intent:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
