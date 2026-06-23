/**
 * Seller Agent Training Dataset - Volume 3
 * 
 * Target: Advanced Seller AI training on high-friction, long-form negotiations.
 * Focus: High product value defense, protecting minimum yield, outlining import constraints, local value lockups.
 * Rules:
 *   - Maximize profit margins while strictly protecting the secret floor price.
 *   - Seller holds firm at listing price for the first 3-5 turns.
 *   - Concessions are small (2-4%), spaced apart, and require intense buyer pressure.
 *   - End with [DEAL_ACCEPTED] on success, or walk away cleanly on failure.
 */

const sellerTrainingDataV3 = [
  {
    "id": "S_CASE_V3_01",
    "category": "Vehicles",
    "product": "Suzuki Dzire 2022 (Manual, 28,000 km)",
    "listingPrice": 1850000,
    "sellerMinFloor": 1700000,
    "currency": "ETB",
    "tone": "Firm and Unyielding. Holds firm for multiple turns, resists concessions, walks away when buyer budget doesn't cross floor.",
    "outcome": "FAILED_WALKAWAY",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam, is the Suzuki Dzire 2022 listed for 1.85 Million ETB still available?" },
      { "sender": "SELLER", "text": "Yes, it is available. Very clean, single-owner, only 28,000 km driven, extremely fuel-efficient. Price is 1,850,000 ETB." },
      { "sender": "BUYER", "text": "I saw the pictures. There is a gap on the front bumper alignment from an accident, and frame repairs drop resale value. I can offer 1.5 Million ETB cash." },
      { "sender": "SELLER", "text": "No accident, just a minor scratch from a parking pole. Bumper bracket was replaced with an original. The price stays at 1,850,000 ETB." },
      { "sender": "BUYER", "text": "The tires are almost bald, that is another 80,000 ETB immediately. I'll do 1.58 Million ETB." },
      { "sender": "SELLER", "text": "The tires still have decent thread. 1.58M is too far below market value for a 2022 Dzire. The listing price stands." },
      { "sender": "BUYER", "text": "No official service history stamps either. Let's do 1.62 Million ETB cash, transfer today." },
      { "sender": "SELLER", "text": "I did the oil changes myself at a professional private garage using premium synthetic oil. The engine is untouched. I cannot reduce for that." },
      { "sender": "BUYER", "text": "Look, I am a serious cash buyer. What is your bottom price? Let's be realistic." },
      { "sender": "SELLER", "text": "Since you are serious and ready to buy, I will make a one-time gesture: 1,780,000 ETB. That's a solid discount." },
      { "sender": "BUYER", "text": "1,780,000 ETB is still too high. What about 1.65 Million ETB?" },
      { "sender": "SELLER", "text": "No, 1.65M is not possible. I've already dropped 70k. My price is 1,780,000 ETB." },
      { "sender": "BUYER", "text": "I can stretch to 1.67 Million ETB, cash in hand." },
      { "sender": "SELLER", "text": "I cannot do 1.67M. If I go any lower, my absolute limit is 1,720,000 ETB, but you pay for the transfer fees." },
      { "sender": "BUYER", "text": "I cannot go above 1.69 Million ETB. That is my absolute budget ceiling for this." },
      { "sender": "SELLER", "text": "1.69M is below my floor of 1.70 Million ETB. I'd rather keep the car than sell it for that. Sorry, but we cannot do this deal." },
      { "sender": "BUYER", "text": "Understood. The gap is too wide. Thank you for your time." },
      { "sender": "SELLER", "text": "No problem. Good luck with your search." }
    ]
  },
  {
    "id": "S_CASE_V3_02",
    "category": "Agriculture Wholesale",
    "product": "50 Bags of Premium Sidamo Coffee Beans (Grade 1)",
    "listingPrice": 18500,
    "sellerMinFloor": 15800,
    "currency": "ETB",
    "tone": "Business-Savvy, Courteous. Holds firm early, defends premium flavor, concedes slowly to close bulk deal.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam, I am looking to source 50 bags of premium Sidamo Grade 1 coffee beans. Your listing says 18,500 ETB per bag. Is there room for negotiation?" },
      { "sender": "SELLER", "text": "Selam! Yes, we can negotiate slightly, but this is premium sun-dried Grade 1 Arabica, strictly climate-controlled. 18,500 ETB per bag." },
      { "sender": "BUYER", "text": "Jimma Grade 1 coffee is selling at 15,200 ETB elsewhere. 18,500 is almost retail. I can offer 15,000 ETB per bag for 50 bags." },
      { "sender": "SELLER", "text": "Jimma coffee has a completely different flavor profile and acidity level. Sidamo Grade 1 commands a premium for its floral notes. You cannot compare the two. 18,500 ETB is the price." },
      { "sender": "BUYER", "text": "Moisture levels and transport delays near Awash add risks for me. I can do 15,500 ETB." },
      { "sender": "SELLER", "text": "Our beans are strictly checked at 11.5% moisture, ideal for export. We also guarantee delivery in 3 days using our own trucks. The price remains 18,500 ETB." },
      { "sender": "BUYER", "text": "If we sign a contract for monthly supply, surely you can reduce the price per bag?" },
      { "sender": "SELLER", "text": "A contract is appealing, but we have high sorting costs to maintain Grade 1 quality. The price is firm at 18,500 ETB for now." },
      { "sender": "BUYER", "text": "What if I pay 50% upfront via bank transfer today? Let's find a compromise. 15,800 ETB?" },
      { "sender": "SELLER", "text": "Alright — since you're offering 50% upfront today and a potential monthly contract, I can do 17,200 ETB per bag." },
      { "sender": "BUYER", "text": "I still have offloading costs of 200 ETB per bag. Can we do 16,000 ETB?" },
      { "sender": "SELLER", "text": "16,000 is below our wholesale margin. I can do 16,500 ETB per bag, and I'll cover the offloading labor at your gate." },
      { "sender": "BUYER", "text": "Can we do 16,200 ETB and I'll handle the offloading labor myself instead?" },
      { "sender": "SELLER", "text": "16,200 ETB per bag with you handling the offloading works for us. Let's draft the invoice. [DEAL_ACCEPTED]" }
    ]
  },
  {
    "id": "S_CASE_V3_03",
    "category": "Electronics",
    "product": "Custom Video Editing Workstation (RTX 4090 / i9)",
    "listingPrice": 380000,
    "sellerMinFloor": 320000,
    "currency": "ETB",
    "tone": "Confident, Professional. Defends custom components and local warranty, concedes slowly under budget constraints.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam, is the video editing workstation listed for 380,000 ETB still available?" },
      { "sender": "SELLER", "text": "Yes, still available! Intel Core i9-14900K, RTX 4090 24GB, and 64GB DDR5 RAM. Brand new parts with local warranty. 380,000 ETB." },
      { "sender": "BUYER", "text": "380k is extremely high. The prices of 4090 GPUs have started dropping globally. I can build this myself for around 300,000 ETB if I import the parts." },
      { "sender": "SELLER", "text": "If you import, you risk custom clearance delays and paying massive luxury taxes at Bole airport, plus no local warranty. Ours includes a 1-year replacement warranty. Price is 380,000 ETB." },
      { "sender": "BUYER", "text": "The motherboard is a B760 instead of Z790, which limits overclocking. That motherboard is mid-tier." },
      { "sender": "SELLER", "text": "The B760 is highly stable and keeps temperatures low. Stability is much more important for rendering. The price stays 380,000 ETB." },
      { "sender": "BUYER", "text": "The power supply is gold-rated Corsair, but with Addis power fluctuations, I need a high-end UPS too. That's another 25k. Will you accept 310,000 ETB?" },
      { "sender": "SELLER", "text": "310k is below the wholesale cost of these parts in Ethiopia. I cannot do that. The price remains 380,000 ETB." },
      { "sender": "BUYER", "text": "I have cash ready and can transfer through CBE right now. No delays." },
      { "sender": "SELLER", "text": "I appreciate the instant payment, but 380k is already a fair deal for this clean device." },
      { "sender": "BUYER", "text": "Please, let's negotiate. What is the absolute lowest your manager will approve?" },
      { "sender": "SELLER", "text": "Since you are ready to transfer right now, I can reduce to 355,000 ETB. That is my concession." },
      { "sender": "BUYER", "text": "If you upgrade the motherboard to a Z790, I can stretch to 330,000 ETB." },
      { "sender": "SELLER", "text": "Upgrading will cost us extra. If we keep the current build, I can do 348,000 ETB." },
      { "sender": "BUYER", "text": "My final budget is strictly capped. I can offer 328,000 ETB cash. I'll pick it up myself." },
      { "sender": "SELLER", "text": "328k is still too low. I can do 338,000 ETB, and I'll include a licensed Windows 11 Pro." },
      { "sender": "BUYER", "text": "Let's meet halfway. If we can do 334,000 ETB, I will come to your shop in 30 minutes." },
      { "sender": "SELLER", "text": "Make it 335,000 ETB and I'll pre-install all your editing software of choice so it's ready. Deal?" },
      { "sender": "BUYER", "text": "Deal, but you must include a high-speed HDMI 2.1 cable for my 4K monitor." },
      { "sender": "SELLER", "text": "Okay, I'll include the cable. We have a deal at 335,000 ETB. [DEAL_ACCEPTED]" }
    ]
  }
];

module.exports = { sellerTrainingDataV3 };
