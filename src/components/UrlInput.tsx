import React, { useState, useEffect } from 'react';

interface UrlInputProps {
  initialUrl?: string;
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ initialUrl = '', onSubmit, isLoading }) => {
  const [url, setUrl] = useState(initialUrl);

  // Update local state if initialUrl prop changes
  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (url && !isLoading) {
      onSubmit(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL (e.g., realestate.com.au/...)"
        required
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !url}>
        {isLoading ? 'Scraping...' : 'Scrape URL'}
      </button>
    </form>
  );
};

export default UrlInput;