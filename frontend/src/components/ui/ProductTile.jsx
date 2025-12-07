import { useProductModal } from '../../contexts/ProductModalContext';

const ProductTile = ({ product }) => {
  const { openProduct } = useProductModal();

  const price = Number(product.Price) || 0;
  const image =
    product.ImageURL ||
    'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80';

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
        <button
          onClick={() => openProduct(product)}
          className="w-full py-2 rounded-full bg-purple-700 text-white text-xs tracking-[0.4em] uppercase"
        >
          View details
        </button>
      </div>
    </div>
  );
};

export default ProductTile;

