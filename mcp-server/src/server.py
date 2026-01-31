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

# --- Tools ---

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
