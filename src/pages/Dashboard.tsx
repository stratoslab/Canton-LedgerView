/**
 * Dashboard Page
 * 
 * Home dashboard showing:
 * - Connection status & metrics
 * - Top templates by activity
 * - Recent activity feed
 * - Quick stats
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Activity,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useConnection, useContracts, useTransactions, usePartyLens } from '../services/store';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  loading?: boolean;
}

function StatCard({ title, value, icon, trend, loading }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>
      <div className="stat-card-body">
        {loading ? (
          <div className="skeleton" style={{ width: '80px', height: '32px' }} />
        ) : (
          <span className="stat-card-value">{value}</span>
        )}
        {trend && (
          <div className={`stat-card-trend ${trend.value >= 0 ? 'positive' : 'negative'}`}>
            {trend.value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  type: 'create' | 'exercise' | 'archive';
  template: string;
  contractId: string;
  timestamp: string;
}

function ActivityItem({ type, template, contractId, timestamp }: ActivityItemProps) {
  const icons = {
    create: <div className="activity-icon create">+</div>,
    exercise: <div className="activity-icon exercise">→</div>,
    archive: <div className="activity-icon archive">×</div>,
  };

  const labels = {
    create: 'Created',
    exercise: 'Exercised',
    archive: 'Archived',
  };

  return (
    <div className="activity-item">
      {icons[type]}
      <div className="activity-content">
        <div className="activity-header">
          <span className="activity-type">{labels[type]}</span>
          <span className="activity-template">{template.split(':').pop()}</span>
        </div>
        <div className="activity-meta">
          <code className="activity-id">{contractId.substring(0, 16)}...</code>
          <span className="activity-time">
            <Clock size={12} />
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { status } = useConnection();
  const { activeParty } = usePartyLens();
  const { contracts, isLoading: contractsLoading, loadContracts } = useContracts();
  const { transactions, isLoading: txLoading, loadTransactions } = useTransactions();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (activeParty) {
      loadContracts();
      loadTransactions(50);
    }
  }, [activeParty, loadContracts, loadTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadContracts(), loadTransactions(50)]);
    setIsRefreshing(false);
  };

  // Calculate template stats
  const templateStats = contracts.reduce((acc, contract) => {
    const template = contract.templateId;
    acc[template] = (acc[template] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topTemplates = Object.entries(templateStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Mock recent activity from contracts (in real app, this would come from transactions)
  const recentActivity = contracts.slice(0, 5).map((c) => ({
    type: 'create' as const,
    template: c.templateId,
    contractId: c.contractId,
    timestamp: c.createdAt,
  }));

  if (!activeParty) {
    return (
      <div className="empty-state">
        <FileText className="empty-state-icon" />
        <h2 className="empty-state-title">No Party Selected</h2>
        <p className="empty-state-description">
          Select a party from the dropdown above to view the ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Overview for {activeParty.displayName || activeParty.partyId.split('::')[0]}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Active Contracts"
          value={contracts.length}
          icon={<FileText size={20} />}
          loading={contractsLoading}
        />
        <StatCard
          title="Transactions (24h)"
          value={transactions.length}
          icon={<Activity size={20} />}
          loading={txLoading}
        />
        <StatCard
          title="Templates Used"
          value={Object.keys(templateStats).length}
          icon={<Package size={20} />}
          loading={contractsLoading}
        />
        <StatCard
          title="Current Offset"
          value={status.ledgerEnd?.toLocaleString() || '—'}
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Top Templates */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Templates</h3>
            <Link to="/templates" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body">
            {topTemplates.length === 0 ? (
              <p className="text-secondary text-sm">No contracts found</p>
            ) : (
              <div className="template-list">
                {topTemplates.map(([templateId, count]) => (
                  <div key={templateId} className="template-item">
                    <div className="template-info">
                      <span className="template-name">
                        {templateId.split(':').pop()}
                      </span>
                      <span className="template-full font-mono text-xs text-tertiary">
                        {templateId}
                      </span>
                    </div>
                    <div className="template-count">
                      <span className="badge badge-info">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <Link to="/transactions" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body">
            {recentActivity.length === 0 ? (
              <p className="text-secondary text-sm">No recent activity</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((item, i) => (
                  <ActivityItem key={i} {...item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .dashboard-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
        }

        .dashboard-title {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .dashboard-subtitle {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-3);
        }

        .stat-card-title {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .stat-card-icon {
          color: var(--accent-primary);
        }

        .stat-card-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .stat-card-value {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
        }

        .stat-card-trend {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xs);
        }

        .stat-card-trend.positive {
          color: var(--color-success-500);
        }

        .stat-card-trend.negative {
          color: var(--color-error-500);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: var(--space-6);
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .template-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .template-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          min-width: 0;
        }

        .template-name {
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .template-full {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .activity-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          font-weight: var(--font-bold);
          font-size: var(--text-sm);
          flex-shrink: 0;
        }

        .activity-icon.create {
          background: rgba(34, 197, 94, 0.15);
          color: var(--color-success-500);
        }

        .activity-icon.exercise {
          background: rgba(59, 130, 246, 0.15);
          color: var(--color-info-500);
        }

        .activity-icon.archive {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-error-500);
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-1);
        }

        .activity-type {
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: var(--text-secondary);
        }

        .activity-template {
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }

        .activity-meta {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .activity-id {
          font-family: var(--font-mono);
          background: var(--bg-secondary);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }

        .activity-time {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
