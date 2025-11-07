# Wishlist Price Tracker - Implementation Guide

## Overview

A comprehensive, production-ready price tracking application that monitors product prices across multiple e-commerce platforms including Amazon, Flipkart, Walmart, and AliExpress.

## Architecture

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- TailwindCSS for styling
- Recharts for price visualization
- Supabase Auth for authentication
- Lucide React for icons

**Backend:**
- Node.js with Express and TypeScript
- Playwright for web scraping
- Supabase for database and authentication
- Automated price tracking job system

**Database:**
- PostgreSQL via Supabase
- Row Level Security (RLS) enabled
- Automated profile creation on signup

## Database Schema

### Tables

1. **profiles** - User profile information
   - Extends Supabase auth.users
   - Stores notification preferences
   - Auto-created on user signup via trigger

2. **products** - Tracked products
   - Links to user profiles
   - Stores current and historical price data
   - Platform-specific product identifiers
   - Customizable check frequency

3. **price_history** - Historical price data
   - Timestamps for trend analysis
   - Availability tracking
   - Supports chart visualization

4. **notifications** - Price alerts
   - Multiple notification types (price_drop, back_in_stock, target_reached)
   - Read/unread status
   - Email sending capability

5. **scraping_logs** - Monitoring and debugging
   - Success/failure tracking
   - Response time metrics
   - Error messages

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

PORT=3001

SCRAPING_CONCURRENT_LIMIT=5
SCRAPING_RATE_LIMIT_DELAY=2000

NOTIFICATION_EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Database Setup

The database schema is already applied via Supabase migrations. It includes:
- All table definitions
- Row Level Security policies
- Indexes for optimized queries
- Triggers for auto-profile creation
- Functions for timestamp updates

### 3. Installation

```bash
npm install
```

### 4. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 5. Running the Application

**Development Mode:**

```bash
# Run frontend and backend together
npm run dev:all

# Or run separately:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

**Production Build:**

```bash
# Build frontend
npm run build

# Build backend
npm run build:server
```

## API Endpoints

### Authentication
Uses Supabase Auth - handled automatically by the frontend.

### Products

**GET /api/products**
- Fetch all products for authenticated user
- Returns array of products with current prices

**POST /api/products**
- Add a new product to track
- Body: `{ url: string, target_price?: number }`
- Automatically scrapes initial data

**GET /api/products/:id**
- Fetch single product details

**PATCH /api/products/:id**
- Update product settings
- Body: `{ target_price?: number, check_frequency?: number }`

**DELETE /api/products/:id**
- Remove product from tracking

**POST /api/products/:id/refresh**
- Manually refresh product price
- Creates notification if price dropped

**GET /api/products/:id/history**
- Fetch price history for charts
- Query param: `limit` (default: 30)

### Notifications

**GET /api/notifications**
- Fetch user notifications
- Query params: `limit`, `unread_only`

**PATCH /api/notifications/:id/read**
- Mark notification as read

**POST /api/notifications/mark-all-read**
- Mark all notifications as read

**DELETE /api/notifications/:id**
- Delete notification

## Web Scraping Architecture

### Scrapers

The application uses a modular scraper architecture:

1. **BaseScraper** - Abstract base class with common functionality
   - User agent rotation
   - Price normalization
   - Currency extraction
   - Delay mechanisms

2. **Platform-Specific Scrapers**
   - AmazonScraper - Handles Amazon.com and Amazon.in
   - FlipkartScraper - Handles Flipkart.com
   - GenericScraper - Fallback for other e-commerce sites

### Anti-Bot Measures

- **User Agent Rotation**: Random user agents for each request
- **Headless Browser**: Playwright with stealth mode
- **Rate Limiting**: Configurable delays between requests
- **Random Delays**: Human-like behavior simulation
- **Real Browser Context**: Full JavaScript rendering
- **Header Spoofing**: Accept-Language and other headers

### Scraping Strategy

```typescript
// Each scraper implements:
1. canHandle(url) - Check if scraper supports the URL
2. scrape(url) - Extract product data
3. Error handling and logging
4. Response time tracking
```

## Price Tracking System

### Automated Job System

**PriceTracker Class** (`server/jobs/price-tracker.ts`):
- Runs every 60 minutes by default
- Checks products based on `check_frequency` setting
- Respects individual product schedules
- Implements rate limiting (2 seconds between products)
- Creates notifications automatically

### Notification Logic

Price drop notifications are created when:
1. Price drops by 5% or more, OR
2. Price reaches or drops below target price

Back-in-stock notifications when:
- Product becomes available after being unavailable

### Price History

- Every scrape creates a price history entry
- Tracks lowest and highest prices automatically
- Used for trend visualization in charts

## Frontend Components

### Component Structure

```
src/
├── components/
│   ├── AuthForm.tsx           # Login/signup form
│   ├── Dashboard.tsx          # Main application view
│   ├── ProductCard.tsx        # Individual product display
│   ├── AddProductModal.tsx    # Add product dialog
│   ├── PriceHistoryModal.tsx  # Price chart visualization
│   └── NotificationPanel.tsx  # Notification dropdown
├── contexts/
│   └── AuthContext.tsx        # Authentication state
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── api.ts                # API client functions
└── App.tsx                   # Main app component
```

### Key Features

1. **Authentication**
   - Email/password authentication
   - Automatic session management
   - Protected routes

2. **Product Management**
   - Add products via URL
   - Set target price alerts
   - Manual refresh capability
   - Delete products

3. **Price Visualization**
   - Interactive line charts
   - Price history display
   - Min/max price statistics

4. **Notifications**
   - Real-time notification panel
   - Unread count badge
   - Mark as read functionality

## Security Considerations

### Row Level Security (RLS)

All database tables have RLS policies ensuring:
- Users can only access their own data
- Authenticated-only access
- Proper ownership checks

### API Security

- JWT-based authentication
- Authorization middleware on all routes
- Service role key never exposed to frontend
- Input validation on all endpoints

### Scraping Security

- No credentials stored in scraped data
- Error messages sanitized
- Rate limiting to prevent abuse
- Logging for monitoring

## Performance Optimization

### Database

- Indexes on frequently queried columns
- Efficient query patterns
- Connection pooling via Supabase
- Cascading deletes for cleanup

### Frontend

- Component-level state management
- Lazy loading for modals
- Optimistic updates where possible
- Debounced search/filtering

### Backend

- Concurrent scraping with limits
- Response caching opportunities
- Efficient job scheduling
- Browser instance reuse where safe

## Error Handling

### Scraping Errors

Logged to `scraping_logs` table with:
- Error type (failed, rate_limited, blocked)
- Error message
- Response time
- Timestamp

### API Errors

- Consistent error response format
- Appropriate HTTP status codes
- User-friendly error messages
- Detailed server logs

## Monitoring and Debugging

### Scraping Logs

View scraping performance:
```sql
SELECT status, COUNT(*), AVG(response_time)
FROM scraping_logs
GROUP BY status;
```

### Recent Errors

```sql
SELECT * FROM scraping_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### User Activity

```sql
SELECT u.email, COUNT(p.id) as product_count
FROM profiles u
LEFT JOIN products p ON u.id = p.user_id
GROUP BY u.email;
```

## Scaling Considerations

### Current Limits

- 5 concurrent scraping operations
- 2 second delay between scrapes
- 60 minute check interval

### Scaling Options

1. **Increase Concurrency**
   - Adjust `SCRAPING_CONCURRENT_LIMIT`
   - Add multiple worker instances

2. **Distributed Jobs**
   - Use Redis for job queue
   - Implement Bull or BeeQueue
   - Separate scraping workers

3. **Database Optimization**
   - Read replicas for queries
   - Connection pooling
   - Query optimization

4. **Caching**
   - Redis for recent prices
   - CDN for static assets
   - API response caching

## Testing Strategy

### Unit Tests

Test individual scrapers:
```typescript
// Test price extraction
// Test product ID parsing
// Test error handling
```

### Integration Tests

Test API endpoints:
```typescript
// Test product CRUD operations
// Test authentication flow
// Test notification creation
```

### E2E Tests

Test full user flows:
- User signup and login
- Add product to wishlist
- View price history
- Receive notifications

## Deployment

### Frontend Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy `dist/` folder to:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - AWS S3 + CloudFront

### Backend Deployment

1. Deploy to:
   - Railway
   - Render
   - Heroku
   - AWS ECS
   - DigitalOcean App Platform

2. Ensure environment variables are set

3. Install Playwright dependencies:
   ```bash
   npx playwright install --with-deps chromium
   ```

### Database

- Already deployed via Supabase
- Automatic backups enabled
- Point-in-time recovery available

## Maintenance

### Regular Tasks

1. **Monitor scraping logs** - Check for increased failure rates
2. **Update selectors** - E-commerce sites change frequently
3. **Review notifications** - Ensure users getting alerts
4. **Database cleanup** - Archive old price history if needed

### Selector Updates

When a scraper breaks:
1. Check scraping logs for the product
2. Visit the site and inspect HTML
3. Update selectors in respective scraper
4. Test with sample products
5. Deploy update

## Future Enhancements

### Potential Features

1. **Email Notifications**
   - Implement SMTP sending
   - HTML email templates
   - Notification preferences

2. **More Platforms**
   - eBay scraper
   - Best Buy scraper
   - Target scraper

3. **Price Predictions**
   - ML-based price forecasting
   - Historical trend analysis
   - Best time to buy suggestions

4. **Mobile App**
   - React Native implementation
   - Push notifications
   - Camera-based barcode scanning

5. **Browser Extension**
   - One-click product addition
   - In-page price comparison
   - Price history overlay

6. **Social Features**
   - Share wishlists
   - Price drop groups
   - Deal communities

## Troubleshooting

### Scraping Issues

**Problem**: All scrapes failing
- Check if Playwright browsers are installed
- Verify internet connectivity
- Check if sites have changed their HTML

**Problem**: Rate limited
- Increase `SCRAPING_RATE_LIMIT_DELAY`
- Reduce `SCRAPING_CONCURRENT_LIMIT`
- Add more user agents

### Authentication Issues

**Problem**: Users can't log in
- Verify Supabase environment variables
- Check Supabase dashboard for auth errors
- Ensure RLS policies are correct

### Notification Issues

**Problem**: No notifications appearing
- Check if price actually dropped
- Verify notification logic in price tracker
- Check database for notification records

## Support and Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Playwright Documentation**: https://playwright.dev
- **React Documentation**: https://react.dev
- **TailwindCSS**: https://tailwindcss.com

## License

This implementation is provided as-is for educational and commercial use.
