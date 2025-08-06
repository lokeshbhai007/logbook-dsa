// src/app/page.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import QuestionForm from '@/components/QuestionForm';
import QuestionList from '@/components/QuestionList';

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  
  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const fetchQuestions = useCallback(async (status = null, search = '', page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '10');
      
      const response = await fetch(`/api/questions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      
      if (append) {
        setQuestions(prev => [...prev, ...data.questions]);
      } else {
        setQuestions(data.questions);
      }
      
      setHasMore(data.pagination.hasMore);
      setCurrentPage(data.pagination.currentPage);
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Reset and fetch questions when tab or search changes
  useEffect(() => {
    const status = activeTab === 'all' ? null : activeTab;
    setCurrentPage(1);
    setHasMore(true);
    fetchQuestions(status, debouncedSearchTerm, 1, false);
  }, [activeTab, debouncedSearchTerm, fetchQuestions]);

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore || isLoading) return;

      const scrollTop = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Trigger load more when user is 100px from bottom
      if (scrollTop + windowHeight >= documentHeight - 100) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, isLoading]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      const status = activeTab === 'all' ? null : activeTab;
      fetchQuestions(status, debouncedSearchTerm, currentPage + 1, true);
    }
  }, [hasMore, isLoadingMore, isLoading, activeTab, debouncedSearchTerm, currentPage, fetchQuestions]);

  const handleQuestionAdded = (newQuestion) => {
    // Add to the beginning of the list if it matches current filter
    if (activeTab === 'all' || activeTab === newQuestion.status) {
      setQuestions(prev => [newQuestion, ...prev]);
    }
  };

  const handleStatusUpdate = (questionId, newStatus) => {
    setQuestions(prev =>
      prev.map(q =>
        q._id === questionId
          ? { ...q, status: newStatus, updatedAt: new Date() }
          : q
      )
    );
  };

  // Filter questions based on search term (client-side filtering for loaded questions)
  const filteredQuestions = questions.filter(q =>
    q.questionNumber.toString().includes(searchTerm) ||
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQuestionCount = (status) => {
    if (status === 'all') return questions.length;
    return questions.filter(q => q.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            LeetCode Problem Logbook
          </h1>
          <p className="text-gray-400">Track your coding progress with style</p>
        </div>

        <QuestionForm onQuestionAdded={handleQuestionAdded} />

        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by problem number or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg">
              {[
                { key: 'all', label: 'All Problems', color: 'blue' },
                { key: 'completed', label: 'Completed', color: 'green' },
                { key: 'need_check', label: 'Need Check', color: 'yellow' }
              ].map(({ key, label, color }) => {
                const count = getQuestionCount(key);
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-2 cursor-pointer px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === key
                        ? `bg-${color}-600 text-white shadow-lg`
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-300">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  const status = activeTab === 'all' ? null : activeTab;
                  fetchQuestions(status, debouncedSearchTerm, 1, false);
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading questions...</p>
            </div>
          ) : (
            <>
              <QuestionList
                questions={filteredQuestions}
                onStatusUpdate={handleStatusUpdate}
                searchTerm={searchTerm}
              />
              
              {/* Load More Indicator */}
              {isLoadingMore && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-gray-400">Loading more questions...</p>
                </div>
              )}
              
              {/* End of Results */}
              {!hasMore && questions.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">You've reached the end of the list</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}