import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Copy, RefreshCw, Briefcase, Code, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateInterviewAnswer } from './services/groqService';

// Types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type InterviewType = 'general' | 'technical' | 'hr' | 'behavioral';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewType, setInterviewType] = useState<InterviewType>('general');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Web Speech API is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (event.results[event.results.length - 1].isFinal) {
        const finalQuestion = event.results[event.results.length - 1][0].transcript.trim();
        if (finalQuestion.length > 10) {
          handleQuestionDetected(finalQuestion);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please enable microphone permissions.");
      } else {
        setError(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start(); // Keep listening if we're supposed to be active
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setError("Failed to start microphone. Please refresh and try again.");
      }
    }
  };

  const handleQuestionDetected = async (question: string) => {
    setIsLoading(true);
    const answer = await generateInterviewAnswer(question, interviewType);
    setAiAnswer(answer);
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiAnswer);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const clearAll = () => {
    setAiAnswer('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-serif italic mb-2">InterviewAI</h1>
            <p className="text-sm uppercase tracking-widest opacity-50">Real-time Interview Assistant</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(['general', 'technical', 'hr', 'behavioral'] as InterviewType[]).map((type) => (
              <button
                key={type}
                onClick={() => setInterviewType(type)}
                className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all border ${
                  interviewType === type 
                    ? 'bg-[#141414] text-white border-[#141414]' 
                    : 'bg-transparent text-[#141414] border-[#141414]/20 hover:border-[#141414]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </header>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Transcript */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#141414]/5">
              <div className="flex flex-col items-center text-center space-y-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-[#141414] text-white'
                  }`}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </motion.button>
                
                <div>
                  <h3 className="text-xl font-medium mb-1">
                    {isListening ? 'Listening...' : 'Ready to Start'}
                  </h3>
                  <p className="text-sm opacity-50">
                    {isListening ? 'Capturing interviewer audio' : 'Click to start listening'}
                  </p>
                </div>

                <div className="w-full pt-4 flex gap-2">
                  <button 
                    onClick={clearAll}
                    className="flex-1 py-3 rounded-xl border border-[#141414]/10 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>

          {/* Right Column: AI Answer */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#141414]/5 h-full flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#141414] rounded-full flex items-center justify-center text-white">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif italic">AI Suggested Answer</h2>
                    <p className="text-xs opacity-50 uppercase tracking-widest">Generated instantly</p>
                  </div>
                </div>
                
                {aiAnswer && (
                  <button 
                    onClick={copyToClipboard}
                    className="p-3 rounded-full hover:bg-gray-50 transition-colors relative"
                  >
                    {copySuccess ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                    {copySuccess && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded">Copied!</span>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                    >
                      <div className="w-12 h-12 border-4 border-[#141414]/10 border-t-[#141414] rounded-full animate-spin" />
                      <p className="text-sm opacity-50 font-medium">Analyzing question & crafting response...</p>
                    </motion.div>
                  ) : aiAnswer ? (
                    <motion.div 
                      key="answer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-sm max-w-none"
                    >
                      <div className="whitespace-pre-wrap text-lg leading-relaxed text-[#141414]/80 font-serif">
                        {aiAnswer}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                      <Briefcase size={64} strokeWidth={1} />
                      <div>
                        <p className="text-xl font-serif italic">Awaiting Interviewer Question</p>
                        <p className="text-sm mt-2">Start listening to detect questions automatically</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tips Footer */}
              <div className="mt-12 pt-8 border-t border-[#141414]/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Code size={16} className="mt-1 opacity-50" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1">Technical</h4>
                    <p className="text-[10px] opacity-50">Focus on logic, scalability, and best practices.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={16} className="mt-1 opacity-50" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1">Behavioral</h4>
                    <p className="text-[10px] opacity-50">Use the STAR method: Situation, Task, Action, Result.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="mt-1 opacity-50" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1">Delivery</h4>
                    <p className="text-[10px] opacity-50">Speak clearly, maintain eye contact, and be concise.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
