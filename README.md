# Alocmir: alcohol delivery store for Dubai

Premium black-and-gold online store with English, Russian and Arabic (RTL), an admin panel,
promo codes, WhatsApp ordering, lead capture and full SEO (sitemap, hreflang, Product/FAQ/Breadcrumb
structured data, area landing pages).

Stack: TanStack Start (React 19, server-rendered) on Vercel, Turso (SQLite) database, Vercel Blob for photos.

## 1. Put the code on GitHub
1. Create a new **private** repository on github.com (for example `alocmir`).
2. Upload everything in this folder (drag and drop on GitHub works), or from a terminal:
   git init && git add . && git commit -m "Alocmir store"
   git remote add origin https://github.com/YOUR-USER/alocmir.git
   git push -u origin main

## 2. Create the database (Turso, free)
1. Sign up at https://turso.tech (web dashboard or CLI).
2. Create a database in the region closest to Dubai (e.g. Mumbai or Frankfurt):
   turso db create alocmir
   turso db show alocmir --url          -> TURSO_DATABASE_URL
   turso db tokens create alocmir       -> TURSO_AUTH_TOKEN
3. Load the tables and sample products (needs Node.js 22+ on your computer):
   npm install
   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate
   (Windows PowerShell: $env:TURSO_DATABASE_URL="..."; $env:TURSO_AUTH_TOKEN="..."; npm run db:migrate)

## 3. Deploy on Vercel
1. vercel.com > Add New > Project > import the GitHub repo. Build command: npm run build.
2. Settings > Environment Variables: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_PASSWORD, VITE_SITE_URL (see .env.example).
3. Storage > create a Blob store and connect it to the project (adds BLOB_READ_WRITE_TOKEN for photo uploads).
4. Settings > Functions > Region: the closest to Dubai that Vercel offers (e.g. Mumbai bom1).
5. Deploy, then Settings > Domains: add your domain and follow the DNS steps.
6. After setting VITE_SITE_URL to your domain, redeploy once so SEO links use it.

## 4. First steps in the admin (/admin)
- Settings: WhatsApp number (+9715XXXXXXXX), phone, hours, delivery time, fee, free-delivery threshold, licence line.
- Products: replace the sample products (brand "Sample") with your real range, prices, stock and photos. Fill RU/AR names and SEO titles for best sellers.
- Promos: WELCOME10 (10% off from AED 150) powers the first-order popup. Add campaign codes (BRUNCH15, YACHT50...).
- Leads: WhatsApp numbers from the popup, downloadable as CSV.
- Orders: update status as you confirm, dispatch and deliver.

## 4b. Telegram order notifications
Every new order and every popup lead is sent to Telegram, with tap-to-call and WhatsApp links.
1. In Telegram, open @BotFather, send /newbot, pick a name. Copy the token.
2. Open your new bot and press Start. (For a team, add the bot to a group and send one message there.)
3. Run: $env:TELEGRAM_BOT_TOKEN="..."; npm run telegram:setup
   It prints your TELEGRAM_CHAT_ID and sends a test message.
4. Put TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env and in Vercel > Settings > Environment Variables, then redeploy.
If the variables are empty, orders still work; notifications are just skipped.

## 4c. Blog
Russian is the main language: yourdomain.com opens in Russian, English is at /en. The blog is at /ru/blog and /en/blog.
- 30 posts (Russian + English) are bundled in scripts/blog-posts/. The first `npm run db:migrate` on a database adds
  them: 3 go live immediately, then one every 3 days at 10:00 Dubai time. Run it on the production database at launch
  so the schedule starts then. Re-running never overwrites posts you edited.
- Admin > Blog: write new posts, edit or reschedule any post (a future date = scheduled), hide or delete.
  Text format: blank line = paragraph, ## heading, - list, > tip box, **bold**, [link](/ru/catalog/whisky).
- After editing the bundled posts, run `npm run blog:check` to catch broken links and over-long SEO fields.

## 4d. Analytics
Admin > Analytics shows visitors, traffic sources, top pages, devices, countries, WhatsApp clicks (and where they
happen), the path from visit to order, revenue, best-selling products and areas, for 7 / 30 / 90 days.
It is built in: no account, no cookies, no personal data (random visitor IDs, no IP addresses). `npm run db:migrate`
creates its table. Optional: set VITE_GA_ID (Google Analytics 4, "G-...") to also send traffic and shop events to GA4.
Note that GA4 sets cookies, so if you enable it, consider a cookie notice for visitors from Europe.

## 5. SEO launch checklist
1. Google Search Console: verify the domain, submit https://yourdomain.com/sitemap.xml
2. Bing Webmaster Tools: import from Search Console.
3. Google Business Profile (category Liquor store) with the same name, phone and hours as the site.
4. Ranking pages: home, /en/catalog/<category>, /en/product/<slug>, /en/delivery/<area> (12 Dubai areas) in EN/RU/AR.

## Local development
   cp .env.example .env   (TURSO_DATABASE_URL=file:local.db works for a local file)
   npm install && npm run db:migrate && npm run dev   -> http://localhost:3000

## Legal
Selling alcohol online in Dubai requires the appropriate licence. Keep the 21+ age gate,
ID check on delivery and the licence line in the footer.
