'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { FEED_ENGINE_ADDRESS, FEED_ENGINE_ABI } from '../config/contracts';

export function ComposeBox() {
  const [content, setContent] = useState('');
  
  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    })

  const handlePost = async () => {
    if (!content.trim() || content.length > 280) return;

    writeContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'postMessage',
        args: [content],
      })
  }

  // Clear input efficiently on success
  if (isConfirmed && content !== '') {
     setContent('');
  }

  return (
    <div className="glass-panel mx-4 mb-6 rounded-2xl p-5 border border-white/10 relative overflow-hidden group transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(178,75,243,0.3)]">
      {/* Decorative glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-monad-accent opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-500 rounded-2xl"></div>
      
      <div className="relative flex flex-col gap-3 z-10">
        <textarea 
          placeholder="What's happening on Monad?"
          className="bg-transparent text-xl resize-none outline-none placeholder:text-white/30 text-white w-full rounded-xl p-2"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={280}
        />
        <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2">
          <span className={`text-sm font-bold ${content.length > 250 ? 'text-red-400' : 'text-white/40'}`}>
            {content.length}/280
          </span>
          <button 
            disabled={isPending || content.length === 0}
            onClick={handlePost}
            className="bg-gradient-to-r from-primary to-monad-accent hover:opacity-90 text-white font-black py-2.5 px-8 flex items-center justify-center rounded-full disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            {isPending ? 'Pulsing...' : 'Pulse ⚡'}
          </button>
        </div>
      </div>
    </div>
  )
}
