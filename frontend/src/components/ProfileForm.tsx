'use client';

import { useEffect, useMemo, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { PROFILE_REGISTRY_ABI, PROFILE_REGISTRY_ADDRESS } from '@/config/contracts'
import { formatContractError, uploadFileToIpfs } from '@/lib/client'
import type { ProfileRecord } from '@/lib/types'

type ProfileFormProps = {
  profile?: ProfileRecord
  onComplete: () => void
}

export function ProfileForm({ profile, onComplete }: ProfileFormProps) {
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarURI, setAvatarURI] = useState(profile?.avatarURI || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const isEditing = profile?.exists
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract()
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      setStatus('Profile saved successfully.')
      onComplete()
    }
  }, [isSuccess, onComplete])

  useEffect(() => {
    if (writeError?.message) {
      setError(formatContractError(writeError.message))
    }
  }, [writeError])

  const remainingBio = useMemo(() => 160 - bio.length, [bio.length])

  const handleSubmit = async () => {
    setError('')
    setStatus('')

    if (!username.trim()) {
      setError('Username is required.')
      return
    }

    let nextAvatarUri = avatarURI.trim()

    if (avatarFile) {
      setIsUploading(true)
      setStatus('Uploading avatar to IPFS...')
      try {
        nextAvatarUri = await uploadFileToIpfs(avatarFile)
        setAvatarURI(nextAvatarUri)
      } catch (uploadError) {
        setError(formatContractError(uploadError instanceof Error ? uploadError.message : 'Upload failed'))
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    writeContract({
      address: PROFILE_REGISTRY_ADDRESS,
      abi: PROFILE_REGISTRY_ABI,
      functionName: isEditing ? 'updateProfile' : 'createProfile',
      args: [username.trim(), bio.trim(), nextAvatarUri],
    })
  }

  return (
    <section className="surface-card rounded-[28px] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="brand-font text-3xl text-[#2b211d]">
            {isEditing ? 'Edit your profile' : 'Create your Pulse profile'}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--copy-soft)]">
            Set your username, a short bio, and optionally add an avatar. If you don&apos;t have an avatar URI yet, you can upload one directly here.
          </p>
        </div>
        <div className="hidden rounded-full bg-[color:var(--shell-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-strong)] sm:block">
          {isEditing ? 'Profile live' : 'New account'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[color:var(--copy-main)]">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="pulse.creator"
              maxLength={30}
              className="w-full rounded-2xl border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-4 py-3 text-[color:var(--copy-main)] outline-none transition focus:border-[#ff6b57] focus:soft-ring"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[color:var(--copy-main)]">Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Builder, collector, creator, or storyteller..."
              maxLength={160}
              rows={4}
              className="w-full rounded-2xl border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-4 py-3 text-[color:var(--copy-main)] outline-none transition focus:border-[#ff6b57] focus:soft-ring"
            />
            <span className="mt-2 block text-xs text-[color:var(--muted-copy)]">{remainingBio} characters left</span>
          </label>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[color:var(--copy-main)]">Avatar URI (optional)</span>
            <input
              value={avatarURI}
              onChange={(event) => setAvatarURI(event.target.value)}
              placeholder="ipfs://... or leave blank"
              className="w-full rounded-2xl border border-[color:var(--shell-border)] bg-[color:var(--shell-card)] px-4 py-3 text-[color:var(--copy-main)] outline-none transition focus:border-[#ff6b57] focus:soft-ring"
            />
          </label>

          <label className="rounded-[24px] border border-dashed border-[color:var(--shell-border)] bg-[color:var(--shell-muted)] p-4 text-sm text-[color:var(--copy-soft)]">
            <span className="mb-3 flex items-center gap-2 font-semibold text-[color:var(--copy-main)]">
              <ImagePlus size={18} />
              Upload avatar from this device
            </span>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm"
              onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
            />
          </label>

          <div className="rounded-[24px] bg-[linear-gradient(145deg,#1b1410,#3b241d_55%,#ff6b57)] p-[1px]">
            <div className="rounded-[23px] bg-[#251c18] p-5 text-[#fff7ef]">
              <p className="text-xs uppercase tracking-[0.26em] text-[#f2b39f]">Wallet first social</p>
              <p className="mt-3 brand-font text-2xl">Pulse keeps your identity onchain.</p>
              <p className="mt-3 text-sm leading-6 text-[#f8d6c9]">
                Use an IPFS avatar and a clean username so your posts feel polished across the whole feed.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isConfirming || isUploading}
            className="w-full rounded-2xl bg-[#1f1612] px-5 py-3 font-semibold text-[#fff7ef] transition hover:bg-[#2c201b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending || isConfirming || isUploading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {isUploading ? 'Uploading avatar...' : 'Saving profile...'}
              </span>
            ) : isEditing ? 'Update profile' : 'Create profile'}
          </button>

          {status ? <div className="status-card success">{status}</div> : <div className="status-card success opacity-0">.</div>}
          {error ? <div className="status-card error">{error}</div> : <div className="status-card error opacity-0">.</div>}
        </div>
      </div>
    </section>
  )
}
