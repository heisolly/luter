import React, { useState, useRef, useEffect } from 'react'
import { 
  RiImageFill as Image,
  RiZoomInFill as ZoomIn,
  RiZoomOutFill as ZoomOut,
  RiArrowRightSLine as RotateRight,
  RiArrowLeftSLine as RotateLeft,
  RiFullscreenFill as Fullscreen,
  RiDownloadFill as Download,
  RiExpandDiagonalFill as Expand,
  RiFullscreenExitFill as Compress
} from 'react-icons/ri'

export default function ImageRenderer({ fileUrl, title }) {
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const handleLoad = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      setIsLoading(false)
    }

    const handleError = () => {
      setIsLoading(false)
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)

    return () => {
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
    }
  }, [fileUrl])

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(0.1, scale * delta), 5)
    setScale(newScale)
  }

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev * 0.8, 0.1))
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  const rotateLeft = () => {
    setRotation(prev => prev - 90)
  }

  const rotateRight = () => {
    setRotation(prev => prev + 90)
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
      setIsFullscreen(!isFullscreen)
    } catch (error) {
      console.error('Fullscreen not supported:', error)
    }
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = title || 'image'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl border border-gray-200">
        <div className="animate-spin">
          <Image size={32} className="text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-gray-900 rounded-2xl overflow-hidden shadow-xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Image Container */}
      <div 
        className="relative overflow-hidden cursor-move"
        style={{ 
          height: isFullscreen ? '100vh' : '600px',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <img
            ref={imgRef}
            src={fileUrl}
            alt={title || 'Image'}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
              cursor: scale > 1 ? 'move' : 'default'
            }}
            draggable={false}
          />
        </div>

        {/* Image Info Overlay */}
        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-medium truncate max-w-xs">
            {title || 'Image'}
          </p>
          <p className="text-xs opacity-80">
            {imageSize.width} × {imageSize.height} • {Math.round(scale * 100)}%
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
        <button
          onClick={zoomOut}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={resetZoom}
          className="px-3 py-1 text-xs font-medium text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title="Reset zoom"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={zoomIn}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <button
          onClick={rotateLeft}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title="Rotate left"
        >
          <RotateLeft size={18} />
        </button>

        <button
          onClick={rotateRight}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title="Rotate right"
        >
          <RotateRight size={18} />
        </button>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <button
          onClick={downloadImage}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title="Download"
        >
          <Download size={18} />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Compress size={18} /> : <Fullscreen size={18} />}
        </button>
      </div>

      {/* Instructions */}
      {scale === 1 && !isFullscreen && (
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-2 rounded-lg backdrop-blur-sm text-xs">
          <p>🖱️ Scroll to zoom • Drag to pan when zoomed</p>
        </div>
      )}
    </div>
  )
}
