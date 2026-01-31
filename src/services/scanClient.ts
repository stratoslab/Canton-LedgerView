/**
 * Splice Scan Client
 * 
 * Client for interacting with the Splice Scan API to get global network state.
 * @see https://docs.sync.global/app_dev/scan_api/
 */

import type {
    MemberTrafficResponse,
    OpenAndIssuingMiningRoundsResponse,
} from '../types/scan';

export class ScanClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Scan API Error (${response.status}): ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get traffic status for a specific member on a specific domain.
     */
    async getMemberTraffic(domainId: string, memberId: string): Promise<MemberTrafficResponse> {
        return this.request<MemberTrafficResponse>(`/v0/domains/${domainId}/members/${memberId}/traffic-status`);
    }

    /**
     * Get currently open and issuing mining rounds.
     * Use this to get the current Amulet price and round info.
     */
    async getOpenAndIssuingMiningRounds(): Promise<OpenAndIssuingMiningRoundsResponse> {
        // Initial request is empty as per docs to get fresh state
        return this.request<OpenAndIssuingMiningRoundsResponse>('/v0/open-and-issuing-mining-rounds', {
            method: 'POST',
            body: JSON.stringify({
                cached_open_mining_round_contract_ids: [],
                cached_issuing_round_contract_ids: []
            })
        });
    }
}

export function createScanClient(baseUrl: string): ScanClient {
    return new ScanClient(baseUrl);
}
