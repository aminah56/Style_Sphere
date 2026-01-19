import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import { CreditCard, Package, User, Phone, Mail, Calendar } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user?.customerId) {
                try {
                    const { data } = await userApi.getProfile(user.customerId);
                    setProfileData(data);
                } catch (error) {
                    console.error("Failed to load profile:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchProfile();
    }, [user]);

    if (!user) return null;

    const displayUser = profileData?.user || user;
    const stats = profileData?.stats || { totalOrders: 0 };
    const cards = profileData?.savedCards || [];

    if (loading) {
        return (
            <div className="container py-12 max-w-4xl flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-900"></div>
            </div>
        );
    }

    return (
        <div className="container py-12 max-w-5xl">
            <h1 className="text-3xl font-serif text-purple-900 mb-10">My Account</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: User Info Card */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm sticky top-24">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">{displayUser.fullName}</h2>
                            <p className="text-sm text-gray-500">Member since {new Date(displayUser.CreatedAt || Date.now()).getFullYear()}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center text-gray-600">
                                <Mail size={18} className="mr-3 text-purple-400" />
                                <span className="text-sm">{displayUser.email || displayUser.Email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Phone size={18} className="mr-3 text-purple-400" />
                                <span className="text-sm">{displayUser.PhoneNo || displayUser.phone || 'No phone added'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Content */}
                <div className="md:col-span-2 space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 font-medium text-sm">Total Orders</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">{stats.totalOrders}</p>
                            </div>
                            <div className="bg-white p-3 rounded-full text-purple-600 shadow-sm">
                                <Package size={24} />
                            </div>
                        </div>
                        {/* Placeholder for future stats */}
                        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 font-medium text-sm">Active Rewards</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">0</p>
                            </div>
                            <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm">
                                <Calendar size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Saved Cards Section */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                            <CreditCard className="mr-2 text-purple-600" size={20} />
                            Saved Payment Methods
                        </h3>

                        {cards.length > 0 ? (
                            <div className="space-y-4">
                                {cards.map((card, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-purple-200 transition-colors bg-gray-50">
                                        <div className="flex items-center">
                                            <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center mr-4 text-xs font-bold text-gray-500">
                                                CARD
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    •••• •••• •••• {card.CardLast4Digits}
                                                </p>
                                                <p className="text-xs text-gray-500 uppercase">{card.PaymentMethod}</p>
                                            </div>
                                        </div>
                                        <button className="text-red-500 text-sm hover:underline hover:text-red-600">Remove</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No saved cards found from previous orders.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
