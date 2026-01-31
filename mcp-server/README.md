# Canton Ledgerview MCP Server

This is a custom Model Context Protocol (MCP) server for the Ledgerview project. It provides tools to analyze the project structure and status.

## Prerequisites

- [uv](https://github.com/astral-sh/uv) (for Python dependency management)

## Installation

Clone the repository:
```bash
git clone https://github.com/stratoslab/Canton-MCP-Server.git
cd Canton-MCP-Server
```

## Running the Server

You can run the server directly using `uv`:

```bash
uv run src/server.py
```

## Setup with Claude Desktop / generic MCP Client

Add the following to your MCP settings file (e.g., `~/Library/Application Support/Code/User/globalStorage/rooveterinary.roo-cline/settings/cline_mcp_settings.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "canton-ledgerview": {
      "command": "uv",
      "args": [
        "run",
        "src/server.py"
      ],
      "cwd": "/absolute/path/to/Canton-MCP-Server"
    }
  }
}
```

## Intelligence Features

This server includes embedded knowledge about Canton and DAML:

### Resources
Agents can read these specialized resources to understand Canton architecture:
- `canton://docs/safety-gates`: Architecture for safety verification.
- `canton://docs/auth-patterns`: Common DAML authorization patterns.

### Specialized Tools
- `analyze_daml_safety`: Performs semantic analysis on DAML code to identify missing safety markers.
- `generate_canton_deployment_script`: Generates tailored scripts for Dev/Prod environments.
- `get_project_summary`: Returns a summary of the project.
- `check_server_status`: Returns "OK" if reachable.


