import React, { useState, useEffect } from 'react'
import { RiYoutubeFill as Youtube, RiFullscreenFill as Fullscreen, RiVolumeUpFill as VolumeUp } from 'react-icons/ri'

export default function YouTubeRenderer({ url }) {
  const [videoId, setVideoId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!url) return

    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        setVideoId(match[1])
        setError(null)
        return
      }
    }

    setError('Invalid YouTube URL')
  }, [url])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-2xl border border-gray-200">
        <Youtube size={48} className="text-red-500 mb-4" />
        <p className="text-gray-600 font-medium">Could not load YouTube video</p>
        <p className="text-gray-500 text-sm mt-2">{error}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Open in YouTube
        </a>
      </div>
    )
  }

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="animate-spin">
          <Youtube size={32} className="text-gray-400" />
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`

  return (
    <div className="w-full bg-gray-900 rounded-2xl overflow-hidden shadow-xl" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <iframe
          src={embedUrl}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
      <div style={{ background: '#1f2937', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Youtube size={20} color="#ef4444" />
          <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>YouTube Video</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              const iframe = document.querySelector('iframe')
              if (iframe?.requestFullscreen) {
                iframe.requestFullscreen()
              }
            }}
            style={{ color: '#9ca3af', border: 'none', background: 'none', cursor: 'pointer', transition: 'color 150ms' }}
            title="Fullscreen"
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
          >
            <Fullscreen size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
