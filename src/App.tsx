import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './application/auth/AuthProvider';
import { ToastProvider } from './application/toast/ToastProvider';
import { AppLayout } from './presentation/components/layout/AppLayout';
import { LoginPage } from './presentation/pages/LoginPage';
import { DashboardPage } from './presentation/pages/DashboardPage';
import { CategoriesPage } from './presentation/pages/CategoriesPage';
import { AttributesPage } from './presentation/pages/AttributesPage';
import { ModelsPage } from './presentation/pages/ModelsPage';
import { ProductsPage } from './presentation/pages/ProductsPage';
import { ConfigurationPage } from './presentation/pages/ConfigurationPage';
import { PoliciesPage } from './presentation/pages/PoliciesPage';
import { StoryPage } from './presentation/pages/StoryPage';
import { HomePage } from './presentation/pages/HomePage';
import { SubscriptionsPage } from './presentation/pages/SubscriptionsPage';
import { ContactUsPage } from './presentation/pages/ContactUsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="attributes" element={<AttributesPage />} />
              <Route path="models" element={<ModelsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="home-page" element={<HomePage />} />
              <Route path="configuration" element={<ConfigurationPage />} />
              <Route path="policies" element={<PoliciesPage />} />
              <Route path="story" element={<StoryPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="contact-us" element={<ContactUsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
