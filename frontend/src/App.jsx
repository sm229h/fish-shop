import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import TrackOrder from './pages/TrackOrder';
import NotFound from './pages/NotFound';

import AccountDashboard from './pages/account/Dashboard';
import AccountProfile from './pages/account/Profile';
import AccountAddresses from './pages/account/Addresses';
import AccountOrders from './pages/account/Orders';
import AccountOrderDetail from './pages/account/OrderDetail';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductEdit from './pages/admin/ProductEdit';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import AdminCustomers from './pages/admin/Customers';
import AdminInventory from './pages/admin/Inventory';
import AdminSettings from './pages/admin/Settings';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/track-order" element={<TrackOrder />} />

                <Route path="/account" element={<ProtectedRoute><AccountDashboard /></ProtectedRoute>} />
                <Route path="/account/profile" element={<ProtectedRoute><AccountProfile /></ProtectedRoute>} />
                <Route path="/account/addresses" element={<ProtectedRoute><AccountAddresses /></ProtectedRoute>} />
                <Route path="/account/orders" element={<ProtectedRoute><AccountOrders /></ProtectedRoute>} />
                <Route path="/account/orders/:id" element={<ProtectedRoute><AccountOrderDetail /></ProtectedRoute>} />

                <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute admin><AdminProducts /></ProtectedRoute>} />
                <Route path="/admin/products/new" element={<ProtectedRoute admin><AdminProductEdit /></ProtectedRoute>} />
                <Route path="/admin/products/:id/edit" element={<ProtectedRoute admin><AdminProductEdit /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute admin><AdminCategories /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute admin><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/orders/:id" element={<ProtectedRoute admin><AdminOrderDetail /></ProtectedRoute>} />
                <Route path="/admin/customers" element={<ProtectedRoute admin><AdminCustomers /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute admin><AdminInventory /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute admin><AdminSettings /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
