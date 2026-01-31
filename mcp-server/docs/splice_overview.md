# Splice & Global Synchronizer Overview

Source: https://docs.sync.global/

## What is Splice?
Splice is the infrastructure layer for the **Canton Network**. It provides the **Global Synchronizer** that connects various participants and applications.

## Key Components

### 1. Global Synchronizer
The backbone of the Canton Network. It ensures:
- **Global connectivity**: Connects participants across the network.
- **Synchronization**: Orders transactions and ensures consistency.

### 2. Canton Network
A privacy-enabled network of networks.
- **Privacy**: Participants verify only what they need to see.
- **Interoperability**: Different applications and ledgers can transact atomically.

### 3. Super Validators (SV)
A decentralized group of operators that manage the Global Synchronizer.
- **Governance**: They operate the shared infrastructure (DSO - Decentralized Synchronizer Operations).
- **Trust**: Distributed trust model.

### 4. Validators
Operators who run nodes on the network.
- **Participate**: Submit transactions and validate contracts.
- **Purchase Traffic**: Pay fees in Amulet (Canton Coin) to sequence transactions.

### 5. Tokenomics (Amulet)
**Amulet (CC)** is the native token used for:
- **Traffic Fees**: Paying for bandwidth on the Global Synchronizer.
- **Rewards**: Incentivizing validators and app providers.

---

## Deployment & Operations

### Validator Onboarding
Validators must:
1. **Provision Hardware**: Meets minimum specs (CPU/Ram/Storage).
2. **Deploy Node**: Docker Compose or Kubernetes (Helm).
3. **Register**: Go through the onboarding process with the Super Validators.
4. **Purchase Traffic**: traffic is required to operate.

### DevOps
- **Upgrades**: Rolling upgrades supported.
- **Backups**: Standard backup procedures for ledger data.
- **Security**: Strict ingress/egress requirements.

---

## Versioning
- **Docker Image**: 0.5.5 (Current)
- **Helm Chart**: 0.5.5 (Current)
