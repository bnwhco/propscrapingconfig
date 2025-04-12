// Types shared between frontend and potentially backend (Lambda response)

/** Represents a single piece of data scraped from a page */
export interface ScrapedField {
    fieldName: string;
    fieldValue?: string | null; // Value might be absent (e.g., list view) or null
    source: 'list' | 'detail' | 'other'; // Origin of the data
}

/** Represents the overall result from the scraping Lambda function */
export interface ScrapedDataResult {
    fields: ScrapedField[];
    sourceType: 'list' | 'detail' | 'other';
    domain: string; // The detected domain the data came from
    error?: string; // Optional error message from the scraper
}

/** Represents the structure of the domain configuration stored in DynamoDB */
export interface DomainConfigData {
    // id: string; // Removed as domain is the primary key
    domain: string; // The domain name (e.g., realestate.com.au) - Primary Key
    fieldMappings: Record<string, string>; // { scrapedFieldName: desiredFieldName }
    createdAt?: string; // Optional timestamp from DB
    updatedAt?: string; // Optional timestamp from DB
}