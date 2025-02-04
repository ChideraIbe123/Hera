import React, { useState } from "react";
import { Settings, User, MessageSquare, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface HeaderProps {
  onChatToggle: () => void;
}

export function Header({ onChatToggle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    const header = document.querySelector("header");
    if (element && header) {
      const headerHeight = header.offsetHeight;
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - headerHeight - 24, // Additional 24px offset for spacing
        behavior: "smooth",
      });
    }
  };

  return (
    <header className="bg-gray-900/95 border-b border-gray-800/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              NewsHub
            </h1>
          </div>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-6 lg:gap-12">
            <button
              onClick={() => scrollToSection("tailored")}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              Tailored for You
            </button>
            <button
              onClick={() => scrollToSection("general")}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              General News
            </button>
            <button
              onClick={() => scrollToSection("topics")}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              Topics
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
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
