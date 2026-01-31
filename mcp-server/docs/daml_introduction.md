# DAML Introduction & Tutorial

Source: https://docs.daml.com/daml/intro/0_Intro.html

## What is DAML?

Daml is a **smart contract language** designed to build composable applications on an abstract Daml Ledger Model.

## Key Features

- **Privacy by design** - Only parties with rights can see relevant data
- **Composable** - Build complex workflows from simple building blocks
- **Type-safe** - Catch errors at compile time, not runtime
- **Portable** - Run on any Daml Ledger implementation

---

## Getting Started

### Prerequisites
Install the Daml SDK: https://docs.daml.com/getting-started/installation.html

### Create a New Project
```bash
daml new intro1 --template daml-intro-1
```

---

## Basic Concepts

### 1. Templates
Templates define the structure of contracts:
```daml
template Asset
  with
    owner : Party
    name : Text
    value : Decimal
  where
    signatory owner
```

### 2. Signatories
Parties who must authorize contract creation:
```daml
signatory owner, issuer
```

### 3. Observers
Parties who can see the contract:
```daml
observer auditor
```

### 4. Choices
Actions that can be performed on contracts:
```daml
choice Transfer : ContractId Asset
  with newOwner : Party
  controller owner
  do create this with owner = newOwner
```

---

## Template Structure Reference

### Template Outline
```daml
template TemplateName
  with
    field1 : Type1
    field2 : Type2
  where
    -- Rights and behavior
    signatory party1
    observer party2
    
    -- Optional precondition
    ensure condition
    
    -- Contract key (optional)
    key (maintainer, uniqueId) : (Party, Text)
    maintainer key._1
    
    -- Choices
    choice ChoiceName : ReturnType
      with choiceArg : ArgType
      controller controllerParty
      do -- choice body
```

### Choice Structure
```daml
choice ChoiceName : ReturnType
  with
    arg1 : Type1
    arg2 : Type2
  controller controllerParty
  do
    -- Update actions
    create SomeContract with ...
    exercise contractId SomeChoice with ...
    return someValue
```

---

## Update Actions (Choice Bodies)

### Creating Contracts
```daml
create Template with field1 = value1, field2 = value2
```

### Exercising Choices
```daml
exercise contractId ChoiceName with arg1 = value1
exerciseByKey @Template key ChoiceName with arg1 = value1
```

### Fetching Contracts
```daml
contract <- fetch contractId
(contractId, contract) <- fetchByKey @Template key
```

### Looking Up Contracts
```daml
maybeContractId <- lookupByKey @Template key
```

### Archiving Contracts
```daml
archive contractId
```

### Assertions
```daml
assert (condition)
assertMsg "Error message" condition
```

### Getting Time
```daml
now <- getTime
```

### Return Values
```daml
return someValue
```

---

## Common Patterns

### 1. Asset Transfer
```daml
template Asset
  with
    issuer : Party
    owner : Party
    name : Text
  where
    signatory issuer, owner
    
    choice Transfer : ContractId Asset
      with newOwner : Party
      controller owner
      do create this with owner = newOwner
```

### 2. Proposal-Accept
```daml
template Proposal
  with
    proposer : Party
    receiver : Party
    terms : Text
  where
    signatory proposer
    observer receiver
    
    choice Accept : ContractId Agreement
      controller receiver
      do create Agreement with
           party1 = proposer
           party2 = receiver
           terms
```

### 3. Factory Pattern
```daml
template AssetFactory
  with
    issuer : Party
  where
    signatory issuer
    
    nonconsuming choice Issue : ContractId Asset
      with
        owner : Party
        name : Text
      controller issuer
      do create Asset with issuer, owner, name
```

---

## Best Practices

### 1. Always Define Signatories
Every contract must have at least one signatory.

### 2. Use Meaningful Names
Template and choice names should clearly describe their purpose.

### 3. Validate Input
Use `ensure` for preconditions that should always hold.

### 4. Return Meaningful Values
Choices should return useful information for the caller.

### 5. Keep Templates Focused
Each template should represent one concept.

---

## Resources

- **Full Introduction**: https://docs.daml.com/daml/intro/0_Intro.html
- **Language Reference**: https://docs.daml.com/daml/reference/index.html
- **Templates Reference**: https://docs.daml.com/daml/reference/templates.html
- **Choices Reference**: https://docs.daml.com/daml/reference/choices.html
- **Updates Reference**: https://docs.daml.com/daml/reference/updates.html
