// src/components/QuestionList.jsx
'use client';
import { useState, useEffect } from 'react';

export default function QuestionList({ questions, onStatusUpdate, searchTerm }) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const filteredQuestions = questions.filter(q =>
    q.questionNumber.toString().includes(searchTerm) ||
    q.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateStatus = async (questionId, newStatus) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: questionId,
          status: newStatus
        }),
      });

      if (response.ok) {
        onStatusUpdate(questionId, newStatus);
      } else {
        alert('Failed to update question status');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating question status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': 'bg-green-600 text-green-100',
      'need_check': 'bg-yellow-600 text-yellow-100'
    };
    return badges[status] || 'bg-gray-600 text-gray-100';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') {
      return (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div>
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg">No questions found</p>
          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new problem</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => (
            <div 
              key={question._id} 
              className="bg-gray-700 border border-gray-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:border-gray-500"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-blue-100">
                        {question.questionNumber}.
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(question.status)}`}>
                        {getStatusIcon(question.status)}
                        {question.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedQuestion(
                        selectedQuestion?._id === question._id ? null : question
                      )}
                      className="text-left hover:text-blue-400 transition-colors duration-200 text-white font-medium text-lg leading-relaxed"
                    >
                      {question.title}
                    </button>
                    
                    <p className="text-sm text-gray-400 mt-2 flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Added: {new Date(question.createdAt).toLocaleDateString()}
                    </p>

                    {selectedQuestion?._id === question._id && (
                      <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600 animate-slideDown">
                        <h4 className="font-semibold mb-3 text-white flex items-center gap-2">
                          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Problem Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-300"><strong className="text-white">Number:</strong> {question.questionNumber}</p>
                          <p className="text-gray-300"><strong className="text-white">Title:</strong> {question.title}</p>
                          <p className="text-gray-300"><strong className="text-white">Status:</strong> {question.status.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-gray-300"><strong className="text-white">Added:</strong> {new Date(question.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {question.status === 'need_check' && (
                      <button
                        onClick={() => updateStatus(question._id, 'completed')}
                        className="px-4 py-2 bg-green-600 cursor-pointer text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </button>
                    )}
                    {question.status === 'completed' && (
                      <button
                        onClick={() => updateStatus(question._id, 'need_check')}
                        className="px-4 py-2 bg-yellow-600 text-white cursor-pointer text-sm rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}