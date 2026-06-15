import React, { useEffect, useState, useRef } from 'react';

export function VoiceWave({ isRecording, stream }) {
  const [bars, setBars] = useState(Array(30).fill(4));
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (isRecording && stream) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateWave = () => {
        analyser.getByteFrequencyData(dataArray);
        // Map frequency data to bar heights (0 to ~24px)
        const newBars = Array.from(dataArray).slice(0, 30).map(val => Math.max(4, (val / 255) * 24));
        // Fill remaining if dataArray is too small
        while (newBars.length < 30) newBars.push(4);
        setBars(newBars.slice(0, 30));
        
        animationRef.current = requestAnimationFrame(updateWave);
      };
      
      updateWave();
      
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setBars(Array(30).fill(4));
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, stream]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      height: '40px',
      padding: '0 12px',
      justifyContent: 'center',
      flex: 1
    }}>
      {bars.map((height, i) => (
        <div
          key={i}
          style={{
            width: '4px',
            height: `${height}px`,
            backgroundColor: isRecording ? '#10B981' : '#9CA3AF',
            borderRadius: '2px',
            transition: 'height 0.05s ease',
            opacity: Math.max(0.3, height / 24)
          }}
        />
      ))}
    </div>
  );
}
