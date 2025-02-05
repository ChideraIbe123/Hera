import React, { useEffect, useState } from "react";

interface ScrollingKeywordsProps {
  title: string;
  userId: string;
  endpoint?: string;
}

export function ScrollingGeneral({ title }: ScrollingKeywordsProps) {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    async function fetchKeywords() {
      try {
        const response = await fetch("http://localhost:5000/api/insights", {
          method: "POST",
        });
        const data = await response.json();
        if (data) {
          setKeywords(data);
        }
      } catch (error) {
        console.error("Error fetching keywords:", error);
      }
    }

    fetchKeywords();
  }, []);

  // Multiply keywords array to ensure continuous scrolling
  const duplicatedKeywords = Array.from(
    { length: 1000 },
    () => keywords
  ).flat();

  return (
    <div className="bg-gray-900/30 rounded-2xl p-8 border border-gray-800/50 shadow-lg backdrop-blur-sm">
      <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
        {title}
      </h3>
      <div className="overflow-hidden relative rounded-xl bg-gray-800/30 py-4">
        <div
          className="flex animate-scroll whitespace-nowrap"
          style={{
            animation: "scroll 60s linear infinite",
          }}
        >
          {duplicatedKeywords.map((keyword, index) => (
            <span
              key={index}
              className="inline-block px-4 py-2 mx-2 bg-gray-800/50 rounded-full text-sm font-medium text-gray-300 border border-gray-700/50 transition-colors duration-200 hover:bg-gray-700/50 hover:border-gray-600/50"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
