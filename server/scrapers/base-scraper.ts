import { ScrapedProductData } from '../types.js';

export abstract class BaseScraper {
  protected userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  protected getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected extractProductId(url: string): string | null {
    return null;
  }

  protected normalizePrice(priceText: string): number | undefined {
    const cleaned = priceText.replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(/,/g, '');
    const price = parseFloat(normalized);
    return isNaN(price) ? undefined : price;
  }

  protected extractCurrency(priceText: string): string {
    const currencySymbols: { [key: string]: string } = {
      '$': 'USD',
      '₹': 'INR',
      '£': 'GBP',
      '€': 'EUR',
      '¥': 'JPY',
    };

    for (const [symbol, code] of Object.entries(currencySymbols)) {
      if (priceText.includes(symbol)) {
        return code;
      }
    }

    return 'USD';
  }

  abstract scrape(url: string): Promise<ScrapedProductData>;
  abstract canHandle(url: string): boolean;
}
