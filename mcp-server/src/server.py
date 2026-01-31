from fastmcp import FastMCP
from pydantic import BaseModel, Field
import os
import json
from pathlib import Path

# Initialize the MCP Server
mcp = FastMCP("Canton Ledgerview Assistant")

# --- Helper Models (Pydantic) ---
class ProjectSummary(BaseModel):
    name: str
    dependencies: dict[str, str] = Field(default_factory=dict)
    total_files: int

# --- Resources (The "Intelligence") ---
# These serve the embedded documentation files as MCP Resources.
# Agents can read these to understand Canton/DAML architecture.

DOCS_DIR = Path(__file__).parent.parent / "docs"

def _read_doc(filename: str) -> str:
    """Helper to read documentation files."""
    doc_path = DOCS_DIR / filename
    if doc_path.exists():
        return doc_path.read_text()
    return f"Error: Documentation file {filename} not found."

@mcp.resource("canton://docs/ledger-model")
def get_ledger_model() -> str:
    """Returns the complete DAML Ledger Model documentation."""
    return _read_doc("daml_ledger_model.md")

@mcp.resource("canton://docs/architecture")
def get_canton_architecture() -> str:
    """Returns the Canton Network architecture and deployment guide."""
    return _read_doc("canton_architecture.md")

@mcp.resource("canton://docs/language-reference")
def get_daml_language_reference() -> str:
    """Returns the DAML language reference and syntax guide."""
    return _read_doc("daml_language_reference.md")

@mcp.resource("canton://docs/chainsafe-mcp")
def get_chainsafe_mcp_reference() -> str:
    """Returns the ChainSafe Canton MCP Server architecture and tool implementation guide."""
    return _read_doc("chainsafe_mcp_reference.md")

@mcp.resource("canton://docs/llm-architecture")
def get_llm_architecture() -> str:
    """Returns the LLM-Primary Architecture for DAML analysis."""
    return _read_doc("llm_architecture.md")

@mcp.resource("canton://docs/quickstart-demo")
def get_quickstart_demo() -> str:
    """Returns the Canton Network Quickstart Demo walkthrough guide."""
    return _read_doc("canton_quickstart_demo.md")

@mcp.tool()
def list_available_docs() -> str:
    """Lists all available Canton/DAML documentation resources."""
    docs = list(DOCS_DIR.glob("*.md"))
    if not docs:
        return "No documentation files found."
    
    doc_list = []
    for doc in sorted(docs):
        doc_list.append(f"- {doc.stem}: canton://docs/{doc.stem.replace('_', '-')}")
    
    return "Available Documentation Resources:\n" + "\n".join(doc_list)

@mcp.resource("canton://docs/daml-intro")
def get_daml_introduction() -> str:
    """Returns the DAML Introduction and Tutorial."""
    return _read_doc("daml_introduction.md")

@mcp.resource("canton://docs/daml-patterns")
def get_daml_patterns() -> str:
    """Returns the DAML Design Patterns and Anti-Patterns guide."""
    return _read_doc("daml_patterns.md")

@mcp.resource("canton://docs/splice-overview")
def get_splice_overview() -> str:
    """Returns the Splice & Global Synchronizer Overview."""
    return _read_doc("splice_overview.md")

@mcp.resource("canton://docs/splice-scan-api")
def get_splice_scan_api() -> str:
    """Returns the Splice Scan API Reference."""
    return _read_doc("splice_scan_api.md")

@mcp.tool()
def add_documentation(filename: str, content: str, description: str = "") -> str:
    """
    Adds a new documentation file to the MCP server's knowledge base.
    
    Args:
        filename: name of the file (e.g., 'my_guide.md')
        content: The markdown content of the documentation
        description: Short description of what this doc covers
    """
    if not filename.endswith(".md"):
        filename += ".md"
    
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name
    file_path = DOCS_DIR / safe_filename
    
    try:
        if file_path.exists():
            return f"Error: File '{safe_filename}' already exists. Please use a different name or manually update it."
            
        file_path.write_text(content)
        return f"Successfully added documentation: {safe_filename}\nIt will be available via the 'list_available_docs' tool."
    except Exception as e:
        return f"Failed to save documentation: {str(e)}"

# --- Tools ---

@mcp.tool()
async def analyze_daml_safety(code: str) -> str:
    """
    Analyzes DAML code against the Canton Safety Gates.
    This simulates the 'intelligent' reasoning by checking for specific safety markers.
    """
    issues = []
    if "signatory" not in code.lower():
        issues.append("Warning: No signatories defined. This contract might be unauthorized.")
    if "controller" not in code.lower():
        issues.append("Warning: No controllers defined. The contract may be immutable/unusable.")
    
    if not issues:
        return "✅ DAML code passes basic safety gate analysis."
    return "❌ Safety Issues Found:\n- " + "\n- ".join(issues)

@mcp.tool()
def generate_canton_deployment_script(network_type: str = "dev") -> str:
    """
    Generates a starter deployment script for a Canton network.
    """
    if network_type == "prod":
        return "# PROD DEPLOYMENT\n# 1. Verify DCAP settings\n# 2. Check x402 payment routes\n# 3. Submit to Canton Ledger"
    return "# DEV DEPLOYMENT\n# 1. daml build\n# 2. daml ledger upload-dar --host localhost --port 6865"

@mcp.tool()
def get_project_summary(project_path: str = ".") -> str:

    """
    Reads the package.json and counts files in the specified project path to provide a summary.
    Arguments:
        project_path: Relative or absolute path to the project root.
    """
    base_path = Path(project_path).resolve()
    
    # Check for package.json
    package_json_path = base_path / "package.json"
    if not package_json_path.exists():
        return f"Error: No package.json found at {base_path}"
    
    try:
        with open(package_json_path, 'r') as f:
            data = json.load(f)
            
        name = data.get("name", "Unknown")
        deps = data.get("dependencies", {})
        
        # Count files roughly (ignoring node_modules)
        file_count = 0
        for _ in base_path.rglob("*"):
             if "node_modules" not in str(_):
                 file_count += 1

        return f"Project: {name}\nDependencies: {', '.join(deps.keys())}\nEstimated Files: {file_count}"

    except Exception as e:
        return f"Failed to analyze project: {str(e)}"

@mcp.tool()
def check_server_status() -> str:
    """Returns a simple 'OK' if the server is up."""
    return "Server is running and healthy!"

# Entry point for 'uv run'
if __name__ == "__main__":
    mcp.run()
