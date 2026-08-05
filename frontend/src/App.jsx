import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { restoreSession } from './store/authSlice.js';
import { Header } from './components/Header.jsx';
import { RequireAuth } from './components/RequireAuth.jsx';
import { RequireAdmin } from './components/RequireAdmin.jsx';
import { AdminLayout } from './components/AdminLayout.jsx';
import { CatalogPage } from './pages/CatalogPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { OrderStatusPage } from './pages/OrderStatusPage.jsx';
import { MyOrdersPage } from './pages/MyOrdersPage.jsx';
import { AdminProductsPage } from './pages/AdminProductsPage.jsx';
import { AdminOrdersPage } from './pages/AdminOrdersPage.jsx';
import { AdminCustomersPage } from './pages/AdminCustomersPage.jsx';

// PWA se agrega en el siguiente paso.
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <RequireAuth>
              <OrderStatusPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <MyOrdersPage />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
