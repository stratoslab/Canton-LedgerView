/**
 * LedgerView Store
 * 
 * Global state management using Zustand for:
 * - Connection configuration
 * - Party lens (active party, visibility settings)
 * - Cached data (contracts, transactions)
 * - UI state (filters, search)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    Party,
    Contract,
    Transaction,
    Template,
    ConnectionConfig,
    ConnectionStatus,
    ContractQuery,
    SavedFilter,
    LedgerOffset,
} from '../types/canton';
import {
    MemberTrafficResponse,
    OpenAndIssuingMiningRoundsResponse,
} from '../types/scan';
import { CantonClient, createCantonClient } from './cantonClient';
import { ScanClient, createScanClient } from './scanClient';

// ============================================================================
// Store State Types
// ============================================================================

interface ConnectionState {
    config: ConnectionConfig | null;
    status: ConnectionStatus;
    client: CantonClient | null;
}

interface PartyLensState {
    activeParty: Party | null;
    availableParties: Party[];
    viewAsObserver: boolean;
}

interface DataState {
    contracts: Map<string, Contract>;
    transactions: Transaction[];
    templates: Map<string, Template>;
    lastOffset: LedgerOffset;
    isLoading: boolean;
    error: string | null;
}

interface ScanState {
    scanConfig: {
        url: string;
        memberId: string;
    };
    scanClient: ScanClient | null;
    trafficStatus: MemberTrafficResponse | null;
    miningRounds: OpenAndIssuingMiningRoundsResponse | null;
    isScanLoading: boolean;
    scanError: string | null;
}

interface UIState {
    currentPage: 'dashboard' | 'contracts' | 'transactions' | 'templates' | 'health';
    contractFilters: ContractQuery;
    savedFilters: SavedFilter[];
    searchQuery: string;
    sidebarOpen: boolean;
    darkMode: boolean;
}

interface StoreState extends ConnectionState, PartyLensState, DataState, UIState, ScanState {
    // Connection actions
    connect: (config: ConnectionConfig) => Promise<boolean>;
    disconnect: () => void;
    refreshConnection: () => Promise<void>;

    // Party actions
    setActiveParty: (party: Party) => void;
    toggleObserverView: () => void;
    refreshParties: () => Promise<void>;

    // Data actions
    loadContracts: (query?: ContractQuery) => Promise<void>;
    loadTransactions: (limit?: number) => Promise<void>;
    refreshData: () => Promise<void>;
    getContract: (contractId: string) => Contract | undefined;

    // UI actions
    setCurrentPage: (page: UIState['currentPage']) => void;
    setContractFilters: (filters: Partial<ContractQuery>) => void;
    setSearchQuery: (query: string) => void;
    toggleSidebar: () => void;
    toggleDarkMode: () => void;
    saveFilter: (name: string, query: ContractQuery) => void;
    deleteFilter: (id: string) => void;

    // Scan Actions
    setScanConfig: (url: string, memberId: string) => void;
    refreshScanData: () => Promise<void>;

    // Utility
    reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialConnectionState: ConnectionState = {
    config: null,
    status: {
        connected: false,
        endpoint: '',
    },
    client: null,
};

const initialPartyState: PartyLensState = {
    activeParty: null,
    availableParties: [],
    viewAsObserver: false,
};

const initialDataState: DataState = {
    contracts: new Map(),
    transactions: [],
    templates: new Map(),
    lastOffset: 0,
    isLoading: false,
    error: null,
};

const initialScanState: ScanState = {
    scanConfig: {
        url: 'https://scan.sv-1.global.canton.network.sync.global/api/scan', // Default from docs
        memberId: '',
    },
    scanClient: null,
    trafficStatus: null,
    miningRounds: null,
    isScanLoading: false,
    scanError: null,
};

const initialUIState: UIState = {
    currentPage: 'dashboard',
    contractFilters: {},
    savedFilters: [],
    searchQuery: '',
    sidebarOpen: true,
    darkMode: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useLedgerStore = create<StoreState>()(
    persist(
        (set, get) => ({
            // Initial state
            ...initialConnectionState,
            ...initialPartyState,
            ...initialDataState,
            ...initialUIState,
            ...initialScanState,

            // ========================================
            // Connection Actions
            // ========================================

            connect: async (config: ConnectionConfig) => {
                const client = createCantonClient(config);

                set({ isLoading: true, error: null });

                try {
                    const status = await client.getConnectionStatus();

                    if (!status.connected) {
                        set({
                            status,
                            error: status.error || 'Failed to connect',
                            isLoading: false,
                        });
                        return false;
                    }

                    // Fetch available parties
                    const parties = await client.getParties();

                    set({
                        config,
                        client,
                        status,
                        availableParties: parties,
                        isLoading: false,
                        error: null,
                    });

                    return true;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
                    set({
                        status: {
                            connected: false,
                            endpoint: config.endpoint,
                            error: errorMessage,
                        },
                        error: errorMessage,
                        isLoading: false,
                    });
                    return false;
                }
            },

            disconnect: () => {
                set({
                    ...initialConnectionState,
                    ...initialPartyState,
                    ...initialDataState,
                });
            },

            refreshConnection: async () => {
                const { client, config } = get();
                if (!client || !config) return;

                try {
                    const status = await client.getConnectionStatus();
                    set({ status });
                } catch (error) {
                    set({
                        status: {
                            connected: false,
                            endpoint: config.endpoint,
                            error: error instanceof Error ? error.message : 'Connection lost',
                        },
                    });
                }
            },

            // ========================================
            // Party Actions
            // ========================================

            setActiveParty: (party: Party) => {
                set({ activeParty: party });
                // Refresh data for new party
                get().refreshData();
            },

            toggleObserverView: () => {
                set((state) => ({ viewAsObserver: !state.viewAsObserver }));
                get().refreshData();
            },

            refreshParties: async () => {
                const { client } = get();
                if (!client) return;

                try {
                    const parties = await client.getParties();
                    set({ availableParties: parties });
                } catch (error) {
                    console.error('Failed to refresh parties:', error);
                }
            },

            // ========================================
            // Data Actions
            // ========================================

            loadContracts: async (query?: ContractQuery) => {
                const { client, activeParty } = get();
                if (!client || !activeParty) return;

                set({ isLoading: true, error: null });

                try {
                    const contracts = await client.getActiveContracts(
                        activeParty.partyId,
                        {
                            templateIds: query?.templateId ? [query.templateId] : undefined,
                            offset: query?.fromOffset,
                            verbose: true,
                        }
                    );

                    const contractMap = new Map<string, Contract>();
                    for (const contract of contracts) {
                        contractMap.set(contract.contractId, contract);
                    }

                    set({
                        contracts: contractMap,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to load contracts',
                        isLoading: false,
                    });
                }
            },

            loadTransactions: async (limit = 100) => {
                const { client, activeParty, lastOffset } = get();
                if (!client || !activeParty) return;

                set({ isLoading: true, error: null });

                try {
                    const transactions = await client.getTransactions(
                        activeParty.partyId,
                        {
                            beginOffset: 0,
                            limit,
                        }
                    );

                    // Update last offset if we have transactions
                    const newLastOffset = transactions.length > 0
                        ? Math.max(...transactions.map((t) => t.offset))
                        : lastOffset;

                    set({
                        transactions,
                        lastOffset: newLastOffset,
                        isLoading: false,
                    });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to load transactions',
                        isLoading: false,
                    });
                }
            },

            refreshData: async () => {
                const { activeParty } = get();
                if (!activeParty) return;

                await Promise.all([
                    get().loadContracts(),
                    get().loadTransactions(),
                ]);
            },

            getContract: (contractId: string) => {
                return get().contracts.get(contractId);
            },

            // ========================================
            // UI Actions
            // ========================================

            setCurrentPage: (page) => {
                set({ currentPage: page });
            },

            setContractFilters: (filters) => {
                set((state) => ({
                    contractFilters: { ...state.contractFilters, ...filters },
                }));
            },

            setSearchQuery: (query) => {
                set({ searchQuery: query });
            },

            toggleSidebar: () => {
                set((state) => ({ sidebarOpen: !state.sidebarOpen }));
            },

            toggleDarkMode: () => {
                set((state) => ({ darkMode: !state.darkMode }));
            },

            saveFilter: (name, query) => {
                const newFilter: SavedFilter = {
                    id: crypto.randomUUID(),
                    name,
                    query,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    savedFilters: [...state.savedFilters, newFilter],
                }));
            },

            deleteFilter: (id) => {
                set((state) => ({
                    savedFilters: state.savedFilters.filter((f) => f.id !== id),
                }));
            },

            // ========================================
            // Scan Actions
            // ========================================

            setScanConfig: (url, memberId) => {
                set({
                    scanConfig: { url, memberId },
                    scanClient: createScanClient(url),
                });
                get().refreshScanData();
            },

            refreshScanData: async () => {
                const { scanConfig, scanClient } = get();
                // Initialize client if missing (first run)
                const client = scanClient || createScanClient(scanConfig.url);
                if (!scanClient) {
                    set({ scanClient: client });
                }

                set({ isScanLoading: true, scanError: null });

                try {
                    const [rounds, traffic] = await Promise.all([
                        client.getOpenAndIssuingMiningRounds(),
                        scanConfig.memberId
                            ? client.getMemberTraffic('global-domain', scanConfig.memberId) // Assuming global-domain for now
                            : Promise.resolve(null),
                    ]);

                    set({
                        miningRounds: rounds,
                        trafficStatus: traffic,
                        isScanLoading: false,
                    });
                } catch (error) {
                    set({
                        scanError: error instanceof Error ? error.message : 'Failed to fetch Scan data',
                        isScanLoading: false,
                    });
                }
            },

            // ========================================
            // Utility
            // ========================================

            reset: () => {
                set({
                    ...initialConnectionState,
                    ...initialPartyState,
                    ...initialDataState,
                    ...initialUIState,
                    ...initialScanState,
                    // Preserve Scan Config
                    scanConfig: get().scanConfig,
                });
            },
        }),
        {
            name: 'ledgerview-storage',
            // Only persist certain fields
            partialize: (state) => ({
                config: state.config,
                savedFilters: state.savedFilters,
                darkMode: state.darkMode,
                sidebarOpen: state.sidebarOpen,
                scanConfig: state.scanConfig,
            }),
        }
    )
);

// ============================================================================
// Selector Hooks
// ============================================================================

// Use shallow comparison to avoid infinite re-renders
import { useShallow } from 'zustand/react/shallow';

export const useConnection = () =>
    useLedgerStore(
        useShallow((state) => ({
            config: state.config,
            status: state.status,
            connect: state.connect,
            disconnect: state.disconnect,
        }))
    );

export const usePartyLens = () =>
    useLedgerStore(
        useShallow((state) => ({
            activeParty: state.activeParty,
            availableParties: state.availableParties,
            viewAsObserver: state.viewAsObserver,
            setActiveParty: state.setActiveParty,
            toggleObserverView: state.toggleObserverView,
        }))
    );

export const useContracts = () =>
    useLedgerStore(
        useShallow((state) => ({
            contracts: Array.from(state.contracts.values()),
            isLoading: state.isLoading,
            error: state.error,
            loadContracts: state.loadContracts,
            getContract: state.getContract,
        }))
    );

export const useTransactions = () =>
    useLedgerStore(
        useShallow((state) => ({
            transactions: state.transactions,
            isLoading: state.isLoading,
            error: state.error,
            loadTransactions: state.loadTransactions,
        }))
    );

export const useUI = () =>
    useLedgerStore(
        useShallow((state) => ({
            currentPage: state.currentPage,
            searchQuery: state.searchQuery,
            sidebarOpen: state.sidebarOpen,
            darkMode: state.darkMode,
            setCurrentPage: state.setCurrentPage,
            setSearchQuery: state.setSearchQuery,
            toggleSidebar: state.toggleSidebar,
            toggleDarkMode: state.toggleDarkMode,
        }))
    );

export const useScanStore = () =>
    useLedgerStore(
        useShallow((state) => ({
            scanConfig: state.scanConfig,
            trafficStatus: state.trafficStatus,
            miningRounds: state.miningRounds,
            isLoading: state.isScanLoading,
            error: state.scanError,
            setScanConfig: state.setScanConfig,
            refreshScanData: state.refreshScanData,
        }))
    );
