import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { ChatHistory } from "./ChatHistory";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import { useAuth } from "./AuthProvider";
import {
  Message,
  ConversationMeta,
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
} from "../lib/chatService";

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatBox({ isOpen, onClose }: ChatBoxProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      loadConversations();
    }
  }, [user, isOpen]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const convs = await getConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const handleSelectConversation = async (id: number) => {
    try {
      const conv = await getConversation(id);
      if (conv) {
        setCurrentConversationId(conv.id);
        setMessages(conv.messages);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(undefined);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this conversation?"))
      return;

    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(undefined);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSend = async (text: string) => {
    if (!user || loading) return;

    const newMessage: Message = {
      id: Date.now(),
      text,
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    setLoading(true);
    try {
      let conversationId = currentConversationId;

      if (!conversationId) {
        conversationId = await createConversation(
          user.id,
          text.substring(0, 50) + "..."
        );
        setCurrentConversationId(conversationId);
        setConversations((prev) => [
          {
            id: conversationId,
            title: text.substring(0, 50) + "...",
          },
          ...prev,
        ]);
      }

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);

      // Send message to backend
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      const botMessage: Message = {
        id: Date.now(),
        text: data.response,
        isBot: true,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      await updateConversation(conversationId!, finalMessages);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now(),
        text: "Sorry, I encountered an error processing your request.",
        isBot: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center backdrop-blur-sm">
      <div className="w-full h-screen max-w-6xl flex">
        <ChatHistory
          conversations={conversations}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          currentConversationId={currentConversationId}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
          {/* Header */}
          <div className="p-4 border-b border-gray-800/50 flex items-center justify-between bg-gray-900/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-medium text-gray-200">AI Assistant</h2>
                <p className="text-xs text-gray-400">Always here to help</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <ChatMessages messages={messages} />

          {/* Input */}
          <ChatInput
            onSend={handleSend}
            disabled={loading}
            placeholder={loading ? "AI is thinking..." : "Type your message..."}
          />

          {/* Loading Indicator */}
          {loading && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
