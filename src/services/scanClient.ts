/**
 * Splice Scan Client
 * 
 * Client for interacting with the Splice Scan API to get global network state.
 * @see https://docs.sync.global/app_dev/scan_api/
 */

import type {
    MemberTrafficResponse,
    OpenAndIssuingMiningRoundsResponse,
    ScanUpdatesResponse,
    ScanScansResponse,
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

    /**
     * List approved SV scan endpoints.
     */
    async getScans(): Promise<ScanScansResponse> {
        return this.request<ScanScansResponse>('/v0/scans');
    }

    /**
     * Fetch update history (paged).
     */
    async getUpdates(pageSize = 10): Promise<ScanUpdatesResponse> {
        return this.request<ScanUpdatesResponse>('/v2/updates', {
            method: 'POST',
            body: JSON.stringify({ page_size: pageSize }),
        });
    }
}

export function createScanClient(baseUrl: string): ScanClient {
    return new ScanClient(baseUrl);
}

// ============================================================================
// CantonScan client (public explorer API)
// ============================================================================

const CANTON_SCAN_BASE_URL = 'https://www.cantonscan.com';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

async function cantonScanRequest<T>(path: string): Promise<T> {
    const targetUrl = `${CANTON_SCAN_BASE_URL}${path}`;
    // Use proxy to avoid CORS issues in browser
    const url = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`CantonScan API Error (${response.status}): ${response.statusText}`);
    }

    return response.json();
}

export function fetchCantonScanStats() {
    return cantonScanRequest('/api/stats');
}

export function fetchCantonScanPrice() {
    return cantonScanRequest('/api/price/cc');
}

export function fetchCantonScanActivityHistory(period: '24h' | '7d' | '1m') {
    return cantonScanRequest(`/api/activity-history?period=${period}`);
}

export function fetchCantonScanPriceHistory(period: '24h' | '7d' | '1m') {
    return cantonScanRequest(`/api/price-history?period=${period}`);
}

export function fetchCantonScanUpdates(limit = 10) {
    return cantonScanRequest(`/api/updates?limit=${limit}`);
}

export function fetchCantonScanValidators(interval: '24h' | '7d' | '1m') {
    return cantonScanRequest(`/api/validators?interval=${interval}`);
}
