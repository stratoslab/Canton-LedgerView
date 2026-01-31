/**
 * Transactions Page
 * 
 * Transaction stream viewer with:
 * - Human mode: simplified event labels
 * - Raw mode: full event tree JSON
 * - Filtering by date, type, template
 */

import { useEffect, useState, useMemo } from 'react';
import {
    RefreshCw,
    ChevronDown,
    ChevronRight,
    FileText,
    Play,
    Archive,
    Code,
    Eye,
    Download,
} from 'lucide-react';
import { useTransactions, usePartyLens } from '../services/store';
import type { Transaction, Event } from '../types/canton';

type ViewMode = 'human' | 'raw';

interface EventDisplayProps {
    event: Event;
    expanded: boolean;
    onToggle: () => void;
}

function EventDisplay({ event, expanded, onToggle }: EventDisplayProps) {
    const icons = {
        created: <FileText size={16} className="event-icon create" />,
        exercised: <Play size={16} className="event-icon exercise" />,
        archived: <Archive size={16} className="event-icon archive" />,
    };

    const labels = {
        created: 'Create',
        exercised: 'Exercise',
        archived: 'Archive',
    };

    return (
        <div className={`event-item ${event.type}`}>
            <button className="event-header" onClick={onToggle}>
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {icons[event.type]}
                <span className="event-type">{labels[event.type]}</span>
                <span className="event-template">{event.templateId.split(':').pop()}</span>
                <code className="event-contract-id">{event.contractId.substring(0, 16)}...</code>
            </button>
            {expanded && (
                <div className="event-details">
                    <div className="event-field">
                        <span className="field-label">Template ID</span>
                        <code className="field-value">{event.templateId}</code>
                    </div>
                    <div className="event-field">
                        <span className="field-label">Contract ID</span>
                        <code className="field-value">{event.contractId}</code>
                    </div>
                    {event.type === 'created' && (
                        <>
                            <div className="event-field">
                                <span className="field-label">Signatories</span>
                                <span className="field-value">
                                    {event.signatories.map((s) => s.split('::')[0]).join(', ')}
                                </span>
                            </div>
                            <div className="event-field">
                                <span className="field-label">Observers</span>
                                <span className="field-value">
                                    {event.observers.length > 0
                                        ? event.observers.map((o) => o.split('::')[0]).join(', ')
                                        : '—'}
                                </span>
                            </div>
                            <div className="event-field">
                                <span className="field-label">Payload</span>
                                <pre className="field-value json">
                                    {JSON.stringify(event.createArguments, null, 2)}
                                </pre>
                            </div>
                        </>
                    )}
                    {event.type === 'exercised' && (
                        <>
                            <div className="event-field">
                                <span className="field-label">Choice</span>
                                <span className="field-value font-semibold">{event.choice}</span>
                            </div>
                            <div className="event-field">
                                <span className="field-label">Acting Parties</span>
                                <span className="field-value">
                                    {event.actingParties.map((p) => p.split('::')[0]).join(', ')}
                                </span>
                            </div>
                            <div className="event-field">
                                <span className="field-label">Consuming</span>
                                <span className={`badge ${event.consuming ? 'badge-warning' : 'badge-neutral'}`}>
                                    {event.consuming ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="event-field">
                                <span className="field-label">Choice Argument</span>
                                <pre className="field-value json">
                                    {JSON.stringify(event.choiceArgument, null, 2)}
                                </pre>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

interface TransactionRowProps {
    transaction: Transaction;
    viewMode: ViewMode;
}

function TransactionRow({ transaction, viewMode }: TransactionRowProps) {
    const [expanded, setExpanded] = useState(false);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

    const toggleEvent = (eventId: string) => {
        setExpandedEvents((prev) => {
            const next = new Set(prev);
            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }
            return next;
        });
    };

    const eventSummary = useMemo(() => {
        const counts = { created: 0, exercised: 0, archived: 0 };
        transaction.events.forEach((e) => {
            counts[e.type]++;
        });
        return counts;
    }, [transaction.events]);

    return (
        <div className="transaction-row">
            <div className="transaction-header" onClick={() => setExpanded(!expanded)}>
                <button className="expand-btn">
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>

                <div className="transaction-info">
                    <div className="transaction-id">
                        <code>{transaction.updateId.substring(0, 20)}...</code>
                    </div>
                    <div className="transaction-meta">
                        <span className="offset">Offset: {transaction.offset}</span>
                        {transaction.workflowId && (
                            <span className="workflow">Workflow: {transaction.workflowId}</span>
                        )}
                    </div>
                </div>

                <div className="event-summary">
                    {eventSummary.created > 0 && (
                        <span className="badge badge-success">+{eventSummary.created}</span>
                    )}
                    {eventSummary.exercised > 0 && (
                        <span className="badge badge-info">→{eventSummary.exercised}</span>
                    )}
                    {eventSummary.archived > 0 && (
                        <span className="badge badge-error">×{eventSummary.archived}</span>
                    )}
                </div>

                <div className="transaction-time">
                    {new Date(transaction.effectiveAt).toLocaleString()}
                </div>
            </div>

            {expanded && (
                <div className="transaction-body">
                    {viewMode === 'human' ? (
                        <div className="events-list">
                            {transaction.events.map((event) => (
                                <EventDisplay
                                    key={event.eventId}
                                    event={event}
                                    expanded={expandedEvents.has(event.eventId)}
                                    onToggle={() => toggleEvent(event.eventId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <pre className="raw-json">
                            {JSON.stringify(transaction, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

export function Transactions() {
    const { transactions, isLoading, error, loadTransactions } = useTransactions();
    const { activeParty } = usePartyLens();
    const [viewMode, setViewMode] = useState<ViewMode>('human');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    useEffect(() => {
        if (activeParty) {
            loadTransactions(100);
        }
    }, [activeParty, loadTransactions]);

    // Filter transactions by event type
    const filteredTransactions = useMemo(() => {
        if (typeFilter === 'all') return transactions;
        return transactions.filter((t) =>
            t.events.some((e) => e.type === typeFilter)
        );
    }, [transactions, typeFilter]);

    // Export to CSV
    const exportCSV = () => {
        const rows: string[] = [
            '# Canton LedgerView - Transactions Export',
            `# Party: ${activeParty?.partyId || 'Unknown'}`,
            `# Generated: ${new Date().toISOString()}`,
            '',
            'Update ID,Offset,Effective At,Event Type,Template,Contract ID,Workflow ID',
        ];

        filteredTransactions.forEach((tx) => {
            tx.events.forEach((event) => {
                rows.push([
                    `"${tx.updateId}"`,
                    tx.offset.toString(),
                    tx.effectiveAt,
                    event.type,
                    `"${event.templateId}"`,
                    `"${event.contractId}"`,
                    tx.workflowId || '',
                ].join(','));
            });
        });

        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!activeParty) {
        return (
            <div className="empty-state">
                <h2 className="empty-state-title">No Party Selected</h2>
                <p className="empty-state-description">
                    Select a party to view transactions.
                </p>
            </div>
        );
    }

    return (
        <div className="transactions-page">
            {/* Header */}
            <div className="page-header-content">
                <div>
                    <h1 className="page-title">Transactions</h1>
                    <p className="page-subtitle">
                        {filteredTransactions.length} transactions
                    </p>
                </div>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'human' ? 'active' : ''}`}
                            onClick={() => setViewMode('human')}
                        >
                            <Eye size={16} />
                            Human
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
                            onClick={() => setViewMode('raw')}
                        >
                            <Code size={16} />
                            Raw
                        </button>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => loadTransactions(100)}
                        disabled={isLoading}
                    >
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                        Refresh
                    </button>
                    <button className="btn btn-secondary" onClick={exportCSV}>
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="type-select"
                >
                    <option value="all">All Events</option>
                    <option value="created">Creates Only</option>
                    <option value="exercised">Exercises Only</option>
                    <option value="archived">Archives Only</option>
                </select>
            </div>

            {/* Error State */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => loadTransactions(100)}>Retry</button>
                </div>
            )}

            {/* Transactions List */}
            <div className="transactions-list">
                {isLoading && transactions.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="transaction-row skeleton-row">
                            <div className="skeleton" style={{ width: '100%', height: '60px' }} />
                        </div>
                    ))
                ) : filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <h3 className="empty-state-title">No Transactions</h3>
                        <p className="empty-state-description">
                            No transactions found for this party.
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map((tx) => (
                        <TransactionRow
                            key={tx.updateId}
                            transaction={tx}
                            viewMode={viewMode}
                        />
                    ))
                )}
            </div>

            <style>{`
        .transactions-page {
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

        .header-actions {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .view-toggle {
          display: flex;
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid var(--border-primary);
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .toggle-btn:hover {
          color: var(--text-primary);
        }

        .toggle-btn.active {
          background: var(--bg-secondary);
          color: var(--accent-primary);
          font-weight: var(--font-medium);
        }

        .filters-section {
          display: flex;
          gap: var(--space-4);
        }

        .type-select {
          padding: var(--space-2) var(--space-4);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .transaction-row {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .transaction-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .transaction-header:hover {
          background: var(--bg-tertiary);
        }

        .expand-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 0;
        }

        .transaction-info {
          flex: 1;
          min-width: 0;
        }

        .transaction-id code {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .transaction-meta {
          display: flex;
          gap: var(--space-4);
          margin-top: var(--space-1);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .event-summary {
          display: flex;
          gap: var(--space-1);
        }

        .transaction-time {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        .transaction-body {
          border-top: 1px solid var(--border-primary);
          padding: var(--space-4);
          background: var(--bg-tertiary);
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .event-item {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .event-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background var(--transition-fast);
        }

        .event-header:hover {
          background: var(--bg-tertiary);
        }

        .event-icon.create { color: var(--color-success-500); }
        .event-icon.exercise { color: var(--color-info-500); }
        .event-icon.archive { color: var(--color-error-500); }

        .event-type {
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .event-template {
          color: var(--text-secondary);
        }

        .event-contract-id {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          margin-left: auto;
        }

        .event-details {
          padding: var(--space-4);
          border-top: 1px solid var(--border-primary);
          background: var(--bg-tertiary);
        }

        .event-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          margin-bottom: var(--space-3);
        }

        .event-field:last-child {
          margin-bottom: 0;
        }

        .field-label {
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .field-value {
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .field-value.json {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          background: var(--bg-secondary);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          overflow-x: auto;
          max-height: 200px;
        }

        .raw-json {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          background: var(--bg-secondary);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          overflow-x: auto;
          max-height: 400px;
        }

        .skeleton-row {
          padding: var(--space-4);
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

export default Transactions;
