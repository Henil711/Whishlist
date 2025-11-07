import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import productsRouter from './routes/products.js';
import notificationsRouter from './routes/notifications.js';
import { priceTracker } from './jobs/price-tracker.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);

  priceTracker.start(60);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  priceTracker.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  priceTracker.stop();
  process.exit(0);
});
