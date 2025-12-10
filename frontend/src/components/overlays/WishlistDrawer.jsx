import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

const WishlistDrawer = () => {
    const { isWishlistOpen, closeWishlist, wishlistItems, removeFromWishlist, addToCart } = useCart();
    const navigate = useNavigate();

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80';
        if (imageUrl.startsWith('http')) return imageUrl;

        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        if (cleanPath.startsWith('images/')) {
            return `${API_URL}/${cleanPath}`;
        }
        return `${API_URL}/images/${cleanPath}`;
    };

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
                                        src={getImageUrl(item.ImageURL)}
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
                                            navigate(`/products/${item.ProductID}`);
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
