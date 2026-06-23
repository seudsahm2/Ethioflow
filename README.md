# EthioFlow — Telegram Bot + Mini App Monorepo

A full-stack Telegram marketplace built with a Node.js bot backend and a React Mini App frontend.

## Project Structure

```
Amazone/
├── Amazone_app/       # React Vite Mini App (frontend)
├── backend/           # Node.js Telegram Bot + Helper API (backend)
├── package.json       # Root workspace config
└── README.md
```

## Architecture

**Storage Strategy**: Images are stored as native Telegram `file_id` strings in PostgreSQL. The backend resolves them to temporary HTTPS URLs on-demand, keeping storage free and unlimited.

## Getting Started

### 1. Setup Backend
```bash
cd backend
cp .env.example .env
# Fill in BOT_TOKEN and DATABASE_URL in .env
npm install
npx prisma db push
npm run dev
```

### 2. Setup Frontend
```bash
cd Amazone_app
npm install
npm run dev
```

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Your Telegram Bot token from @BotFather |
| `DATABASE_URL` | Supabase PostgreSQL pooler connection string |
| `DIRECT_URL` | Supabase direct connection string (for migrations) |

## How It Works

1. **Bot receives channel post** → extracts `file_id` from photos
2. **AI parses caption** → extracts title, price, category
3. **Product saved to Supabase** with `telegramFileIds[]`
4. **Mini App fetches products** via `GET /api/products`
5. **Images resolved on-demand** via `GET /api/resolve-image?file_id=...`
