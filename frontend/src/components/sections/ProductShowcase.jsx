import ProductTile from '../ui/ProductTile';

const ProductShowcase = ({ title, eyebrow, products }) => (
  <section className="container mt-14">
    <p className="text-xs tracking-[0.4em] uppercase text-purple-500">{eyebrow}</p>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h2 className="section-title mt-2">{title}</h2>
      <button className="text-xs tracking-[0.4em] uppercase text-purple-700">View Collection →</button>
    </div>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {products.map((product) => (
        <ProductTile key={product.ProductID} product={product} />
      ))}
    </div>
  </section>
);

export default ProductShowcase;

