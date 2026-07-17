// 20 seller stores, each with a specialty covering 2-3 categories of the
// canonical taxonomy so together they stock all 44 categories.
// sellerForCategory() tells the catalog builder who owns which category.

const SELLERS = [
  { id: "seller-1", name: "TechNova Electronics", email: "seller@shopsphere.com", password: "seller1234", city: "Chennai", categories: ["Electronics", "Smart Home & IoT"], description: "Flagship consumer-electronics store with the latest gadgets, wearables and smart devices." },
  { id: "seller-2", name: "PixelPort Mobiles", email: "contact@pixelport.example.com", password: "pixel1234", city: "Bengaluru", categories: ["Mobile Phones & Accessories", "Tablets & Accessories"], description: "Everything mobile — phones, tablets and the accessories that go with them." },
  { id: "seller-3", name: "ByteWorks Computing", email: "sales@byteworks.example.com", password: "byte1234", city: "Hyderabad", categories: ["Computers & Laptops", "Gaming & Consoles"], description: "Laptops, desktops and serious gaming hardware for work and play." },
  { id: "seller-4", name: "LensCraft Studio", email: "hello@lenscraft.example.com", password: "lens1234", city: "Mumbai", categories: ["Cameras & Photography", "Movies, Music & Games"], description: "Cameras, studio gear and a curated shelf of movies, music and games." },
  { id: "seller-5", name: "SoundWave Audio", email: "care@soundwave.example.com", password: "sound1234", city: "Pune", categories: ["Audio"], description: "Headphones, speakers and pro audio tuned for Indian listeners." },
  { id: "seller-6", name: "HomeCraft Living", email: "support@homecraft.example.com", password: "home1234", city: "Jaipur", categories: ["Home & Furniture", "Home Decor"], description: "Furniture and decor that make a house feel like home." },
  { id: "seller-7", name: "BrightNest Appliances", email: "orders@brightnest.example.com", password: "nest1234", city: "Delhi", categories: ["Home Appliances", "Lighting"], description: "Dependable appliances and lighting for every Indian kitchen and living room." },
  { id: "seller-8", name: "SpiceRoute Kitchen", email: "team@spiceroute.example.com", password: "spice1234", city: "Kochi", categories: ["Kitchen & Dining", "Grocery & Gourmet Foods"], description: "Cookware, appliances and gourmet foods from across the spice routes." },
  { id: "seller-9", name: "UrbanWeave Fashion", email: "style@urbanweave.example.com", password: "weave1234", city: "Mumbai", categories: ["Men's Fashion", "Women's Fashion"], description: "Contemporary fashion woven with Indian textile heritage." },
  { id: "seller-10", name: "StrideZone Footwear", email: "walk@stridezone.example.com", password: "stride1234", city: "Agra", categories: ["Footwear", "Kids' Fashion"], description: "Footwear for every stride, plus playful fashion for kids." },
  { id: "seller-11", name: "TimeAxis Watches", email: "tick@timeaxis.example.com", password: "time1234", city: "Kolkata", categories: ["Watches", "Jewelry"], description: "Watches and jewelry for moments worth keeping." },
  { id: "seller-12", name: "GlowLeaf Beauty", email: "glow@glowleaf.example.com", password: "glow1234", city: "Bengaluru", categories: ["Beauty & Personal Care", "Health & Wellness"], description: "Clean beauty and everyday wellness, thoughtfully sourced." },
  { id: "seller-13", name: "FitPulse Sports", email: "coach@fitpulse.example.com", password: "pulse1234", city: "Chandigarh", categories: ["Sports & Outdoors", "Fitness Equipment"], description: "Gear for the field, the trail and the home gym." },
  { id: "seller-14", name: "PageTurner Books", email: "read@pageturner.example.com", password: "page1234", city: "Lucknow", categories: ["Books", "Stationery & School Supplies"], description: "A bookshop at heart, with the stationery to write your own." },
  { id: "seller-15", name: "LittleSprouts Baby", email: "care@littlesprouts.example.com", password: "sprout1234", city: "Ahmedabad", categories: ["Baby Products", "Toys & Games"], description: "Safe, joyful products for babies, toddlers and growing families." },
  { id: "seller-16", name: "AutoMoto Hub", email: "garage@automoto.example.com", password: "moto1234", city: "Indore", categories: ["Automotive", "Motorcycle Accessories"], description: "Accessories and care for cars and motorcycles, from daily commutes to weekend rides." },
  { id: "seller-17", name: "PetJoy Supplies", email: "woof@petjoy.example.com", password: "pet1234", city: "Pune", categories: ["Pet Supplies", "Garden & Outdoor Living"], description: "Happy pets and greener balconies — food, toys, planters and more." },
  { id: "seller-18", name: "MelodyMakers Instruments", email: "jam@melodymakers.example.com", password: "melody1234", city: "Chennai", categories: ["Musical Instruments", "Arts, Crafts & Sewing"], description: "Instruments and craft supplies for makers of music and everything else." },
  { id: "seller-19", name: "OfficeMate Supplies", email: "desk@officemate.example.com", password: "office1234", city: "Gurugram", categories: ["Office Products", "Industrial & Scientific", "Tools & Home Improvement"], description: "From the desk to the workshop — office, lab and tool-bench essentials." },
  { id: "seller-20", name: "FestiveNest Gifting", email: "joy@festivenest.example.com", password: "gift1234", city: "Varanasi", categories: ["Gifts & Gift Cards", "Collectibles", "Handmade Products", "Party Supplies", "Religious & Spiritual Items", "Luggage & Travel"], description: "Gifts, handicrafts, celebration supplies and travel gear for every occasion." },
];

const sellerByCategory = {};
for (const seller of SELLERS) {
  for (const category of seller.categories) {
    sellerByCategory[category] = seller.id;
  }
}

function sellerForCategory(category) {
  return sellerByCategory[category] || "seller-1";
}

// Expand to full Account documents (password hashing happens via the
// Account pre-save hook when the seed uses Account.create()).
function sellerAccounts() {
  return SELLERS.map((s, idx) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    password: s.password,
    role: "seller",
    phone: `+91 98${String(20000000 + idx * 137).slice(0, 8)}`,
    emailVerified: true,
    status: "active",
    storeDescription: s.description,
    supportEmail: s.email,
    supportPhone: `+91 80${String(40000000 + idx * 211).slice(0, 8)}`,
    gstin: `29ABCDE${String(1000 + idx)}F1Z${idx % 10}`,
    verificationStatus: idx === 18 ? "Pending" : "Verified", // one store awaiting verification
    addresses: [{
      label: "Store",
      line1: `${10 + idx} Market Road`,
      line2: `${s.name}`,
      city: s.city,
      state: "India",
      pincode: String(560001 + idx * 7),
      phone: `+91 98${String(20000000 + idx * 137).slice(0, 8)}`,
      isDefault: true,
    }],
  }));
}

module.exports = { SELLERS, sellerForCategory, sellerAccounts };
