import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { catalogApi } from '../services/api';
import { fallbackProducts } from '../data/fallback';

const ProductModalContext = createContext();

export const ProductModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fallbackMap = useMemo(() => {
    const map = new Map();
    fallbackProducts.forEach((item) => map.set(item.ProductID, item));
    return map;
  }, []);

  const closeProduct = () => {
    setIsOpen(false);
    setProduct(null);
    setError(null);
  };

  const openProduct = async (productSummary) => {
    if (!productSummary) return;
    const fallback = productSummary.isFallback ? productSummary : fallbackMap.get(productSummary.ProductID);
    if (productSummary.isFallback || (!navigator.onLine && fallback)) {
      setProduct(fallback);
      setIsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await catalogApi.getProduct(productSummary.ProductID);
      setProduct(data);
      setIsOpen(true);
    } catch (err) {
      if (fallback) {
        setProduct(fallback);
        setIsOpen(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      product,
      isOpen,
      isLoading,
      error,
      openProduct,
      closeProduct
    }),
    [product, isOpen, isLoading, error]
  );

  return <ProductModalContext.Provider value={value}>{children}</ProductModalContext.Provider>;
};

export const useProductModal = () => useContext(ProductModalContext);

