'use client';
import { useWriteContract } from 'wagmi';
import { FEED_ENGINE_ADDRESS, FEED_ENGINE_ABI } from '../config/contracts';
import { Heart } from 'lucide-react';

export type Post = {
    author: string;
    postId: string;
    content: string;
    timestamp: number;
    likes: number;
}

export function PostCard({ post, onLiked }: { post: Post, onLiked: () => void }) {
    const { writeContract, isPending } = useWriteContract()

    const handleLike = () => {
        // Optimistic UI approach: immediately trigger UI update while tx floats
        onLiked()
        
        writeContract({
            address: FEED_ENGINE_ADDRESS,
            abi: FEED_ENGINE_ABI,
            functionName: 'likePost',
            args: [post.author as `0x${string}`, BigInt(post.postId)],
        })
    }

    // Format address
    const shortAddress = `${post.author.slice(0, 6)}...${post.author.slice(-4)}`

    return (
        <div className="glass-item rounded-2xl p-5 border border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-monad-accent to-primary shrink-0 shadow-lg flex items-center justify-center ring-2 ring-white/10"></div>
                <div className="flex-1 w-full">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white hover:text-primary transition-colors">{shortAddress}</span>
                        <span className="text-white/40 text-sm font-medium">
                            {new Date(post.timestamp * 1000).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <p className="mt-2 text-white/90 text-lg leading-relaxed text-balance">{post.content}</p>
                    
                    <div className="flex mt-4 items-center gap-6 text-white/50">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleLike() }} 
                            disabled={isPending}
                            className="flex items-center gap-2 hover:text-red-400 transition-colors group"
                        >
                            <div className="group-hover:bg-red-500/20 p-2 -ml-2 rounded-full transition-colors relative">
                                <Heart size={20} className="group-active:scale-75 transition-transform drop-shadow" />
                            </div>
                            <span className="text-[15px] font-bold">{post.likes}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
