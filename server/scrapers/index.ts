import { BaseScraper } from './base-scraper.js';
import { AmazonScraper } from './amazon-scraper.js';
import { FlipkartScraper } from './flipkart-scraper.js';
import { GenericScraper } from './generic-scraper.js';
import { ScrapedProductData } from '../types.js';

const scrapers: BaseScraper[] = [
  new AmazonScraper(),
  new FlipkartScraper(),
  new GenericScraper(),
];

export async function scrapeProduct(url: string): Promise<ScrapedProductData> {
  const scraper = scrapers.find((s) => s.canHandle(url));

  if (!scraper) {
    throw new Error('No suitable scraper found for URL');
  }

  return await scraper.scrape(url);
}

export function detectPlatform(url: string): string {
  if (url.includes('amazon.com') || url.includes('amazon.in')) return 'amazon';
  if (url.includes('flipkart.com')) return 'flipkart';
  if (url.includes('walmart.com')) return 'walmart';
  if (url.includes('aliexpress.com')) return 'aliexpress';
  return 'other';
}
