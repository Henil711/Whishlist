import { chromium } from 'playwright';
import { BaseScraper } from './base-scraper.js';
import { ScrapedProductData } from '../types.js';

export class GenericScraper extends BaseScraper {
  canHandle(url: string): boolean {
    return true;
  }

  async scrape(url: string): Promise<ScrapedProductData> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const context = await browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.delay(Math.random() * 2000 + 1000);

      const title = await page.title();

      const priceSelectors = [
        '.price',
        'meta[property="product:price:amount"]',
        '[class*="price"]',
        '[id*="price"]',
        '[data-price]',
        'meta[property="og:price:amount"]',
        'meta[itemprop="price"]',
      ];

      let price: number | undefined;
      let currency = 'USD';
      let candidatePrices: number[] = [];
      let detectedCurrency: string | undefined;

      for (const selector of priceSelectors) {
        try {
          if (selector.startsWith('meta')) {
            const content = await page.getAttribute(selector, 'content');
            if (content) {
              const extracted = this.extractValidPrices(content);
              candidatePrices.push(...extracted);

              detectedCurrency = this.extractCurrency(content);
            }
          } else {
            const el = page.locator(selector).first();
            const priceText = await el.textContent().catch(() => null);
            if (priceText) {
              const extracted = this.extractValidPrices(priceText);
              candidatePrices.push(...extracted);

              detectedCurrency = this.extractCurrency(priceText);
            }
          }
          if (candidatePrices.length > 0 && detectedCurrency) {
            break;
          }
        } catch {
          continue;
        }
      }

      candidatePrices = [...new Set(candidatePrices)].sort((a, b) => a - b);

      price = candidatePrices.length > 0 ? candidatePrices[0] : undefined;

      if (!detectedCurrency) {
        const metaCurrency = await page.getAttribute(
          'meta[property="product:price:currency"], meta[itemprop="priceCurrency"]',
          'content'
        );
        detectedCurrency = metaCurrency || 'INR';
      }

      currency = detectedCurrency;

      const imageSelectors = [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        '[class*="product"] img',
        'img[itemprop="image"]',
      ];

      let imageUrl: string | undefined;

      for (const selector of imageSelectors) {
        try {
          if (selector.startsWith('meta')) {
            imageUrl = (await page.getAttribute(selector, 'content')) || undefined;
          } else {
            imageUrl = (await page.locator(selector).first().getAttribute('src')) || undefined;
          }
          if (imageUrl) break;
        } catch {
          continue;
        }
      }

      await browser.close();

      return {
        title: title || 'Product',
        price,
        currency,
        image_url: imageUrl,
        is_available: true,
        product_id: url,
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}
