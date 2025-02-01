import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';

const suggestedKeywords = [
  'Technology', 'Science', 'Health', 'Business', 'Politics',
  'Environment', 'Sports', 'Entertainment', 'Education', 'Art',
  'Innovation', 'Space', 'AI', 'Climate', 'Economy',
  'Medicine', 'Culture', 'Travel', 'Food', 'Fashion'
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleKeywordClick = (keyword: string) => {
    if (selectedKeywords.length >= 10 && !selectedKeywords.includes(keyword)) {
      setError('You can only select up to 10 keywords');
      return;
    }
    
    setSelectedKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
    setError(null);
  };

  const handleAddCustomKeyword = () => {
    if (!customKeyword.trim()) return;
    
    if (selectedKeywords.length >= 10) {
      setError('You can only select up to 10 keywords');
      return;
    }

    if (selectedKeywords.includes(customKeyword.trim())) {
      setError('This keyword is already selected');
      return;
    }

    setSelectedKeywords(prev => [...prev, customKeyword.trim()]);
    setCustomKeyword('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (selectedKeywords.length === 0) {
      setError('Please select at least one keyword');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          keywords: selectedKeywords,
          onboarded: true,
          first_name: user.user_metadata.first_name,
          last_name: user.user_metadata.last_name
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-gray-200 px-4">
      <div className="max-w-2xl mx-auto pt-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Settings className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent">
              NewsHub
            </h1>
          </div>
          <h2 className="text-2xl font-semibold mb-3">Personalize Your News</h2>
          <p className="text-gray-400">
            Select up to 10 topics you're interested in to help us customize your news feed
          </p>
        </div>

        {/* Selected Keywords */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Your Selected Topics ({selectedKeywords.length}/10)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedKeywords.map(keyword => (
              <button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-blue-500/30 transition-colors"
              >
                {keyword}
                <X className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Keyword Input */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Add Custom Topic</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="Enter a custom topic"
              className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomKeyword()}
            />
            <button
              onClick={handleAddCustomKeyword}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Suggested Keywords */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Suggested Topics</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedKeywords.map(keyword => (
              <button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedKeywords.includes(keyword)
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-800'
                }`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving preferences...</span>
            </div>
          ) : (
            "Continue to NewsHub"
          )}
        </button>
      </div>
    </div>
  );
}