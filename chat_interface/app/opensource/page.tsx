import SiteHeader from "@/components/landingpage/SiteHeader";
import SiteFooter from "@/components/landingpage/SiteFooter";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Source Projects & Community",
  description: "Deep Wide Research is an open-source company. Explore our GitHub repositories, contributors, and open-source projects including PuppyChat and Deep Wide Research.",
  alternates: {
    canonical: "https://deepwideresearch.com/opensource",
  },
  openGraph: {
    title: "Open Source Projects & Community - Deep Wide Research",
    description: "Explore our open-source projects and join our community. Star us on GitHub and contribute to enterprise-grade AI research tools.",
    url: "https://deepwideresearch.com/opensource",
    type: "website",
    images: [
      {
        url: "/DWResearch.png",
        width: 1200,
        height: 630,
        alt: "Deep Wide Research Open Source",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Source Projects & Community - Deep Wide Research",
    description: "Explore our open-source projects and join our community. Star us on GitHub and contribute to enterprise-grade AI research tools.",
    creator: "@realGuantum",
    images: ["/DWResearch.png"],
  },
};

export default function OpenSourcePage() {
  return (
    <div className="min-h-screen w-full font-mono bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Hero Section */}
        <header className="mb-12">
          <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-4">Open Source</div>
          <h1 className="text-[28px] md:text-[36px] font-light text-foreground/80 leading-tight tracking-tight mb-4">
            Built in the <span className="text-[#2CAC58]">open</span>,<br />
            for everyone.
          </h1>
          <p className="text-[13px] text-foreground/50 max-w-xl leading-relaxed">
            Deep Wide Research is an open-source company. We believe in transparency, community collaboration, and making powerful AI research tools accessible to all.
          </p>
        </header>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - GitHub CTA + Projects */}
          <div className="lg:col-span-2 space-y-6">
            {/* GitHub CTA */}
            <section className="border-2 border-[#2CAC58] p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-[#2CAC58]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[14px] font-semibold text-foreground/80">Star us on GitHub</span>
                  </div>
                  <p className="text-[12px] text-foreground/50">
                    Contribute code, report issues, or fork the project.
                  </p>
                </div>
                <a 
                  href="https://github.com/puppyagent/deepwideresearch" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-[#2CAC58] text-[#2CAC58] hover:bg-[#2CAC58] hover:text-black px-5 py-2.5 text-[12px] font-medium transition-all"
                >
                  <span>View Repository</span>
                  <span>→</span>
                </a>
              </div>
            </section>

            {/* Projects */}
            <section className="border-2 border-white/20 p-6">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-6">Projects</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="https://github.com/puppyagent/deepwideresearch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-white/10">
                    <Image src="/DWResearch.png" alt="Deep Wide Research logo" width={24} height={24} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">Deep Wide Research</div>
                    <p className="text-[10px] text-foreground/40">AI research agent</p>
                  </div>
                  <code className="text-[11px] text-foreground/30 group-hover:text-foreground/50 transition-colors">→</code>
                </a>
                <a
                  href="https://github.com/PuppyAgent/PuppyChat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center border border-white/10">
                    <Image src="/puppychatlogo.png" alt="PuppyChat logo" width={24} height={24} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">PuppyChat</div>
                    <p className="text-[10px] text-foreground/40">React chat SDK</p>
                  </div>
                  <code className="text-[11px] text-foreground/30 group-hover:text-foreground/50 transition-colors">→</code>
                </a>
              </div>
            </section>
          </div>

          {/* Right Column - Contributors + Sponsors */}
          <div className="space-y-6">
            {/* Contributors */}
            <section className="border-2 border-white/20 p-6">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-6">Contributors</div>
              <div className="space-y-2">
                {[
                  { name: 'realGuantum', url: 'https://github.com/realGuantum' },
                  { name: 'ERerGB', url: 'https://github.com/ERerGB' },
                  { name: 'HYPERVAPOR', url: 'https://github.com/HYPERVAPOR' }
                ].map((contributor) => (
                  <a 
                    key={contributor.name}
                    href={contributor.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 p-2 border border-white/10 hover:border-white/30 hover:bg-white/[0.02] transition-all group"
                  >
                    <img 
                      src={`https://github.com/${contributor.name}.png`} 
                      alt={`${contributor.name} avatar`} 
                      className="h-7 w-7" 
                    />
                    <span className="text-[11px] text-foreground/60 group-hover:text-foreground/80 transition-colors">{contributor.name}</span>
                    <code className="ml-auto text-[10px] text-foreground/30 group-hover:text-foreground/50 transition-colors">→</code>
                  </a>
                ))}
              </div>
            </section>

            {/* Sponsors */}
            <section className="border-2 border-white/20 p-6">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-4">Sponsors</div>
              <p className="text-[11px] text-foreground/40 mb-4">No sponsors yet.</p>
              <a 
                href="mailto:guantum@puppyagent.com" 
                className="inline-flex items-center gap-2 text-[11px] text-foreground/50 hover:text-foreground/80 transition-colors"
              >
                <span>Become a sponsor</span>
                <span>→</span>
              </a>
            </section>
          </div>
        </div>
      </main>
      
      <div className="mt-24 md:mt-32" aria-hidden="true" />
      <SiteFooter />
    </div>
  );
}



