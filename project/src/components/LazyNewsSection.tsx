import React, { Suspense } from 'react';
import { NewsSection } from './NewsSection';
import { TrendingUp } from "lucide-react";

const LoadingSection = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-800/50 rounded-lg w-1/4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-800/30 rounded-xl p-4 space-y-4">
          <div className="h-48 bg-gray-800/50 rounded-lg"></div>
          <div className="h-4 bg-gray-800/50 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800/50 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  </div>
);

interface LazyNewsSectionProps {
  title: string;
  type: "tailored" | "popular";
  fetchFn: () => Promise<any[]>;
  icon?: React.ReactNode;
}

export function LazyNewsSection({ title, type, fetchFn, icon }: LazyNewsSectionProps) {
  const ArticlesComponent = React.useMemo(
    () =>
      React.lazy(async () => {
        const articles = await fetchFn();
        return {
          default: () => (
            <NewsSection
              title={title}
              items={articles}
              type={type}
              icon={icon}
            />
          ),
        };
      }),
    []
  );

  return (
    <Suspense fallback={<LoadingSection />}>
      <ArticlesComponent />
    </Suspense>
  );
}
