'use client'
import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-white/20 bg-background/95 backdrop-blur-sm font-mono">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" aria-label="Go to homepage">
          <Image src="/DWResearch.png" alt="Open Deep Wide Research logo" width={36} height={36} priority />
          <div className="flex flex-col leading-none text-foreground/50 group-hover:text-foreground/70 transition-colors">
            <span className="text-[9px] font-semibold tracking-tight">OPEN</span>
            <span className="text-[9px] font-semibold tracking-tight">DEEP WIDE</span>
            <span className="text-[9px] font-semibold tracking-tight">RESEARCH</span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-1">
          <Link 
            href="/pricing" 
            className="text-[12px] text-foreground/50 h-[28px] inline-flex items-center px-3 border border-transparent hover:border-white/20 hover:text-foreground/80 transition-all"
          >
            Pricing
          </Link>
          <Link 
            href="/opensource" 
            className="text-[12px] text-foreground/50 h-[28px] inline-flex items-center px-3 border border-transparent hover:border-white/20 hover:text-foreground/80 transition-all"
          >
            Open Source
          </Link>
          <a 
            href="https://github.com/puppyagent/deepwideresearch" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[12px] text-foreground/50 h-[28px] inline-flex items-center px-3 border border-transparent hover:border-white/20 hover:text-foreground/80 transition-all"
          >
            GitHub
          </a>
        </nav>
        
        <a 
          href="/login" 
          className="text-[12px] px-4 py-1.5 border-2 border-[#2CAC58] text-[#2CAC58] hover:bg-[#2CAC58] hover:text-black transition-all font-medium"
        >
          Sign in
        </a>
      </div>
    </header>
  );
}


