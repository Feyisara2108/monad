'use client';

import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Loader2, Video } from 'lucide-react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { FEED_ENGINE_ABI, FEED_ENGINE_ADDRESS } from '@/config/contracts'
import { formatContractError, uploadFileToIpfs } from '@/lib/client'

type ComposeBoxProps = {
  onComplete: () => void
}

export function ComposeBox({ onComplete }: ComposeBoxProps) {
  const [caption, setCaption] = useState('')
  const [mediaURI, setMediaURI] = useState('')
  const [mediaType, setMediaType] = useState<0 | 1 | 2>(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      setCaption('')
      setMediaURI('')
      setMediaType(0)
      setSelectedFile(null)
      setStatus('Your post is live.')
      onComplete()
    }
  }, [isSuccess, onComplete])

  useEffect(() => {
    if (writeError?.message) {
      setError(formatContractError(writeError.message))
    }
  }, [writeError])

  const charactersLeft = useMemo(() => 280 - caption.length, [caption.length])

  const uploadToPinata = async () => {
    if (!selectedFile) return mediaURI

    setIsUploading(true)
    setStatus('Uploading media to IPFS...')
    setError('')

    try {
      const payload = await uploadFileToIpfs(selectedFile)
      setStatus('Upload complete. Publishing onchain...')
      setMediaURI(payload)
      return payload
    } catch (uploadError) {
      const message = formatContractError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
      setError(message)
      throw uploadError
    } finally {
      setIsUploading(false)
    }
  }

  const handlePublish = async () => {
    setError('')
    setStatus('')

    if (!caption.trim() && !selectedFile && !mediaURI.trim()) {
      setError('Add a caption or media before posting.')
      return
    }

    try {
      const finalMediaURI = selectedFile ? await uploadToPinata() : mediaURI.trim()
      const finalMediaType = finalMediaURI ? mediaType || 1 : 0

      writeContract({
        address: FEED_ENGINE_ADDRESS,
        abi: FEED_ENGINE_ABI,
        functionName: 'createPost',
        args: [caption.trim(), finalMediaURI, finalMediaType],
      })
    } catch {
      return
    }
  }

  return (
    <section className="surface-card rounded-[30px] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--accent-strong)]">Create</p>
          <h2 className="brand-font mt-2 text-3xl text-[color:var(--copy-main)]">Share a new moment</h2>
        </div>
        <div className="rounded-full bg-[color:var(--shell-muted)] px-4 py-2 text-xs font-semibold text-[color:var(--accent-strong)]">
          Caption up to 280 characters
        </div>
      </div>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        rows={4}
        maxLength={280}
        placeholder="Write a caption like you would on Instagram, but stored around your onchain identity."
        className="min-h-[132px] w-full rounded-[26px] border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-5 py-4 text-[color:var(--copy-main)] outline-none transition focus:border-[#ff6b57] focus:soft-ring"
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-[24px] border border-dashed border-[color:var(--shell-border)] bg-[color:var(--shell-muted)] p-4 text-sm text-[color:var(--copy-soft)]">
            <span className="mb-3 flex items-center gap-2 font-semibold text-[color:var(--copy-main)]">
              <ImagePlus size={18} />
              Upload photo or video
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              className="w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setSelectedFile(file)
                setError('')
                if (file) {
                  setMediaType(file.type.startsWith('video') ? 2 : 1)
                }
              }}
            />
            <p className="mt-3 text-xs text-[color:var(--muted-copy)]">
              This uploads to IPFS through Pinata, then stores only the IPFS URI onchain.
            </p>
          </label>

          <div className="rounded-[24px] border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] p-4">
            <span className="mb-3 block text-sm font-semibold text-[color:var(--copy-main)]">Or paste an IPFS/media URL</span>
            <input
              value={mediaURI}
              onChange={(event) => setMediaURI(event.target.value)}
              placeholder="ipfs://... or https://..."
              className="w-full rounded-2xl border border-[color:var(--shell-border)] bg-transparent px-4 py-3 outline-none transition focus:border-[#ff6b57] focus:soft-ring"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMediaType(1)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${mediaType === 1 ? 'bg-[#1f1612] text-[#fff7ef]' : 'bg-[#fff0e7] text-[#8b5d4a]'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <ImagePlus size={14} />
                  Image
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType(2)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${mediaType === 2 ? 'bg-[#1f1612] text-[#fff7ef]' : 'bg-[#fff0e7] text-[#8b5d4a]'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Video size={14} />
                  Video
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-4 rounded-[24px] bg-[#1d1612] px-5 py-4 text-[#fff8f1]">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.26em] text-[#f0b39a]">Ready to publish</p>
            <p className="mt-2 text-sm text-[#f8d5c7]">{charactersLeft} characters left</p>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending || isConfirming || isUploading}
            className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-[#ff6b57] px-5 py-3 font-semibold text-white transition hover:bg-[#f45742] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending || isConfirming || isUploading ? <Loader2 size={18} className="animate-spin" /> : null}
            {isUploading ? 'Uploading' : isPending || isConfirming ? 'Publishing' : 'Publish to Pulse'}
          </button>
        </div>
      </div>

      {selectedFile ? (
        <p className="mt-4 text-sm text-[color:var(--copy-soft)]">Selected file: {selectedFile.name}</p>
      ) : null}
      {status ? <div className="status-card success mt-4">{status}</div> : <div className="status-card success mt-4 opacity-0">.</div>}
      {error ? <div className="status-card error mt-3">{error}</div> : <div className="status-card error mt-3 opacity-0">.</div>}
    </section>
  )
}
