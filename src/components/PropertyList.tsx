import React from 'react';
import type { ScrapedField } from '../types';

interface PropertyListProps {
  fields: ScrapedField[]; // Expects only fields with source: 'list'
  onScrapeDetail: (url: string) => void; // Callback to trigger detail scraping
}

// Basic heuristic to extract a potential detail URL from list fields
// This is VERY fragile and specific to current site structures.
const extractDetailUrl = (fields: ScrapedField[], domain: string): string | null => {
    // Example for realestate.com.au (look for address field, assume link structure)
    // THIS NEEDS REFINEMENT based on actual scraped data
    const addressField = fields.find(f => f.fieldName === 'address_list');
    // In reality, the scraper lambda should try to extract the detail URL directly
    // and include it as a specific field (e.g., 'detail_url_list').
    // For now, return a placeholder or null.
    console.warn("Detail URL extraction is a placeholder. Scraper should provide it.");
    return null; // Needs proper implementation
};

const PropertyList: React.FC<PropertyListProps> = ({ fields, onScrapeDetail }) => {
  // Group fields by some property identifier if possible, or just show the first one
  // For simplicity, assume fields represent the *first* property found in the list scrape
  const address = fields.find(f => f.fieldName === 'address_list')?.fieldValue || 'N/A';
  const price = fields.find(f => f.fieldName === 'price_list')?.fieldValue || 'N/A';
  const beds = fields.find(f => f.fieldName === 'beds_list')?.fieldValue || '?';
  const baths = fields.find(f => f.fieldName === 'baths_list')?.fieldValue || '?';
  const cars = fields.find(f => f.fieldName === 'cars_list')?.fieldValue || '?';

  // Attempt to get a detail URL (using placeholder logic)
  // This should ideally come directly from the scraper
  const detailUrl = extractDetailUrl(fields, 'realestate.com.au'); // Assume domain or get from data

  const handleDetailClick = () => {
    // Prompt user for detail URL since extraction is unreliable?
    const url = prompt("Please enter the detail page URL for this property:", "");
    if (url) {
        onScrapeDetail(url);
    } else {
        alert("Detail URL is required to scrape details.");
    }
    // if (detailUrl) {
    //   onScrapeDetail(detailUrl);
    // } else {
    //   alert("Could not determine detail URL for this property.");
    // }
  };

  return (
    <div className="property-list-item">
      <h3>Property Summary (from List)</h3>
      <p><strong>Address:</strong> {address}</p>
      <p><strong>Price:</strong> {price}</p>
      <p><strong>Features:</strong> {beds} | {baths} | {cars}</p>
      <button onClick={handleDetailClick} >
        Scrape Detail Page
      </button>
    </div>
  );
};

export default PropertyList;