"use client";

import React, { useState } from "react";
import { 
  Key, Copy, CheckCircle, RefreshCw, Terminal, 
  BookOpen, HelpCircle, Code, ShieldCheck, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeveloperApiDashboard() {
  const [apiKey, setApiKey] = useState("bb_live_9b1deb4d3a772c11039871bc73");
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"curl" | "js" | "python">("curl");

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      const chars = "abcdef0123456789";
      let key = "bb_live_";
      for (let i = 0; i < 26; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setApiKey(key);
      setRegenerating(false);
    }, 500);
  };

  const codeSnippets = {
    curl: `curl -X POST https://buggedbrain.dev/api/developer/predict-placement \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "atsScore": 85,
    "mockInterviewsAvg": 75,
    "projectsCount": 3,
    "applicationsCount": 12
  }'`,
    js: `// Node JS SDK invocation example
fetch("https://buggedbrain.dev/api/developer/predict-placement", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    atsScore: 85,
    mockInterviewsAvg: 75,
    projectsCount: 3,
    applicationsCount: 12
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    python: `# Python Requests API client example
import requests

url = "https://buggedbrain.dev/api/developer/predict-placement"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "atsScore": 85,
    "mockInterviewsAvg": 75,
    "projectsCount": 3,
    "applicationsCount": 12
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
  };

  return (
    <div className="space-y-12 pb-20 font-sans">
      
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-widest mb-2">
            <Code className="w-4.5 h-4.5 text-violet-500" />
            Developer Platform SDK & Integrations
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none font-display">
            Developer Console
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-1.5">
            Retrieve security tokens, configure webhook delivery paths, and view REST endpoint schemas.
          </p>
        </div>
      </div>

      {/* API Key management section */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
            <Key className="w-5 h-5 text-violet-600" />
            Live Access API Secret Token
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Use this token to authorize requests to all public candidate scoring APIs.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl flex justify-between items-center font-mono text-xs select-all text-slate-800">
            <span>{apiKey}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-all cursor-pointer border-none bg-transparent"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-sm flex items-center gap-2 justify-center cursor-pointer text-xs font-black uppercase tracking-widest shrink-0"
          >
            <RefreshCw className={cn("w-4 h-4", regenerating && "animate-spin")} />
            Regenerate key
          </button>
        </div>
      </div>

      {/* Code SDK sandboxing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sandbox code block */}
        <div className="lg:col-span-7 bg-slate-900 p-8 rounded-[2rem] shadow-sm space-y-6 relative overflow-hidden">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold font-mono">Sandbox Sandbox Invocation</span>
            </div>
            
            <div className="flex gap-2">
              {(["curl", "js", "python"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg transition-all border-none cursor-pointer",
                    activeCodeTab === tab ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  {tab === "js" ? "javascript" : tab}
                </button>
              ))}
            </div>
          </div>

          <pre className="text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
            {codeSnippets[activeCodeTab]}
          </pre>
        </div>

        {/* API documentation parameters reference */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2 font-display">
              <BookOpen className="w-5 h-5 text-violet-600" />
              REST API Reference
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Parameters schema specification checklist.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="border-b pb-3">
              <div className="flex justify-between font-bold text-slate-800">
                <span className="font-mono text-violet-600">POST /predict-placement</span>
                <span>200 OK</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                Predict overall placement likelihood odds based on resume score and active mock interviews metrics.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Payload parameters</span>
              {[
                { name: "atsScore", type: "number", required: true, desc: "Estimated resume scan score (0-100)." },
                { name: "mockInterviewsAvg", type: "number", required: true, desc: "Average communications performance (0-100)." },
                { name: "projectsCount", type: "number", required: true, desc: "Total count of engineering projects linked." }
              ].map((param, idx) => (
                <div key={idx} className="flex justify-between border-b border-dashed pb-2 font-semibold">
                  <div>
                    <span className="font-mono text-slate-800">{param.name}</span>
                    <span className="text-[10px] text-slate-400 block font-normal">{param.desc}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-500">{param.type}</span>
                    <span className="text-[9px] text-rose-500 block font-black uppercase">required</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
