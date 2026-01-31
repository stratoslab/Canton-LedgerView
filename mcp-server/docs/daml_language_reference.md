# DAML Language Reference - Quick Guide

## Template Syntax

### Basic Template
```daml
template MyContract
  with
    owner : Party
    data : Text
  where
    signatory owner
    
    choice DoSomething : ()
      controller owner
      do return ()
```

### Template Components
- `with` block: Contract parameters (the data)
- `where` block: Rights and obligations
- `signatory`: Parties who must sign
- `observer`: Parties who can see
- `choice`: Actions that can be performed

---

## DATA TYPES

### Built-in Types
```daml
-- Primitives
myText : Text = "Hello"
myInt : Int = 42
myDecimal : Decimal = 3.14159
myBool : Bool = True
myDate : Date = date 2024 Jan 15
myTime : Time = time (date 2024 Jan 15) 12 0 0

-- Party
myParty : Party = getParty "Alice"

-- Contract ID
myContractId : ContractId MyContract
```

### Custom Types
```daml
-- Record
data Person = Person
  with
    name : Text
    age : Int

-- Variant (Sum Type)
data Status = Active | Inactive | Pending Text

-- Enum
data Color = Red | Green | Blue
  deriving (Eq, Show)
```

---

## CHOICES

### Non-consuming Choice
```daml
nonconsuming choice Query : Text
  controller viewer
  do return "Contract data"
```
- Does NOT archive the contract
- Can be exercised multiple times

### Consuming Choice (Default)
```daml
choice Archive : ()
  controller owner
  do return ()
```
- Archives the contract
- Can only be exercised once

### Choice with Parameters
```daml
choice Transfer : ContractId Token
  with
    newOwner : Party
    amount : Decimal
  controller owner
  do create this with owner = newOwner
```

---

## CONTROL FLOW

### Conditionals
```daml
if condition
  then doThis
  else doThat
```

### Pattern Matching
```daml
case status of
  Active -> "Running"
  Inactive -> "Stopped"
  Pending msg -> "Waiting: " <> msg
```

### Loops (via recursion)
```daml
sumList : [Int] -> Int
sumList [] = 0
sumList (x :: xs) = x + sumList xs
```

---

## LEDGER OPERATIONS

### Create Contract
```daml
create MyContract with
  owner = alice
  data = "Hello"
```

### Exercise Choice
```daml
exercise contractId DoSomething
```

### Fetch Contract
```daml
contract <- fetch contractId
```

### Archive Contract
```daml
archive contractId
```

---

## ASSERTIONS

### assert
```daml
assert (amount > 0) "Amount must be positive"
```

### assertMsg
```daml
assertMsg "Unauthorized" (caller == owner)
```

### ensure (in template)
```daml
template ValidatedContract
  with
    owner : Party
    amount : Decimal
  where
    signatory owner
    ensure amount > 0  -- Contract cannot be created if false
```

---

## KEYS

### Defining a Key
```daml
template KeyedContract
  with
    owner : Party
    uniqueId : Text
  where
    signatory owner
    key (owner, uniqueId) : (Party, Text)
    maintainer key._1
```

### Using Keys
```daml
-- Fetch by key
(contractId, contract) <- fetchByKey @KeyedContract (owner, uniqueId)

-- Exercise by key
exerciseByKey @KeyedContract (owner, uniqueId) SomeChoice
```

---

## COMMON PATTERNS

### Proposal-Accept
```daml
template Proposal
  with
    from : Party
    to : Party
    terms : Text
  where
    signatory from
    observer to
    
    choice Accept : ContractId Agreement
      controller to
      do create Agreement with from; to; terms
```

### Delegation
```daml
template Delegation
  with
    owner : Party
    delegate : Party
  where
    signatory owner
    observer delegate
    
    nonconsuming choice ActAs : ()
      controller delegate
      do -- delegate can act on owner's behalf
```

### Factory Pattern
```daml
template ContractFactory
  with
    admin : Party
  where
    signatory admin
    
    nonconsuming choice CreateContract : ContractId MyContract
      with params : ContractParams
      controller admin
      do create MyContract with params
```
