import { Link } from 'react-router-dom';
import { useProductModal } from '../../contexts/ProductModalContext';

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';

const ProductTile = ({ product }) => {
  const { openProduct } = useProductModal();

  const price = Number(product.Price) || 0;

  // Build image URL - if it's a relative path from DB, prepend backend URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80';
    if (imageUrl.startsWith('http')) return imageUrl;
    // Relative path from database - serve from backend
    return `${API_URL}/${imageUrl}`;
  };

  const image = getImageUrl(product.ImageURL);

  return (
    <div className="rounded-3xl bg-white shadow-[0_20px_35px_rgba(50,10,80,0.08)] overflow-hidden border border-white">
      <div className="relative">
        <img src={image} alt={product.Name} className="h-64 w-full object-cover" />
        <span className="absolute top-4 left-4 text-[10px] tracking-[0.5em] uppercase bg-white/80 backdrop-blur px-3 py-1 rounded-full">
          {product.CategoryName}
        </span>
      </div>
      <div className="p-5 space-y-3">
        <h3 className="text-lg text-purple-900">{product.Name}</h3>
        <p className="text-sm text-gray-500 h-12 overflow-hidden">{product.Description}</p>
        <p className="text-xl font-semibold text-purple-800">Rs {price.toLocaleString()}</p>
        <Link
          to={`/products/${product.ProductID}`}
          className="block w-full py-2 rounded-full bg-purple-700 text-white text-xs tracking-[0.4em] uppercase text-center"
        >
          View details
        </Link>
      </div>
    </div>
  );
};

export default ProductTile;

