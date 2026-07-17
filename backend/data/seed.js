// Initial demo data for ShopSphere. On server startup, this seeds MongoDB
// with the data below only if the collections are still empty, so a fresh
// local database always starts with demo accounts for all four roles,
// a 24-product catalog, and orders in a spread of lifecycle states.

const { Order } = require("../models/order.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");

const DEMO_CREDENTIALS = [
  ["admin", "admin@shopsphere.com", "admin1234"],
  ["seller", "seller@shopsphere.com", "seller1234"],
  ["user", "aditi@example.com", "aditi123"],
  ["user", "rahul@example.com", "rahul123"],
  ["delivery", "ravi.delivery@shopsphere.com", "ravi123"],
  ["delivery", "sunita.delivery@shopsphere.com", "sunita123"],
];

const staffAccounts = [
  {
    id: "admin-1",
    name: "Platform Admin",
    email: "admin@shopsphere.com",
    password: "admin1234",
    role: "admin",
    phone: "+91 44 4210 0001",
    emailVerified: true,
  },
  {
    id: "seller-1",
    name: "ShopSphere Store",
    email: "seller@shopsphere.com",
    password: "seller1234",
    role: "seller",
    phone: "+91 44 4210 5566",
    emailVerified: true,
    addresses: [
      {
        label: "Store",
        line1: "14 Anna Salai",
        line2: "T Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600017",
        phone: "+91 44 4210 5566",
        isDefault: true,
      },
    ],
    sellerRating: 4.4,
    sellerRatingCount: 3,
  },
];

const users = [
  {
    id: "user-1",
    name: "Aditi Verma",
    email: "aditi@example.com",
    password: "aditi123",
    role: "user",
    phone: "+91 98765 43210",
    emailVerified: true,
    addresses: [
      {
        label: "Home",
        line1: "18 Lake View Road",
        line2: "Anna Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600040",
        phone: "+91 98765 43210",
        isDefault: true,
      },
    ],
    paymentMethods: [
      { type: "card", label: "HDFC Visa", last4: "4242", isDefault: true },
      { type: "upi", label: "Personal UPI", upiId: "aditi@okbank" },
    ],
    wishlist: [
      { productId: "prod-7", name: "Minimalist Analog Watch", price: 4999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800" },
    ],
    loyaltyPoints: 25,
  },
  {
    id: "user-2",
    name: "Rahul Nair",
    email: "rahul@example.com",
    password: "rahul123",
    role: "user",
    phone: "+91 91234 67890",
    emailVerified: true,
    addresses: [
      {
        label: "Home",
        line1: "44 Green Park Avenue",
        line2: "T Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600017",
        phone: "+91 91234 67890",
        isDefault: true,
      },
    ],
    wishlist: [],
    loyaltyPoints: 50,
  },
];

const deliveryPartners = [
  {
    id: "partner-1",
    name: "Ravi Kumar",
    email: "ravi.delivery@shopsphere.com",
    password: "ravi123",
    phone: "9876543210",
    vehicle: "Bike",
    status: "Active",
  },
  {
    id: "partner-2",
    name: "Sunita Sharma",
    email: "sunita.delivery@shopsphere.com",
    password: "sunita123",
    phone: "9876500000",
    vehicle: "Van",
    status: "Active",
  },
];

// --- Product catalog: 24 products across 6 categories, all sold by seller-1 ---

const img = (id) => `https://images.unsplash.com/${id}?q=80&w=800`;

function product(n, name, category, price, oldPrice, image, stock, extra = {}) {
  const id = `prod-${n}`;
  return {
    id,
    sellerId: "seller-1",
    name,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id}`,
    description: extra.description || `${name} — quality you can rely on, delivered by ShopSphere.`,
    category,
    price,
    oldPrice: oldPrice || null,
    discount: oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0,
    images: [image],
    specs: extra.specs || [],
    sku: `SKU-${String(n).padStart(4, "0")}`,
    stock,
    approvalStatus: extra.approvalStatus || "Approved",
    rating: extra.rating || 0,
    ratingCount: extra.ratingCount || 0,
    isNewArrival: Boolean(extra.isNew),
  };
}

const products = [
  // Electronics
  product(1, "Wireless Headphones", "Electronics", 2499, 3299, img("photo-1505740420928-5e560c06d30e"), 42, {
    rating: 4.5, ratingCount: 2, specs: [{ label: "Battery", value: "30 hours" }, { label: "Connectivity", value: "Bluetooth 5.3" }],
  }),
  product(2, "Bluetooth Speaker", "Electronics", 1599, 1999, img("photo-1608043152269-423dbba4e7e1"), 35, { rating: 4, ratingCount: 1 }),
  product(3, "Smart Watch", "Electronics", 4999, 6499, img("photo-1546868871-7041f2a55e12"), 18, { isNew: true }),
  product(4, "4K Action Camera", "Electronics", 8999, 11999, img("photo-1526317899290-e1c8ba09e5b8"), 9),
  product(5, "USB-C Power Bank 20000mAh", "Electronics", 1899, 2499, img("photo-1609091839311-d5365f9ff1c5"), 60),
  product(6, "Mechanical Keyboard", "Electronics", 3499, 4299, img("photo-1541140532154-b024d705b90a"), 22, { isNew: true }),
  // Accessories
  product(7, "Minimalist Analog Watch", "Accessories", 4999, 5999, img("photo-1523275335684-37898b6baf30"), 15, { rating: 5, ratingCount: 1 }),
  product(8, "Leather Wallet", "Accessories", 899, 1299, img("photo-1627123424574-724758594e93"), 80),
  product(9, "Aviator Sunglasses", "Accessories", 1299, 1799, img("photo-1572635196237-14b3f281503f"), 48),
  product(10, "Laptop Backpack", "Accessories", 2199, 2799, img("photo-1553062407-98eeb64c6a62"), 30),
  // Fashion
  product(11, "Blue Denim Jeans", "Fashion", 1899, 2499, img("photo-1542272604-787c3835535d"), 55),
  product(12, "Classic White Sneaker Tee", "Fashion", 699, 999, img("photo-1521572163474-6864f9cf17ab"), 100),
  product(13, "Hooded Sweatshirt", "Fashion", 1499, 1999, img("photo-1556821840-3a63f95609a7"), 44),
  product(14, "Cotton Kurta", "Fashion", 1099, 1499, img("photo-1610030469983-98e550d6193c"), 38),
  // Footwear
  product(15, "Running Shoes", "Footwear", 1799, 2399, img("photo-1542291026-7eec264c27ff"), 62, { rating: 4.5, ratingCount: 2 }),
  product(16, "Casual Loafers", "Footwear", 1599, 2199, img("photo-1560343090-f0409e92791a"), 27),
  product(17, "Trekking Boots", "Footwear", 3299, 4199, img("photo-1520639888713-7851133b1ed0"), 14),
  product(18, "Flip Flops", "Footwear", 399, 599, img("photo-1603487742131-4160ec999306"), 120),
  // Home & Kitchen
  product(19, "Ceramic Dinner Set (18 pc)", "Home & Kitchen", 2899, 3799, img("photo-1603199506016-b9a594b593c0"), 16),
  product(20, "Cold Press Juicer", "Home & Kitchen", 6499, 8499, img("photo-1570222094114-d054a817e56b"), 8),
  product(21, "Scented Candle Trio", "Home & Kitchen", 799, 1099, img("photo-1602874801007-bd458bb1b8b6"), 70, { isNew: true }),
  product(22, "Memory Foam Pillow", "Home & Kitchen", 1299, 1699, img("photo-1584100936595-c0654b55a2e2"), 40),
  // Sports
  product(23, "Yoga Mat (6mm)", "Sports", 999, 1399, img("photo-1592432678016-e910b452f9a2"), 52),
  // one Pending product so the admin approval queue isn't empty
  product(24, "Adjustable Dumbbell Set", "Sports", 5499, 6999, img("photo-1638536532686-d610adfc8e5c"), 12, { approvalStatus: "Pending" }),
];

// Single-store demo, so every order ships from the same ShopSphere Store address.
const STORE = {
  sellerId: "seller-1",
  sellerName: "ShopSphere Store",
  sellerAddress: "14 Anna Salai, T Nagar, Chennai",
  sellerPhone: "+91 44 4210 5566",
};

const orders = [
  {
    id: "ORD-1001",
    userId: "user-1",
    customerName: "Aditi Verma",
    customerEmail: "aditi@example.com",
    customerPhone: "+91 98765 43210",
    customerAddress: "18 Lake View Road, Anna Nagar, Chennai",
    items: [{ productId: "prod-1", name: "Wireless Headphones", qty: 1, price: 2499 }],
    amount: 2499,
    paymentMethod: "Prepaid",
    razorpayOrderId: "order_seed_1001",
    razorpayPaymentId: "pay_seed_1001",
    createdAt: "2026-06-28T10:15:00.000Z",
    ...STORE,
    sellerStatus: "Ready For Dispatch",
    pickupRequested: true,
    trackingId: "TRK-A1B2C3",
    deliveryStatus: "Assigned",
    deliveryPartnerId: "partner-1",
    deliveryPartnerName: "Ravi Kumar",
    deliveryPartnerPhone: "9876543210",
    statusHistory: [{ status: "Assigned", timestamp: "2026-06-28T11:00:00.000Z" }],
  },
  {
    id: "ORD-1002",
    userId: "user-2",
    customerName: "Rahul Nair",
    customerEmail: "rahul@example.com",
    customerPhone: "+91 91234 67890",
    customerAddress: "44 Green Park Avenue, T Nagar, Chennai",
    items: [{ productId: "prod-3", name: "Smart Watch", qty: 1, price: 4999 }],
    amount: 4999,
    paymentMethod: "Cash on Delivery",
    createdAt: "2026-06-29T09:30:00.000Z",
    ...STORE,
    sellerStatus: "Shipped",
    pickupRequested: true,
    trackingId: "TRK-D4E5F6",
    deliveryStatus: "Out For Delivery",
    deliveryPartnerId: "partner-1",
    deliveryPartnerName: "Ravi Kumar",
    deliveryPartnerPhone: "9876543210",
    statusHistory: [
      { status: "Assigned", timestamp: "2026-06-29T10:00:00.000Z" },
      { status: "Accepted", timestamp: "2026-06-29T10:20:00.000Z" },
      { status: "Picked Up", timestamp: "2026-06-29T12:00:00.000Z" },
      { status: "In Transit", timestamp: "2026-06-29T13:00:00.000Z" },
      { status: "Out For Delivery", timestamp: "2026-06-30T08:00:00.000Z" },
    ],
  },
  {
    // delivered order for user-1 → lets the review + return flows be demoed
    id: "ORD-1003",
    userId: "user-1",
    customerName: "Aditi Verma",
    customerEmail: "aditi@example.com",
    customerPhone: "+91 98765 43210",
    customerAddress: "18 Lake View Road, Anna Nagar, Chennai",
    items: [{ productId: "prod-15", name: "Running Shoes", qty: 2, price: 1799 }],
    amount: 3598,
    paymentMethod: "Prepaid",
    razorpayOrderId: "order_seed_1003",
    razorpayPaymentId: "pay_seed_1003",
    createdAt: "2026-06-30T14:00:00.000Z",
    ...STORE,
    sellerStatus: "Delivered",
    sellerConfirmedDelivery: true,
    pickupRequested: true,
    trackingId: "TRK-G7H8I9",
    deliveryStatus: "Delivered",
    deliveryPartnerId: "partner-2",
    deliveryPartnerName: "Sunita Sharma",
    deliveryPartnerPhone: "9876500000",
    statusHistory: [
      { status: "Assigned", timestamp: "2026-06-30T15:00:00.000Z" },
      { status: "Accepted", timestamp: "2026-06-30T15:10:00.000Z" },
      { status: "Picked Up", timestamp: "2026-06-30T16:00:00.000Z" },
      { status: "In Transit", timestamp: "2026-06-30T17:00:00.000Z" },
      { status: "Out For Delivery", timestamp: "2026-07-01T08:00:00.000Z" },
      { status: "Delivered", timestamp: "2026-07-01T11:30:00.000Z" },
    ],
  },
  {
    // fresh prepaid order → cancellation flow can be demoed end-to-end
    id: "ORD-1004",
    userId: "user-2",
    customerName: "Rahul Nair",
    customerEmail: "rahul@example.com",
    customerPhone: "+91 91234 67890",
    customerAddress: "44 Green Park Avenue, T Nagar, Chennai",
    items: [{ productId: "prod-11", name: "Blue Denim Jeans", qty: 1, price: 1899 }],
    amount: 1899,
    paymentMethod: "Prepaid",
    razorpayOrderId: "order_seed_1004",
    razorpayPaymentId: "pay_seed_1004",
    createdAt: "2026-07-01T08:45:00.000Z",
    ...STORE,
    sellerStatus: "Processing",
    deliveryStatus: null,
    statusHistory: [],
  },
  {
    id: "ORD-1005",
    customerName: "Priya Das",
    customerEmail: "priya@example.com",
    customerPhone: "+91 90031 10203",
    customerAddress: "26 Besant Nagar 2nd Street, Chennai",
    items: [{ productId: "prod-2", name: "Bluetooth Speaker", qty: 1, price: 1599 }],
    amount: 1599,
    paymentMethod: "Cash on Delivery",
    createdAt: "2026-07-02T11:00:00.000Z",
    ...STORE,
    sellerStatus: "Processing",
    deliveryStatus: null,
    statusHistory: [],
  },
  {
    id: "ORD-1006",
    customerName: "Vikram Rao",
    customerEmail: "vikram@example.com",
    customerPhone: "+91 94444 11220",
    customerAddress: "3 Pondy Bazaar, T Nagar, Chennai",
    items: [{ productId: "prod-10", name: "Laptop Backpack", qty: 1, price: 2199 }],
    amount: 2199,
    paymentMethod: "Prepaid",
    razorpayOrderId: "order_seed_1006",
    razorpayPaymentId: "pay_seed_1006",
    createdAt: "2026-07-04T07:00:00.000Z",
    ...STORE,
    sellerStatus: "Ready For Dispatch",
    pickupRequested: true,
    trackingId: "TRK-J1K2L3",
    deliveryStatus: "Picked Up",
    deliveryPartnerId: "partner-2",
    deliveryPartnerName: "Sunita Sharma",
    deliveryPartnerPhone: "9876500000",
    statusHistory: [
      { status: "Assigned", timestamp: "2026-07-04T08:00:00.000Z" },
      { status: "Accepted", timestamp: "2026-07-04T08:15:00.000Z" },
      { status: "Picked Up", timestamp: "2026-07-04T09:00:00.000Z" },
    ],
  },
];

// A few reviews: approved ones back the seeded product ratings, and one
// Pending review keeps the admin moderation queue non-empty.
const reviews = [
  { id: "rev-1", userId: "user-1", userName: "Aditi Verma", productId: "prod-1", productName: "Wireless Headphones", orderId: "ORD-1001", rating: 5, comment: "Great sound and the battery really lasts.", moderationStatus: "Approved" },
  { id: "rev-2", userId: "user-2", userName: "Rahul Nair", productId: "prod-1", productName: "Wireless Headphones", orderId: "ORD-1002", rating: 4, comment: "Comfortable fit, bass could be stronger.", moderationStatus: "Approved" },
  { id: "rev-3", userId: "user-1", userName: "Aditi Verma", productId: "prod-15", productName: "Running Shoes", orderId: "ORD-1003", rating: 4, comment: "Light and grippy — solid for daily runs.", moderationStatus: "Pending" },
];

async function seedDatabase() {
  if ((await DeliveryPartner.countDocuments()) === 0) {
    await DeliveryPartner.insertMany(deliveryPartners);
    console.log(`Seeded ${deliveryPartners.length} delivery partners`);
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  }

  if ((await Order.countDocuments()) === 0) {
    await Order.insertMany(orders);
    console.log(`Seeded ${orders.length} orders`);
  }

  if ((await Review.countDocuments()) === 0) {
    await Review.insertMany(reviews);
    console.log(`Seeded ${reviews.length} reviews`);
  }

  // Account.create() (not insertMany) so the pre-save hook actually hashes
  // these plain text demo passwords before they hit the database.
  if ((await Account.countDocuments({ role: "user" })) === 0) {
    await Account.create(users);
    console.log(`Seeded ${users.length} user accounts`);
  }
  if ((await Account.countDocuments({ role: { $in: ["admin", "seller"] } })) === 0) {
    await Account.create(staffAccounts);
    console.log("Seeded admin + seller accounts");
  }

  console.log("Demo credentials:");
  for (const [role, email, password] of DEMO_CREDENTIALS) {
    console.log(`  ${role.padEnd(8)} ${email.padEnd(32)} ${password}`);
  }
}

module.exports = seedDatabase;
