'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PROFILE_REGISTRY_ADDRESS, PROFILE_REGISTRY_ABI } from '../config/contracts';

export function CreateProfile({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  
  const { data: hash, writeContract, isPending } = useWriteContract()

  const { isSuccess } = useWaitForTransactionReceipt({ 
    hash, 
  })

  if (isSuccess) {
    onSuccess();
  }

  const handleCreate = async () => {
    if (!username.trim() || username.length > 50) return;

    writeContract({
        address: PROFILE_REGISTRY_ADDRESS,
        abi: PROFILE_REGISTRY_ABI,
        functionName: 'createProfile',
        args: [username],
      })
  }

  return (
    <div className="glass-panel mx-4 my-8 rounded-2xl p-10 border border-white/10 text-center relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-monad-accent rounded-full blur-[100px] opacity-20"></div>
      
      <div className="relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-monad-accent rounded-2xl mx-auto mb-6 flex items-center justify-center transform rotate-12 shadow-[0_0_30px_rgba(178,75,243,0.4)]">
           <span className="text-4xl text-white block -rotate-12">🤩</span>
        </div>
        
        <h2 className="text-3xl font-black mb-3 text-white brand-font tracking-tight">Welcome to Pulse! ⚡</h2>
        <p className="text-white/60 mb-8 max-w-sm mx-auto text-lg">Claim your unique username below to start posting and joining the conversation.</p>
        
        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          <input 
            type="text"
            placeholder="@yourname"
            className="bg-white/5 border border-white/10 text-white text-xl p-4 rounded-xl outline-none placeholder:text-white/30 w-full focus:border-primary/50 focus:bg-white/10 transition-all font-bold text-center"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
          />
          <button 
            disabled={isPending || username.length === 0}
            onClick={handleCreate}
            className="bg-white hover:bg-gray-100 text-monad-dark font-black py-4 px-6 rounded-xl disabled:opacity-50 transition-all active:scale-95 text-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            {isPending ? 'Claiming...' : 'Claim Username'}
          </button>
        </div>
      </div>
    </div>
  )
}
