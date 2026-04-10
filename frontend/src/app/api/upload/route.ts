import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT

  if (!jwt) {
    return NextResponse.json(
      { error: 'PINATA_JWT is missing. Add it to frontend/.env.local before uploading.' },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  const pinataData = new FormData()
  pinataData.append('file', file, file.name)

  const metadata = JSON.stringify({
    name: file.name,
  })
  pinataData.append('pinataMetadata', metadata)

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: pinataData,
  })

  const payload = await response.json()

  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.reason || payload?.message || 'Pinata upload failed.' },
      { status: response.status }
    )
  }

  return NextResponse.json({
    ipfsUri: `ipfs://${payload.IpfsHash}`,
    hash: payload.IpfsHash,
  })
}
