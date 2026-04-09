'use client';

import { useEffect, useState } from "react";
import { useAccount, useWatchContractEvent, useReadContract } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ComposeBox } from "@/components/ComposeBox";
import { CreateProfile } from "@/components/CreateProfile";
import { PostCard, type Post } from "@/components/PostCard";
import { FEED_ENGINE_ADDRESS, FEED_ENGINE_ABI, PROFILE_REGISTRY_ADDRESS, PROFILE_REGISTRY_ABI } from "@/config/contracts";
import { Home as HomeIcon, Compass, Bell, User } from 'lucide-react';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { data: profileData, refetch: refetchProfile } = useReadContract({
    address: PROFILE_REGISTRY_ADDRESS,
    abi: PROFILE_REGISTRY_ABI,
    functionName: 'profiles',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });
  const hasProfile = profileData?.[2] === true;

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: "PostCreated",
    onLogs(logs) {
      const newPosts: Post[] = logs.map((log: any) => ({
        author: log.args.author,
        postId: log.args.postId.toString(),
        content: log.args.content,
        timestamp: Number(log.args.timestamp),
        likes: 0
      }));
      setPosts((prev) => [...newPosts, ...prev]);
    },
  });

  useWatchContractEvent({
    address: FEED_ENGINE_ADDRESS,
    abi: FEED_ENGINE_ABI,
    eventName: "PostLiked",
    onLogs(logs) {
      logs.forEach((log: any) => {
        setPosts((prev) => prev.map((p) => 
          p.postId === log.args.postId.toString() && p.author === log.args.author
            ? { ...p, likes: p.likes + 1 } 
            : p
        ));
      });
    },
  });

  const optimisticLike = (author: string, postId: string) => {
     setPosts((prev) => prev.map((p) => 
        p.postId === postId && p.author === author
          ? { ...p, likes: p.likes + 1 } 
          : p
      ));
  }

  // Prevents hydration mismatch with RainbowKit
  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto flex min-h-screen relative z-10">
      {/* Sidebar */}
      <header className="w-[80px] lg:w-[275px] border-r border-white/10 flex flex-col justify-between p-2 lg:p-4 sticky top-0 h-screen">
        <div>
           <div className="flex items-center gap-2 mb-8 px-2 mt-4 cursor-pointer hover:scale-105 transition-transform">
             <div className="h-10 w-10 bg-gradient-to-br from-primary to-monad-glow rounded-xl flex items-center justify-center animate-glow-pulse shadow-lg">
                <span className="text-white font-black text-xl italic">P</span>
             </div>
             <h1 className="hidden lg:block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-monad-accent tracking-tighter italic brand-font">
                Pulse
             </h1>
           </div>

           <nav className="flex flex-col gap-2 w-full">
             <div className="flex items-center gap-4 font-bold text-xl py-3 px-4 glass-item rounded-full cursor-pointer text-white">
                <HomeIcon size={26} />
                <span className="hidden lg:block">Home</span>
             </div>
             <div className="flex items-center gap-4 font-bold text-xl py-3 px-4 glass-item rounded-full cursor-pointer text-white/50">
                <Compass size={26} />
                <span className="hidden lg:block">Explore</span>
             </div>
             <div className="flex items-center gap-4 font-bold text-xl py-3 px-4 glass-item rounded-full cursor-pointer text-white/50">
                <Bell size={26} />
                <span className="hidden lg:block">Notifications</span>
             </div>
             <div className="flex items-center gap-4 font-bold text-xl py-3 px-4 glass-item rounded-full cursor-pointer text-white/50">
                <User size={26} />
                <span className="hidden lg:block">Profile</span>
             </div>
           </nav>
        </div>
        
        <div className="mb-4 flex flex-col gap-4 items-center lg:items-start lg:w-full">
           <ConnectButton showBalance={false} />
        </div>
      </header>

      {/* Main Feed */}
      <main className="flex-1 max-w-[600px] border-r border-white/10 min-h-screen pb-20">
        <div className="p-4 glass-panel sticky top-0 border-b border-white/10 z-20 w-full mb-4 rounded-b-2xl mx-1 shadow-md">
           <h2 className="text-2xl font-bold brand-font">Home Feed</h2>
        </div>
        
        {isConnected ? (
          hasProfile ? (
            <ComposeBox />
          ) : (
            <CreateProfile onSuccess={() => refetchProfile()} />
          )
        ) : (
          <div className="mx-4 glass-panel rounded-2xl p-8 text-center border border-white/10 my-8">
            <div className="text-5xl mb-4 opacity-70 animate-pulse">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2 brand-font">Connect your wallet</h3>
            <p className="text-white/60">Connect to the Monad network to start pulsing.</p>
          </div>
        )}

        {/* Feed */}
        <div className="flex flex-col gap-4 mt-6 mx-4">
            {posts.length === 0 && isConnected && hasProfile && (
                <div className="glass-panel rounded-2xl p-8 text-center text-white/50 mt-4 border border-white/10">
                    <p className="opacity-80">No pulses yet.</p>
                    <p className="font-bold mt-2 text-white/80">Be the first to start the conversation!</p>
                </div>
            )}
            {posts.map((post) => (
                <PostCard 
                    key={`${post.author}-${post.postId}`} 
                    post={post} 
                    onLiked={() => optimisticLike(post.author, post.postId)}
                />
            ))}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-[350px] hidden xl:block p-4 sticky top-0 h-screen">
        <div className="glass-panel rounded-2xl p-6 border border-white/10 mt-4">
            <h3 className="font-bold text-xl mb-6 brand-font text-transparent bg-clip-text bg-gradient-to-r from-primary to-monad-accent">Trending on Monad</h3>
            <div className="flex flex-col gap-6">
                <div className="group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                   <div className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Blockchain · Trending</div>
                   <div className="font-black text-lg text-white group-hover:text-primary transition-colors">#ParallelEVM</div>
                   <div className="text-sm text-white/40 mt-1">10k pulses</div>
                </div>
                <div className="group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                   <div className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Technology · Trending</div>
                   <div className="font-black text-lg text-white group-hover:text-primary transition-colors">10,000 TPS</div>
                   <div className="text-sm text-white/40 mt-1">4.2k pulses</div>
                </div>
                <div className="group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                   <div className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Pulse · Updates</div>
                   <div className="font-black text-lg text-white group-hover:text-primary transition-colors">Lightning Fast</div>
                   <div className="text-sm text-white/40 mt-1">Optimistic UI rendering is here</div>
                </div>
            </div>
        </div>
      </aside>
    </div>
  );
}
