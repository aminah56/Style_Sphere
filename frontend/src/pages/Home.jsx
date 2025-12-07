import { useEffect, useMemo, useState } from 'react';
import Hero from '../components/sections/Hero';
import CategoryRail from '../components/sections/CategoryRail';
import ProductShowcase from '../components/sections/ProductShowcase';
import { catalogApi } from '../services/api';
import { fallbackCategories, fallbackProducts } from '../data/fallback';

const Home = () => {
  const [categories, setCategories] = useState(fallbackCategories);
  const [products, setProducts] = useState(fallbackProducts);

  useEffect(() => {
    catalogApi
      .getCategories()
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories(fallbackCategories));

    catalogApi
      .getProducts()
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts(fallbackProducts));
  }, []);

  const womensLuxury = useMemo(
    () => products.filter((product) => product.CategoryName?.includes("Women's")).slice(0, 3),
    [products]
  );
  const mensLine = useMemo(
    () => products.filter((product) => product.CategoryName?.includes("Men")).slice(0, 3),
    [products]
  );

  return (
    <>
      <Hero />
      <CategoryRail categories={categories} />
      <ProductShowcase title="Women's Royal Edit" eyebrow="Inspired by Sapphire luxury pret" products={womensLuxury} />
      <ProductShowcase title="Menswear Spotlight" eyebrow="Tailored like Nishat couture" products={mensLine} />
    </>
  );
};

export default Home;

