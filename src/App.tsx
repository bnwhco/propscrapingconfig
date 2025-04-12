import { useState, useEffect, useCallback } from 'react';
// Import the specific type for the user object
import type { AuthUser } from 'aws-amplify/auth';
import './App.css'; // Create this file for styling
import { useScraper } from './hooks/useScraper';
import { useConfig } from './hooks/useConfig';
import PropertyList from './components/PropertyList';
import DataMappingTable from './components/DataMappingTable';
import UrlInput from './components/UrlInput';
import LoadingSpinner from './components/LoadingSpinner';
import type { ScrapedField, ScrapedDataResult } from './types';

// Define props received specifically from the Authenticator's render prop
interface AuthenticatorRenderProps {
  signOut?: () => void; // signOut is usually a function, make it optional just in case
  user?: AuthUser;     // user object is optional (present only when logged in)
}

// Use these types for the App component's props
interface AppProps extends AuthenticatorRenderProps {}


function App({ signOut, user }: AppProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState(''); // URL submitted for scraping
  const [scrapedData, setScrapedData] = useState<ScrapedDataResult | null>(null);
  const [currentMappings, setCurrentMappings] = useState<Record<string, string>>({});
  const [activePropertyUrl, setActivePropertyUrl] = useState<string | null>(null); // For detail view

  const { loading: scrapingLoading, error: scrapingError, scrapeUrl } = useScraper();
  const { configs, loading: configLoading, error: configError, saveConfig, fetchConfigs } = useConfig();

  // Get active tab URL on initial load (runs in side panel context)
  useEffect(() => {
    if (chrome.tabs) { // Check if running in extension context
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url && tabs[0].url !== currentUrl) {
          setCurrentUrl(tabs[0].url);
          setTargetUrl(tabs[0].url); // Pre-fill input
          console.log("Initial URL:", tabs[0].url)
        }
      });
    }
  }, []); // Empty dependency array - run once

  // Handler for URL input submission
  const handleScrapeRequest = useCallback(async (urlToScrape: string) => {
    setTargetUrl(urlToScrape);
    setActivePropertyUrl(null); // Reset detail view
    setScrapedData(null);     // Clear previous results
    setCurrentMappings({});   // Clear previous mappings
    console.log(`Requesting scrape for: ${urlToScrape}`);
    const result = await scrapeUrl(urlToScrape);
    if (result) {
      setScrapedData(result);
      // Load existing config for this domain if available
      const domainConfig = configs.find(c => c.domain === result.domain);
      if (domainConfig) {
        setCurrentMappings(domainConfig.fieldMappings);
        console.log("Loaded existing config for domain:", result.domain);
      } else {
         console.log("No existing config found for domain:", result.domain);
      }
    }
  }, [scrapeUrl, configs]); // Depend on scrapeUrl and configs

  // Handler for scraping a detail page
  const handleScrapeDetail = useCallback(async (detailUrl: string) => {
     setActivePropertyUrl(detailUrl);
     const result = await scrapeUrl(detailUrl);
     if (result && scrapedData) {
         // Combine detail fields with existing list fields
         const combinedFields = [
             ...scrapedData.fields.filter(f => f.source === 'list'), // Keep original list fields
             ...result.fields.filter(f => f.source === 'detail') // Add new detail fields
         ];
         setScrapedData({ ...result, fields: combinedFields }); // Update state
     }
  }, [scrapeUrl, scrapedData]);

  // Handler for mapping changes
  const handleMappingChange = useCallback((scrapedField: string, desiredField: string) => {
    setCurrentMappings(prev => ({
      ...prev,
      [scrapedField]: desiredField,
    }));
  }, []);

  // Handler for saving the config
  const handleSaveConfig = useCallback(async () => {
    if (scrapedData?.domain) {
      console.log("Saving config for domain:", scrapedData.domain, currentMappings);
      await saveConfig(scrapedData.domain, currentMappings);
      // Optionally refetch configs, though useConfig hook might handle this
      // fetchConfigs();
    } else {
        console.error("Cannot save config, domain information missing.");
    }
  }, [scrapedData, currentMappings, saveConfig]);

  // Combine loading states
  const isLoading = scrapingLoading || configLoading;
  // Combine errors
  const error = scrapingError || configError;
 // --- Check if user and signOut exist before using them ---
 const handleSignOut = () => {
  if (signOut) {
    signOut();
  } else {
    console.error("SignOut function not available.");
    // Handle error appropriately, maybe show a message
  }
};
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Property Scraper</h1>
        {/* Check if user exists before accessing attributes */}
        {user && <p>Welcome, {user.signInDetails?.loginId ?? user.username ?? 'User'}!</p>}
        {/* Ensure signOut exists before rendering the button or disable it */}
        <button onClick={handleSignOut} disabled={!signOut} className="signout-button">Sign Out</button>
      </header>

      <main className="main-content">
        <div className="left-panel">
          <UrlInput
             initialUrl={targetUrl}
             onSubmit={handleScrapeRequest}
             isLoading={isLoading}
           />
           {/* Show Property List only if list data is available */}
           {scrapedData?.sourceType === 'list' && (
               <PropertyList
                   fields={scrapedData.fields.filter(f => f.source === 'list')}
                   onScrapeDetail={handleScrapeDetail} // Pass handler
               />
           )}
            {/* Display current detail URL if active */}
           {activePropertyUrl && <p className="detail-url-indicator">Detail view active for: {activePropertyUrl}</p>}
        </div>

        <div className="right-panel">
          {isLoading && <LoadingSpinner />}
          {error && <p className="error-message">Error: {error}</p>}

          {scrapedData && scrapedData.fields.length > 0 && (
            <>
              <h2>Scraped Data Fields ({scrapedData.domain} - {scrapedData.sourceType})</h2>
              <DataMappingTable
                scrapedFields={scrapedData.fields}
                mappings={currentMappings}
                onMappingChange={handleMappingChange}
              />
              <button
                onClick={handleSaveConfig}
                disabled={isLoading || !scrapedData?.domain}
                className="save-config-button"
              >
                {isLoading ? 'Saving...' : `Save Config for ${scrapedData.domain}`}
              </button>
            </>
          )}
           {scrapedData && scrapedData.fields.length === 0 && !isLoading && !error && (
               <p>No data fields were scraped. Check the URL or website structure.</p>
           )}
           {/* Display backend error if scraping returned one */}
           {scrapedData?.error && <p className="error-message">Scraper Note: {scrapedData.error}</p>}
        </div>
      </main>
    </div>
  );
}

export default App;