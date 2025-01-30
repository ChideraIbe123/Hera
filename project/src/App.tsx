import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Header } from './components/Header';
import { ChatBox } from './components/ChatBox';
import { NewsSection } from './components/NewsSection';
import { TopicsSection } from './components/TopicsSection';
import { Footer } from './components/Footer';
import { tailoredNews, popularNews, topics, mockMessages } from './data';

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState(mockMessages);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    setMessages([
      ...messages,
      { id: messages.length + 1, text: chatInput, isBot: false }
    ]);
    setChatInput('');
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          text: "I'll look into that for you. Is there anything specific you'd like to know about this topic?", 
          isBot: true 
        }
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-200">
      <Header 
        onChatToggle={() => setChatOpen(!chatOpen)} 
        topics={topics.map(t => ({ name: t.name, color: t.color }))}
      />

      <ChatBox
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        input={chatInput}
        onInputChange={setChatInput}
        onSend={handleSendMessage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        <NewsSection
          title="Tailored For You"
          items={tailoredNews}
          type="tailored"
        />

        <NewsSection
          title="Popular Now"
          icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />}
          items={popularNews}
          type="popular"
        />

        <TopicsSection topics={topics} />
      </main>

      <Footer />
    </div>
  );
}

export default App;