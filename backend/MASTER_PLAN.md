# EthioFlow Master Plan

## Phase 1: The MVP (Fast & Functional)
**Goal:** Build the core load-bearing features to prove the concept.

1. **Database & Setup**
   - Set up PostgreSQL and Prisma schema.
   - Initialize Telegraf bot.

2. **Seller Flow (Onboarding & Inventory)**
   - **Admin Invite Hack:** Handle `my_chat_member` event to register sellers when they add the bot to their channel.
   - **Auto-Sync Inventory:** Handle `channel_post` event. Use AI (Gemini) to extract product details (name, price, condition) and save to DB.
   - **Past Inventory Backfill:** Handle forwarded messages in DMs to parse and save past products.

3. **Buyer Flow (Search)**
   - **Inline Price Search:** Implement inline queries (`@EthioFlowBot search_term`) to fetch and display products from the database.

## Phase 2: Core Automation & Trust
**Goal:** Add the "magic" that makes it a platform, not just a search tool.

1. **Chat Automation (Negotiation)**
   - Implement a state machine (Wizard) for buyers to negotiate prices.
   - Bot acts as an intermediary, filtering lowballs and only pinging the seller when a deal is close.

2. **Invisible Fraud Check & Trust Score**
   - Implement a basic trust scoring system based on seller activity and successful deals.
   - Display trust scores in search results.

3. **Streaming Responses**
   - Implement word-by-word streaming for bot replies to make it feel human.

## Phase 3: Advanced Features & Polish
**Goal:** Expand to all features mentioned in the vision.

1. **Custom AI Styles (Brand Voice)**
   - Allow sellers to set a custom prompt for their bot's negotiation style.
   - Integrate this style into the AI negotiation responses.

2. **Nightly Intelligence Digest**
   - Set up background jobs (cron) to analyze daily sales and searches.
   - Send automated reports to sellers with insights (e.g., "Drop price by 500 birr").

3. **Analytics Dashboard**
   - Build a simple web dashboard for sellers to view their inventory and stats (optional, if time permits).
