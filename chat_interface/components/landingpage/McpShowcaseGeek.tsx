"use client";

import Image from "next/image";

export default function McpShowcaseGeek() {
  const mcpServers = [
    { 
      name: "Exa", 
      logoSrc: "/exalogo.png",
      description: "Web search",
      status: "active"
    },
    { 
      name: "Tavily", 
      logoSrc: "/tavilylogo.png",
      description: "Web search",
      status: "active"
    },
    { 
      name: "Context 7", 
      logoSrc: "/context7.svg",
      description: "Dev search",
      status: "active"
    },
  ];

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto">
      {/* MCP Ecosystem Container */}
      <div className="border-2 border-white/20 bg-black/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-foreground/50 font-semibold">MCP ECOSYSTEM</span>
          <span className="text-xs text-foreground/40">{mcpServers.length} servers connected</span>
        </div>
        
        {/* MCP Server Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mcpServers.map((server) => (
            <div
              key={server.name}
              className="border-2 border-white/20 bg-black/20 p-6 hover:bg-white/5 transition-all cursor-default group h-52 flex flex-col"
            >
              <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                <div className="w-14 h-14 flex items-center justify-center bg-white/5 border border-white/10">
                  <Image 
                    src={server.logoSrc} 
                    alt={`${server.name} logo`} 
                    width={20} 
                    height={20} 
                    className="grayscale group-hover:grayscale-0 transition-all"
                  />
                </div>
                <div className="text-center">
                  <div className="text-base font-semibold text-foreground/90">{server.name}</div>
                  <div className="text-xs text-foreground/50 mt-1">{server.description}</div>
                </div>
                <div className="mt-2">
                  <code className="text-[#2CAC58] text-sm">[✓]</code>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add More MCP */}
          <div className="border-2 border-dashed border-white/30 bg-transparent p-6 hover:bg-white/5 hover:border-white/50 transition-all cursor-default group h-52 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-foreground/40 group-hover:text-foreground/60">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <div className="text-sm font-semibold">Add MCP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


