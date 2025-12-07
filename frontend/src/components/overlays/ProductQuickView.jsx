import { useEffect, useMemo, useState } from 'react';
import { useProductModal } from '../../contexts/ProductModalContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { catalogApi } from '../../services/api';

const toUnique = (variants, key, labelKey) => {
  const seen = new Map();
  variants?.forEach((variant) => {
    if (!seen.has(variant[key])) {
      seen.set(variant[key], {
        id: variant[key],
        label: variant[labelKey],
        hex: variant.HexCode
      });
    }
  });
  return Array.from(seen.values());
};

const ProductQuickView = () => {
  const { product, isOpen, isLoading, closeProduct } = useProductModal();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToCart, addToWishlist, showSuccessModal } = useCart();
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [allSizes, setAllSizes] = useState([]);

  const colors = useMemo(() => toUnique(product?.variants || [], 'ColorID', 'ColorName'), [product]);

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        const { data } = await catalogApi.getSizes();
        setAllSizes(data);
      } catch (error) {
        console.error('Failed to fetch sizes', error);
      }
    };
    fetchSizes();
  }, []);

  useEffect(() => {
    if (product) {
      setSelectedColor(colors[0]?.id || null);
      // Try to select a size that is available for the first color, otherwise just the first size
      const availableVariant = product.variants?.find(v => v.ColorID === colors[0]?.id && v.AdditionalStock > 0);
      setSelectedSize(availableVariant?.SizeID || allSizes[0]?.SizeID || null);
      setFeedback('');
    }
  }, [product, colors, allSizes]);

  if (!isOpen) return null;

  const activeVariant = (product?.variants || []).find(
    (variant) => variant.SizeID === selectedSize && variant.ColorID === selectedColor
  );

  const isOutOfStock = !activeVariant || activeVariant.AdditionalStock <= 0;

  const requireAuth = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return true;
    }
    return false;
  };

  const handleAddToCart = async () => {
    if (requireAuth()) return;
    if (isOutOfStock) {
      setFeedback('Selected item is out of stock.');
      return;
    }
    try {
      await addToCart({ variantId: activeVariant.VariantID, quantity: 1 });
      showSuccessModal(`${product.Name} has been added to your bag.`);
      closeProduct();
    } catch (error) {
      setFeedback(error.message);
    }
  };

  const handleWishlist = async () => {
    if (requireAuth()) return;
    try {
      await addToWishlist(product.ProductID);
      setFeedback('Saved to wishlist.');
    } catch (error) {
      setFeedback(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-xl grid md:grid-cols-2">
        <div className="relative bg-gradient-to-br from-purple-100 via-white to-purple-50">
          <button
            onClick={closeProduct}
            className="absolute top-4 right-4 text-gray-600 hover:text-purple-700 text-2xl"
            aria-label="Close quick view"
          >
            ×
          </button>
          <img
            src={product?.images?.[0]?.ImageURL || product?.ImageURL}
            alt={product?.Name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-8 space-y-5">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-purple-500">{product?.CategoryName}</p>
            <h3 className="text-3xl text-purple-900 font-semibold">{product?.Name}</h3>
            <p className="text-sm text-gray-500 mt-2">{product?.Description}</p>
          </div>
          <p className="text-2xl font-semibold text-purple-800">Rs {Number(product?.Price || 0).toLocaleString()}</p>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500 mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`px-3 py-1 rounded-full border ${selectedColor === color.id ? 'border-purple-700 text-purple-700' : 'border-purple-100 text-gray-600'
                    }`}
                  style={
                    color.hex
                      ? { backgroundColor: selectedColor === color.id ? color.hex : `${color.hex}20`, color: '#1d1133' }
                      : undefined
                  }
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500 mb-2">Size</p>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((size) => {
                const variant = product?.variants?.find(v => v.SizeID === size.SizeID && v.ColorID === selectedColor);
                const isVariantStock = variant && variant.AdditionalStock > 0;
                return (
                  <button
                    key={size.SizeID}
                    onClick={() => setSelectedSize(size.SizeID)}
                    className={`px-4 py-2 rounded-full border ${selectedSize === size.SizeID ? 'border-purple-700 text-purple-700' : 'border-purple-100 text-gray-600'
                      } ${!isVariantStock ? 'opacity-50' : ''}`}
                    title={!isVariantStock ? 'Out of Stock' : ''}
                  >
                    {size.SizeName}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="flex-1 py-3 rounded-full bg-purple-700 text-white text-xs tracking-[0.4em] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isLoading}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to bag'}
            </button>
            <button
              className="flex-1 py-3 rounded-full border border-purple-200 text-purple-700 text-xs tracking-[0.4em] uppercase"
              onClick={handleWishlist}
            >
              Wishlist
            </button>
          </div>
          {feedback && <p className="text-sm text-purple-700">{feedback}</p>}
          {!activeVariant?.VariantID && !isOutOfStock && (
            <p className="text-xs text-red-500">
              Select a color and size combination to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductQuickView;

