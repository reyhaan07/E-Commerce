// Dummy data — replace with real API data later

export const categories = [
  { id: 1, name: "Mobiles", icon: "📱", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop" },
  { id: 2, name: "Fashion", icon: "👗", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop" },
  { id: 3, name: "Electronics", icon: "💻", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop" },
  { id: 4, name: "Home & Kitchen", icon: "🏠", image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&h=300&fit=crop" },
  { id: 5, name: "Beauty", icon: "💄", image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop" },
  { id: 6, name: "Footwear", icon: "👟", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop" },
  { id: 7, name: "Toys", icon: "🧸", image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300&h=300&fit=crop" },
  { id: 8, name: "Sports", icon: "⚽", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300&h=300&fit=crop" },
];

const productImages = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1495121605193-b116b5b09a06?w=500&h=500&fit=crop",
  "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&h=500&fit=crop",
];

const names = [
  "Wireless Bluetooth Headphones",
  "Running Sports Shoes",
  "Smart Fitness Watch",
  "Cotton Casual Shirt",
  "Stainless Steel Water Bottle",
  "Leather Wallet for Men",
  "4K Action Camera",
  "Ergonomic Office Chair",
  "Portable Bluetooth Speaker",
  "Designer Sunglasses",
  "Mechanical Gaming Keyboard",
  "Ceramic Coffee Mug Set",
];

const brands = ["Zentro", "Pulse", "Aura", "Nimbus", "Vertex", "Orbit", "Cascade", "Halo"];

export const products = Array.from({ length: 50 }, (_, i) => {
  const price = Math.floor(500 + Math.random() * 9500);
  const discount = [0, 10, 15, 20, 30, 40][i % 6];
  const original = Math.round(price / (1 - discount / 100));
  return {
    id: i + 1,
    name: `${brands[i % brands.length]} ${names[i % names.length]}`,
    brand: brands[i % brands.length],
    category: categories[i % categories.length].name,
    price,
    originalPrice: discount > 0 ? original : price,
    discount,
    rating: +(3.5 + (Math.random() * 1.5)).toFixed(1),
    reviews: Math.floor(20 + Math.random() * 980),
    image: productImages[i % productImages.length],
    images: [
      productImages[i % productImages.length],
      productImages[(i + 1) % productImages.length],
      productImages[(i + 2) % productImages.length],
      productImages[(i + 3) % productImages.length],
    ],
    description:
      "Premium quality product crafted with attention to detail. Designed for everyday use with durable materials, modern aesthetics, and reliable performance. Backed by warranty and easy returns.",
    inStock: Math.random() > 0.1,
    isNew: i % 5 === 0,
    isTrending: i % 4 === 0,
    isFeatured: i % 3 === 0,
  };
});

export const banners = [
  {
    id: 1,
    title: "Big Summer Sale",
    subtitle: "Up to 60% off on Electronics",
    cta: "Shop Now",
    bg: "from-brand-700 via-brand-600 to-sky-accent",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=500&fit=crop",
  },
  {
    id: 2,
    title: "New Fashion Arrivals",
    subtitle: "Trending styles for every season",
    cta: "Explore Collection",
    bg: "from-brand-800 via-brand-600 to-brand-400",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=500&fit=crop",
  },
  {
    id: 3,
    title: "Smart Home Essentials",
    subtitle: "Upgrade your lifestyle today",
    cta: "Discover More",
    bg: "from-sky-accent via-brand-600 to-brand-800",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=500&fit=crop",
  },
];

export const orders = [
  {
    id: "ORD7821",
    date: "2026-06-10",
    status: "Delivered",
    total: 3499,
    items: [products[0], products[3]],
    timeline: ["Ordered", "Shipped", "Out for Delivery", "Delivered"],
    currentStep: 4,
  },
  {
    id: "ORD7790",
    date: "2026-06-05",
    status: "Out for Delivery",
    total: 1299,
    items: [products[5]],
    timeline: ["Ordered", "Shipped", "Out for Delivery", "Delivered"],
    currentStep: 3,
  },
  {
    id: "ORD7654",
    date: "2026-05-28",
    status: "Shipped",
    total: 8999,
    items: [products[8], products[10], products[2]],
    timeline: ["Ordered", "Shipped", "Out for Delivery", "Delivered"],
    currentStep: 2,
  },
  {
    id: "ORD7601",
    date: "2026-05-20",
    status: "Cancelled",
    total: 599,
    items: [products[6]],
    timeline: ["Ordered", "Cancelled"],
    currentStep: 2,
    cancelled: true,
  },
];

export const addresses = [
  {
    id: 1,
    label: "Home",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    line1: "402, Sunrise Apartments, MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    isDefault: true,
  },
  {
    id: 2,
    label: "Office",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    line1: "5th Floor, Tech Park, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400069",
    isDefault: false,
  },
];

export const currentUser = {
  name: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  phone: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop",
  joined: "March 2024",
};

export const formatPrice = (value) =>
  `₹${value.toLocaleString("en-IN")}`;
