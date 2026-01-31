/**
 * ConnectionForm Component
 * 
 * Allows users to connect to a Canton participant node by providing:
 * - Participant endpoint (JSON Ledger API URL)
 * - Optional auth token
 * - Connection status indicator
 */

import { useState } from 'react';
import { Server, Key, AlertCircle, CheckCircle, Loader2, Globe } from 'lucide-react';
import { useConnection, useScanStore } from '../services/store';

interface ConnectionFormProps {
    onConnected?: () => void;
}

export function ConnectionForm({ onConnected }: ConnectionFormProps) {
    const { status, connect } = useConnection();
    const { scanConfig, setScanConfig } = useScanStore();
    const [endpoint, setEndpoint] = useState('http://localhost:7575');
    const [authToken, setAuthToken] = useState('');
    const [scanUrl, setScanUrl] = useState(scanConfig.url);
    const [memberId, setMemberId] = useState(scanConfig.memberId);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsConnecting(true);

        try {
            if (scanUrl.trim()) {
                setScanConfig(scanUrl.trim(), memberId.trim());
            }
            const success = await connect({
                endpoint,
                authToken: authToken || undefined,
            });

            if (success) {
                onConnected?.();
            } else {
                setError('Failed to connect to the participant node');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="connection-form-container">
            <form onSubmit={handleConnect} className="connection-form">
                <div className="form-header">
                    <img
                        src="https://www.canton.network/hubfs/canton-logo-black.svg"
                        alt="Canton Network"
                        className="form-logo"
                    />
                    <h2 className="form-title">LedgerView</h2>
                    <p className="form-description">
                        Connect to your Canton participant node
                    </p>
                </div>

                <div className="form-fields">
                    <div className="input-group">
                        <label htmlFor="endpoint" className="input-label">
                            Participant Endpoint
                        </label>
                        <div className="input-with-icon">
                            <Server className="input-icon" size={18} />
                            <input
                                id="endpoint"
                                type="url"
                                value={endpoint}
                                onChange={(e) => setEndpoint(e.target.value)}
                                placeholder="http://localhost:7575"
                                className="input"
                                required
                            />
                        </div>
                        <p className="input-hint">
                            Default port for JSON Ledger API is 7575
                        </p>
                    </div>

                    <div className="input-group">
                        <label htmlFor="auth-token" className="input-label">
                            Auth Token (Optional)
                        </label>
                        <div className="input-with-icon">
                            <Key className="input-icon" size={18} />
                            <input
                                id="auth-token"
                                type="password"
                                value={authToken}
                                onChange={(e) => setAuthToken(e.target.value)}
                                placeholder="Bearer token (if required)"
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="scan-url" className="input-label">
                            Global Sync Scan API
                        </label>
                        <div className="input-with-icon">
                            <Globe className="input-icon" size={18} />
                            <input
                                id="scan-url"
                                type="url"
                                value={scanUrl}
                                onChange={(e) => setScanUrl(e.target.value)}
                                placeholder="https://scan.sv-1.global.canton.network.sync.global/api/scan"
                                className="input"
                            />
                        </div>
                        <p className="input-hint">
                            Use the Scan API base URL (include /api/scan).
                        </p>
                    </div>

                    <div className="input-group">
                        <label htmlFor="member-id" className="input-label">
                            Global Sync Member ID (Optional)
                        </label>
                        <div className="input-with-icon">
                            <Globe className="input-icon" size={18} />
                            <input
                                id="member-id"
                                type="text"
                                value={memberId}
                                onChange={(e) => setMemberId(e.target.value)}
                                placeholder="Member ID for traffic status"
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {status.connected && (
                    <div className="success-banner">
                        <CheckCircle size={18} />
                        <span>Connected to {status.endpoint}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-primary btn-lg connect-button"
                    disabled={isConnecting}
                >
                    {isConnecting ? (
                        <>
                            <Loader2 className="spinner" size={18} />
                            Connecting...
                        </>
                    ) : status.connected ? (
                        'Reconnect'
                    ) : (
                        'Connect'
                    )}
                </button>
            </form>

            <style>{`
        .connection-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: var(--space-4);
          background: var(--bg-primary);
        }

        .connection-form {
          width: 100%;
          max-width: 440px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-8) var(--space-8) var(--space-10);
          box-shadow: var(--shadow-xl);
        }

        .form-header {
          text-align: center;
          margin-bottom: var(--space-8);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .form-logo {
          height: 32px;
          margin-bottom: var(--space-4);
          width: auto;
        }

        .form-title {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-1);
          letter-spacing: -0.01em;
        }

        .form-description {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
          margin-bottom: var(--space-8);
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input {
          padding-left: var(--space-10);
          height: 44px;
        }

        .input-icon {
          position: absolute;
          left: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .input-hint {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-top: var(--space-2);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid var(--color-error-500);
          border-radius: var(--radius-lg);
          color: var(--color-error-600);
          font-size: var(--text-sm);
          margin-bottom: var(--space-6);
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid var(--color-success-500);
          border-radius: var(--radius-lg);
          color: var(--color-success-600);
          font-size: var(--text-sm);
          margin-bottom: var(--space-6);
        }

        .connect-button {
          width: 100%;
          height: 48px;
          font-weight: var(--font-semibold);
          font-size: var(--text-base);
          background: var(--color-canton-black);
          color: var(--color-canton-white);
          transition: transform 0.1s ease, background-color 0.2s ease;
        }

        .connect-button:hover:not(:disabled) {
           background: var(--color-neutral-800);
        }
        
        .connect-button:active:not(:disabled) {
           transform: scale(0.99);
        }

        @media (prefers-color-scheme: dark) {
           .form-logo {
             filter: invert(1);
           }
           .connect-button {
             background: var(--color-canton-white);
             color: var(--color-canton-black);
           }
           .connect-button:hover:not(:disabled) {
             background: var(--color-neutral-200);
           }
        }
      `}</style>
        </div>
    );
}

export default ConnectionForm;
