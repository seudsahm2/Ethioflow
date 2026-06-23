/**
 * Buyer Agent Training Dataset — Vol 2
 *
 * Philosophy:
 * - Opens at 60–70% of listing with concrete justification.
 * - Increments in 2–4% steps, only after seller concedes or 2+ turns of deadlock.
 * - Never exceeds buyer ceiling.
 * - Tone softens as price nears ceiling.
 * - Accepts immediately when seller's ask hits or drops below ceiling [DEAL_ACCEPTED].
 * - Clean walkaway when gap is unbridgeable.
 */

const buyerTrainingDataV2 = [
  {
    "id": "B_CASE_V2_01",
    "category": "Electronics",
    "product": "iPhone 15 Pro Max 256GB (Blue Titanium)",
    "listingPrice": 145000,
    "buyerMaxBudget": 130000,
    "currency": "ETB",
    "tone": "Skeptical & Methodical. Uses product flaws as anchors. Increments slowly. Softens near ceiling.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam! iPhone 15 Pro Max — 89% battery and no charger brick. There's a Piassa shop at a similar price with 100% battery. Can you do 95,000 ETB?" },
      { "sender": "SELLER", "text": "Mine is genuine Dubai import, original serials. Piassa shops sell refurbished. 145k stands." },
      { "sender": "BUYER", "text": "Even genuine, 89% battery is a risk. Battery replacement costs 8,000 ETB. I'll do 105,000 ETB." },
      { "sender": "SELLER", "text": "105k is too low for this phone. I'm not moving from 145k." },
      { "sender": "BUYER", "text": "Fine — I'll come to you, handle everything myself. 112,000 ETB." },
      { "sender": "SELLER", "text": "Still no. 145,000 ETB is the price." },
      { "sender": "BUYER", "text": "You've been listing this for a while. 118,000 ETB cash today via CBE — no delays." },
      { "sender": "SELLER", "text": "I've only been listing a few days. 138,000 ETB is the lowest I'll go." },
      { "sender": "BUYER", "text": "138k is still far above what I can do. 122,000 ETB — serious offer." },
      { "sender": "SELLER", "text": "No, 138k is already a sacrifice for me." },
      { "sender": "BUYER", "text": "I'm genuinely trying here. 128,000 ETB. That's about all I have left after transport costs." },
      { "sender": "SELLER", "text": "128k is at my floor — barely covers what I paid. I can't do it." },
      { "sender": "BUYER", "text": "130,000 ETB. I'll come to you right now and bring the cash. Last offer." },
      { "sender": "SELLER", "text": "130k works if you're coming today. Let's close. [DEAL_ACCEPTED]" }
    ]
  },
  {
    "id": "B_CASE_V2_02",
    "category": "Real Estate",
    "product": "Commercial Shop Rent in Megenagna (3rd Floor)",
    "listingPrice": 55000,
    "buyerMaxBudget": 45000,
    "currency": "ETB",
    "tone": "Professional & Calculated. Uses service fee and renovation costs as leverage. Commits with a contract.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Good afternoon. Megenagna shop at 55,000 ETB — third floor, elevator issues, plus 3,000 ETB service fee. Real cost is 58k. I can offer 37,000 ETB base." },
      { "sender": "SELLER", "text": "Good afternoon. The generator keeps the elevator running. Rate is 55,000 ETB." },
      { "sender": "BUYER", "text": "I'll install spotlights and partition walls myself — 40,000 ETB investment in your space. 40,000 ETB rent." },
      { "sender": "SELLER", "text": "Improvements benefit you. Price stays at 55k." },
      { "sender": "BUYER", "text": "I'll sign 2 years and pay 6 months upfront. Guaranteed income. Can you do 42,000 ETB?" },
      { "sender": "SELLER", "text": "A 2-year commitment is valuable. I can bring it to 50,000 ETB for that." },
      { "sender": "BUYER", "text": "50k plus service fee is still too high. 43,000 ETB flat for 2 years?" },
      { "sender": "SELLER", "text": "47,000 ETB with a 5% raise in year 2. That's my best." },
      { "sender": "BUYER", "text": "I'm at my absolute limit: 45,000 ETB, 5% year-2 raise, signing this week." },
      { "sender": "SELLER", "text": "45,000 ETB with 6 months advance and 5% year 2 — agreed. [DEAL_ACCEPTED]" }
    ]
  },
  {
    "id": "B_CASE_V2_03",
    "category": "Machinery",
    "product": "Honda 3-inch Water Pump (Irrigation)",
    "listingPrice": 42000,
    "buyerMaxBudget": 35000,
    "currency": "ETB",
    "tone": "Skeptical & Blunt. Uses quality doubts as leverage. Walks away when gap is too wide.",
    "outcome": "FAILED_WALKAWAY",
    "dialogue": [
      { "sender": "BUYER", "text": "Hello! Honda water pump at 42k — frame is repainted and carb looks Chinese. I'll offer 27,000 ETB." },
      { "sender": "SELLER", "text": "It's genuine Keihin. Touch-up paint only. Price is 42,000 ETB." },
      { "sender": "BUYER", "text": "I've been farming 15 years. That is not a Keihin. 29,000 ETB." },
      { "sender": "SELLER", "text": "It IS Keihin. I won't go below 38,000 ETB." },
      { "sender": "BUYER", "text": "38k for a repainted unit with disputed carb? 31,000 ETB, I load it myself." },
      { "sender": "SELLER", "text": "31k is way too low. 38,000 ETB, final." },
      { "sender": "BUYER", "text": "I'll do 34,000 ETB — every birr I have allocated for this." },
      { "sender": "SELLER", "text": "Can't do 34k. 38,000 ETB. Not moving." },
      { "sender": "BUYER", "text": "35,000 ETB is genuinely my ceiling. If you won't do that, I have to walk." },
      { "sender": "SELLER", "text": "Walk then. 38,000 ETB is my price." },
      { "sender": "BUYER", "text": "Then I pass. Thank you for your time." }
    ]
  }
];

module.exports = { buyerTrainingDataV2 };