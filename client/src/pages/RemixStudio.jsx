import { useState } from 'react'
import axios from 'axios'

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function RemixStudio() {
  const [title, setTitle] = useState('BGSU Jacket')
  const [description, setDescription] = useState('Campus jacket in good condition')
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1548883354-94bcfe321cbb')
  const [status, setStatus] = useState('idle')
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async (event) => {
    event.preventDefault()
    setError('')
    setResultUrl('')
    setStatus('creating')

    try {
      const createRes = await axios.post(`${apiBase}/remix`, {
        style: 'fake-product-trailer',
        sourcePlatform: 'listing',
        sourceHandle: '',
        listingSnapshot: {
          listingId: `manual-${Date.now()}`,
          title,
          description,
          price: 20,
          imageUrl,
          listingUrl: window.location.origin,
        },
      })

      const jobId = createRes.data?.data?.id
      if (!jobId) {
        throw new Error('Job ID missing in response')
      }

      setStatus('processing')

      for (let i = 0; i < 18; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const refreshRes = await axios.post(`${apiBase}/remix/${jobId}/refresh`)
        const data = refreshRes.data?.data

        if (data?.status === 'done' && data?.resultUrl) {
          setResultUrl(data.resultUrl)
          setStatus('done')
          return
        }

        if (data?.status === 'failed') {
          throw new Error(data.errorMessage || 'Generation failed')
        }
      }

      throw new Error('Generation timed out. Please try again.')
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.message || err.message || 'Unable to generate remix')
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h2>AI Remix Studio</h2>
      <p>Create a fake trailer from your product details.</p>

      <form onSubmit={handleGenerate} style={{ display: 'grid', gap: '0.75rem' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Product title" required />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description"
          rows={4}
          required
        />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" required />
        <button type="submit" disabled={status === 'creating' || status === 'processing'}>
          {status === 'creating' || status === 'processing' ? 'Generating...' : 'Generate Trailer'}
        </button>
      </form>

      {status === 'processing' ? <p style={{ marginTop: '1rem' }}>Processing your trailer...</p> : null}
      {error ? <p style={{ marginTop: '1rem', color: '#b42318' }}>{error}</p> : null}
      {resultUrl ? (
        <div style={{ marginTop: '1rem' }}>
          <p>Trailer ready:</p>
          <a href={resultUrl} target="_blank" rel="noreferrer">{resultUrl}</a>
          <video src={resultUrl} controls style={{ width: '100%', marginTop: '0.75rem' }} />
        </div>
      ) : null}
    </div>
  )
}

export default RemixStudio
