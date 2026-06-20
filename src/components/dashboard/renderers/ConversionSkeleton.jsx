import React from 'react'
import { motion } from 'framer-motion'
import { RiFilePptFill as FilePpt, RiFileTextFill as FileText, RiRefreshLine as Refresh, RiErrorWarningFill as Warning } from 'react-icons/ri'

export default function ConversionSkeleton({ type = 'pptx', failed = false, onRetry }) {
  const isPptx = type === 'pptx' || type === 'ppt'
  const Icon = isPptx ? FilePpt : FileText
  const label = isPptx ? 'Presentation' : 'Document'

  return (
    <div style={{ height: '100%', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '1100px' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={28} color="#F97316" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 20, fontWeight: 800, color: '#1A102D', margin: 0 }}>
              {label}
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0', fontFamily: 'var(--font-outfit)' }}>
              Converting to high-fidelity PDF…
            </p>
          </div>
        </motion.div>

        {/* Animated Page Skeleton */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1.5px solid #F1F5F9',
            padding: '48px 56px',
            minHeight: '70vh',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Pulsing gradient overlay */}
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Title line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ height: 28, width: '55%', background: '#E2E8F0', borderRadius: 8, marginBottom: 32 }}
          />

          {/* Subtitle line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            style={{ height: 16, width: '35%', background: '#E2E8F0', borderRadius: 6, marginBottom: 40 }}
          />

          {/* Paragraph lines */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.15 * i }}
              style={{
                height: 12,
                width: i % 3 === 0 ? '92%' : i % 3 === 1 ? '88%' : '95%',
                background: '#F1F5F9',
                borderRadius: 6,
                marginBottom: 14,
              }}
            />
          ))}

          {/* Image placeholder for PPTX */}
          {isPptx && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.25, 0.5, 0.25] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
              style={{
                height: 180,
                width: '100%',
                background: '#F1F5F9',
                borderRadius: 12,
                marginTop: 24,
                marginBottom: 24,
              }}
            />
          )}

          {/* More lines */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`b-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.55, 0.3] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: 0.15 * i + 1.2 }}
              style={{
                height: 12,
                width: i % 2 === 0 ? '90%' : '85%',
                background: '#F1F5F9',
                borderRadius: 6,
                marginBottom: 14,
              }}
            />
          ))}
        </motion.div>

        {/* Status pill */}
        {failed ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              marginTop: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444' }}>
              <Warning size={18} />
              <span style={{ fontFamily: 'var(--font-outfit)', fontSize: 13, fontWeight: 600 }}>
                Conversion took too long. You can retry or view the original file.
              </span>
            </div>
            <button
              onClick={onRetry}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', background: 'white', border: '1.5px solid #E2E8F0',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                fontSize: 13, fontWeight: 600, color: '#475569',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0' }}
            >
              <Refresh size={14} /> Retry Conversion
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginTop: 24,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: '#F97316' }}
            />
            <span style={{ fontFamily: 'var(--font-outfit)', fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              Preparing your document for the best reading experience…
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
