'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Minus,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  MessageSquare,
  Package,
  FileText,
  PhoneCall,
  Search,
} from 'lucide-react';
import { ProductCardSuggestion } from '@/app/api/chat/route';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  productCards?: ProductCardSuggestion[];
  quickLinks?: Array<{ title: string; url: string; external?: boolean }>;
  suggestedActions?: string[];
}

const INITIAL_WELCOME_TEXT =
  "Hi! Welcome to OfficeBazzar 👋\nI'm Bazzar AI. I can help you find office supplies, explore products and request bulk quotations. How can I help you today?";

const DEFAULT_SUGGESTIONS = [
  'Find Products',
  'Bulk Order Enquiry',
  'Get a Quotation',
  'Contact Support',
];

export default function BazzarAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: INITIAL_WELCOME_TEXT,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      suggestedActions: DEFAULT_SUGGESTIONS,
      quickLinks: [
        { title: 'Browse Catalog', url: '/categories' },
        { title: 'Bulk Order Form', url: '/bulk-orders' },
        { title: 'Quotation Cart', url: '/quote-cart' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // Auto-focus input on desktop
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Handle ESC key to close/minimize chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: INITIAL_WELCOME_TEXT,
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        suggestedActions: DEFAULT_SUGGESTIONS,
        quickLinks: [
          { title: 'Browse Catalog', url: '/categories' },
          { title: 'Bulk Order Form', url: '/bulk-orders' },
          { title: 'Quotation Cart', url: '/quote-cart' },
        ],
      },
    ]);
  };

  const sendMessage = async (contentToSend: string) => {
    const trimmed = contentToSend.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || "I'm here to assist you with office supplies. How can I help?",
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        productCards: data.productCards,
        quickLinks: data.quickLinks,
        suggestedActions: data.suggestedActions || DEFAULT_SUGGESTIONS,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text:
            "I'm currently unable to reach the server, but our customer support desk is ready to help at **+91 7200800040** or **sales4@officebazzar.com**.",
          timestamp: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          suggestedActions: ['Find Products', 'Contact Support', 'Get a Quotation'],
          quickLinks: [
            { title: 'Contact Support', url: '/contact' },
            { title: 'Call 7200800040', url: 'tel:7200800040', external: true },
          ],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* 1. FLOATING LAUNCHER (Bottom-Right: ONLY the transparent 3D robot character, no decorative elements) */}
      {!isOpen && (
        <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 select-none">
          <button
            type="button"
            onClick={handleOpen}
            aria-label="Open Bazzar AI Chatbot"
            aria-expanded={isOpen}
            className="group relative w-16 h-20 sm:w-20 sm:h-24 bg-transparent border-0 p-0 outline-hidden focus:outline-hidden animate-bazzar-float hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer flex items-center justify-center"
          >
            <Image
              src="/assets/bazzar-ai-avatar.png?v=transparent"
              alt="Bazzar AI 3D Robot Assistant"
              width={90}
              height={100}
              priority
              unoptimized
              className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_16px_32px_rgba(0,0,0,0.4)] transition-all duration-200"
            />
          </button>
        </div>
      )}

      {/* 2. CHATBOT OPEN INTERFACE */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bazzar AI Chat Assistant"
          className={`fixed z-50 transition-all duration-300 ease-out ${
            isMinimized
              ? 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-72 h-14 bg-gradient-to-r from-blue-950 to-indigo-950 rounded-2xl shadow-2xl border border-sky-400/40 flex items-center px-3.5 justify-between text-white'
              : 'bottom-2 right-2 left-2 sm:left-auto sm:bottom-6 sm:right-6 w-auto sm:w-[420px] h-[88vh] sm:h-[620px] max-h-[700px] bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200'
          }`}
        >
          {/* A. HEADER */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-3.5 sm:p-4 border-b border-blue-800/60 shadow-xs flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {/* 3D Robot Header Avatar (Clean transparent background) */}
              <div className="relative w-10 h-10 bg-transparent shrink-0 flex items-center justify-center">
                <Image
                  src="/assets/bazzar-ai-avatar.png?v=transparent"
                  alt="Bazzar AI"
                  width={40}
                  height={40}
                  priority
                  unoptimized
                  className="w-full h-full object-contain select-none"
                />
              </div>

              {/* Title & Tagline */}
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight truncate text-white">
                    Bazzar AI
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-200 rounded border border-sky-400/30">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5 text-sky-300" />
                    Assistant
                  </span>
                </div>
                <p className="text-[11px] text-sky-200/90 truncate font-medium">
                  Your Smart Office Supplies Assistant
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center space-x-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleResetConversation}
                className="p-1.5 text-sky-200 hover:text-white hover:bg-blue-800/60 rounded-lg transition-colors"
                title="Restart Conversation"
                aria-label="Restart Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleMinimize}
                className="p-1.5 text-sky-200 hover:text-white hover:bg-blue-800/60 rounded-lg transition-colors"
                title={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
                aria-label={isMinimized ? 'Expand Chat' : 'Minimize Chat'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 text-sky-200 hover:text-white hover:bg-rose-600 rounded-lg transition-colors"
                title="Close Chat"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. EXPANDED CHAT BODY */}
          {!isMinimized && (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-xs bg-gradient-to-b from-slate-50 via-slate-50 to-blue-50/30">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 animate-in fade-in duration-200 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Assistant Avatar Thumbnail (Clean transparent background) */}
                    {msg.sender === 'assistant' && (
                      <div className="w-8 h-8 bg-transparent shrink-0 mt-0.5 flex items-center justify-center">
                        <Image
                          src="/assets/bazzar-ai-avatar.png?v=transparent"
                          alt="Bazzar AI"
                          width={32}
                          height={32}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-900 text-white rounded-br-xs font-medium'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                      }`}
                    >
                      {/* Markdown-like simple formatting */}
                      <div className="whitespace-pre-wrap font-sans text-xs">
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Product Recommendation Cards (if returned) */}
                      {msg.productCards && msg.productCards.length > 0 && (
                        <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Recommended Products
                          </span>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.productCards.map((prod) => (
                              <Link
                                key={prod.id}
                                href={prod.url}
                                onClick={handleClose}
                                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center gap-2.5 transition-all group"
                              >
                                {prod.imageUrl ? (
                                  <div className="w-10 h-10 bg-white rounded-lg p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                                    <img
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      className="max-h-full max-w-full object-contain"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 group-hover:text-blue-900 truncate text-[11px]">
                                    {prod.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {prod.packSize} • {prod.sku}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-900 shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Action Navigation Links */}
                      {msg.quickLinks && msg.quickLinks.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {msg.quickLinks.map((link, idx) => (
                            <Link
                              key={idx}
                              href={link.url}
                              target={link.external ? '_blank' : undefined}
                              rel={link.external ? 'noopener noreferrer' : undefined}
                              onClick={link.external ? undefined : handleClose}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold rounded-lg text-[10px] transition-colors border border-blue-200/60"
                            >
                              <span>{link.title}</span>
                              {link.external ? (
                                <ExternalLink className="w-2.5 h-2.5" />
                              ) : (
                                <ArrowRight className="w-2.5 h-2.5" />
                              )}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Assistant Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-slate-400 animate-in fade-in">
                    <div className="w-7 h-7 bg-transparent shrink-0 flex items-center justify-center">
                      <Image
                        src="/assets/bazzar-ai-avatar.png?v=transparent"
                        alt="Bazzar AI"
                        width={28}
                        height={28}
                        unoptimized
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center space-x-1 shadow-2xs">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                      <div
                        className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                        style={{ animationDelay: '0.3s' }}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* C. SUGGESTED ACTION CHIPS */}
              {messages.length > 0 &&
                messages[messages.length - 1].suggestedActions && (
                  <div className="p-2.5 bg-white border-t border-slate-200/70 overflow-x-auto scrollbar-none flex items-center gap-1.5">
                    {messages[messages.length - 1].suggestedActions!.map((action, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionClick(action)}
                        className="whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 transition-all flex items-center space-x-1 shrink-0 shadow-2xs"
                      >
                        {getActionIcon(action)}
                        <span>{action}</span>
                      </button>
                    ))}
                  </div>
                )}

              {/* D. INPUT FORM */}
              <form
                onSubmit={handleSubmit}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about products, bulk pricing, quotes..."
                  className="flex-1 py-2 px-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2.5 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* E. FOOTER BRANDING */}
              <div className="py-1 px-3 bg-slate-100 border-t border-slate-200/50 text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1">
                <span>OfficeBazzar B2B Commerce</span>
                <span>&bull;</span>
                <span className="text-emerald-600 font-semibold">100% Verified Catalog</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function getActionIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes('find') || lower.includes('product') || lower.includes('search')) {
    return <Search className="w-3 h-3 text-blue-700" />;
  }
  if (lower.includes('bulk') || lower.includes('order')) {
    return <Package className="w-3 h-3 text-emerald-700" />;
  }
  if (lower.includes('quote') || lower.includes('rfq')) {
    return <FileText className="w-3 h-3 text-amber-700" />;
  }
  if (lower.includes('contact') || lower.includes('call') || lower.includes('support')) {
    return <PhoneCall className="w-3 h-3 text-indigo-700" />;
  }
  return <MessageSquare className="w-3 h-3 text-slate-500" />;
}

/**
 * Lightweight formatting for bold, bullets, and line breaks
 */
function renderFormattedText(rawText: string) {
  const lines = rawText.split('\n');
  return lines.map((line, lIdx) => {
    // Process **bold**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={lIdx} className="block leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('### ')) {
            return (
              <span key={pIdx} className="font-extrabold text-blue-950 block text-[13px] mt-1 mb-0.5">
                {part.slice(4)}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  });
}

