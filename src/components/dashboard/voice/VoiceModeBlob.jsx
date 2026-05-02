import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Microphone, X, SpeakerHigh, Waveform } from '@phosphor-icons/react';
import { Wave } from '../../ui/Wave';

// --- Audio Analyzer Hook ---
const useAudioAnalyzer = (isActive) => {
  const [volume, setVolume] = useState(0);
  const audioContext = useRef(null);
  const analyzer = useRef(null);
  const dataArray = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close().catch(e => console.log("AudioContext close error:", e));
        audioContext.current = null;
      }
      setVolume(0);
      return;
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.current.createMediaStreamSource(stream);
        analyzer.current = audioContext.current.createAnalyser();
        analyzer.current.fftSize = 256;
        source.connect(analyzer.current);

        const bufferLength = analyzer.current.frequencyBinCount;
        dataArray.current = new Uint8Array(bufferLength);

        const update = () => {
          if (!analyzer.current) return;
          analyzer.current.getByteFrequencyData(dataArray.current);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray.current[i];
          }
          const avg = sum / bufferLength;
          setVolume(avg / 128);

          animationFrame.current = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error("Microphone access denied:", err);
      }
    };

    initAudio();

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close().catch(e => console.log("Cleanup: AudioContext close error:", e));
      }
    };
  }, [isActive]);

  return volume;
};

// --- Blob Layer Component ---
const BlobLayer = ({ radius, color, volume, speed, distort, opacity, detail = 20 }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  const dynamicDistort = useMemo(() => distort + (volume * 0.6), [distort, volume]);
  const dynamicSpeed = useMemo(() => speed + (volume * 2), [speed, volume]);
  const dynamicScale = useMemo(() => 1 + (volume * 0.2), [volume]);

  return (
    <Icosahedron 
      ref={meshRef}
      args={[radius, detail]} 
      scale={[dynamicScale, dynamicScale, dynamicScale]}
    >
      <MeshDistortMaterial
        color={color}
        speed={dynamicSpeed}
        distort={dynamicDistort}
        roughness={0}
        metalness={0.1}
        transparent={true}
        opacity={opacity}
        emissive={color}
        emissiveIntensity={0.2 + (volume * 0.5)}
      />
    </Icosahedron>
  );
};

// --- Main Voice Mode Component ---
const VoiceModeBlob = ({ onExit }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const recognitionRef = useRef(null);
  
  const volume = useAudioAnalyzer(isListening || isSpeaking);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const result = event.results[i][0].transcript;
            setTranscript(result);
            handleAiThink(result);
          } else {
            currentTranscript += event.results[i][0].transcript;
            setTranscript(currentTranscript);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const handleAiThink = useCallback((text) => {
    // Mock AI response for now - in a real app this would call an API
    setIsListening(false);
    setAiResponse("I'm processing your request about study material...");
    
    // Simulate thinking time
    setTimeout(() => {
      const response = "That's a great question about your study material. Based on the document, I've highlighted the core concepts for you.";
      setAiResponse(response);
      speak(response);
    }, 1500);
  }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsListening(true); // Go back to listening after speaking
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      setAiResponse("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="voice-mode-overlay" style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: 'radial-gradient(circle at center, #FFF7ED 0%, #FFFFFF 100%)',
      position: 'relative', overflow: 'hidden', borderRadius: '24px'
    }}>
      {/* Background Soft Gradients */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '300px', height: '300px', background: 'rgba(234, 88, 12, 0.05)', filter: 'blur(80px)',
        borderRadius: '50%', zIndex: 0
      }} />

      {/* Header Info */}
      <div style={{ position: 'absolute', top: '32px', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 32px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '10px', height: '10px', borderRadius: '50%', 
            background: isListening ? '#10B981' : isSpeaking ? '#7a12cc' : '#94A3B8',
            boxShadow: isListening ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
          }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', fontFamily: 'var(--font-outfit)' }}>
            {isListening ? 'Luter is Listening' : isSpeaking ? 'Luter is Speaking' : 'Voice Mode Paused'}
          </span>
        </div>
        <button onClick={onExit} style={{ background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer' }}>
          <X size={20} weight="bold" color="#64748B" />
        </button>
      </div>

      {/* Canvas for 3D Blob */}
      <div style={{ width: '100%', height: '400px', zIndex: 1, cursor: 'pointer' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true }}>
          <ambientLight intensity={1} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#FF4D4D" />
          
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <group>
              <BlobLayer radius={0.8} color="#FF4D4D" volume={volume} speed={2.5} distort={0.5} opacity={0.9} detail={24} />
              <BlobLayer radius={1.1} color="#EA580C" volume={volume} speed={2.0} distort={0.4} opacity={0.4} detail={20} />
              <BlobLayer radius={1.4} color="#FFF4E0" volume={volume} speed={1.5} distort={0.3} opacity={0.2} detail={20} />
            </group>
          </Float>
          
          <pointLight position={[0, 0, 0]} intensity={5 * (1 + volume)} color="#FF4D4D" distance={5} />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* Transcript Area */}
      <div style={{ zIndex: 10, textAlign: 'center', padding: '0 40px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ fontSize: '15px', fontWeight: 500, color: '#475569', fontStyle: 'italic' }}
            >
              "{transcript}"
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <div style={{ position: 'absolute', bottom: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', zIndex: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', marginBottom: '8px', fontFamily: 'var(--font-outfit)' }}>
            {isListening ? "Talk to me" : isSpeaking ? "Listen to Luter" : "Ready to start?"}
          </h3>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '240px', lineHeight: '1.5', fontWeight: 500 }}>
            {aiResponse || "Try asking: 'Can you summarize this material for me?'"}
          </p>
        </div>

        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: '80px', height: '80px', borderRadius: '50%', background: isListening ? '#FEE2E2' : isSpeaking ? '#F3E8FF' : '#FFF7ED',
            border: `2px solid ${isListening ? '#FECACA' : isSpeaking ? '#E9D5FF' : '#FFEDD5'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(234, 88, 12, 0.12)',
            cursor: 'pointer', position: 'relative'
          }}
        >
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.div key="speak" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Wave color="#7a12cc" size="32px" />
              </motion.div>
            ) : isListening ? (
              <motion.div key="mic-on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Microphone size={32} weight="fill" color="#EF4444" />
              </motion.div>
            ) : (
              <motion.div key="mic-off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Microphone size={32} weight="light" color="#EA580C" />
              </motion.div>
            )}
          </AnimatePresence>

          {isListening && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #EF4444', zIndex: -1 }}
            />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default VoiceModeBlob;
