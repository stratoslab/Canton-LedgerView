/**
 * PartySelector Component
 * 
 * Dropdown selector for choosing the active party lens.
 * Shows available parties and allows switching between them.
 */

import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Check, Eye, EyeOff } from 'lucide-react';
import { usePartyLens } from '../services/store';
import type { Party } from '../types/canton';

interface PartySelectorProps {
    compact?: boolean;
}

export function PartySelector({ compact = false }: PartySelectorProps) {
    const {
        activeParty,
        availableParties,
        viewAsObserver,
        setActiveParty,
        toggleObserverView,
    } = usePartyLens();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectParty = (party: Party) => {
        setActiveParty(party);
        setIsOpen(false);
    };

    const formatPartyId = (partyId: string): string => {
        // Format: DisplayName::fingerprint -> show DisplayName + truncated fingerprint
        const parts = partyId.split('::');
        if (parts.length === 2) {
            const displayName = parts[0];
            const fingerprint = parts[1].substring(0, 8);
            return `${displayName}::${fingerprint}...`;
        }
        return partyId.length > 24 ? `${partyId.substring(0, 24)}...` : partyId;
    };

    const getDisplayName = (party: Party): string => {
        if (party.displayName) return party.displayName;
        const parts = party.partyId.split('::');
        return parts[0] || party.partyId;
    };

    if (compact) {
        return (
            <div className="party-selector-compact" ref={dropdownRef}>
                <button
                    className="party-selector-trigger-compact"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                >
                    <User size={18} />
                    {activeParty && (
                        <span className="party-initials">
                            {getDisplayName(activeParty).charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="party-dropdown">
                        <div className="party-dropdown-header">
                            <span>Select Party</span>
                        </div>
                        <div className="party-dropdown-list">
                            {availableParties.map((party) => (
                                <button
                                    key={party.partyId}
                                    className={`party-option ${activeParty?.partyId === party.partyId ? 'active' : ''}`}
                                    onClick={() => handleSelectParty(party)}
                                >
                                    <div className="party-option-info">
                                        <span className="party-option-name">{getDisplayName(party)}</span>
                                        <span className="party-option-id">{formatPartyId(party.partyId)}</span>
                                    </div>
                                    {activeParty?.partyId === party.partyId && (
                                        <Check size={16} className="party-option-check" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <style>{compactStyles}</style>
            </div>
        );
    }

    return (
        <div className="party-selector" ref={dropdownRef}>
            <button
                className="party-selector-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="party-selector-content">
                    <User size={18} className="party-icon" />
                    <div className="party-info">
                        <span className="party-label">Viewing as</span>
                        <span className="party-name">
                            {activeParty ? getDisplayName(activeParty) : 'Select Party'}
                        </span>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    className={`chevron ${isOpen ? 'open' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="party-dropdown">
                    <div className="party-dropdown-header">
                        <span>Available Parties</span>
                        <span className="party-count">{availableParties.length}</span>
                    </div>

                    <div className="party-dropdown-list">
                        {availableParties.length === 0 ? (
                            <div className="party-empty">No parties available</div>
                        ) : (
                            availableParties.map((party) => (
                                <button
                                    key={party.partyId}
                                    className={`party-option ${activeParty?.partyId === party.partyId ? 'active' : ''}`}
                                    onClick={() => handleSelectParty(party)}
                                >
                                    <div className="party-option-info">
                                        <span className="party-option-name">{getDisplayName(party)}</span>
                                        <span className="party-option-id font-mono">{formatPartyId(party.partyId)}</span>
                                    </div>
                                    {activeParty?.partyId === party.partyId && (
                                        <Check size={16} className="party-option-check" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    <div className="party-dropdown-footer">
                        <button
                            className="observer-toggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleObserverView();
                            }}
                        >
                            {viewAsObserver ? (
                                <>
                                    <Eye size={16} />
                                    <span>Including observer contracts</span>
                                </>
                            ) : (
                                <>
                                    <EyeOff size={16} />
                                    <span>Stakeholder contracts only</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <style>{fullStyles}</style>
        </div>
    );
}

const baseStyles = `
  .party-dropdown {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    right: 0;
    min-width: 280px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-dropdown);
    overflow: hidden;
  }

  .party-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-primary);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
  }

  .party-count {
    background: var(--bg-tertiary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
  }

  .party-dropdown-list {
    max-height: 280px;
    overflow-y: auto;
  }

  .party-option {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background var(--transition-fast);
  }

  .party-option:hover {
    background: var(--bg-tertiary);
  }

  .party-option.active {
    background: var(--accent-primary-light);
  }

  .party-option-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .party-option-name {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .party-option-id {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
  }

  .party-option-check {
    color: var(--accent-primary);
  }

  .party-empty {
    padding: var(--space-6);
    text-align: center;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .party-dropdown-footer {
    border-top: 1px solid var(--border-primary);
    padding: var(--space-2);
  }

  .observer-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .observer-toggle:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;

const fullStyles = `
  .party-selector {
    position: relative;
  }

  .party-selector-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .party-selector-trigger:hover {
    border-color: var(--accent-primary);
  }

  .party-selector-content {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .party-icon {
    color: var(--accent-primary);
  }

  .party-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .party-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .party-name {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .chevron {
    color: var(--text-tertiary);
    transition: transform var(--transition-fast);
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  ${baseStyles}
`;

const compactStyles = `
  .party-selector-compact {
    position: relative;
  }

  .party-selector-trigger-compact {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    cursor: pointer;
    color: var(--text-secondary);
    transition: all var(--transition-fast);
  }

  .party-selector-trigger-compact:hover {
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }

  .party-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--accent-primary);
    color: white;
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
  }

  ${baseStyles}
`;

export default PartySelector;
