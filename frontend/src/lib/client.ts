'use client';

export async function uploadFileToIpfs(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || 'Upload failed')
  }

  return payload.ipfsUri as string
}

export function formatContractError(message?: string) {
  if (!message) return 'Something went wrong. Please try again.'

  if (message.includes('Username taken')) return 'That username is already taken.'
  if (message.includes('Username required')) return 'Please enter a username.'
  if (message.includes('Profile already exists')) return 'This wallet already has a profile.'
  if (message.includes('Profile missing')) return 'Create your profile before editing it.'
  if (message.includes('Create profile first')) return 'Create your profile first to use this feature.'
  if (message.includes('Content too long')) return 'Your caption is too long.'
  if (message.includes('Post cannot be empty')) return 'Add a caption or media before posting.'
  if (message.includes('Comment too long')) return 'That comment is too long.'
  if (message.includes('Comment required')) return 'Write a comment before sending it.'
  if (message.includes('Already following')) return 'You are already following this creator.'
  if (message.includes('Not following')) return 'You are not following this creator yet.'
  if (message.includes('User rejected')) return 'The wallet request was cancelled.'
  if (message.includes('rejected')) return 'The wallet request was cancelled.'

  return 'The transaction could not be completed. Please try again.'
}
