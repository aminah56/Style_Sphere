import { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../contexts/CartContext';
import { catalogApi } from '../../services/api';
import { useProductModal } from '../../contexts/ProductModalContext';

// Simple debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const SearchDrawer = () => {
    const { isSearchOpen, closeSearch } = useCart();
    const { openProduct } = useProductModal();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        if (isSearchOpen) {
            // Focus input logic could go here
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isSearchOpen]);

    useEffect(() => {
        const searchProducts = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const { data } = await catalogApi.getProducts({ search: debouncedQuery });
                setResults(data);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        searchProducts();
    }, [debouncedQuery]);

    if (!isSearchOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={closeSearch}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-purple-900 tracking-wide">Search</h2>
                    <button
                        onClick={closeSearch}
                        className="text-gray-400 hover:text-purple-700 transition-colors text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 border-b border-gray-100">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className="w-full px-4 py-3 rounded-full border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {results.map((product) => (
                                <div
                                    key={product.ProductID}
                                    className="group cursor-pointer"
                                    onClick={() => {
                                        openProduct(product);
                                        closeSearch();
                                    }}
                                >
                                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                                        <img
                                            src={product.ImageURL || '/placeholder-image.jpg'}
                                            alt={product.Name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors line-clamp-1">{product.Name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">Rs {product.Price?.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="text-center py-8 text-gray-500">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            Start typing to search...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchDrawer;
