/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  Battery, 
  Zap, 
  Signal, 
  Compass, 
  Share2, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  ArrowUp,
  MessageSquare,
  Send,
  Plus,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  FileCode,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Image,
  Globe,
  BookOpen,
  Lightbulb,
  PenLine,
  User,
  Mic,
  Volume2,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  LogIn,
  LogOut,
  Facebook,
  Film
} from 'lucide-react';

import AuraVideoPlayer from './components/AuraVideoPlayer';

// Battery interface for standard Web APIs in TypeScript
interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  images?: string[]; // user uploaded base64 thumbnails
  files?: { name: string; size: string; type: string }[]; // user uploaded metadata
  aiGeneratedImage?: string; // AI generated image URL or base64 code
  aiGeneratedVideo?: {
    prompt: string;
    videoType: 'nebula' | 'particles' | 'matrix' | 'sunset' | 'waves' | string;
    musicStyle: 'cyberpunk' | 'ambient' | 'nature' | 'energetic' | string;
    captionTexts: string[];
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failure, trying textarea fallback:', err);
  }
  
  // Safe robust fallback for iframe Sandbox mode (execCommand on temporary textarea)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.error('Textarea copy fallback failed:', fallbackErr);
    return false;
  }
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer ${
        copied 
          ? 'bg-emerald-600 border border-emerald-500 text-white' 
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 hover:text-white'
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-white" />
          <span>Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar</span>
        </>
      )}
    </button>
  );
};

const renderMessageContent = (msgText: string) => {
  if (!msgText.includes('```')) {
    // Standard paragraph rendering with elements
    return (
      <div className="space-y-3 font-sans text-xs sm:text-sm">
        {msgText.split('\n\n').map((paragraph, pIdx) => {
          if (!paragraph.trim()) return null;
          // List parsing
          if (paragraph.startsWith('- ') || paragraph.match(/^\d+\./)) {
            return (
              <ul key={pIdx} className="list-disc list-inside space-y-1.5 pl-2 mt-1">
                {paragraph.split('\n').map((li, lIdx) => {
                  if (!li.trim()) return null;
                  return (
                    <li key={lIdx} className="text-zinc-700 font-light text-left">
                      {li.replace(/^(-\s*|\d+\.\s*)/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\`(.*?)\`/g, '$1')}
                    </li>
                  );
                })}
              </ul>
            );
          }
          // Header tags
          if (paragraph.startsWith('### ')) {
            return (
              <h4 key={pIdx} className="text-zinc-900 font-bold tracking-wide text-xs uppercase text-[#5e35b1] mt-3 mb-1.5 font-sans text-left">
                {paragraph.replace('### ', '')}
              </h4>
            );
          }
          return (
            <p key={pIdx} className="text-left font-light leading-relaxed">
              {paragraph.split(' ').map((word, wIdx) => {
                if (word.startsWith('`') && word.endsWith('`')) {
                  return <code key={wIdx} className="bg-zinc-100 text-purple-700 font-mono px-1.5 py-0.5 rounded border border-zinc-200 text-[11px] mx-0.5">{word.slice(1, -1)}</code>;
                }
                if (word.startsWith('**') && word.endsWith('**')) {
                  return <strong key={wIdx} className="font-bold text-zinc-900 mx-0.5">{word.slice(2, -2)}</strong>;
                }
                return word + ' ';
              })}
            </p>
          );
        })}
      </div>
    );
  }

  const parts = msgText.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-xs sm:text-sm">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // It's a code block
          const cleanBlock = part.slice(3, -3);
          const lines = cleanBlock.split('\n');
          let language = 'code';
          let codeLines = [...lines];

          if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
            language = lines[0].trim() || 'code';
            codeLines = lines.slice(1);
          }

          const codeContent = codeLines.join('\n').trim();

          return (
            <div key={index} className="my-4 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-950 shadow-md">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-900 text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider select-none">
                <span className="text-[#9B51E0] font-bold">{language}</span>
                <CopyButton text={codeContent} />
              </div>
              {/* Code display */}
              <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-200 bg-zinc-950 selection:bg-purple-500/35 scrollbar-thin whitespace-pre leading-relaxed text-left max-h-[400px]">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        } else {
          // It's regular text, parse it with original paragraph structure
          if (!part.trim()) return null;
          return (
            <div key={index} className="space-y-3 text-left">
              {part.split('\n\n').map((paragraph, pIdx) => {
                if (!paragraph.trim()) return null;
                // List parsing
                if (paragraph.startsWith('- ') || paragraph.match(/^\d+\./)) {
                  return (
                    <ul key={pIdx} className="list-disc list-inside space-y-1.5 pl-2 mt-1">
                      {paragraph.split('\n').map((li, lIdx) => {
                        if (!li.trim()) return null;
                        return (
                          <li key={lIdx} className="text-zinc-700 font-light">
                            {li.replace(/^(-\s*|\d+\.\s*)/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\`(.*?)\`/g, '$1')}
                          </li>
                        );
                      })}
                    </ul>
                  );
                }
                // Header tags
                if (paragraph.startsWith('### ')) {
                  return (
                    <h4 key={pIdx} className="text-zinc-900 font-bold tracking-wide text-xs uppercase text-[#5e35b1] mt-3 mb-1.5 font-sans">
                      {paragraph.replace('### ', '')}
                    </h4>
                  );
                }
                return (
                  <p key={pIdx} className="font-light leading-relaxed">
                    {paragraph.split(' ').map((word, wIdx) => {
                      if (word.startsWith('`') && word.endsWith('`')) {
                        return <code key={wIdx} className="bg-zinc-100 text-purple-700 font-mono px-1.5 py-0.5 rounded border border-zinc-200 text-[11px] mx-0.5">{word.slice(1, -1)}</code>;
                      }
                      if (word.startsWith('**') && word.endsWith('**')) {
                        return <strong key={wIdx} className="font-bold text-zinc-900 mx-0.5">{word.slice(2, -2)}</strong>;
                      }
                      return word + ' ';
                    })}
                  </p>
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
};

export default function App() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState<'chat' | 'compiler' | 'signals' | 'gallery'>('chat');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  
  // Custom configurations (Settings Menu)
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('aura_sound_on');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const [vibrationOn, setVibrationOn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('aura_vibration_on');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    try {
      const stored = localStorage.getItem('aura_font_size');
      return (stored as 'small' | 'medium' | 'large') || 'medium';
    } catch {
      return 'medium';
    }
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('aura_dark_mode');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  
  // App initial loading splash screen states
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);

  // Google / Facebook Auth states
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    avatar: string;
    provider: 'google' | 'facebook';
  } | null>(() => {
    try {
      const stored = localStorage.getItem('aura_logged_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authConnecting, setAuthConnecting] = useState<'google' | 'facebook' | null>(null);

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'prompting' | 'installed' | 'unsupported'>('idle');

  // Diagnostics states
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [vibrationSuccess, setVibrationSuccess] = useState<string | null>(null);

  // Device orientation / physics sensors simulation
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isUsingPhysicalSensor, setIsUsingPhysicalSensor] = useState(false);
  const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Gemini AI Chat states & fine-tune specs (Aura advanced features)
  const [inputValue, setInputValue] = useState('');
  const [aiPersonality, setAiPersonality] = useState<string>(() => {
    return localStorage.getItem('aura_ai_personality') || 'aura_original';
  });
  const [aiTemperature, setAiTemperature] = useState<number>(() => {
    const saved = localStorage.getItem('aura_ai_temperature');
    return saved ? Number(saved) : 0.7;
  });
  const [showAiSpecs, setShowAiSpecs] = useState<boolean>(true);

  // Chat conversation history sessions states (Multi-session manager)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('aura_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Erro ao carregar sessões:", e);
      }
    }
    return [
      {
        id: 'welcome',
        title: 'Conversa Inicial ✨',
        messages: [
          {
            id: 'welcome_msg',
            sender: 'gemini',
            text: 'Olá! Eu sou a **Aura**, sua assistente inteligente! Estou aqui para bater um papo, criar ideias inovadoras e te ajudar no nosso laboratório Android. Sinta-se à vontade para perguntar as horas, trocar sugestões ou conversar sobre tecnologia!',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        ],
        updatedAt: new Date().toISOString()
      }
    ];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem('aura_active_session_id') || 'welcome';
  });

  // Current chat state (synchronized automatically with the active session block)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showPills, setShowPills] = useState(true);

  // Click outside options menu dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (optionsMenuOpen && optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setOptionsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [optionsMenuOpen]);

  // Sync 1: Load session messages when activeSessionId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);

    const active = sessions.find(s => s.id === activeSessionId);
    if (active) {
      setChatMessages(active.messages);
    }
    localStorage.setItem('aura_active_session_id', activeSessionId);
  }, [activeSessionId]);

  // Load synthesis voices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadAllVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        // Filter PT voices mainly
        const pt = allVoices.filter(v => 
          v.lang.toLowerCase().includes('pt') || 
          v.lang.toLowerCase().includes('pt-br') || 
          v.lang.toLowerCase().includes('pt-pt')
        );
        setVoices(pt.length > 0 ? pt : allVoices);
      };
      loadAllVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadAllVoices;
      }
    }
  }, []);

  // Sync 2: Save updates from chatMessages back to the currently active session
  useEffect(() => {
    if (chatMessages.length === 0) return;
    
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === activeSessionId);
      if (idx !== -1) {
        const updated = [...prev];
        const currentMessagesJson = JSON.stringify(updated[idx].messages);
        const newMessagesJson = JSON.stringify(chatMessages);
        
        if (currentMessagesJson !== newMessagesJson) {
          // Auto-generate title based on first user message if title starts with the default prefix or is generic
          let title = updated[idx].title;
          if (title.startsWith('Nova Conversa') || title.startsWith('Conversa Inicial') || title.startsWith('Bem-vindo') || title.startsWith('Nova Consulta')) {
            const firstUserText = chatMessages.find(m => m.sender === 'user')?.text;
            if (firstUserText) {
              title = firstUserText.slice(0, 24) + (firstUserText.length > 24 ? '...' : '');
            }
          }
          
          updated[idx] = {
            ...updated[idx],
            title: title,
            messages: chatMessages,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('aura_chat_sessions', JSON.stringify(updated));
        }
        return updated;
      } else {
        // Create new session if doesn't exist
        const newSession: ChatSession = {
          id: activeSessionId,
          title: chatMessages.find(m => m.sender === 'user')?.text?.slice(0, 24) || 'Nova Conversa 💬',
          messages: chatMessages,
          updatedAt: new Date().toISOString()
        };
        const updated = [newSession, ...prev];
        localStorage.setItem('aura_chat_sessions', JSON.stringify(updated));
        return updated;
      }
    });
  }, [chatMessages, activeSessionId]);

  // Function to dynamically trigger starting a fresh new chat session
  const handleNewSession = () => {
    const newId = 'session_' + Math.random().toString(36).substr(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: `Nova Consulta #${sessions.length + 1} 🔍`,
      messages: [
        {
          id: 'welcome_init',
          sender: 'gemini',
          text: 'Iniciamos uma nova consulta! Como posso ajudar você no nosso laboratório Android agora?',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ],
      updatedAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setChatMessages(newSession.messages);
    setCurrentTab('chat');
    playUiSound('success');
  };

  // Function to delete conversations
  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    cancelSpeech();
    
    // Play alert feedback
    playUiSound('delete');
    if (vibrationOn && 'vibrate' in navigator) {
      navigator.vibrate([40, 30]);
    }

    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== idToDelete);
      
      // If none remaining, spawn a default one
      if (remaining.length === 0) {
        const defaultSess: ChatSession = {
          id: 'welcome',
          title: 'Conversa Inicial ✨',
          messages: [
            {
              id: 'welcome_msg',
              sender: 'gemini',
              text: 'Olá! Eu sou a **Aura**, sua assistente inteligente! Estou aqui para bater um papo, criar ideias inovadoras e te ajudar no nosso laboratório Android. Sinta-se à vontade para perguntar as horas, trocar sugestões ou conversar sobre tecnologia!',
              timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
          ],
          updatedAt: new Date().toISOString()
        };
        setActiveSessionId('welcome');
        setChatMessages(defaultSess.messages);
        const finalSess = [defaultSess];
        localStorage.setItem('aura_chat_sessions', JSON.stringify(finalSess));
        return finalSess;
      }
      
      localStorage.setItem('aura_chat_sessions', JSON.stringify(remaining));
      
      // If we deleted the active one, pick the first remaining active session
      if (idToDelete === activeSessionId) {
        setActiveSessionId(remaining[0].id);
        setChatMessages(remaining[0].messages);
      }
      return remaining;
    });

    setVibrationSuccess('Sessão apagada de forma segura! 🧹');
    setTimeout(() => setVibrationSuccess(null), 2000);
  };

  // Aura Audio and Interactive Attachment state controllers
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string; base64: string; content?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // IA Voice customization states
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('aura_voice_name') || '';
  });
  const [voiceRate, setVoiceRate] = useState<number>(() => {
    return Number(localStorage.getItem('aura_voice_rate') || '1.3');
  });
  const [voicePitch, setVoicePitch] = useState<number>(() => {
    return Number(localStorage.getItem('aura_voice_pitch') || '1.0');
  });
  const [autoSpeakOn, setAutoSpeakOn] = useState<boolean>(() => {
    return localStorage.getItem('aura_auto_speak_on') === 'true';
  });
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState<boolean>(false);

  // Long-press interactive gesture for message details (Delete and Copy options)
  const [actionMenuMessage, setActionMenuMessage] = useState<ChatMessage | null>(null);
  const [holdProgress, setHoldProgress] = useState<{ id: string; percent: number } | null>(null);
  const [copyFeedbackShow, setCopyFeedbackShow] = useState(false);
  const holdTimeoutRef = useRef<any>(null);
  const holdIntervalRef = useRef<any>(null);

  const handleStartHold = (e: React.MouseEvent | React.TouchEvent, msg: ChatMessage) => {
    // Avoid triggering when tapping buttons/links inside the bubble
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('svg') || 
      target.closest('.speak-btn') || 
      target.closest('img.cursor-zoom-in')
    ) {
      return;
    }

    // Clear any existing active holding
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    let elapsed = 0;
    const duration = 500; // 0.5 seconds - "segurar um pouco"
    const step = 25;

    setHoldProgress({ id: msg.id, percent: 0 });

    holdIntervalRef.current = setInterval(() => {
      elapsed += step;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress({ id: msg.id, percent: pct });

      if (elapsed >= duration) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      }
    }, step);

    holdTimeoutRef.current = setTimeout(() => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      setHoldProgress(null);
      // Open action menu modal
      setActionMenuMessage(msg);
      // Give haptic/vibrate signal
      triggerVibrate('Ação de Mensagem', [60, 40]);
    }, duration);
  };

  const handleEndHold = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(null);
  };

  const handleDeleteMessage = (msgId: string) => {
    cancelSpeech();
    setChatMessages(prev => prev.filter(m => m.id !== msgId));
    setActionMenuMessage(null);
    triggerVibrate('Mensaem Deletada', [40, 20]);
  };

  const handleCopyMessageText = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopyFeedbackShow(true);
      triggerVibrate('Sucesso de Cópia', [30]);
      setTimeout(() => {
        setCopyFeedbackShow(false);
        setActionMenuMessage(null);
      }, 1200);
    } else {
      setVibrationSuccess('Falha ao copiar texto da mensagem.');
      setTimeout(() => setVibrationSuccess(null), 3000);
    }
  };

  const triggerApkDownload = () => {
    try {
      // Trigger download from the secure high-performance server template API route
      // which serves a real, cryptographically-signed, valid Android APK file!
      const link = document.createElement('a');
      link.href = '/api/download-apk';
      link.download = `Aura_Lab_v${appVersion || '1.0.0'}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setVibrationSuccess(`Seu download do APK (Aura_Lab_v${appVersion || '1.0.0'}.apk) foi iniciado! 📲`);
      triggerVibrate('Vibração Sucesso APK', [50, 30, 60]);
      setTimeout(() => setVibrationSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to trigger APK install download', err);
      setVibrationSuccess('Erro ao iniciar download do instalador APK.');
      setTimeout(() => setVibrationSuccess(null), 3500);
    }
  };

  const handleExportChat = (format: 'txt' | 'md') => {
    if (chatMessages.length === 0) return;
    
    let content = '';
    if (format === 'md') {
      content += `# Histórico de Conversa - Aura AI\n`;
      content += `*Exportado em: ${new Date().toLocaleString()}*\n\n---\n\n`;
      
      chatMessages.forEach((msg) => {
        const role = msg.sender === 'user' ? 'Você' : 'Aura';
        content += `### **${role}** <sub>(${msg.timestamp})</sub>\n\n`;
        if (msg.text) {
          content += `${msg.text}\n\n`;
        }
        if (msg.files && msg.files.length > 0) {
          content += `**Arquivos anexados:**\n`;
          msg.files.forEach(f => {
            content += `- \`${f.name}\` (${f.size})\n`;
          });
          content += `\n`;
        }
        content += `---\n\n`;
      });
    } else {
      content += `==========================================\n`;
      content += `HISTÓRICO DE CONVERSA - AURA AI\n`;
      content += `Exportado em: ${new Date().toLocaleString()}\n`;
      content += `==========================================\n\n`;
      
      chatMessages.forEach((msg) => {
        const role = msg.sender === 'user' ? 'VOCÊ' : 'AURA';
        content += `[${msg.timestamp}] ${role}:\n`;
        content += `${msg.text || ''}\n`;
        if (msg.files && msg.files.length > 0) {
          content += `Arquivos anexados: `;
          content += msg.files.map(f => `${f.name} (${f.size})`).join(', ');
          content += `\n`;
        }
        content += `\n------------------------------------------\n\n`;
      });
    }
    
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversa-aura-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      playUiSound('success');
      triggerVibrate('Exportar Sucesso', [40, 20]);
      setVibrationSuccess(`Conversa exportada como .${format}! 💾`);
      setTimeout(() => setVibrationSuccess(null), 2500);
    } catch (err) {
      console.error("Erro ao exportar arquivo:", err);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    setAuthConnecting(provider);
    triggerVibrate('Iniciando Autenticação', [45]);
    
    // Simulate high-fidelity social login authorization flow
    setTimeout(() => {
      let resolvedUser = {
        name: 'Maiko de Jesus',
        email: 'maikodejesusc@gmail.com',
        avatar: 'M',
        provider: provider
      };

      if (provider === 'facebook') {
        resolvedUser = {
          name: 'Maiko de Jesus',
          email: 'maikodejesusc@gmail.com',
          avatar: 'M',
          provider: 'facebook' as const
        };
      }

      setCurrentUser(resolvedUser);
      localStorage.setItem('aura_logged_user', JSON.stringify(resolvedUser));
      setAuthConnecting(null);
      setLoginModalOpen(false);
      
      // Feedback toast notification
      setVibrationSuccess(`Acesso via ${provider === 'google' ? 'Google' : 'Facebook'} realizado! Bem-vindo(a), Maiko! 👋`);
      triggerVibrate('Sucesso de Login', [50, 30]);
      setTimeout(() => setVibrationSuccess(null), 4000);
    }, 1500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aura_logged_user');
    setProfileMenuOpen(false);
    setVibrationSuccess('Sessão encerrada com sucesso.');
    triggerVibrate('Desconectado', [40, 20]);
    setTimeout(() => setVibrationSuccess(null), 3000);
  };

  // Swipe gesture hooks to slide sidebar back without explicit clicking
  const touchStartXRef = useRef<number | null>(null);

  const handleSidebarTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleSidebarTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const diffX = touchStartXRef.current - currentX;
    
    // If user dragged/swiped more than 50px to the left, close sidebar smoothly
    if (diffX > 50) {
      setSidebarOpen(false);
      touchStartXRef.current = null;
    }
  };

  const handleSidebarTouchEnd = () => {
    touchStartXRef.current = null;
  };

  // Native Screen Reader / TTS Speak Response 
  const cancelSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const toggleSpeak = (msgId: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (speakingMsgId === msgId) {
          setSpeakingMsgId(null);
          return;
        }
      }

      // Convert Markdown formatting into natural descriptive spoken text
      let cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\`(.*?)\`/g, '$1')
        .replace(/^-\s*/gm, '')
        .replace(/###\s+/g, '')
        .replace(/```[\s\S]*?```/g, '[Código de Script Omitido]');

      // Strip emojis so the engine does not read them
      try {
        cleanText = cleanText.replace(/\p{Extended_Pictographic}/gu, '');
      } catch (err) {
        // Fallback for older environments
      }
      cleanText = cleanText
        .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Replace # and $ with safe spaces so they do not stutter or halt the engine
      cleanText = cleanText
        .replace(/#/g, ' ')
        .replace(/\$/g, ' ');

      // Replace ellipses, single periods, and question marks with commas to bypass native speech segment stops
      cleanText = cleanText
        .replace(/\.{2,}/g, ', ')
        .replace(/\./g, ', ')
        .replace(/\?/g, ', ');

      // Clean up any double commas and extra whitespaces
      cleanText = cleanText
        .replace(/,(\s*,)+/g, ',')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      
      // Selected Voice config pairing
      if (selectedVoiceName) {
        const found = voices.find(v => v.name === selectedVoiceName);
        if (found) {
          utterance.voice = found;
        }
      } else {
        const fallback = voices.find(v => v.lang.toLowerCase().includes('pt'));
        if (fallback) utterance.voice = fallback;
      }

      // Modulations
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;

      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
      if (navigator.vibrate) navigator.vibrate([15]);
    } else {
      alert("Seu navegador não oferece suporte nativo para síntese de voz (TTS).");
    }
  };

  // Browser Continuous Speech-To-Text Audio Recorder
  const toggleSpeechRecognition = () => {
    const SpeechConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechConstructor) {
      alert("Conversão de áudio para texto não suportada no seu navegador atual. Abra no Chrome ou Safari!");
      return;
    }

    if (isRecording) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const rec = new SpeechConstructor();
      rec.lang = 'pt-BR';
      rec.continuous = false; // Stop automatically when user finishes speaking
      rec.interimResults = false;

      rec.onstart = () => {
        setIsRecording(true);
        if (navigator.vibrate) navigator.vibrate([30]);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          // Auto-send the transcribed question instantly!
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Audio capturing error:", err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      setRecognitionInstance(rec);
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Manual File Selector & Attacher
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      
      // Determine file format and process loading
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            type: file.type,
            base64: reader.result as string
          }]);
        };
      } else {
        // Document / General log files - read as text string so we can parse contents
        reader.readAsText(file);
        reader.onload = () => {
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            type: file.type,
            base64: "", // Not an image Base64 representation
            content: reader.result as string
          }]);
        };
      }
    });

    // Clear input so same file can be chosen again
    e.target.value = '';
    if (navigator.vibrate) navigator.vibrate([20]);
  };

  const removeAttachedFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
    if (navigator.vibrate) navigator.vibrate([10]);
  };

  // Simulated APK compiler configurations
  const [packageName, setPackageName] = useState('com.aura.lab');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [androidSdkMin, setAndroidSdkMin] = useState('24 (Android 7.0)');
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [compilerProgress, setCompilerProgress] = useState(0);
  const [compilerState, setCompilerState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds loading completion
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.ceil((elapsed / duration) * 100));
      setSplashProgress(progress);
      
      if (elapsed >= duration) {
        clearInterval(interval);
        const timeout = setTimeout(() => {
          setShowSplash(false);
        }, 300); // graceful final transition
        return () => clearTimeout(timeout);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Determine dynamic app URL using the actual active domain so users can test on mobile/companion devices during development!
    let finalUrl = window.location.origin + "/";
    if (finalUrl.includes('-dev-')) {
      finalUrl = finalUrl.replace('-dev-', '-pre-');
    }
    setCurrentUrl(finalUrl);

    // Check device compatibility
    const userAgent = navigator.userAgent.toLowerCase();
    const detectMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsMobile(detectMobile);

    // Auto-collapse sidebar on smaller tablets and mobile screens
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    // Capture PWA "beforeinstallprompt"
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Already installed handler
    window.addEventListener('appinstalled', () => {
      setInstallStatus('installed');
      setIsInstallable(false);
    });

    // Track network online / offline
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Query Device Battery details
    const nav = navigator as NavigatorWithBattery;
    if (nav.getBattery) {
      nav.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        const onLevelChange = () => setBatteryLevel(Math.round(battery.level * 100));
        const onChargingChange = () => setIsCharging(battery.charging);

        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);

        return () => {
          battery.removeEventListener('levelchange', onLevelChange);
          battery.removeEventListener('chargingchange', onChargingChange);
        };
      }).catch(err => console.warn('Battery status not supported:', err));
    }

    // Physical angular Sensor setup (Giroscópio / Acelerômetro)
    if (window.DeviceOrientationEvent) {
      const handleOrientation = (event: DeviceOrientationEvent) => {
        const { gamma, beta } = event;
        if (gamma !== null && beta !== null) {
          setIsUsingPhysicalSensor(true);
          setTilt({
            x: Math.max(-30, Math.min(30, gamma)),
            y: Math.max(-30, Math.min(30, beta - 45)) // holding offset
          });
        }
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Native PWA installation triggers
  const triggerNativeInstall = async () => {
    if (!deferredPrompt) {
      setInstallStatus('unsupported');
      return;
    }
    setInstallStatus('prompting');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallStatus('installed');
      setIsInstallable(false);
    } else {
      setInstallStatus('idle');
    }
    setDeferredPrompt(null);
  };

  // UI synthesizer sound effects
  const playUiSound = (type: 'click' | 'success' | 'delete') => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'delete') {
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("AudioContext block:", e);
    }
  };

  // Vibrate motor test
  const triggerVibrate = (patternName: string, pattern: number[]) => {
    if (!vibrationOn) return;
    if ('vibrate' in navigator) {
      const success = navigator.vibrate(pattern);
      if (success) {
        setVibrationSuccess(`Haptic OK: ${patternName}! 📳`);
        setTimeout(() => setVibrationSuccess(null), 2500);
      } else {
        setVibrationSuccess('Dispositivo silencioso ou haptic bloqueado.');
        setTimeout(() => setVibrationSuccess(null), 3000);
      }
    } else {
      setVibrationSuccess('API de Vibração não suportada.');
      setTimeout(() => setVibrationSuccess(null), 3000);
    }
  };

  // Native Share intent
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Aura Lab',
          text: 'Converse com a Aura, minha assistente de IA ultra rápida e integrada!',
          url: currentUrl,
        });
        triggerVibrate('Compartilhamento Concluído', [35]);
      } catch (err) {
        console.warn('Share aborted:', err);
      }
    } else {
      const success = await copyToClipboard(currentUrl);
      if (success) {
        setVibrationSuccess('Link copiado! Compartilhe com quem quiser 📋');
        triggerVibrate('Sucesso de Cópia', [35]);
        setTimeout(() => setVibrationSuccess(null), 3000);
      } else {
        setVibrationSuccess('Falha ao copiar link de compartilhamento.');
        setTimeout(() => setVibrationSuccess(null), 3000);
      }
    }
  };

  // Joystick handlers
  const handleJoystickDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;
    const intensity = Math.min(1, distance / maxRadius);

    const tiltX = (dx / (maxRadius || 1)) * 30 * intensity;
    const tiltY = (dy / (maxRadius || 1)) * 30 * intensity;

    setIsUsingPhysicalSensor(false);
    setTilt({
      x: parseFloat(tiltX.toFixed(1)),
      y: parseFloat(tiltY.toFixed(1))
    });
  };

  const handleJoystickRelease = () => {
    setIsDraggingJoystick(false);
    setTilt({ x: 0, y: 0 });
  };

  // Run the premium simulated APK compilation build log flow!
  const runApkCompilerSim = () => {
    setCompilerState('running');
    setCompilerProgress(5);
    setBuildLogs(['Iniciando ambiente de compilação da JVM Gradle...', 'Criando árvore de diretórios temporários na Cloud container...']);
    
    const messages = [
      { p: 15, log: 'Encontrado manifest.json válido em /public.' },
      { p: 30, log: `Resolvendo pacote Android ID: [${packageName}]` },
      { p: 45, log: 'Processando ícones vetoriais em alta resolução (VectorDrawable a SVG)...' },
      { p: 60, log: 'Gerando keystore de debug SHA-256 para assinatura do pacote APK...' },
      { p: 75, log: 'Empacotando Trusted Web Activity (TWA) com pacote AndroidX Support...' },
      { p: 90, log: 'Compilando pacotes Gradle e otimizando código do motor ProGuard...' },
      { p: 100, log: 'Compilação concluída com sucesso! Gerado: [app-release-signed.apk]' }
    ];

    messages.forEach((m, idx) => {
      setTimeout(() => {
        setCompilerProgress(m.p);
        setBuildLogs(prev => [...prev, m.log]);
        if (m.p === 100) {
          setCompilerState('success');
        }
      }, (idx + 1) * 1100);
    });
  };

  // Intelligent Gemini AI simulation response list
  const getGeminiResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes('apk') || q.includes('baixar') || q.includes('download')) {
      return `🎉 **Você pode baixar o APK do Aura Lab diretamente agora mesmo!**

Temos duas formas rápidas para você instalar o aplicativo nativamente no seu celular Android:

### 📲 Método Instantâneo (Fazer Download Direto do APK)
1. Abra o menu de **Opções (três pontos ○○○)** no canto superior direito do cabeçalho deste aplicativo.
2. Clique no botão verde **"Baixar Arquivo APK Android"**. 
3. Ou acesse a aba lateral **"Gerador APK (Build)"** e clique no botão verde **"Baixar APK Pré-Compilado"**!
*O download do instalador \`Aura_Lab_v1.0.0.apk\` será iniciado imediatamente no seu dispositivo!*

---

### 🌟 Método Avançado: Compilar seu Próprio Pacote
Se preferir customizar o pacote identifier (\`com.aura.lab\`) e as APIs do SDK Android:
1. Vá até a aba lateral **"Gerador APK (Build)"**.
2. Customize as opções desejadas no painel esquerdo.
3. Clique em **"Gerar Pacote APK"** para compilar em tempo real com o compilador virtual.
4. Ao concluir, clique no botão **"Baixar APK do App"**!

---

### ⚡ Método de Instalação Rápida Via PWA (Sem download de arquivos)
1. No navegador do seu celular, clique na barra de ferramentas e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
2. O aplicativo será instalado como um app nativo nativo em menos de 1 segundo!`;
    }

    if (q.includes('pwa') || q.includes('progressive')) {
      return `Um **PWA (Progressive Web App)** é o formato de distribuição móvel oficial defendido pelo Google para substituir APKs em tarefas dinâmicas do dia-a-dia!

**Vantagens de rodar o Aura Lab como PWA no Android:**
- 🛡️ **Segurança Total**: Executa dentro do sandbox protegido do Chrome, sem necessidade de aceitar permissões perigosas de APKs de fontes desconhecidas.
- ⚡ **Velocidade Estelar**: Registrado no **Service Worker** e cache local. Abre instantaneamente e funciona offline.
- 📉 **Adeus Espaço Cheio**: PWAs utilizam o motor do sistema para renderização, por isso seu tamanho fica em apenas **42 Kilobytes** comparado a APKs normais que pesam 50MB.`;
    }

    if (q.includes('ajuda') || q.includes('como') || q.includes('sensor') || q.includes('giroscópio') || q.includes('vibrar')) {
      return `A integração nativa de hardware do Android funciona em nosso hub! No painel lateral ou usando o simulador, você pode testar:
1. **Feedback Vibratório (Haptic)**: Crie padrões vibratórios de palpitação ou vibração de jogos no seu telefone para simular táticas imersivas.
2. **Giroscópio / Sensor de Orientação**: Incline seu dispositivo real ou utilize o joystick simulador para movimentar nosso giroscópio de alta frequência.
3. **Estado de Bateria Nível Real**: O app lê a carga exata da bateria e se há carregador plugado utilizando a API nativa.`;
    }

    return `Entendi sua dúvida sobre o **Aura Lab**! 

Para guiar você melhor, escolha um dos atalhos rápidos ou me diga se você deseja:
- Gerar o build do arquivo **APK Android** usando ferramentas como Bubblewrap e PWABuilder.
- Aprender a ativar atalhos em tela cheia sem barras do navegador.
- Testar os sensores de **Vibração** e **Giroscópio** simulados do seu telefone Android!`;
  };

  // Submit chat message 
  const handleSendMessage = async (customText?: any) => {
    const textToSend = (typeof customText === 'string') ? customText : inputValue;
    if (!textToSend.trim() && attachedFiles.length === 0) return;

    // Preserve references to attached files to send
    const currentAttachments = [...attachedFiles];

    // Create user message tracking uploads
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend.trim() || (currentAttachments.length > 0 ? "Enviei arquivos anexados." : ""),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      images: currentAttachments.filter(f => f.type.startsWith('image/')).map(f => f.base64),
      files: currentAttachments.map(f => ({ name: f.name, size: f.size, type: f.type }))
    };

    const currentHistory = [...chatMessages, userMsg];
    setChatMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachedFiles([]); // Clear attachment strip instantly
    
    const lowerMessage = userMsg.text.toLowerCase().trim();
    
    // Robust image request detection matching server-side
    const imageWords = [
      "imagem", "imagens", "foto", "fotos", "desenho", "desenhos", "desenhar", "desenha", "desenhe",
      "ilustre", "ilustra", "ilustração", "ilustrações", "pintura", "pinturas", "pintar", "retrato", "retratos", "retratar",
      "image", "images", "photo", "photos", "draw", "drawing", "paint", "painting", "illustration", "illustrations",
      "wallpaper", "wallpapers", "avatar", "icon", "logo"
    ];
    
    const actionWords = [
      "crie", "criar", "cria", "crier", "crear", "cree", "gerar", "gera", "gerei", "geree", "produzir", "produza",
      "faça", "fazer", "faz", "fasa", "pinte", "pintar", "pinta", "desenhe", "desenhar", "desenha", "ilustre", "ilustra", "ilustrar",
      "mande", "mandar", "mostre", "mostrar", "generate", "create", "make", "draw", "paint"
    ];

    const startsWithDirectTrigger = 
      /^(desenho|desenhe|desenha|desenhar|foto|fotos|imagem|imagens|ilustração|ilustrações|ilustre|ilustra|retrato|pintura|pintar|paint|draw|create|generate|avatar|icon|logo|wallpaper)\s+(de|de um|de uma|da|do|um|uma|duma|dum|anime|fada|paisagem|\s)/i.test(lowerMessage);

    const hasImageWord = imageWords.some(w => lowerMessage.includes(w));
    const hasActionWord = actionWords.some(w => lowerMessage.includes(w));
    const startsWithAction = /^(crie|criar|cria|crier|crear|cree|gerar|gera|faça|fazer|faz|pinte|pintar|desenhe|desenhar|ilustre|ilustrar)\b/i.test(lowerMessage);

    const isImageReq = 
      startsWithDirectTrigger || 
      (hasImageWord && hasActionWord) || 
      (startsWithAction && hasImageWord) ||
      (/\b(quero|queria|gostaria|preciso|faz|fazer|gerar|desenhar|pintar)\b/i.test(lowerMessage) && hasImageWord);

    if (isImageReq) {
      setIsGeneratingImage(true);
    }
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          history: currentHistory,
          attachments: currentAttachments,
          temperature: aiTemperature,
          personality: aiPersonality
        })
      });

      let responseText = "";
      try {
        responseText = await response.text();
      } catch (readErr) {
        throw new Error(`Não foi possível ler a resposta do servidor (Status: ${response.status})`);
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`O servidor retornou uma resposta inválida (isso geralmente acontece quando o servidor está reiniciando ou sob manutenção temporária nos bastidores. Por favor, aguarde alguns segundos e tente enviar sua mensagem novamente!).\n\n*(Detalhe técnico: Status ${response.status}, resposta não-JSON)*`);
      }

      if (!response.ok) {
        throw new Error(data?.error || `Erro do servidor (Status: ${response.status})`);
      }
      
      const geminiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'gemini',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        aiGeneratedImage: data.image, // Set AI generated image target URL if available
        aiGeneratedVideo: data.video  // Set AI generated video metadata if available
      };
      setChatMessages(prev => [...prev, geminiMsg]);
      
      // Auto-speak if active
      if (autoSpeakOn) {
        toggleSpeak(geminiMsg.id, geminiMsg.text);
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      
      // Fallback response inside the chat thread so user is not left hanging
      const errorMessage = error?.message || 'Erro de conexão ou de processamento de IA.';
      const isApiKeyError = 
        errorMessage.includes("GEMINI_API_KEY") || 
        errorMessage.includes("chave de API") || 
        errorMessage.includes("API key expired") || 
        errorMessage.includes("API_KEY_INVALID") || 
        errorMessage.toLowerCase().includes("expired") || 
        errorMessage.toLowerCase().includes("invalid api key") ||
        errorMessage.toLowerCase().includes("key expired");

      const geminiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'gemini',
        text: isApiKeyError 
          ? `⚠️ **Chave de API do Gemini Expirou ou é Inválida!**\n\nA chave de API necessária para fazer a IA funcionar (` + "`" + `GEMINI_API_KEY` + "`" + `) precisa ser atualizada no seu workspace.\n\n**Como corrigir isso de forma simples:**\n\n1. No menu lateral ou no canto superior direito das configurações do Google AI Studio, clique em **Secrets (ícone de chave / secrets)**.\n2. Caso não tenha uma chave ativa, crie ou pegue uma chave válida no painel [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).\n3. Atualize ou crie um novo Secret chamado **` + "`" + `GEMINI_API_KEY` + "`" + `** com o valor da sua nova chave.\n4. Salve e recarregue a página antes de enviar uma nova mensagem!\n\n*(Detalhe do erro original: ${errorMessage})*`
          : `⚠️ **Ops! Encontrei um obstáculo para responder:** \n\n${errorMessage}\n\n*Caso o erro persista, verifique se a chave de API (GEMINI_API_KEY) foi configurada corretamente nas chaves secretas do seu workspace nas Configurações do AI Studio.*`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, geminiMsg]);
      
      // Auto-speak if active
      if (autoSpeakOn) {
        toggleSpeak(geminiMsg.id, geminiMsg.text);
      }
    } finally {
      setIsTyping(false);
      setIsGeneratingImage(false);
    }
  };

  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Helper template response helper triggers
  const sendPresetPrompt = (text: string) => {
    setInputValue(text);
  };

  // Web  // Extracted input area to easily render right under Card 3 (Consultar algo) or at the bottom of active chat
  const renderInputArea = () => {
    return (
      <div className="max-w-4xl mx-auto w-full px-2 shrink-0 relative">
        {/* POPUP CARD FOR VOICE CONFIGURATION (SINTONIZADOR DE VOZ) */}
        <AnimatePresence>
          {voiceSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute bottom-full left-2 right-2 mb-3.5 p-4 sm:p-5 rounded-[24px] border shadow-xl z-50 text-left ${
                darkMode 
                  ? 'bg-zinc-950/95 border-purple-500/20 shadow-black backdrop-blur-md' 
                  : 'bg-white/95 border-indigo-100 shadow-indigo-150/20 backdrop-blur-md'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-dashed border-zinc-700/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-tr from-[#9B51E0] to-indigo-550 rounded-xl text-white shadow-xs">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-zinc-100' : 'text-[#5e35b1]'}`}>
                      Sintonia e Voz da Aura
                    </h3>
                    <p className="text-[10px] text-zinc-400">Personalize o timbre, velocidade e motor de leitura</p>
                  </div>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setVoiceSettingsOpen(false)}
                  className={`p-1 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all ${
                    darkMode ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-805'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Settings */}
              <div className="space-y-4">
                {/* 1. AUTO SPEAK TOGGLE */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/10 border border-zinc-700/5">
                  <div className="flex flex-col text-left">
                    <span className={`text-xs font-extrabold ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>Auto-Leitura de Respostas</span>
                    <span className="text-[9px] text-zinc-400">Aura falará automaticamente ao terminar de pensar</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoSpeakOn;
                      setAutoSpeakOn(next);
                      localStorage.setItem('aura_auto_speak_on', String(next));
                      triggerVibrate('Auto speak toggle', [15]);
                    }}
                    className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer ${
                      autoSpeakOn ? 'bg-[#9B51E0]' : 'bg-zinc-350 dark:bg-zinc-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-2xs transition-all duration-200 transform ${
                      autoSpeakOn ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 2. SLIDERS FOR RATE & PITCH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pitches (TOM) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-100/5 border border-zinc-700/5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-750'}`}>Tom da Voz ({voicePitch.toFixed(1)})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-zinc-450 select-none">Grave</span>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={voicePitch}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVoicePitch(val);
                          localStorage.setItem('aura_voice_pitch', String(val));
                        }}
                        className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-750 rounded-lg appearance-none cursor-pointer accent-[#9B51E0]"
                      />
                      <span className="text-[9px] font-semibold text-zinc-450 select-none">Agudo</span>
                    </div>
                  </div>

                  {/* Speed of narration (RATE) */}
                  <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-neutral-100/5 border border-zinc-700/5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-750'}`}>Velocidade ({voiceRate.toFixed(1)}x)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-semibold text-zinc-450 select-none">Lento</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={voiceRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVoiceRate(val);
                          localStorage.setItem('aura_voice_rate', String(val));
                        }}
                        className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-750 rounded-lg appearance-none cursor-pointer accent-[#9B51E0]"
                      />
                      <span className="text-[9px] font-semibold text-zinc-450 select-none">Rápido</span>
                    </div>
                  </div>
                </div>

                {/* 3. ENGINE SELECTOR DROPDOWN */}
                <div className="flex flex-col gap-1">
                  <label className={`text-[10px] font-extrabold uppercase tracking-wide text-left ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Motor / Voz Disponível no Dispositivo
                  </label>
                  <select
                    value={selectedVoiceName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedVoiceName(val);
                      localStorage.setItem('aura_voice_name', val);
                      triggerVibrate('Voz mudada', [15]);
                    }}
                    className={`w-full py-2 px-3 text-xs font-sans rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#9B51E0] ${
                      darkMode 
                        ? 'bg-zinc-900 border-zinc-750 text-zinc-200' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <option value="">-- Voz Padrão do Sistema (pt-BR) --</option>
                    {voices.map((v, idx) => (
                      <option key={idx} value={v.name}>
                        {v.name} ({v.lang}) {v.localService ? '• Local' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. ACTIONS: TEST MODULATION */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[9px] text-zinc-400 font-medium font-sans">Sintonize os parâmetros acima para ajustar</span>
                  <button
                    type="button"
                    onClick={() => {
                      if ('speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance("Modulação e voz sintonizadas com sucesso! Tudo pronto.");
                        u.lang = 'pt-BR';
                        if (selectedVoiceName) {
                          const found = voices.find(v => v.name === selectedVoiceName);
                          if (found) u.voice = found;
                        }
                        u.rate = voiceRate;
                        u.pitch = voicePitch;
                        window.speechSynthesis.speak(u);
                        triggerVibrate('Teste voz', [25]);
                      }
                    }}
                    className="py-1.5 px-3.5 bg-gradient-to-tr from-[#9B51E0] to-indigo-600 hover:from-[#9B51E0] hover:to-indigo-505 text-white font-extrabold text-[10px] rounded-lg transition-all active:scale-95 shadow-xs cursor-pointer uppercase tracking-wider font-sans"
                  >
                    🔊 Testar Calibração
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input for manual attachments */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept="image/*,.txt,.json,.js,.css,.html,.ts,.py,.sql,.xml,.csv" 
          className="hidden" 
        />

        {/* Suggestion pills above input card */}
        {showPills && (
          <div className="flex items-center gap-2 mb-3 pb-1 overflow-x-auto no-scrollbar justify-start px-2">
            <div className={`flex items-center gap-1.5 shrink-0 border shadow-3xs rounded-full py-1.5 px-3 text-[11px] font-bold ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-indigo-300' : 'bg-white border-zinc-200 text-[#5e35b1]'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#9B51E0] animate-pulse" />
            </div>
            <button 
              type="button"
              onClick={() => {
                setInputValue("Adicionar animação de carregamento");
                triggerVibrate('Sugestão', [20]);
              }}
              className={`shrink-0 border shadow-3xs rounded-full py-1.5 px-4 text-[11px] font-medium font-sans cursor-pointer transition-all active:scale-95 flex items-center gap-1 ${
                darkMode ? 'bg-zinc-900 border-zinc-805 hover:border-zinc-700 text-zinc-350 hover:text-white hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <span>Adicionar animação de carregamento</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setInputValue("Exportar logs como json");
                triggerVibrate('Sugestão', [20]);
              }}
              className={`shrink-0 border shadow-3xs rounded-full py-1.5 px-4 text-[11px] font-medium font-sans cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                darkMode ? 'bg-zinc-900 border-zinc-805 hover:border-zinc-700 text-zinc-350 hover:text-white hover:bg-zinc-800' : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950'
              }`}
            >
              <span>Exportar logs como json</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </button>
            <button 
              type="button"
              onClick={() => setShowPills(false)}
              className={`ml-auto shrink-0 border p-1.5 rounded-full cursor-pointer transition-all ${
                darkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-450 hover:text-zinc-200' : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-400 hover:text-zinc-705'
              }`}
              title="Fechar sugestões"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Card Container */}
        <div className={`rounded-3xl p-4.5 border focus-within:ring-2 focus-within:ring-[#9B51E0]/5 flex flex-col justify-between shadow-lg transition-all duration-200 min-h-[140px] text-left ${
          darkMode ? 'bg-zinc-900 border-zinc-800 focus-within:border-indigo-500 shadow-zinc-950/40' : 'bg-white border-zinc-200/90 focus-within:border-indigo-400 shadow-zinc-200/30'
        }`}>
          
          {/* Active audio recording notice inside the prompt card */}
          {isRecording && (
            <div className={`flex items-center gap-1.5 text-xs font-sans font-semibold mb-2 animate-pulse px-3 py-1.5 rounded-xl border w-fit ${
              darkMode ? 'bg-indigo-950/40 text-indigo-300 border-indigo-900/50' : 'bg-purple-50 text-[#9B51E0] border-purple-100'
            }`}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              <span>Estou ouvindo... Fale o seu pedido para carregar!</span>
            </div>
          )}

          {/* Previews strip of attached items */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3.5 items-center">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className={`relative group shrink-0 border rounded-2xl px-3 py-2 flex items-center gap-2.5 text-xs font-sans max-w-[200px] shadow-3xs ${
                  darkMode ? 'bg-zinc-800 border-zinc-700/80 text-zinc-100' : 'bg-zinc-50 border-zinc-200/90 text-zinc-800'
                }`}>
                  {file.type.startsWith('image/') ? (
                    <img src={file.base64} alt="Pre-render" className={`w-8 h-8 object-cover rounded-lg border shrink-0 ${darkMode ? 'border-zinc-700' : 'border-zinc-200'}`} referrerPolicy="no-referrer" />
                  ) : (
                    <FileCode className="w-5 h-5 text-[#9B51E0] shrink-0" />
                  )}
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className={`truncate font-medium text-[11px] leading-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>{file.name}</span>
                    <span className="text-[9px] text-zinc-400 font-mono">{file.size}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeAttachedFile(idx)}
                    className="absolute -top-1.5 -right-1.5 bg-zinc-650 hover:bg-zinc-950 text-white rounded-full p-1 cursor-pointer shadow-3xs active:scale-95 transition-all"
                    title="Remover anexo"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea Input prompts */}
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Diga 'Crie uma imagem de fada', anexe um arquivo ou escreva aqui..."
            className={`bg-transparent font-sans focus:outline-none w-full text-xs sm:text-sm resize-none min-h-[70px] leading-relaxed ${
              darkMode ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-800 placeholder-zinc-400'
            }`}
          />

          {/* Footer Row */}
          <div className={`flex items-center justify-between mt-2 pt-2 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-100/60'}`}>
            <span className="text-[9px] text-zinc-400 font-mono">
              {inputValue.length} caracteres {attachedFiles.length > 0 && `• ${attachedFiles.length} arquivo(s)`}
            </span>

            {/* Action buttons inside the prompt box container */}
            <div className="flex items-center gap-2">
              {/* IA Voice custom configuration button */}
              <button 
                type="button"
                onClick={() => {
                  setVoiceSettingsOpen(!voiceSettingsOpen);
                  triggerVibrate('Abrir config de voz', [15]);
                }}
                className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs relative ${
                  voiceSettingsOpen 
                    ? 'bg-[#9B51E0] text-white border-[#9B51E0]' 
                    : (darkMode 
                        ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-650 text-zinc-300 hover:text-white hover:bg-zinc-750' 
                        : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-805 hover:bg-zinc-50')
                }`}
                title="Configurar Voz da IA"
              >
                <Volume2 className="w-4 h-4" />
                {autoSpeakOn && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
                )}
              </button>

              {/* Mic Icon Button toggles speech recognition */}
              <button 
                type="button"
                onClick={toggleSpeechRecognition}
                className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs ${
                  isRecording 
                    ? 'bg-red-50 text-red-650 border-red-350 hover:bg-red-100/90 animate-pulse' 
                    : (darkMode 
                        ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-650 text-zinc-300 hover:text-white hover:bg-zinc-750' 
                        : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-505 hover:text-zinc-805 hover:bg-zinc-50')
                }`}
                title={isRecording ? "Desativar escuta com microfone" : "Falar por Voz (Microfone)"}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-450' : 'text-zinc-500'}`} />
              </button>

              {/* Plus Add Icon Button triggering hidden manual upload */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs ${
                  darkMode 
                    ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-650 text-zinc-300 hover:text-white hover:bg-zinc-750' 
                    : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-505 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
                title="Anexar arquivos / imagens"
              >
                <Plus className="w-4 h-4 text-zinc-500" />
              </button>

              {/* Send Up Arrow Icon Button */}
              <button 
                type="button"
                onClick={handleSendMessage}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs ${
                  (inputValue.trim() || attachedFiles.length > 0)
                    ? (darkMode ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent' : 'bg-zinc-950 hover:bg-zinc-900 text-white border-transparent')
                    : (darkMode ? 'bg-zinc-850 text-zinc-600 border-zinc-800 cursor-not-allowed' : 'bg-zinc-50 text-zinc-350 border-zinc-200 cursor-not-allowed')
                }`}
                disabled={!inputValue.trim() && attachedFiles.length === 0}
                title="Enviar Mensagem"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
        
        {/* Small clean sub-notice details */}
        <p className="text-[10px] text-zinc-400 text-center mt-2 font-sans font-light">
          O Aura pode cometer erros. Considere verificar as instruções de build e compilação do APK.
        </p>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-zinc-100 dark' : 'bg-[#F0F4F9] text-zinc-800'} flex font-sans antialiased overflow-x-hidden selection:bg-[#9B51E0] selection:text-white transition-colors duration-300`}>
      {/* Dynamic Cinematic Entrance Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              y: -25,
              transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="fixed inset-0 z-[9999] bg-[#FAFBFD] flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden"
          >
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(155,81,224,0.1)_0%,rgba(25,181,254,0.04)_40%,transparent_70%)] pointer-events-none" />
            
            <div /> {/* Top layout spacer */}

            {/* Central Animated Logo block */}
            <div className="flex flex-col items-center gap-7 relative z-10">
              <div className="relative">
                {/* Spinning glowing background border ring */}
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                  className="absolute -inset-5 rounded-[28px] bg-gradient-to-tr from-[#9B51E0]/20 via-[#19B5FE]/20 to-[#9B51E0]/10 blur-md"
                />
                
                {/* Aura Icon capsule with spring scale-up effect */}
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 1.15, 1], opacity: 1 }}
                  transition={{ duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
                  className="w-20 h-20 bg-gradient-to-tr from-[#9B51E0] to-[#19B5FE] rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100/55 relative border border-white/40"
                >
                  <Sparkles className="w-9 h-9 text-white animate-pulse" />
                </motion.div>
              </div>

              {/* Title & Slogan with staggering slide-up */}
              <div className="text-center mt-2.5">
                <motion.h1 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
                  className="text-3.5xl font-extrabold text-zinc-800 tracking-tight"
                >
                  Aura<span className="text-[#9B51E0] font-light"> Labs</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.65, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
                  className="text-[10px] uppercase tracking-[0.2em] text-[#9B51E0] font-extrabold mt-1.5"
                >
                  Assistente de Build Inteligente
                </motion.p>
              </div>
            </div>

            {/* Bottom loader and metadata info */}
            <div className="w-full max-w-[280px] flex flex-col items-center gap-3 relative z-10 font-sans">
              {/* Progress Labels */}
              <div className="flex items-center justify-between w-full text-[11px] font-semibold text-zinc-500/90 px-0.5">
                <span>Iniciando o app...</span>
                <span className="font-mono text-[#9B51E0]">{splashProgress}%</span>
              </div>
              
              {/* Slender futuristic capsule progress line */}
              <div className="w-full h-1.5 bg-zinc-200/50 rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-[#9B51E0] to-[#19B5FE] rounded-full transition-all duration-[25ms] ease-out"
                  style={{ width: `${splashProgress}%` }}
                />
              </div>

              {/* Haptic signal status mimic */}
              <div className="text-[10px] font-medium text-zinc-400 mt-5.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ambiente Aura Inicializado</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Light elegant decorative gradient spots mimicking official Google Gemini dashboard */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_30%_-20%,rgba(155,81,224,0.08)_0%,rgba(74,114,255,0.04)_50%,transparent_100%)] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(25,181,254,0.02)_0%,transparent_70%)] pointer-events-none" />

      {/* 0. Mobile Sidebar Backdrop Overlay with smooth fade return animation */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            onTouchStart={handleSidebarTouchStart}
            onTouchMove={handleSidebarTouchMove}
            onTouchEnd={handleSidebarTouchEnd}
            className="lg:hidden fixed inset-0 z-35 bg-black/40 backdrop-blur-3xs cursor-default"
          />
        )}
      </AnimatePresence>

      {/* 1. COLLAPSIBLE SIDEBAR: Gemini Style Navigation in Clean Theme */}
      <aside 
        onTouchStart={handleSidebarTouchStart}
        onTouchMove={handleSidebarTouchMove}
        onTouchEnd={handleSidebarTouchEnd}
        className={`shrink-0 border-r ${darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200/80 bg-[#F8FAFD]'} transition-all duration-300 z-40 flex flex-col justify-between ${sidebarOpen ? 'w-[280px]' : 'w-0 -translate-x-[280px] lg:w-[68px] lg:translate-x-0'} fixed h-full lg:relative`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Heading area */}
          <div className={`h-16 flex items-center justify-between px-4 border-b ${darkMode ? 'border-zinc-800/65 bg-zinc-900 text-zinc-100' : 'border-zinc-200/50 bg-[#F8FAFD] text-zinc-800'} shrink-0`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 bg-gradient-to-tr from-[#9B51E0] to-[#19B5FE] rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              {sidebarOpen && (
                <span className={`font-extrabold tracking-tight text-sm flex items-center ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
                  Aura <span className="text-[#9B51E0] font-serif italic text-xs ml-1">apk</span>
                </span>
              )}
            </div>
            
            {/* Collapse toggle (Desktop/Mobile responsive) */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1 px-2 rounded-lg text-zinc-500 border cursor-pointer ${darkMode ? 'hover:bg-zinc-800 border-zinc-850 text-zinc-400' : 'hover:bg-zinc-200/60 border-zinc-250 text-zinc-500'}`}
            >
              {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* New Chat Icon Button */}
          <div className="p-3 shrink-0 scroll-mt-2">
            <button 
              onClick={handleNewSession}
              className={`w-full flex items-center gap-3 py-3 px-3.5 rounded-xl border transition-all text-xs font-semibold shadow-xs active:scale-98 cursor-pointer ${
                darkMode 
                  ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-800 hover:text-white' 
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <Plus className="w-4 h-4 text-[#9B51E0]" />
              {sidebarOpen && <span>Nova Consulta</span>}
            </button>
          </div>

          {/* Combined Scrollable Section for Navigation and History list */}
          <div className="flex-grow overflow-y-auto space-y-4 pb-4 select-none no-scrollbar">
            {/* Nav Items List */}
            <nav className="px-2 space-y-1">
              {/* Chat tab button */}
              <button
                onClick={() => {
                  setCurrentTab('chat');
                  playUiSound('click');
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'chat' 
                    ? (darkMode ? 'bg-zinc-800 text-indigo-300 border-l-4 border-[#9B51E0]' : 'bg-[#EAF1FB] text-indigo-700 border-l-4 border-[#9B51E0]') 
                    : (darkMode ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100' : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950')
                }`}
                title="Chat de IA com Aura"
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-[#9B51E0]" />
                {sidebarOpen && <span>Chat Inteligente</span>}
              </button>

              {/* Compiler tab button */}
              <button
                onClick={() => {
                  setCurrentTab('compiler');
                  playUiSound('click');
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'compiler' 
                    ? (darkMode ? 'bg-zinc-800 text-indigo-300 border-l-4 border-[#9B51E0]' : 'bg-[#EAF1FB] text-indigo-700 border-l-4 border-[#9B51E0]') 
                    : (darkMode ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100' : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950')
                }`}
                title="Compilador e Empacotador APK"
              >
                <Smartphone className="w-4 h-4 shrink-0 text-[#19B5FE]" />
                {sidebarOpen && <span>Compilador APK</span>}
              </button>

              {/* Gallery tab button */}
              <button
                onClick={() => {
                  setCurrentTab('gallery');
                  playUiSound('click');
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'gallery' 
                    ? (darkMode ? 'bg-zinc-800 text-indigo-300 border-l-4 border-[#9B51E0]' : 'bg-[#EAF1FB] text-indigo-700 border-l-4 border-[#9B51E0]') 
                    : (darkMode ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100' : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950')
                }`}
                title="Galeria de Imagens Geradas"
              >
                <Image className="w-4 h-4 shrink-0 text-emerald-500" />
                {sidebarOpen && <span>Galeria de Imagens</span>}
              </button>

              {/* Signals tab button */}
              <button
                onClick={() => {
                  setCurrentTab('signals');
                  playUiSound('click');
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'signals' 
                    ? (darkMode ? 'bg-zinc-800 text-indigo-300 border-l-4 border-[#9B51E0]' : 'bg-[#EAF1FB] text-indigo-700 border-l-4 border-[#9B51E0]') 
                    : (darkMode ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100' : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950')
                }`}
                title="Sensores e Diagnósticos"
              >
                <Activity className="w-4 h-4 shrink-0 text-amber-500" />
                {sidebarOpen && <span>Sensores & Sinais</span>}
              </button>
            </nav>

            {/* Scrollable Conversations list right below New Query and Intelligent Chat */}
            {sidebarOpen && (
              <div className="px-3 border-t border-zinc-800/20 pt-3">
                {/* Section Header */}
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                    darkMode ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    Histórico
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    darkMode ? 'bg-zinc-850 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500 font-mono'
                  }`}>
                    {sessions.length}
                  </span>
                </div>

                {/* Session Buttons List */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto no-scrollbar">
                  {sessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => {
                          setActiveSessionId(sess.id);
                          setCurrentTab('chat');
                          playUiSound('click');
                        }}
                        className={`group w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-medium cursor-pointer transition-all duration-150 relative ${
                          isActive
                            ? (darkMode ? 'bg-zinc-800 text-white border-l-2 border-[#9B51E0]' : 'bg-indigo-50/70 border-l-2 border-[#9B51E0] text-indigo-950')
                            : (darkMode ? 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 border-l-2 border-transparent' : 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 border-l-2 border-transparent')
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#9B51E0]' : 'text-zinc-500 group-hover:text-indigo-400'}`} />
                          <span className="truncate block font-sans text-[11px] leading-none pr-1">
                            {sess.title}
                          </span>
                        </div>
                        
                        {/* Session Delete Option */}
                        <button
                          onClick={(e) => handleDeleteSession(sess.id, e)}
                          className={`p-1.5 rounded-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-10 ${
                            darkMode 
                              ? 'hover:bg-zinc-700/60 text-red-400/90 hover:text-red-400' 
                              : 'hover:bg-red-50 text-red-500/90 hover:text-red-600'
                          }`}
                          title="Apagar conversa de forma segura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>


      </aside>

      {/* Main Container Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Workspace responsive header containing hamburger menu and state indicators */}
        <header className={`h-16 shrink-0 ${darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-[#F0F4F9]/90 border-zinc-200/50'} backdrop-blur-md px-4 flex items-center justify-between lg:px-8 z-30 sticky top-0 border-b`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-xl border shadow-xs cursor-pointer ${
                darkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-350' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}
              title="Alternar Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Quick diagnostics widget */}
          <div className="flex items-center gap-3">

            {/* Profile Avatar / Login Button in Header */}
            {currentUser ? (
              <button 
                onClick={() => setProfileMenuOpen(true)}
                className={`w-9.5 h-9.5 ${currentUser.provider === 'google' ? 'bg-indigo-50 border-indigo-250 text-indigo-700' : 'bg-[#eef4ff] border-blue-250 text-[#1877F2]'} border-2 rounded-xl flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all text-xs font-extrabold relative`}
                title={`Logado como ${currentUser.name}`}
              >
                <span>{currentUser.avatar}</span>
                <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white bg-emerald-500" />
              </button>
            ) : (
              <button 
                onClick={() => setLoginModalOpen(true)}
                className={`w-9.5 h-9.5 border rounded-xl flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-805 text-zinc-300' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-[#9B51E0]'
                }`}
                title="Entrar com Google / Facebook"
              >
                <User className="w-4 h-4 text-[#9B51E0]" />
              </button>
            )}

            {/* Options Menu Dropdown (Three Dots with Configurations & Settings) */}
            <div className="relative" ref={optionsMenuRef}>
              <button
                onClick={() => {
                  setOptionsMenuOpen(!optionsMenuOpen);
                  playUiSound('click');
                }}
                className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs flex items-center justify-center ${
                  optionsMenuOpen
                    ? 'bg-[#9B51E0] border-[#9B51E0] text-white'
                    : (darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-350 hover:bg-zinc-800' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600')
                }`}
                title="Configurações & Preferências"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {optionsMenuOpen && (
                  <>
                    {/* Dropdown Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 mt-2 w-76 border rounded-2xl shadow-xl z-50 p-4 font-sans text-left ${
                        darkMode ? 'bg-zinc-900 border-zinc-800 shadow-zinc-950/50' : 'bg-white border-zinc-200'
                      }`}
                    >
                      <div className={`flex items-center gap-2 pb-2.5 border-b mb-4 ${darkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <Settings className="w-4 h-4 text-[#9B51E0] animate-spin-slow" />
                        <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
                          Configurações Aura
                        </span>
                      </div>

                      {/* Config 1: Tamanho da Fonte */}
                      <div className="mb-4">
                        <label className="text-[10px] uppercase font-extrabold tracking-wider text-zinc-400 block mb-2">
                          Tamanho do Texto
                        </label>
                        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                          <button
                            onClick={() => {
                              setFontSize('small');
                              localStorage.setItem('aura_font_size', 'small');
                              playUiSound('click');
                              triggerVibrate('Fonte Pequena', [20]);
                            }}
                            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              fontSize === 'small'
                                ? 'bg-[#9B51E0] text-white shadow-2xs'
                                : (darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')
                            }`}
                          >
                            Pequeno
                          </button>
                          <button
                            onClick={() => {
                              setFontSize('medium');
                              localStorage.setItem('aura_font_size', 'medium');
                              playUiSound('click');
                              triggerVibrate('Fonte Média', [20]);
                            }}
                            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              fontSize === 'medium'
                                ? 'bg-[#9B51E0] text-white shadow-2xs'
                                : (darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')
                            }`}
                          >
                            Médio
                          </button>
                          <button
                            onClick={() => {
                              setFontSize('large');
                              localStorage.setItem('aura_font_size', 'large');
                              playUiSound('click');
                              triggerVibrate('Fonte Grande', [20]);
                            }}
                            className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                              fontSize === 'large'
                                ? 'bg-[#9B51E0] text-white shadow-2xs'
                                : (darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')
                            }`}
                          >
                            Grande
                          </button>
                        </div>
                      </div>

                      {/* Config 2: Modo Noturno (Tema Escuro) */}
                      <div className={`mb-3.5 flex items-center justify-between py-1.5 border-t pt-3 ${darkMode ? 'border-zinc-800' : 'border-zinc-100/70'}`}>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>Modo Escuro</span>
                          <span className="text-[9px] text-zinc-400">Tema escuro protetor ocular</span>
                        </div>
                        <button
                          onClick={() => {
                            const val = !darkMode;
                            setDarkMode(val);
                            localStorage.setItem('aura_dark_mode', String(val));
                            playUiSound('click');
                            triggerVibrate('Modo Escuro Alternado', [20]);
                          }}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer ${
                            darkMode ? 'bg-[#9B51E0]' : 'bg-zinc-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-2xs transition-all duration-200 transform ${
                            darkMode ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Config 3: Sons do App */}
                      <div className={`mb-3.5 flex items-center justify-between py-1.5 border-t pt-3 ${darkMode ? 'border-zinc-800' : 'border-zinc-100/70'}`}>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>Som do Sistema</span>
                          <span className="text-[9px] text-zinc-400 font-sans">Sons e respostas audíveis</span>
                        </div>
                        <button
                          onClick={() => {
                            const val = !soundOn;
                            setSoundOn(val);
                            localStorage.setItem('aura_sound_on', String(val));
                            if (val) {
                              setTimeout(() => playUiSound('success'), 50);
                            }
                            triggerVibrate('Som Alternado', [20]);
                          }}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer ${
                            soundOn ? 'bg-[#9B51E0]' : 'bg-zinc-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-2xs transition-all duration-200 transform ${
                            soundOn ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Config 4: Vibração háptica */}
                      <div className={`mb-4 flex items-center justify-between py-1.5 border-t pt-3 ${darkMode ? 'border-zinc-800' : 'border-zinc-100/70'}`}>
                        <div className="flex flex-col">
                          <span className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>Feedback Tátil</span>
                          <span className="text-[9px] text-zinc-400">Vibração haptica tátil</span>
                        </div>
                        <button
                          onClick={() => {
                            const val = !vibrationOn;
                            setVibrationOn(val);
                            localStorage.setItem('aura_vibration_on', String(val));
                            if (val) {
                              if ('vibrate' in navigator) navigator.vibrate([35]);
                            }
                            playUiSound('click');
                          }}
                          className={`w-11 h-6 rounded-full p-0.5 transition-all duration-200 ease-in-out cursor-pointer ${
                            vibrationOn ? 'bg-[#9B51E0]' : 'bg-zinc-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-2xs transition-all duration-200 transform ${
                            vibrationOn ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Config 5: Exportar Conversa */}
                      <div className={`mb-3.5 py-1.5 border-t pt-3 ${darkMode ? 'border-zinc-800' : 'border-zinc-100/70'}`}>
                        <div className="mb-2 flex flex-col">
                          <span className={`text-xs font-bold ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>Exportar Conversa</span>
                          <span className="text-[9px] text-zinc-400">Salvar histórico no seu dispositivo</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              handleExportChat('txt');
                              setOptionsMenuOpen(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl transition-all duration-150 font-bold text-[10px] cursor-pointer active:scale-95 ${
                              darkMode
                                ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-200 hover:text-white'
                                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                            }`}
                            title="Exportar conversa como arquivo de texto (.txt)"
                          >
                            <Download className="w-3.5 h-3.5 text-[#9B51E0]" />
                            <span>Exportar .TXT</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              handleExportChat('md');
                              setOptionsMenuOpen(false);
                            }}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xl transition-all duration-150 font-bold text-[10px] cursor-pointer active:scale-95 ${
                              darkMode
                                ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-750 text-zinc-200 hover:text-white'
                                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
                            }`}
                            title="Exportar conversa formatada em Markdown (.md)"
                          >
                            <FileCode className="w-3.5 h-3.5 text-[#9B51E0]" />
                            <span>Exportar .MD</span>
                          </button>
                        </div>
                      </div>

                      {/* Config 6: Limpar Histórico do Chat */}
                      <div className={`border-t pt-3.5 mt-2 ${darkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                        <button
                          onClick={() => {
                            cancelSpeech();
                            setChatMessages([
                              {
                                id: 'welcome',
                                sender: 'gemini',
                                text: 'Olá! Sou a **Aura**, sua assistente inteligente! O histórico anterior de mensagens foi limpo de forma segura do seu navegador. Como posso ajudar você a construir coisas incríveis agora?',
                                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              }
                            ]);
                            setOptionsMenuOpen(false);
                            playUiSound('delete');
                            // Direct feedback
                            if (vibrationOn && 'vibrate' in navigator) {
                              navigator.vibrate([60, 40]);
                            }
                            setVibrationSuccess('Histórico limpo com sucesso! 🧹');
                            setTimeout(() => setVibrationSuccess(null), 2500);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition duration-150 font-bold text-xs select-none cursor-pointer active:scale-98"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span>Limpar Conversas</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Global Floating Custom Toast Notifications (Success / Vibration feedbacks) */}
        <AnimatePresence>
          {vibrationSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-18 right-8 bg-[#121315] text-[#19B5FE] border border-indigo-500/30 shadow-2xl z-50 p-4 rounded-xl flex items-center gap-3 text-xs font-mono max-w-sm"
            >
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <span>{vibrationSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab-driven layout routing switcher content container */}
        <div className="flex-grow p-4 lg:p-10 max-w-7xl w-full mx-auto" id="workspace-main">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: GEMINI STYLE COMPANION CHAT */}
            {currentTab === 'chat' && (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col min-h-[calc(100vh-180px)] justify-between gap-4 animate-fade-in"
              >
                {chatMessages.length <= 1 ? (
                  // SCREENSHOT WELCOME SCREEN (HOMEPAGE) WITH MUCH MORE DETAIL & AMAZING COLORS
                  <div className="flex-grow py-3 flex flex-col justify-start pb-22">
                    
                    {/* Top glowing badging for Aura */}
                    <div className="flex justify-center w-full max-w-4xl mx-auto mb-4 px-2 pt-2">
                      <div 
                        className={`flex items-center gap-2 border px-6 py-2.5 rounded-full shadow-md group font-sans active:scale-95 transition-all cursor-pointer ${
                          darkMode 
                            ? 'bg-gradient-to-r from-purple-950/55 to-indigo-950/55 border-purple-500/30' 
                            : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-purple-100/40'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-[#9B51E0] animate-pulse" />
                        <span className={`text-xs font-black tracking-widest uppercase ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                          Aura Inteligência Oficial
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />
                      </div>
                    </div>
                    
                    {/* Centralized elegant welcome head with a colorful gradient background reflection */}
                    <div className="relative text-center max-w-2xl mx-auto mb-8 shrink-0 px-4">
                      {/* Ambient light glow behind title */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-[#9B51E0]/15 blur-3xl rounded-full pointer-events-none" />
                      
                      <h1 className={`text-4xl sm:text-5xl font-black tracking-tight font-sans select-none leading-tight ${
                        darkMode 
                          ? 'bg-gradient-to-r from-white via-zinc-200 to-[#19B5FE] bg-clip-text text-transparent' 
                          : 'bg-gradient-to-r from-[#1F1F1F] via-[#9B51E0] to-[#19B5FE] bg-clip-text text-transparent'
                      }`}>
                        Olá! Como posso ajudar você hoje? 👋
                      </h1>
                      <p className={`text-sm sm:text-base mt-3 font-medium font-sans max-w-sm sm:max-w-md mx-auto leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Inicie uma conversa instantânea sobre qualquer assunto com a assistente Aura.
                      </p>
                    </div>

                    {/* Three Cards Layout with Geração de Vídeo */}
                    <div className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 px-2 mb-8 shrink-0">
                      
                      {/* Card 1: Criar uma imagem */}
                      <div 
                        onClick={() => sendPresetPrompt('Me ajude a criar ou sugerir uma imagem incrível com Inteligência Artificial para meu app Android.')}
                        className={`transition-all duration-300 border rounded-[28px] p-5 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between h-42 group text-left ${
                          darkMode 
                            ? 'bg-zinc-900/70 hover:bg-purple-900/10 border-zinc-800 hover:border-purple-500/45' 
                            : 'bg-white hover:bg-purple-50/20 border-zinc-200/80 hover:border-purple-300/60 shadow-indigo-100/20'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all ${
                          darkMode ? 'bg-purple-950/40 text-purple-300' : 'bg-purple-100 text-[#9B51E0]'
                        }`}>
                          <Image className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`text-xs sm:text-sm font-black tracking-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>Geração de Imagem</h3>
                          <p className={`text-[11px] mt-1.5 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Gere imagens incríveis de alta definição usando IA</p>
                        </div>
                      </div>
                      
                      {/* Card 2: Escrever ou editar */}
                      <div 
                        onClick={() => sendPresetPrompt('Me ajude a escrever, editar ou aprimorar um código ou postagem oficial para redes sociais.')}
                        className={`transition-all duration-300 border rounded-[28px] p-5 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between h-42 group text-left ${
                          darkMode 
                            ? 'bg-zinc-900/70 hover:bg-emerald-900/10 border-zinc-800 hover:border-emerald-500/40' 
                            : 'bg-white hover:bg-emerald-50/20 border-zinc-200/80 hover:border-emerald-300/50 shadow-indigo-100/20'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-all ${
                          darkMode ? 'bg-emerald-950/40 text-emerald-300' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <PenLine className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`text-xs sm:text-sm font-black tracking-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>Redação & Código</h3>
                          <p className={`text-[11px] mt-1.5 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Crie códigos robustos do zero, revise ou refine textos acadêmicos</p>
                        </div>
                      </div>

                      {/* Card 3: Criar um vídeo */}
                      <div 
                        onClick={() => sendPresetPrompt('Crie um vídeo generativo sobre uma viagem ao espaço sideral com estrelas brilhantes e música ambiente.')}
                        className={`transition-all duration-300 border rounded-[28px] p-5 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between h-42 group text-left ${
                          darkMode 
                            ? 'bg-zinc-900/70 hover:bg-indigo-900/10 border-zinc-800 hover:border-indigo-500/40' 
                            : 'bg-white hover:bg-indigo-50/20 border-zinc-200/80 hover:border-indigo-300/50 shadow-indigo-100/20'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:rotate-3 transition-all ${
                          darkMode ? 'bg-indigo-950/40 text-indigo-300' : 'bg-indigo-100 text-[#5e35b1]'
                        }`}>
                          <Film className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`text-xs sm:text-sm font-black tracking-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>Geração de Vídeo</h3>
                          <p className={`text-[11px] mt-1.5 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-550'}`}>Gere e exporte vídeos de arte digital com áudio e legendas</p>
                        </div>
                      </div>

                    </div>

                    {/* Visual gap spacer on homepage layout since the input is now sticky at the bottom */}
                    <div className="h-4 shrink-0" />

                    {/* Suggestions Section Label */}
                    <div className="max-w-4xl mx-auto w-full text-left mb-3.5 px-2.5">
                      <div className={`flex items-center gap-1.5 ${darkMode ? 'text-indigo-300' : 'text-[#5e35b1]'}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className={`text-xs font-black uppercase tracking-widest font-sans ${darkMode ? 'text-indigo-300' : 'text-[#5e35b1]'}`}>
                          🎯 Sugestões Personalizadas
                        </span>
                      </div>
                    </div>

                    {/* Staked list rows from screenshot + Direct APK instant compiles */}
                    <div className="max-w-4xl mx-auto w-full space-y-2.5 px-2 mb-6 shrink-0">
                      
                      <div 
                        onClick={() => sendPresetPrompt('Me dê 5 ideias de conteúdo para redes sociais')}
                        className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs group ${
                          darkMode ? 'bg-zinc-900/90 hover:bg-purple-950/20 border-zinc-800 hover:border-purple-500/30' : 'bg-white hover:bg-purple-50/15 border-zinc-200/80 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <Sparkles className="w-4 h-4 text-[#19B5FE] group-hover:scale-110 transition-transform animate-pulse" />
                          <span className={`text-xs sm:text-sm font-semibold font-sans ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                            Me dê 5 ideias de conteúdo para redes sociais
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      <div 
                        onClick={() => sendPresetPrompt('Explique o conceito de inteligência artificial')}
                        className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs group ${
                          darkMode ? 'bg-zinc-900/90 hover:bg-indigo-950/20 border-zinc-800 hover:border-indigo-500/30' : 'bg-white hover:bg-indigo-50/15 border-zinc-200/80 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <BookOpen className="w-4 h-4 text-[#9B51E0] group-hover:scale-110 transition-transform" />
                          <span className={`text-xs sm:text-sm font-semibold font-sans ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                            Explique o conceito de inteligência artificial
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      <div 
                        onClick={() => sendPresetPrompt('Crie um plano de estudos semanal')}
                        className={`border rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs group ${
                          darkMode ? 'bg-zinc-900/90 hover:bg-amber-950/20 border-zinc-800 hover:border-amber-500/30' : 'bg-white hover:bg-amber-50/15 border-zinc-200/80 hover:border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span className={`text-xs sm:text-sm font-semibold font-sans ${darkMode ? 'text-zinc-200' : 'text-zinc-700'}`}>
                            Crie um plano de estudos semanal para programador Android
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                    </div>
                  </div>
                ) : (
                  // ACTIVE CONVERSATION FLOW FOR GEMINI/AURA
                  <div className={`flex-grow overflow-y-auto space-y-4 px-2 py-4 border rounded-3xl shadow-sm mb-4 max-w-4xl mx-auto w-full no-scrollbar ${
                    darkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200/60 bg-white/60'
                  }`}>
                    {/* Header bar inside active chat with file export capabilities */}
                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 mb-4 px-2.5 gap-2.5 ${
                      darkMode ? 'border-zinc-800/80 text-zinc-400' : 'border-zinc-150 text-zinc-550'
                    }`}>
                      <div className="flex items-center gap-1.5 justify-between sm:justify-start">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#9B51E0]" />
                          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                            darkMode ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            Conversa Ativa
                          </span>
                        </div>
                        <span className={`text-[9px] font-semibold font-mono border rounded-md px-1.5 py-0.5 bg-opacity-40 shrink-0 ${
                          darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        }`}>
                          {chatMessages.length !== 1 ? `${chatMessages.length} mensagens` : `1 mensagem`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-tight shrink-0 hidden md:inline">Exportar:</span>
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button
                            onClick={() => handleExportChat('txt')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-[10px] font-bold tracking-tight cursor-pointer active:scale-95 transition-all duration-150 ${
                              darkMode 
                                ? 'bg-zinc-850 border-zinc-750 text-zinc-300 hover:text-white hover:bg-zinc-800' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:text-zinc-900 shadow-3xs hover:bg-zinc-100'
                            }`}
                            title="Exportar como documento de texto simples (.txt)"
                          >
                            <Download className="w-3.5 h-3.5 text-[#9B51E0] shrink-0" />
                            <span>Exportar .TXT</span>
                          </button>
                          <button
                            onClick={() => handleExportChat('md')}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-[10px] font-bold tracking-tight cursor-pointer active:scale-95 transition-all duration-150 ${
                              darkMode 
                                ? 'bg-zinc-850 border-zinc-750 text-zinc-300 hover:text-white hover:bg-zinc-800' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:text-zinc-900 shadow-3xs hover:bg-zinc-100'
                            }`}
                            title="Exportar como formato Markdown (.md)"
                          >
                            <FileCode className="w-3.5 h-3.5 text-[#9B51E0] shrink-0" />
                            <span>Exportar .MD</span>
                          </button>
                        </div>
                      </div>
                    </div>



                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full items-start gap-4 px-2`}
                      >
                        {msg.sender === 'gemini' && (
                          <div className={`p-2 bg-gradient-to-tr from-[#9B51E0]/20 to-[#19B5FE]/20 rounded-full border shadow-sm mt-1 shrink-0 ${
                            darkMode ? 'border-indigo-900' : 'border-indigo-200'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5 text-[#9B51E0]" />
                          </div>
                        )}
                        <div 
                          onMouseDown={(e) => handleStartHold(e, msg)}
                          onMouseUp={handleEndHold}
                          onMouseLeave={handleEndHold}
                          onTouchStart={(e) => handleStartHold(e, msg)}
                          onTouchEnd={handleEndHold}
                          onTouchCancel={handleEndHold}
                          className={`shadow-sm leading-relaxed max-w-[85%] relative overflow-hidden select-none cursor-pointer transition-all ${
                            holdProgress && holdProgress.id === msg.id ? 'scale-[0.98] ring-2 ring-[#9B51E0]/30' : 'hover:ring-1 hover:ring-[#9B51E0]/25'
                          } ${
                            msg.sender === 'user' 
                              ? (darkMode ? 'bg-zinc-800 text-zinc-100 rounded-[24px] px-5 py-3.5 font-medium border border-zinc-705' : 'bg-[#E9EEF6] text-[#000000] rounded-[24px] px-5 py-3.5 font-medium')
                              : (darkMode ? 'bg-zinc-900 text-zinc-100 border-zinc-800 rounded-[28px] p-5 font-normal' : 'bg-white text-zinc-805 border border-zinc-200/80 rounded-[28px] p-5 font-light')
                          }`}
                        >
                          {/* Active Hold Countdown Visual */}
                          {holdProgress && holdProgress.id === msg.id && (
                            <div 
                              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-[#9B51E0] to-[#19B5FE] z-20 transition-all duration-75"
                              style={{ width: `${holdProgress.percent}%` }}
                            />
                          )}
                          {/* User uploads previews in chat balloon */}
                          {msg.sender === 'user' && msg.images && msg.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {msg.images.map((b64, idx) => (
                                <img 
                                  key={idx} 
                                  src={b64} 
                                  alt="Upload" 
                                  className="w-20 h-20 object-cover rounded-xl border border-zinc-300 shadow-sm"
                                  referrerPolicy="no-referrer"
                                />
                              ))}
                            </div>
                          )}

                          {msg.sender === 'user' && msg.files && msg.files.length > 0 && (
                            <div className="flex flex-col gap-1.5 mb-2.5">
                              {msg.files.map((file, idx) => (
                                <div key={idx} className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs max-w-sm ${
                                  darkMode ? 'bg-zinc-950/80 border-zinc-800 text-zinc-300' : 'bg-zinc-100/80 border-zinc-200 text-zinc-650'
                                }`}>
                                  <FileCode className="w-4 h-4 text-[#9B51E0]" />
                                  <span className="truncate font-mono font-medium max-w-[150px]">{file.name}</span>
                                  <span className="text-[10px] text-zinc-400">({file.size})</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Message core text content */}
                           {msg.text && msg.text.trim() !== "" && (
                             <div className={`space-y-3 font-sans ${
                               fontSize === 'small' 
                                 ? 'text-[11px] sm:text-xs' 
                                 : fontSize === 'large' 
                                   ? 'text-sm sm:text-base' 
                                   : 'text-xs sm:text-sm'
                             }`}>
                               {renderMessageContent(msg.text)}
                             </div>
                           )}

                          {/* AI Generated Image block frame */}
                          {msg.aiGeneratedImage && (
                            <div className={`${msg.text && msg.text.trim() !== "" ? 'mt-4' : 'mt-0'} border border-zinc-200/90 rounded-2xl overflow-hidden bg-zinc-50 relative group shadow-sm max-w-lg`}>
                              <img 
                                src={msg.aiGeneratedImage} 
                                alt="Desenho gerado por IA" 
                                className="w-full h-auto object-cover max-h-[380px] hover:scale-[1.01] transition duration-300 cursor-zoom-in"
                                onClick={() => setPreviewImageUrl(msg.aiGeneratedImage || null)}
                                referrerPolicy="no-referrer"
                              />
                              <div className="p-3 bg-white border-t border-zinc-100/80 flex items-center justify-between gap-1.5 flex-wrap">
                                <span className="text-[10px] text-[#9B51E0] font-bold tracking-wider uppercase font-mono flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-[#9B51E0] animate-pulse" />
                                  <span>Ilustração da Aura</span>
                                </span>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = msg.aiGeneratedImage!;
                                    link.download = `Desenho_Aura_Lab_${Date.now()}.png`;
                                    link.target = "_blank";
                                    link.click();
                                  }}
                                  className="px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-900 rounded-xl text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Baixar</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* AI Generated Video block frame */}
                          {msg.aiGeneratedVideo && (
                            <AuraVideoPlayer 
                              prompt={msg.aiGeneratedVideo.prompt}
                              videoType={msg.aiGeneratedVideo.videoType}
                              musicStyle={msg.aiGeneratedVideo.musicStyle}
                              captionTexts={msg.aiGeneratedVideo.captionTexts}
                              darkMode={darkMode}
                            />
                          )}

                          {/* Aura speak option row */}
                          {msg.sender === 'gemini' && (
                            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-zinc-100/80 justify-between text-[11px]">
                              <button 
                                onClick={() => toggleSpeak(msg.id, msg.text)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all cursor-pointer active:scale-95 ${
                                  speakingMsgId === msg.id 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' 
                                    : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
                                }`}
                                title={speakingMsgId === msg.id ? "Parar leitura" : "Ouvir assistente"}
                              >
                                <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === msg.id ? 'text-amber-600 animate-bounce' : 'text-zinc-500'}`} />
                                <span className="font-sans uppercase tracking-wider">{speakingMsgId === msg.id ? "Parar Áudio" : "Ouvir Aura"}</span>
                              </button>
                              <span className="block text-[8.5px] text-zinc-400 font-mono self-center mt-0.5">{msg.timestamp}</span>
                            </div>
                          )}

                          {msg.sender === 'user' && (
                            <span className="block text-[8px] text-zinc-400 font-mono mt-2 text-right">{msg.timestamp}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Chat engine Typing indication */}
                    {isTyping && (
                      <div className="flex justify-start w-full items-start gap-4 px-2">
                        {isGeneratingImage ? (
                          <div className="bg-[#f5f5f5] text-zinc-800 rounded-[32px] p-8 border border-zinc-200/50 shadow-xs max-w-sm w-full font-light aspect-square flex flex-col justify-between">
                            <span className="text-zinc-650 font-sans font-medium text-[15px] sm:text-[17px] leading-none select-none tracking-tight">Criando imagem</span>
                            <div className="flex-grow flex items-center justify-center pt-2">
                              <div 
                                className="gap-[3px] sm:gap-[4px] select-none scale-100 sm:scale-105"
                                style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: 'repeat(13, minmax(0, 1fr))'
                                }}
                              >
                                {Array.from({ length: 13 }).map((_, r) => (
                                  Array.from({ length: 13 }).map((_, c) => {
                                    const cx = 6;
                                    const cy = 6;
                                    const d = Math.sqrt(Math.pow(c - cx, 2) + Math.pow(r - cy, 2));
                                    const opacity = Math.max(0, 0.7 - (d / 6.5));
                                    return (
                                      <span 
                                        key={`${r}-${c}`} 
                                        className="w-1 h-1 sm:w-1.2 sm:h-1.2 rounded-full bg-zinc-400 inline-block transition-all duration-700 ease-in-out animate-pulse"
                                        style={{ 
                                          opacity: opacity,
                                          animationDelay: `${d * 100}ms`
                                        }}
                                      />
                                    );
                                  })
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="p-2 bg-gradient-to-tr from-[#9B51E0]/20 to-[#19B5FE]/20 rounded-full border border-indigo-105 mt-1">
                              <Sparkles className="w-3.5 h-3.5 text-[#9B51E0] animate-spin" />
                            </div>
                            <div className={`${
                              darkMode 
                                ? 'bg-zinc-950/80 border-purple-500/20 shadow-black text-zinc-300' 
                                : 'bg-white border-zinc-200/80 shadow-sm text-zinc-600'
                            } rounded-[24px] p-4.5 border flex flex-col gap-2.5 max-w-sm w-full transition-all`}>
                              {/* Header row of the synthesizing action */}
                              <div className="flex items-center gap-1.5 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#9B51E0] font-sans">
                                  Digitando resposta...
                                </span>
                              </div>

                              {/* Simulated typing flow with physical flickering columns */}
                              <div className="flex items-center gap-2">
                                {/* Floating glowing indicators of varying widths with custom random arrays of opacities for organic flicker */}
                                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                  <motion.div 
                                    animate={{ opacity: [0.3, 1, 0.4, 0.9, 0.2, 1, 0.5, 0.8] }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    className="h-1.5 w-8 rounded-full bg-indigo-500/30 dark:bg-indigo-400/20"
                                  />
                                  <motion.div 
                                    animate={{ opacity: [0.8, 0.2, 1, 0.3, 0.9, 0.1, 0.7, 1] }}
                                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                                    className="h-1.5 w-14 rounded-full bg-[#9B51E0]/30 dark:bg-[#9B51E0]/20"
                                  />
                                  <motion.div 
                                    animate={{ opacity: [0.2, 0.9, 0.4, 0.8, 0.3, 1, 0.6, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="h-1.5 w-10 rounded-full bg-cyan-500/30 dark:bg-cyan-400/20"
                                  />
                                  <motion.div 
                                    animate={{ opacity: [0.9, 0.4, 0.8, 0.2, 1, 0.5, 0.9, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                                    className="h-1.5 w-6 rounded-full bg-[#19B5FE]/30 dark:bg-[#19B5FE]/20"
                                  />
                                </div>

                                {/* Glowing text cursor terminal simulation */}
                                <motion.div
                                  animate={{ 
                                    opacity: [1, 0, 1, 1, 0, 1, 0.2, 1, 0.1, 1],
                                    scaleY: [1, 0.95, 1, 1, 0.95, 1]
                                  }}
                                  transition={{ 
                                    repeat: Infinity, 
                                    duration: 1.0, 
                                    ease: "linear"
                                  }}
                                  className="w-1.5 h-3.5 bg-[#9B51E0] rounded-xs shadow-[0_0_8px_rgba(155,81,224,0.6)]"
                                />
                              </div>

                              <span className="text-[9px] text-zinc-400 font-mono tracking-tight select-none">
                                Aura está formulando novos insights...
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Always-visible question bar located perfectly at the bottom of the layout, sticky to follow screens! */}
                <div className="sticky bottom-0 z-30 w-full pt-3 pb-4 shrink-0 bg-gradient-to-t from-[#F0F4F9] via-[#F0F4F9]/98 to-transparent dark:from-zinc-950 dark:via-zinc-950/98 dark:to-transparent">
                  {renderInputArea()}
                </div>

              </motion.div>
            )}

            {/* TAB 4: IA GENERATED IMAGE GALLERY */}
            {currentTab === 'gallery' && (
              <motion.div 
                key="gallery-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col min-h-[calc(100vh-180px)] gap-6"
              >
                {/* Header and description */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 pb-5 text-left">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                      <Image className="w-5 sm:w-6 h-5 sm:h-6 text-[#9B51E0]" />
                      <span>Galeria de Imagens de IA</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 font-light mt-1">
                      Todas as fotos, desenhos e imagens fantásticas geradas pela Aura nesta sessão estão reunidas aqui em alta definição.
                    </p>
                  </div>
                  
                  {/* Action if images exist */}
                  {chatMessages.filter(msg => msg.aiGeneratedImage).length > 0 && (
                    <button 
                      onClick={() => {
                        setCurrentTab('chat');
                        setInputValue('Crie uma imagem de fada na floresta');
                        triggerVibrate('Sugestão', [20]);
                      }}
                      className="px-4 py-2 bg-[#9B51E0] hover:bg-[#8e44ad] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Gerar Nova Imagem</span>
                    </button>
                  )}
                </div>

                {/* Grid list or empty state */}
                {chatMessages.filter(msg => msg.aiGeneratedImage).length === 0 ? (
                  <div className="flex-grow py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-[#9B51E0] mb-4 border border-purple-100 shadow-sm">
                      <Image className="w-8 h-8 animate-pulse text-[#9B51E0]" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-800">Sua galeria está vazia</h3>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed mt-2 px-4">
                      Você ainda não gerou imagens nesta sessão. Peça agora para a Aura criar ilustrações digitais pelo chat!
                    </p>
                    
                    {/* Suggestion prompt presets */}
                    <div className="mt-8 w-full space-y-2 px-4">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono block text-left mb-1">Toque para experimentar:</span>
                      <button 
                        onClick={() => {
                          setCurrentTab('chat');
                          setInputValue('Crie uma imagem de fada na floresta com asas brilhantes, estilo anime fantasiado, 4k');
                          triggerVibrate('Sugestão', [20]);
                        }}
                        className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-medium text-zinc-700 text-left hover:text-zinc-950 hover:border-zinc-[#9B51E0] transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="truncate pr-4">Fada na floresta brilhante</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      </button>
                      
                      <button 
                        onClick={() => {
                          setCurrentTab('chat');
                          setInputValue('Desenhe uma logo de robô futurista minimalista azul com luzes neon, vetorizado');
                          triggerVibrate('Sugestão', [20]);
                        }}
                        className="w-full bg-white hover:bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-medium text-zinc-700 text-left hover:text-zinc-950 hover:border-zinc-[#19B5FE] transition cursor-pointer flex items-center justify-between"
                      >
                        <span className="truncate pr-4">Logo de robô futurista minimalista</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {chatMessages
                      .filter(msg => msg.aiGeneratedImage)
                      .map((msg, index) => (
                        <div 
                          key={msg.id || index}
                          className="bg-white border border-zinc-200/90 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
                        >
                          {/* Image preview frame */}
                          <div className="relative aspect-square overflow-hidden bg-zinc-50 cursor-pointer" onClick={() => setPreviewImageUrl(msg.aiGeneratedImage || null)}>
                            <img 
                              src={msg.aiGeneratedImage} 
                              alt="Foto gerada por IA" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 select-none"
                              referrerPolicy="no-referrer"
                            />
                            {/* Hover info overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <span className="text-white text-xs bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-md">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                                Ampliar Imagem
                              </span>
                            </div>
                          </div>
                          
                          {/* Details area */}
                          <div className="p-4 flex-grow flex flex-col justify-between text-left gap-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-zinc-400 font-mono">{msg.timestamp || 'Hoje'}</span>
                                <span className="text-[10px] text-[#9B51E0] font-bold font-mono uppercase tracking-wider">Aura Paint</span>
                              </div>
                              <p className="text-xs text-zinc-700 line-clamp-3 font-sans font-light leading-relaxed">
                                {msg.text || "Ilustração gerada a pedido do usuário."}
                              </p>
                            </div>

                            {/* Actions panel */}
                            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                              <button 
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = msg.aiGeneratedImage!;
                                  link.download = `Desenho_Aura_${Date.now()}.png`;
                                  link.target = "_blank";
                                  link.click();
                                }}
                                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[10px] sm:text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                              >
                                <Download className="w-3 h-3 text-zinc-700" />
                                <span>Baixar</span>
                              </button>
                              
                              <button 
                                onClick={() => {
                                  setCurrentTab('chat');
                                }}
                                className="px-3.5 py-2 border border-[#EAF1FB] bg-indigo-50/50 hover:bg-indigo-50 text-[#9B51E0] rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wide cursor-pointer transition active:scale-95"
                                title="Visualizar este momento no Chat"
                              >
                                Ver Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: GORGEOUS INTERACTIVE APK COMPILER (TRUSTED WEB ACTIVITY COMPILER) */}
            {currentTab === 'compiler' && (
              <motion.div 
                key="compiler-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8 max-w-7xl mx-auto w-full px-2"
              >
                {/* Main grid containing TWA configs and terminal logs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Compiler Configuration Side Panel (cols-5) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Terminal className="w-32 h-32 text-[#9B51E0]" />
                    </div>
                    
                    <span className="text-[10px] tracking-[0.25em] font-extrabold text-[#9B51E0] uppercase mb-1.5 block">Configurador TWA</span>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">Compilar PWA para APK</h3>
                    <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-6">
                      Customize os parâmetros do seu pacote Android para empacotamento com o SDK do Google Chrome.
                    </p>

                    <div className="space-y-4">
                      {/* URL de Origem Web (Public Share Link of the App) */}
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">URL de Origem Web (Link Público do App)</label>
                        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 ${darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                          <span className={`text-xs font-mono truncate select-all flex-grow ${darkMode ? 'text-zinc-350' : 'text-zinc-650'}`}>
                            {currentUrl || 'https://ais-pre-d7blaoqwhazogom45sihfh-301650964080.us-east5.run.app'}
                          </span>
                          <button
                            onClick={handleNativeShare}
                            className="p-2 bg-[#9B51E0]/10 hover:bg-[#9B51E0]/20 text-[#9B51E0] rounded-xl transition-all cursor-pointer active:scale-95 shrink-0 flex items-center justify-center border-none"
                            title="Copiar ou compartilhar link do app"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-light mt-1.5 leading-normal">
                          Este é o seu link público de compartilhamento. Use este endereço para testar no seu celular ou como origem para ferramentas de empacotamento Android.
                        </p>
                      </div>

                      {/* Package Name identifier Input */}
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Android Package ID (ID do Aplicativo)</label>
                        <input 
                          type="text" 
                          value={packageName}
                          onChange={(e) => setPackageName(e.target.value)}
                          className="w-full bg-zinc-50 text-zinc-800 rounded-xl border border-zinc-200 focus:border-[#9B51E0]/60 p-3 h-11 text-xs font-mono outline-none"
                          placeholder="Ex: com.meuapp.android"
                        />
                      </div>

                      {/* Version identifier code */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Versão do App</label>
                          <input 
                            type="text" 
                            value={appVersion}
                            onChange={(e) => setAppVersion(e.target.value)}
                            className="w-full bg-zinc-50 text-zinc-800 rounded-xl border border-zinc-200 focus:border-[#9B51E0]/60 p-3 h-11 text-xs font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Ambiente Mínimo</label>
                          <select 
                            value={androidSdkMin}
                            onChange={(e) => setAndroidSdkMin(e.target.value)}
                            className="w-full bg-zinc-50 text-zinc-850 rounded-xl border border-zinc-200 focus:border-[#9B51E0]/60 px-2.5 h-11 text-xs font-sans outline-none font-bold"
                          >
                            <option>Android 7.0 (API 24)</option>
                            <option>Android 8.0 (API 26)</option>
                            <option>Android 10.0 (API 29)</option>
                            <option>Android 13.0 (API 33)</option>
                          </select>
                        </div>
                      </div>

                      {/* Trigger Actions */}
                      <button 
                        onClick={runApkCompilerSim}
                        disabled={compilerState === 'running'}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#9B51E0] to-[#19B5FE] hover:brightness-105 text-white py-3.5 rounded-xl font-bold text-xs uppercase cursor-pointer select-none transition-all disabled:opacity-50 border-none"
                      >
                        {compilerState === 'running' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Compilando...</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="w-4 h-4" />
                            <span>Gerar Pacote APK</span>
                          </>
                        )}
                      </button>

                      <div className="pt-4 border-t border-zinc-200 mt-4 flex flex-col gap-2">
                        <span className="text-[9.5px] font-extrabold uppercase text-zinc-400 tracking-wider">Atalho de Download Direto</span>
                        <button
                          onClick={triggerApkDownload}
                          className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white py-3.5 rounded-xl font-bold text-xs uppercase cursor-pointer select-none transition-all active:scale-95 shadow-2xs border-none"
                          title="Baixar Instalador APK Diretamente"
                        >
                          <Download className="w-4 h-4 text-white" />
                          <span>Baixar APK do Aplicativo</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Real-time Compiler Console Build Logs Panel (cols-7) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs flex flex-col h-full min-h-[440px]">
                    <div className="flex items-center justify-between border-b border-zinc-150 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="text-xs font-mono text-[#5e35b1] ml-2 uppercase font-extrabold tracking-wider">Gradle Build Terminal</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">STATUS: {compilerState.toUpperCase()}</span>
                    </div>

                    {/* Compile Progress Bar indicator */}
                    {compilerState !== 'idle' && (
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-4 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#9B51E0] to-[#19B5FE] transition-all duration-350" 
                          style={{ width: `${compilerProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Console logging print items */}
                    <div className="flex-grow bg-[#0A0D14] p-4 rounded-2xl border border-zinc-950 text-zinc-300 font-mono text-xs space-y-2.5 overflow-y-auto max-h-[350px] scrollbar-thin font-light">
                      {buildLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16 text-zinc-650 font-light gap-2.5">
                          <Terminal className="w-8 h-8 text-zinc-700" />
                          <p className="max-w-xs text-xs font-mono text-zinc-500">Aguardando início do compilador. Clique em "Gerar Pacote APK" para rodar o build.</p>
                        </div>
                      ) : (
                        buildLogs.map((log, lIdx) => (
                          <div key={lIdx} className="flex items-start gap-2 text-zinc-300 leading-relaxed font-light">
                            <span className="text-zinc-650 select-none">[{lIdx + 1}]</span>
                            <span className="text-emerald-400 font-bold shrink-0">➜</span>
                            <p className="flex-1 break-all select-all">{log}</p>
                          </div>
                        ))
                      )}

                      {compilerState === 'running' && (
                        <div className="flex items-center gap-1.5 text-zinc-500 italic pl-6 pt-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Compilando pacotes e estruturando classes dex...</span>
                        </div>
                      )}
                    </div>

                    {/* Success options panel */}
                    {compilerState === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-gradient-to-br from-[#10B981]/5 via-zinc-500/5 to-white rounded-3xl border border-emerald-150 mt-4 flex flex-col gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full mt-0.5" id="compiler-success-icon-container">
                            <CheckCircle2 className="w-5 h-5 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider font-sans">Compilação Concluída com Sucesso!</h4>
                            <p className="text-xs text-zinc-650 font-sans mt-0.5">
                              O pacote de instalação do aplicativo <span className="font-bold text-zinc-800">Aura_Lab_v{appVersion || '1.0.0'}.apk</span> foi gerado. Clique no botão abaixo para iniciar o download do arquivo de forma instantânea.
                            </p>
                          </div>
                        </div>

                        <div className="w-full" id="compiler-success-actions-grid">
                          <button
                            id="btn-compiler-success-download"
                            onClick={triggerApkDownload}
                            className="w-full flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase cursor-pointer select-none transition-all active:scale-95 shadow-2xs border-none"
                            title="Fazer download do arquivo do aplicativo instalador APK"
                          >
                            <Download className="w-4 h-4 text-white" />
                            <span>Baixar APK do Aplicativo</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                </div>

                {/* TUTORIAL: COMO TRANSFORMAR SEU WEB APP EM UM APK REAL */}
                <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'} shadow-2xs`}>
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="p-2.5 bg-[#9B51E0]/15 text-[#9B51E0] rounded-2xl flex items-center justify-center">
                      <Smartphone className="w-5 h-5 animate-pulse text-[#9B51E0]" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold dark:text-zinc-100">Guia: Como criar um APK real do seu Web App</h3>
                      <p className="text-xs text-zinc-400 font-light mt-0.5">Existem excelentes caminhos profissionais e práticos para transformar o aplicativo Aura Web em um instalador Android (.apk).</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Método 1: Bubblewrap CLI */}
                    <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-zinc-50 border-zinc-150 text-zinc-700'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-3.5">
                          <span className="text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-700 dark:bg-zinc-800 dark:text-indigo-400 px-2.5 py-1 rounded">Método 1</span>
                          <span className="text-[11px] font-bold font-mono">Google Bubblewrap (TWA)</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-4">
                          O método oficial do Google. Ele utiliza o conceito de **Trusted Web Activity (TWA)** para empacotar o site em um APK nativo otimizado, ideal para distribuição na Google Play Store.
                        </p>
                        <ul className="text-[11px] space-y-2 text-zinc-500 list-disc list-inside">
                          <li>Excelente desempenho do Chrome nativo</li>
                          <li>Suporta Push Notifications e Cookies</li>
                          <li>Perfeito para publicação direta na Play Store</li>
                        </ul>
                      </div>
                      <div className="mt-5 pt-3 border-t border-zinc-200/55 dark:border-zinc-800/60">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 font-mono">Comandos CLI:</span>
                        <code className="text-[10px] block p-2 bg-zinc-950 text-emerald-400 rounded-lg font-mono overflow-x-auto select-all leading-normal">
                          npm i -g @bubblewrap/cli<br />
                          bubblewrap init --manifest={currentUrl || 'https://ais-pre-d7blaoqwhazogom45sihfh-301650964080.us-east5.run.app/'}manifest.json
                        </code>
                      </div>
                    </div>

                    {/* Método 2: Capacitor JS */}
                    <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-zinc-50 border-zinc-150 text-zinc-700'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-3.5">
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400 px-2.5 py-1 rounded">Método 2</span>
                          <span className="text-[11px] font-bold font-mono">Capacitor JS / Ionic</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-4">
                          O framework híbrido moderno. Permite encapsular qualquer web app SPA de maneira que ele rode nativamente no Android através de uma WebView local de alta performance.
                        </p>
                        <ul className="text-[11px] space-y-2 text-zinc-500 list-disc list-inside">
                          <li>Acesso total a APIs de câmera, sensores e arquivos</li>
                          <li>Gera projeto nativo no Android Studio com facilidade</li>
                          <li>Ideal para expandir com funcionalidades em Java/Kotlin</li>
                        </ul>
                      </div>
                      <div className="mt-5 pt-3 border-t border-zinc-200/55 dark:border-zinc-800/60">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 font-mono">Comandos CLI:</span>
                        <code className="text-[10px] block p-2 bg-zinc-950 text-emerald-400 rounded-lg font-mono overflow-x-auto select-all leading-normal">
                          npm i @capacitor/core @capacitor/cli<br />
                          npx cap init Aura com.aura.lab<br />
                          npx cap add android
                        </code>
                      </div>
                    </div>

                    {/* Método 3: WebView Online Rápida */}
                    <div className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-zinc-50 border-zinc-150 text-zinc-700'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-3.5">
                          <span className="text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 dark:bg-zinc-800 dark:text-amber-400 px-2.5 py-1 rounded">Método 3</span>
                          <span className="text-[11px] font-bold font-mono">Compiladores Web Online</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-4">
                          Serviços online que pegam o link e empacotam na hora. Você só cola o link público, faz as configurações básicas, gera o instalador .apk instantâneo e faz o download.
                        </p>
                        <ul className="text-[11px] space-y-2 text-zinc-500 list-disc list-inside">
                          <li>Não necessita de nenhuma linha de comando</li>
                          <li>Gera o APK e envia via e-mail ou download direto</li>
                          <li>Fácil, prático e ideal para testes rápidos</li>
                        </ul>
                      </div>
                      <div className="mt-5 pt-3 border-t border-zinc-200/55 dark:border-zinc-800/60 flex flex-col gap-1.5 justify-end">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">Link Útil Recomendado:</span>
                        <a 
                          href="https://www.webintoapp.com/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center justify-between text-xs font-bold text-[#9B51E0] hover:underline"
                        >
                          <span>Visitar WebIntoApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] text-zinc-400 font-light leading-normal">
                          Cole o link público acima no campo correspondente para empacotar o app em segundos online!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: SENSORS AND SENSOR BRIDGE SIGNALS VISUALIZER (COMPANION PHONE) */}
            {currentTab === 'signals' && (
              <motion.div 
                key="signals-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
              >
                
                {/* Visual smartphone device shell (cols-5) */}
                <div className="md:col-span-5 flex flex-col items-center">
                  {/* Minimalist device chassis */}
                  <div className="relative w-full max-w-[280px] bg-[#1A1C1E] aspect-[9/18.5] rounded-[44px] border-[6px] border-[#2A2C2E] shadow-2xl overflow-hidden flex flex-col ring-4 ring-black/40">
                    
                    {/* Camera notch cutout */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#2A2C2E] rounded-full z-20 flex items-center justify-between px-3.5 py-1">
                      <div className="w-1.5 h-1.5 bg-[#0A0B0D] rounded-full flex items-center justify-center">
                        <div className="w-0.5 h-0.5 bg-[#19B5FE] rounded-full" />
                      </div>
                      <div className="w-1.5 h-1.5 bg-[#0a0b0d] rounded-full" />
                    </div>

                    {/* Inner Mock Screen */}
                    <div className="flex-grow flex flex-col bg-[#0A0B0D] p-4 pt-10 text-[#ECECEC] overflow-y-auto relative no-scrollbar select-none">
                      
                      {/* Simulated Status Bar info */}
                      <div className="absolute top-1 left-0 right-0 px-5 flex items-center justify-between z-20 text-[8px] text-[#A1A1A1] font-semibold font-mono">
                        <span>16:05</span>
                        <div className="flex items-center gap-1">
                          <Signal className="w-2.5 h-2.5 text-[#3DDC84]" />
                          <Battery className="w-2.5 h-2.5 text-[#3DDC84]" />
                        </div>
                      </div>

                      {/* Spark logo centered */}
                      <div className="flex flex-col items-center text-center mt-3 mb-5">
                        <div className="p-3 bg-gradient-to-tr from-[#9B51E0]/20 to-[#19B5FE]/20 rounded-2xl flex items-center justify-center border border-indigo-500/10">
                          <Sparkles className="w-6 h-6 text-[#19B5FE] animate-pulse" />
                        </div>
                        <h4 className="text-[11px] font-bold text-white mt-1.5 uppercase tracking-widest font-mono">Aura Diagnostic</h4>
                        <span className="text-[8px] text-zinc-500 font-mono tracking-wider">SENSOR BRIDGE ACTIVE</span>
                      </div>

                      {/* Stack internal mobile stats list */}
                      <div className="space-y-3.5">
                        {/* 1. Haptic engine mock block */}
                        <div className="bg-[#121315]/90 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                          <span className="text-[8px] text-[#19B5FE] font-mono tracking-wider uppercase font-bold">Vibration Bus</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button 
                              onClick={() => triggerVibrate('Pulso Pequeno', [40])}
                              className="text-[8px] font-bold uppercase py-1.5 px-0.5 bg-[#0A0B0D] border border-white/5 hover:border-indigo-500/40 rounded text-[#A1A1A1]"
                            >
                              Curto (40ms)
                            </button>
                            <button 
                              onClick={() => triggerVibrate('Coração Batendo', [100, 30, 100])}
                              className="text-[8px] font-bold uppercase py-1.5 px-0.5 bg-[#0A0B0D] border border-white/5 hover:border-indigo-500/40 rounded text-[#A1A1A1]"
                            >
                              Gamer 💓
                            </button>
                          </div>
                        </div>

                        {/* 2. Horizontal Leveller bubble visualizer */}
                        <div className="bg-[#121315]/90 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                          <span className="text-[8px] text-[#3DDC84] font-mono tracking-wider uppercase font-bold">Giroscópio</span>
                          
                          <div className="h-14 bg-[#0A0B0D] rounded-lg border border-white/5 flex items-center justify-center relative overflow-hidden">
                            <motion.div 
                              animate={{ 
                                x: tilt.x * 1.5, 
                                y: tilt.y * 1.5 
                              }}
                              className="w-6 h-6 bg-gradient-to-r from-[#9B51E0] to-[#19B5FE] rounded-full shadow-lg flex items-center justify-center z-10"
                            >
                              <div className="w-2 h-2 bg-white/40 rounded-full" />
                            </motion.div>
                          </div>
                        </div>

                        {/* 3. Simulated battery inside hardware model */}
                        <div className="bg-[#121315]/90 p-3 rounded-xl border border-white/5 flex items-center justify-between text-[9px] text-zinc-400 font-mono">
                          <span>Battery status:</span>
                          <span className="text-[#3DDC84]">{batteryLevel !== null ? `${batteryLevel}%` : '88% (OK)'}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Sensors details list parameters console block (cols-7) */}
                <div className="md:col-span-7 flex flex-col gap-6">
                  <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs">
                    <span className="text-[10px] tracking-[0.2em] font-extrabold text-[#9B51E0] uppercase mb-1.5 block">Sinalizadores Web</span>
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">Android Sensors Playground</h3>
                    <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-6">
                      Veja o acelerômetro, bateria e motor de toque do seu dispositivo Android respondendo em tempo real através da nossa ponte nativa.
                    </p>

                    <div className="space-y-4">
                      {/* Gyro Scope Tilt joystick mouse driver */}
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-800">Simulador de Giroscópio por Mouse</label>
                          <span className="text-[9px] font-mono text-zinc-500">UTILIZAR SE EM DESKTOP 🖱️</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed font-normal mb-1">
                          Caso esteja em um computador de mesa, clique e deslize o mouse no painel abaixo para rotacionar o giroscópio virtual. No celular, o giroscópio físico assumirá automaticamente!
                        </p>

                        <div 
                          ref={joystickRef}
                          onMouseDown={() => setIsDraggingJoystick(true)}
                          onMouseMove={(e) => isDraggingJoystick && handleJoystickDrag(e)}
                          onMouseUp={handleJoystickRelease}
                          onMouseLeave={handleJoystickRelease}
                          onTouchStart={() => setIsDraggingJoystick(true)}
                          onTouchMove={(e) => isDraggingJoystick && handleJoystickDrag(e)}
                          onTouchEnd={handleJoystickRelease}
                          className="h-16 bg-white border border-zinc-200 hover:border-[#19B5FE]/20 rounded-xl flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none"
                        >
                          <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest pointer-events-none">
                            ARRANQUE E ARRASTE O MOUSE AQUI 🕹️
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-zinc-600 mt-1">
                          <div className="bg-white p-2 rounded-lg border border-zinc-200 text-center font-bold">
                            Shift Eixo-X: <span className="text-zinc-900 font-bold">{tilt.x}°</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-zinc-200 text-center font-bold">
                            Shift Eixo-Y: <span className="text-zinc-900 font-bold">{tilt.y}°</span>
                          </div>
                        </div>
                      </div>

                      {/* Vibration diagnostic section */}
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-800">Vibration Motor Diagnostic</label>
                        <p className="text-xs text-zinc-500 leading-relaxed font-normal">
                          Triggers native haptic feedback patterns. Recommended to test on real Google Chrome / Opera on Android.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                          <button 
                            onClick={() => triggerVibrate('Clique Curto', [50])}
                            className="bg-white hover:bg-zinc-100/70 text-[#9B51E0] border border-zinc-200 hover:border-zinc-300 text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center font-bold"
                          >
                            Toque Leve
                          </button>
                          <button 
                            onClick={() => triggerVibrate('Alerta duplo', [100, 50, 120])}
                            className="bg-white hover:bg-zinc-100/70 text-[#9B51E0] border border-zinc-200 hover:border-zinc-300 text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center font-bold"
                          >
                            Pulsação 💓
                          </button>
                          <button 
                            onClick={() => triggerVibrate('Eco Ativo', [60, 40, 60, 40, 150])}
                            className="bg-white hover:bg-zinc-100/70 text-[#9B51E0] border border-zinc-200 hover:border-zinc-300 text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center font-bold"
                          >
                            Padrão Game 🎮
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>



        {/* Interactive Long-Press Action Modal Menu */}
        <AnimatePresence>
          {actionMenuMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => setActionMenuMessage(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-zinc-150 p-6 text-left flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#9B51E0]/10 rounded-lg text-[#9B51E0]">
                      <MoreVertical className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 font-sans">Ações de Mensagem</span>
                  </div>
                  <button 
                    onClick={() => setActionMenuMessage(null)}
                    className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Snippet / Preview Card */}
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 text-xs text-zinc-600 max-h-24 overflow-y-auto font-sans font-light leading-relaxed">
                  {actionMenuMessage.text ? (
                    <p className="line-clamp-4">{actionMenuMessage.text.replace(/\*\*/g, '')}</p>
                  ) : actionMenuMessage.aiGeneratedImage ? (
                    <span className="text-[11px] font-bold text-[#9B51E0] flex items-center gap-1.5">
                      <Image className="w-4 h-4" /> Desenho / Imagem gerada por IA
                    </span>
                  ) : (
                    <span className="italic text-zinc-400">Mensagem de mídia / anexo</span>
                  )}
                </div>

                {/* Actions Grid */}
                <div className="flex flex-col gap-2.5">
                  {/* Copy Text Action */}
                  {actionMenuMessage.text && (
                    <button
                      onClick={() => handleCopyMessageText(actionMenuMessage.text)}
                      className="w-full flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 rounded-2xl border border-zinc-200 transition-all font-sans font-semibold text-xs cursor-pointer active:scale-98"
                    >
                      <span className="flex items-center gap-3">
                        <Copy className="w-4 h-4 text-zinc-500" />
                        <span>{copyFeedbackShow ? 'Copiado com sucesso! ✨' : 'Copiar Texto da Mensagem'}</span>
                      </span>
                      {copyFeedbackShow ? (
                        <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-normal uppercase font-mono">Txt</span>
                      )}
                    </button>
                  )}

                  {/* Copy Image Link Action */}
                  {actionMenuMessage.aiGeneratedImage && (
                    <button
                      onClick={() => handleCopyMessageText(actionMenuMessage.aiGeneratedImage!)}
                      className="w-full flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 rounded-2xl border border-zinc-200 transition-all font-sans font-semibold text-xs cursor-pointer active:scale-98"
                    >
                      <span className="flex items-center gap-3">
                        <Copy className="w-4 h-4 text-zinc-500" />
                        <span>{copyFeedbackShow ? 'Link da Imagem Copiado!' : 'Copiar URL da Imagem'}</span>
                      </span>
                      {copyFeedbackShow ? (
                        <Check className="w-4 h-4 text-emerald-600 animate-pulse" />
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-normal uppercase font-mono">Url</span>
                      )}
                    </button>
                  )}

                  {/* Delete Action (Excluir) */}
                  <button
                    onClick={() => handleDeleteMessage(actionMenuMessage.id)}
                    className="w-full flex items-center gap-3 p-3.5 bg-rose-50 hover:bg-rose-100 text-[#C0392B] hover:text-[#962D22] rounded-2xl border border-rose-100 hover:border-rose-200 transition-all font-sans font-bold text-xs cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4.5 h-4.5 text-rose-600" />
                    <span>Excluir Mensagem</span>
                  </button>
                </div>

                {/* Cancel Trigger */}
                <button
                  onClick={() => setActionMenuMessage(null)}
                  className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs uppercase tracking-wider text-center transition cursor-pointer active:scale-95"
                >
                  Fechar Opções
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox Image Preview Modal */}
        <AnimatePresence>
          {previewImageUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
              onClick={() => setPreviewImageUrl(null)}
            >
              {/* Close button top right */}
              <button 
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition active:scale-95 cursor-pointer z-51 hover:scale-105"
                onClick={() => setPreviewImageUrl(null)}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Main Image display frame */}
              <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="relative max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-zinc-950 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} // Prevent close on clicking the image card itself
              >
                <img 
                  src={previewImageUrl} 
                  alt="Visualização ampliada" 
                  className="max-w-full max-h-[75vh] object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Quick Actions at the bottom */}
              <div className="flex items-center gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewImageUrl;
                    link.download = `Desenho_Ampliado_Aura_${Date.now()}.png`;
                    link.target = "_blank";
                    link.click();
                  }}
                  className="px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl text-xs font-bold font-sans tracking-wide uppercase flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition"
                >
                  <Download className="w-4 h-4 text-zinc-950" />
                  <span>Baixar Foto</span>
                </button>
                
                <button 
                  onClick={() => setPreviewImageUrl(null)}
                  className="px-5 py-2.5 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white rounded-xl text-xs font-bold font-sans tracking-wide uppercase transition active:scale-95 cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Authentication Login Modal */}
        <AnimatePresence>
          {loginModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => {
                if (!authConnecting) setLoginModalOpen(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className={`w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border p-6 sm:p-8 text-center flex flex-col gap-6 ${
                  darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200/80'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header info */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[#9B51E0] shadow-2xs mb-2 ${
                    darkMode ? 'bg-indigo-950/40' : 'bg-indigo-50'
                  }`}>
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className={`text-xl font-extrabold font-sans tracking-tight ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Conectar com a Aura
                  </h3>
                  <p className={`text-xs font-light font-sans max-w-xs leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Escolha um provedor para fazer login com segurança, carregar seus presets e sincronizar histórico.
                  </p>
                </div>

                {/* Main section: connecting loader OR active options */}
                {authConnecting ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-[#9B51E0] rounded-full animate-spin" />
                    <p className={`text-xs font-semibold font-sans animate-pulse ${darkMode ? 'text-zinc-300' : 'text-zinc-650'}`}>
                      Validando credenciais com o {authConnecting === 'google' ? 'Google' : 'Facebook'}...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    
                    {/* Google Action Button */}
                    <button
                      onClick={() => handleSocialLogin('google')}
                      className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border shadow-3xs cursor-pointer select-none transition active:scale-[0.98] font-sans font-bold text-xs ${
                        darkMode ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-100 border-zinc-800' : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200'
                      }`}
                    >
                      {/* Google G styled logo using vector layout */}
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.514 5.514 0 0 1 8.5 13a5.514 5.514 0 0 1 5.491-5.514c2.254 0 4.127 1.258 5.093 3.1l3.56-2.054C20.485 4.3 16.578 2 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10c5.319 0 9.805-3.8 9.805-9.8a8.3 8.3 0 0 0-.21-1.915H12.24Z"
                        />
                      </svg>
                      <span>Entrar com o Google</span>
                    </button>

                    {/* Facebook Action Button */}
                    <button
                      onClick={() => handleSocialLogin('facebook')}
                      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[#1877F2] hover:bg-[#156bdb] text-white rounded-2xl border border-[#1877F2] shadow-3xs cursor-pointer select-none transition active:scale-[0.98] font-sans font-bold text-xs"
                    >
                      <Facebook className="w-5 h-5 shrink-0 text-white fill-current" />
                      <span>Entrar com o Facebook</span>
                    </button>

                  </div>
                )}

                {/* Footer disclaimer and close button */}
                {!authConnecting && (
                  <div className={`flex flex-col gap-3 mt-1.5 pt-4 border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <p className="text-[10px] text-zinc-400 font-sans font-light leading-relaxed">
                      Sua privacidade é nossa prioridade. Não compartilhamos nem salvamos seus dados pessoais do perfil externo.
                    </p>
                    <button
                      onClick={() => setLoginModalOpen(false)}
                      className={`w-full py-2.5 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer active:scale-95 ${
                        darkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Account Portal / Profile Settings Modal */}
        <AnimatePresence>
          {profileMenuOpen && currentUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setProfileMenuOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-zinc-200 p-6 text-center flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header badge */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">
                    AURA PROFILE ID
                  </span>
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ativo
                  </span>
                </div>

                {/* Avatar Visual Section */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className={`w-16 h-16 ${currentUser.provider === 'google' ? 'bg-indigo-50 border-indigo-200' : 'bg-[#eef4ff] border-blue-200'} border-3 rounded-full flex items-center justify-center text-zinc-900 shadow-inner text-xl font-bold relative`}>
                    <span className={currentUser.provider === 'google' ? 'text-indigo-600' : 'text-[#1877F2]'}>
                      {currentUser.avatar}
                    </span>
                    
                    {/* Brand icon representation corner badge */}
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-2xs">
                      {currentUser.provider === 'google' ? (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.514 5.514 0 0 1 8.5 13a5.514 5.514 0 0 1 5.491-5.514c2.254 0 4.127 1.258 5.093 3.1l3.56-2.054C20.485 4.3 16.578 2 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10c5.319 0 9.805-3.8 9.805-9.8a8.3 8.3 0 0 0-.21-1.915H12.24Z"
                          />
                        </svg>
                      ) : (
                        <Facebook className="w-3.5 h-3.5 text-[#1877F2] fill-current" />
                      )}
                    </span>
                  </div>

                  <h4 className="text-base font-extrabold text-[#1F1F1F] font-sans tracking-tight mt-1">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono">
                    {currentUser.email}
                  </p>
                </div>

                {/* Account Details Quick Panel */}
                <div className="bg-zinc-50 border border-zinc-150/60 rounded-2xl p-4 text-left flex flex-col gap-2 text-xs font-sans">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Acesso Autorizado</span>
                    <span className="font-bold text-zinc-805">Total</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Provedor de Login</span>
                    <span className="font-bold text-zinc-805 uppercase">{currentUser.provider}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Sincronia de Dados</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Nuvem Ativa
                    </span>
                  </div>
                </div>

                {/* Actions bottom controls */}
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-[#C0392B] border border-rose-100 text-xs font-bold rounded-2xl transition cursor-pointer active:scale-98"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sair da Conta</span>
                  </button>

                  <button
                    onClick={() => setProfileMenuOpen(false)}
                    className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer active:scale-95"
                  >
                    Fechar Portal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
