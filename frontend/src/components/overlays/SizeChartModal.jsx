import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SizeChartModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50">
                        <h3 className="text-xl font-semibold text-purple-900">Standard Size Chart</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-purple-100 rounded-full transition-colors text-purple-700"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-x-auto">
                        <p className="text-sm text-gray-500 mb-6">
                            All measurements are in inches. Please note that these are standard body measurements.
                            Garment measurements may vary depending on the style and fit.
                        </p>

                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-purple-700 uppercase bg-purple-50">
                                <tr>
                                    <th className="px-6 py-3 rounded-l-lg">Size</th>
                                    <th className="px-6 py-3">Chest</th>
                                    <th className="px-6 py-3">Waist</th>
                                    <th className="px-6 py-3">Hips</th>
                                    <th className="px-6 py-3 rounded-r-lg">Length</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">XS</td>
                                    <td className="px-6 py-4">34</td>
                                    <td className="px-6 py-4">28</td>
                                    <td className="px-6 py-4">36</td>
                                    <td className="px-6 py-4">44</td>
                                </tr>
                                <tr className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">Small</td>
                                    <td className="px-6 py-4">36</td>
                                    <td className="px-6 py-4">30</td>
                                    <td className="px-6 py-4">38</td>
                                    <td className="px-6 py-4">44.5</td>
                                </tr>
                                <tr className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">Medium</td>
                                    <td className="px-6 py-4">38</td>
                                    <td className="px-6 py-4">32</td>
                                    <td className="px-6 py-4">40</td>
                                    <td className="px-6 py-4">45</td>
                                </tr>
                                <tr className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">Large</td>
                                    <td className="px-6 py-4">40</td>
                                    <td className="px-6 py-4">34</td>
                                    <td className="px-6 py-4">42</td>
                                    <td className="px-6 py-4">45.5</td>
                                </tr>
                                <tr className="hover:bg-purple-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">XL</td>
                                    <td className="px-6 py-4">43</td>
                                    <td className="px-6 py-4">37</td>
                                    <td className="px-6 py-4">45</td>
                                    <td className="px-6 py-4">46</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-2">
                            <p><strong>Note:</strong></p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Measurements are for the body, not the garment.</li>
                                <li>Length varies by design (Short Kurti vs Long Shirt).</li>
                                <li>For specific garment measurements, please contact our support team.</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SizeChartModal;
