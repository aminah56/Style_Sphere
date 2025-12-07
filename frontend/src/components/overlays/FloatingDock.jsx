import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const FloatingDock = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { cartCount, wishlistCount, openCart, openWishlist } = useCart();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-3">
      <div className="bg-white shadow-lg rounded-2xl px-4 py-3 border border-purple-100">
        <p className="text-xs tracking-[0.4em] text-purple-800 uppercase mb-2">Quick Access</p>
        <div className="flex gap-4 text-sm text-gray-700">
          <div onClick={openCart} className="cursor-pointer">
            <p className="text-2xl text-purple-700 font-semibold">{cartCount}</p>
            <p className="text-xs tracking-[0.3em] uppercase">Cart</p>
          </div>
          <div onClick={openWishlist} className="cursor-pointer">
            <p className="text-2xl text-purple-700 font-semibold">{wishlistCount}</p>
            <p className="text-xs tracking-[0.3em] uppercase">Wishlist</p>
          </div>
        </div>
      </div>
      {!isAuthenticated && (
        <button
          className="bg-purple-700 text-white px-5 py-3 rounded-full text-xs tracking-[0.4em] shadow-lg"
          onClick={() => openAuthModal('register')}
        >
          Join Club
        </button>
      )}
    </div>
  );
};

export default FloatingDock;

