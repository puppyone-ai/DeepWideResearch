'use client'
import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur font-mono">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Go to homepage">
          <Image src="/DWResearch.png" alt="Open Deep Wide Research logo" width={56} height={56} priority />
          <div className="flex flex-col leading-tight text-foreground/80">
            <span className="text-[11px] font-semibold tracking-tight">Open</span>
            <span className="text-[11px] font-semibold tracking-tight">Deep Wide</span>
            <span className="text-[11px] font-semibold tracking-tight">Research</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/pricing" className="text-[12px] h-[26px] inline-flex items-center px-2 rounded-md hover:bg-white/10 transition-colors">Pricing</Link>
          <Link href="/opensource" className="text-[12px] h-[26px] inline-flex items-center px-2 rounded-md hover:bg-white/10 transition-colors">Open Source</Link>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-[12px] px-3 py-1.5 bg-[#2CAC58] text-black hover:opacity-90 transition-opacity">
            Sign in
          </a>
        </div>
      </div>
    </header>
  );
}


