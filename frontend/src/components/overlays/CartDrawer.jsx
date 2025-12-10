import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

const CartDrawer = () => {
    const { isCartOpen, closeCart, cartItems, removeFromCart, addToCart } = useCart();
    const { isAuthenticated, openAuthModal } = useAuth();
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const subtotal = cartItems.reduce((sum, item) => sum + (item.Subtotal || 0), 0);

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80';
        if (imageUrl.startsWith('http')) return imageUrl;

        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        if (cleanPath.startsWith('images/')) {
            return `${API_URL}/${cleanPath}`;
        }
        return `${API_URL}/images/${cleanPath}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-purple-900 tracking-wide">Shopping Bag ({cartItems.length})</h2>
                    <button
                        onClick={closeCart}
                        className="text-gray-400 hover:text-purple-700 transition-colors text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <p className="text-gray-500">Your bag is empty.</p>
                            <button
                                onClick={closeCart}
                                className="text-purple-600 underline text-sm tracking-widest uppercase"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.CartItemID} className="flex gap-4">
                                <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {/* Placeholder for image if not available in cart item, assuming backend sends it or we fetch it */}
                                    <img
                                        src={getImageUrl(item.ImageURL)}
                                        alt={item.Name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-sm font-medium text-gray-900">{item.Name}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.VariantID)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {item.SizeName} / {item.ColorName}
                                    </p>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center border border-gray-200 rounded">
                                            <button
                                                onClick={() => addToCart({ variantId: item.VariantID, quantity: item.Quantity - 1 })}
                                                className="px-2 py-1 text-gray-600 hover:text-purple-600 border-r border-gray-200 disabled:opacity-50"
                                                disabled={item.Quantity <= 1}
                                            >
                                                −
                                            </button>
                                            <span className="px-2 text-xs font-medium text-gray-900 w-8 text-center">{item.Quantity}</span>
                                            <button
                                                onClick={() => addToCart({ variantId: item.VariantID, quantity: item.Quantity + 1 })}
                                                className="px-2 py-1 text-gray-600 hover:text-purple-600 border-l border-gray-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="text-sm font-semibold text-purple-900">Rs {item.Subtotal?.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-gray-600 uppercase tracking-wider">Subtotal</span>
                            <span className="text-lg font-bold text-purple-900">Rs {subtotal.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
                        <button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    closeCart();
                                    openAuthModal('login');
                                    return;
                                }
                                closeCart();
                                navigate('/checkout');
                            }}
                            className="w-full py-4 bg-purple-900 text-white text-sm uppercase tracking-[0.2em] hover:bg-purple-800 transition-colors"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartDrawer;
