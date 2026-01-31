# DAML Design Patterns & Anti-Patterns

## Overview
This guide covers proven patterns and common anti-patterns when developing DAML smart contracts.

---

## ✅ SAFE PATTERNS

### Pattern 1: Proposer-Acceptor
**Use Case**: Multi-party agreement workflows

```daml
template Proposal
  with
    proposer : Party
    acceptor : Party
    terms : ContractTerms
  where
    signatory proposer
    observer acceptor
    
    choice Accept : ContractId Agreement
      controller acceptor
      do create Agreement with
           party1 = proposer
           party2 = acceptor
           terms

template Agreement
  with
    party1 : Party
    party2 : Party
    terms : ContractTerms
  where
    signatory party1, party2
```

**Why Safe**: 
- Both parties explicitly consent
- Proposer cannot force acceptor
- Clear authorization flow

---

### Pattern 2: Delegation
**Use Case**: Authorize another party to act on your behalf

```daml
template Delegation
  with
    owner : Party
    delegate : Party
    scope : DelegationScope
  where
    signatory owner
    observer delegate
    
    nonconsuming choice ActOnBehalf : ContractId SomeAction
      with actionParams : ActionParams
      controller delegate
      do
        assert (isWithinScope scope actionParams)
        create SomeAction with initiator = owner, params = actionParams
```

**Why Safe**:
- Owner explicitly grants delegation
- Scope can be limited
- Audit trail maintained

---

### Pattern 3: Factory with Authorization
**Use Case**: Controlled contract creation

```daml
template ContractFactory
  with
    admin : Party
    authorizedCreators : [Party]
  where
    signatory admin
    observer authorizedCreators
    
    nonconsuming choice CreateContract : ContractId BusinessContract
      with
        creator : Party
        terms : Terms
      controller creator
      do
        assert (creator `elem` authorizedCreators)
        create BusinessContract with issuer = admin, owner = creator, terms
```

**Why Safe**:
- Admin controls who can create
- Creators must be pre-authorized
- Factory maintains state

---

### Pattern 4: Token with Controlled Transfer
**Use Case**: Asset ownership with transfer restrictions

```daml
template Token
  with
    issuer : Party
    owner : Party
    amount : Decimal
    transferRestrictions : TransferRestrictions
  where
    signatory issuer, owner
    ensure amount > 0.0
    
    choice Transfer : ContractId Token
      with
        newOwner : Party
        transferAmount : Decimal
      controller owner
      do
        assert (transferAmount <= amount)
        assert (isAllowed transferRestrictions newOwner)
        
        -- Create new token for recipient
        newToken <- create this with owner = newOwner, amount = transferAmount
        
        -- Create remainder for original owner (if any)
        when (amount - transferAmount > 0.0) $
          void $ create this with amount = amount - transferAmount
        
        return newToken
```

---

### Pattern 5: State Machine
**Use Case**: Workflows with defined states

```daml
data WorkflowState = Draft | Pending | Approved | Rejected
  deriving (Eq, Show)

template Workflow
  with
    initiator : Party
    approver : Party
    state : WorkflowState
    content : WorkflowContent
  where
    signatory initiator
    observer approver
    
    choice Submit : ContractId Workflow
      controller initiator
      do
        assert (state == Draft)
        create this with state = Pending
    
    choice Approve : ContractId Workflow
      controller approver
      do
        assert (state == Pending)
        create this with state = Approved
    
    choice Reject : ContractId Workflow
      with reason : Text
      controller approver
      do
        assert (state == Pending)
        create this with state = Rejected
```

---

## ❌ ANTI-PATTERNS (AVOID)

### Anti-Pattern 1: Missing Signatories
**Problem**: Contract can be created without proper authorization

```daml
-- BAD: Anyone can create this!
template BadContract
  with
    beneficiary : Party
    terms : Text
  where
    signatory beneficiary  -- Only beneficiary signs
```

**Fix**: Include all parties with obligations as signatories
```daml
-- GOOD: Both parties must agree
template GoodContract
  with
    issuer : Party
    beneficiary : Party
    terms : Text
  where
    signatory issuer, beneficiary
```

---

### Anti-Pattern 2: Unrestricted Controller
**Problem**: Sensitive operations exposed to wrong party

```daml
-- BAD: Anyone in observers can exercise
template BadToken
  with
    owner : Party
    observers : [Party]
  where
    signatory owner
    observer observers
    
    choice Burn : ()
      controller observers  -- ALL observers can burn!
      do archive self
```

**Fix**: Restrict controller to authorized party
```daml
-- GOOD: Only owner can burn
choice Burn : ()
  controller owner
  do archive self
```

---

### Anti-Pattern 3: Unnecessary Observers
**Problem**: Exposing contract data to parties who don't need it

```daml
-- BAD: Everyone sees everything
template BadOrder
  with
    buyer : Party
    seller : Party
    allUsers : [Party]  -- Why?
    secretTerms : Text
  where
    signatory buyer, seller
    observer allUsers  -- Privacy leak!
```

**Fix**: Only add observers who need visibility
```daml
-- GOOD: Minimal visibility
template GoodOrder
  with
    buyer : Party
    seller : Party
    auditor : Party  -- Only if required
  where
    signatory buyer, seller
    observer auditor
```

---

### Anti-Pattern 4: No Input Validation
**Problem**: Invalid state can be created

```daml
-- BAD: No validation
template BadPayment
  with
    payer : Party
    payee : Party
    amount : Decimal  -- Could be negative!
  where
    signatory payer, payee
```

**Fix**: Always validate input
```daml
-- GOOD: Validated
template GoodPayment
  with
    payer : Party
    payee : Party
    amount : Decimal
  where
    signatory payer, payee
    ensure amount > 0.0 && payer /= payee
```

---

### Anti-Pattern 5: Consuming When Should Be Non-Consuming
**Problem**: Losing reference contract when it should persist

```daml
-- BAD: Factory is consumed!
template BadFactory
  with
    admin : Party
  where
    signatory admin
    
    choice Create : ContractId Product  -- Consuming by default!
      controller admin
      do create Product with admin
```

**Fix**: Use nonconsuming for utility contracts
```daml
-- GOOD: Factory persists
    nonconsuming choice Create : ContractId Product
      controller admin
      do create Product with admin
```

---

## Security Checklist

- [ ] All signatories explicitly defined
- [ ] Controllers are authorized parties only
- [ ] Observers are minimized
- [ ] Input validation with `ensure`
- [ ] Assertions in choice bodies
- [ ] Meaningful error messages
- [ ] No unnecessary data exposure
- [ ] Non-consuming choices where appropriate
- [ ] Contract keys have maintainers
- [ ] State transitions are validated
