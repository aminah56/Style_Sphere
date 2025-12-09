import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi } from '../services/api';
import { fallbackCategories } from '../data/fallback';
import CategorySidePanel from '../components/navigation/CategorySidePanel';
import { useProductModal } from '../contexts/ProductModalContext';

const flatten = (nodes = [], prefix = '') =>
  nodes.flatMap((node) => {
    const fullName = prefix ? `${prefix} › ${node.CategoryName}` : node.CategoryName;
    return [{ ...node, fullName }, ...(node.children ? flatten(node.children, fullName) : [])];
  });

const Collections = () => {
  const { slug } = useParams();
  const [tree, setTree] = useState(fallbackCategories);
  const [products, setProducts] = useState([]);
  const { openProduct } = useProductModal();

  useEffect(() => {
    catalogApi
      .getCategories()
      .then(({ data }) => setTree(data))
      .catch(() => setTree(fallbackCategories));
  }, []);

  useEffect(() => {
    let categoryId;
    if (slug && !isNaN(slug)) {
      categoryId = parseInt(slug);
    } else {
      categoryId = slug?.includes('women')
        ? 12
        : slug?.includes('men')
          ? 7
          : slug?.includes('luxury')
            ? 14
            : undefined;
    }
    catalogApi
      .getProducts({ categoryId })
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]));
  }, [slug]);

  return (
    <section className="container py-10">
      <p className="text-xs tracking-[0.4em] uppercase text-purple-500">Collection Directory</p>
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="section-title">Browse the purple wardrobe</h1>
        <CategorySidePanel categories={tree} />
      </div>
      <div className="grid gap-4 mt-6">
        {products.length === 0 && <p className="text-sm text-gray-500">Select a capsule to load products.</p>}
        {products.map((product) => (
          <div key={product.ProductID} className="p-5 rounded-3xl bg-white shadow-sm border border-purple-50 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-purple-500">{product.CategoryName}</p>
              <h3 className="text-xl text-purple-900 mt-2">{product.Name}</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-2xl">{product.Description}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-purple-800">Rs {product.Price?.toLocaleString()}</p>
              <Link
                to={`/products/${product.ProductID}`}
                className="mt-3 inline-block px-5 py-2 rounded-full border border-purple-200 text-purple-700 text-xs tracking-[0.4em] uppercase hover:bg-purple-50 transition-colors"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Collections;

