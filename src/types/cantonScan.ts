/**
 * CantonScan API Types
 */

export interface CantonScanStatsEntry {
    value: number | string;
    percentChange: number;
}

export interface CantonScanPrivateUpdatesEntry {
    value: number;
    percentage: number;
    percentChange: number;
}

export interface CantonScanStatsResponse {
    totalCirculation: CantonScanStatsEntry;
    burnVolume24h: CantonScanStatsEntry;
    activeAddresses24h: CantonScanStatsEntry;
    privateUpdates24h: CantonScanPrivateUpdatesEntry;
    totalTransfers24h: CantonScanStatsEntry;
}

export interface CantonScanPriceSourceEntry {
    last_updated_at: string;
    usd: string;
}

export interface CantonScanPriceResponse {
    price: string;
    prices: {
        canton: Record<string, CantonScanPriceSourceEntry>;
    };
    symbol: string;
    timestamp: string;
    total_circulating_supply: string;
}

export interface CantonScanActivityHistoryEntry {
    roundId: number;
    timestamp: string;
    publicUpdatesCount: number;
    privateUpdatesCount: number;
}

export interface CantonScanPriceHistoryEntry {
    timestamp: string;
    price: number;
}

export interface CantonScanUpdateEvent {
    id: string;
    type: string;
    choice?: string | null;
}

export interface CantonScanUpdateEntry {
    id: string;
    createdAt: string;
    effectiveAt: string;
    recordTime: number;
    synchronizerId: string;
    migrationId: number;
    events: CantonScanUpdateEvent[];
}

export interface CantonScanUpdatesResponse {
    data: CantonScanUpdateEntry[];
    meta?: {
        hasNextPage?: boolean;
        nextCursor?: number;
    };
}

export interface CantonScanValidatorEntry {
    id: string;
    version: string | null;
    contactPoint: string | null;
    sponsor: string | null;
    lastActiveAt: string | null;
    joinedAsOfRound: number | null;
    lastActiveInRound: number | null;
    numberOfRoundsMissed: number | null;
    isSuperValidator: boolean;
    superValidatorRewardWeight: number | null;
    rewardsChange: number | null;
    rewardsTotal: number | null;
    priceVote: string | null;
}

export type CantonScanValidatorsResponse =
    | CantonScanValidatorEntry[]
    | {
          data?: CantonScanValidatorEntry[];
          validators?: CantonScanValidatorEntry[];
      };
