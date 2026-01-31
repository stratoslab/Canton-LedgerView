# Splice Scan API Reference

Source: https://docs.sync.global/app_dev/scan_api/scan_current_state_api.html

## Overview
The Scan API provides state information about the Splice network (Global Synchronizer), specifically focused on **Canton Coin (CC)** and **Synchronizer Traffic**.

It runs alongside the overall Splice network operations API and is used to query the current state of Amulet-related network activities.

## 1. Validator Traffic Credits
Sequencing messages on the Global Synchronizer costs traffic fees paid in Amulet.

**Endpoint**: `GET /v0/domains/{domain_id}/members/{member_id}/traffic-status`

### Response Structure
```json
{
  "traffic_status": {
    "actual": {
      "total_consumed": 0,
      "total_limit": 6000000 
    },
    "target": {
      "total_purchased": 6000000
    }
  }
}
```
- **total_limit**: The max traffic allowed (most important).
- **total_consumed**: How much has been used.
- **total_purchased**: How much was bought (usually same as limit, unless purchase pending).

---

## 2. Open Mining Rounds
Amulet activity is organized into "rounds". To check for rounds available for traffic or rewards:

**Endpoint**: `POST /v0/open-and-issuing-mining-rounds`

### Response Structure
Returns a map of open rounds, including:
- **Round Number**
- **Open/Close Times** (`opensAt`, `targetClosesAt`)
- **Amulet Price** (Conversion rate to USD)
- **Issuance Config** (Rewards for validators/apps)

```json
{
  "open_mining_rounds": {
    "contract_id...": {
      "payload": {
        "round": { "number": "20790" },
        "amuletPrice": "0.005",  // 0.005 USD per Amulet
        "opensAt": "...",
        "targetClosesAt": "..."
      }
    }
  }
}
```

### Key Concepts
- **Amulet Price**: Found in `contract.payload.amuletPrice` (e.g., 0.005 USD/Amulet).
- **Round Window**: Defined by `opensAt` and `targetClosesAt`.

---

## 3. Closed Mining Rounds
Used to find rounds that have closed but might still have unclaimed rewards.

**Endpoint**: `GET /v0/closed-rounds`

> **Note**: This usually returns an empty response unless there are transient states where final confirmation hasn't happened yet.

---

## Usage Tips
- Use these endpoints to monitor your **traffic credit balance** to ensure your validator can continue sequencing transactions.
- Monitor **mining rounds** to understand current Amulet prices and reward configurations.
