import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Logo from './Logo';

const menu = [
  { label: 'New In', to: '/collections/new' },
  { label: 'Women', to: '/collections/women' },
  { label: 'Men', to: '/collections/men' },
  { label: 'Luxury Pret', to: '/collections/luxury' },
  { label: 'Unstitched', to: '/collections/unstitched' },
  { label: 'Journal', to: '/journal' }
];

const Header = () => {
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const { cartCount, wishlistCount, openCart, openWishlist, openSearch } = useCart();
  const [isMobileMenu, setMobileMenu] = useState(false);

  return (
    <header className="shadow-sm sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100">
      <div className="container py-3 flex items-center justify-between">
        <button
          className="md:hidden text-2xl text-purple-900"
          onClick={() => setMobileMenu((prev) => !prev)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <Link to="/" aria-label="StyleSphere home">
          <Logo />
        </Link>
        <div className="hidden md:flex gap-6 text-sm tracking-[0.2em] uppercase">
          {menu.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `hover:text-purple-600 transition ${isActive ? 'text-purple-700' : 'text-gray-700'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button
            className="hidden md:block text-gray-600 hover:text-purple-600 transition"
            onClick={openSearch}
          >
            Search
          </button>
          <button
            className="relative text-gray-700 hover:text-purple-700 transition"
            onClick={openWishlist}
          >
            Wishlist
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-3 text-xs bg-purple-600 text-white rounded-full px-1.5">
                {wishlistCount}
              </span>
            )}
          </button>
          <button
            className="relative text-gray-700 hover:text-purple-700 transition"
            onClick={openCart}
          >
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 text-xs bg-purple-600 text-white rounded-full px-1.5">
                {cartCount}
              </span>
            )}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest text-gray-500 uppercase hidden md:block">
                {user.fullName}
              </span>
              <button className="text-purple-700 text-xs tracking-[0.3em]" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              className="bg-purple-700 text-white px-4 py-2 text-xs tracking-[0.3em] uppercase rounded-full"
              onClick={() => openAuthModal('login')}
            >
              Login
            </button>
          )}
        </div>
      </div>
      {isMobileMenu && (
        <div className="md:hidden bg-white border-t border-purple-100 shadow-inner">
          <div className="flex flex-col gap-4 px-6 py-4 text-sm tracking-[0.3em] uppercase">
            {menu.map((item) => (
              <NavLink key={item.label} to={item.to} onClick={() => setMobileMenu(false)}>
                {item.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <button onClick={() => openAuthModal('login')} className="text-left text-purple-700">
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

