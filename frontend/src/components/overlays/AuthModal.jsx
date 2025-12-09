import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AuthModal = () => {
  const { authMode, setAuthMode, closeAuthModal, login, register, isSubmitting, error } = useAuth();
  const [form, setForm] = useState({
    customerName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNo: ''
  });

  const isRegister = authMode === 'register';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      await register(form);
    } else {
      await login({ email: form.email, password: form.password });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-[100] px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-purple-700"
          aria-label="Close auth modal"
        >
          ×
        </button>
        <p className="text-xs tracking-[0.4em] uppercase text-purple-500 mb-2">
          {isRegister ? 'Join StyleSphere' : 'Welcome Back'}
        </p>
        <h3 className="text-2xl text-purple-900 font-semibold mb-4">
          {isRegister ? 'Create an account' : 'Sign in to continue'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <input
                name="customerName"
                placeholder="First Name"
                className="input"
                value={form.customerName}
                onChange={handleChange}
                required
              />
              <input
                name="lastName"
                placeholder="Last Name"
                className="input"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input"
            value={form.password}
            onChange={handleChange}
            required
          />
          {isRegister && (
            <input
              name="phoneNo"
              placeholder="Phone"
              className="input"
              value={form.phoneNo}
              onChange={handleChange}
              required
            />
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-purple-700 text-white tracking-[0.4em] uppercase text-xs"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>
        <p className="text-xs text-center text-gray-500 mt-4">
          {isRegister ? 'Already with StyleSphere?' : 'First time here?'}{' '}
          <button
            type="button"
            onClick={() => setAuthMode(isRegister ? 'login' : 'register')}
            className="text-purple-600 underline"
          >
            {isRegister ? 'Login' : 'Create Account'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

