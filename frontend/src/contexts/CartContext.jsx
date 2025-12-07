import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi, wishlistApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isBusy, setBusy] = useState(false);

  const loadData = async () => {
    if (!user) {
      setCartItems([]);
      setWishlistItems([]);
      return;
    }
    setBusy(true);
    try {
      const [{ data: cart }, { data: wishlist }] = await Promise.all([
        cartApi.getCart(user.customerId),
        wishlistApi.getWishlist(user.customerId)
      ]);
      setCartItems(cart);
      setWishlistItems(wishlist);
    } catch (error) {
      console.warn('Unable to load cart/wishlist', error.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.customerId]);

  const addToCart = async ({ variantId, quantity = 1 }) => {
    if (!user) throw new Error('Please login to add to cart.');
    await cartApi.updateItem({
      customerId: user.customerId,
      variantId,
      quantity
    });
    await loadData();
  };

  const removeFromCart = async (variantId) => {
    if (!user) return;
    await cartApi.removeItem(user.customerId, variantId);
    await loadData();
  };

  const addToWishlist = async (productId) => {
    if (!user) throw new Error('Please login to curate wishlist.');
    await wishlistApi.addItem({ customerId: user.customerId, productId });
    await loadData();
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    await wishlistApi.removeItem(user.customerId, productId);
    await loadData();
  };

  const checkout = async ({ addressId, shippingMethod }) => {
    if (!user) throw new Error('Please login to checkout.');
    const { data } = await cartApi.checkout({
      customerId: user.customerId,
      addressId,
      shippingMethod
    });
    await loadData();
    return data;
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const showSuccessModal = (message) => setSuccessModal({ isOpen: true, message });
  const closeSuccessModal = () => setSuccessModal({ isOpen: false, message: '' });

  const value = useMemo(
    () => ({
      cartItems,
      wishlistItems,
      cartCount: cartItems.length,
      wishlistCount: wishlistItems.length,
      addToCart,
      removeFromCart,
      addToWishlist,
      removeFromWishlist,
      checkout,
      isBusy,
      isCartOpen,
      openCart,
      closeCart,
      isWishlistOpen,
      openWishlist,
      closeWishlist,
      isSearchOpen,
      openSearch,
      closeSearch,
      successModal,
      showSuccessModal,
      closeSuccessModal
    }),
    [cartItems, wishlistItems, isBusy, isCartOpen, isWishlistOpen, isSearchOpen, successModal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
