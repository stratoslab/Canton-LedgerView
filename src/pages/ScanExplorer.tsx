/**
 * Scan Explorer Page
 *
 * Provides a network overview and recent activity using the Scan API.
 */

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Globe, Coins, Layers, Activity, LineChart } from 'lucide-react';
import {
    createScanClient,
    fetchCantonScanStats,
    fetchCantonScanPrice,
    fetchCantonScanUpdates,
    fetchCantonScanActivityHistory,
    fetchCantonScanPriceHistory,
    fetchCantonScanValidators,
} from '../services/scanClient';
import { useScanStore, useLedgerStore } from '../services/store';
import type { ScanDomainEntry, ScanUpdateSummary, ScanScansResponse, ScanUpdatesResponse } from '../types/scan';
import type {
    CantonScanStatsResponse,
    CantonScanPriceResponse,
    CantonScanUpdatesResponse,
    CantonScanActivityHistoryEntry,
    CantonScanPriceHistoryEntry,
    CantonScanValidatorsResponse,
    CantonScanValidatorEntry,
} from '../types/cantonScan';

interface TransferEvent {
    updateId: string;
    label: string;
    age: string;
}

const formatShortId = (id: string, head = 10, tail = 8) => {
    if (id.length <= head + tail) return id;
    return `${id.slice(0, head)}...${id.slice(-tail)}`;
};

const formatAge = (isoTime: string) => {
    const diff = Date.now() - new Date(isoTime).getTime();
    const seconds = Math.max(0, Math.floor(diff / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const summarizeUpdate = (update: ScanUpdateSummary) => {
    const eventIds = update.root_event_ids ?? [];
    const events = eventIds
        .map((id) => update.events_by_id?.[id])
        .filter(Boolean)
        .map((event) => event.choice || event.template_id?.split(':').pop() || 'Event');
    const totalEvents = Object.keys(update.events_by_id || {}).length;
    return {
        labels: events.slice(0, 3),
        extraCount: Math.max(0, totalEvents - events.slice(0, 3).length),
        totalEvents,
    };
};

const extractTransfers = (updates: ScanUpdateSummary[]): TransferEvent[] => {
    const transfers: TransferEvent[] = [];

    updates.forEach((update) => {
        Object.values(update.events_by_id || {}).forEach((event) => {
            const label = event.choice || event.template_id?.split(':').pop() || '';
            if (!label) return;
            if (!label.toLowerCase().includes('transfer')) return;

            transfers.push({
                updateId: update.update_id,
                label,
                age: formatAge(update.record_time),
            });
        });
    });

    return transfers.slice(0, 8);
};

export function ScanExplorer() {
    const { scanConfig, miningRounds, refreshScanData, isLoading: scanLoading, error: scanError } = useScanStore();
    const [scans, setScans] = useState<ScanDomainEntry[]>([]);
    const [updates, setUpdates] = useState<ScanUpdateSummary[]>([]);
    const [stats, setStats] = useState<CantonScanStatsResponse | null>(null);
    const [price, setPrice] = useState<CantonScanPriceResponse | null>(null);
    const [cantonScanUpdates, setCantonScanUpdates] = useState<CantonScanUpdatesResponse | null>(null);
    const [activityHistory, setActivityHistory] = useState<CantonScanActivityHistoryEntry[]>([]);
    const [priceHistory, setPriceHistory] = useState<CantonScanPriceHistoryEntry[]>([]);
    const [validators, setValidators] = useState<CantonScanValidatorEntry[]>([]);
    const [activityPeriod, setActivityPeriod] = useState<'24h' | '7d' | '1m'>('24h');
    const [pricePeriod, setPricePeriod] = useState<'24h' | '7d' | '1m'>('24h');
    const [validatorsPeriod, setValidatorsPeriod] = useState<'24h' | '7d' | '1m'>('24h');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scanClient = useMemo(() => createScanClient(scanConfig.url), [scanConfig.url]);

    const fetchExplorerData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const results = await Promise.allSettled([
                scanClient.getScans(),
                scanClient.getUpdates(12),
                fetchCantonScanStats(),
                fetchCantonScanPrice(),
                fetchCantonScanUpdates(6),
                fetchCantonScanActivityHistory(activityPeriod),
                fetchCantonScanPriceHistory(pricePeriod),
                fetchCantonScanValidators(validatorsPeriod),
            ]);

            // Helper to get value or default
            const getVal = <T,>(result: PromiseSettledResult<T>, defaultVal: T): T =>
                result.status === 'fulfilled' ? result.value : defaultVal;

            const scansRes = getVal<ScanScansResponse>(results[0] as PromiseSettledResult<ScanScansResponse>, { scans: [] });
            setScans(scansRes.scans || []);

            const updatesRes = getVal<ScanUpdatesResponse>(results[1] as PromiseSettledResult<ScanUpdatesResponse>, { transactions: [] });
            setUpdates(updatesRes.transactions || []);

            setStats(getVal<CantonScanStatsResponse | null>(results[2] as PromiseSettledResult<CantonScanStatsResponse>, null));
            setPrice(getVal<CantonScanPriceResponse | null>(results[3] as PromiseSettledResult<CantonScanPriceResponse>, null));
            setCantonScanUpdates(getVal<CantonScanUpdatesResponse | null>(results[4] as PromiseSettledResult<CantonScanUpdatesResponse>, null));

            const activityRes = getVal<{ data: CantonScanActivityHistoryEntry[] }>(results[5] as PromiseSettledResult<{ data: CantonScanActivityHistoryEntry[] }>, { data: [] });
            setActivityHistory(activityRes.data || []);

            const priceHistRes = getVal<{ data: CantonScanPriceHistoryEntry[] }>(results[6] as PromiseSettledResult<{ data: CantonScanPriceHistoryEntry[] }>, { data: [] });
            setPriceHistory(priceHistRes.data || []);

            const validatorsRes = getVal<CantonScanValidatorsResponse>(results[7] as PromiseSettledResult<CantonScanValidatorsResponse>, { validators: [] } as any);
            const validatorList = Array.isArray(validatorsRes)
                ? validatorsRes
                : (validatorsRes as any).data || (validatorsRes as any).validators || [];
            setValidators(validatorList);

            // Check if essential Scan API failed (first 2)
            if (results[0].status === 'rejected' && results[1].status === 'rejected') {
                throw new Error('Could not connect to Scan API. Please check your network or URL.');
            }

        } catch (err) {
            console.error('Explorer data fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch Scan data');
        } finally {
            setIsLoading(false);
        }
    };

    // Force fix for broken URL using the hook action
    useEffect(() => {
        if (scanConfig.url === 'https://scan.bs.amulet.global/api/scan') {
            refreshScanData();
            // Use store directly to update config persistantly
            useLedgerStore.getState().setScanConfig(
                'https://scan.sv-1.global.canton.network.sync.global/api/scan',
                scanConfig.memberId
            );
            // Trigger a reload after fix to ensure fresh state
            window.location.reload();
        }
    }, [scanConfig.url, scanConfig.memberId]);

    useEffect(() => {
        refreshScanData();
        fetchExplorerData();
    }, [scanConfig.url, activityPeriod, pricePeriod, validatorsPeriod]);

    const openRounds = miningRounds ? Object.values(miningRounds.open_mining_rounds) : [];
    const issuingRounds = miningRounds ? Object.values(miningRounds.issuing_mining_rounds) : [];
    const ccPrice = price?.price || openRounds[0]?.contract.payload.amuletPrice || '—';
    const scanCount = scans.reduce((total, entry) => total + entry.scans.length, 0);
    const transfers = extractTransfers(updates);
    const latestUpdates = cantonScanUpdates?.data || [];
    const activityMax = activityHistory.length
        ? Math.max(...activityHistory.map((entry) => entry.publicUpdatesCount + entry.privateUpdatesCount))
        : 0;
    const priceMax = priceHistory.length
        ? Math.max(...priceHistory.map((entry) => entry.price))
        : 0;

    return (
        <div className="scan-explorer-page">
            <div className="page-header-content">
                <div>
                    <h1 className="page-title">Canton Scan Explorer</h1>
                    <p className="page-subtitle">Network overview and latest updates from the Global Sync Scan API</p>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        refreshScanData();
                        fetchExplorerData();
                    }}
                    disabled={isLoading || scanLoading}
                >
                    <RefreshCw size={16} className={isLoading || scanLoading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            {(error || scanError) && (
                <div className="error-banner">
                    {error || scanError}
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">CC Price</span>
                        <Coins size={18} />
                    </div>
                    <div className="stat-card-value">${ccPrice}</div>
                    <span className="stat-card-subtitle">USD per CC</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Circulation</span>
                        <LineChart size={18} />
                    </div>
                    <div className="stat-card-value">
                        {stats ? Number(stats.totalCirculation.value).toLocaleString() : '—'}
                    </div>
                    <span className="stat-card-subtitle">Circulating supply</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Burn Volume (24h)</span>
                        <LineChart size={18} />
                    </div>
                    <div className="stat-card-value">
                        {stats ? `$${Number(stats.burnVolume24h.value).toLocaleString()}` : '—'}
                    </div>
                    <span className="stat-card-subtitle">USD burned in last 24 hours</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Open Rounds</span>
                        <Layers size={18} />
                    </div>
                    <div className="stat-card-value">{openRounds.length}</div>
                    <span className="stat-card-subtitle">Mining rounds open</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Issuing Rounds</span>
                        <Layers size={18} />
                    </div>
                    <div className="stat-card-value">{issuingRounds.length}</div>
                    <span className="stat-card-subtitle">Currently issuing</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">SV Scan Endpoints</span>
                        <Globe size={18} />
                    </div>
                    <div className="stat-card-value">{scanCount}</div>
                    <span className="stat-card-subtitle">Approved scans</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Active Addresses (24h)</span>
                        <Activity size={18} />
                    </div>
                    <div className="stat-card-value">
                        {stats ? Number(stats.activeAddresses24h.value).toLocaleString() : '—'}
                    </div>
                    <span className="stat-card-subtitle">Unique addresses with activity</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-card-title">Total Transfers (24h)</span>
                        <Activity size={18} />
                    </div>
                    <div className="stat-card-value">
                        {stats ? Number(stats.totalTransfers24h.value).toLocaleString() : '—'}
                    </div>
                    <span className="stat-card-subtitle">Transfers in last 24 hours</span>
                </div>
            </div>

            <div className="grid-two">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Latest Updates</h3>
                    </div>
                    <div className="card-body">
                        {latestUpdates.length === 0 ? (
                            <div className="empty-state">No updates available yet.</div>
                        ) : (
                            <div className="table">
                                <div className="table-header">
                                    <span>Update ID</span>
                                    <span>Events</span>
                                    <span>Age</span>
                                    <span>Migration</span>
                                </div>
                                {latestUpdates.map((update) => (
                                    <div key={update.id} className="table-row">
                                        <span className="mono">{formatShortId(update.id)}</span>
                                        <span className="event-summary">
                                            {update.events.slice(0, 3).map((event) => (
                                                <span key={event.id} className="pill">
                                                    {event.choice || event.type}
                                                </span>
                                            ))}
                                            {update.events.length > 3 && (
                                                <span className="pill muted">+{update.events.length - 3}</span>
                                            )}
                                        </span>
                                        <span>{formatAge(update.createdAt)}</span>
                                        <span>{update.migrationId}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Latest Transfers</h3>
                    </div>
                    <div className="card-body">
                        {transfers.length === 0 ? (
                            <div className="empty-state">No transfer updates found yet.</div>
                        ) : (
                            <div className="table">
                                <div className="table-header">
                                    <span>Event</span>
                                    <span>Update</span>
                                    <span>Age</span>
                                </div>
                                {transfers.map((transfer, index) => (
                                    <div key={`${transfer.updateId}-${index}`} className="table-row">
                                        <span className="event-label">
                                            <Activity size={14} />
                                            {transfer.label}
                                        </span>
                                        <span className="mono">{formatShortId(transfer.updateId)}</span>
                                        <span>{transfer.age}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid-two">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Activity History</h3>
                        <div className="pill-group">
                            {(['24h', '7d', '1m'] as const).map((period) => (
                                <button
                                    key={period}
                                    className={`pill-toggle ${activityPeriod === period ? 'active' : ''}`}
                                    onClick={() => setActivityPeriod(period)}
                                >
                                    {period.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body">
                        {activityHistory.length === 0 ? (
                            <div className="empty-state">No activity history available.</div>
                        ) : (
                            <div className="bar-chart">
                                {activityHistory.map((entry) => {
                                    const total = entry.publicUpdatesCount + entry.privateUpdatesCount;
                                    const height = activityMax ? Math.max(6, (total / activityMax) * 100) : 6;
                                    const publicHeight = total ? (entry.publicUpdatesCount / total) * height : 0;
                                    const privateHeight = total ? (entry.privateUpdatesCount / total) * height : 0;
                                    return (
                                        <div key={entry.timestamp} className="bar-item">
                                            <div className="bar-wrapper">
                                                <div className="bar-private" style={{ height: `${privateHeight}%` }} />
                                                <div className="bar-public" style={{ height: `${publicHeight}%` }} />
                                            </div>
                                            <span className="bar-label">{new Date(entry.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">CC Price History</h3>
                        <div className="pill-group">
                            {(['24h', '7d', '1m'] as const).map((period) => (
                                <button
                                    key={period}
                                    className={`pill-toggle ${pricePeriod === period ? 'active' : ''}`}
                                    onClick={() => setPricePeriod(period)}
                                >
                                    {period.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body">
                        {priceHistory.length === 0 ? (
                            <div className="empty-state">No price history available.</div>
                        ) : (
                            <div className="line-chart">
                                {priceHistory.map((entry) => (
                                    <div
                                        key={entry.timestamp}
                                        className="line-point"
                                        style={{ height: `${priceMax ? (entry.price / priceMax) * 100 : 0}%` }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Validators</h3>
                    <div className="pill-group">
                        {(['24h', '7d', '1m'] as const).map((period) => (
                            <button
                                key={period}
                                className={`pill-toggle ${validatorsPeriod === period ? 'active' : ''}`}
                                onClick={() => setValidatorsPeriod(period)}
                            >
                                {period.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="card-body">
                    {validators.length === 0 ? (
                        <div className="empty-state">No validators data available.</div>
                    ) : (
                        <div className="table validators-table">
                            <div className="table-header">
                                <span>Validator</span>
                                <span>Version</span>
                                <span>Last Active</span>
                                <span>Missed</span>
                                <span>Rewards</span>
                            </div>
                            {validators.slice(0, 12).map((validator) => (
                                <div key={validator.id} className="table-row">
                                    <span className="mono">{formatShortId(validator.id)}</span>
                                    <span>{validator.version || '—'}</span>
                                    <span>{validator.lastActiveAt ? formatAge(validator.lastActiveAt) : '—'}</span>
                                    <span>{validator.numberOfRoundsMissed ?? '—'}</span>
                                    <span>
                                        {validator.rewardsTotal != null
                                            ? Number(validator.rewardsTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                            : '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Approved Scan Endpoints</h3>
                </div>
                <div className="card-body">
                    {scans.length === 0 ? (
                        <div className="empty-state">No scan endpoints discovered yet.</div>
                    ) : (
                        <div className="scan-list">
                            {scans.flatMap((entry) =>
                                entry.scans.map((scan) => (
                                    <div key={`${entry.domainId}-${scan.svName}`} className="scan-item">
                                        <div>
                                            <div className="scan-title">{scan.svName}</div>
                                            <div className="scan-domain mono">{entry.domainId}</div>
                                        </div>
                                        <a className="scan-url mono" href={scan.publicUrl} target="_blank" rel="noreferrer">
                                            {scan.publicUrl}
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .scan-explorer-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--text-tertiary);
        }

        .stat-card-title {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .stat-card-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
        }

        .stat-card-subtitle {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .grid-two {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--space-6);
        }

        .table {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 1.3fr 2fr 0.8fr 0.6fr;
          gap: var(--space-3);
          align-items: center;
        }

        .table-header {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table-row {
          background: var(--bg-tertiary);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
        }

        .event-summary {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .pill {
          background: rgba(15, 118, 110, 0.12);
          color: var(--color-success-600);
          padding: 2px 8px;
          border-radius: 999px;
          font-size: var(--text-xs);
        }

        .pill.muted {
          background: rgba(148, 163, 184, 0.18);
          color: var(--text-tertiary);
        }

        .mono {
          font-family: var(--font-mono);
        }

        .table-row .mono {
          font-size: var(--text-xs);
        }

        .event-label {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          font-weight: var(--font-medium);
        }

        .table-row:nth-child(even) {
          background: var(--bg-secondary);
        }

        .table-row .event-label svg {
          color: var(--text-tertiary);
        }

        .grid-two .table-header,
        .grid-two .table-row {
          grid-template-columns: 1.4fr 1.6fr 0.8fr 0.5fr;
        }

        .grid-two .card:nth-child(2) .table-header,
        .grid-two .card:nth-child(2) .table-row {
          grid-template-columns: 1.4fr 1.4fr 0.8fr;
        }

        .pill-group {
          display: flex;
          gap: var(--space-2);
        }

        .pill-toggle {
          border: 1px solid var(--border-primary);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border-radius: 999px;
          font-size: var(--text-xs);
          padding: 4px 10px;
          cursor: pointer;
        }

        .pill-toggle.active {
          background: var(--color-canton-primary);
          color: var(--color-canton-white);
          border-color: var(--color-canton-primary);
        }

        .bar-chart {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(18px, 1fr));
          gap: var(--space-2);
          align-items: flex-end;
          min-height: 220px;
        }

        .bar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .bar-wrapper {
          width: 100%;
          height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-tertiary);
        }

        .bar-public {
          background: var(--color-canton-primary);
        }

        .bar-private {
          background: rgba(124, 58, 237, 0.6);
        }

        .bar-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-align: center;
        }

        .line-chart {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(6px, 1fr));
          gap: 4px;
          align-items: flex-end;
          min-height: 220px;
        }

        .line-point {
          width: 100%;
          background: var(--color-canton-primary);
          border-radius: 999px 999px 0 0;
        }

        .validators-table .table-header,
        .validators-table .table-row {
          grid-template-columns: 1.4fr 0.7fr 0.9fr 0.6fr 0.8fr;
        }

        .scan-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .scan-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .scan-title {
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .scan-domain {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .scan-url {
          font-size: var(--text-xs);
          color: var(--text-primary);
          text-decoration: none;
        }

        .scan-url:hover {
          text-decoration: underline;
        }

        .error-banner {
          padding: var(--space-3) var(--space-4);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid var(--color-error-500);
          border-radius: var(--radius-lg);
          color: var(--color-error-600);
          font-size: var(--text-sm);
        }

        .empty-state {
          padding: var(--space-6);
          text-align: center;
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default ScanExplorer;
