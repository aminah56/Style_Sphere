import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { catalogApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SizeChartModal from '../components/overlays/SizeChartModal';
import { Ruler } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

// Build image URL - if it's a relative path from DB, prepend backend URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${API_URL}/${imageUrl}`;
};

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToCart, addToWishlist, wishlistItems, showSuccessModal } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const { data } = await catalogApi.getProduct(productId);

        setProduct(data);
        setMainImage(getImageUrl(data.images?.[0]?.ImageURL || data.ImageURL));

        // Auto-select first variant
        if (data.variants?.length > 0) {
          setSelectedColor(data.variants[0].ColorID);
          setSelectedSize(data.variants[0].SizeID);
        }
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Get unique colors and sizes
  const colors = useMemo(() => {
    const unique = [];
    const seen = new Set();
    product?.variants?.forEach(variant => {
      if (!seen.has(variant.ColorID)) {
        seen.add(variant.ColorID);
        unique.push({
          id: variant.ColorID,
          name: variant.ColorName,
          hex: variant.HexCode || '#000000'
        });
      }
    });
    return unique;
  }, [product]);

  const sizes = useMemo(() => {
    const unique = [];
    const seen = new Set();
    product?.variants?.forEach(variant => {
      if (!seen.has(variant.SizeID) && variant.ColorID === selectedColor) {
        seen.add(variant.SizeID);
        unique.push({
          id: variant.SizeID,
          name: variant.SizeName,
          inStock: variant.StockQuantity > 0
        });
      }
    });
    return unique;
  }, [product, selectedColor]);

  // Check if selected variant is in stock
  const isInStock = useMemo(() => {
    if (!selectedColor || !selectedSize) return false;
    const variant = product?.variants?.find(
      v => v.ColorID === selectedColor && v.SizeID === selectedSize
    );
    return variant?.StockQuantity > 0;
  }, [product, selectedColor, selectedSize]);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!isInStock) {
      setError('Selected variant is out of stock');
      return;
    }

    try {
      const variant = product.variants.find(
        v => v.ColorID === selectedColor && v.SizeID === selectedSize
      );

      if (variant) {
        await addToCart({
          variantId: variant.VariantID,
          quantity: quantity
        });
        showSuccessModal(`${product.Name} has been added to your bag.`);
        setError('');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add to cart';
      setError(errorMessage);
      console.error('Error adding to cart:', err);
    }
  };

  // Handle add to wishlist
  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      await addToWishlist(product.ProductID);
      setSuccess('Added to wishlist!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add to wishlist');
      console.error('Error adding to wishlist:', err);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = useMemo(() => {
    return wishlistItems.some(item => item.ProductID === product?.ProductID);
  }, [wishlistItems, product]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={mainImage}
                alt={product.Name}
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images?.map((img, index) => {
                const imgUrl = getImageUrl(img.ImageURL);
                return (
                  <button
                    key={index}
                    onClick={() => setMainImage(imgUrl)}
                    className={`rounded-md overflow-hidden border-2 ${mainImage === imgUrl ? 'border-purple-500' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.Name} - ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-0">
            <h1 className="text-3xl font-extrabold text-gray-900">{product.Name}</h1>

            <p className="text-2xl text-gray-900 mt-3">Rs. {product.Price}</p>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <div className="mt-2">
                <p className="text-base text-gray-600">{product.Description}</p>
              </div>
            </div>

            {/* Color Picker */}
            {colors.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setSelectedColor(color.id)}
                      className={`w-10 h-10 rounded-full border-2 ${selectedColor === color.id
                        ? 'border-purple-500'
                        : 'border-transparent'
                        }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Picker - Hide for Unstitched */}
            {sizes.length > 0 && !product.CategoryName?.toLowerCase().includes('unstitched') && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Size</h3>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-500"
                    onClick={() => setIsSizeChartOpen(true)}
                  >
                    <Ruler size={16} />
                    Size Guide
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size.id)}
                      disabled={!size.inStock}
                      className={`py-2 px-4 border rounded-md text-sm font-medium ${selectedSize === size.id
                        ? 'bg-purple-100 border-purple-500 text-purple-900'
                        : size.inStock
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      title={!size.inStock ? 'Out of stock' : ''}
                    >
                      {size.name}
                      {!size.inStock && ' (OOS)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-8">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="mt-1">
                <select
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isInStock || !selectedColor || !selectedSize}
                className={`flex-1 py-3 px-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isInStock && selectedColor && selectedSize
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                {isInStock ? 'Add to cart' : 'Out of stock'}
              </button>

              <button
                type="button"
                onClick={handleAddToWishlist}
                className="flex-1 py-3 px-8 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Error and success messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}

            {/* Product details */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-sm font-medium text-gray-900">Product Details</h3>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="text-sm font-medium text-gray-900">{product.CategoryName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Availability</p>
                    <p className="text-sm font-medium text-gray-900">
                      {isInStock ? 'In Stock' : 'Out of Stock'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
      />
    </div>
  );
};

export default ProductDetail;
