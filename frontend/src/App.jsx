import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Collections from './pages/Collections';
import Journal from './pages/Journal';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ProductModalProvider } from './contexts/ProductModalContext';

const App = () => (
  <AuthProvider>
    <CartProvider>
      <ProductModalProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collections/:slug?" element={<Collections />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </Layout>
      </ProductModalProvider>
    </CartProvider>
  </AuthProvider>
);

export default App;
