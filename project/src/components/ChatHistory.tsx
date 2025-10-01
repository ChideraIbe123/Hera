import React from 'react';
import { Trash2, MessageSquare, Plus, Search } from 'lucide-react';
import { ConversationMeta } from '../lib/chatService';

interface ChatHistoryProps {
  conversations: ConversationMeta[];
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  currentConversationId?: number;
  onNewChat: () => void;
}

export function ChatHistory({ conversations, onSelect, onDelete, currentConversationId, onNewChat }: ChatHistoryProps) {
  return (
    <div className="w-80 h-full bg-gray-900/95 border-r border-gray-800/50 flex flex-col">
      <div className="p-4 border-b border-gray-800/50">
        <h2 className="text-lg font-semibold text-gray-200 mb-3">Chat History</h2>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="p-3 border-b border-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-500 text-sm focus:ring-blue-500/30 focus:border-blue-500/30"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1 py-2">
        {conversations.length === 0 ? (
          <div className="p-4 text-gray-400 text-sm text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                  currentConversationId === conv.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'hover:bg-gray-800/50 text-gray-300 border border-transparent'
                }`}
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className="flex items-center space-x-3 flex-1 min-w-0"
                >
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate text-sm">{conv.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100 ${
                    currentConversationId === conv.id
                      ? 'hover:bg-red-500/20 text-red-400'
                      : 'hover:bg-gray-700/50 text-gray-400'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}