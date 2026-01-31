/**
 * Contracts Browser Page
 * 
 * Active Contracts Service (ACS) browser with:
 * - Template filter
 * - Field search
 * - Date range
 * - Status filter (active/archived)
 * - Paginated data grid
 * - CSV export
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Download,
    ChevronDown,
    ChevronUp,
    Copy,
    ExternalLink,
    RefreshCw,
    X,
} from 'lucide-react';
import { useContracts, usePartyLens } from '../services/store';

type SortField = 'templateId' | 'contractId' | 'createdAt' | 'offset';
type SortDirection = 'asc' | 'desc';

export function ContractsBrowser() {
    const { contracts, isLoading, error, loadContracts } = useContracts();
    const { activeParty } = usePartyLens();

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [templateFilter, setTemplateFilter] = useState<string>('');

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('offset');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Pagination state
    const [page, setPage] = useState(1);
    const pageSize = 25;

    // Load contracts on mount
    useEffect(() => {
        if (activeParty) {
            loadContracts();
        }
    }, [activeParty, loadContracts]);

    // Get unique templates for filter dropdown
    const templates = useMemo(() => {
        const templateSet = new Set(contracts.map((c) => c.templateId));
        return Array.from(templateSet).sort();
    }, [contracts]);

    // Filter and sort contracts
    const filteredContracts = useMemo(() => {
        let result = [...contracts];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.contractId.toLowerCase().includes(query) ||
                    c.templateId.toLowerCase().includes(query) ||
                    JSON.stringify(c.payload).toLowerCase().includes(query)
            );
        }

        // Apply template filter
        if (templateFilter) {
            result = result.filter((c) => c.templateId === templateFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'templateId':
                    comparison = a.templateId.localeCompare(b.templateId);
                    break;
                case 'contractId':
                    comparison = a.contractId.localeCompare(b.contractId);
                    break;
                case 'createdAt':
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case 'offset':
                    comparison = a.offset - b.offset;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [contracts, searchQuery, templateFilter, sortField, sortDirection]);

    // Paginate
    const paginatedContracts = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredContracts.slice(start, start + pageSize);
    }, [filteredContracts, page]);

    const totalPages = Math.ceil(filteredContracts.length / pageSize);

    // Sort handler
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Copy contract ID
    const copyContractId = (id: string) => {
        navigator.clipboard.writeText(id);
        // Could add a toast notification here
    };

    // Export to CSV
    const exportCSV = () => {
        const headers = ['Contract ID', 'Template', 'Created At', 'Offset', 'Stakeholders'];
        const rows = filteredContracts.map((c) => [
            c.contractId,
            c.templateId,
            c.createdAt,
            c.offset.toString(),
            c.stakeholders.join('; '),
        ]);

        const csv = [
            `# Canton LedgerView - Contracts Export`,
            `# Party: ${activeParty?.partyId || 'Unknown'}`,
            `# Generated: ${new Date().toISOString()}`,
            '',
            headers.join(','),
            ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contracts_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Clear filters
    const clearFilters = () => {
        setSearchQuery('');
        setTemplateFilter('');
        setPage(1);
    };

    const hasFilters = searchQuery || templateFilter;

    if (!activeParty) {
        return (
            <div className="empty-state">
                <h2 className="empty-state-title">No Party Selected</h2>
                <p className="empty-state-description">
                    Select a party to view active contracts.
                </p>
            </div>
        );
    }

    return (
        <div className="contracts-browser">
            {/* Header */}
            <div className="page-header-content">
                <div>
                    <h1 className="page-title">Active Contracts</h1>
                    <p className="page-subtitle">
                        {filteredContracts.length} contracts
                        {hasFilters && ` (filtered from ${contracts.length})`}
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => loadContracts()}
                        disabled={isLoading}
                    >
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                        Refresh
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={exportCSV}
                        disabled={filteredContracts.length === 0}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="filters-section">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search by contract ID, template, or payload..."
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => setSearchQuery('')}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="filter-controls">
                    <select
                        value={templateFilter}
                        onChange={(e) => {
                            setTemplateFilter(e.target.value);
                            setPage(1);
                        }}
                        className="template-select"
                    >
                        <option value="">All Templates</option>
                        {templates.map((t) => (
                            <option key={t} value={t}>
                                {t.split(':').pop()}
                            </option>
                        ))}
                    </select>

                    {hasFilters && (
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => loadContracts()}>Retry</button>
                </div>
            )}

            {/* Contracts Table */}
            <div className="card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('contractId')}
                                >
                                    Contract ID
                                    {sortField === 'contractId' && (
                                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </th>
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('templateId')}
                                >
                                    Template
                                    {sortField === 'templateId' && (
                                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </th>
                                <th>Stakeholders</th>
                                <th
                                    className="sortable"
                                    onClick={() => handleSort('offset')}
                                >
                                    Offset
                                    {sortField === 'offset' && (
                                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                    )}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && paginatedContracts.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton" style={{ width: '120px', height: '20px' }} /></td>
                                        <td><div className="skeleton" style={{ width: '150px', height: '20px' }} /></td>
                                        <td><div className="skeleton" style={{ width: '100px', height: '20px' }} /></td>
                                        <td><div className="skeleton" style={{ width: '60px', height: '20px' }} /></td>
                                        <td><div className="skeleton" style={{ width: '80px', height: '20px' }} /></td>
                                    </tr>
                                ))
                            ) : paginatedContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="empty-cell">
                                        {hasFilters ? 'No contracts match your filters' : 'No active contracts found'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedContracts.map((contract) => (
                                    <tr key={contract.contractId}>
                                        <td>
                                            <div className="contract-id-cell">
                                                <code className="mono truncate">
                                                    {contract.contractId.substring(0, 16)}...
                                                </code>
                                                <button
                                                    className="copy-btn"
                                                    onClick={() => copyContractId(contract.contractId)}
                                                    title="Copy full contract ID"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="template-cell">
                                                <span className="template-name">
                                                    {contract.templateId.split(':').pop()}
                                                </span>
                                                <span className="template-package mono text-xs text-tertiary">
                                                    {contract.templateId.split(':').slice(0, -1).join(':')}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="stakeholders-cell">
                                                {contract.stakeholders.slice(0, 2).map((s, i) => (
                                                    <span key={i} className="badge badge-neutral">
                                                        {s.split('::')[0]}
                                                    </span>
                                                ))}
                                                {contract.stakeholders.length > 2 && (
                                                    <span className="badge badge-neutral">
                                                        +{contract.stakeholders.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="mono">{contract.offset.toLocaleString()}</span>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/contracts/${encodeURIComponent(contract.contractId)}`}
                                                className="btn btn-ghost btn-sm"
                                            >
                                                <ExternalLink size={14} />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        .contracts-browser {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .page-header-content {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-4);
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
        }

        .filters-section {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .search-bar {
          flex: 1;
          min-width: 280px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-bar .search-icon {
          position: absolute;
          left: var(--space-3);
          color: var(--text-tertiary);
        }

        .search-bar .search-input {
          width: 100%;
          padding: var(--space-2) var(--space-4);
          padding-left: var(--space-10);
          padding-right: var(--space-10);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
        }

        .search-clear {
          position: absolute;
          right: var(--space-3);
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: var(--space-1);
        }

        .search-clear:hover {
          color: var(--text-primary);
        }

        .filter-controls {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }

        .template-select {
          padding: var(--space-2) var(--space-4);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          color: var(--text-primary);
          min-width: 200px;
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .data-table th.sortable:hover {
          background: var(--border-primary);
        }

        .contract-id-cell {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .copy-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: var(--space-1);
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        tr:hover .copy-btn {
          opacity: 1;
        }

        .copy-btn:hover {
          color: var(--accent-primary);
        }

        .template-cell {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .template-name {
          font-weight: var(--font-medium);
        }

        .template-package {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .stakeholders-cell {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-1);
        }

        .empty-cell {
          text-align: center;
          padding: var(--space-8) !important;
          color: var(--text-tertiary);
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-4);
          border-top: 1px solid var(--border-primary);
        }

        .pagination-info {
          font-size: var(--text-sm);
          color: var(--text-secondary);
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

export default ContractsBrowser;
