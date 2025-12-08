'use client';
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 text-xs border border-white/20 hover:bg-white/5 transition-all"
      title="Copy to clipboard"
    >
      {copied ? (
        <span className="text-[#2CAC58]">[✓] copied</span>
      ) : (
        <span className="text-foreground/50">copy</span>
      )}
    </button>
  );
}

type Example = {
  id: string;
  label: string;
  language: string;
  code: string;
};

const examples: Example[] = [
  {
    id: "api-curl",
    label: "cURL",
    language: "bash",
    code: `curl -N -X POST "http://localhost:8000/api/research" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -d '{
    "message": {
      "query": "Your research question",
      "deepwide": { "deep": 1.0, "wide": 1.0 },
      "mcp": {}
    },
    "history": []
  }'`
  },
  {
    id: "sdk-nodejs",
    label: "Node.js",
    language: "javascript",
    code: `import fetch from 'node-fetch';

async function run() {
  const res = await fetch('http://localhost:8000/api/research', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'YOUR_API_KEY_HERE'
    },
    body: JSON.stringify({
      message: { 
        query: 'Your research question', 
        deepwide: { deep: 1.0, wide: 1.0 }, 
        mcp: {} 
      },
      history: []
    })
  });
  for await (const chunk of res.body) {
    process.stdout.write(chunk.toString());
  }
}

run().catch(console.error);`
  },
  {
    id: "sdk-python",
    label: "Python",
    language: "python",
    code: `import requests

url = 'http://localhost:8000/api/research'
headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'YOUR_API_KEY_HERE'
}
payload = {
  'message': {
    'query': 'Your research question',
    'deepwide': { 'deep': 1.0, 'wide': 1.0 },
    'mcp': {}
  },
  'history': []
}

with requests.post(url, headers=headers, json=payload, stream=True) as r:
    for line in r.iter_lines():
        if line:
            print(line.decode('utf-8'))`
  }
];

export default function ApiSdkShowcase() {
  const [activeExample, setActiveExample] = useState<string>("api-curl");
  
  const active = examples.find(e => e.id === activeExample) || examples[0];

  return (
    <div className="mt-12 md:mt-16 w-full max-w-4xl mx-auto">
      {/* Tab Headers */}
      <div className="flex gap-2 mb-0 border-b-2 border-white/20">
        {examples.map((example) => (
          <button
            key={example.id}
            onClick={() => setActiveExample(example.id)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeExample === example.id
                ? "text-foreground/90 border-b-2 border-[#2CAC58] -mb-[2px]"
                : "text-foreground/50 hover:text-foreground/70"
            }`}
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Code Display */}
      <div className="border-2 border-white/20 bg-black/20">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/50 font-mono">{active.language}</span>
            <div className="flex items-center gap-2 text-xs text-foreground/40">
              <span>Deep: 1.0</span>
              <span>•</span>
              <span>Wide: 1.0</span>
            </div>
          </div>
          <CopyButton text={active.code} />
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-xs text-foreground/80 leading-relaxed">
            {active.code}
          </code>
        </pre>
      </div>

    </div>
  );
}


