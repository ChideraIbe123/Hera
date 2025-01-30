import React, { useEffect, useRef } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

export function ChatBox({ isOpen, onClose, messages, input, onInputChange, onSend }: ChatBoxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`w-full max-w-4xl h-[85vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col mx-4 transform transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="h-16 px-6 border-b border-gray-800/50 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-medium text-gray-200">Chat Assistant</h2>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div 
                className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-lg ${
                  message.isBot 
                    ? 'bg-gray-800/80 text-gray-200' 
                    : 'bg-blue-500 text-white'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-gray-800/50 bg-gray-900/30">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 bg-gray-800/50 rounded-xl px-5 text-sm text-gray-200 placeholder-gray-500 border border-gray-700/30 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
              onKeyPress={(e) => e.key === 'Enter' && onSend()}
            />
            <button 
              onClick={onSend}
              className="w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}