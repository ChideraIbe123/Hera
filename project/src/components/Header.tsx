import React, { useState } from 'react';
import { Settings, Search, User, MessageSquare, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onChatToggle: () => void;
  topics: Array<{
    name: string;
    color: string;
  }>;
}

export function Header({ onChatToggle, topics }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-gray-900/95 border-b border-gray-800/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8 lg:gap-16">
            <div className="flex items-center gap-2.5">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                NewsHub
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {topics.map((topic) => (
                <a 
                  key={topic.name}
                  href="#" 
                  className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {topic.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search news..."
                className="w-48 lg:w-64 h-9 bg-gray-800/50 rounded-full px-4 pl-9 text-sm text-gray-300 border border-gray-700/50 focus:outline-none focus:border-blue-500/50 transition-colors duration-200"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            </div>
            <button
              onClick={onChatToggle}
              className="flex items-center gap-2 bg-blue-500 h-9 px-3 sm:px-4 rounded-full hover:bg-blue-600 transition-colors duration-200 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-800/50 rounded-full transition-colors duration-200"
              >
                <User className="w-5 h-5 text-gray-400" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-lg py-1 border border-gray-700/50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}