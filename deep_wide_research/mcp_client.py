"""MCP Client for connecting to MCP servers and executing tools.

This module provides a unified interface for interacting with MCP servers,
including listing available tools and executing tool calls.

Features:
- Pluggable MCP server configuration
- Built-in support for Tavily and Exa
- Easy registration of custom MCP servers
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

# Load .env file
try:
    from dotenv import load_dotenv
    from pathlib import Path
    
    # Explicitly specify .env file path (in the current file directory)
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass  # If python-dotenv is not installed, continue using system environment variables


# ============================================================================
# MCP Server Configuration System
# ============================================================================

@dataclass
class MCPServerConfig:
    """MCP Server Configuration
    
    Attributes:
        name: Server name (e.g., "tavily", "exa")
        transport_type: Transport type ("stdio" or "http")
        command: Command for stdio mode (e.g., "npx", "node")
        args: Arguments for stdio mode (e.g., ["-y", "@tavily/mcp-server"])
        env: Environment variables (e.g., {"TAVILY_API_KEY": "xxx"})
        server_url: Server URL for http mode
        description: Server description
    """
    name: str
    transport_type: str = "stdio"
    command: Optional[str] = None
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    server_url: Optional[str] = None
    description: str = ""


class MCPRegistry:
    """MCP Server Registry
    
    Manages all registered MCP server configurations, supports dynamic addition and query.
    
    Usage example:
        registry = MCPRegistry()
        
        # Register server
        registry.register(MCPServerConfig(
            name="tavily",
            command="npx",
            args=["-y", "@tavily/mcp-server"],
            env={"TAVILY_API_KEY": os.getenv("TAVILY_API_KEY")}
        ))
        
        # Get server configuration
        config = registry.get("tavily")
        
        # Create client
        client = await registry.create_client("tavily")
    """
    
    def __init__(self):
        self._servers: Dict[str, MCPServerConfig] = {}
        self._load_builtin_servers()
        self._active_clients: List["MCPClient"] = []
    
    def _load_builtin_servers(self):
        """Load built-in MCP servers (Tavily, Exa)
        
        Strategy: Use official HTTP MCP servers for all environments (local and cloud)
        - Simpler: No Node.js/npx dependency
        - Reliable: Official servers maintained by Tavily/Exa
        - Consistent: Same behavior everywhere
        
        Reference: https://docs.tavily.com/documentation/mcp
        """
        
        # Tavily MCP Server - Always use HTTP
        tavily_api_key = os.getenv("TAVILY_API_KEY")
        if tavily_api_key:
            self.register(MCPServerConfig(
                name="tavily",
                transport_type="http",
                server_url=f"https://mcp.tavily.com/mcp/?tavilyApiKey={tavily_api_key}",
                description="Tavily search MCP server - powerful web search"
            ))
        else:
            print("⚠️  Tavily MCP server skipped: TAVILY_API_KEY not found")
        
        # Exa MCP Server - Always use HTTP
        exa_api_key = os.getenv("EXA_API_KEY")
        if exa_api_key:
            self.register(MCPServerConfig(
                name="exa",
                transport_type="http",
                server_url=f"https://mcp.exa.ai/mcp?exaApiKey={exa_api_key}",
                description="Exa search MCP server - AI-powered web search"
            ))
        else:
            print("⚠️  Exa MCP server skipped: EXA_API_KEY not found")
    
    def register(self, config: MCPServerConfig, silent: bool = False) -> None:
        """Register an MCP server
        
        Args:
            config: MCP server configuration
            silent: Silent mode (do not print logs)
        """
        if config.name in self._servers and not silent:
            print(f"⚠️  Overwriting existing MCP server: {config.name}")
        self._servers[config.name] = config
        if not silent:
            print(f"✅ Registered MCP server: {config.name}")
    
    def unregister(self, name: str) -> bool:
        """Unregister an MCP server
        
        Args:
            name: Server name
            
        Returns:
            Whether unregistration was successful
        """
        if name in self._servers:
            del self._servers[name]
            print(f"✅ Unregistered MCP server: {name}")
            return True
        return False
    
    def get(self, name: str) -> Optional[MCPServerConfig]:
        """Get MCP server configuration
        
        Args:
            name: Server name
            
        Returns:
            Server configuration, or None if not found
        """
        return self._servers.get(name)
    
    def list_servers(self) -> List[str]:
        """List all registered server names"""
        return list(self._servers.keys())
    
    def list_configs(self) -> List[MCPServerConfig]:
        """List all registered server configurations"""
        return list(self._servers.values())
    
    async def create_client(self, name: str) -> Optional["MCPClient"]:
        """Create and connect an MCP client based on registered configuration
        
        Args:
            name: Server name
            
        Returns:
            Connected MCPClient instance, or None if server not found
        """
        config = self.get(name)
        if not config:
            print(f"❌ MCP server '{name}' not found in registry")
            return None
        
        if config.transport_type == "stdio":
            client = MCPClient.create_stdio_client(
                command=config.command,
                args=config.args,
                env=config.env
            )
        elif config.transport_type == "http":
            client = MCPClient.create_http_client(
                server_url=config.server_url
            )
        else:
            print(f"❌ Unknown transport type: {config.transport_type}")
            return None
        
        # Tag client with server name for routing
        try:
            setattr(client, "_server_name", name)
        except Exception:
            pass

        await client.connect()
        # NOTE: No longer tracking clients globally to avoid concurrency issues.
        # Callers should close clients themselves after use.
        return client
    
    async def collect_tools(self, config: Dict[str, List[str]]) -> tuple[List[Dict[str, Any]], List["MCPClient"]]:
        """Collect tools from multiple MCP servers based on configuration
        
        Args:
            config: Two-dimensional configuration, for example:
                {
                    "tavily": ["tavily-search", "tavily-extract"],
                    "exa": ["web_search_exa"]
                }
        
        Returns:
            (tool list, client list) - caller needs to manually close clients
        """
        all_tools = []
        clients = []
        
        for server_name, tool_names in config.items():
            if server_name not in self._servers:
                continue
            
            client = await self.create_client(server_name)
            if not client:
                continue
            
            clients.append(client)
            
            selected = await client.select_tools(tool_names)
            all_tools.extend(selected)
        
        return all_tools, clients

    async def close_all_clients(self) -> None:
        """Deprecated: No longer tracks clients globally.
        
        Clients should be closed by the caller that created them.
        This method is kept for backward compatibility but does nothing.
        """
        pass


# Global registry instance
_global_registry = MCPRegistry()


def get_registry() -> MCPRegistry:
    """Get global MCP registry instance"""
    return _global_registry


# ============================================================================
# MCP Client
# ============================================================================

class MCPClient:
    """MCP Client - Connect to MCP server and execute tool calls
    
    Usage example:
        # Method 1: Connect using stdio
        client = MCPClient.create_stdio_client(
            command="npx",
            args=["-y", "@modelcontextprotocol/server-brave-search"]
        )
        
        # Method 2: Connect using HTTP
        client = MCPClient.create_http_client(
            server_url="http://localhost:3000"
        )
        
        # Initialize connection
        await client.connect()
        
        # Get tool list
        tools = await client.list_tools()
        
        # Call a tool
        result = await client.call_tool("search", {"query": "Python"})
        
        # Close connection
        await client.close()
    """
    
    def __init__(self, transport_type: str = "stdio", **kwargs):
        """Initialize MCP client
        
        Args:
            transport_type: Transport type, can be "stdio" or "http"
            **kwargs: Transport-related configuration parameters
                - command: stdio command
                - args: stdio arguments
                - env: environment variables dictionary
                - server_url: HTTP server URL
        """
        self.transport_type = transport_type
        self.config = kwargs
        self._connected = False
        self._session = None
        self._read_stream = None
        self._write_stream = None
        self._stdio_context = None
        
        # Initialize corresponding configuration based on transport_type
        if transport_type == "stdio":
            try:
                from mcp import StdioServerParameters
                self._stdio_params = StdioServerParameters(
                    command=kwargs.get("command"),
                    args=kwargs.get("args", []),
                    env=kwargs.get("env")
                )
            except ImportError:
                print("⚠️ MCP SDK not installed. Run: pip install mcp")
                self._stdio_params = None
        elif transport_type == "http":
            self._server_url = kwargs.get("server_url")
    
    @classmethod
    def create_stdio_client(
        cls, 
        command: str, 
        args: Optional[List[str]] = None,
        env: Optional[Dict[str, str]] = None
    ) -> MCPClient:
        """Create an MCP client with stdio transport
        
        Args:
            command: Command to execute (e.g., "npx", "node", "python")
            args: Command arguments (e.g., ["-y", "@modelcontextprotocol/server-brave-search"])
            env: Environment variables (e.g., {"API_KEY": "xxx"})
        
        Returns:
            MCPClient instance
        """
        return cls(transport_type="stdio", command=command, args=args or [], env=env)
    
    @classmethod
    def create_http_client(cls, server_url: str) -> MCPClient:
        """Create an MCP client with HTTP transport
        
        Args:
            server_url: MCP server URL
        
        Returns:
            MCPClient instance
        """
        return cls(transport_type="http", server_url=server_url)
    
    async def connect(self) -> None:
        """Connect to MCP server"""
        if self._connected:
            return
        
        try:
            if self.transport_type == "stdio":
                # Delay connection establishment in each operation, don't persist here
                pass
                
            elif self.transport_type == "http":
                # Delay http session creation in each operation
                self._http_session = None
            
            self._connected = True
            
        except ImportError as e:
            print(f"❌ MCP SDK not installed: {e}")
            print("Run: pip install mcp")
            raise
        except Exception as e:
            print(f"❌ Failed to connect to MCP server: {e}")
            raise
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """Get the list of tools provided by MCP server
        
        Returns:
            Tool list in MCP standard format:
            [
                {
                    "name": "search",
                    "description": "Search the web",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query"}
                        },
                        "required": ["query"]
                    }
                },
                ...
            ]
        """
        if not self._connected:
            await self.connect()
        
        try:
            if self.transport_type == "stdio":
                from mcp.client.stdio import stdio_client
                from mcp import ClientSession
                async with stdio_client(self._stdio_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        response = await session.list_tools()
                        tools = []
                        for tool in response.tools:
                            tools.append({
                                "name": tool.name,
                                "description": tool.description or "",
                                "inputSchema": tool.inputSchema if hasattr(tool, 'inputSchema') else {}
                            })
                        return tools
                
            elif self.transport_type == "http":
                import aiohttp
                import ssl
                
                # Create SSL context with proper certificate verification
                ssl_context = ssl.create_default_context()
                
                # Use system proxy if available (for local development with proxy)
                proxy = os.getenv("https_proxy") or os.getenv("HTTPS_PROXY") or os.getenv("http_proxy") or os.getenv("HTTP_PROXY")
                
                # Create connector with SSL and timeout settings
                connector = aiohttp.TCPConnector(ssl=ssl_context)
                timeout = aiohttp.ClientTimeout(total=30, connect=10)
                
                async with aiohttp.ClientSession(connector=connector, timeout=timeout) as http_sess:
                    # MCP uses JSON-RPC 2.0 protocol
                    payload = {
                        "jsonrpc": "2.0",
                        "method": "tools/list",
                        "params": {},
                        "id": 1
                    }
                    headers = {
                        "Content-Type": "application/json",
                        "Accept": "application/json, text/event-stream"
                    }
                    
                    # Make request with proxy if available
                    kwargs = {"json": payload, "headers": headers}
                    if proxy:
                        kwargs["proxy"] = proxy
                    
                    async with http_sess.post(self._server_url, **kwargs) as resp:
                        if resp.status == 200:
                            # Remote MCP returns SSE format, needs parsing
                            text = await resp.text()
                            # SSE format: "event: message\ndata: {...}\n\n"
                            import json as json_module
                            for line in text.split('\n'):
                                if line.startswith('data: '):
                                    json_str = line[6:]  # Remove "data: " prefix
                                    result = json_module.loads(json_str)
                                    # JSON-RPC response format: {"result": {"tools": [...]}}
                                    tools_data = result.get("result", {}).get("tools", [])
                                    return [{"name": t.get("name"), "description": t.get("description", ""), "inputSchema": t.get("inputSchema", {})} for t in tools_data]
                            raise RuntimeError("No valid data in SSE response")
                        else:
                            raise RuntimeError(f"HTTP request failed: {resp.status}")
            
        except Exception as e:
            print(f"❌ Failed to list tools: {e}")
            raise
    
    async def select_tools(self, tool_names: List[str]) -> List[Dict[str, Any]]:
        """Select needed tools based on tool names
        
        Args:
            tool_names: List of needed tool names, for example ["tavily-search", "web_search_exa"]
        
        Returns:
            Filtered tool list
        """
        all_tools = await self.list_tools()
        selected = []
        for tool in all_tools:
            if tool["name"] in tool_names:
                selected.append(tool)
        return selected
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool on MCP server
        
        Args:
            tool_name: Tool name
            arguments: Tool arguments
        
        Returns:
            Tool execution result
        """
        if not self._connected:
            await self.connect()
        
        try:
            if self.transport_type == "stdio":
                from mcp.client.stdio import stdio_client
                from mcp import ClientSession
                async with stdio_client(self._stdio_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        response = await session.call_tool(
                            name=tool_name,
                            arguments=arguments
                        )
                        if hasattr(response, 'content'):
                            if isinstance(response.content, list):
                                content = []
                                for item in response.content:
                                    if hasattr(item, 'text'):
                                        content.append(item.text)
                                    elif hasattr(item, 'data'):
                                        content.append(item.data)
                                    else:
                                        content.append(str(item))
                                return {"result": "\n".join(content)}
                            else:
                                return {"result": response.content}
                        else:
                            return {"result": str(response)}
                
            elif self.transport_type == "http":
                import aiohttp
                import ssl
                
                # Create SSL context with proper certificate verification
                ssl_context = ssl.create_default_context()
                
                # Use system proxy if available (for local development with proxy)
                proxy = os.getenv("https_proxy") or os.getenv("HTTPS_PROXY") or os.getenv("http_proxy") or os.getenv("HTTP_PROXY")
                
                # Create connector with SSL and timeout settings
                connector = aiohttp.TCPConnector(ssl=ssl_context)
                timeout = aiohttp.ClientTimeout(total=30, connect=10)
                
                async with aiohttp.ClientSession(connector=connector, timeout=timeout) as http_sess:
                    # MCP uses JSON-RPC 2.0 protocol to call tools
                    payload = {
                        "jsonrpc": "2.0",
                        "method": "tools/call",
                        "params": {
                            "name": tool_name,
                            "arguments": arguments
                        },
                        "id": 2
                    }
                    headers = {
                        "Content-Type": "application/json",
                        "Accept": "application/json, text/event-stream"
                    }
                    
                    # Make request with proxy if available
                    kwargs = {"json": payload, "headers": headers}
                    if proxy:
                        kwargs["proxy"] = proxy
                    
                    async with http_sess.post(self._server_url, **kwargs) as resp:
                        if resp.status == 200:
                            # Remote MCP returns SSE format, needs parsing
                            text = await resp.text()
                            # SSE format: "event: message\ndata: {...}\n\n"
                            import json as json_module
                            for line in text.split('\n'):
                                if line.startswith('data: '):
                                    json_str = line[6:]  # Remove "data: " prefix
                                    result = json_module.loads(json_str)
                                    # JSON-RPC response: {"result": {"content": [...]}}
                                    return result.get("result", {})
                            raise RuntimeError("No valid data in SSE response")
                        else:
                            raise RuntimeError(f"HTTP request failed: {resp.status}")
            
        except Exception as e:
            print(f"❌ Failed to call tool '{tool_name}': {e}")
            raise
    
    async def close(self) -> None:
        """Close MCP connection"""
        if not self._connected:
            return
        
        try:
            # Adopt strategy of opening/closing on each call, no need to actually close here
            
            self._connected = False
            
        except Exception as e:
            # Silently handle close errors, but don't interrupt main flow
            try:
                # Last resort: ensure marked as disconnected to avoid closing twice
                self._connected = False
            except:
                pass
    
    async def __aenter__(self):
        """Support async with syntax"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Support async with syntax"""
        await self.close()


# Convenience function: create and connect MCP client
async def create_mcp_client(
    transport_type: str = "stdio",
    **kwargs
) -> MCPClient:
    """Create and connect MCP client
    
    Args:
        transport_type: "stdio" or "http"
        **kwargs: Transport-related configuration parameters
            - For stdio: command, args
            - For http: server_url
    
    Returns:
        Connected MCPClient instance
    
    Usage example:
        # stdio method
        client = await create_mcp_client(
            transport_type="stdio",
            command="npx",
            args=["-y", "@modelcontextprotocol/server-brave-search"]
        )
        
        # http method
        client = await create_mcp_client(
            transport_type="http",
            server_url="http://localhost:3000"
        )
    """
    client = MCPClient(transport_type=transport_type, **kwargs)
    await client.connect()
    return client


if __name__ == "__main__":
    """Test MCP client and plugin registration system"""
    import asyncio
    
    async def test_registry():
        registry = get_registry()
        
        if not registry.list_servers():
            print("No servers registered")
            return
        
        # Tools needed by Deep Research
        # Note: HTTP MCP uses underscores in tool names
        needed_tools = ["tavily_search", "web_search_exa", "tavily_extract"]
        
        # Test all registered servers
        for server_name in registry.list_servers():
            print(f"\n{'='*80}")
            print(f"Testing server: {server_name}")
            print('='*80)
            
            try:
                client = await registry.create_client(server_name)
                
                # Test select_tools()
                print("\nselect_tools() with needed tools:")
                print(f"Needed: {needed_tools}")
                selected = await client.select_tools(needed_tools)
                print(f"\nSelected {len(selected)} tool(s):")
                for tool in selected:
                    print(f"  - {tool['name']}")
                
                # Test first selected tool
                if selected:
                    tool_name = selected[0]['name']
                    test_args = {"query": "test", "max_results": 1} if "tavily" in tool_name else {"query": "test", "numResults": 1}
                    
                    print(f"\ncall_tool('{tool_name}', {json.dumps(test_args)}) raw output:")
                    result = await client.call_tool(tool_name, test_args)
                    print(json.dumps(result, indent=2))
                
                await client.close()
                
            except Exception as e:
                print(f"Error: {e}")
    
    asyncio.run(test_registry())

