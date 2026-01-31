# Canton Network Quickstart Demo Guide

Source: https://docs.digitalasset.com/build/3.3/quickstart/operate/explore-the-demo.html

## Overview

The Canton Network (CN) Quickstart is scaffolding to support development efforts to build, test, and deploy CN applications. It resolves infrastructure problems that every CN application must solve.

Use the CN Quickstart Application so you and your team can focus on building your application, instead of build systems, deployment configurations, and testing infrastructure.

---

## Business Case

The Quickstart features a **sample licensing app** to demonstrate Canton development patterns.

### Core Business Operations
- **Providers** sell time-based access to their services
- **Users** pay with Canton Coin (CC) and manage payments through a Canton Wallet

### Parties Involved
| Party | Role |
|-------|------|
| Application Provider | Sells licenses |
| Application User | Buys licenses |
| Amulet Token System | Handles payments using CC |
| DSO Party | Decentralized Synchronizer Operations Party (Super Validators) |

---

## License Lifecycle

### 1. Issuing a License
The provider creates a new license for an onboarded user. The license starts **expired** and needs to be renewed before use.

### 2. Requesting a License Renewal
The provider creates a renewal request, generating a payment request for the user. A matching CC payment request is created on the ledger.

### 3. Paying for a License Renewal
The user approves the payment through their Canton Wallet, which creates an accepted payment contract on the ledger.

### 4. Renewing the License
The provider processes the accepted payment and updates the license with a new expiration date.

---

## Walkthrough

### Build and Start
```bash
make build; make start
```

### Open Application
Navigate to: `app-provider.localhost:3000`

Or run:
```bash
make open-app-ui
```

### Safari Users
Add to `/etc/hosts`:
```
127.0.0.1       app-provider.localhost
```

---

## Login

### Without OAUTH2
Enter "app-provider" in the User field.

### With OAUTH2
- Username: `app-provider`
- Password: `abc123`

---

## App Installation Flow

1. Login and select **AppInstalls** in the menu
2. Run from `/quickstart/`:
   ```bash
   make create-app-install-request
   ```
3. Return to browser and click **Accept**
4. The AppInstallRequest is accepted
5. Actions update to **Cancel** and **Create license**

---

## Creating a License

1. Click **Create License**
2. Navigate to **Licenses** menu → **Renewals**
3. Click **New** to open "Renew License" modal
4. Set:
   - Number of days to renew
   - Fee
   - Time to prepare the license
   - Time to settle the license
   - Description (required)
5. Click **Issue License Renewal Request**

> **Note**: Per the Daml contract, licenses are created in an expired state. To activate, a renewal payment request must be issued.

---

## Making a Payment

1. Navigate to Canton Wallet: `http://wallet.localhost:2000/allocations`
2. Login as `app-user`
3. If wallet empty, enter amount and click **TAP**
4. Navigate to **Allocations** menu
5. Accept the **Allocation Request** before expiry
6. New "Allocations" section shows `licenseFeePayment` information

---

## Completing License Renewal

1. Return to Quickstart as **AppProvider**
2. Go to **Licenses** menu → **Renewals**
3. Click **Complete Renewal** button
4. Confirmation appears
5. Log out and login as **AppUser**
6. The license now shows as **active**

---

## Development Tools

### Canton Console
Connect to the running application ledger directly:
```bash
make canton-console
```

Commands:
```scala
participants        // Detailed categorization of participants
participants.all    // List of all participant references
`app-user`          // Connect to app user's validator
`app-provider`      // Connect to app provider
`sv`                // Connect to Super Validator
health.status       // Display health of validators
```

### Daml Shell
Connect to the PQS database:
```bash
make shell
```

Commands:
```bash
active                                              # Show unique identifiers and asset count
active quickstart-licensing:Licensing.License:License   # List license details
active quickstart-licensing:Licensing.License:LicenseRenewalRequest  # License renewal details
archives quickstart-licensing:Licensing.AppInstall:AppInstallRequest  # Archived licenses
```

### Canton Coin Scan
Web UI: `http://scan.localhost:4000/`

Features:
- Total CC balance and Validator rewards
- Network Info menu for SV identification
- Validators menu shows registered validators

### Observability Dashboard
Navigate to: `http://localhost:3030/dashboards`

Features:
- Select "Quickstart - consolidated logs"
- Filter by service (e.g., "participant")
- Click any log entry for details

---

## URLs Summary

| Service | URL |
|---------|-----|
| App Provider UI | `app-provider.localhost:3000` |
| Canton Wallet | `wallet.localhost:2000` |
| CC Scan | `scan.localhost:4000` |
| Observability | `localhost:3030/dashboards` |

---

## Credentials

| User | Username | Password |
|------|----------|----------|
| App Provider | app-provider | abc123 |
| App User | app-user | abc123 |
