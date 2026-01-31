/**
 * Canton LedgerView Application
 * 
 * Main application component with routing configuration.
 * Handles connection flow and protected routes.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLedgerStore } from './services/store';
import Layout from './components/Layout';
import ConnectionForm from './components/ConnectionForm';
import Dashboard from './pages/Dashboard';
import ContractsBrowser from './pages/ContractsBrowser';
import Transactions from './pages/Transactions';
import Templates from './pages/Templates';
import NodeHealth from './pages/NodeHealth';
import './index.css';

/**
 * Protected route wrapper - requires connection before accessing
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const isConnected = useLedgerStore((state) => state.status.connected);

    if (!isConnected) {
        return <Navigate to="/connect" replace />;
    }

    return <>{children}</>;
}

/**
 * Public route wrapper - redirects to dashboard if already connected
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
    const isConnected = useLedgerStore((state) => state.status.connected);

    if (isConnected) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Connection Page (public) */}
                <Route
                    path="/connect"
                    element={
                        <PublicRoute>
                            <ConnectionForm />
                        </PublicRoute>
                    }
                />

                {/* Main Application (protected) */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="contracts" element={<ContractsBrowser />} />
                    <Route path="contracts/:contractId" element={<div>Contract Detail (TODO)</div>} />
                    <Route path="transactions" element={<Transactions />} />
                    <Route path="transactions/:updateId" element={<div>Transaction Detail (TODO)</div>} />
                    <Route path="templates" element={<Templates />} />
                    <Route path="health" element={<NodeHealth />} />
                    <Route path="settings" element={<div>Settings (TODO)</div>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
