/**
 * Sidebar Component
 * 
 * Main navigation sidebar with:
 * - Logo/branding
 * - Navigation links
 * - Party selector
 * - Connection status
 */

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Activity,
  Package,
  Globe,
  HeartPulse,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useUI, useConnection, usePartyLens } from '../services/store';
import PartySelector from './PartySelector';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contracts', label: 'Contracts', icon: FileText },
  { path: '/transactions', label: 'Transactions', icon: Activity },
  { path: '/templates', label: 'Templates', icon: Package },
  { path: '/explorer', label: 'Scan Explorer', icon: Globe },
  { path: '/health', label: 'Node Health', icon: HeartPulse },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUI();
  const { status, disconnect } = useConnection();
  const { activeParty } = usePartyLens();

  return (
    <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">
          <img
            src="https://www.canton.network/hubfs/canton-logo-black.svg"
            alt="Canton"
            className="logo-image"
          />
          {sidebarOpen && <span className="logo-text">LedgerView</span>}
        </div>
        <button
          className="btn btn-icon btn-ghost collapse-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Party Selector */}
      {sidebarOpen && activeParty && (
        <div className="sidebar-party">
          <PartySelector />
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={label}
          >
            <Icon className="nav-item-icon" size={20} />
            {sidebarOpen && <span className="nav-item-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {status.connected ? (
          <div className="connection-indicator">
            <div className="connection-dot connected" />
            {sidebarOpen && (
              <span className="connection-text truncate">
                {new URL(status.endpoint).host}
              </span>
            )}
          </div>
        ) : (
          <div className="connection-indicator">
            <div className="connection-dot disconnected" />
            {sidebarOpen && (
              <span className="connection-text">Disconnected</span>
            )}
          </div>
        )}

        {sidebarOpen && (
          <div className="sidebar-actions">
            <NavLink to="/settings" className="nav-item" title="Settings">
              <Settings size={20} />
              <span className="nav-item-label">Settings</span>
            </NavLink>
            {status.connected ? (
              <button
                className="nav-item disconnect-btn"
                onClick={disconnect}
                title="Disconnect"
              >
                <LogOut size={20} />
                <span className="nav-item-label">Disconnect</span>
              </button>
            ) : (
              <NavLink
                to="/connect"
                className="nav-item connect-btn"
                title="Connect"
              >
                <LogOut size={20} className="rotate-180" />
                <span className="nav-item-label">Connect</span>
              </NavLink>
            )}
          </div>
        )}
      </div>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-primary);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: var(--z-sticky);
          transition: width var(--transition-normal);
        }

        .sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
          min-height: var(--header-height);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .logo-image {
          height: 28px;
          width: auto;
        }

        .logo-text {
          font-size: var(--text-lg);
          font-weight: var(--font-bold);
          color: var(--text-primary);
        }

        .collapse-btn {
          flex-shrink: 0;
        }

        .sidebar.collapsed .collapse-btn {
          margin: 0 auto;
        }

        .sidebar-party {
          padding: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--space-4) var(--space-2);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          overflow-y: auto;
        }

        .sidebar.collapsed .nav-item {
          justify-content: center;
          padding: var(--space-3);
        }

        .sidebar.collapsed .nav-item-label {
          display: none;
        }

        .sidebar-footer {
          padding: var(--space-4);
          border-top: 1px solid var(--border-primary);
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .connection-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .connection-dot.connected {
          background: var(--color-success-500);
          box-shadow: 0 0 8px var(--color-success-500);
        }

        .connection-dot.disconnected {
          background: var(--color-error-500);
        }

        .connection-text {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .sidebar-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .disconnect-btn {
          color: var(--color-error-500);
        }

        .disconnect-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error-500);
        }

        [data-theme='dark'] .logo-image {
          filter: invert(1);
        }

        .connect-btn {
          color: var(--color-success-500);
        }

        .connect-btn:hover {
          background: rgba(34, 197, 94, 0.1);
          color: var(--color-success-500);
        }

        .rotate-180 {
            transform: rotate(180deg);
        }
      `}</style>
    </aside>
  );
}

export default Sidebar;
