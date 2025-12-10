
import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

const Checkout = () => {
    const { cartItems, checkout } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '', // Assuming distinct, but we might just use FullName split
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        country: 'Pakistan',
        saveInfo: false
    });

    const [shippingMethod, setShippingMethod] = useState('standard');
    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'card' or 'cod'
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');


    const [isSuccess, setIsSuccess] = useState(false);

    const subtotal = cartItems.reduce((acc, item) => acc + item.Subtotal, 0);
    const shippingCost = shippingMethod === 'express' ? 300 : 150;
    const total = subtotal + shippingCost;

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80';
        if (imageUrl.startsWith('http')) return imageUrl;

        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        if (cleanPath.startsWith('images/')) {
            return `${API_URL}/${cleanPath}`;
        }
        return `${API_URL}/images/${cleanPath}`;
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email,
                firstName: user.fullName ? user.fullName.split(' ')[0] : '',
                lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setError('');

        try {
            const { data: addressData } = await apiClient.post('/user/address', {
                customerId: user.customerId,
                street: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country
            });

            await checkout({
                addressId: addressData.addressId,
                shippingMethod: shippingMethod === 'express' ? 'Express' : 'Standard'
            });

            setIsSuccess(true);
            window.scrollTo(0, 0);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Checkout failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Successful!</h2>
                    <p className="text-gray-600 mb-6">Thank you for your order. Your items will be shipped soon.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-purple-900 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen grid place-items-center">
                <p>Your cart is empty.</p>
                <button onClick={() => navigate('/')}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Left Column: Form */}
                <div className="font-sans">
                    <div className="mb-6">
                        <h2 className="text-xl font-medium mb-4">Contact</h2>
                        <input
                            type="text"
                            value={formData.email}
                            readOnly
                            className="w-full border border-gray-300 rounded p-3 bg-gray-50 text-gray-500"
                        />
                    </div>

                    <form id="checkout-form" onSubmit={handleSubmit}>
                        <div className="mb-8">
                            <h2 className="text-xl font-medium mb-4">Delivery</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        name="firstName"
                                        value={formData.firstName}
                                        readOnly
                                        className="w-full border border-gray-300 rounded p-3 bg-gray-50 text-gray-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last name"
                                        name="lastName"
                                        value={formData.lastName}
                                        readOnly
                                        className="w-full border border-gray-300 rounded p-3 bg-gray-50 text-gray-500"
                                    />
                                </div>

                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded p-3"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full border border-gray-300 rounded p-3"
                                    />
                                    <input
                                        type="text"
                                        name="postalCode"
                                        placeholder="Postal code (optional)"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded p-3"
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Country/Region"
                                    value="Pakistan"
                                    readOnly
                                    className="w-full border border-gray-300 rounded p-3 bg-gray-50 text-gray-500"
                                />

                                <input
                                    type="text"
                                    placeholder="Phone"
                                    name="phone"
                                    value={formData.phone || ''}
                                    readOnly={!!formData.phone}
                                    className="w-full border border-gray-300 rounded p-3 bg-gray-50 text-gray-500"
                                />

                                <label className="flex items-center gap-2 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        name="saveInfo"
                                        checked={formData.saveInfo}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300"
                                    />
                                    Save this information for next time
                                </label>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-medium mb-4">Shipping method</h2>
                            <div className="space-y-3">
                                <label className={`flex justify-between items-center p-4 border rounded cursor-pointer ${shippingMethod === 'standard' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="shipping"
                                            value="standard"
                                            checked={shippingMethod === 'standard'}
                                            onChange={() => setShippingMethod('standard')}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="font-medium">Standard Shipping</span>
                                    </div>
                                    <span className="font-medium">Rs 150.00</span>
                                </label>

                                <label className={`flex justify-between items-center p-4 border rounded cursor-pointer ${shippingMethod === 'express' ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="shipping"
                                            value="express"
                                            checked={shippingMethod === 'express'}
                                            onChange={() => setShippingMethod('express')}
                                            className="text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="font-medium">Express Shipping</span>
                                    </div>
                                    <span className="font-medium">Rs 300.00</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-xl font-medium mb-4">Payment</h2>
                            <p className="text-sm text-gray-500 mb-4">All transactions are secure and encrypted.</p>

                            <div className="border border-gray-300 rounded overflow-hidden">
                                <label className={`block p-4 border-b border-gray-300 cursor-pointer ${paymentMethod === 'card' ? 'bg-purple-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="font-medium">Credit/Debit Card</span>
                                        <div className="ml-auto flex gap-2">
                                            <span className="text-xs border p-1 rounded">VISA</span>
                                            <span className="text-xs border p-1 rounded">MC</span>
                                        </div>
                                    </div>
                                    {paymentMethod === 'card' && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="p-4 bg-gray-100 rounded text-center text-gray-500 text-sm">
                                                Payment Gateway would load here.
                                            </div>
                                        </div>
                                    )}
                                </label>

                                <label className={`block p-4 cursor-pointer ${paymentMethod === 'cod' ? 'bg-purple-50' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="font-medium">Cash on Delivery (COD)</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full py-4 bg-purple-900 text-white rounded text-lg font-medium hover:bg-purple-800 transition disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Pay now'}
                        </button>
                        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}
                    </form>
                </div>

                {/* Right Column: Order Summary */}
                <div className="bg-gray-50 p-8 rounded-lg h-fit sticky top-10">
                    <div className="space-y-6 mb-8">
                        {cartItems.map(item => (
                            <div key={item.CartItemID} className="flex gap-4 items-center">
                                <div className="relative w-16 h-20 bg-white border border-gray-200 rounded overflow-hidden">
                                    <img src={getImageUrl(item.ImageURL)} alt={item.Name} className="w-full h-full object-cover" />
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-500 text-white text-xs rounded-full grid place-items-center">
                                        {item.Quantity}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{item.Name}</h3>
                                    <p className="text-sm text-gray-500">{item.SKU}</p>
                                </div>
                                <p className="font-medium">Rs {item.Subtotal.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 pt-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">Rs {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium">Rs {shippingCost.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
                        <span className="text-lg font-medium">Total</span>
                        <div className="text-right">
                            <span className="text-xs text-gray-500 block">Including taxes</span>
                            <span className="text-2xl font-bold text-gray-900">Rs {total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Checkout;
