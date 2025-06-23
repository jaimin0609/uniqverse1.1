'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NewsletterFormProps {
  source?: string;
}

export default function NewsletterForm({ source = 'homepage' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your email address');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsError(false);
        setEmail(''); // Clear the form on success
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
        setIsError(true);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setMessage('Something went wrong. Please try again.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-grow px-4 py-2 rounded-md border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          required
          disabled={isLoading}
        />        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="min-w-[100px] bg-white text-black border border-gray-300 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:hover:text-gray-400"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Subscribing...</span>
            </div>
          ) : (
            'Subscribe'
          )}
        </Button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${isError
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
          {message}
        </div>
      )}
    </div>
  );
}
