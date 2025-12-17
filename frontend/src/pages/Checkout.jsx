
import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '../components/CheckoutForm';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Checkout = () => {
    const { user } = useAuth();
    const { cartItems } = useCart();
    const navigate = useNavigate();
    const [clientSecret, setClientSecret] = useState('');
    const [paymentIntentId, setPaymentIntentId] = useState('');
    const [shippingMethod, setShippingMethod] = useState('standard');

    useEffect(() => {
        if (user && cartItems.length > 0 && !paymentIntentId) {
            apiClient.post('/payment/create-payment-intent', {
                customerId: user.customerId,
                shippingMethod: 'standard'
            }).then(res => {
                setClientSecret(res.data.clientSecret);
                setPaymentIntentId(res.data.paymentIntentId);
            }).catch(err => console.error("Error creating payment intent:", err));
        }
    }, [user, cartItems]); // Intentionally omitting paymentIntentId dep to avoid loops, but strictly it's guarded by !paymentIntentId

    useEffect(() => {
        if (paymentIntentId && user) {
            apiClient.post('/payment/update-payment-intent', {
                paymentIntentId,
                customerId: user.customerId,
                shippingMethod
            }).catch(err => console.error("Error updating payment intent:", err));
        }
    }, [shippingMethod, paymentIntentId, user]);

    // Handle empty cart or no user (though protected route usually handles user)
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen grid place-items-center">
                <p>Your cart is empty.</p>
                <button onClick={() => navigate('/')}>Continue Shopping</button>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="min-h-screen flex items-center justify-center space-x-2">
                <div className="w-4 h-4 rounded-full animate-pulse bg-purple-600"></div>
                <div className="w-4 h-4 rounded-full animate-pulse bg-purple-600 delay-75"></div>
                <div className="w-4 h-4 rounded-full animate-pulse bg-purple-600 delay-150"></div>
            </div>
        );
    }

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#581c87', // purple-900
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    return (
        <Elements options={options} stripe={stripePromise}>
            <CheckoutForm shippingMethod={shippingMethod} setShippingMethod={setShippingMethod} />
        </Elements>
    );
};

export default Checkout;
