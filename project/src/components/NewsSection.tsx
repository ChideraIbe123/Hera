import React from "react";
import { ChevronRight } from "lucide-react";
import { ScrollingKeywords } from "./ScrollingKeywords";
import { ScrollingGeneral } from "./ScrollingGeneral";
import { useAuth } from "../components/AuthProvider";

interface NewsItem {
  id: number;
  title: string;
  image: string;
  category?: string;
  views?: string;
  link?: string;
}

interface NewsSectionProps {
  title: string;
  icon?: React.ReactNode;
  items: NewsItem[];
  type: "tailored" | "popular";
}

export function NewsSection({ title, icon, items, type }: NewsSectionProps) {
  const { user } = useAuth();


  return (
    <section className="space-y-6">
      <div className="bg-gray-900/30 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm border border-gray-800/50 transition-all duration-300 hover:bg-gray-900/40">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {icon && (
              <span className="mr-3 transform transition-transform duration-300 hover:scale-110">
                {icon}
              </span>
            )}
            {title}
          </h2>
          <button className="text-blue-400 hover:text-blue-300 transition-all duration-200 flex items-center group">
            <span className="mr-2 text-sm font-medium hidden sm:inline">
              More stories
            </span>
            <ChevronRight className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
        <div className="relative">
          <div className="flex space-x-4 sm:space-x-6 overflow-x-auto pb-4 scrollbar-hide">
            {[...items, ...items].map((item, index) => (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                key={`${item.id}-${index}`}
                className="relative overflow-hidden rounded-xl group flex-shrink-0 w-[280px] sm:w-[320px] shadow-xl transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="aspect-[4/3] relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transform transition-all duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80">
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 transform transition-transform duration-300 group-hover:translate-y-0">
                      <span
                        className={`${
                          type === "tailored"
                            ? "bg-gradient-to-r from-blue-600 to-blue-500"
                            : "bg-gradient-to-r from-red-600 to-red-500"
                        } text-xs px-3 py-1.5 rounded-full font-medium shadow-lg inline-block transform transition-all duration-300 group-hover:scale-105`}
                      >
                        {type === "tailored"
                          ? item.category
                          : `${item.views} views`}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold mt-3 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors duration-200">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* If the type is "tailored", show only the tailored keywords scrolling */}
      {user && type === "tailored" && (
        <ScrollingKeywords
          // Adjust the title to reflect that these are your tailored keywords.
          title="Key Words from Your Conversations"
          userId={user.id}
          // No endpoint is needed for tailored keywords.
        />
      )}

      {/* If the type is "popular", show only the general/popular keywords scrolling */}
      {user && type === "popular" && (
        <ScrollingGeneral
          // This title reflects that these keywords come from general/popular news.
          title="Popular News Keywords"
          userId={user.id}
          endpoint="http://localhost:5000/api/insights"
        />
      )}
    </section>
  );
}
