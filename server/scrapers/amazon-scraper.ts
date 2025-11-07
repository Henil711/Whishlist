import { chromium } from 'playwright';
import { BaseScraper } from './base-scraper.js';
import { ScrapedProductData } from '../types.js';

export class AmazonScraper extends BaseScraper {
  canHandle(url: string): boolean {
    return url.includes('amazon.com') || url.includes('amazon.in');
  }

  protected extractProductId(url: string): string | null {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
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
        locale: 'en-US',
      });

      const page = await context.newPage();

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await this.delay(Math.random() * 2000 + 1000);

      const title = await page
        .locator('#productTitle, #title')
        .first()
        .textContent()
        .catch(() => null);

      let price: number | undefined;
      let currency = 'USD';

      const priceSelectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price-whole',
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
        .locator('#landingImage, #imgBlkFront')
        .first()
        .getAttribute('src')
        .catch(() => undefined);

      const availabilityText = await page
        .locator('#availability span')
        .first()
        .textContent()
        .catch(() => 'In Stock');

      const isAvailable =
        !availabilityText?.toLowerCase().includes('unavailable') &&
        !availabilityText?.toLowerCase().includes('out of stock');

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
