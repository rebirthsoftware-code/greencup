import { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { StoreProvider } from './store/store';
import { SyncProvider } from './store/sync';
import { TabBar, ToastProvider } from './components/ui';
import Splash from './components/Splash';
import PinLock from './components/PinLock';
import Notifications from './pages/Notifications';
import Home from './pages/Home';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CustomerForm from './pages/CustomerForm';
import NewTransaction from './pages/NewTransaction';
import Stock from './pages/Stock';
import Cash from './pages/Cash';
import More from './pages/More';
import Payments from './pages/Payments';
import Visits from './pages/Visits';
import VisitDetail from './pages/VisitDetail';
import Invoice from './pages/Invoice';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
const WithTabs = () => <><Outlet /><TabBar /></>;
// Alt klasörde / statik barındırmada (önizleme) hash tabanlı yönlendirme kullan
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export default function App() {
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('gc-splash'));
  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => { setSplash(false); sessionStorage.setItem('gc-splash', '1'); }, 1900);
    return () => clearTimeout(t);
  }, [splash]);

  return (
    <StoreProvider>
      <SyncProvider>
      <ToastProvider>
        <Router basename={basename}>
          <ScrollTop />
          <PinLock>
          <div className="app">
            <Routes>
              <Route element={<WithTabs />}>
                <Route path="/" element={<Home />} />
                <Route path="/musteriler" element={<Customers />} />
                <Route path="/musteriler/:id" element={<CustomerDetail />} />
                <Route path="/stok" element={<Stock />} />
                <Route path="/kasa" element={<Cash />} />
                <Route path="/daha" element={<More />} />
                <Route path="/daha/odemeler" element={<Payments />} />
                <Route path="/daha/ziyaretler" element={<Visits />} />
                <Route path="/daha/raporlar" element={<Reports />} />
                <Route path="/daha/ayarlar" element={<Settings />} />
                <Route path="/bildirimler" element={<Notifications />} />
              </Route>
              <Route path="/musteriler/yeni" element={<CustomerForm />} />
              <Route path="/musteriler/:id/duzenle" element={<CustomerForm />} />
              <Route path="/islem" element={<NewTransaction />} />
              <Route path="/ziyaret/:id" element={<VisitDetail />} />
              <Route path="/fatura/:id" element={<Invoice />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </div>
          </PinLock>
        </Router>
        {splash && <Splash />}
      </ToastProvider>
      </SyncProvider>
    </StoreProvider>
  );
}
