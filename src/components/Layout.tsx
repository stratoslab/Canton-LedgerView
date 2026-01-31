/**
 * Layout Component
 * 
 * Main application layout with:
 * - Sidebar navigation
 * - Page header with search
 * - Content area
 * - Party banner
 */

import { Outlet } from 'react-router-dom';
import { Search, Moon, Sun, Bell, Menu } from 'lucide-react';
import { useUI, usePartyLens, useConnection } from '../services/store';
import Sidebar from './Sidebar';
import PartySelector from './PartySelector';

export function Layout() {
  const { sidebarOpen, darkMode, searchQuery, setSearchQuery, toggleDarkMode, toggleSidebar } = useUI();
  const { activeParty } = usePartyLens();
  useConnection(); // Ensure connection is maintained

  // Apply dark mode
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        {/* Page Header */}
        <header className="page-header">
          <button
            className="btn btn-icon btn-ghost mobile-menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          {/* Search Bar */}
          <div className="header-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts, transactions, parties..."
              className="search-input"
            />
            <kbd className="search-shortcut">⌘K</kbd>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            <PartySelector compact />

            <button
              className="btn btn-icon btn-ghost"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="btn btn-icon btn-ghost" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Party Banner */}
        {activeParty && (
          <div className="party-context-banner">
            <span className="party-banner-warning">⚠️</span>
            <span className="party-banner-text">
              You are viewing the ledger as{' '}
              <strong>{activeParty.displayName || activeParty.partyId.split('::')[0]}</strong>.
              This is not a global network view.
            </span>
          </div>
        )}

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-left: var(--sidebar-width);
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          transition: margin-left var(--transition-normal);
          background: var(--bg-primary);
        }

        .main-content.sidebar-collapsed {
          margin-left: var(--sidebar-collapsed-width);
        }

        .page-header {
          height: var(--header-height);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: 0 var(--space-6);
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
        }

        .mobile-menu-btn {
          display: none;
        }

        .header-search {
          flex: 1;
          max-width: 480px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: var(--space-3);
          color: var(--text-tertiary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: var(--space-2) var(--space-4);
          padding-left: var(--space-10);
          padding-right: var(--space-12);
          font-size: var(--text-sm);
          color: var(--text-primary);
          background: var(--bg-tertiary);
          border: 1px solid transparent;
          border-radius: var(--radius-lg);
          outline: none;
          transition: all var(--transition-fast);
        }

        .search-input:focus {
          background: var(--bg-secondary);
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-light);
        }

        .search-input::placeholder {
          color: var(--text-tertiary);
        }

        .search-shortcut {
          position: absolute;
          right: var(--space-3);
          padding: var(--space-1) var(--space-2);
          font-size: var(--text-xs);
          font-family: var(--font-sans);
          color: var(--text-tertiary);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-md);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .party-context-banner {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-6);
          background: linear-gradient(135deg, var(--color-warning-500) 0%, var(--color-warning-600) 100%);
          color: white;
          font-size: var(--text-sm);
        }

        .party-banner-warning {
          font-size: var(--text-base);
        }

        .party-banner-text strong {
          font-family: var(--font-mono);
        }

        .page-content {
          flex: 1;
          padding: var(--space-6);
          max-width: var(--max-content-width);
          width: 100%;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .main-content {
            margin-left: 0;
          }

          .mobile-menu-btn {
            display: flex;
          }
        }

        @media (max-width: 640px) {
          .page-header {
            padding: 0 var(--space-4);
          }

          .page-content {
            padding: var(--space-4);
          }

          .search-shortcut {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
