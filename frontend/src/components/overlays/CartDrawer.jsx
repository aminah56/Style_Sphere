import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
    const { isCartOpen, closeCart, cartItems, removeFromCart } = useCart();
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    const subtotal = cartItems.reduce((sum, item) => sum + (item.Subtotal || 0), 0);

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
                                        src={item.ImageURL || '/placeholder-image.jpg'}
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
                                        <p className="text-sm text-gray-600">Qty: {item.Quantity}</p>
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
                                closeCart();
                                // Navigate to checkout or cart page if it existed
                                // For now, maybe just keep it here or add a checkout flow later
                                alert('Checkout flow to be implemented');
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
