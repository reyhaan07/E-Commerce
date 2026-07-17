// Canonical category taxonomy — the single source of truth consumed by the
// categories API, the seed, the storefront navigation, the seller product
// form and the admin catalog pages. 44 top-level categories, each with
// subcategories, each subcategory with product types:
//   Category → Subcategory → Product Type → Product

const CATEGORY_TREE = [
  { name: "Electronics", subcategories: [
    { name: "Televisions", productTypes: ["LED TVs", "Smart TVs", "Projectors"] },
    { name: "Wearables", productTypes: ["Smartwatches", "Fitness Bands"] },
    { name: "Personal Electronics", productTypes: ["E-Readers", "Voice Assistants", "Power Banks"] },
  ]},
  { name: "Mobile Phones & Accessories", subcategories: [
    { name: "Mobile Phones", productTypes: ["Android Phones", "Feature Phones"] },
    { name: "Cases & Covers", productTypes: ["Back Covers", "Flip Covers"] },
    { name: "Charging & Cables", productTypes: ["Chargers", "USB Cables", "Wireless Chargers"] },
  ]},
  { name: "Computers & Laptops", subcategories: [
    { name: "Laptops", productTypes: ["Thin & Light Laptops", "Gaming Laptops"] },
    { name: "Desktops & Monitors", productTypes: ["Monitors", "Mini PCs"] },
    { name: "PC Accessories", productTypes: ["Keyboards", "Mice", "Laptop Stands"] },
  ]},
  { name: "Tablets & Accessories", subcategories: [
    { name: "Tablets", productTypes: ["Android Tablets", "Kids Tablets"] },
    { name: "Tablet Accessories", productTypes: ["Stylus Pens", "Tablet Cases", "Screen Protectors"] },
  ]},
  { name: "Cameras & Photography", subcategories: [
    { name: "Cameras", productTypes: ["DSLR Cameras", "Mirrorless Cameras", "Action Cameras"] },
    { name: "Camera Accessories", productTypes: ["Tripods", "Camera Bags", "Memory Cards"] },
    { name: "Studio Gear", productTypes: ["Ring Lights", "Green Screens"] },
  ]},
  { name: "Audio", subcategories: [
    { name: "Headphones", productTypes: ["Over-Ear Headphones", "True Wireless Earbuds", "Neckbands"] },
    { name: "Speakers", productTypes: ["Bluetooth Speakers", "Soundbars", "Party Speakers"] },
    { name: "Pro Audio", productTypes: ["Microphones", "Audio Interfaces"] },
  ]},
  { name: "Gaming & Consoles", subcategories: [
    { name: "Consoles", productTypes: ["Handheld Consoles", "Retro Consoles"] },
    { name: "Gaming Accessories", productTypes: ["Controllers", "Gaming Headsets", "Gaming Chairs"] },
    { name: "PC Gaming", productTypes: ["Gaming Keyboards", "Gaming Mice"] },
  ]},
  { name: "Smart Home & IoT", subcategories: [
    { name: "Smart Security", productTypes: ["Smart Cameras", "Video Doorbells", "Smart Locks"] },
    { name: "Smart Controls", productTypes: ["Smart Plugs", "Smart Switches"] },
    { name: "Smart Lighting", productTypes: ["Smart Bulbs", "Light Strips"] },
  ]},
  { name: "Home Appliances", subcategories: [
    { name: "Large Appliances", productTypes: ["Refrigerators", "Washing Machines", "Air Conditioners"] },
    { name: "Small Appliances", productTypes: ["Vacuum Cleaners", "Irons", "Water Purifiers"] },
    { name: "Climate Comfort", productTypes: ["Fans", "Room Heaters", "Air Purifiers"] },
  ]},
  { name: "Kitchen & Dining", subcategories: [
    { name: "Cookware", productTypes: ["Pressure Cookers", "Non-Stick Pans", "Kadai & Woks"] },
    { name: "Kitchen Appliances", productTypes: ["Mixer Grinders", "Air Fryers", "Electric Kettles"] },
    { name: "Dining & Serveware", productTypes: ["Dinner Sets", "Water Bottles", "Lunch Boxes"] },
  ]},
  { name: "Home & Furniture", subcategories: [
    { name: "Living Room", productTypes: ["Sofas", "Coffee Tables", "TV Units"] },
    { name: "Bedroom", productTypes: ["Beds", "Mattresses", "Wardrobes"] },
    { name: "Study & Office", productTypes: ["Study Desks", "Office Chairs", "Bookshelves"] },
  ]},
  { name: "Home Decor", subcategories: [
    { name: "Wall Decor", productTypes: ["Wall Art", "Clocks", "Mirrors"] },
    { name: "Soft Furnishing", productTypes: ["Cushion Covers", "Curtains", "Rugs"] },
    { name: "Accents", productTypes: ["Vases", "Candles & Holders", "Photo Frames"] },
  ]},
  { name: "Lighting", subcategories: [
    { name: "Indoor Lighting", productTypes: ["Table Lamps", "Floor Lamps", "Ceiling Lights"] },
    { name: "Decorative Lighting", productTypes: ["String Lights", "Lanterns"] },
    { name: "Outdoor Lighting", productTypes: ["Garden Lights", "Solar Lights"] },
  ]},
  { name: "Tools & Home Improvement", subcategories: [
    { name: "Power Tools", productTypes: ["Drills", "Angle Grinders"] },
    { name: "Hand Tools", productTypes: ["Tool Kits", "Screwdriver Sets", "Measuring Tapes"] },
    { name: "Home Utility", productTypes: ["Ladders", "Wall Shelves & Brackets", "Adhesives & Tapes"] },
  ]},
  { name: "Automotive", subcategories: [
    { name: "Car Accessories", productTypes: ["Car Chargers", "Seat Covers", "Dash Cameras"] },
    { name: "Car Care", productTypes: ["Car Shampoos", "Microfiber Cloths", "Vacuum Cleaners"] },
    { name: "Tyres & Oils", productTypes: ["Engine Oils", "Tyre Inflators"] },
  ]},
  { name: "Motorcycle Accessories", subcategories: [
    { name: "Rider Gear", productTypes: ["Helmets", "Riding Gloves", "Riding Jackets"] },
    { name: "Bike Add-ons", productTypes: ["Phone Mounts", "Bike Covers", "Tank Pads"] },
    { name: "Bike Care", productTypes: ["Chain Lubes", "Bike Polishes"] },
  ]},
  { name: "Industrial & Scientific", subcategories: [
    { name: "Measurement & Testing", productTypes: ["Multimeters", "Vernier Calipers", "Weighing Scales"] },
    { name: "Safety Supplies", productTypes: ["Safety Helmets", "Safety Gloves", "Safety Goggles"] },
    { name: "Lab Equipment", productTypes: ["Microscopes", "Lab Glassware"] },
  ]},
  { name: "Office Products", subcategories: [
    { name: "Office Electronics", productTypes: ["Printers", "Label Makers", "Shredders"] },
    { name: "Office Furniture", productTypes: ["Ergonomic Chairs", "Standing Desks"] },
    { name: "Office Supplies", productTypes: ["Files & Folders", "Whiteboards", "Desk Organizers"] },
  ]},
  { name: "Stationery & School Supplies", subcategories: [
    { name: "Writing", productTypes: ["Pens", "Pencils", "Highlighters"] },
    { name: "Paper Products", productTypes: ["Notebooks", "Sticky Notes", "Sketchbooks"] },
    { name: "School Gear", productTypes: ["Geometry Boxes", "School Bags", "Pencil Cases"] },
  ]},
  { name: "Books", subcategories: [
    { name: "Fiction", productTypes: ["Literary Fiction", "Thrillers", "Fantasy"] },
    { name: "Non-Fiction", productTypes: ["Self-Help", "Biographies", "Business"] },
    { name: "Academic", productTypes: ["Exam Prep", "Reference"] },
  ]},
  { name: "Movies, Music & Games", subcategories: [
    { name: "Music", productTypes: ["Vinyl Records", "Audio CDs"] },
    { name: "Movies", productTypes: ["Blu-rays", "DVD Box Sets"] },
    { name: "Video Games", productTypes: ["Console Games", "PC Games"] },
  ]},
  { name: "Toys & Games", subcategories: [
    { name: "Building & Learning", productTypes: ["Building Blocks", "STEM Kits", "Puzzles"] },
    { name: "Action & Play", productTypes: ["Action Figures", "RC Toys", "Soft Toys"] },
    { name: "Family Games", productTypes: ["Board Games", "Card Games"] },
  ]},
  { name: "Baby Products", subcategories: [
    { name: "Baby Care", productTypes: ["Diapers", "Baby Wipes", "Baby Skincare"] },
    { name: "Feeding", productTypes: ["Feeding Bottles", "Sterilizers", "High Chairs"] },
    { name: "Baby Travel", productTypes: ["Strollers", "Baby Carriers", "Car Seats"] },
  ]},
  { name: "Kids' Fashion", subcategories: [
    { name: "Boys' Clothing", productTypes: ["T-Shirts", "Jeans & Trousers"] },
    { name: "Girls' Clothing", productTypes: ["Frocks & Dresses", "Leggings Sets"] },
    { name: "Kids' Accessories", productTypes: ["Kids' Caps", "Kids' Backpacks"] },
  ]},
  { name: "Men's Fashion", subcategories: [
    { name: "Topwear", productTypes: ["T-Shirts", "Casual Shirts", "Formal Shirts"] },
    { name: "Bottomwear", productTypes: ["Jeans", "Chinos", "Track Pants"] },
    { name: "Ethnic & Outerwear", productTypes: ["Kurtas", "Jackets", "Sweatshirts"] },
  ]},
  { name: "Women's Fashion", subcategories: [
    { name: "Western Wear", productTypes: ["Tops", "Dresses", "Jeans"] },
    { name: "Ethnic Wear", productTypes: ["Kurtis", "Sarees", "Lehenga Sets"] },
    { name: "Winter Wear", productTypes: ["Cardigans", "Shrugs"] },
  ]},
  { name: "Footwear", subcategories: [
    { name: "Men's Footwear", productTypes: ["Running Shoes", "Sneakers", "Formal Shoes"] },
    { name: "Women's Footwear", productTypes: ["Flats", "Heels", "Sports Shoes"] },
    { name: "Everyday Footwear", productTypes: ["Sandals", "Flip Flops"] },
  ]},
  { name: "Watches", subcategories: [
    { name: "Men's Watches", productTypes: ["Analog Watches", "Chronographs"] },
    { name: "Women's Watches", productTypes: ["Analog Watches", "Bracelet Watches"] },
    { name: "Watch Accessories", productTypes: ["Watch Straps", "Watch Boxes"] },
  ]},
  { name: "Jewelry", subcategories: [
    { name: "Everyday Jewelry", productTypes: ["Earrings", "Pendants & Chains", "Rings"] },
    { name: "Traditional Jewelry", productTypes: ["Jhumkas", "Bangles", "Maang Tikkas"] },
    { name: "Men's Jewelry", productTypes: ["Bracelets", "Chains"] },
  ]},
  { name: "Beauty & Personal Care", subcategories: [
    { name: "Skincare", productTypes: ["Face Wash", "Moisturizers", "Sunscreens", "Serums"] },
    { name: "Haircare", productTypes: ["Shampoos", "Hair Oils", "Hair Styling Tools"] },
    { name: "Makeup", productTypes: ["Lipsticks", "Kajal & Liners", "Foundations"] },
  ]},
  { name: "Health & Wellness", subcategories: [
    { name: "Supplements", productTypes: ["Multivitamins", "Protein Supplements", "Omega-3"] },
    { name: "Health Devices", productTypes: ["BP Monitors", "Thermometers", "Massagers"] },
    { name: "Everyday Wellness", productTypes: ["Immunity Boosters", "Sleep Aids"] },
  ]},
  { name: "Grocery & Gourmet Foods", subcategories: [
    { name: "Staples & Snacks", productTypes: ["Dry Fruits", "Snack Boxes", "Breakfast Cereals"] },
    { name: "Beverages", productTypes: ["Teas", "Coffees", "Health Drinks"] },
    { name: "Gourmet", productTypes: ["Chocolates", "Honey & Spreads", "Spice Kits"] },
  ]},
  { name: "Pet Supplies", subcategories: [
    { name: "Dog Supplies", productTypes: ["Dog Food", "Dog Toys", "Leashes & Collars"] },
    { name: "Cat Supplies", productTypes: ["Cat Food", "Litter & Trays", "Scratchers"] },
    { name: "Small Pets & Aquatics", productTypes: ["Aquarium Kits", "Bird Cages"] },
  ]},
  { name: "Sports & Outdoors", subcategories: [
    { name: "Team Sports", productTypes: ["Cricket Gear", "Footballs", "Badminton Rackets"] },
    { name: "Outdoor Adventure", productTypes: ["Tents", "Trekking Poles", "Sleeping Bags"] },
    { name: "Cycling", productTypes: ["Bicycles", "Cycling Helmets"] },
  ]},
  { name: "Fitness Equipment", subcategories: [
    { name: "Strength Training", productTypes: ["Dumbbells", "Kettlebells", "Resistance Bands"] },
    { name: "Cardio Machines", productTypes: ["Treadmills", "Exercise Bikes", "Skipping Ropes"] },
    { name: "Yoga & Recovery", productTypes: ["Yoga Mats", "Foam Rollers", "Massage Guns"] },
  ]},
  { name: "Luggage & Travel", subcategories: [
    { name: "Luggage", productTypes: ["Trolley Bags", "Cabin Luggage", "Duffel Bags"] },
    { name: "Backpacks", productTypes: ["Laptop Backpacks", "Travel Backpacks"] },
    { name: "Travel Accessories", productTypes: ["Neck Pillows", "Packing Cubes", "Travel Adapters"] },
  ]},
  { name: "Musical Instruments", subcategories: [
    { name: "String Instruments", productTypes: ["Acoustic Guitars", "Ukuleles", "Electric Guitars"] },
    { name: "Keys & Percussion", productTypes: ["Keyboards", "Cajons", "Tablas"] },
    { name: "Instrument Accessories", productTypes: ["Guitar Strings", "Capos & Tuners", "Instrument Bags"] },
  ]},
  { name: "Arts, Crafts & Sewing", subcategories: [
    { name: "Painting & Drawing", productTypes: ["Acrylic Paint Sets", "Sketch Pencils", "Canvases"] },
    { name: "Craft Supplies", productTypes: ["Origami Paper", "Glue Guns", "Craft Kits"] },
    { name: "Sewing & Embroidery", productTypes: ["Sewing Machines", "Embroidery Kits", "Yarn & Wool"] },
  ]},
  { name: "Garden & Outdoor Living", subcategories: [
    { name: "Gardening", productTypes: ["Planters & Pots", "Seeds & Bulbs", "Garden Tools"] },
    { name: "Outdoor Furniture", productTypes: ["Patio Sets", "Hammocks", "Swing Chairs"] },
    { name: "Outdoor Essentials", productTypes: ["Watering Cans", "Bird Feeders"] },
  ]},
  { name: "Gifts & Gift Cards", subcategories: [
    { name: "Gift Sets", productTypes: ["Gift Hampers", "Corporate Gift Sets"] },
    { name: "Personalized Gifts", productTypes: ["Photo Mugs", "Engraved Keepsakes", "Custom Cushions"] },
    { name: "Gift Cards", productTypes: ["E-Gift Cards", "Physical Gift Cards"] },
  ]},
  { name: "Collectibles", subcategories: [
    { name: "Figurines & Models", productTypes: ["Anime Figures", "Diecast Cars", "Model Kits"] },
    { name: "Trading & Memorabilia", productTypes: ["Trading Cards", "Sports Memorabilia"] },
    { name: "Vintage & Antiques", productTypes: ["Coins & Stamps", "Vintage Posters"] },
  ]},
  { name: "Handmade Products", subcategories: [
    { name: "Handmade Decor", productTypes: ["Macrame", "Handmade Pottery", "Woven Baskets"] },
    { name: "Handmade Fashion", productTypes: ["Handloom Stoles", "Handmade Jewelry"] },
    { name: "Handmade Care", productTypes: ["Artisan Soaps", "Hand-Poured Candles"] },
  ]},
  { name: "Party Supplies", subcategories: [
    { name: "Decorations", productTypes: ["Balloons & Arches", "Banners", "Party Props"] },
    { name: "Tableware", productTypes: ["Paper Plates & Cups", "Cake Toppers"] },
    { name: "Celebration Extras", productTypes: ["Return Gifts", "Party Poppers"] },
  ]},
  { name: "Religious & Spiritual Items", subcategories: [
    { name: "Pooja Essentials", productTypes: ["Pooja Thalis", "Incense & Dhoop", "Diyas & Lamps"] },
    { name: "Idols & Frames", productTypes: ["Brass Idols", "Spiritual Frames"] },
    { name: "Spiritual Living", productTypes: ["Meditation Mats", "Rudraksha & Malas"] },
  ]},
];

// flat helpers derived from the tree
const CATEGORY_NAMES = CATEGORY_TREE.map((c) => c.name);

function findCategory(name) {
  return CATEGORY_TREE.find((c) => c.name === name) || null;
}

function isValidPlacement(category, subcategory, productType) {
  const cat = findCategory(category);
  if (!cat) return false;
  if (subcategory === undefined || subcategory === null || subcategory === "") return true;
  const sub = cat.subcategories.find((s) => s.name === subcategory);
  if (!sub) return false;
  if (productType === undefined || productType === null || productType === "") return true;
  return sub.productTypes.includes(productType);
}

module.exports = { CATEGORY_TREE, CATEGORY_NAMES, findCategory, isValidPlacement };
