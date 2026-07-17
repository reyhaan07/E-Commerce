// Unsplash image pool for the seeded catalog, grouped by theme. Every id
// follows the same https://images.unsplash.com/<id>?q=80&w=800 pattern the
// original seed used. The pool is intentionally small and reused across
// products — a repeated image is fine in a demo, a broken one is not.

const img = (id) => `https://images.unsplash.com/${id}?q=80&w=800`;

// theme → list of photo ids
const POOLS = {
  electronics: [
    "photo-1505740420928-5e560c06d30e", // headphones
    "photo-1546868871-7041f2a55e12", // smartwatch
    "photo-1527443224154-c4a3942d3acf", // monitor
    "photo-1558002038-1055907df827", // smart home
    "photo-1609091839311-d5365f9ff1c5", // power bank
    "photo-1461749280684-dccba630e2f6", // screen
  ],
  computing: [
    "photo-1496181133206-80ce9b88a853", // laptop
    "photo-1517336714731-489689fd1ca8", // macbook
    "photo-1541140532154-b024d705b90a", // keyboard
    "photo-1527443224154-c4a3942d3acf", // monitor
  ],
  phones: [
    "photo-1511707171634-5f897ff02aa9", // phone in hand
    "photo-1585060544812-6b45742d762f", // phone
    "photo-1512499617640-c74ae3a79d37", // phone accessories
  ],
  camera: [
    "photo-1516035069371-29a1b244cc32", // camera
    "photo-1526317899290-e1c8ba09e5b8", // action camera
    "photo-1502920917128-1aa500764cbd", // camera gear
  ],
  audio: [
    "photo-1505740420928-5e560c06d30e", // headphones
    "photo-1590658268037-6bf12165a8df", // earbuds
    "photo-1608043152269-423dbba4e7e1", // speaker
    "photo-1583394838336-acd977736f90", // headphones red
    "photo-1524678606370-a47ad25cb82a", // headphones stand
  ],
  furniture: [
    "photo-1555041469-a586c61ea9bc", // sofa
    "photo-1586023492125-27b2c045efd7", // chair
    "photo-1505797149-43c0c19629f6", // desk chair
    "photo-1484101403633-562f891dc89a", // living room
  ],
  decor: [
    "photo-1513506003901-1e6a229e2d15", // decor candles
    "photo-1602874801007-bd458bb1b8b6", // candle trio
    "photo-1584100936595-c0654b55a2e2", // pillow
    "photo-1507473885765-e6ed057f782c", // lamp
    "photo-1515488042361-ee00e0ddd4e4", // lamp warm
  ],
  kitchen: [
    "photo-1556909114-f6e7ad7d3136", // kitchen appliance
    "photo-1570222094114-d054a817e56b", // juicer
    "photo-1603199506016-b9a594b593c0", // dinner set
    "photo-1519892300165-cb5542fb47c7", // kitchen
  ],
  fashion: [
    "photo-1521572163474-6864f9cf17ab", // tshirt
    "photo-1542272604-787c3835535d", // jeans
    "photo-1556821840-3a63f95609a7", // hoodie
    "photo-1610030469983-98e550d6193c", // kurta
    "photo-1483985988355-763728e1935b", // fashion shopping
    "photo-1489987707025-afc232f7ea0f", // clothes rack
    "photo-1434389677669-e08b4cac3105", // clothes
  ],
  footwear: [
    "photo-1542291026-7eec264c27ff", // red shoe
    "photo-1549298916-b41d501d3772", // white sneaker
    "photo-1560343090-f0409e92791a", // loafers
    "photo-1520639888713-7851133b1ed0", // boots
    "photo-1603487742131-4160ec999306", // flip flops
    "photo-1543163521-1bf539c55dd2", // heels
  ],
  accessories: [
    "photo-1523275335684-37898b6baf30", // watch
    "photo-1524805444758-089113d48a6d", // watch steel
    "photo-1627123424574-724758594e93", // wallet
    "photo-1572635196237-14b3f281503f", // sunglasses
    "photo-1553062407-98eeb64c6a62", // backpack
  ],
  jewelry: [
    "photo-1515562141207-7a88fb7ce338", // ring
    "photo-1599643478518-a784e5dc4c8f", // jewelry box
  ],
  beauty: [
    "photo-1596462502278-27bfdc403348", // makeup
    "photo-1522335789203-aabd1fc54bc9", // makeup brushes
    "photo-1571781926291-c477ebfd024b", // skincare
    "photo-1556228720-195a672e8a03", // skincare bottle
  ],
  wellness: [
    "photo-1544367567-0f2fcb009e0b", // yoga
    "photo-1506126613408-eca07ce68773", // meditation
    "photo-1575311373937-040b8e1fd5b6", // fitness tracker
  ],
  grocery: [
    "photo-1542838132-92c53300491e", // grocery store
    "photo-1506617420156-8e4536971650", // vegetables
    "photo-1585515320310-259814833e62", // groceries
  ],
  pets: [
    "photo-1587300003388-59208cc962cb", // dog
    "photo-1450778869180-41d0601e046e", // dog with human
    "photo-1514888286974-6c03e2ca1dba", // cat
  ],
  sports: [
    "photo-1592432678016-e910b452f9a2", // yoga mat
    "photo-1638536532686-d610adfc8e5c", // dumbbells
    "photo-1517836357463-d25dfeac3438", // gym
    "photo-1571019613454-1cb2f99b2d8b", // fitness
    "photo-1485965120184-e220f721d03e", // bicycle
    "photo-1517649763962-0c623066013b", // cycling race
    "photo-1519183071298-a2962feb14f4", // tent
  ],
  travel: [
    "photo-1553531384-cc64ac80f931", // luggage
    "photo-1565026057447-bc90a3dceb87", // suitcase
    "photo-1500835556837-99ac94a94552", // travel
    "photo-1553062407-98eeb64c6a62", // backpack
  ],
  music: [
    "photo-1510915361894-db8b60106cb1", // guitar
    "photo-1567538096630-e0c55bd6374c", // guitar wall
    "photo-1520523839897-bd0b52f945a0", // piano
  ],
  books: [
    "photo-1512820790803-83ca734da794", // book
    "photo-1495446815901-a7297e633e8d", // books stack
    "photo-1524578271613-d550eacf6090", // books
    "photo-1519682337058-a94d519337bc", // book lamp
  ],
  stationery: [
    "photo-1456735190827-d1262f71b8a3", // pencils
    "photo-1481070555726-e2fe8357725c", // desk stationery
  ],
  toys: [
    "photo-1587654780291-39c9404d746b", // blocks
    "photo-1513475382585-d06e58bcb0e0", // toys
    "photo-1478146896981-b80fe463b330", // teddy
  ],
  baby: [
    "photo-1522771930-78848d9293e8", // baby
    "photo-1596461404969-9ae70f2830c1", // baby feet
    "photo-1519689680058-324335c77eba", // baby toys
  ],
  tools: [
    "photo-1504148455328-c376907d081c", // tools
    "photo-1525974160448-038dacadcc71", // toolbox
  ],
  auto: [
    "photo-1449426468159-d96dbf08f19f", // car
    "photo-1503376780353-7e6692767b70", // sports car
    "photo-1558981403-c5f9899a28bc", // motorcycle
    "photo-1558980664-10e7170b5df9", // biker gear
  ],
  garden: [
    "photo-1416879595882-3373a0480b5b", // garden
    "photo-1466692476868-aef1dfb1e735", // garden path
  ],
  gifts: [
    "photo-1549465220-1a8b9238cd48", // gift box
    "photo-1513201099705-a9746e1e201f", // gifts
    "photo-1530103862676-de8c9debad1d", // party balloons
  ],
  handmade: [
    "photo-1503602642458-232111445657", // pottery mug
    "photo-1513201099705-a9746e1e201f", // wrapped
    "photo-1602874801007-bd458bb1b8b6", // candles
  ],
  collectibles: [
    "photo-1454117096348-e4abbeba002c", // typewriter
    "photo-1513475382585-d06e58bcb0e0", // figures
  ],
  spiritual: [
    "photo-1602874801007-bd458bb1b8b6", // diya-like candles
    "photo-1506126613408-eca07ce68773", // meditation
  ],
  office: [
    "photo-1481070555726-e2fe8357725c", // desk
    "photo-1497366216548-37526070297c", // office
    "photo-1505797149-43c0c19629f6", // chair
  ],
  appliances: [
    "photo-1556909114-f6e7ad7d3136", // appliance
    "photo-1558002038-1055907df827", // smart home
  ],
  industrial: [
    "photo-1504148455328-c376907d081c", // tools
    "photo-1461749280684-dccba630e2f6", // electronics bench
  ],
  gaming: [
    "photo-1541140532154-b024d705b90a", // rgb keyboard
    "photo-1558002038-1055907df827", // setup
    "photo-1527443224154-c4a3942d3acf", // monitor
  ],
  lighting: [
    "photo-1507473885765-e6ed057f782c", // lamp
    "photo-1515488042361-ee00e0ddd4e4", // lamp warm
  ],
  party: [
    "photo-1530103862676-de8c9debad1d", // balloons
    "photo-1513201099705-a9746e1e201f", // gifts
  ],
  crafts: [
    "photo-1456735190827-d1262f71b8a3", // pencils
    "photo-1503602642458-232111445657", // pottery
  ],
  movies: [
    "photo-1512820790803-83ca734da794", // media
    "photo-1454117096348-e4abbeba002c", // vintage
  ],
  kids: [
    "photo-1522771930-78848d9293e8", // kid
    "photo-1513475382585-d06e58bcb0e0", // toys
  ],
  watches: [
    "photo-1523275335684-37898b6baf30",
    "photo-1524805444758-089113d48a6d",
  ],
  health: [
    "photo-1571781926291-c477ebfd024b", // bottles
    "photo-1544367567-0f2fcb009e0b", // yoga
  ],
};

// category name → pool key
const CATEGORY_POOL = {
  "Electronics": "electronics",
  "Mobile Phones & Accessories": "phones",
  "Computers & Laptops": "computing",
  "Tablets & Accessories": "phones",
  "Cameras & Photography": "camera",
  "Audio": "audio",
  "Gaming & Consoles": "gaming",
  "Smart Home & IoT": "electronics",
  "Home Appliances": "appliances",
  "Kitchen & Dining": "kitchen",
  "Home & Furniture": "furniture",
  "Home Decor": "decor",
  "Lighting": "lighting",
  "Tools & Home Improvement": "tools",
  "Automotive": "auto",
  "Motorcycle Accessories": "auto",
  "Industrial & Scientific": "industrial",
  "Office Products": "office",
  "Stationery & School Supplies": "stationery",
  "Books": "books",
  "Movies, Music & Games": "movies",
  "Toys & Games": "toys",
  "Baby Products": "baby",
  "Kids' Fashion": "kids",
  "Men's Fashion": "fashion",
  "Women's Fashion": "fashion",
  "Footwear": "footwear",
  "Watches": "watches",
  "Jewelry": "jewelry",
  "Beauty & Personal Care": "beauty",
  "Health & Wellness": "health",
  "Grocery & Gourmet Foods": "grocery",
  "Pet Supplies": "pets",
  "Sports & Outdoors": "sports",
  "Fitness Equipment": "sports",
  "Luggage & Travel": "travel",
  "Musical Instruments": "music",
  "Arts, Crafts & Sewing": "crafts",
  "Garden & Outdoor Living": "garden",
  "Gifts & Gift Cards": "gifts",
  "Collectibles": "collectibles",
  "Handmade Products": "handmade",
  "Party Supplies": "party",
  "Religious & Spiritual Items": "spiritual",
};

// deterministic image picker: nth product of a category cycles its pool
function imagesFor(category, index) {
  const pool = POOLS[CATEGORY_POOL[category]] || POOLS.electronics;
  const primary = pool[index % pool.length];
  const secondary = pool[(index + 1) % pool.length];
  return primary === secondary ? [img(primary)] : [img(primary), img(secondary)];
}

module.exports = { img, imagesFor };
