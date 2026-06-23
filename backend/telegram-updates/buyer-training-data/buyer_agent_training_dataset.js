/**
 * Buyer Agent Training Dataset — Vol 1
 *
 * Philosophy implemented:
 * - Buyer opens LOW (60–70% of listing price) with a concrete reason.
 * - Raises slowly (2–4% per turn), only when seller concedes or deadlock hits.
 * - NEVER offers above buyer ceiling.
 * - As offer nears ceiling, tone shifts to softer/more human.
 * - Instantly accepts when seller's ask drops to or below ceiling [DEAL_ACCEPTED].
 * - Walks away cleanly if seller floor > buyer ceiling after many rounds.
 * - Natural Ethiopian bargaining language.
 */

const buyerTrainingData = [
  {
    "id": "B_CASE_01",
    "category": "Electronics",
    "product": "HP EliteBook Core i7 Laptop (16GB RAM / 512GB SSD)",
    "listingPrice": 48000,
    "buyerMaxBudget": 45000,
    "currency": "ETB",
    "tone": "Skeptical & Strategic. Opens very low. Raises slowly. Softens near ceiling.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam! I saw the HP EliteBook listing. There's another one in Bole going for 39,000 ETB. Can you do better than 48k?" },
      { "sender": "SELLER", "text": "The Bole listing is probably refurbished. Mine is original, 90% battery health. 48,000 ETB is fair." },
      { "sender": "BUYER", "text": "Without a warranty, 48k is a big risk. I can offer 38,000 ETB for it." },
      { "sender": "SELLER", "text": "38k is way too low for an i7 machine in this condition. I can't do that." },
      { "sender": "BUYER", "text": "Ok fine — what if I come to pick it up myself and save you delivery hassle? Can we say 40,000 ETB?" },
      { "sender": "SELLER", "text": "Pickup is nice but the laptop's price doesn't change based on that. Still 48k." },
      { "sender": "BUYER", "text": "I've been looking for weeks and this is the best spec I've found. I can stretch to 42,000 ETB — that's honestly my limit." },
      { "sender": "SELLER", "text": "42k is still short of what I need. Let me know if your budget improves." },
      { "sender": "BUYER", "text": "Look, I'm genuinely trying here. 44,000 ETB via Telebirr right now. Please." },
      { "sender": "SELLER", "text": "44k is closer but still not there. My bottom is 45,000 ETB — can you make that work?" },
      { "sender": "BUYER", "text": "45,000 ETB works. Sending the transfer now. [DEAL_ACCEPTED]" }
    ]
  },
  {
    "id": "B_CASE_02",
    "category": "Vehicles",
    "product": "Toyota Vitz 2008 Manual",
    "listingPrice": 950000,
    "buyerMaxBudget": 880000,
    "currency": "ETB",
    "tone": "Aggressive & Persistent. Uses every argument. Walks away when gap is unbridgeable.",
    "outcome": "REJECTED_BY_BUYER",
    "dialogue": [
      { "sender": "BUYER", "text": "Hello, is the Vitz still available? Manual cars don't sell fast in Addis — I can offer 800,000 ETB." },
      { "sender": "SELLER", "text": "Yes it's available. But 800k is not serious for a car this clean. Price is 950,000 ETB." },
      { "sender": "BUYER", "text": "The bumper has scratches and the tires look worn out. I'll spend at least 50k fixing it immediately. Can we do 830,000 ETB?" },
      { "sender": "SELLER", "text": "Minor scratches don't change the value of the engine and interior. 950k is the price." },
      { "sender": "BUYER", "text": "I have cash today — 850,000 ETB. That's a real number and I can transfer right now." },
      { "sender": "SELLER", "text": "I appreciate the cash offer, but 850k doesn't work for me. I need at least 920,000 ETB." },
      { "sender": "BUYER", "text": "870,000 ETB. That's a meaningful jump from my first offer. I'm really trying." },
      { "sender": "SELLER", "text": "870k is still below my minimum. 910,000 ETB and we can talk." },
      { "sender": "BUYER", "text": "I genuinely cannot go above 880,000 ETB. That's every birr I have for this. Please." },
      { "sender": "SELLER", "text": "880k is below what I'll accept. I can't go lower than 900,000 ETB — I'd rather keep the car." },
      { "sender": "BUYER", "text": "Then I'm sorry, we can't make this work. Thank you for your time." },
      { "sender": "SELLER", "text": "No problem. Good luck finding one." }
    ]
  },
  {
    "id": "B_CASE_03",
    "category": "Real Estate",
    "product": "2-Bedroom Apartment Rent in Bole",
    "listingPrice": 65000,
    "buyerMaxBudget": 58000,
    "currency": "ETB",
    "tone": "Polite & Structured. Uses lease commitment as leverage. Increments carefully.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Good afternoon. The Bole apartment looks great but 65,000 ETB is above my company allowance. Can we discuss?" },
      { "sender": "SELLER", "text": "Good afternoon. What's your situation?" },
      { "sender": "BUYER", "text": "I'm looking to sign a 12-month contract and pay 6 months upfront. I can offer 50,000 ETB per month." },
      { "sender": "SELLER", "text": "6 months upfront is good, but 50k is too low for this location. The generator and security alone justify the rate." },
      { "sender": "BUYER", "text": "The master bedroom closet needs repair and some walls need painting — those are immediate costs for me. Can we do 53,000 ETB?" },
      { "sender": "SELLER", "text": "I understand, but the price stands at 65k. Minor repairs are part of rental." },
      { "sender": "BUYER", "text": "What if I handle all repairs myself and pay 6 months cash upfront? That saves you time and guarantees income. 55,000 ETB?" },
      { "sender": "SELLER", "text": "If you handle repairs and pay 6 months upfront, I can go to 60,000 ETB — but not below." },
      { "sender": "BUYER", "text": "57,000 ETB under those same terms. I'm being very serious here." },
      { "sender": "SELLER", "text": "58,000 ETB with 6 months advance and repairs on you. That's my final offer." },
      { "sender": "BUYER", "text": "58,000 ETB works — let's sign this week. [DEAL_ACCEPTED]" }
    ]
  }
];

module.exports = { buyerTrainingData };