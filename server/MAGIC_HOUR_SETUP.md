# Magic Hour Remix Feature Pack (New Files Only)

This pack adds isolated backend/frontend files without modifying your existing app.

## What is included

- `server/server/models/RemixJob.js`
- `server/server/services/magicHourClient.js`
- `server/server/routes/remix.js`
- `client/src/features/remix/**`

## Environment variables

Add these in `server/.env` when ready:

- `MAGIC_HOUR_API_KEY=your_key_here`
- `MAGIC_HOUR_API_BASE=https://api.magichour.ai/v1`

If no API key is set, the backend client runs in **mock mode** and returns a sample video URL after a short delay.

## Integration steps (manual, later)

1. Register route in server startup file:
   - `const remixRouter = require("./routes/remix")`
   - `app.use("/api/remix", remixRouter)`

2. Add Remix UI route in client app:
   - import `RemixStudio`
   - add route path like `/remix/studio`

3. Optionally add a button from listing detail page to open RemixStudio with listing snapshot.

## API contract

### Create remix
`POST /api/remix`

Body:

```json
{
  "style": "fake-product-trailer",
  "sourcePlatform": "listing",
  "sourceHandle": "",
  "listingSnapshot": {
    "listingId": "abc123",
    "title": "MacBook Air M2",
    "description": "Used lightly, great battery",
    "price": 750,
    "imageUrl": "https://...",
    "listingUrl": "http://localhost:5173/listings/abc123"
  }
}
```

### Refresh status
`POST /api/remix/:id/refresh`

### Read job
`GET /api/remix/:id`

### Read share
`GET /api/remix/share/:slug`
