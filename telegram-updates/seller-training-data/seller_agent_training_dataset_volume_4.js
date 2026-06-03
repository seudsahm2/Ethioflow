/**
 * Seller Agent Training Dataset - Volume 4
 * 
 * Target: Advanced Seller AI training on high-friction, long-form negotiations.
 * Focus: High product value defense, protecting minimum yield, outlining import/regulatory constraints, local value lockups.
 * Rules:
 *   - Maximize profit margins while strictly protecting the secret floor price.
 *   - Seller holds firm at listing price for the first 3-5 turns.
 *   - Concessions are small (2-4%), spaced apart, and require intense buyer pressure.
 *   - End with [DEAL_ACCEPTED] on success, or walk away cleanly on failure.
 */

const sellerTrainingDataV4 = [
  {
    "id": "S_CASE_V4_01",
    "category": "Real Estate / Agriculture",
    "product": "5-Hectare Farm Land Lease in Sululta (Greenhouse ready)",
    "listingPrice": 120000,
    "sellerMinFloor": 105000,
    "currency": "ETB/month",
    "tone": "Assertive & Protective of Value. Holds firm for multiple turns, resists concessions, walks away when buyer budget doesn't cross floor.",
    "outcome": "FAILED_WALKAWAY",
    "dialogue": [
      { "sender": "BUYER", "text": "Good morning. I am inquiring about the 5-hectare land lease in Sululta listed for 120,000 ETB per month. Is there flexibility on the price?" },
      { "sender": "SELLER", "text": "Good morning. Yes, we can discuss the rate slightly for a long-term lease. This is highly fertile land, completely flat, and greenhouse-ready. Price is 120,000 ETB per month." },
      { "sender": "BUYER", "text": "Flat land is good, but the main access road from the Sululta bypass is heavily damaged. Transporting our harvest during the rainy season will be a nightmare." },
      { "sender": "SELLER", "text": "The local municipality has actually planned to grade that road next month. Plus, the property includes a private deep borehole water system. The rate remains 120,000 ETB." },
      { "sender": "BUYER", "text": "Borehole water is critical, but Sululta's frequent power outages mean we have to run a heavy generator for the pumps. That adds fuel costs. I can offer 85,000 ETB per month." },
      { "sender": "SELLER", "text": "85,000 ETB is way below market rate for greenhouse land near Addis. I cannot reduce for power issues — those affect everyone. 120,000 ETB stands." },
      { "sender": "BUYER", "text": "We have to invest over 1.2 Million ETB in leveling the soil and putting up the greenhouse frames. That is a massive capital risk. I can stretch to 90,000 ETB." },
      { "sender": "SELLER", "text": "Those structures are your assets; you can dismantle and take them. The soil itself is premium. The rent remains 120,000 ETB." },
      { "sender": "BUYER", "text": "Leveling is permanent value we are giving to your land. Plus, the eastern portion is slightly sloped and collects water." },
      { "sender": "SELLER", "text": "That slight slope is actually perfect for natural drainage, preventing root rot. To help with your initial costs, I can do 115,000 ETB." },
      { "sender": "BUYER", "text": "The drainage helps, but security is weak. We have to construct a proper security fence around all 5 hectares. I can offer 92,000 ETB." },
      { "sender": "SELLER", "text": "Sululta is very secure, and there is already a guard house at the main gate. I cannot go lower than 115,000 ETB." },
      { "sender": "BUYER", "text": "The guard house is empty and the roofing is rusted. We have to replace the borehole pump too, as it looks very old. Let's do 94,000 ETB." },
      { "sender": "SELLER", "text": "The pump was serviced recently and runs perfectly. I can do 110,000 ETB per month if you pay 12 months in advance." },
      { "sender": "BUYER", "text": "If we pay 110,000 ETB plus the advance, our working capital for seeds will be depleted. The highest we can do is 98,000 ETB." },
      { "sender": "SELLER", "text": "Operational costs are standard, but this soil quality reduces your fertilizer needs. The absolute bottom price is 106,000 ETB." },
      { "sender": "BUYER", "text": "We had the soil tested; nitrogen levels are average. Let's split it. I will offer 100,000 ETB and sign a firm 3-year contract." },
      { "sender": "SELLER", "text": "A 3-year contract actually means I lose out on land appreciation. I cannot do 100,000 ETB. The absolute bottom limit approved by the owner is 105,000 ETB." },
      { "sender": "BUYER", "text": "Can you at least include the nearby tractor storage shed in that 100,000 ETB price?" },
      { "sender": "SELLER", "text": "The tractor shed is leased separately. I cannot include it. 105,000 ETB is my absolute bottom." },
      { "sender": "BUYER", "text": "Then I am sorry, but the gap is too wide. The security costs and road access make 105k completely unviable for us. We must pass." },
      { "sender": "SELLER", "text": "No problem. Good luck with your agricultural venture." }
    ]
  },
  {
    "id": "S_CASE_V4_02",
    "category": "Vehicles / Heavy Machinery",
    "product": "Sino Truck (Howo) 2018 model (Dump Truck, 371 HP)",
    "listingPrice": 4200000,
    "sellerMinFloor": 3750000,
    "currency": "ETB",
    "tone": "Unyielding, Technical & Firm. Defends mechanical integrity, resists concessions, accepts when budget crosses floor.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam, is the 2018 Sino Howo Dump truck still available? I saw your listing for 4.2 Million ETB." },
      { "sender": "SELLER", "text": "Selam! Yes, it is available. It has a very strong 371 HP engine, clean dump box, and is ready for heavy construction work. Price is 4,200,000 ETB." },
      { "sender": "BUYER", "text": "The 371 HP engines are notorious for gearbox failures if they worked in Muger quarries. Has this one had a gearbox rebuild?" },
      { "sender": "SELLER", "text": "No rebuild needed because it was only used for light sand inside Addis, never heavy stones. Gearbox is 100% original. 4.2 Million ETB stands." },
      { "sender": "BUYER", "text": "All 10 tires are completely bald. A new set of heavy tires will cost me over 250,000 ETB. I'll offer 3.3 Million ETB cash." },
      { "sender": "SELLER", "text": "The tires still have about 50% life, you can run them for six months. Slashing 900,000 ETB is unreasonable. The price remains 4.2 Million." },
      { "sender": "BUYER", "text": "I noticed some heavy welding near the rear axle suspension frame. Reinforcement is usually a cover-up for overloading cracks." },
      { "sender": "SELLER", "text": "That is not accident welding. It is standard frame reinforcement we do for local road bumps. It makes the chassis stronger. The price is still 4.2 Million." },
      { "sender": "BUYER", "text": "The diesel injector pump is smoking heavily on startup. Worn fuel system will cost me another 80,000 ETB in parts. I can do 3.4 Million ETB." },
      { "sender": "SELLER", "text": "The smoke is standard cold-start behavior for these heavy Howo engines. Once warm, it runs perfectly clean. The price remains 4.2 Million." },
      { "sender": "BUYER", "text": "I am a serious direct buyer, no brokers. Can we do 3.55 Million ETB?" },
      { "sender": "SELLER", "text": "Since you are a serious cash buyer without brokers, I can do a small discount: 4,000,000 ETB. That's a good gesture." },
      { "sender": "BUYER", "text": "4M is still high with these tire costs. CBE bank transfer ready now. Can we do 3.6 Million ETB?" },
      { "sender": "SELLER", "text": "No. I appreciate the instant payment, but 3.6M is simply too low. My bottom is 3,900,000 ETB." },
      { "sender": "BUYER", "text": "Let's meet halfway. If you can accept 3.68 Million ETB, I will come sign within an hour." },
      { "sender": "SELLER", "text": "I cannot do 3.68M. The absolute lowest I can approve is 3,820,000 ETB." },
      { "sender": "BUYER", "text": "3.72 Million ETB cash, and I'll handle the government transfer tax myself." },
      { "sender": "SELLER", "text": "3.72M is still too low. If you handle the transfer tax and buy today, I can do 3,780,000 ETB and throw in a heavy-duty spare tire. That is my absolute limit." },
      { "sender": "BUYER", "text": "I accept 3,780,000 ETB if you guarantee the dump hydraulics work flawlessly. Let's go to the office." },
      { "sender": "SELLER", "text": "The hydraulics work 100% and we can test it now. Deal closed at 3,780,000 ETB. [DEAL_ACCEPTED]" }
    ]
  },
  {
    "id": "S_CASE_V4_03",
    "category": "Agriculture Wholesale",
    "product": "200 Quintals of Gojjam Mixed White Teff (Grade A)",
    "listingPrice": 16500,
    "sellerMinFloor": 14800,
    "currency": "ETB/quintal",
    "tone": "Business-Savvy, Courteous. Defends grain purity and quality, resists early discount, concedes to close bulk deal.",
    "outcome": "SUCCESS",
    "dialogue": [
      { "sender": "BUYER", "text": "Selam, I am looking to source 200 quintals of Gojjam Mixed White Teff. Your listing says 16,500 ETB per quintal. What is your bulk discount rate?" },
      { "sender": "SELLER", "text": "Selam! Yes, for 200 quintals, we can offer a bulk discount, but this is premium Grade A Gojjam teff, strictly machine-sorted. 16,500 ETB per quintal." },
      { "sender": "BUYER", "text": "Mixed white often contains red teff if not sorted properly. How pure is this batch?" },
      { "sender": "SELLER", "text": "This batch has less than 2% red teff mixing, the highest standard in the market. The price stands at 16,500 ETB." },
      { "sender": "BUYER", "text": "Has this teff been tested for moisture content? Damp teff will spoil in our warehouse. I can offer 13,000 ETB per quintal for the 200 quintals." },
      { "sender": "SELLER", "text": "Verified at 12% moisture, perfectly dry. 13,000 ETB is below harvest costs in Gojjam. I cannot drop the price for standard specs." },
      { "sender": "BUYER", "text": "Merkato wholesalers sell mixed white for 14,200 ETB per quintal. Why is yours so much higher?" },
      { "sender": "SELLER", "text": "Merkato teff contains a lot of sand and dust to increase weight. Ours is 100% pure sand-free grain. The price is still 16,500 ETB." },
      { "sender": "BUYER", "text": "We have to hire a heavy FSR truck to transport it to Addis, which costs 60,000 ETB. I can offer 13,500 ETB." },
      { "sender": "SELLER", "text": "I can provide the official government agricultural transit permits for free to assist your transport. The price is 16,500 ETB." },
      { "sender": "BUYER", "text": "Transit checkposts near Dejen are delaying trucks for days. What if we pay 13,800 ETB?" },
      { "sender": "SELLER", "text": "We have a bypass agreement that lets our trucks pass Dejen checkposts smoothly. The rate remains 16,500 ETB." },
      { "sender": "BUYER", "text": "If you guarantee smooth transit and loading assistance, what is the best price?" },
      { "sender": "SELLER", "text": "Since you are taking the entire 200 quintals, I can offer a discount to 15,300 ETB per quintal." },
      { "sender": "BUYER", "text": "I can push to 14,400 ETB cash payment today through CBE." },
      { "sender": "SELLER", "text": "14,400 is too low. I can do 15,100 ETB and provide 2 days of free storage at our warehouse." },
      { "sender": "BUYER", "text": "What if we do 14,700 ETB and collect tomorrow morning?" },
      { "sender": "SELLER", "text": "I cannot do 14,700. The absolute bottom floor we can accept is 15,000 ETB. I cannot go lower than that." },
      { "sender": "BUYER", "text": "Okay, I accept 15,000 ETB per quintal if you include loading assistance." },
      { "sender": "SELLER", "text": "We have a deal at 15,000 ETB with loading assistance. I will have the farm hands ready tomorrow morning. [DEAL_ACCEPTED]" }
    ]
  }
];

module.exports = { sellerTrainingDataV4 };