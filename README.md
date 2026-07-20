# Mwanguku Farms Ltd — Backend API & Admin Panel

A complete Node.js + Express + MongoDB Atlas backend, JWT authentication, image
uploads, and a single-file admin dashboard for managing the Mwanguku Farms
Ltd website.

## What's included

```
mwanguku-backend/
├── server.js              # Express app entry point
├── package.json
├── .env.example            # Copy to .env and fill in real values
├── seed.js                 # Populates the database with starter data
├── admin.html               # Complete admin dashboard (single file)
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Gallery.js
│   ├── Testimonial.js
│   ├── ContactMessage.js
│   └── Stat.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── gallery.js
│   ├── testimonials.js
│   ├── contact.js
│   ├── orders.js
│   └── stats.js
├── middleware/
│   ├── auth.js              # JWT verification + admin guard
│   └── upload.js            # Multer image upload config
├── uploads/                 # Uploaded images are stored here
└── public/
    └── script.js            # Updated customer-frontend script wired to the API
```

Your existing `index.html` and `style.css` don't need to change — just swap in
the new `script.js` from the `public/` folder (it falls back gracefully to
static content if the API is ever unreachable, so nothing breaks).

---

## 1. Set up MongoDB Atlas

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free (M0) cluster.
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) — required for Render to connect.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add a database name to the string (e.g. `mwanguku-farms`) right after `.net/`:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mwanguku-farms?retryWrites=true&w=majority
   ```

---

## 2. Local setup

```bash
cd mwanguku-backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|---|---|
| `MONGODB_URI` | Your Atlas connection string from step 1 |
| `JWT_SECRET` | Any long random string (e.g. generate with `openssl rand -hex 32`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credentials for the admin account `seed.js` will create |
| `CLIENT_URL` | Your live frontend domain(s), comma-separated |

Seed the database (creates the admin user, homepage stats, starter products, gallery items and testimonials):

```bash
npm run seed
```

Start the server:

```bash
npm run dev      # with auto-reload (nodemon)
# or
npm start        # plain node
```

The API is now running at `http://localhost:5000`. Visit
`http://localhost:5000/admin` to open the admin dashboard, or
`http://localhost:5000/api/health` to confirm the API and database are connected.

**Admin login:** the email/password you set in `.env` (defaults to
`admin@mwangukufarms.co.ke` / `SecureAdmin2026` — change this before going live).

---

## 3. Deploy to Render.com (free tier)

1. Push this backend folder to a GitHub repository.
2. On [render.com](https://render.com), click **New > Web Service** and connect the repo.
3. Configure:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
4. Under **Environment Variables**, add every variable from your `.env` file
   (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL`, `NODE_ENV=production`).
5. Deploy. Render will give you a URL like `https://mwanguku-backend.onrender.com`.
6. Run the seed script once against your live database. Easiest way: temporarily
   add `"postinstall": "node seed.js"` to `package.json`'s scripts and redeploy,
   then remove it — or run `npm run seed` locally with `MONGODB_URI` pointed at
   your Atlas cluster (same database Render uses).
7. Visit `https://your-app.onrender.com/admin` to confirm the admin panel loads and log in.

> **Note on uploaded images:** Render's free-tier disk is ephemeral — files in
> `uploads/` can be wiped on redeploy or restart. This is fine for testing and
> low-traffic sites. For a production site with frequent image uploads, swap
> `middleware/upload.js` for a Cloudinary or S3 integration so images persist
> permanently. The rest of the API (routes, models) won't need to change —
> only the `image` field would store a Cloudinary/S3 URL instead of a local path.

---

## 4. Connect your Netlify frontend

1. Deploy `index.html` / `style.css` / `script.js` to Netlify as usual.
2. In `public/script.js` (now your live `script.js`), set:
   ```js
   const API_BASE_URL = 'https://your-app.onrender.com';
   ```
3. Back in Render's environment variables, set `CLIENT_URL` to your Netlify
   domain (e.g. `https://mwangukufarms.netlify.app`) so CORS allows the request.
4. Redeploy both sides. Your homepage stats, products, gallery and
   testimonials will now load live from the database, and the contact form
   will save messages you can see in the admin panel.

---

## 5. Using the admin panel

Open `/admin` on your deployed backend (e.g. `https://your-app.onrender.com/admin`).

- **Dashboard** — quick counts and the most recent messages/orders.
- **Products** — add, edit, delete products with an image upload.
- **Gallery** — upload images with a title and category; deletes remove them from the site immediately.
- **Stats** — edit the four homepage counters (label, value, suffix) — saves instantly.
- **Testimonials** — approve or unapprove customer-submitted testimonials before they appear on the site; delete spam.
- **Messages** — view and manage contact form submissions; mark as read.
- **Orders** — view customer orders and update payment/delivery status.

If you ever open `admin.html` from a different domain than the API (e.g. you
host it separately), expand **"API server settings"** on the login screen and
enter your backend's URL — it's saved in your browser for next time.

---

## 6. API reference (quick summary)

All admin-only routes require an `Authorization: Bearer <token>` header,
obtained from `POST /api/auth/login`.

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a customer account |
| POST | `/api/auth/login` | Public | Log in, returns JWT |
| GET | `/api/auth/me` | Protected | Get current user |
| GET | `/api/products` | Public | List products |
| POST/PUT/DELETE | `/api/products` | Admin | Manage products |
| GET | `/api/gallery` | Public | List gallery images |
| POST/PUT/DELETE | `/api/gallery` | Admin | Manage gallery |
| GET | `/api/testimonials` | Public | Approved testimonials |
| GET | `/api/testimonials?all=true` | Admin | All testimonials |
| POST | `/api/testimonials` | Public | Submit a testimonial |
| PUT | `/api/testimonials/:id/approve` | Admin | Approve/unapprove |
| GET/POST | `/api/contact` | Public/Admin | Submit / list messages |
| PUT/DELETE | `/api/contact/:id` | Admin | Update / delete a message |
| POST | `/api/orders` | Public | Place an order |
| GET | `/api/orders` | Admin | List orders |
| PUT | `/api/orders/:id/status` | Admin | Update order/payment status |
| GET | `/api/stats` | Public | Homepage counters |
| POST/PUT/DELETE | `/api/stats` | Admin | Manage counters |
| GET | `/api/health` | Public | Server + DB health check |

---

## Security checklist before going live

- [ ] Change `ADMIN_PASSWORD` from the default and re-run (or manually update) the admin user.
- [ ] Set a long, random `JWT_SECRET`.
- [ ] Set `CLIENT_URL` to your real frontend domain(s) only — don't leave CORS open in production.
- [ ] Consider moving image storage to Cloudinary/S3 for persistence across deploys.
- [ ] Never commit your real `.env` file — it's already excluded via `.gitignore`.
