import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import playwright from 'playwright-aws-lambda';
import { load } from 'cheerio';

// Define expected types (should match frontend types/index.ts)
interface ScrapedField {
  fieldName: string;
  fieldValue?: string | null;
  source: 'list' | 'detail' | 'other';
}
interface ScrapedDataResult {
  fields: ScrapedField[];
  sourceType: 'list' | 'detail' | 'other';
  domain: string; // Include the detected domain in the result
  error?: string;
}

// --- Helper: Define scraping logic per domain ---
// IMPORTANT: These selectors are EXAMPLES and WILL break.
// You MUST inspect the target websites and update these regularly.
const scrapeRealEstateComAu = (html: string, url: string): ScrapedDataResult => {
  const $ = load(html);
  const fields: ScrapedField[] = [];
  let sourceType: ScrapedDataResult['sourceType'] = 'other';

  if (url.includes('/buy/') || url.includes('/rent/') || url.includes('/sold/')) { // Basic check for list page
    sourceType = 'list';
    // Example selectors for LIST page (highly likely to change)
    $('article[data-testid^="listing-card"]').each((_i, card) => {
        const $card = $(card);
        const address = $card.find('a[data-testid="listing-card-link"]').text().trim();
        const price = $card.find('span[data-testid="listing-card-price"]').text().trim();
        fields.push({ fieldName: 'address_list', fieldValue: address || 'Not Found', source: 'list'});
        fields.push({ fieldName: 'price_list', fieldValue: price || 'Not Found', source: 'list'});
        // Add more features: beds, baths, cars
        $card.find('span[data-testid="property-features-text-container"]').each((_j, feature) => {
             const featureText = $(feature).text().toLowerCase();
             if(featureText.includes('bed')) fields.push({ fieldName: 'beds_list', fieldValue: featureText, source: 'list'});
             if(featureText.includes('bath')) fields.push({ fieldName: 'baths_list', fieldValue: featureText, source: 'list'});
             if(featureText.includes('car')) fields.push({ fieldName: 'cars_list', fieldValue: featureText, source: 'list'});
        });
        // Extract only the *first* property's list fields for the mapping table example
        return false; // Stop after the first card for simplicity in this example
    });
  } else if (url.includes('/property-')) { // Basic check for detail page
    sourceType = 'detail';
    // Example selectors for DETAIL page (highly likely to change)
    const detailPrice = $('span[data-testid="listing-details__summary-title"]').first().text().trim();
    fields.push({ fieldName: 'price_detail', fieldValue: detailPrice || 'Not Found', source: 'detail' });
    const address = $('h1[data-testid="listing-details__button-copy-wrapper-address"]').text().trim();
    fields.push({ fieldName: 'address_detail', fieldValue: address || 'Not Found', source: 'detail' });
    const description = $('div[data-testid="listing-details__description"]').text().trim();
    fields.push({ fieldName: 'description_detail', fieldValue: description || 'Not Found', source: 'detail' });
    $('div[data-testid="listing-details-property-features-wrapper"] span.rui-sc-7k6r01-2').each((_i, el) => {
      const featureText = $(el).text().trim();
      if (featureText) fields.push({ fieldName: `feature_${featureText.split(' ')[0].toLowerCase()}_detail`, fieldValue: featureText, source: 'detail' });
    });
    // Add many more selectors...
  }

  return { fields, sourceType, domain: 'realestate.com.au', error: fields.length === 0 ? 'No fields found, check selectors.' : undefined };
};

const scrapeDomainComAu = (html: string, url: string): ScrapedDataResult => {
  const $ = load(html);
  const fields: ScrapedField[] = [];
  let sourceType: ScrapedDataResult['sourceType'] = 'other';

   if (url.includes('/sale/') || url.includes('/rent/')) { // List page
       sourceType = 'list';
       // Domain LIST selectors - NEEDS IMPLEMENTATION & VERIFICATION
        fields.push({ fieldName: 'price_list_domain', fieldValue: 'TODO: Scrape Domain list price', source: 'list' });
        fields.push({ fieldName: 'address_list_domain', fieldValue: 'TODO: Scrape Domain list address', source: 'list' });
        // Extract only the *first* property's list fields for the mapping table example
   } else if (/\d{8,}/.test(url)) { // Detail page (heuristic based on property ID in URL)
       sourceType = 'detail';
       // Domain DETAIL selectors - NEEDS IMPLEMENTATION & VERIFICATION
       fields.push({ fieldName: 'price_detail_domain', fieldValue: 'TODO: Scrape Domain detail price', source: 'detail' });
       fields.push({ fieldName: 'address_detail_domain', fieldValue: 'TODO: Scrape Domain detail address', source: 'detail' });
       fields.push({ fieldName: 'description_detail_domain', fieldValue: 'TODO: Scrape Domain description', source: 'detail' });
   }

   return { fields, sourceType, domain: 'domain.com.au', error: fields.length === 0 ? 'No fields found, check selectors.' : undefined };
};

// --- Lambda Handler ---
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  console.log('EVENT:', JSON.stringify(event));

  const url = event.queryStringParameters?.url;
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url query parameter' }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, // Add CORS
    };
  }

  let browser = null;
  let result: ScrapedDataResult = { fields: [], sourceType: 'other', domain: '', error: 'Initialization error' };

  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.replace(/^www\./, '');
    result.domain = domain; // Store domain in result

    console.log(`Attempting to scrape: ${url} (Domain: ${domain})`);

    browser = await playwright.launchChromium({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', // Realistic UA
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); // Wait longer, maybe 'networkidle'
    // Optional: Add slight delay after load
    await page.waitForTimeout(1500);

    const html = await page.content();
    await browser.close(); // Close browser as soon as content is fetched

    // --- Domain-Specific Scraping Logic ---
    if (domain.includes('realestate.com.au')) {
      result = scrapeRealEstateComAu(html, url);
    } else if (domain.includes('domain.com.au')) {
      result = scrapeDomainComAu(html, url);
    } else if (domain.includes('valuergeneral.nsw.gov.au')) {
      // Requires Playwright Interaction - Complex & Prone to CAPTCHA failure
      result.error = "Scraping Valuer General requires complex interaction and CAPTCHA handling, which is not fully implemented and may violate terms of service.";
      // Placeholder - Add interaction logic if attempting (see previous answer)
      // browser = await playwright.launchChromium... page.goto... page.fill... page.click...
    } else {
      result.error = `Domain not supported: ${domain}`;
    }

    console.log(`Scraping finished for ${domain}. Found ${result.fields.length} fields. Error: ${result.error || 'None'}`);

  } catch (err: any) {
    console.error('Scraping Lambda Error:', err);
    result.error = `Scraping failed: ${err.message || 'Unknown error'}`;
    if (browser) {
      try { await browser.close(); } catch (closeErr) { console.error("Error closing browser:", closeErr); }
    }
  }

  // --- Return Result ---
  return {
    statusCode: result.error && result.fields.length === 0 ? 500 : 200,
    body: JSON.stringify(result),
    headers: {
      'Content-Type': 'application/json',
      // IMPORTANT: CORS Headers for browser access
      'Access-Control-Allow-Origin': '*', // Restrict in production if possible
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and preflight OPTIONS
    },
  };
};