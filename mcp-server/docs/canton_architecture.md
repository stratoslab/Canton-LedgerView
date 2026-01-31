# Canton Network - Architecture & Development Guide

## What is Canton?
Canton is a **privacy-enabled blockchain** platform built on DAML. It provides:
- **Privacy by design** - Parties only see data relevant to them
- **Interoperability** - Multiple ledgers can connect
- **Regulatory compliance** - Built-in support for financial regulations

---

## CANTON ARCHITECTURE

### Participant Nodes
A **Participant Node** is a node that hosts parties and their contracts.
- Runs DAML smart contracts
- Connects to one or more Domains
- Manages local contract storage

### Domains
A **Domain** is a synchronization point for transactions.
- Provides ordering and consistency
- Does NOT store contract data (privacy)
- Mediates between participants

### Synchronization Protocol
1. Participant submits transaction to Domain
2. Domain sequences and broadcasts
3. Other participants validate
4. Confirmation is sent back
5. Transaction is committed

---

## CANTON CLI COMMANDS

### Starting a Local Network
```bash
# Start Canton in sandbox mode
canton sandbox --port 6865
```

### Building DAML
```bash
# Compile DAML code
daml build

# Run DAML tests
daml test
```

### Deploying to Canton
```bash
# Upload DAR file to ledger
daml ledger upload-dar --host localhost --port 6865 ./target/my-project.dar

# List deployed packages
daml ledger list-packages --host localhost --port 6865
```

### Querying Contracts
```bash
# Using the Ledger API
grpcurl -plaintext localhost:6865 com.daml.ledger.api.v1.ActiveContractsService/GetActiveContracts
```

---

## PRODUCTION DEPLOYMENT

### Environment Variables
```bash
# Required for production
CANTON_DOMAIN_HOST=domain.example.com
CANTON_DOMAIN_PORT=4401
CANTON_LEDGER_PORT=6865

# Optional: Enable TLS
CANTON_TLS_ENABLED=true
CANTON_TLS_CERT_CHAIN=/path/to/cert.pem
CANTON_TLS_PRIVATE_KEY=/path/to/key.pem
```

### Docker Deployment
```yaml
version: '3'
services:
  canton-participant:
    image: digitalasset/canton-open-source:latest
    ports:
      - "6865:6865"
    volumes:
      - ./canton.conf:/etc/canton/canton.conf
```

### Health Checks
```bash
# Check participant health
curl http://localhost:6865/health

# Check metrics
curl http://localhost:6865/metrics
```

---

## SECURITY BEST PRACTICES

### 1. Always Define Signatories
Every template MUST have explicit signatories:
```daml
template SecureContract
  with
    owner : Party
  where
    signatory owner  -- REQUIRED
```

### 2. Validate Controllers
Ensure controllers are authorized:
```daml
choice SecureAction : ()
  controller owner  -- Only owner can act
  do ...
```

### 3. Use Observers Carefully
Only add observers who need visibility:
```daml
observer [auditor]  -- Only add if necessary
```

### 4. Implement Access Control
```daml
choice RestrictedAction : ()
  controller admin
  do
    assert (admin == expectedAdmin) "Unauthorized"
```

---

## COMMON PATTERNS

### Asset Token Pattern
```daml
template Token
  with
    issuer : Party
    owner : Party
    amount : Decimal
  where
    signatory issuer, owner
    
    choice Transfer : ContractId Token
      with newOwner : Party
      controller owner
      do create this with owner = newOwner
```

### Workflow State Machine
```daml
data WorkflowState = Pending | Approved | Rejected
  deriving (Eq, Show)

template Workflow
  with
    initiator : Party
    approver : Party
    state : WorkflowState
  where
    signatory initiator
    observer approver
    
    choice Approve : ContractId Workflow
      controller approver
      do create this with state = Approved
```

---

## TROUBLESHOOTING

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `AUTHORIZATION_FAILED` | Missing signatory | Ensure all signatories authorize |
| `CONTRACT_NOT_FOUND` | Contract archived | Check contract lifecycle |
| `DUPLICATE_KEY` | Key already exists | Use unique keys |
| `COMMAND_TIMEOUT` | Network issues | Check domain connectivity |
