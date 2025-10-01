import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Story {
  id: number;
  title: string;
  summary: string;
  image: string;
  link?: string;
}

interface Topic {
  id: number;
  name: string;
  icon: React.ElementType;
  color: string;
  stories: Story[];
}

interface TopicsSectionProps {
  topics: Topic[];
}

export function TopicsSection({ topics }: TopicsSectionProps) {
  return (
    <section className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <div key={topic.id} className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-800/50 shadow-xl group">
              <div className="p-4 sm:p-6 border-b border-gray-700/50">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 sm:p-3.5 rounded-xl bg-${topic.color}-900/20 border border-${topic.color}-700/20 group-hover:bg-${topic.color}-900/30 transition-colors duration-200`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${topic.color}-400`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
                    {topic.name}
                  </h3>
                </div>
              </div>
              <div className="divide-y divide-gray-800/50 max-h-[400px] overflow-y-auto">
                {topic.stories.map((story) => (
                  <div key={story.id} className="p-4 sm:p-6 hover:bg-gray-800/30 transition-colors duration-200">
                    <a
                      href={story.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex space-x-4 sm:space-x-5 ${story.link ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <img
                        src={story.image}
                        alt={story.title}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl flex-shrink-0 shadow-lg"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <h4 className="font-semibold text-base sm:text-lg line-clamp-2 leading-tight text-gray-100">
                          {story.title}
                        </h4>
                        <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
                          {story.summary}
                        </p>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}