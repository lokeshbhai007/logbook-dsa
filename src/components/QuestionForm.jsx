// src/components/QuestionForm.jsx
'use client';
import { useState } from 'react';

export default function QuestionForm({ onQuestionAdded }) {
  const [questionNumber, setQuestionNumber] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState('');

  const fetchTitle = async () => {
    if (!questionNumber) return;
    
    setIsFetching(true);
    setError('');
    
    try {
      const response = await fetch('/api/fetch-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionNumber }),
      });

      if (response.ok) {
        const data = await response.json();
        setTitle(data.title);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch problem title');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error fetching problem title. Please check your connection.');
    } finally {
      setIsFetching(false);
    }
  };

  const addQuestion = async () => {
    if (!questionNumber || !title) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionNumber: parseInt(questionNumber),
          title,
          status: 'need_check'
        }),
      });

      if (response.ok) {
        const newQuestion = await response.json();
        onQuestionAdded(newQuestion);
        setQuestionNumber('');
        setTitle('');
        setError('');
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setError('This problem number already exists in your logbook!');
        } else {
          setError(errorData.error || 'Failed to add question');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error adding question. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (!title && questionNumber) {
        fetchTitle();
      } else if (title && questionNumber) {
        addQuestion();
      }
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-6 border border-gray-700">
      <div className="flex items-center mb-4">
        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-white">Add New Problem</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg animate-fadeIn">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <input
            type="number"
            placeholder="LeetCode Problem Number"
            value={questionNumber}
            onChange={(e) => {
              setQuestionNumber(e.target.value);
              setTitle(''); // Clear title when number changes
              setError('');
            }}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            min="1"
            max="9999"
          />
        </div>
        <button
          onClick={fetchTitle}
          disabled={!questionNumber || isFetching}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none flex items-center gap-2"
        >
          {isFetching && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isFetching ? 'Fetching...' : 'Fetch Title'}
        </button>
      </div>

      {title && (
        <div className="mb-4 animate-fadeIn">
          <p className="text-sm text-gray-400 mb-2">Problem Title:</p>
          <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
            <p className="text-white font-medium">{title}</p>
            <button
              onClick={() => setTitle('')}
              className="mt-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear and enter manually
            </button>
          </div>
        </div>
      )}

      {!title && questionNumber && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Or enter problem title manually..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      )}

      <button
        onClick={addQuestion}
        disabled={!questionNumber || !title || isLoading}
        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
      >
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        )}
        {isLoading ? 'Adding...' : 'Add Question'}
      </button>

      <div className="mt-3 text-xs text-gray-400 text-center">
        💡 Tip: Press Enter to fetch title or add question
      </div>
    </div>
  );
}