'use client'
import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t-2 border-white/20 font-mono">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Hero tagline - the signature element */}
        <div className="mb-12">
          <p className="text-[24px] md:text-[32px] font-light text-foreground/70 leading-tight tracking-tight">
            making the world<br />
            <span className="text-[#2CAC58]">friendly</span> for AI agents
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Product */}
          <div>
            <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-4">Product</div>
            <div className="flex flex-col gap-2 text-[12px] text-foreground/50">
              <Link href="/pricing" className="hover:text-foreground/80 transition-colors w-fit">Pricing</Link>
              <Link href="/opensource" className="hover:text-foreground/80 transition-colors w-fit">Open Source</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-4">Resources</div>
            <div className="flex flex-col gap-2 text-[12px] text-foreground/50">
              <a href="https://github.com/puppyagent/deepwideresearch" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/80 transition-colors w-fit">GitHub</a>
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-4">Company</div>
            <div className="flex flex-col gap-2 text-[12px] text-foreground/50">
              <a href="https://puppyagent.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/80 transition-colors w-fit">PuppyAgent</a>
              <a href="mailto:guantum@puppyagent.com" className="hover:text-foreground/80 transition-colors w-fit">Contact</a>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-end justify-start">
            <div className="flex items-center gap-2">
              <Image src="/DWResearch.png" alt="Open Deep Wide Research logo" width={32} height={32} />
              <div className="flex flex-col leading-none text-foreground/40">
                <span className="text-[9px] font-semibold">OPEN</span>
                <span className="text-[9px] font-semibold">DEEP WIDE</span>
                <span className="text-[9px] font-semibold">RESEARCH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-[10px] text-foreground/30">
            © {new Date().getFullYear()} PuppyAgent Tech Pte Ltd
          </p>
          <p className="text-[10px] text-foreground/20 font-mono">
            v0.1.0 • MIT License
          </p>
        </div>
      </div>
    </footer>
  );
}


