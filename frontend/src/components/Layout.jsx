import { useMemo } from 'react';
import Header from './navigation/Header';
import Footer from './navigation/Footer';
import AuthModal from './overlays/AuthModal';
import ProductQuickView from './overlays/ProductQuickView';
import ExperienceStrip from './sections/ExperienceStrip';
import FloatingDock from './overlays/FloatingDock';
import CartDrawer from './overlays/CartDrawer';
import WishlistDrawer from './overlays/WishlistDrawer';
import SearchDrawer from './overlays/SearchDrawer';
import AddToCartSuccessModal from './overlays/AddToCartSuccessModal';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { isAuthModalOpen } = useAuth();
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <>
      <Header />
      <main>{children}</main>
      <ExperienceStrip />
      <Footer year={year} />
      <FloatingDock />
      {isAuthModalOpen && <AuthModal />}
      <ProductQuickView />
      <CartDrawer />
      <WishlistDrawer />
      <SearchDrawer />
      <AddToCartSuccessModal />
    </>
  );
};

export default Layout;

