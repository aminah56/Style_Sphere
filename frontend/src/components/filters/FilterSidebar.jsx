import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { catalogApi } from '../../services/api';

const FilterSidebar = ({ isOpen, onClose, products, onFilterChange, filters }) => {
    const [sizes, setSizes] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 0]);
    const [selectedPriceRange, setSelectedPriceRange] = useState([0, 0]);
    const [selectedSizes, setSelectedSizes] = useState(filters.sizes || []);
    const [availability, setAvailability] = useState({
        inStock: filters.inStock === true,
        outOfStock: filters.outOfStock === false
    });

    // Sync state with filters prop
    useEffect(() => {
        setSelectedSizes(filters.sizes || []);
        setAvailability({
            inStock: filters.inStock === true,
            outOfStock: filters.outOfStock === false
        });
    }, [filters.sizes, filters.inStock, filters.outOfStock]);

    // Calculate price range from products
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

    // Fetch sizes
    useEffect(() => {
        catalogApi.getSizes()
            .then(({ data }) => {
                // Filter out unwanted sizes (XS, XL, XXL)
                const unwantedSizes = ['XS', 'XL', 'XXL'];
                const filteredSizes = data.filter(size =>
                    !unwantedSizes.includes(size.SizeName.toUpperCase())
                );
                setSizes(filteredSizes);
            })
            .catch(err => console.error('Failed to fetch sizes', err));
    }, []);

    // Calculate counts for availability
    const availabilityCounts = useMemo(() => {
        const inStock = products.filter(p => (p.TotalStock || 0) > 0).length;
        const outOfStock = products.filter(p => (p.TotalStock || 0) === 0).length;
        return { inStock, outOfStock };
    }, [products]);

    // Calculate counts for sizes
    const sizeCounts = useMemo(() => {
        // This would ideally come from the backend, but for now we'll estimate
        // In a real implementation, you'd want to get this from the API
        const counts = {};
        sizes.forEach(size => {
            counts[size.SizeID] = Math.floor(Math.random() * 100) + 500; // Placeholder
        });
        return counts;
    }, [sizes]);

    const handleAvailabilityChange = (type) => {
        const newAvailability = { ...availability, [type]: !availability[type] };
        setAvailability(newAvailability);

        if (type === 'inStock') {
            onFilterChange({
                ...filters,
                inStock: newAvailability.inStock ? true : undefined,
                outOfStock: newAvailability.inStock ? undefined : filters.outOfStock
            });
        } else {
            onFilterChange({
                ...filters,
                outOfStock: newAvailability.outOfStock ? false : undefined,
                inStock: newAvailability.outOfStock ? undefined : filters.inStock
            });
        }
    };

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

    const handlePriceFilter = () => {
        // Only apply filter if range is different from full range
        const newMinPrice = selectedPriceRange[0] !== priceRange[0] ? selectedPriceRange[0] : undefined;
        const newMaxPrice = selectedPriceRange[1] !== priceRange[1] ? selectedPriceRange[1] : undefined;
        onFilterChange({
            ...filters,
            minPrice: newMinPrice,
            maxPrice: newMaxPrice
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={onClose}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
                    <h2 className="text-lg font-semibold text-gray-900">FILTER</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Availability */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Availability</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availability.inStock}
                                    onChange={() => handleAvailabilityChange('inStock')}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">
                                    In Stock ({availabilityCounts.inStock})
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availability.outOfStock}
                                    onChange={() => handleAvailabilityChange('outOfStock')}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="text-sm text-gray-700">
                                    Out Of Stock ({availabilityCounts.outOfStock})
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* By Price */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">By Price</h3>
                        <div className="space-y-4">
                            {priceRange[0] !== priceRange[1] && (
                                <>
                                    <div className="relative h-8">
                                        <div className="absolute top-3 w-full h-2 bg-gray-200 rounded-lg"></div>
                                        {(() => {
                                            const rangeDiff = priceRange[1] - priceRange[0];
                                            const leftPercent = rangeDiff > 0 ? ((selectedPriceRange[0] - priceRange[0]) / rangeDiff) * 100 : 0;
                                            const widthPercent = rangeDiff > 0 ? ((selectedPriceRange[1] - selectedPriceRange[0]) / rangeDiff) * 100 : 100;
                                            return (
                                                <div
                                                    className="absolute top-3 h-2 bg-purple-600 rounded-lg"
                                                    style={{
                                                        left: `${leftPercent}%`,
                                                        width: `${widthPercent}%`
                                                    }}
                                                ></div>
                                            );
                                        })()}
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
                                </>
                            )}
                        </div>
                    </div>

                    {/* By Size */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">By Size</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {sizes.map((size) => (
                                <label key={size.SizeID} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedSizes.includes(size.SizeID)}
                                        onChange={() => handleSizeToggle(size.SizeID)}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {size.SizeName} ({sizeCounts[size.SizeID] || 0})
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;

