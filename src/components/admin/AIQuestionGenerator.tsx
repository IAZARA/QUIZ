import React, { useState } from 'react';

const AIQuestionGenerator: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  // const [generatedQuestions, setGeneratedQuestions] = useState([]); // For later use

  const handleGenerateQuestions = async () => {
    if (!apiKey.trim()) {
      setMessage('Error: AI API Key is required.');
      return;
    }
    if (!topic.trim()) {
      setMessage('Error: Topic/Context is required.');
      return;
    }
    if (numQuestions <= 0) {
      setMessage('Error: Number of questions must be greater than 0.');
      return;
    }
    // Basic check for numQuestions greater than a reasonable max if desired, e.g. 20 as in input
    if (numQuestions > 20) {
        setMessage('Error: Number of questions cannot exceed 20 for a single request.');
        return;
    }


    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          aiProvider,
          topic,
          numQuestions,
        }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // data.error should contain the error message from the backend
        // data.details might contain more specific info from backend validation
        throw new Error(data.error || data.details || `HTTP error! status: ${response.status}`);
      }

      setMessage(`${data.count || 0} questions generated successfully! The question list should update via websockets if connected.`);
      // Optionally clear some form fields:
      // setTopic(''); // Topic might change for next batch
      // setNumQuestions(5); // Reset to default
      // Note: API key is often kept for subsequent requests in the same session.

    } catch (error: any) {
      console.error('Failed to generate questions:', error);
      setMessage(`Error generating questions: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-white shadow-xl rounded-lg max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">AI Question Generator</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            message.startsWith('Error') || message.startsWith('Placeholder: Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerateQuestions();
        }}
        className="space-y-6"
      >
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            AI API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter your AI API Key"
          />
        </div>

        <div>
          <label htmlFor="aiProvider" className="block text-sm font-medium text-gray-700 mb-1">
            AI Provider
          </label>
          <select
            id="aiProvider"
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="gemini">Gemini</option>
            {/* Future options can be added here */}
          </select>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic/Context for Questions
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Describe the subject, desired difficulty, and any specific focus for the questions..."
          />
        </div>

        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Questions to Generate
          </label>
          <input
            type="number"
            id="numQuestions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
            min="1"
            max="20" // Example max value
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex flex-col items-center space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Questions'
            )}
          </button>

          {isLoading && (
            <p className="text-sm text-gray-600">Generating questions, please wait...</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default AIQuestionGenerator;
