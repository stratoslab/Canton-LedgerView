# ChainSafe Canton MCP Server - Reference Architecture

Source: https://github.com/ChainSafe/canton-mcp-server

## Overview
The ChainSafe Canton MCP Server is a **DAML-Safe by Construction** development platform that generates provably safe DAML code using verified canonical resources, DAML compiler integration, and Haskell's formal verification capabilities.

## Core Philosophy: "DAML-Safe by Construction"
**Leverage DAML compiler's existing mathematical proofs. Extend with safety annotations and formal verification.**

---

## Features

### 🛡️ Safe Code Generation
- **DAML Compiler Integration**: All patterns validated through DAML compilation
- **Safety Annotations**: Add safety metadata to DAML templates
- **Safe Code Generation**: Generate provably safe DAML code
- **Safety Certificates**: Mathematical proof of code safety

### 🔍 Enhanced Validation Tools
- **DAML Code Validation**: Validate against canonical patterns with DAML compiler safety
- **Authorization Debugging**: Debug with DAML's built-in authorization model
- **Pattern Suggestions**: Get recommendations from DAML-compiler-validated patterns
- **Compilation Validation**: Validate DAML compilation safety

### 📚 Canonical Resources
- **3,667+ Documentation Files**: From official DAML, Canton, and DAML Finance repositories
- **Git-Verified Content**: All resources verified via GitHub API
- **Structured Ingestion**: Categorized by use case, security level, and complexity
- **Intelligent Recommendations**: AI-powered resource suggestions
- **LLM Enrichment** (Optional): Claude Haiku 3.5-based metadata enrichment for better search relevance

### 🚀 Production Infrastructure
- **DCAP Performance Tracking**: Real-time performance monitoring via DCAP v2 protocol
- **x402 Payment Infrastructure**: Built-in payment support (disabled by default)
- **HTTP+SSE Transport**: Streaming support with Server-Sent Events
- **Type-Safe Tools**: Fully typed parameters and results using Pydantic models

---

## Safety Gates Architecture

The Canton MCP Server implements a comprehensive safety-first architecture:

### Gate 1: DAML Compiler Safety
All patterns must compile successfully through the DAML compiler.

### Gate 2: Safety Annotations
Patterns must have safety metadata attached.

### Gate 3: Formal Verification
Safety properties must be formally verified.

### Gate 4: Production Readiness
Must be production-tested and certified.

---

## Backend Engines

| Engine | Purpose |
|--------|---------|
| DAML Compiler Integration | Validates all patterns through DAML compilation |
| Safety Annotation System | Adds safety metadata to DAML templates |
| Safe Code Generation Engine | Generates provably safe DAML code |
| Authorization Safety Engine | Leverages DAML's built-in authorization model |
| Business Logic Safety Engine | Uses DAML's consistency guarantees |

---

## MCP Tool Layer

### Safe Code Generation Tools
Generate and certify DAML code with safety proofs.

### Enhanced Validation Tools
Validate code with DAML compiler safety integration.

### Resource Management Tools
Access canonical resources with safety certificates.

---

## Production Infrastructure

| Component | Description |
|-----------|-------------|
| Tool Base Class | Type-safe tool development with Pydantic models |
| Pricing System | Flexible pricing (FREE, FIXED, DYNAMIC) with x402 integration |
| DCAP Integration | Automatic performance tracking for all tool executions |
| Payment Handler | x402 payment verification and settlement |
| Request Manager | Lifecycle management with cancellation support |
| FastAPI Server | HTTP+SSE transport with streaming capabilities |

---

## DCAP Performance Tracking

The server automatically broadcasts performance metrics using DCAP v2 protocol:

- **Protocol Version**: 2
- **Transport**: UDP (direct or multicast)
- **Default Port**: 10191
- **Metrics Tracked**: Tool name, execution time, success/failure, anonymized parameters

Configure DCAP in `.env.canton` or via environment variables.

---

## Tool Implementation Guide

### Creating a New Tool

```python
from typing import List, Optional
from pydantic import Field

from ..core import Tool, ToolContext, register_tool
from ..core.pricing import PricingType, ToolPricing
from ..core.types.models import MCPModel


# IMPORTANT: Use MCPModel, not BaseModel!
class MyToolParams(MCPModel):
    """Parameters for my tool"""
    user_input: str = Field(description="User's input data")
    optional_config: Optional[str] = Field(default=None, description="Optional configuration")


class MyToolResult(MCPModel):
    """Result from my tool"""
    success: bool = Field(description="Whether operation succeeded")
    output_data: str = Field(description="The result data")
    details: List[str] = Field(description="Additional details")


@register_tool
class MyNewTool(Tool[MyToolParams, MyToolResult]):
    """Tool for doing something awesome"""
    
    name = "my_new_tool"
    description = "Does something awesome with user input"
    params_model = MyToolParams
    result_model = MyToolResult
    
    pricing = ToolPricing(type=PricingType.FREE)
    
    async def execute(self, ctx: ToolContext[MyToolParams, MyToolResult]):
        """Execute the tool logic"""
        user_input = ctx.params.user_input
        
        yield ctx.progress(0, 100, "Starting processing...")
        yield ctx.log("info", f"Processing: {user_input}")
        
        output = f"Processed: {user_input}"
        
        yield ctx.progress(100, 100, "Complete!")
        
        result = MyToolResult(
            success=True,
            output_data=output,
            details=["Step 1 completed", "Step 2 completed"]
        )
        
        yield ctx.structured(result)
```

### Key Requirements

**✅ DO:**
- Inherit from `MCPModel` for all parameter and result classes
- Use type hints and Pydantic `Field()` descriptions
- Use the `@register_tool` decorator
- Define `name`, `description`, `params_model`, `result_model`
- Use `ctx.params` to access validated parameters
- Use `ctx.structured(result)` to return typed results
- Use `yield` for all responses (progress, logs, results)

**❌ DON'T:**
- Use plain Pydantic `BaseModel` (breaks MCP protocol camelCase)
- Forget the `@register_tool` decorator
- Return results directly (use `yield ctx.structured(...)`)
- Use blocking I/O (use async/await)
- Access raw request data (use `ctx.params` instead)

---

## Safety Principles

1. **DAML-Safe by Construction**: Leverage DAML compiler's existing safety guarantees
2. **Compiler-First Safety**: All validation goes through DAML compilation
3. **Safety Annotations**: Add safety metadata to DAML templates
4. **Complete Audit Trails**: Every DAML compilation must be logged
