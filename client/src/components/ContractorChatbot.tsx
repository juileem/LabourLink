import React, { useState, useRef, useEffect } from "react";
import { User, Job } from "../types";

type Message = {
  id: string;
  sender: "contractor" | "bot";
  text: string;
  workers?: any[];
  jobDetails?: {
    skill_required: string;
    workers_needed: number;
    date: string;
    location: string;
  };
};

type Props = {
  contractor: User;
  onJobCreated?: (job: Job) => void;
};

export function ContractorChatbot({ contractor, onJobCreated }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "bot",
      text: "Hello! I am your AI Hiring Assistant. How can I help you find workers today? (e.g., 'I need 3 painters tomorrow in Mumbai')"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString() + "_u", sender: "contractor", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 1. Parse request
      const parseRes = await fetch("http://localhost:4000/ai/parse-job-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text })
      });
      const parsed = await parseRes.json();

      // 2. Suggest workers
      const suggestRes = await fetch("http://localhost:4000/ai/suggest-workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          skill: parsed.skill_required, 
          location: parsed.location,
          contractorId: contractor.id 
        })
      });
      const workers = await suggestRes.json();

      // 3. Add bot message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + "_b",
          sender: "bot",
          text: `I found ${workers.length} nearby ${parsed.skill_required}s around ${parsed.location}. Would you like to post this job for ${parsed.date}?`,
          workers,
          jobDetails: parsed
        }
      ]);
      
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString() + "_e", sender: "bot", text: "Sorry, I had trouble processing your request. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (jobDetails: any) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/jobs/create-from-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
          ...jobDetails
        })
      });
      const data = await res.json();
      if (data.job) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString() + "_s",
            sender: "bot",
            text: `Success! Your job for ${jobDetails.workers_needed} ${jobDetails.skill_required}(s) has been posted.`
          }
        ]);
        if (onJobCreated) onJobCreated(data.job);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString() + "_error", sender: "bot", text: "Failed to create the job." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "contractor" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 ${
              msg.sender === "contractor" 
                ? "bg-brand-500 text-white rounded-br-none" 
                : "bg-white border border-stone-200 text-stone-900 rounded-bl-none shadow-sm"
            }`}>
              <p className="text-sm">{msg.text}</p>
              
              {msg.workers && msg.workers.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Suggested Workers:</p>
                  {msg.workers.map((w: any) => (
                    <div key={w.id} className="bg-stone-50 border border-stone-100 p-2 rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm text-stone-900">{w.name}</p>
                        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Match: {w.match_score}</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">Skill: {w.skill} | Rating: ⭐{w.rating.toFixed(1)}</p>
                      <p className="text-xs text-stone-500 font-medium tracking-wide">Phone: {w.phone}</p>
                    </div>
                  ))}
                </div>
              )}

              {msg.jobDetails && (
                <button 
                  onClick={() => handleCreateJob(msg.jobDetails)}
                  disabled={loading}
                  className="mt-3 w-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Create Job Posting
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 text-stone-500 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-white border-t border-stone-200">
        <form 
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask hiring assistant..." 
            className="flex-1 bg-stone-100 border-transparent focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl px-4 py-2 text-sm text-stone-900 transition-all outline-none"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors outline-none"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
