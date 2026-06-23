# EthioFlow Backend

Node.js Telegram Bot + Express Helper API for the EthioFlow marketplace.

## Features

- 🤖 Telegram Bot that auto-ingests product posts from channels
- 📦 AI-powered product parsing from caption text
- 🖼️ Telegram File ID storage (free, unlimited image hosting)
- 📡 Express API for Mini App communication
- 🔐 Secure image resolution (Bot Token never exposed to frontend)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Fetch all available products |
| GET | `/api/resolve-image?file_id=X` | Resolve Telegram file ID to HTTPS URL |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and intro |
| `/search` | Search products |
| `/help` | Show help message |
| `/post` | Start product posting wizard |
