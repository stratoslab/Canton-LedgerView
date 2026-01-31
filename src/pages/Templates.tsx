/**
 * Templates Page
 * 
 * Template catalog showing:
 * - Uploaded DAR packages
 * - Templates inside each package
 * - Usage statistics
 */

import { useMemo } from 'react';
import { Package, FileText, Hash, Users } from 'lucide-react';
import { useContracts, usePartyLens } from '../services/store';

export function Templates() {
    const { contracts, isLoading } = useContracts();
    const { activeParty } = usePartyLens();

    // Group contracts by template and package
    const templateStats = useMemo(() => {
        const stats = new Map<string, {
            templateId: string;
            packageId: string;
            moduleName: string;
            templateName: string;
            count: number;
            uniqueStakeholders: Set<string>;
        }>();

        contracts.forEach((contract) => {
            const existing = stats.get(contract.templateId);
            if (existing) {
                existing.count++;
                contract.stakeholders.forEach((s) => existing.uniqueStakeholders.add(s));
            } else {
                const parts = contract.templateId.split(':');
                stats.set(contract.templateId, {
                    templateId: contract.templateId,
                    packageId: parts[0] || '',
                    moduleName: parts[1] || '',
                    templateName: parts[2] || parts[parts.length - 1] || '',
                    count: 1,
                    uniqueStakeholders: new Set(contract.stakeholders),
                });
            }
        });

        return Array.from(stats.values()).sort((a, b) => b.count - a.count);
    }, [contracts]);

    // Group by package
    const packageGroups = useMemo(() => {
        const groups = new Map<string, typeof templateStats>();
        templateStats.forEach((template) => {
            const existing = groups.get(template.packageId);
            if (existing) {
                existing.push(template);
            } else {
                groups.set(template.packageId, [template]);
            }
        });
        return Array.from(groups.entries());
    }, [templateStats]);

    if (!activeParty) {
        return (
            <div className="empty-state">
                <h2 className="empty-state-title">No Party Selected</h2>
                <p className="empty-state-description">
                    Select a party to view templates.
                </p>
            </div>
        );
    }

    return (
        <div className="templates-page">
            {/* Header */}
            <div className="page-header-content">
                <div>
                    <h1 className="page-title">Template Catalog</h1>
                    <p className="page-subtitle">
                        {templateStats.length} templates in use across {packageGroups.length} packages
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-row">
                <div className="stat-item">
                    <Package size={20} className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-value">{packageGroups.length}</span>
                        <span className="stat-label">Packages</span>
                    </div>
                </div>
                <div className="stat-item">
                    <FileText size={20} className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-value">{templateStats.length}</span>
                        <span className="stat-label">Templates</span>
                    </div>
                </div>
                <div className="stat-item">
                    <Hash size={20} className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-value">{contracts.length}</span>
                        <span className="stat-label">Total Contracts</span>
                    </div>
                </div>
            </div>

            {/* Package Groups */}
            {isLoading && templateStats.length === 0 ? (
                <div className="loading-state">
                    <div className="skeleton" style={{ width: '100%', height: '120px' }} />
                    <div className="skeleton" style={{ width: '100%', height: '120px' }} />
                </div>
            ) : packageGroups.length === 0 ? (
                <div className="empty-state">
                    <Package className="empty-state-icon" />
                    <h3 className="empty-state-title">No Templates Found</h3>
                    <p className="empty-state-description">
                        No contracts found for this party, so no templates are in use.
                    </p>
                </div>
            ) : (
                <div className="packages-list">
                    {packageGroups.map(([packageId, templates]) => (
                        <div key={packageId} className="package-card">
                            <div className="package-header">
                                <Package size={20} className="package-icon" />
                                <div className="package-info">
                                    <h3 className="package-name">Package</h3>
                                    <code className="package-id">{packageId}</code>
                                </div>
                                <span className="badge badge-neutral">
                                    {templates.length} template{templates.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="templates-grid">
                                {templates.map((template) => (
                                    <div key={template.templateId} className="template-card">
                                        <div className="template-header">
                                            <FileText size={18} className="template-icon" />
                                            <div className="template-info">
                                                <span className="template-name">{template.templateName}</span>
                                                <span className="template-module">{template.moduleName}</span>
                                            </div>
                                        </div>

                                        <div className="template-stats">
                                            <div className="template-stat">
                                                <Hash size={14} />
                                                <span>{template.count} contracts</span>
                                            </div>
                                            <div className="template-stat">
                                                <Users size={14} />
                                                <span>{template.uniqueStakeholders.size} parties</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
        .templates-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .page-header-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
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

        .stats-row {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          flex: 1;
          min-width: 150px;
        }

        .stat-icon {
          color: var(--accent-primary);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--text-primary);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .packages-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .package-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .package-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
          background: var(--bg-tertiary);
        }

        .package-icon {
          color: var(--accent-primary);
        }

        .package-info {
          flex: 1;
          min-width: 0;
        }

        .package-name {
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .package-id {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-4);
          padding: var(--space-4);
        }

        .template-card {
          padding: var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .template-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .template-icon {
          color: var(--text-secondary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .template-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          min-width: 0;
        }

        .template-name {
          font-weight: var(--font-semibold);
          color: var(--text-primary);
        }

        .template-module {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .template-stats {
          display: flex;
          gap: var(--space-4);
        }

        .template-stat {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }
      `}</style>
        </div>
    );
}

export default Templates;
