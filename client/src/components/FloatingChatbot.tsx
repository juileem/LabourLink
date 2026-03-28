import React, { useState } from "react";
import { User, Job } from "../types";
import { ContractorChatbot } from "./ContractorChatbot";

type Props = {
  contractor: User;
  onJobCreated?: (job: Job) => void;
};

export function FloatingChatbot({ contractor, onJobCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const hasNotification = true;

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 bg-brand-600 text-white rounded-full w-14 h-14 shadow-xl shadow-brand-500/30 flex items-center justify-center hover:bg-brand-500 hover:-translate-y-1 transition-all ring-2 ring-white/20 active:scale-95"
      >
        <span className="text-2xl">💬</span>
        {!isOpen && hasNotification && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 ring-2 ring-white rounded-full animate-pulse"></div>
        )}
      </button>

      <div 
        className={`fixed bottom-24 right-5 sm:right-5 z-50 w-[calc(100vw-40px)] sm:w-[350px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-stone-200 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ height: 'max(60vh, 450px)' }}
      >
        <div className="flex items-center justify-between p-3.5 bg-brand-600 text-white shadow-sm z-10">
          <h2 className="text-[15px] font-bold flex items-center gap-2">
            <span>✨</span> AI Hiring Assistant
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-brand-200 hover:text-white p-1 rounded-md hover:bg-brand-500 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden relative bg-stone-50">
          <ContractorChatbot contractor={contractor} onJobCreated={onJobCreated} />
        </div>
      </div>
    </>
  );
}
