/**
 * Canton LedgerView - Type Definitions
 * 
 * Core TypeScript types for Canton/Daml entities based on:
 * - JSON Ledger API v2
 * - Ledger API gRPC proto definitions
 * - Admin API
 */

// ============================================================================
// Identifiers
// ============================================================================

/** Party identifier in Canton format: DisplayName::fingerprint */
export type PartyId = string;

/** Contract identifier - unique across the ledger */
export type ContractId = string;

/** Template identifier: packageId:modulePath:templateName */
export type TemplateId = string;

/** Package identifier (hash) */
export type PackageId = string;

/** Transaction/Update identifier */
export type UpdateId = string;

/** Command identifier for deduplication */
export type CommandId = string;

/** Workflow identifier for grouping related transactions */
export type WorkflowId = string;

/** Ledger offset - opaque string for ordering */
export type LedgerOffset = number;

// ============================================================================
// Core Entities
// ============================================================================

/** Party representation */
export interface Party {
    partyId: PartyId;
    displayName?: string;
    isLocal: boolean;
    identityProviderId?: string;
}

/** Contract data */
export interface Contract {
    contractId: ContractId;
    templateId: TemplateId;
    payload: Record<string, unknown>;
    stakeholders: PartyId[];
    observers: PartyId[];
    signatories: PartyId[];
    createdAt: string;
    offset: LedgerOffset;
    contractKey?: unknown;
    createdEventBlob?: string;
}

/** Archived contract reference */
export interface ArchivedContract {
    contractId: ContractId;
    templateId: TemplateId;
    offset: LedgerOffset;
    archivedAt: string;
}

/** Template metadata */
export interface Template {
    templateId: TemplateId;
    packageId: PackageId;
    moduleName: string;
    entityName: string;
    choices: Choice[];
}

/** Choice on a template */
export interface Choice {
    name: string;
    consuming: boolean;
    selfConsuming: boolean;
    controllers: string[];
    observers: string[];
    argType: DamlType;
    returnType: DamlType;
}

/** Package information */
export interface Package {
    packageId: PackageId;
    packageSize: number;
    knownSince: string;
    sourceDescription: string;
}

// ============================================================================
// Events
// ============================================================================

export type Event = CreatedEvent | ExercisedEvent | ArchivedEvent;

export interface BaseEvent {
    eventId: string;
    contractId: ContractId;
    templateId: TemplateId;
    offset: LedgerOffset;
    nodeId: number;
}

export interface CreatedEvent extends BaseEvent {
    type: 'created';
    createArguments: Record<string, unknown>;
    contractKey?: unknown;
    signatories: PartyId[];
    observers: PartyId[];
    createdEventBlob?: string;
}

export interface ExercisedEvent extends BaseEvent {
    type: 'exercised';
    choice: string;
    choiceArgument: unknown;
    actingParties: PartyId[];
    consuming: boolean;
    childEventIds: string[];
    exerciseResult?: unknown;
}

export interface ArchivedEvent extends BaseEvent {
    type: 'archived';
}

// ============================================================================
// Transactions
// ============================================================================

export interface Transaction {
    updateId: UpdateId;
    offset: LedgerOffset;
    effectiveAt: string;
    commandId?: CommandId;
    workflowId?: WorkflowId;
    events: Event[];
}

export interface TransactionTree extends Transaction {
    rootEventIds: string[];
    eventsById: Record<string, Event>;
}

// ============================================================================
// Filters and Queries
// ============================================================================

export interface TransactionFilter {
    filtersByParty: Record<PartyId, PartyFilter>;
    filtersForAnyParty?: AnyPartyFilter;
}

export interface PartyFilter {
    cumulative?: IdentifierFilter[];
}

export interface AnyPartyFilter {
    cumulative: IdentifierFilter[];
}

export interface IdentifierFilter {
    identifierFilter: WildcardFilter | TemplateFilter | InterfaceFilter;
}

export interface WildcardFilter {
    WildcardFilter: {
        value: {
            includeCreatedEventBlob?: boolean;
        };
    };
}

export interface TemplateFilter {
    TemplateFilter: {
        value: {
            templateId: TemplateId;
            includeCreatedEventBlob?: boolean;
        };
    };
}

export interface InterfaceFilter {
    InterfaceFilter: {
        value: {
            interfaceId: string;
            includeInterfaceView?: boolean;
            includeCreatedEventBlob?: boolean;
        };
    };
}

export interface ContractQuery {
    templateId?: TemplateId;
    partyId?: PartyId;
    status?: 'active' | 'archived' | 'all';
    fromOffset?: LedgerOffset;
    toOffset?: LedgerOffset;
    searchText?: string;
    limit?: number;
}

export interface TransactionQuery {
    partyId?: PartyId;
    templateIds?: TemplateId[];
    fromOffset?: LedgerOffset;
    toOffset?: LedgerOffset;
    fromDate?: string;
    toDate?: string;
    commandId?: CommandId;
    workflowId?: WorkflowId;
    limit?: number;
}

// ============================================================================
// API Responses
// ============================================================================

export interface LedgerEnd {
    offset: LedgerOffset;
}

export interface ActiveContractsResponse {
    offset: LedgerOffset;
    workflowId?: WorkflowId;
    contractEntry: ContractEntry;
}

export interface ContractEntry {
    createdEvent?: CreatedEvent;
    archivedEvent?: ArchivedEvent;
}

export interface GetTransactionsResponse {
    transactions: Transaction[];
}

export interface GetPartiesResponse {
    partyDetails: Party[];
}

export interface ListPackagesResponse {
    packageIds: PackageId[];
}

// ============================================================================
// Connection & Configuration
// ============================================================================

export interface ConnectionConfig {
    endpoint: string;
    authToken?: string;
    useTls?: boolean;
    tlsCertPath?: string;
}

export interface ConnectionStatus {
    connected: boolean;
    endpoint: string;
    ledgerEnd?: LedgerOffset;
    participantId?: string;
    error?: string;
}

export interface PartyLensConfig {
    activeParty: Party | null;
    viewAsObserver: boolean;
    visibleTemplates: TemplateId[];
}

// ============================================================================
// UI State Types
// ============================================================================

export interface DashboardMetrics {
    activeContractCount: number;
    transactionCount24h: number;
    updatesPerMinute: number;
    topTemplates: TemplateActivity[];
    recentActivity: ActivityItem[];
}

export interface TemplateActivity {
    templateId: TemplateId;
    activeCount: number;
    created24h: number;
    archived24h: number;
}

export interface ActivityItem {
    type: 'create' | 'exercise' | 'archive';
    templateId: TemplateId;
    contractId: ContractId;
    timestamp: string;
    offset: LedgerOffset;
}

export interface ContractLifecycle {
    contractId: ContractId;
    createdEvent: CreatedEvent;
    exercises: ExercisedEvent[];
    archivedEvent?: ArchivedEvent;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchQuery {
    text: string;
    types?: ('contract' | 'transaction' | 'party' | 'template')[];
    limit?: number;
}

export interface SearchResult {
    type: 'contract' | 'transaction' | 'party' | 'template';
    id: string;
    label: string;
    description?: string;
    metadata?: Record<string, unknown>;
}

export interface SavedFilter {
    id: string;
    name: string;
    query: ContractQuery | TransactionQuery;
    createdAt: string;
}

// ============================================================================
// Export Types
// ============================================================================

export interface CSVExportConfig {
    filename?: string;
    includeHeader: boolean;
    dateFormat: 'iso' | 'locale';
    columns: string[];
}

export interface CSVRow {
    date: string;
    transactionId: string;
    type: 'Create' | 'Exercise' | 'Archive';
    template: string;
    contractId: string;
    counterparty: string;
    amount?: string;
    asset?: string;
    status: 'Success' | 'Failed';
}

// ============================================================================
// Daml Types (simplified)
// ============================================================================

export type DamlType =
    | { tag: 'text' }
    | { tag: 'int64' }
    | { tag: 'decimal' }
    | { tag: 'bool' }
    | { tag: 'party' }
    | { tag: 'date' }
    | { tag: 'timestamp' }
    | { tag: 'contractId'; templateId: TemplateId }
    | { tag: 'list'; elementType: DamlType }
    | { tag: 'optional'; elementType: DamlType }
    | { tag: 'map'; keyType: DamlType; valueType: DamlType }
    | { tag: 'record'; fields: Array<{ name: string; type: DamlType }> }
    | { tag: 'variant'; constructors: Array<{ name: string; type: DamlType }> }
    | { tag: 'enum'; constructors: string[] };

// ============================================================================
// Node Health Types
// ============================================================================

export interface NodeHealth {
    participantId: string;
    version: string;
    uptime: number;
    domains: DomainConnection[];
    apiStatus: APIStatus;
}

export interface DomainConnection {
    domainId: string;
    alias: string;
    status: 'connected' | 'disconnected' | 'connecting';
    sequencerConnection?: {
        endpoint: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
    };
    mediatorConnection?: {
        status: 'healthy' | 'degraded' | 'unhealthy';
    };
}

export interface APIStatus {
    ledgerApi: { available: boolean; port: number };
    jsonApi: { available: boolean; port: number };
    adminApi: { available: boolean; port: number };
}
