// Expands the compact catalog entries into full Product documents.
// Everything derived here is a pure function of the entry's position, so
// reseeding always produces the identical world.

const { CATEGORY_TREE } = require("./categories");
const { imagesFor } = require("./images");
const { sellerForCategory } = require("./sellers");
const catalogA = require("./catalog-a");
const catalogB = require("./catalog-b");

const CATALOG = { ...catalogA, ...catalogB };

// one line of marketplace flavour per category, used in the description
const FLAVOR = {
  "Electronics": "packed with the everyday tech that upgrades your routine",
  "Mobile Phones & Accessories": "built for how India uses its phones — fast, long-lasting and drop-ready",
  "Computers & Laptops": "made for work, study and everything after hours",
  "Tablets & Accessories": "big-screen convenience for entertainment, notes and video calls",
  "Cameras & Photography": "engineered so every frame comes out the way you saw it",
  "Audio": "tuned for punchy bass, clear vocals and marathon listening sessions",
  "Gaming & Consoles": "built for lag-free sessions and serious play",
  "Smart Home & IoT": "makes your home safer and smarter from your phone",
  "Home Appliances": "dependable performance that handles Indian summers, monsoons and power cuts",
  "Kitchen & Dining": "kitchen-tested for daily Indian cooking",
  "Home & Furniture": "crafted to bring comfort and character to your space",
  "Home Decor": "an easy refresh that changes how a room feels",
  "Lighting": "warm, efficient light for every corner",
  "Tools & Home Improvement": "job-site tough for weekend projects and quick fixes",
  "Automotive": "keeps your car cleaner, safer and better equipped",
  "Motorcycle Accessories": "ride-ready gear for daily commutes and long weekends",
  "Industrial & Scientific": "accurate, rugged and ready for the workshop or lab",
  "Office Products": "keeps your workspace productive and organised",
  "Stationery & School Supplies": "smooth-writing essentials for school, college and office",
  "Books": "a reader favourite from our editors' shelf",
  "Movies, Music & Games": "for collectors who love their entertainment physical",
  "Toys & Games": "safe, sturdy fun that keeps kids coming back",
  "Baby Products": "gentle, parent-approved and safety-tested",
  "Kids' Fashion": "soft on skin and made for playgrounds",
  "Men's Fashion": "everyday style that fits right and lasts",
  "Women's Fashion": "designed to move from workday to weekend",
  "Footwear": "cushioned support from the first step",
  "Watches": "precision movement wrapped in a design worth wearing",
  "Jewelry": "finished by hand for a little everyday sparkle",
  "Beauty & Personal Care": "dermat-friendly formulas that fit Indian skin and weather",
  "Health & Wellness": "small daily habits, backed by honest ingredients",
  "Grocery & Gourmet Foods": "sourced fresh and packed for flavour",
  "Pet Supplies": "vet-approved happiness for your furry family",
  "Sports & Outdoors": "match-day quality for players at every level",
  "Fitness Equipment": "gym-grade gear for home workouts",
  "Luggage & Travel": "travel-tested through airports, trains and road trips",
  "Musical Instruments": "stage-worthy sound for beginners and pros alike",
  "Arts, Crafts & Sewing": "everything a maker needs to start creating today",
  "Garden & Outdoor Living": "brings a little more green into every day",
  "Gifts & Gift Cards": "wrapped and ready to make someone's day",
  "Collectibles": "authentic pieces for serious collectors",
  "Handmade Products": "made in small batches by Indian artisans",
  "Party Supplies": "everything you need before the guests arrive",
  "Religious & Spiritual Items": "crafted with devotion for your daily rituals",
};

const WARRANTIES = ["6 Months", "1 Year", "2 Years"];
const BOX_NOTES = ["Product, user guide and warranty card", "Product with all standard accessories", "Product and quick-start guide"];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildProducts() {
  const products = [];
  let n = 0;

  for (const category of CATEGORY_TREE) {
    const entries = CATALOG[category.name] || [];
    entries.forEach(([name, brand, subcategory, productType, price, oldPrice], indexInCategory) => {
      n += 1;
      const id = `prod-${n}`;

      // deterministic stock mix: a few out of stock, some low, most healthy
      let stock;
      if (n % 47 === 3) stock = 0;
      else if (n % 11 === 5) stock = 2 + (n % 3);
      else stock = 10 + ((n * 7) % 70);

      const approvalStatus = n % 50 === 7 ? "Pending" : "Approved"; // ~9 pending

      products.push({
        id,
        sellerId: sellerForCategory(category.name),
        name,
        slug: `${slugify(name)}-${id}`,
        brand,
        description: `${name} by ${brand} — ${FLAVOR[category.name]}. Backed by ShopSphere's easy returns and doorstep delivery, it's a customer favourite in ${productType}.`,
        category: category.name,
        subcategory,
        productType,
        price,
        oldPrice: oldPrice || null,
        discount: oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0,
        images: imagesFor(category.name, indexInCategory),
        specs: [
          { label: "Brand", value: brand },
          { label: "Type", value: productType },
          { label: "Warranty", value: WARRANTIES[n % WARRANTIES.length] },
          { label: "In the Box", value: BOX_NOTES[n % BOX_NOTES.length] },
          { label: "Country of Origin", value: "India" },
        ],
        sku: `SKU-${String(n).padStart(4, "0")}`,
        stock,
        approvalStatus,
        rating: 0, // recomputed from approved reviews after seeding
        ratingCount: 0,
        isNewArrival: n % 13 === 0,
        createdAt: new Date(Date.UTC(2026, 3, 20 + (n % 60), 6 + (n % 12), 0, 0)),
      });
    });
  }

  return products;
}

module.exports = { buildProducts, CATALOG };
