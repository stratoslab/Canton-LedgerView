# Canton MCP Server Reference

**Repository**: [https://github.com/ChainSafe/canton-mcp-server](https://github.com/ChainSafe/canton-mcp-server)

## Overview
The Canton MCP Server is a Model Context Protocol (MCP) server designed to assist with **DAML** (Digital Asset Modeling Language) development on the **Canton** blockchain platform. It provides tools for code analysis, safety checks, and automation.

## Key Tools
The server exposes two primary tools:

1.  **daml_reason** (`🧠 DAML Reason`)
    *   **Purpose**: A comprehensive DAML code analyzer and advisor.
    *   **Capabilities**: Validates authorization patterns, logical consistency, and security properties of DAML models.
    *   **AI Integration**: Uses an LLM (Claude/Anthropic) to perform "semantic safety analysis" and "auth extraction" that goes beyond static code analysis.

2.  **daml_automater** (`🤖 DAML Automater`)
    *   **Purpose**: CI/CD and environment automation instruction.
    *   **Capabilities**: Helps automate deployment and testing workflows for Canton/DAML environments.

## Architecture & Requirements

### Why is the Anthropic API Key Required?
The server is not just a passive bridge to the Canton CLI; it acts as an **intelligent agent**.
*   It implements a **Safety Checker** (`safety_checker.py`) that uses an LLM to "reason" about the safety of DAML code.
*   The `daml_reason` tool triggers this analysis.
*   **Behavior**:
    *   **With Key**: Full semantic analysis and "auth extraction" enabled.
    *   **Without Key**: It falls back to basic static analysis, skipping the deep reasoning steps. The logs will show warnings like `ENABLE_LLM_AUTH_EXTRACTION=true but ANTHROPIC_API_KEY not set`.

### Configuration
To use the server effectively, you must configure your MCP client (e.g., in `mcp.json` or `cline_mcp_settings.json`).

**Recommended Configuration (Local Subprocess):**
```json
{
  "mcpServers": {
    "canton": {
      "command": "uv",
      "args": ["run", "canton-mcp-server"],
      "cwd": "/path/to/canton-mcp-server",
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..." 
      }
    }
  }
}
```

### Advanced Features
*   **DCAP (Data Center Authorization Protocol)**: Integrates performance tracking.
*   **x402 Protocol**: Supports payment verification for tools (though often set to $0.0 or Free).
*   **Gates**: Implements "Safety Gates" (Compiler -> Safety Annotations -> Formal Verification -> Production).

## Usage
Once connected, you can ask the agent to:
*   "Analyze the safety of this DAML contract." (Uses `daml_reason`)
*   "Help me create a deployment script for Canton." (Uses `daml_automater`)
