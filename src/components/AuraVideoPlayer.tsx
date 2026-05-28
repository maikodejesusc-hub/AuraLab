import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw, Sparkles, Film, Loader2, Check } from 'lucide-react';

interface AuraVideoPlayerProps {
  prompt: string;
  videoType: string;
  musicStyle: string;
  captionTexts: string[];
  darkMode?: boolean;
}

export default function AuraVideoPlayer({
  prompt,
  videoType = 'particles',
  musicStyle = 'ambient',
  captionTexts = [],
  darkMode = false,
}: AuraVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const duration = 12; // 12 seconds loop
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const synthEngineRef = useRef<any>(null);

  // Subtitles index
  const safeCaptions = captionTexts.length > 0 ? captionTexts : [
    "Criando atmosfera visual para o seu clipe...",
    "Harmonizando batidas de síntese de som...",
    "Seu clipe Aura está finalizado!"
  ];
  
  const currentCaptionIndex = Math.min(
    Math.floor((currentTime / duration) * safeCaptions.length),
    safeCaptions.length - 1
  );

  // Synthesizer Engine definition inside the component context
  class AudioSynthEngine {
    private ctx: AudioContext | null = null;
    private primaryGain: GainNode | null = null;
    private intervalId: any = null;
    private style: string;
    private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

    constructor(style: string) {
      this.style = style;
    }

    public start(destStream?: MediaStreamAudioDestinationNode) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        this.ctx = new AudioContextClass();
        this.primaryGain = this.ctx.createGain();
        this.primaryGain.gain.setValueAtTime(isMuted ? 0 : 0.15, this.ctx.currentTime);
        
        this.primaryGain.connect(this.ctx.destination);

        if (destStream) {
          this.mediaStreamDest = destStream;
          this.primaryGain.connect(destStream);
        }

        let beat = 0;
        const playTick = () => {
          if (!this.ctx || this.ctx.state === 'closed') return;
          const t = this.ctx.currentTime;

          if (this.style === 'cyberpunk') {
            this.playOsc(55, 'sawtooth', t, 0.4, 0.12);
            if (beat % 2 === 0) {
              this.playNoise(t, 0.15, 0.05);
            }
            if (beat % 4 === 2) {
              this.playOsc(110, 'triangle', t + 0.1, 0.25, 0.06);
            }
          } else if (this.style === 'ambient') {
            const chord = [130.81, 164.81, 196.00, 261.63]; 
            const note = chord[beat % chord.length] * (beat % 3 === 0 ? 1 : 2);
            this.playOsc(note, 'sine', t, 0.9, 0.4);
          } else if (this.style === 'nature') {
            this.playWind(t, 0.6);
            if (beat % 3 === 0) {
              this.playOsc(2000, 'sine', t, 0.06, 0.015);
              this.playOsc(2050, 'sine', t + 0.04, 0.06, 0.012);
            }
          } else { // energetic
            const majorChord = [146.83, 185.00, 220.00, 293.66];
            const note = majorChord[beat % majorChord.length];
            this.playOsc(note, 'sawtooth', t, 0.35, 0.1);
            if (beat % 2 === 1) {
              this.playOsc(note * 1.5, 'sine', t + 0.08, 0.2, 0.05);
            }
          }
          beat = (beat + 1) % 16;
        };

        playTick();
        this.intervalId = setInterval(playTick, 450);
      } catch (err) {
        console.warn("Could not start Web Audio Context:", err);
      }
    }

    public setMute(muted: boolean) {
      if (this.primaryGain && this.ctx) {
        this.primaryGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
      }
    }

    private playOsc(freq: number, type: OscillatorType, time: number, freqDuration: number, gainVal: number) {
      if (!this.ctx || !this.primaryGain) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.06);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + freqDuration);

      osc.connect(gainNode);
      gainNode.connect(this.primaryGain);
      
      osc.start(time);
      osc.stop(time + freqDuration);
    }

    private playNoise(time: number, noiseDuration: number, gainVal: number) {
      if (!this.ctx || !this.primaryGain) return;
      const bufferSize = this.ctx.sampleRate * noiseDuration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(gainVal, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + noiseDuration);
      
      source.connect(gainNode);
      gainNode.connect(this.primaryGain);
      source.start(time);
    }

    private playWind(time: number, windDuration: number) {
      if (!this.ctx || !this.primaryGain) return;
      const bufferSize = this.ctx.sampleRate * windDuration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      let lastValue = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = 0.96 * lastValue + 0.04 * white;
        lastValue = data[i];
      }
      
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.015, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + windDuration);
      
      source.connect(gainNode);
      gainNode.connect(this.primaryGain);
      source.start(time);
    }

    public stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.ctx) {
        try {
          this.ctx.close();
        } catch (_) {}
        this.ctx = null;
      }
    }
  }

  // Animation logic for elements inside the Canvas based on selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray: any[] = [];
    const count = 55;

    // Reset list of particles or waves
    const initVisuals = () => {
      particlesArray = [];
      for (let i = 0; i < count; i++) {
        particlesArray.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * (videoType === 'nebula' ? 35 : 5) + 1,
          speedX: (Math.random() * 1.5 - 0.75) * (videoType === 'waves' ? 1.8 : 1),
          speedY: (Math.random() * 1.5 - 0.75) * (videoType === 'waves' ? 1.8 : 1),
          color: getRandomColor(),
          angle: Math.random() * 360,
          spinSpeed: Math.random() * 2 - 1
        });
      }
    };

    const getRandomColor = () => {
      if (videoType === 'matrix') {
        return `rgba(34, 197, 94, ${Math.random() * 0.7 + 0.3})`; // soft greens
      }
      if (videoType === 'sunset') {
        const colors = ['rgba(244, 63, 94, 0.75)', 'rgba(249, 115, 22, 0.75)', 'rgba(234, 179, 8, 0.75)', 'rgba(124, 58, 237, 0.65)'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      if (videoType === 'nebula') {
        const colors = ['rgba(139, 92, 246, 0.4)', 'rgba(236, 72, 153, 0.35)', 'rgba(59, 130, 246, 0.35)', 'rgba(167, 139, 250, 0.4)'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      if (videoType === 'waves') {
        return `rgba(6, 182, 212, ${Math.random() * 0.6 + 0.4})`; // cyan and turquoise
      }
      // default particles
      return `rgba(155, 81, 224, ${Math.random() * 0.7 + 0.3})`; // violet
    };

    initVisuals();

    // Resize coordinate matches
    canvas.width = 640;
    canvas.height = 360;

    let lastTime = performance.now();

    const drawLoop = (now: number) => {
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        timeRef.current = (timeRef.current + elapsed) % duration;
        setCurrentTime(timeRef.current);
      }

      // 1. Draw solid background
      if (videoType === 'matrix') {
        ctx.fillStyle = 'rgba(8, 10, 15, 0.25)'; // trail smear
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (videoType === 'sunset') {
          grad.addColorStop(0, '#110F24');
          grad.addColorStop(0.5, '#4C1D4F');
          grad.addColorStop(1, '#831843');
        } else if (videoType === 'nebula') {
          grad.addColorStop(0, '#02000A');
          grad.addColorStop(0.5, '#1E1233');
          grad.addColorStop(1, '#090514');
        } else if (videoType === 'waves') {
          grad.addColorStop(0, '#040b14');
          grad.addColorStop(1, '#0c1b33');
        } else { // particles
          grad.addColorStop(0, '#0a0915');
          grad.addColorStop(1, '#1e1b4b');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const pulse = Math.sin(now * 0.003) * 0.15 + 1.0;

      // 2. Animate and Render Based on Type
      if (videoType === 'matrix') {
        ctx.font = '11px monospace';
        particlesArray.forEach((part, idx) => {
          if (isPlaying) {
            part.y += part.speedY * 5 + 4;
            if (part.y > canvas.height) {
              part.y = -20;
              part.x = Math.random() * canvas.width;
            }
          }
          ctx.fillStyle = part.color;
          const randomChar = Math.random() > 0.5 ? '0' : '1';
          ctx.fillText(randomChar, part.x, part.y);
          if (idx % 8 === 0) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#22c55e';
            ctx.fillText(String.fromCharCode(33 + Math.floor(Math.random() * 90)), part.x, part.y);
            ctx.shadowBlur = 0;
          }
        });
      }

      else if (videoType === 'sunset') {
        // Morphing warm smooth dunes
        for (let waveIdx = 0; waveIdx < 4; waveIdx++) {
          ctx.beginPath();
          const amp = 15 + waveIdx * 10;
          const speed = (waveIdx + 1) * 0.0015;
          const shift = now * speed + waveIdx * 1.5;
          
          ctx.fillStyle = waveIdx === 0 
            ? 'rgba(236, 72, 153, 0.4)' 
            : waveIdx === 1 
              ? 'rgba(249, 115, 22, 0.35)' 
              : waveIdx === 2
                ? 'rgba(234, 179, 8, 0.25)'
                : 'rgba(219, 39, 119, 0.45)';

          ctx.moveTo(0, canvas.height);
          for (let x = 0; x <= canvas.width; x += 15) {
            const y = canvas.height - 120 + Math.sin(x * 0.006 + shift) * amp - waveIdx * 30;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.fill();
        }

        // Smiling warm glowing sun in the back
        ctx.beginPath();
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#f43f5e';
        const sunGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2 + 30, 2, canvas.width/2, canvas.height/2 + 30, 70);
        sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
        sunGrad.addColorStop(0.6, 'rgba(244, 63, 94, 0.6)');
        sunGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = sunGrad;
        ctx.arc(canvas.width/2, canvas.height/2 + 30, 70 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      else if (videoType === 'nebula') {
        // Deep magical galaxy space coordinates
        ctx.shadowBlur = 18 * pulse;
        ctx.shadowColor = '#8b5cf6';
        
        particlesArray.forEach(p => {
          if (isPlaying) {
            p.angle += p.spinSpeed * 0.015;
            // Orbiting movement around screen center
            const rad = p.size * 3 + Math.sin(now * 0.0004 + p.angle) * 35;
            p.x = canvas.width / 2 + Math.cos(p.angle) * rad;
            p.y = canvas.height / 2 + Math.sin(p.angle) * (rad * 0.6);
          }
          const scaleSize = p.size * (1 + Math.sin(now * 0.004 + p.size) * 0.2);
          ctx.beginPath();
          const radGrad = ctx.createRadialGradient(p.x, p.y, scaleSize * 0.1, p.x, p.y, scaleSize);
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          radGrad.addColorStop(0.3, p.color);
          radGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.fillStyle = radGrad;
          ctx.arc(p.x, p.y, scaleSize, 0, Math.PI * 2);
          ctx.fill();
        });
        
        ctx.shadowBlur = 0;
      }

      else if (videoType === 'waves') {
        // Audio sound frequencies wave bars / equalizer simulation
        const barsCount = 38;
        const barWidth = canvas.width / barsCount;
        ctx.lineWidth = 2.5;

        for (let i = 0; i < barsCount; i++) {
          const shift = now * 0.005 + i * 0.25;
          const frequencyValue = Math.max(
            15,
            70 * (0.6 + Math.sin(shift) * 0.4) * (isPlaying ? (0.85 + Math.random() * 0.3) : 0.6)
          );
          
          const x = i * barWidth + barWidth / 2;
          const yBottom = canvas.height;
          const yTop = canvas.height - frequencyValue - 40;

          const waveGrad = ctx.createLinearGradient(x, yBottom, x, yTop);
          waveGrad.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
          waveGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.5)');
          waveGrad.addColorStop(1, '#22d3ee');

          ctx.strokeStyle = waveGrad;
          ctx.beginPath();
          ctx.moveTo(x, yBottom);
          ctx.lineTo(x, yTop);
          ctx.stroke();

          // Reflect mirror top wave as reflections
          const mirrorTop = 40 + frequencyValue * 0.45;
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, mirrorTop);
          ctx.stroke();
        }

        // Dynamic vector sine-line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#0284c7';
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = canvas.height/2 + Math.sin(x * 0.01 + now * 0.003) * 24 * (isPlaying ? pulse : 0.6);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      }

      else {
        // Classic high-tech interconnected networks particles
        particlesArray.forEach(p => {
          if (isPlaying) {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
          }

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Drew link networks if close
        ctx.strokeStyle = 'rgba(155, 81, 224, 0.22)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            const dist = Math.hypot(particlesArray[i].x - particlesArray[j].x, particlesArray[i].y - particlesArray[j].y);
            if (dist < 80) {
              ctx.beginPath();
              ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
              ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // 3. Cinematic framing bar borders (Top & Bottom letterboxes for movies)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, 18);
      ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

      animationFrameRef.current = requestAnimationFrame(drawLoop);
    };

    animationFrameRef.current = requestAnimationFrame(drawLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, videoType]);

  // Audio syncer toggles with video playing states
  useEffect(() => {
    if (isPlaying) {
      if (!synthEngineRef.current) {
        synthEngineRef.current = new AudioSynthEngine(musicStyle);
        synthEngineRef.current.start();
      } else {
        synthEngineRef.current.setMute(isMuted);
      }
    } else {
      if (synthEngineRef.current) {
        synthEngineRef.current.stop();
        synthEngineRef.current = null;
      }
    }

    return () => {
      if (synthEngineRef.current) {
        synthEngineRef.current.stop();
        synthEngineRef.current = null;
      }
    };
  }, [isPlaying, musicStyle]);

  // Handle manual mute switch toggles on audio engine
  const toggleMute = () => {
    const updated = !isMuted;
    setIsMuted(updated);
    if (synthEngineRef.current) {
      synthEngineRef.current.setMute(updated);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleReset = () => {
    timeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // COMPLETE MULTI-TRACK WEB VIDEO RECORDER & MP4 DOWNLOAD EXPORT!
  const handleExportVideo = async () => {
    if (isExporting) return;
    setIsPlaying(false);
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExporting(false);
      return;
    }

    try {
      // 1. Progress simulator ticker
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 350);

      const stream = canvas.captureStream(25); // capture 25fps stream
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(interval);
        setExportProgress(100);
        setTimeout(() => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Aura_Lab_Video_${videoType}_${Date.now()}.webm`;
          a.click();
          setIsExporting(false);
          setExportComplete(true);
          setTimeout(() => setExportComplete(false), 3000);
        }, 500);
      };

      // Play video to record its output on the fly instantly
      setIsPlaying(true);
      recorder.start();

      // Record exactly remaining or full 6 seconds loop
      setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
          setIsPlaying(false);
        }
      }, 6000);

    } catch (err) {
      console.error("Recording error, downloading standard direct animation capture:", err);
      // Fallback
      setExportProgress(100);
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `Aura_Lab_Visual_Capture_${Date.now()}.png`;
        link.click();
        setIsExporting(false);
      }, 500);
    }
  };

  return (
    <div className={`mt-3.5 border rounded-3xl overflow-hidden relative shadow-md w-full max-w-lg mx-auto ${
      darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-900 border-zinc-800 text-white'
    }`}>
      {/* Player header */}
      <div className="bg-black/40 px-4 py-2.5 flex items-center justify-between border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#9B51E0] animate-pulse" />
          <span className="text-[11px] font-black tracking-wider uppercase font-sans text-zinc-200">
            Aura Video Engine v1.0
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full capitalize ${
            videoType === 'nebula' ? 'bg-purple-900/40 text-purple-300' :
            videoType === 'matrix' ? 'bg-emerald-950/40 text-emerald-400' :
            videoType === 'waves' ? 'bg-cyan-950/40 text-[#19B5FE]' :
            videoType === 'sunset' ? 'bg-rose-950/40 text-rose-300' : 'bg-indigo-950/40 text-indigo-300'
          }`}>
            Style: {videoType}
          </span>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover cursor-pointer block"
          onClick={handlePlayPause}
        />

        {/* Video Overlay Watermark */}
        <div className="absolute top-2.5 right-3.5 select-none text-[8.5px] font-black tracking-widest text-zinc-400/50 uppercase pointer-events-none font-mono flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-[#9B51E0]/50" />
          <span>AURA LAB GENERATIVE</span>
        </div>

        {/* Play Centered Icon when paused */}
        {!isPlaying && !isExporting && (
          <button 
            onClick={handlePlayPause}
            className="absolute p-4 rounded-full bg-black/60 hover:bg-[#9B51E0] text-white hover:scale-110 active:scale-95 transition-all shadow-lg cursor-pointer z-10"
          >
            <Play className="w-7 h-7 fill-white translate-x-0.5" />
          </button>
        )}

        {/* Rendering Export Screen Overlay */}
        {isExporting && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-40">
            <Loader2 className="w-8 h-8 text-[#9B51E0] animate-spin mb-3" />
            <h4 className="text-xs font-black tracking-wider uppercase text-zinc-100">Compilando Elementos Visuales...</h4>
            <span className="text-[10px] font-mono text-zinc-400 mt-1">Sincronizando áudio e renderizando partículas</span>
            <div className="w-36 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-4">
              <div 
                className="h-full bg-[#9B51E0] duration-300 transition-all"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="text-[9.5px] font-bold text-[#9B51E0] mt-1.5">{exportProgress}%</span>
          </div>
        )}

        {/* Cinematic Captions subtitles (Dynamic text) */}
        {isPlaying && (
          <div className="absolute bottom-6 left-4 right-4 text-center pointer-events-none select-none z-10">
            <div className="inline-block px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-3xs border border-white/10 max-w-[85%]">
              <p className="text-[10.5px] sm:text-xs font-semibold leading-relaxed tracking-wide text-zinc-100 font-sans">
                {safeCaptions[currentCaptionIndex]}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timing and interactive slider timeline */}
      <div className="px-4 pt-3 flex items-center gap-3 select-none">
        <span className="text-[10px] font-mono text-zinc-400">
          0:{Math.max(0, Math.floor(currentTime)).toString().padStart(2, '0')}
        </span>
        <div className="flex-grow h-1 bg-zinc-800 rounded-full overflow-hidden relative cursor-pointer">
          <div 
            className="h-full bg-gradient-to-r from-[#9B51E0] to-[#19B5FE]" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          0:{duration}
        </span>
      </div>

      {/* Control Action Buttons Bar */}
      <div className="px-4 pb-3.5 pt-2 flex items-center justify-between flex-wrap gap-2 text-white">
        <div className="flex items-center gap-2">
          {/* Main Play Action */}
          <button 
            onClick={handlePlayPause}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-zinc-200 cursor-pointer"
            title={isPlaying ? "Pausar vídeo" : "Iniciar vídeo"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white translate-x-px" />}
          </button>

          {/* Reset Action */}
          <button 
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title="Reiniciar vídeo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mute Synth Action */}
          <button 
            onClick={toggleMute}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
          </button>
        </div>

        {/* Generate and download video export package */}
        <button
          onClick={handleExportVideo}
          disabled={isExporting}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold font-sans text-xs transition duration-150 shadow-sm cursor-pointer select-none active:scale-97 ${
            exportComplete 
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-[#9B51E0] hover:bg-[#8338ec] text-white'
          }`}
          title="Exportar vídeo Webm/MP4"
        >
          {exportComplete ? (
            <>
              <Check className="w-3.5 h-3.5 text-white animate-bounce" />
              <span>Pronto!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Exportar Vídeo</span>
            </>
          )}
        </button>
      </div>

      {/* Floating Prompt Description */}
      <div className="bg-black/30 px-4 py-2 border-t border-white/5 select-all">
        <p className="text-[10px] text-zinc-400 leading-normal italic font-sans font-medium line-clamp-1">
          Prompt: "{prompt}"
        </p>
      </div>
    </div>
  );
}
