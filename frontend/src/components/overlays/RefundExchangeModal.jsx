import { useState, useEffect } from 'react';
import { catalogApi, ordersApi } from '../../services/api';
import { MapPin, QrCode, Check, AlertCircle, Loader2, Download } from 'lucide-react';
import { BOUTIQUES } from '../../data/constants';

const RefundExchangeModal = ({ order, isOpen, onClose, initialRequestType = 'refund' }) => {
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState([]);
    const [reason, setReason] = useState('');
    const [requestType, setRequestType] = useState(initialRequestType);
    const [exchangeMode, setExchangeMode] = useState(null);
    const [replacementProducts, setReplacementProducts] = useState([]);
    const [selectedReplacement, setSelectedReplacement] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [exchangeReceiptId, setExchangeReceiptId] = useState(null);

    // Reset state when modal opens/closes or request type changes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedItems([]);
            setReason('');
            setExchangeMode(null);
            setReplacementProducts([]);
            setSelectedReplacement(null);
            setRequestType(initialRequestType);
            setExchangeReceiptId(null);
        }
    }, [isOpen, initialRequestType]);

    // Fetch replacements if online exchange selected
    useEffect(() => {
        if (exchangeMode === 'online' && selectedItems.length > 0) {
            const baseItem = selectedItems[0];
            const name = baseItem.Name || '';
            const searchTerm = name.split(' ')[0] || '';

            let price = baseItem.Price;
            if (typeof price === 'string') {
                price = parseFloat(price.replace(/[^0-9.]/g, ''));
            }

            const params = { search: searchTerm };

            if (price && !isNaN(price)) {
                params.minPrice = Math.floor(price * 0.7);
                params.maxPrice = Math.ceil(price * 1.3);
            }

            catalogApi.getProducts(params)
                .then(({ data }) => {
                    // Filter products to ensure they're in the price range
                    const filtered = data.filter(prod => {
                        const prodPrice = typeof prod.Price === 'string' 
                            ? parseFloat(prod.Price.replace(/[^0-9.]/g, '')) 
                            : prod.Price;
                        return prodPrice >= params.minPrice && prodPrice <= params.maxPrice;
                    });
                    setReplacementProducts(filtered.slice(0, 8));
                })
                .catch(err => {
                    console.error('Error fetching replacements:', err);
                    setReplacementProducts([]);
                });
        }
    }, [exchangeMode, selectedItems]);

    const handleToggleItem = (itemId) => {
        const existing = selectedItems.find(i => i.OrderItemID === itemId);
        if (existing) {
            setSelectedItems(selectedItems.filter(i => i.OrderItemID !== itemId));
        } else {
            const item = order.Items.find(i => i.OrderItemID === itemId);
            setSelectedItems([...selectedItems, { ...item, returnQty: 1 }]);
        }
    };

    const handleQuantityChange = (itemId, newQty) => {
        setSelectedItems(selectedItems.map(item =>
            item.OrderItemID === itemId ? { ...item, returnQty: parseInt(newQty) } : item
        ));
    };

    const calculateRefundAmount = () => {
        return selectedItems.reduce((sum, item) => sum + (item.Price * item.returnQty), 0);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const itemsPayload = [];
            for (const item of selectedItems) {
                let replacementVariantId = null;

                // If online exchange, try to get a variant ID for the replacement
                if (requestType === 'exchange' && exchangeMode === 'online' && selectedReplacement) {
                    try {
                        const { data } = await catalogApi.getProduct(selectedReplacement.ProductID);
                        if (data.variants && data.variants.length > 0) {
                            replacementVariantId = data.variants[0].VariantID;
                        }
                    } catch (e) {
                        console.error("Failed to fetch variant", e);
                    }
                }

                itemsPayload.push({
                    orderItemId: item.OrderItemID,
                    quantity: item.returnQty,
                    replacementVariantId
                });
            }

            const response = await ordersApi.submitReturnRequest(order.OrderID, {
                requestType: requestType === 'refund' ? 'Refund' : 'Exchange',
                reason,
                exchangeMode: requestType === 'exchange' ? (exchangeMode === 'instore' ? 'InStore' : 'Online') : null,
                items: itemsPayload
            });

            // Generate receipt ID for in-store exchanges
            if (requestType === 'exchange' && exchangeMode === 'instore') {
                const receiptId = `EXCH-${order.OrderID}-${Date.now().toString().slice(-6)}`;
                setExchangeReceiptId(receiptId);
            }

            setStep(5);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && selectedItems.length === 0) return;
        if (step === 2 && !reason) return;
        if (step === 3 && !exchangeMode) return;

        if (step === 2) {
            if (requestType === 'refund') {
                handleSubmit();
            } else {
                setStep(3);
            }
        } else if (step === 3) {
            setStep(4);
        } else if (step === 4) {
            handleSubmit();
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-serif text-purple-900 capitalize">
                            Request {requestType}
                        </h2>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Order #{order.OrderID}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
                </div>

                {/* Body */}
                <div className="p-8 flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <p className="font-medium text-gray-700">Which items would you like to {requestType === 'refund' ? 'return' : 'exchange'}?</p>
                            <div className="space-y-3">
                                {order.Items.map(item => {
                                    const selected = selectedItems.find(i => i.OrderItemID === item.OrderItemID);
                                    return (
                                        <div
                                            key={item.OrderItemID}
                                            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selected ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}
                                            onClick={() => handleToggleItem(item.OrderItemID)}
                                        >
                                            <div
                                                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${selected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}
                                            >
                                                {selected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <img src={item.ImageURL || 'https://via.placeholder.com/60'} alt={item.Name} className="w-12 h-16 object-cover rounded" />
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{item.Name}</p>
                                                        <p className="text-xs text-gray-500">Size: {item.Size} | Color: {item.Color}</p>
                                                    </div>
                                                    <p className="font-semibold text-sm">Rs {item.Price?.toLocaleString()}</p>
                                                </div>

                                                {selected && item.Quantity > 1 && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <label className="text-xs font-medium text-gray-600">Qty to {requestType}:</label>
                                                        <select
                                                            className="text-xs border-purple-200 rounded px-2 py-1 bg-white focus:ring-purple-500 focus:border-purple-500 cursor-pointer"
                                                            value={selected.returnQty}
                                                            onChange={(e) => handleQuantityChange(item.OrderItemID, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {[...Array(item.Quantity).keys()].map(n => (
                                                                <option key={n + 1} value={n + 1}>{n + 1}</option>
                                                            ))}
                                                        </select>
                                                        <span className="text-xs text-gray-400">/ {item.Quantity}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Why are you requesting a {requestType}?</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 py-2.5"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                >
                                    <option value="">Select a reason</option>
                                    <option value="size">Size doesn't fit</option>
                                    <option value="quality">Quality not as expected</option>
                                    <option value="damaged">Item damaged/defective</option>
                                    <option value="changed_mind">Changed mind</option>
                                    <option value="wrong_item">Received wrong item</option>
                                </select>
                            </div>

                            {requestType === 'refund' && (
                                <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600">
                                        Refund Amount: <span className="font-bold text-gray-900">Rs {calculateRefundAmount().toLocaleString()}</span>.
                                        Refunds are processed within 5-7 business days after we verify your return.
                                    </p>
                                </div>
                            )}

                            {requestType === 'exchange' && (
                                <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-600">
                                        You selected items worth <span className="font-bold text-gray-900">Rs {calculateRefundAmount().toLocaleString()}</span> for exchange.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && requestType === 'exchange' && (
                        <div className="space-y-6">
                            <p className="font-medium text-gray-700">How would you like to exchange?</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    className={`p-4 rounded-xl border text-left transition-all ${exchangeMode === 'instore' ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                                    onClick={() => setExchangeMode('instore')}
                                >
                                    <span className="block font-semibold text-purple-900">In-Store</span>
                                    <span className="text-xs text-gray-500 mt-1">Visit a boutique near you for an instant exchange.</span>
                                </button>
                                <button
                                    className={`p-4 rounded-xl border text-left transition-all ${exchangeMode === 'online' ? 'border-purple-600 ring-1 ring-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}`}
                                    onClick={() => setExchangeMode('online')}
                                >
                                    <span className="block font-semibold text-purple-900">Online</span>
                                    <span className="text-xs text-gray-500 mt-1">Ship items back and get a replacement shipped to you.</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && exchangeMode === 'instore' && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                                <h3 className="font-serif text-lg text-purple-900 mb-2">Ready to Exchange?</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    You have opted for an <strong>In-Store Exchange</strong>.
                                    By confirming, you will generate a digital exchange receipt that you can show in-store.
                                </p>
                                <ul className="mb-4 space-y-2 text-sm text-gray-600 list-disc list-inside">
                                    <li>Bring your original item(s) to any boutique location below.</li>
                                    <li>Show the digital receipt (generated on next screen) to our staff.</li>
                                    <li>Pick your new item instantly!</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-purple-600" />
                                    Available Boutique Locations
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {BOUTIQUES.map((boutique, i) => (
                                        <div key={i} className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-purple-600" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-purple-900">{boutique.label}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{boutique.address}</p>
                                                    <a
                                                        href={boutique.href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-purple-600 hover:text-purple-700 mt-2 inline-flex items-center gap-1"
                                                    >
                                                        View on Map <span>↗</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && exchangeMode === 'online' && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-gray-700">Select a replacement item:</p>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                                        Price Range: Rs {Math.floor(selectedItems[0]?.Price * 0.7).toLocaleString()} - {Math.ceil(selectedItems[0]?.Price * 1.3).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Items shown are within 30% of your original item's price (Rs {selectedItems[0]?.Price?.toLocaleString()})
                                </p>
                            </div>

                            {replacementProducts.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2">
                                    {replacementProducts.map(prod => {
                                        const prodPrice = typeof prod.Price === 'string' 
                                            ? parseFloat(prod.Price.replace(/[^0-9.]/g, '')) 
                                            : prod.Price;
                                        const isSelected = selectedReplacement?.ProductID === prod.ProductID;
                                        
                                        return (
                                            <div
                                                key={prod.ProductID}
                                                className={`border rounded-xl p-3 cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600' : 'border-gray-200 hover:border-purple-300 hover:shadow-md'}`}
                                                onClick={() => setSelectedReplacement(prod)}
                                            >
                                                <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-gray-100">
                                                    <img 
                                                        src={prod.ImageURL || 'https://via.placeholder.com/150'} 
                                                        alt={prod.Name} 
                                                        className="w-full h-full object-cover" 
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1">
                                                            <Check className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium truncate mb-1">{prod.Name}</p>
                                                <p className="text-xs text-purple-700 font-semibold">Rs {prodPrice?.toLocaleString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                    <p className="font-medium mb-1">No similar items found in this price range</p>
                                    <p className="text-xs mt-1">We couldn't find items matching your exchange criteria.</p>
                                    <button
                                        onClick={() => setExchangeMode('instore')}
                                        className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
                                    >
                                        Try In-Store Exchange Instead →
                                    </button>
                                </div>
                            )}

                            {selectedReplacement && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-purple-900 mb-1">Selected Replacement:</p>
                                    <p className="text-sm text-gray-700">{selectedReplacement.Name}</p>
                                    <p className="text-xs text-gray-600 mt-1">Rs {typeof selectedReplacement.Price === 'string' ? parseFloat(selectedReplacement.Price.replace(/[^0-9.]/g, '')).toLocaleString() : selectedReplacement.Price?.toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 5 && (
                        <div className="py-4">
                            {requestType === 'exchange' && exchangeMode === 'instore' ? (
                                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                                    <div className="text-center mb-4">
                                        <h3 className="text-xl font-serif text-purple-900 mb-2">Exchange Receipt Generated</h3>
                                        <p className="text-sm text-gray-600">Show this receipt at any boutique location for your exchange</p>
                                    </div>

                                    <div className="bg-purple-900 text-white p-8 rounded-2xl relative overflow-hidden shadow-xl print:shadow-none" id="exchange-receipt">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <QrCode size={120} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.3em] text-purple-200 mb-1">In-Store Exchange Receipt</p>
                                                    <h3 className="text-3xl font-serif">Rs {calculateRefundAmount().toLocaleString()}</h3>
                                                    <p className="text-purple-200 text-sm">Store Credit Value</p>
                                                </div>
                                                <div className="bg-white/10 p-3 rounded-lg">
                                                    <QrCode className="w-12 h-12 text-white" />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-sm text-purple-100 font-mono border-t border-white/20 pt-4 mb-4">
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">ORDER #</span>
                                                    <span className="font-semibold">{order.OrderID}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">EXCHANGE ID</span>
                                                    <span className="font-semibold">{exchangeReceiptId || `EXCH-${order.OrderID}-${Date.now().toString().slice(-6)}`}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">DATE</span>
                                                    <span className="font-semibold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="opacity-80">TIME</span>
                                                    <span className="font-semibold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            <div className="border-t border-white/20 pt-4">
                                                <p className="text-xs uppercase tracking-wider text-purple-200 mb-2">Items for Exchange</p>
                                                <div className="space-y-2">
                                                    {selectedItems.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between text-sm">
                                                            <span className="text-purple-100">{item.Name} (Qty: {item.returnQty})</span>
                                                            <span className="text-purple-200">Rs {(item.Price * item.returnQty).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-white/20">
                                                <p className="text-xs text-purple-200 text-center">
                                                    Present this receipt at any StyleSphere boutique to complete your exchange
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 print:hidden">
                                        <button
                                            onClick={() => {
                                                const printWindow = window.open('', '_blank');
                                                const receiptContent = document.getElementById('exchange-receipt').innerHTML;
                                                printWindow.document.write(`
                                                    <!DOCTYPE html>
                                                    <html>
                                                    <head>
                                                        <title>Exchange Receipt - StyleSphere</title>
                                                        <style>
                                                            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: #120726; color: white; }
                                                            .receipt { background: #6B21A8; padding: 30px; border-radius: 16px; }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <div class="receipt">${receiptContent}</div>
                                                        <script>window.print();</script>
                                                    </body>
                                                    </html>
                                                `);
                                                printWindow.document.close();
                                            }}
                                            className="flex-1 py-3 bg-purple-900 text-white rounded-xl font-medium text-sm hover:bg-purple-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Receipt
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="flex-1 py-3 border-2 border-purple-900 text-purple-900 rounded-xl font-medium text-sm hover:bg-purple-50 transition-all"
                                        >
                                            Print Receipt
                                        </button>
                                    </div>

                                    <div className="mt-6">
                                        <p className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-purple-600" />
                                            Available Boutique Locations
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {BOUTIQUES.map((boutique, i) => (
                                                <div key={i} className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1 w-2 h-2 rounded-full bg-purple-600" />
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-sm text-purple-900">{boutique.label}</p>
                                                            <p className="text-xs text-gray-600 mt-1">{boutique.address}</p>
                                                            <a
                                                                href={boutique.href}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs text-purple-600 hover:text-purple-700 mt-2 inline-flex items-center gap-1"
                                                            >
                                                                View on Map <span>↗</span>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-serif text-purple-900 mb-2">Request Submitted!</h3>
                                    <p className="text-gray-600 max-w-sm mx-auto">
                                        Your {requestType} request has been received. You will receive an email shortly with the next steps.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between bg-white sticky bottom-0 z-10">
                    {step === 5 ? (
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-purple-900 text-white rounded-xl font-medium tracking-wide uppercase text-sm hover:bg-purple-800 transition-all"
                        >
                            Done
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => step === 1 ? onClose() : setStep(step - 1)}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
                            >
                                {step === 1 ? 'Cancel' : 'Back'}
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={(step === 1 && selectedItems.length === 0) || (step === 2 && !reason) || (step === 3 && !exchangeMode) || (step === 4 && exchangeMode === 'online' && !selectedReplacement) || isSubmitting}
                                className="px-8 py-2.5 bg-purple-900 text-white rounded-lg font-medium text-sm tracking-wide uppercase hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {step === 4 || (step === 2 && requestType === 'refund') ? 'Confirm Request' : 'Next'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RefundExchangeModal;
