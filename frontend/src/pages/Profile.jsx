import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="container py-12 max-w-2xl">
            <h1 className="text-2xl font-serif text-purple-900 mb-8">My Profile</h1>
            <div className="bg-white p-8 rounded-xl border border-purple-100 shadow-sm space-y-6">
                <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Full Name</label>
                    <p className="text-lg font-medium text-gray-900">{user.fullName}</p>
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Email Address</label>
                    <p className="text-lg font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Phone</label>
                    <p className="text-lg font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
                <div className="pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Member since {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;
