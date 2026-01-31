# LLM-Primary Architecture for DAML Analysis

Source: https://github.com/ChainSafe/canton-mcp-server/blob/main/LLM_PRIMARY_ARCHITECTURE.md

## Overview
The DAML Reason tool uses **LLM as the primary analysis method** for authorization extraction, with regex patterns as a fallback for degraded mode.

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│              validate_daml_business_logic                    │
│                   (DAML Reason Tool)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ Step 1: Compile  │
                    │ (DamlCompiler)   │
                    └──────────────────┘
                            │
                            ▼
                    ┌──────────────────┐
                    │ Step 2: Check    │
                    │ Anti-Patterns    │
                    │ (PolicyChecker)  │
                    │ Uses: LLM        │
                    └──────────────────┘
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │ Step 3: Extract Authorization Model │
          │ (AuthorizationValidator)            │
          └─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │   LLM Available?      │
                └───────────┬───────────┘
                     /              \
                 YES ✅             NO ⚠️
                    ▼                  ▼
        ┌────────────────────┐   ┌──────────────────┐
        │  PRIMARY PATH      │   │ DEGRADED MODE    │
        │                    │   │                  │
        │  Use LLM (Haiku)   │   │  Use Regex       │
        │  Confidence: 0.85+ │   │                  │
        │                    │   │  Simple: 0.8     │
        │  ✅ Reliable       │   │  Complex: 0.5    │
        │  💰 ~$0.001/call   │   │                  │
        │                    │   │  ⚠️  Limited     │
        └────────────────────┘   └──────────────────┘
                    │                      │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Confidence >= 0.7?   │
                    └──────────────────────┘
                         /            \
                     YES ✅           NO ⚠️
                        ▼                ▼
            ┌──────────────────┐  ┌─────────────┐
            │ Return Analysis  │  │  DELEGATE   │
            │ valid: true      │  │  valid: false│
            │                  │  │  should_     │
            │ 💰 Charge user   │  │  delegate:   │
            │                  │  │  true        │
            └──────────────────┘  └─────────────┘
```

---

## Key Changes from Regex-Primary to LLM-Primary

### Before (Regex-Primary)
1. Try regex extraction
2. Calculate confidence
3. If low confidence → Try LLM fallback
4. Return result

**Problem**: Regex can't handle complex patterns reliably, leading to false positives/negatives

### After (LLM-Primary)
1. **If LLM available** → Use LLM (primary path)
2. **If LLM unavailable** → Use regex (degraded mode)
3. Check confidence threshold
4. Delegate if uncertain

**Benefit**: LLM handles all DAML complexity reliably; regex only for simple fallback

---

## Primary Path: LLM with Claude Haiku

**Model**: `claude-3-5-haiku-20241022`

### Why Haiku?
- ✅ Excellent at structured extraction tasks
- ✅ Fast (~2-3x faster than Sonnet)
- ✅ Cheap (~$0.001 per analysis)
- ✅ Deterministic (temperature=0)
- ✅ Good at parsing code syntax

### Prompt Strategy
- Clear task definition
- 3 concrete examples
- Explicit rules for list operations
- Confidence scoring guidance
- JSON-only output format

### Expected Performance
| Pattern Type | Confidence |
|-------------|------------|
| Simple patterns | 1.0 |
| List operations (<>, ::) | 0.95 |
| Multiple choices | 0.9 |
| Complex expressions | 0.8+ |

---

## Degraded Mode: Regex Fallback

**When Used**: LLM unavailable (no ANTHROPIC_API_KEY or ENABLE_LLM_AUTH_EXTRACTION=false)

### Behavior
1. Check for complex patterns (`<>`, `::`, `if/then`)
2. If complex: Return confidence 0.5 → **DELEGATE**
3. If simple: Return confidence 0.8 → Pass

**Message to User**: "Enable LLM for full coverage"

---

## Configuration

### Recommended for Production
```bash
ENABLE_LLM_AUTH_EXTRACTION=true
ANTHROPIC_API_KEY=sk-ant-...
```

### Cost-Sensitive Development
```bash
ENABLE_LLM_AUTH_EXTRACTION=false
# Uses regex fallback, delegates complex patterns
```

---

## Cost Analysis

### Primary Path (LLM Enabled)
| Component | Cost |
|-----------|------|
| Compile check | Free (local) |
| Anti-pattern check | ~$0.0005 |
| Auth extraction (Haiku) | ~$0.001 |
| **Total per analysis** | **~$0.0015** |

### Degraded Mode (LLM Disabled)
| Component | Cost |
|-----------|------|
| All operations | Free |
| **Trade-off** | Lower confidence, delegates complex patterns |

---

## Benefits

### 1. Reliability
- ✅ LLM handles all DAML complexity
- ✅ No infinite pattern matching needed
- ✅ Natural handling of edge cases

### 2. Predictable Costs
- 💰 Primary path always uses LLM
- 💰 Costs are consistent and predictable
- 💰 x402 automatically includes actual cost

### 3. Clear Value Proposition
- 🎯 "We use AI to analyze your code"
- 🎯 Payment = Analysis
- 🎯 No hidden complexity

### 4. Graceful Degradation
- ⚠️ Without LLM: Simple patterns still work
- ⚠️ Complex patterns: Clear delegation message
- ⚠️ No false confidence

### 5. Developer Experience
- 👍 High confidence = Reliable results
- 👍 Low confidence = Clear next steps
- 👍 Degraded mode = Clear explanation

---

## Summary

The LLM-primary architecture provides:
- ✅ **Reliable analysis** for all DAML patterns
- 💰 **Predictable costs** via x402
- ⚡ **Fast results** with Haiku
- 🚫 **No false confidence** in degraded mode
- 👨‍💻 **Clear value** for developers

This aligns perfectly with the x402 payment model: **Payment = Reliable Analysis**
