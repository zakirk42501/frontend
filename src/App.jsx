import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { RecoveryMen } from './views/RecoveryMen';
import { Accounts } from './views/Accounts';
import { Payments } from './views/Payments';
import { Inventory } from './views/Inventory';
import { ToastProvider } from './context/ToastContext';
import { subscribeLedgerRealtime } from './lib/realtime';

function App() {
  React.useEffect(() => {
    const unsubscribe = subscribeLedgerRealtime();
    return unsubscribe;
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/recovery-men" element={<RecoveryMen />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
