import React, { useEffect, useRef } from 'react';
import { Message } from '../lib/chatService';
import { Bot, User } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-center">
        <div className="max-w-sm">
          <Bot className="w-12 h-12 mx-auto mb-4 text-blue-400" />
          <h3 className="text-lg font-medium text-gray-200 mb-2">
            How can I help you today?
          </h3>
          <p className="text-sm text-gray-400">
            Ask me anything! I'm here to assist you with your questions and tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`flex gap-3 max-w-[80%] group ${
              message.isBot ? 'flex-row' : 'flex-row-reverse'
            }`}
          >
            <div className={`flex-shrink-0 mt-1 ${message.isBot ? 'text-blue-400' : 'text-green-400'}`}>
              {message.isBot ? (
                <Bot className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div
              className={`px-4 py-3 rounded-2xl ${
                message.isBot
                  ? 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}