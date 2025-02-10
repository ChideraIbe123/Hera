import React, { useEffect, useState, Suspense } from "react";
import { TrendingUp } from "lucide-react";
import { Header } from "../components/Header";
import { ChatBox } from "../components/ChatBox";
import { NewsSection } from "../components/NewsSection";
import { TopicsSection } from "../components/TopicsSection";
import { Footer } from "../components/Footer";
import { getArticles, getTailoredNews, getInsights } from "../data";
import { useAuth } from "../components/AuthProvider";
import { LazyNewsSection } from "../components/LazyNewsSection";

export default function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);
  const [topics, setTopics] = useState<
    Array<{
      id: number;
      name: string;
      icon: any;
      color: string;
      stories: any[];
    }>
  >([]);

  const { user } = useAuth();

  useEffect(() => {
    getInsights().then((insights) => setTopics(insights));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-200">
      <Header onChatToggle={() => setChatOpen(!chatOpen)} />
      <ChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        <section id="tailored">
          <LazyNewsSection
            title="Tailored For You"
            type="tailored"
            fetchFn={() => getTailoredNews(user)}
          />
        </section>
        <section id="general">
          <LazyNewsSection
            title="General News"
            type="popular"
            fetchFn={getArticles}
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />}
          />
        </section>
        <section id="topics">
          <TopicsSection topics={topics} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
