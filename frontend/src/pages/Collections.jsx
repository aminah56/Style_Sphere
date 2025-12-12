import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { catalogApi } from '../services/api';
import { fallbackCategories } from '../data/fallback';
import { Filter } from 'lucide-react';
import ProductTile from '../components/ui/ProductTile';
import FilterSidebar from '../components/filters/FilterSidebar';

const Collections = () => {
  const { slug } = useParams();
  const [tree, setTree] = useState(fallbackCategories);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: undefined,
    maxPrice: undefined,
    sizes: undefined,
    inStock: undefined,
    outOfStock: undefined
  });

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

    const params = { categoryId };
    
    // Add filter parameters
    if (filters.minPrice !== undefined && filters.minPrice !== null) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined && filters.maxPrice !== null) params.maxPrice = filters.maxPrice;
    if (filters.sizes && filters.sizes.length > 0) {
      params.sizes = filters.sizes.join(',');
    }
    if (filters.inStock !== undefined) {
      params.inStock = filters.inStock.toString();
    } else if (filters.outOfStock !== undefined) {
      // If outOfStock is explicitly set to false, that means show out of stock items
      params.inStock = 'false';
    }

    catalogApi
      .getProducts(params)
      .then(({ data }) => {
        setProducts(data);
      })
      .catch(() => setProducts([]));
  }, [slug, filters]);

  // Fetch all products for filter counts (unfiltered)
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
      .then(({ data }) => setAllProducts(data))
      .catch(() => setAllProducts([]));
  }, [slug]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <section className="container py-10">
      <p className="text-xs tracking-[0.4em] uppercase text-purple-500">Collection Directory</p>
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <h1 className="section-title">Browse the purple wardrobe</h1>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="md:hidden flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter</span>
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">FILTER</h2>
            </div>

            <div className="space-y-6">
              {/* Availability */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Availability</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.inStock === true}
                      onChange={() => {
                        const newInStock = filters.inStock === true ? undefined : true;
                        handleFilterChange({
                          ...filters,
                          inStock: newInStock,
                          outOfStock: newInStock === true ? undefined : filters.outOfStock
                        });
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      In Stock ({allProducts.filter(p => (p.TotalStock || 0) > 0).length})
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.outOfStock === false}
                      onChange={() => {
                        const newOutOfStock = filters.outOfStock === false ? undefined : false;
                        handleFilterChange({
                          ...filters,
                          outOfStock: newOutOfStock,
                          inStock: newOutOfStock === false ? undefined : filters.inStock
                        });
                      }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      Out Of Stock ({allProducts.filter(p => (p.TotalStock || 0) === 0).length})
                    </span>
                  </label>
                </div>
              </div>

              {/* By Price */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">By Price</h3>
                <PriceFilter
                  products={allProducts}
                  onFilterChange={handleFilterChange}
                  filters={filters}
                />
              </div>

              {/* By Size */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">By Size</h3>
                <SizeFilter
                  onFilterChange={handleFilterChange}
                  filters={filters}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.length === 0 && (
              <p className="text-sm text-gray-500 col-span-full text-center py-12">
                No products found. Try adjusting your filters.
              </p>
            )}
            {products.map((product) => (
              <ProductTile key={product.ProductID} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        products={allProducts}
        onFilterChange={handleFilterChange}
        filters={filters}
      />
    </section>
  );
};

// Price Filter Component
const PriceFilter = ({ products, onFilterChange, filters }) => {
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [selectedPriceRange, setSelectedPriceRange] = useState([0, 0]);

  useEffect(() => {
    if (products && products.length > 0) {
      const prices = products.map(p => parseFloat(p.Price) || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceRange([min, max]);
        setSelectedPriceRange(
          filters.minPrice !== undefined && filters.maxPrice !== undefined
            ? [filters.minPrice, filters.maxPrice]
            : [min, max]
        );
      }
    }
  }, [products, filters.minPrice, filters.maxPrice]);

  const handlePriceFilter = () => {
    onFilterChange({
      ...filters,
      minPrice: selectedPriceRange[0] !== priceRange[0] ? selectedPriceRange[0] : undefined,
      maxPrice: selectedPriceRange[1] !== priceRange[1] ? selectedPriceRange[1] : undefined
    });
  };

  const handlePriceRangeChange = (index, value) => {
    const newRange = [...selectedPriceRange];
    const newValue = parseInt(value);
    newRange[index] = newValue;
    
    // Ensure min doesn't exceed max and vice versa
    if (index === 0) {
      if (newValue > newRange[1]) {
        newRange[1] = newValue;
      }
    } else if (index === 1) {
      if (newValue < newRange[0]) {
        newRange[0] = newValue;
      }
    }
    
    setSelectedPriceRange(newRange);
  };

  const formatPrice = (price) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  if (priceRange[0] === 0 && priceRange[1] === 0) return null;

  const rangeDiff = priceRange[1] - priceRange[0];
  const leftPercent = rangeDiff > 0 ? ((selectedPriceRange[0] - priceRange[0]) / rangeDiff) * 100 : 0;
  const widthPercent = rangeDiff > 0 ? ((selectedPriceRange[1] - selectedPriceRange[0]) / rangeDiff) * 100 : 100;

  return (
    <div className="space-y-4">
      <div className="relative h-8">
        <div className="absolute top-3 w-full h-2 bg-gray-200 rounded-lg"></div>
        <div
          className="absolute top-3 h-2 bg-purple-600 rounded-lg"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`
          }}
        ></div>
        <input
          type="range"
          min={priceRange[0]}
          max={priceRange[1]}
          value={selectedPriceRange[0]}
          onChange={(e) => handlePriceRangeChange(0, e.target.value)}
          className="absolute top-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-20 range-input"
          style={{
            background: 'transparent'
          }}
        />
        <input
          type="range"
          min={priceRange[0]}
          max={priceRange[1]}
          value={selectedPriceRange[1]}
          onChange={(e) => handlePriceRangeChange(1, e.target.value)}
          className="absolute top-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-30 range-input"
          style={{
            background: 'transparent'
          }}
        />
      </div>
      <div className="text-sm text-gray-600">
        Price: {formatPrice(selectedPriceRange[0])} — {formatPrice(selectedPriceRange[1])}
      </div>
      <button
        onClick={handlePriceFilter}
        className="w-full py-2 bg-purple-900 text-white text-sm font-medium rounded hover:bg-purple-800 transition-colors"
      >
        FILTER
      </button>
    </div>
  );
};

// Size Filter Component
const SizeFilter = ({ onFilterChange, filters }) => {
  const [sizes, setSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState(filters.sizes || []);

  useEffect(() => {
    catalogApi.getSizes()
      .then(({ data }) => setSizes(data))
      .catch(err => console.error('Failed to fetch sizes', err));
  }, []);

  const handleSizeToggle = (sizeId) => {
    const newSizes = selectedSizes.includes(sizeId)
      ? selectedSizes.filter(id => id !== sizeId)
      : [...selectedSizes, sizeId];
    setSelectedSizes(newSizes);
    onFilterChange({
      ...filters,
      sizes: newSizes.length > 0 ? newSizes : undefined
    });
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {sizes.map((size) => (
        <label key={size.SizeID} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedSizes.includes(size.SizeID)}
            onChange={() => handleSizeToggle(size.SizeID)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">{size.SizeName}</span>
        </label>
      ))}
    </div>
  );
};

export default Collections;

