/**
 * Canton Client Service
 * 
 * Client for interacting with Canton's JSON Ledger API v2.
 * Provides methods for querying contracts, transactions, parties, and packages.
 * 
 * @see https://docs.digitalasset.com/build/3.3/tutorials/json-api/canton_and_the_json_ledger_api.html
 */

import type {
    Party,
    PartyId,
    Contract,
    ContractId,
    TemplateId,
    Package,
    PackageId,
    Transaction,
    TransactionTree,
    TransactionFilter,
    LedgerOffset,
    LedgerEnd,
    ConnectionConfig,
    ConnectionStatus,
    CreatedEvent,
} from '../types/canton';

// ============================================================================
// API Response Types (internal)
// ============================================================================

interface ActiveContractsStreamItem {
    offset: LedgerOffset;
    workflowId?: string;
    contractEntry?: {
        createdEvent?: CreatedEvent;
    };
}

interface TransactionsStreamItem {
    transaction?: Transaction;
    transactionTree?: TransactionTree;
}

// ============================================================================
// Canton Client Class
// ============================================================================

export class CantonClient {
    private endpoint: string;
    private headers: HeadersInit;

    constructor(config: ConnectionConfig) {
        this.endpoint = config.endpoint.replace(/\/$/, ''); // Remove trailing slash
        this.headers = {
            'Content-Type': 'application/json',
            ...(config.authToken && { Authorization: `Bearer ${config.authToken}` }),
        };
    }

    // ==========================================================================
    // Private Helpers
    // ==========================================================================

    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.endpoint}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage: string;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.message || errorJson.error || errorBody;
            } catch {
                errorMessage = errorBody || response.statusText;
            }
            throw new CantonAPIError(response.status, errorMessage, path);
        }

        const text = await response.text();
        if (!text) {
            return {} as T;
        }
        return JSON.parse(text);
    }

    private async get<T>(path: string): Promise<T> {
        return this.request<T>(path, { method: 'GET' });
    }

    private async post<T>(path: string, body: unknown): Promise<T> {
        return this.request<T>(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    // ==========================================================================
    // Connection & Health
    // ==========================================================================

    /**
     * Ping the ledger to check connectivity and get the current ledger end.
     */
    async ping(): Promise<LedgerEnd> {
        return this.get<LedgerEnd>('/v2/state/ledger-end');
    }

    /**
     * Get the current connection status.
     */
    async getConnectionStatus(): Promise<ConnectionStatus> {
        try {
            const ledgerEnd = await this.ping();
            return {
                connected: true,
                endpoint: this.endpoint,
                ledgerEnd: ledgerEnd.offset,
            };
        } catch (error) {
            return {
                connected: false,
                endpoint: this.endpoint,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // ==========================================================================
    // Party Management
    // ==========================================================================

    /**
     * Get all parties known to this participant.
     */
    async getParties(): Promise<Party[]> {
        const response = await this.get<{ partyDetails: Party[] }>('/v2/parties');
        return response.partyDetails || [];
    }

    /**
     * Allocate a new party with the given hint.
     */
    async allocateParty(
        partyIdHint: string,
        displayName?: string
    ): Promise<Party> {
        return this.post<Party>('/v2/parties', {
            partyIdHint,
            displayName: displayName || partyIdHint,
            identityProviderId: '',
        });
    }

    // ==========================================================================
    // Active Contracts Service (ACS)
    // ==========================================================================

    /**
     * Get all active contracts for a party, optionally filtered by template.
     */
    async getActiveContracts(
        partyId: PartyId,
        options: {
            templateIds?: TemplateId[];
            offset?: LedgerOffset;
            verbose?: boolean;
        } = {}
    ): Promise<Contract[]> {
        const filter = this.buildTransactionFilter(partyId, options.templateIds);

        const request = {
            filter,
            verbose: options.verbose ?? false,
            activeAtOffset: options.offset,
            eventFormat: null,
        };

        const response = await this.post<ActiveContractsStreamItem[]>(
            '/v2/state/active-contracts',
            request
        );

        // Transform response to Contract[]
        const contracts: Contract[] = [];
        for (const item of response) {
            if (item.contractEntry?.createdEvent) {
                const event = item.contractEntry.createdEvent;
                contracts.push(this.eventToContract(event, item.offset));
            }
        }

        return contracts;
    }

    /**
     * Get a specific contract by ID.
     */
    async getContract(
        contractId: ContractId,
        partyId: PartyId
    ): Promise<Contract | null> {
        // Use event query service to find the contract
        try {
            const response = await this.post<{ created?: CreatedEvent }>(
                '/v2/events/contract',
                {
                    contractId,
                    requestingParties: [partyId],
                }
            );

            if (response.created) {
                return this.eventToContract(response.created, response.created.offset);
            }
            return null;
        } catch (error) {
            if (error instanceof CantonAPIError && error.status === 404) {
                return null;
            }
            throw error;
        }
    }

    // ==========================================================================
    // Transaction Service
    // ==========================================================================

    /**
     * Get transactions for a party within an offset range.
     */
    async getTransactions(
        partyId: PartyId,
        options: {
            templateIds?: TemplateId[];
            beginOffset?: LedgerOffset;
            endOffset?: LedgerOffset;
            limit?: number;
        } = {}
    ): Promise<Transaction[]> {
        const filter = this.buildTransactionFilter(partyId, options.templateIds);

        const request = {
            filter,
            beginExclusive: options.beginOffset ?? 0,
            endInclusive: options.endOffset,
            verbose: true,
        };

        const response = await this.post<TransactionsStreamItem[]>(
            '/v2/updates/transactions',
            request
        );

        const transactions: Transaction[] = [];
        for (const item of response) {
            if (item.transaction) {
                transactions.push(item.transaction);
            }
        }

        return options.limit
            ? transactions.slice(0, options.limit)
            : transactions;
    }

    /**
     * Get transaction trees (with full event hierarchy).
     */
    async getTransactionTrees(
        partyId: PartyId,
        options: {
            templateIds?: TemplateId[];
            beginOffset?: LedgerOffset;
            endOffset?: LedgerOffset;
            limit?: number;
        } = {}
    ): Promise<TransactionTree[]> {
        const filter = this.buildTransactionFilter(partyId, options.templateIds);

        const request = {
            filter,
            beginExclusive: options.beginOffset ?? 0,
            endInclusive: options.endOffset,
            verbose: true,
        };

        const response = await this.post<TransactionsStreamItem[]>(
            '/v2/updates/transaction-trees',
            request
        );

        const trees: TransactionTree[] = [];
        for (const item of response) {
            if (item.transactionTree) {
                trees.push(item.transactionTree);
            }
        }

        return options.limit ? trees.slice(0, options.limit) : trees;
    }

    /**
     * Get a single transaction by update ID.
     */
    async getTransaction(
        updateId: string,
        partyId: PartyId
    ): Promise<Transaction | null> {
        try {
            return await this.post<Transaction>('/v2/updates/transaction-by-id', {
                updateId,
                requestingParties: [partyId],
            });
        } catch (error) {
            if (error instanceof CantonAPIError && error.status === 404) {
                return null;
            }
            throw error;
        }
    }

    // ==========================================================================
    // Package Service
    // ==========================================================================

    /**
     * List all uploaded packages.
     */
    async listPackages(): Promise<PackageId[]> {
        const response = await this.get<{ packageIds: PackageId[] }>(
            '/v2/packages'
        );
        return response.packageIds || [];
    }

    /**
     * Get package metadata by ID.
     */
    async getPackage(packageId: PackageId): Promise<Package | null> {
        try {
            return await this.get<Package>(`/v2/packages/${packageId}`);
        } catch (error) {
            if (error instanceof CantonAPIError && error.status === 404) {
                return null;
            }
            throw error;
        }
    }

    // ==========================================================================
    // Utility Methods
    // ==========================================================================

    /**
     * Build a transaction filter for the given party and templates.
     */
    private buildTransactionFilter(
        partyId: PartyId,
        templateIds?: TemplateId[]
    ): TransactionFilter {
        if (!templateIds || templateIds.length === 0) {
            // Wildcard filter - get all templates
            return {
                filtersByParty: {},
                filtersForAnyParty: {
                    cumulative: [
                        {
                            identifierFilter: {
                                WildcardFilter: {
                                    value: {
                                        includeCreatedEventBlob: true,
                                    },
                                },
                            },
                        },
                    ],
                },
            };
        }

        // Template-specific filter
        return {
            filtersByParty: {
                [partyId]: {
                    cumulative: templateIds.map((templateId) => ({
                        identifierFilter: {
                            TemplateFilter: {
                                value: {
                                    templateId,
                                    includeCreatedEventBlob: true,
                                },
                            },
                        },
                    })),
                },
            },
        };
    }

    /**
     * Convert a CreatedEvent to a Contract object.
     */
    private eventToContract(event: CreatedEvent, offset: LedgerOffset): Contract {
        return {
            contractId: event.contractId,
            templateId: event.templateId,
            payload: event.createArguments,
            stakeholders: [...event.signatories, ...event.observers],
            observers: event.observers,
            signatories: event.signatories,
            createdAt: new Date().toISOString(), // Would come from effectiveAt in full impl
            offset,
            contractKey: event.contractKey,
            createdEventBlob: event.createdEventBlob,
        };
    }
}

// ============================================================================
// Error Classes
// ============================================================================

export class CantonAPIError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly path: string
    ) {
        super(`Canton API Error (${status}): ${message} [${path}]`);
        this.name = 'CantonAPIError';
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new Canton client instance.
 */
export function createCantonClient(config: ConnectionConfig): CantonClient {
    return new CantonClient(config);
}

// ============================================================================
// Connection Helpers
// ============================================================================

/**
 * Test connection to a Canton participant node.
 */
export async function testConnection(
    endpoint: string,
    authToken?: string
): Promise<ConnectionStatus> {
    const client = createCantonClient({ endpoint, authToken });
    return client.getConnectionStatus();
}
