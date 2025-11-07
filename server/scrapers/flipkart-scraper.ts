import { chromium } from 'playwright';
import { BaseScraper } from './base-scraper.js';
import { ScrapedProductData } from '../types.js';

export class FlipkartScraper extends BaseScraper {
  canHandle(url: string): boolean {
    return url.includes('flipkart.com');
  }

  protected extractProductId(url: string): string | null {
    const match = url.match(/pid=([A-Z0-9]+)/i);
    return match ? match[1] : null;
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
        locale: 'en-IN',
      });

      const page = await context.newPage();
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.delay(Math.random() * 2000 + 1000);

      const title = await page
        .locator('span.VU-ZEz, h1.yhB1nd')
        .first()
        .textContent()
        .catch(() => null);

      let price: number | undefined;
      let currency = 'INR';

      const priceSelectors = [
        'div.Nx9bqj.CxhGGd',
        'div._30jeq3._16Jk6d',
        'div._25b18c div._30jeq3',
      ];

      for (const selector of priceSelectors) {
        const priceText = await page.locator(selector).first().textContent().catch(() => null);
        if (priceText) {
          price = this.normalizePrice(priceText);
          currency = this.extractCurrency(priceText);
          if (price !== undefined) break;
        }
      }

      const imageUrl = await page
        .locator('img.DByuf4')
        .first()
        .getAttribute('src')
        .catch(() => undefined);

      const availabilityText = await page
        .locator('button._2KpZ6l._2U9uOA')
        .first()
        .textContent()
        .catch(() => 'ADD TO CART');

      const isAvailable =
        availabilityText?.toLowerCase().includes('add to cart') ||
        availabilityText?.toLowerCase().includes('buy now');

      const productId = this.extractProductId(url) || url;

      await browser.close();

      if (!title) {
        throw new Error('Could not extract product title');
      }

      return {
        title: title.trim(),
        price,
        currency,
        image_url: imageUrl,
        is_available: isAvailable,
        product_id: productId,
      };
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
}
