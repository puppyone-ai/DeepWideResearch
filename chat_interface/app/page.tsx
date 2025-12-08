'use client'

import { useEffect } from 'react'
import { useAuth } from './supabase/SupabaseAuthProvider'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import SiteHeader from '@/components/landingpage/SiteHeader'
import LandingChatInterface from '@/components/landingpage/LandingChatInterface'
import ApiSdkShowcase from '@/components/landingpage/ApiSdkShowcase'
import McpShowcaseGeek from '@/components/landingpage/McpShowcaseGeek'
import SiteFooter from '@/components/landingpage/SiteFooter'

export default function Home() {
  const { session, isAuthReady } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthReady && session) router.push('/chat')
  }, [isAuthReady, session, router])

  return (
    <div className="h-screen overflow-auto w-full font-mono bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6">
        {/* Main Value Proposition replaced with Chat Interface */}
        <LandingChatInterface />

        <div className="mt-16 mb-12 border-t border-white/10" role="separator" aria-hidden="true" />
        
        <section id="api-sdk" className="mt-16 md:mt-24">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground/50 text-center">Access any Deep & Wide research via API or SDK</h2>
          <p className="mt-4 text-[14px] text-foreground/50 text-center">All research scenarios from quick Q&amp;A to comprehensive analysis — controlled by just two parameters</p>
          <ApiSdkShowcase />
        </section>

        <section id="mcp" className="mt-16 md:mt-24">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground/50 text-center">Connect MCP servers to expand capabilities</h2>
          <p className="mt-4 text-[14px] text-foreground/50 text-center">Plug in data sources and tools via Model Context Protocol</p>
          <McpShowcaseGeek />
        </section>

        <section id="comparison" className="mt-16 md:mt-24">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground/50 text-center">How we compare to other deep research tools</h2>
          <p className="mt-4 text-[14px] text-foreground/50 text-center">Open Deep Wide Research vs GenSpark, OpenAI, Manus, Gemini, Jina, LangChain</p>
          <div className="mt-6 mb-6 border-t border-white/10" role="separator" aria-hidden="true" />
          <div className="relative pt-4">
            <div className="overflow-x-auto border-2 border-white/20 bg-black/20">
              <table className="min-w-full table-fixed text-[14px] text-foreground/70">
                <colgroup>
                  <col className="w-[140px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                  <col className="w-[80px]" />
                </colgroup>
                <thead className="bg-black/40 text-foreground/80 border-b-2 border-white/20">
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 bg-black/40 px-3 py-4 text-left font-medium w-[140px] border-r border-white/10">Feature</th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px] border-r border-white/10">
                      <Image src="/openai.jpg" alt="OpenAI" width={48} height={48} className="mx-auto mb-2" />
                      <span className="block text-xs leading-tight">OpenAI</span>
                    </th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px] border-r border-white/10">
                      <Image src="/genmini.jpg" alt="Gemini" width={40} height={40} className="mx-auto mb-4" />
                      <span className="block text-xs leading-tight">Gemini</span>
                    </th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px] border-r border-white/10">
                      <Image src="/manus.png" alt="Manus" width={32} height={32} className="mx-auto mt-1 mb-5" />
                      <span className="block text-xs leading-tight">Manus</span>
                    </th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10 relative">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#2CAC58] text-black text-xs font-bold px-2 py-0.5 whitespace-nowrap z-20">← YOU</div>
                      <Image src="/DWResearch.png" alt="Open Deep Wide Research" width={48} height={48} className="mx-auto mb-2" />
                      <span className="block text-xs leading-tight font-semibold">Open Deep Wide Research</span>
                    </th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px] border-r border-white/10">
                      <Image src="/genspark.jpg" alt="GenSpark" width={40} height={40} className="mx-auto mb-4" />
                      <span className="block text-xs leading-tight">GenSpark</span>
                    </th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px] border-r border-white/10">
                      <Image src="/jina.jpg" alt="Jina" width={48} height={48} className="mx-auto mb-2" />
                      <span className="block text-xs leading-tight">Jina</span>
                    </th>
                    <th scope="col" className="px-2 py-3 text-center font-medium w-[80px]">
                      <Image src="/langchain.png" alt="LangChain" width={48} height={48} className="mx-auto mb-2" />
                      <span className="block text-xs leading-tight">LangChain</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">Depth × width controls</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="text-green-500">W</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="text-green-500 font-bold">D x W</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="text-green-500">D</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">Open source</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">MCP support</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">SDK / API</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">Local knowledge</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">Model flexibility</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">Search engine flexibility</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10"><span className="inline-block px-2 py-0.5 bg-[#2CAC58]/20 border border-[#2CAC58] text-[#2CAC58] text-xs font-bold">YES</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                    <td className="px-3 py-4 text-center w-[80px]"><span className="inline-block px-2 py-0.5 text-foreground/20 text-xs">---</span></td>
                  </tr>
                  <tr>
                    <th scope="row" className="sticky left-0 bg-black/20 px-3 py-4 text-left font-medium text-foreground/80 w-[140px] border-r border-white/10">Performance</th>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10">5</td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10">4</td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10">3</td>
                    <td className="px-3 py-4 text-center w-[80px] border-r-2 border-l-2 border-[#2CAC58] bg-[#2CAC58]/10 font-bold">5</td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10">4</td>
                    <td className="px-3 py-4 text-center w-[80px] border-r border-white/10">4</td>
                    <td className="px-3 py-4 text-center w-[80px]">3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2 text-xs text-foreground/40 text-center">Green indicates strong native support; gray × means not supported or not a primary focus.</p>
          <p className="mt-2 text-xs text-foreground/40 text-center">Names are trademarks of their owners; descriptions are generalized and may change.</p>
        </section>

        <section id="faq" className="mt-16 md:mt-24">
          <h2 className="text-[16px] font-semibold tracking-tight text-foreground/50 text-center">Frequently Asked Questions</h2>
          <p className="mt-4 text-[14px] text-foreground/50 text-center">Everything you need to know about Open Deep Wide Research</p>
          <div className="mt-12 max-w-3xl mx-auto space-y-3">
            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  What is Open Deep Wide Research?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed">
                Open Deep Wide Research is an open-source research tool that lets you control both the depth (how detailed) and width (how broad) of your research. It supports MCP integration, local knowledge bases, and flexible model selection.
              </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  How do depth and width controls work?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed">
                Depth controls how thoroughly we investigate each topic, while width determines how many related topics we explore. You can adjust both parameters to balance between comprehensive analysis and broad coverage.
              </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  What is MCP and why should I use it?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed">
                MCP (Model Context Protocol) lets you connect various data sources and tools to your research workflow. You can integrate Notion, Exa, Tavily, and other services to access your private knowledge bases and specialized search capabilities.
              </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  Can I self-host Open Deep Wide Research?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed">
                Yes! Open Deep Wide Research is fully open-source and can be self-hosted on your own infrastructure. You maintain complete control over your data and can customize the system to your needs.
        </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  Which AI models can I use?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed">
                Open Deep Wide Research offers model flexibility - you can use various AI models including OpenAI, Anthropic Claude, open-source models, and more. Choose the model that best fits your needs and budget.
      </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  Is my data private and secure?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed">
                When self-hosting, all your data stays on your infrastructure. You have complete control over data storage, processing, and security. No data is sent to third parties unless you explicitly configure external services.
              </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  Who is behind Open Deep Wide Research?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-sm text-foreground/60 leading-relaxed">
                Open Deep Wide Research is developed by <a href="https://puppyagent.com" target="_blank" rel="noopener noreferrer" className="text-foreground/80 hover:text-foreground underline">PuppyAgent</a>, an organization dedicated to making advanced research tools accessible to everyone. We believe in open-source principles and building tools that empower researchers, developers, and organizations to conduct thorough, customizable research at scale.
            </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-sm px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  How do I get support?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed space-y-3">
                <p><strong className="text-foreground/80">Community Support (Free):</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>GitHub Issues for bug reports and feature requests</li>
                  <li>Discord community for real-time discussions</li>
                  <li>Documentation and tutorials on our website</li>
                </ul>
                <p className="mt-3"><strong className="text-foreground/80">Enterprise Support (Paid):</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Priority email and Slack support</li>
                  <li>Dedicated solutions architect</li>
                  <li>Custom training and onboarding</li>
                  <li>SLA-backed response times</li>
                </ul>
                </div>
            </details>

            <details className="group border-2 border-white/20 bg-black/20">
              <summary className="cursor-pointer list-none flex items-start justify-between text-foreground/90 font-medium text-[12px] px-4 py-3 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="text-foreground/40 group-open:hidden">[+]</span>
                  <span className="text-foreground/40 hidden group-open:inline">[-]</span>
                  Is there a cloud-hosted version available?
                </span>
              </summary>
              <div className="px-4 pb-3 pt-1 border-t border-white/10 text-[12px] text-foreground/60 leading-relaxed space-y-3">
                <p>Currently, Open Deep Wide Research is available as an open-source project for self-hosting. We don&apos;t yet offer a cloud-hosted version.</p>
                <p>If you&apos;re interested in managed hosting, enterprise support, or custom deployment solutions, please reach out to us at <a href="mailto:guantum@puppyagent.com" className="text-foreground/80 hover:text-foreground underline">guantum@puppyagent.com</a>. We&apos;d be happy to discuss your specific needs and explore potential options.</p>
            </div>
            </details>
          </div>
        </section>
      </main>

      <div className="mt-24 md:mt-32" aria-hidden="true" />
      <SiteFooter />
    </div>
  )
}
