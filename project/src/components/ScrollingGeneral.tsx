import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface ScrollingKeywordsProps {
  title: string;
  userId?: string;
  endpoint?: string;
}

export function ScrollingGeneral({ title }: ScrollingKeywordsProps) {
  const [keywords, setKeywords] = useState<string[]>([]);

  useEffect(() => {
    async function fetchKeywords() {
      try {
        // const supabase = createClient(
        //   "https://ormwiisftmytxsewkwvp.supabase.co",
        //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybXdpaXNmdG15dHhzZXdrd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyOTExMTQsImV4cCI6MjA1Mzg2NzExNH0.xPunHD5-T7WqYT4e9lefWqpT1WM_PyKTZQigtk_xqO4"
        // );

        const { data, error } = await supabase
          .from("Articles")
          .select("general_keywords")
          .order("id")
          // .limit(1)
          .single();
        console.log(data);

        if (error) throw error;
        if (data && data.general_keywords) {
          setKeywords(data.general_keywords);
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
