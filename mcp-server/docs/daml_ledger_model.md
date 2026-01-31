# DAML Ledger Model - Core Concepts

Source: https://docs.daml.com/concepts/ledger-model/index.html

## Overview
Daml Ledgers enable multi-party workflows by providing parties with a virtual shared ledger, which encodes the current state of their shared contracts, written in Daml.

The Daml ledger model defines:
1. **Structure** - what the ledger looks like
2. **Integrity** - who can request which changes (authorization)
3. **Privacy** - who sees which changes and data

---

## 1. LEDGER STRUCTURE
### Actions and Transactions
- A **Transaction** is a list of **Actions**.
- Actions modify the ledger by creating or archiving contracts.
- Each action is atomic.

### Contracts
- A **Contract** is an instance of a **Template** with specific data.
- Contracts have a unique **Contract ID**.
- Contracts are either **Active** or **Archived**.

---

## 2. LEDGER INTEGRITY (Authorization)
### Valid Ledgers
A ledger is valid if all its transactions satisfy:
- **Consistency** - contracts are used correctly
- **Conformance** - actions match template definitions
- **Authorization** - required parties have signed

### Consistency Rules
- **Contract Consistency**: A contract can only be used if it's active.
- **Key Consistency**: Contract keys must be unique.
- **Internal Consistency**: Within a transaction, actions must be consistent.

### Authorization Rules
- **Signatories**: Parties who MUST authorize the contract creation.
- **Controllers**: Parties who CAN exercise choices.
- **Observers**: Parties who can SEE the contract but cannot act.

**Key Rule**: To CREATE a contract, ALL signatories must authorize.
**Key Rule**: To EXERCISE a choice, the controller must authorize.

---

## 3. PRIVACY MODEL
### Stakeholders
- **Signatories** see everything about the contract.
- **Observers** see the contract data but not necessarily all exercises.
- **Choice Observers** see specific choice exercises.

### Projections
Each party sees a "projection" of the ledger—only the parts relevant to them.

### Divulgence
Sometimes non-stakeholders see contracts they wouldn't normally see. This happens when:
- A contract is used in an exercise they witness.
- The ledger "divulges" the contract to maintain consistency.

---

## 4. AUTHORIZATION PATTERNS

### Pattern 1: Proposer-Acceptor
```daml
template Proposal
  with
    proposer : Party
    acceptor : Party
    terms : Text
  where
    signatory proposer
    observer acceptor
    
    choice Accept : ContractId Agreement
      controller acceptor
      do create Agreement with ..
```
- Proposer creates a Proposal (only they sign).
- Acceptor can Accept, which creates an Agreement (both sign).

### Pattern 2: Delegation
```daml
template Delegation
  with
    owner : Party
    delegate : Party
  where
    signatory owner
    observer delegate
    
    choice ActOnBehalf : ()
      controller delegate
      do -- delegate can now act as owner
```

### Pattern 3: Mandatory Signatories
All signatories MUST authorize contract creation. This is enforced by the ledger.

---

## 5. KEY CONCEPTS SUMMARY

| Concept | Definition |
|---------|------------|
| Template | A class defining contract structure and behavior |
| Contract | An instance of a template with specific data |
| Signatory | A party that MUST authorize contract creation |
| Controller | A party that CAN exercise a choice |
| Observer | A party that can SEE the contract |
| Choice | An action that can be performed on a contract |
| Exercise | The act of executing a choice |
| Archive | Consuming a contract (making it inactive) |
| Stakeholder | Any party with rights or obligations on a contract |
