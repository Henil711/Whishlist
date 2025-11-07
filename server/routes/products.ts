import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../supabase.js';
import { scrapeProduct, detectPlatform } from '../scrapers/index.js';
import { AddProductRequest, UpdateProductRequest } from '../types.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ products: data });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { url, target_price }: AddProductRequest = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const existingProduct = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('user_id', req.user!.id)
      .eq('url', url)
      .maybeSingle();

    if (existingProduct.data) {
      res.status(400).json({ error: 'Product already in your wishlist' });
      return;
    }

    const startTime = Date.now();
    let scrapedData;

    try {
      scrapedData = await scrapeProduct(url);
    } catch (scrapeError) {
      await supabaseAdmin.from('scraping_logs').insert({
        status: 'failed',
        error_message: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
        response_time: Date.now() - startTime,
      });

      res.status(400).json({
        error: 'Failed to scrape product data',
        details: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
      });
      return;
    }

    const platform = detectPlatform(url);

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        user_id: req.user!.id,
        url,
        platform,
        product_id: scrapedData.product_id,
        title: scrapedData.title,
        image_url: scrapedData.image_url,
        current_price: scrapedData.price,
        currency: scrapedData.currency,
        target_price,
        lowest_price: scrapedData.price,
        highest_price: scrapedData.price,
        is_available: scrapedData.is_available,
        last_checked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    if (scrapedData.price) {
      await supabaseAdmin.from('price_history').insert({
        product_id: product.id,
        price: scrapedData.price,
        currency: scrapedData.currency,
        is_available: scrapedData.is_available,
      });
    }

    await supabaseAdmin.from('scraping_logs').insert({
      product_id: product.id,
      status: 'success',
      response_time: Date.now() - startTime,
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { target_price, check_frequency }: UpdateProductRequest = req.body;

    const updateData: Partial<UpdateProductRequest> = {};
    if (target_price !== undefined) updateData.target_price = target_price;
    if (check_frequency !== undefined) updateData.check_frequency = check_frequency;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error || !product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) throw error;

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post('/:id/refresh', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (fetchError || !product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const startTime = Date.now();
    let scrapedData;

    try {
      scrapedData = await scrapeProduct(product.url);
    } catch (scrapeError) {
      await supabaseAdmin.from('scraping_logs').insert({
        product_id: id,
        status: 'failed',
        error_message: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
        response_time: Date.now() - startTime,
      });

      res.status(500).json({
        error: 'Failed to refresh product data',
        details: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
      });
      return;
    }

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

    const { data: updatedProduct, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (scrapedData.price) {
      await supabaseAdmin.from('price_history').insert({
        product_id: id,
        price: scrapedData.price,
        currency: scrapedData.currency,
        is_available: scrapedData.is_available,
      });

      if (
        product.current_price &&
        scrapedData.price < product.current_price &&
        (!product.target_price || scrapedData.price <= product.target_price)
      ) {
        await supabaseAdmin.from('notifications').insert({
          user_id: req.user!.id,
          product_id: id,
          type: 'price_drop',
          title: 'Price Drop Alert',
          message: `${product.title} price dropped from ${product.currency} ${product.current_price} to ${scrapedData.currency} ${scrapedData.price}`,
          old_price: product.current_price,
          new_price: scrapedData.price,
        });
      }
    }

    await supabaseAdmin.from('scraping_logs').insert({
      product_id: id,
      status: 'success',
      response_time: Date.now() - startTime,
    });

    res.json({ product: updatedProduct });
  } catch (error) {
    console.error('Error refreshing product:', error);
    res.status(500).json({ error: 'Failed to refresh product' });
  }
});

router.get('/:id/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '30' } = req.query;

    const { data: product } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .eq('product_id', id)
      .order('checked_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json({ history: data });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

export default router;
