/**
 * Node Health Page
 * 
 * Operations dashboard showing:
 * - Participant version
 * - Domain connectivity
 * - API status
 * - Global Synchronizer (Splice) Traffic & Status
 */

import { useEffect, useState } from 'react';
import {
    Server,
    Link2,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Clock,
    Globe,
    Zap,
    Coins,
    Settings,
} from 'lucide-react';
import { useConnection, usePartyLens, useScanStore } from '../services/store';

interface HealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    latency?: number;
    message?: string;
}

export function NodeHealth() {
    const { status, config } = useConnection();
    const { activeParty, availableParties } = usePartyLens();
    const {
        scanConfig,
        trafficStatus,
        miningRounds,
        isLoading: isScanLoading,
        error: scanError,
        setScanConfig,
        refreshScanData,
    } = useScanStore();

    const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    // Scan Settings Model
    const [showScanSettings, setShowScanSettings] = useState(false);
    const [scanUrlInput, setScanUrlInput] = useState(scanConfig.url);
    const [memberIdInput, setMemberIdInput] = useState(scanConfig.memberId);

    const runHealthChecks = async () => {
        if (!config) return;

        setIsChecking(true);
        const checks: HealthCheck[] = [];

        // Check JSON Ledger API
        try {
            const start = performance.now();
            const response = await fetch(`${config.endpoint}/v2/state/ledger-end`);
            const latency = Math.round(performance.now() - start);

            checks.push({
                name: 'JSON Ledger API',
                status: response.ok ? 'healthy' : 'degraded',
                latency,
                message: response.ok ? `Offset: ${status.ledgerEnd}` : 'Connection issue',
            });
        } catch (error) {
            checks.push({
                name: 'JSON Ledger API',
                status: 'unhealthy',
                message: 'Unable to connect',
            });
        }

        // Check parties endpoint
        try {
            const start = performance.now();
            const response = await fetch(`${config.endpoint}/v2/parties`);
            const latency = Math.round(performance.now() - start);

            checks.push({
                name: 'Party Management',
                status: response.ok ? 'healthy' : 'degraded',
                latency,
                message: response.ok ? `${availableParties.length} parties` : 'Access issue',
            });
        } catch (error) {
            checks.push({
                name: 'Party Management',
                status: 'unhealthy',
                message: 'Unable to query parties',
            });
        }

        // Check packages endpoint
        try {
            const start = performance.now();
            const response = await fetch(`${config.endpoint}/v2/packages`);
            const latency = Math.round(performance.now() - start);

            checks.push({
                name: 'Package Service',
                status: response.ok ? 'healthy' : 'degraded',
                latency,
                message: response.ok ? 'Available' : 'Access issue',
            });
        } catch (error) {
            checks.push({
                name: 'Package Service',
                status: 'degraded',
                message: 'Unable to query packages',
            });
        }

        setHealthChecks(checks);
        setLastCheck(new Date());
        setIsChecking(false);
    };

    // Initial load
    useEffect(() => {
        if (config) {
            runHealthChecks();
        }
        refreshScanData();
    }, [config]);

    const handleSaveScanSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setScanConfig(scanUrlInput, memberIdInput);
        setShowScanSettings(false);
    };

    const statusIcon = (s: HealthCheck['status']) => {
        switch (s) {
            case 'healthy':
                return <CheckCircle size={18} className="status-icon healthy" />;
            case 'degraded':
                return <AlertCircle size={18} className="status-icon degraded" />;
            case 'unhealthy':
                return <XCircle size={18} className="status-icon unhealthy" />;
            default:
                return <AlertCircle size={18} className="status-icon unknown" />;
        }
    };

    if (!config) {
        return (
            <div className="empty-state">
                <Server className="empty-state-icon" />
                <h2 className="empty-state-title">Not Connected</h2>
                <p className="empty-state-description">
                    Connect to a participant node to view health status.
                </p>
            </div>
        );
    }

    // Amulet Logic
    const openRoundEntries = miningRounds ? Object.values(miningRounds.open_mining_rounds) : [];
    const currentRound = openRoundEntries[0]?.contract.payload;
    const amuletPrice = currentRound?.amuletPrice || '—';

    // Traffic Logic
    const traffic = trafficStatus?.traffic_status;
    const trafficUsed = traffic ? traffic.actual.total_consumed : 0;
    const trafficLimit = traffic ? traffic.actual.total_limit : 1;
    const trafficPercent = Math.min(100, Math.round((trafficUsed / trafficLimit) * 100));

    return (
        <div className="node-health-page">
            {/* Header */}
            <div className="page-header-content">
                <div>
                    <h1 className="page-title">Network Status</h1>
                    <p className="page-subtitle">
                        Participant node health and Global Synchronizer traffic
                    </p>
                </div>
                <div className="header-actions">
                    {lastCheck && (
                        <span className="last-check">
                            <Clock size={14} />
                            Last check: {lastCheck.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        className="btn btn-secondary"
                        onClick={() => { runHealthChecks(); refreshScanData(); }}
                        disabled={isChecking || isScanLoading}
                    >
                        <RefreshCw size={16} className={isChecking || isScanLoading ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Connection Info */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Local Node</h3>
                        <span className={`badge ${status.connected ? 'badge-success' : 'badge-error'}`}>
                            {status.connected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Endpoint</span>
                                <code className="info-value">{config.endpoint}</code>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Current Offset</span>
                                <span className="info-value">
                                    {status.ledgerEnd?.toLocaleString() || '—'}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Active Party</span>
                                <span className="info-value">
                                    {activeParty?.displayName || activeParty?.partyId.split('::')[0] || '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Synchronizer (Splice) */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Global Synchronizer</h3>
                        <button className="icon-button" onClick={() => setShowScanSettings(!showScanSettings)} title="Settings">
                            <Settings size={16} />
                        </button>
                    </div>

                    {showScanSettings && (
                        <form onSubmit={handleSaveScanSettings} className="scan-settings-form">
                            <div className="form-group">
                                <label>Scan API URL</label>
                                <input
                                    type="text"
                                    value={scanUrlInput}
                                    onChange={e => setScanUrlInput(e.target.value)}
                                    className="input text-xs"
                                />
                            </div>
                            <div className="form-group">
                                <label>Member ID (for Traffic)</label>
                                <input
                                    type="text"
                                    value={memberIdInput}
                                    onChange={e => setMemberIdInput(e.target.value)}
                                    className="input text-xs"
                                    placeholder="participant::..."
                                />
                            </div>
                            <button type="submit" className="btn btn-xs btn-primary">Save</button>
                        </form>
                    )}

                    <div className="card-body">
                        {scanError ? (
                            <div className="error-message text-xs">{scanError}</div>
                        ) : (
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label"><Globe size={12} /> Network Status</span>
                                    <span className="info-value">
                                        {miningRounds ? 'Online' : isScanLoading ? 'Checking...' : 'Unknown'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label"><Coins size={12} /> Amulet Price</span>
                                    <span className="info-value">{amuletPrice} USD</span>
                                </div>
                                <div className="info-item full-width">
                                    <span className="info-label"><Zap size={12} /> Traffic Credits</span>
                                    <div className="traffic-bar-container">
                                        <div className="traffic-bar" style={{ width: `${trafficPercent}%` }}></div>
                                    </div>
                                    <span className="info-value text-xs">
                                        {traffic ? `${(traffic.actual.total_consumed / 1000).toFixed(1)}k / ${(traffic.actual.total_limit / 1000).toFixed(0)}k` : 'Not monitored'}
                                    </span>
                                </div>
                            </div>
                        )}
                        {!scanConfig.memberId && !showScanSettings && (
                            <div className="text-xs text-secondary mt-2">
                                Configure Member ID to view traffic.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Health Checks */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Service Health</h3>
                </div>
                <div className="card-body">
                    {healthChecks.length === 0 && isChecking ? (
                        <div className="checking-state">
                            <div className="spinner" />
                            <span>Running health checks...</span>
                        </div>
                    ) : (
                        <div className="health-checks">
                            {healthChecks.map((check) => (
                                <div key={check.name} className="health-check-item">
                                    <div className="check-status">
                                        {statusIcon(check.status)}
                                        <span className="check-name">{check.name}</span>
                                    </div>
                                    <div className="check-details">
                                        {check.latency && (
                                            <span className="check-latency">{check.latency}ms</span>
                                        )}
                                        {check.message && (
                                            <span className="check-message">{check.message}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .node-health-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: var(--space-6);
        }

        /* ... Reuse styles from components ... */
        .page-header-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .page-title {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .page-subtitle {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: var(--space-4);
        }

        .last-check {
            font-size: var(--text-xs);
            color: var(--text-tertiary);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--space-4);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }
        
        .info-item.full-width {
            grid-column: 1 / -1;
        }

        .info-label {
            font-size: var(--text-xs);
            font-weight: var(--font-medium);
            color: var(--text-tertiary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .info-value {
            font-size: var(--text-sm);
            color: var(--text-primary);
            font-feature-settings: "tnum";
        }

        .scan-settings-form {
            padding: var(--space-4);
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            gap: var(--space-3);
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .form-group label {
            font-size: var(--text-xs);
            color: var(--text-secondary);
        }
        
        .traffic-bar-container {
            width: 100%;
            height: 6px;
            background: var(--bg-tertiary);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 4px;
        }
        
        .traffic-bar {
            height: 100%;
            background: var(--color-canton-primary);
            transition: width 0.3s ease;
        }

        .btn-xs {
            padding: 4px 12px;
            font-size: 11px;
            align-self: flex-end;
        }
        
        .icon-button {
            background: none;
            border: none;
            color: var(--text-tertiary);
            cursor: pointer;
            padding: 4px;
        }
        .icon-button:hover {
            color: var(--text-primary);
        }
        
        /* Reuse Check Item Styles */
        .health-checks {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .health-check-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }
        .check-status {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .check-name {
            font-weight: var(--font-medium);
            font-size: var(--text-sm);
        }
        .check-details {
            display: flex;
            gap: var(--space-3);
            font-size: var(--text-xs);
            color: var(--text-secondary);
        }
        .status-icon.healthy { color: var(--color-success-500); }
        .status-icon.degraded { color: var(--color-warning-500); }
        .status-icon.unhealthy { color: var(--color-error-500); }
        .status-icon.unknown { color: var(--text-tertiary); }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

export default NodeHealth;
