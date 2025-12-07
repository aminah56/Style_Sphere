import { useCart } from '../../contexts/CartContext';

const AddToCartSuccessModal = () => {
    const { successModal, closeSuccessModal, openCart } = useCart();

    if (!successModal.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={closeSuccessModal}
            />
            <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-6 animate-fade-in-up">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-900">Added to Bag</h3>
                    <p className="text-gray-500 mt-2">{successModal.message || 'Item added to your shopping bag.'}</p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            closeSuccessModal();
                            openCart();
                        }}
                        className="w-full py-3 bg-purple-900 text-white rounded-full text-sm uppercase tracking-widest hover:bg-purple-800 transition-colors"
                    >
                        Go to Cart
                    </button>
                    <button
                        onClick={closeSuccessModal}
                        className="w-full py-3 border border-gray-200 text-gray-600 rounded-full text-sm uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToCartSuccessModal;
