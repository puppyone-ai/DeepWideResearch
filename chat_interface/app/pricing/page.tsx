import SiteHeader from "@/components/landingpage/SiteHeader";
import SiteFooter from "@/components/landingpage/SiteFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Cloud Hosted Plans",
  description: "Deep Wide Research pricing plans. Choose from Free, Plus, Pro, or Enterprise tiers. Or self-host the open-source version for free.",
  alternates: {
    canonical: "https://deepwideresearch.com/pricing",
  },
  openGraph: {
    title: "Pricing - Deep Wide Research Cloud Plans",
    description: "Flexible pricing for enterprise-grade AI research. From free community tier to unlimited enterprise plans. Or self-host for free.",
    url: "https://deepwideresearch.com/pricing",
    type: "website",
    images: [
      {
        url: "/DWResearch.png",
        width: 1200,
        height: 630,
        alt: "Deep Wide Research Pricing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - Deep Wide Research Cloud Plans",
    description: "Flexible pricing for enterprise-grade AI research. From free community tier to unlimited enterprise plans. Or self-host for free.",
    creator: "@realGuantum",
    images: ["/DWResearch.png"],
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen w-full font-mono bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Hero Section */}
        <header className="mb-12">
          <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-4">Pricing</div>
          <h1 className="text-[28px] md:text-[36px] font-light text-foreground/80 leading-tight tracking-tight mb-4">
            Simple, <span className="text-[#2CAC58]">transparent</span><br />
            pricing.
          </h1>
          <p className="text-[13px] text-foreground/50 max-w-xl leading-relaxed">
            Cloud-hosted plans for teams who want managed infrastructure. Or self-host for free — it&apos;s open source.
          </p>
        </header>

        {/* Pricing Tiers */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Free Tier */}
            <div className="border-2 border-white/20 p-6 flex flex-col">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-2">Free</div>
              <div className="mb-6">
                <span className="text-[32px] font-light text-foreground/80">$0</span>
                <span className="text-[11px] text-foreground/40 ml-1">/ month</span>
              </div>
              
              <div className="space-y-2 text-[11px] text-foreground/50 mb-6 flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span><span className="text-foreground/70">100</span> credits/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground/30">×</span>
                  <span className="text-foreground/30">API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>Community support</span>
                </div>
              </div>
              
              <button className="w-full border border-white/20 hover:border-white/40 hover:bg-white/[0.02] px-4 py-2.5 text-[11px] text-foreground/60 transition-all">
                Get Started
              </button>
            </div>

            {/* Plus Tier - Highlighted */}
            <div className="border-2 border-[#2CAC58] p-6 flex flex-col relative">
              <div className="absolute -top-3 right-4 bg-[#2CAC58] px-2 py-0.5 text-[9px] font-medium text-black tracking-wider">
                POPULAR
              </div>
              
              <div className="text-[10px] text-[#2CAC58] uppercase tracking-wider mb-2">Plus</div>
              <div className="mb-6">
                <span className="text-[32px] font-light text-foreground/80">$15</span>
                <span className="text-[11px] text-foreground/40 ml-1">/ month</span>
              </div>
              
              <div className="space-y-2 text-[11px] text-foreground/50 mb-6 flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span><span className="text-foreground/70">2,000</span> credits/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>API & SDK access</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>Advanced features</span>
                </div>
              </div>
              
              <button className="w-full border-2 border-[#2CAC58] text-[#2CAC58] hover:bg-[#2CAC58] hover:text-black px-4 py-2.5 text-[11px] font-medium transition-all">
                Upgrade to Plus
              </button>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-white/20 p-6 flex flex-col">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-2">Pro</div>
              <div className="mb-6">
                <span className="text-[32px] font-light text-foreground/80">$100</span>
                <span className="text-[11px] text-foreground/40 ml-1">/ month</span>
              </div>
              
              <div className="space-y-2 text-[11px] text-foreground/50 mb-6 flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span><span className="text-foreground/70">15,000</span> credits/mo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>API & SDK access</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>Dedicated support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>Custom integrations</span>
                </div>
              </div>
              
              <button className="w-full border border-white/20 hover:border-white/40 hover:bg-white/[0.02] px-4 py-2.5 text-[11px] text-foreground/60 transition-all">
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="border-2 border-white/20 p-6 flex flex-col">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-2">Enterprise</div>
              <div className="mb-6">
                <span className="text-[24px] font-light text-foreground/80">Custom</span>
              </div>
              
              <div className="space-y-2 text-[11px] text-foreground/50 mb-6 flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span><span className="text-foreground/70">Unlimited</span> credits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>24/7 support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>SLA & compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#2CAC58]">✓</span>
                  <span>Custom deployment</span>
                </div>
              </div>
              
              <button className="w-full border border-white/20 hover:border-white/40 hover:bg-white/[0.02] px-4 py-2.5 text-[11px] text-foreground/60 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* Open Source Section */}
        <section className="border-2 border-white/20 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-foreground/50" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                <span className="text-[13px] font-medium text-foreground/70">Prefer to self-host?</span>
              </div>
              <p className="text-[11px] text-foreground/40 max-w-md">
                Deep Wide Research is completely open source. Self-host the entire platform with no limitations.
              </p>
            </div>
            <a 
              href="https://github.com/puppyagent/deepwideresearch" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 hover:bg-white/[0.02] px-4 py-2.5 text-[11px] text-foreground/60 transition-all whitespace-nowrap"
            >
              <span>View on GitHub</span>
              <span>→</span>
            </a>
          </div>
        </section>
      </main>
      
      <div className="mt-24 md:mt-32" aria-hidden="true" />
      <SiteFooter />
    </div>
  );
}



