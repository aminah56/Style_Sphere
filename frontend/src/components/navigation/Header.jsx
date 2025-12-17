import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { catalogApi } from '../../services/api';
import Logo from './Logo';

const NavDropdown = ({ category }) => {
  if (!category.children || category.children.length === 0) return null;

  return (
    <div className="absolute left-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2 z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-purple-100 shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-2xl p-6 min-w-[200px] max-w-[600px] w-max">
        <div className="flex gap-12">
          {category.children.map((child) => (
            <div key={child.CategoryID} className="flex flex-col gap-3 min-w-[140px]">
              <NavLink
                to={`/collections/${child.CategoryID}`}
                className="font-medium text-purple-900 tracking-wider text-xs uppercase hover:text-purple-600 transition-colors"
              >
                {child.CategoryName}
              </NavLink>

              {child.children && child.children.length > 0 && (
                <div className="flex flex-col gap-2">
                  {child.children.map((grandChild) => (
                    <NavLink
                      key={grandChild.CategoryID}
                      to={`/collections/${grandChild.CategoryID}`}
                      className="text-sm text-gray-500 hover:text-purple-700 hover:bg-purple-50 px-2 -ml-2 py-1 rounded-md transition-colors"
                    >
                      {grandChild.CategoryName}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { isAuthenticated, user, openAuthModal, logout } = useAuth();
  const { cartCount, wishlistCount, openCart, openWishlist, openSearch } = useCart();
  const [isMobileMenu, setMobileMenu] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    catalogApi.getCategories()
      .then(({ data }) => {
        // Helper function to recursively deduplicate categories by name
        const deduplicateCategories = (cats) => {
          if (!cats) return [];
          const seen = new Set();
          return cats.filter(cat => {
            if (seen.has(cat.CategoryName)) return false;
            seen.add(cat.CategoryName);
            // Recursively deduplicate children
            if (cat.children && cat.children.length > 0) {
              cat.children = deduplicateCategories(cat.children);
            }
            return true;
          });
        };

        const uniqueCategories = deduplicateCategories(data);
        setCategories(uniqueCategories);
      })
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  const staticLinks = [
    { label: 'New In', to: '/collections/new' },
    // ... categories will be inserted here
    { label: 'Journal', to: '/journal' }
  ];

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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 text-sm tracking-[0.2em] uppercase items-center">
          {/* New In - Static */}
          <NavLink
            to="/collections/new"
            className={({ isActive }) => `hover:text-purple-600 transition ${isActive ? 'text-purple-700' : 'text-gray-700'}`}
          >
            New In
          </NavLink>

          {/* Dynamic Categories */}
          {categories.map((category) => (
            <div key={category.CategoryID} className="relative group h-full flex items-center">
              <NavLink
                to={`/collections/${category.CategoryID}`}
                className={({ isActive }) =>
                  `hover:text-purple-600 transition py-4 flex items-center gap-1 ${isActive ? 'text-purple-700' : 'text-gray-700'}`
                }
              >
                {category.CategoryName}
                {category.children?.length > 0 && <span className="text-[10px] opacity-50">▼</span>}
              </NavLink>
              <NavDropdown category={category} />
            </div>
          ))}

          {/* Journal - Static */}
          <NavLink
            to="/journal"
            className={({ isActive }) => `hover:text-purple-600 transition ${isActive ? 'text-purple-700' : 'text-gray-700'}`}
          >
            Journal
          </NavLink>
        </nav>

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
            <div className="relative group z-50">
              <button className="flex items-center gap-2 hover:text-purple-700 transition py-2">
                <span className="text-xs tracking-widest text-gray-500 uppercase hidden md:block">
                  {user.fullName?.split(' ')[0]}
                </span>
                <span className="text-[10px] opacity-50">▼</span>
              </button>

              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out transform group-hover:translate-y-0 translate-y-2">
                <div className="bg-white border border-gray-100 shadow-xl rounded-xl p-2 min-w-[200px] flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="text-sm text-gray-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors text-left">
                    My Profile
                  </Link>
                  <Link to="/orders" className="text-sm text-gray-600 hover:text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-lg transition-colors text-left">
                    My Orders
                  </Link>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-left mt-1"
                  >
                    Logout
                  </button>
                </div>
              </div>
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

      {/* Mobile Menu */}
      {isMobileMenu && (
        <div className="md:hidden bg-white border-t border-purple-100 shadow-inner max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-4 px-6 py-4 text-sm tracking-[0.3em] uppercase">
            <NavLink to="/collections/new" onClick={() => setMobileMenu(false)}>New In</NavLink>

            {categories.map((category) => (
              <div key={category.CategoryID} className="flex flex-col gap-2">
                <NavLink
                  to={`/collections/${category.CategoryID}`}
                  className="font-medium text-purple-900"
                  onClick={() => setMobileMenu(false)}
                >
                  {category.CategoryName}
                </NavLink>
                {category.children?.map(child => (
                  <NavLink
                    key={child.CategoryID}
                    to={`/collections/${child.CategoryID}`}
                    className="text-xs pl-4 text-gray-500 normal-case tracking-normal"
                    onClick={() => setMobileMenu(false)}
                  >
                    {child.CategoryName}
                  </NavLink>
                ))}
              </div>
            ))}

            <NavLink to="/journal" onClick={() => setMobileMenu(false)}>Journal</NavLink>

            {!isAuthenticated && (
              <button onClick={() => openAuthModal('login')} className="text-left text-purple-700 mt-4 border-t border-gray-100 pt-4">
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

