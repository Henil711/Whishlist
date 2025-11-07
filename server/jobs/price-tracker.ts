import { supabaseAdmin } from '../supabase.js';
import { scrapeProduct } from '../scrapers/index.js';
import { Product } from '../types.js';

export class PriceTracker {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start(intervalMinutes: number = 60) {
    if (this.isRunning) {
      console.log('Price tracker is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting price tracker with ${intervalMinutes} minute interval`);

    this.checkProducts();

    this.interval = setInterval(() => {
      this.checkProducts();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Price tracker stopped');
  }

  private async checkProducts() {
    try {
      console.log('Starting product price check...');

      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      if (!products || products.length === 0) {
        console.log('No products to check');
        return;
      }

      const productsToCheck = products.filter((product: Product) => {
        if (!product.last_checked_at) return true;

        const lastChecked = new Date(product.last_checked_at);
        const hoursSinceCheck =
          (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60);

        return hoursSinceCheck >= product.check_frequency;
      });

      console.log(`Checking ${productsToCheck.length} out of ${products.length} products`);

      for (const product of productsToCheck) {
        await this.checkProduct(product);
        await this.delay(2000);
      }

      console.log('Product price check completed');
    } catch (error) {
      console.error('Error in price tracker:', error);
    }
  }

  private async checkProduct(product: Product) {
    const startTime = Date.now();

    try {
      console.log(`Checking product: ${product.title}`);

      const scrapedData = await scrapeProduct(product.url);

      const updateData: any = {
        current_price: scrapedData.price,
        is_available: scrapedData.is_available,
        last_checked_at: new Date().toISOString(),
      };

      if (scrapedData.price) {
        if (!product.lowest_price || scrapedData.price < product.lowest_price) {
          updateData.lowest_price = scrapedData.price;
        }
        if (!product.highest_price || scrapedData.price > product.highest_price) {
          updateData.highest_price = scrapedData.price;
        }
      }

      await supabaseAdmin
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (scrapedData.price) {
        await supabaseAdmin.from('price_history').insert({
          product_id: product.id,
          price: scrapedData.price,
          currency: scrapedData.currency,
          is_available: scrapedData.is_available,
        });

        if (
          product.current_price &&
          scrapedData.price < product.current_price
        ) {
          const priceDropPercentage =
            ((product.current_price - scrapedData.price) / product.current_price) * 100;

          if (
            priceDropPercentage >= 5 ||
            (product.target_price && scrapedData.price <= product.target_price)
          ) {
            await supabaseAdmin.from('notifications').insert({
              user_id: product.user_id,
              product_id: product.id,
              type: product.target_price && scrapedData.price <= product.target_price
                ? 'target_reached'
                : 'price_drop',
              title: 'Price Drop Alert',
              message: `${product.title} price dropped from ${product.currency} ${product.current_price} to ${scrapedData.currency} ${scrapedData.price} (${priceDropPercentage.toFixed(1)}% off)`,
              old_price: product.current_price,
              new_price: scrapedData.price,
            });

            console.log(`Price drop notification created for product: ${product.title}`);
          }
        }

        if (!product.is_available && scrapedData.is_available) {
          await supabaseAdmin.from('notifications').insert({
            user_id: product.user_id,
            product_id: product.id,
            type: 'back_in_stock',
            title: 'Back in Stock',
            message: `${product.title} is now back in stock!`,
          });

          console.log(`Back in stock notification created for product: ${product.title}`);
        }
      }

      await supabaseAdmin.from('scraping_logs').insert({
        product_id: product.id,
        status: 'success',
        response_time: Date.now() - startTime,
      });

      console.log(`Successfully checked product: ${product.title}`);
    } catch (error) {
      console.error(`Error checking product ${product.title}:`, error);

      await supabaseAdmin.from('scraping_logs').insert({
        product_id: product.id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        response_time: Date.now() - startTime,
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const priceTracker = new PriceTracker();
