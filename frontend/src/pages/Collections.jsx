import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi } from '../services/api';
import { fallbackCategories } from '../data/fallback';
import CategorySidePanel from '../components/navigation/CategorySidePanel';
import ProductTile from '../components/ui/ProductTile';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {products.length === 0 && <p className="text-sm text-gray-500 col-span-full text-center">Select a capsule to load products.</p>}
        {products.map((product) => (
          <ProductTile key={product.ProductID} product={product} />
        ))}
      </div>
    </section>
  );
};

export default Collections;

