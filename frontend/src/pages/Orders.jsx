import { useEffect, useState } from 'react';
import { ordersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

const Orders = () => {
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        ordersApi.getOrders(user.customerId)
            .then(({ data }) => setOrders(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [isAuthenticated, user, navigate]);

    const handleRequest = (order, type) => {
        navigate(`/refund-exchange/${type}`, {
            state: { order, requestType: type }
        });
    };

    const isEligibleForReturn = (orderDateString) => {
        const orderDate = new Date(orderDateString);
        const today = new Date();
        const diffTime = Math.abs(today - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80';
        if (imageUrl.startsWith('http')) return imageUrl;
        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        if (cleanPath.startsWith('images/')) return `${API_URL}/${cleanPath}`;
        return `${API_URL}/images/${cleanPath}`;
    };

    if (loading) return <div className="p-10 text-center">Loading orders...</div>;

    return (
        <div className="container py-12">
            <h1 className="text-2xl font-serif text-purple-900 mb-8">My Orders</h1>

            {orders.length === 0 ? (
                <p>You haven't placed any orders yet.</p>
            ) : (
                <div className="space-y-8">
                    {orders.map(order => (
                        <div key={order.OrderID} className="border border-purple-100 rounded-2xl bg-white shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="bg-purple-50/50 p-6 flex flex-wrap gap-4 justify-between items-center border-b border-purple-100">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Order #{order.OrderID}</p>
                                    <p className="text-sm text-gray-600">{new Date(order.OrderDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${order.OrderStatus === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {order.OrderStatus}
                                    </span>
                                    <p className="font-semibold text-purple-900 mt-1">Total: Rs {order.OrderTotal?.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {order.Items && order.Items.length > 0 ? (
                                        order.Items.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4 py-2">
                                                <img
                                                    src={getImageUrl(item.ImageURL)}
                                                    alt={item.Name}
                                                    className="w-16 h-20 object-cover rounded-lg bg-gray-100"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-purple-900">{item.Name}</h4>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Size: {item.Size} <span className="mx-2">•</span> Color: {item.Color} <span className="mx-2">•</span> Qty: {item.Quantity}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900">Rs {item.Price?.toLocaleString()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No details available.</p>
                                    )}
                                </div>

                                {/* Actions */}
                                {isEligibleForReturn(order.OrderDate) && (
                                    <div className="mt-8 pt-4 border-t border-gray-50 flex justify-end gap-3">
                                        <button
                                            onClick={() => handleRequest(order, 'refund')}
                                            className="px-6 py-2 border border-purple-200 text-purple-700 rounded-full text-xs font-medium uppercase tracking-[0.1em] hover:bg-purple-50 transition-colors"
                                        >
                                            Refund
                                        </button>
                                        <button
                                            onClick={() => handleRequest(order, 'exchange')}
                                            className="px-6 py-2 bg-purple-900 text-white rounded-full text-xs font-medium uppercase tracking-[0.1em] hover:bg-purple-800 transition-colors"
                                        >
                                            Exchange
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
