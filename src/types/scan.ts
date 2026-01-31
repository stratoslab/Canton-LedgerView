/**
 * Splice Scan API Types
 * 
 * Type definitions for the Splice Scan API (Global Synchronizer state).
 * @see https://docs.sync.global/app_dev/scan_api/scan_current_state_api.html
 */

import { ContractId, TemplateId } from './canton';

// ============================================================================
// Response Wrappers
// ============================================================================

export interface ScanResponse<T> {
    data: T;
}

// ============================================================================
// Traffic & Validator State
// ============================================================================

export interface TrafficStatus {
    actual: {
        total_consumed: number;
        total_limit: number;
    };
    target: {
        total_purchased: number;
    };
}

export interface MemberTrafficResponse {
    traffic_status: TrafficStatus;
}

// ============================================================================
// Mining Rounds (Amulet)
// ============================================================================

export interface Round {
    number: string;
}

export interface RoundTime {
    microseconds: string;
}

export interface SpliceContract<P> {
    template_id: TemplateId;
    contract_id: ContractId;
    payload: P;
}

export interface OpenMiningRoundPayload {
    dso: string;
    tickDuration: RoundTime;
    issuingFor: RoundTime;
    amuletPrice: string; // e.g. "0.005" (USD per Amulet)
    opensAt: string; // ISO Date
    targetClosesAt: string; // ISO Date
    round: Round;
    // ... other config fields omitted for brevity
}

export interface IssuingMiningRoundPayload {
    dso: string;
    opensAt: string;
    targetClosesAt: string;
    round: Round;
    optIssuancePerValidatorFaucetCoupon: string;
    issuancePerFeaturedAppRewardCoupon: string;
    // ... expenses fields
}

export interface MiningRoundEntry<T> {
    contract: SpliceContract<T>;
    domain_id: string;
}

export interface OpenAndIssuingMiningRoundsResponse {
    time_to_live_in_microseconds: number;
    open_mining_rounds: Record<ContractId, MiningRoundEntry<OpenMiningRoundPayload>>;
    issuing_mining_rounds: Record<ContractId, MiningRoundEntry<IssuingMiningRoundPayload>>;
}
