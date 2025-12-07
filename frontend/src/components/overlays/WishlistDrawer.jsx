import { useCart } from '../../contexts/CartContext';

const WishlistDrawer = () => {
    const { isWishlistOpen, closeWishlist, wishlistItems, removeFromWishlist, addToCart } = useCart();

    if (!isWishlistOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={closeWishlist}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-purple-900 tracking-wide">Wishlist ({wishlistItems.length})</h2>
                    <button
                        onClick={closeWishlist}
                        className="text-gray-400 hover:text-purple-700 transition-colors text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {wishlistItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <p className="text-gray-500">Your wishlist is empty.</p>
                            <button
                                onClick={closeWishlist}
                                className="text-purple-600 underline text-sm tracking-widest uppercase"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        wishlistItems.map((item) => (
                            <div key={item.WishlistID} className="flex gap-4">
                                <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
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
                                            onClick={() => removeFromWishlist(item.ProductID)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold text-purple-900 mt-2">Rs {item.Price?.toLocaleString()}</p>

                                    {/* Note: Adding to cart from wishlist usually requires selecting size/color if not already selected. 
                      For now, we might just link to product page or show a quick view. 
                  */}
                                    <button
                                        onClick={() => {
                                            closeWishlist();
                                            // Logic to open product quick view or navigate to product page
                                            // For simplicity, let's just close for now, user can navigate via product name if we link it
                                        }}
                                        className="mt-3 text-xs text-purple-600 underline uppercase tracking-wider"
                                    >
                                        View Product
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default WishlistDrawer;
