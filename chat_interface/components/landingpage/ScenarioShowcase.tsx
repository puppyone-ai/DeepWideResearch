"use client";

import { useState } from "react";
import Image from "next/image";

interface Scenario {
  id: string;
  name: string;
  deep: number;
  wide: number;
  useCase: string;
  time: string;
  cost: string;
}

const scenarios: Scenario[] = [
  {
    id: "quick",
    name: "Quick Chat",
    deep: 25,
    wide: 25,
    useCase: "Fast Q&A",
    time: "10s",
    cost: "$0.05"
  },
  {
    id: "deep",
    name: "Deep Analysis",
    deep: 100,
    wide: 25,
    useCase: "Technical deep dive",
    time: "2min",
    cost: "$0.50"
  },
  {
    id: "wide",
    name: "Wide Survey",
    deep: 25,
    wide: 100,
    useCase: "Broad market research",
    time: "1min",
    cost: "$0.40"
  },
  {
    id: "balanced",
    name: "Balanced Research",
    deep: 50,
    wide: 50,
    useCase: "General research",
    time: "90s",
    cost: "$0.30"
  },
  {
    id: "ultra",
    name: "Ultra Deep Dive",
    deep: 100,
    wide: 100,
    useCase: "Maximum depth & breadth",
    time: "5min",
    cost: "$2.00"
  }
];

function getBar(percentage: number): { filled: string; empty: string } {
  const total = 12;
  const filled = Math.round((percentage / 100) * total);
  return {
    filled: "█".repeat(filled),
    empty: "░".repeat(total - filled)
  };
}

export default function ScenarioShowcase() {
  const [activeScenario, setActiveScenario] = useState<string>("balanced");
  const [prevScenario, setPrevScenario] = useState<string>("balanced");
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [isAnimating, setIsAnimating] = useState(false);

  const handleScenarioChange = (id: string) => {
    if (id === activeScenario || isAnimating) return;
    
    const currentIndex = scenarios.findIndex(s => s.id === activeScenario);
    const newIndex = scenarios.findIndex(s => s.id === id);
    
    setDirection(newIndex > currentIndex ? "up" : "down");
    setPrevScenario(activeScenario);
    setIsAnimating(true);
    setActiveScenario(id);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 w-full max-w-4xl mx-auto">
      {/* Left: Scenario Tabs */}
      <div className="w-full lg:w-64 flex-shrink-0 font-mono border-2 border-r-0 lg:border-r-0 border-white/20 bg-black/20 p-3">
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioChange(scenario.id)}
              className={`w-full text-left px-3 py-2.5 border-2 transition-all text-xs ${
                activeScenario === scenario.id
                  ? "bg-white/5 border-white/30 text-foreground/90 font-bold"
                  : "bg-transparent border-white/5 text-foreground/50 hover:bg-white/[0.02] hover:border-white/10 hover:text-foreground/70"
              }`}
            >
              <div className="flex items-stretch justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <div className="text-[10px] flex items-center gap-1.5">
                    <span className="text-foreground/50">Deep:</span>
                    <code className="text-[9px]">
                      <span className="text-[#4599DF]">{getBar(scenario.deep).filled}</span>
                      <span className="text-foreground/30">{getBar(scenario.deep).empty}</span>
                    </code>
                    <span className="text-[#4599DF]">{scenario.deep}%</span>
                  </div>
                  <div className="text-[10px] flex items-center gap-1.5">
                    <span className="text-foreground/50">Wide:</span>
                    <code className="text-[9px]">
                      <span className="text-[#FFA73D]">{getBar(scenario.wide).filled}</span>
                      <span className="text-foreground/30">{getBar(scenario.wide).empty}</span>
                    </code>
                    <span className="text-[#FFA73D]">{scenario.wide}%</span>
                  </div>
                </div>
                <div className="self-stretch w-px bg-white/30 mx-2"></div>
                <div className="flex flex-col items-end justify-center gap-0.5 text-[10px] text-foreground/40 flex-shrink-0">
                  <span>{scenario.time}</span>
                  <span>{scenario.cost}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Chat Interface Preview */}
      <div className="flex-1 relative overflow-hidden border-2 border-white/20 bg-black/20">
        {/* Previous Image - sliding out */}
        {isAnimating && (
          <div
            className="absolute inset-0"
            style={{
              animation: direction === "up" ? "slide-out-up 0.3s ease-in-out" : "slide-out-down 0.3s ease-in-out",
            }}
          >
            <Image
              src="/chat_interface.png"
              alt="Deep Wide Research Chat Interface"
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        )}
        
        {/* New Image - sliding in */}
        <div
          key={activeScenario}
          style={{
            animation: isAnimating ? `slide-${direction} 0.3s ease-in-out` : "none",
          }}
        >
          <Image
            src="/chat_interface.png"
            alt="Deep Wide Research Chat Interface"
            width={1200}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </div>
  );
}


