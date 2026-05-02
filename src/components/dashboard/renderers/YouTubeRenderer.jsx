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
    <div className="w-full bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
      <div className="aspect-w-16 aspect-h-9">
        <iframe
          src={embedUrl}
          className="w-full h-96 md:h-[500px] lg:h-[600px]"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </div>
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Youtube size={20} className="text-red-500" />
          <span className="text-white text-sm font-medium">YouTube Video</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const iframe = document.querySelector('iframe')
              if (iframe?.requestFullscreen) {
                iframe.requestFullscreen()
              }
            }}
            className="text-gray-400 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Fullscreen size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
