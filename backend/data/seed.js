// Initial demo data for ShopSphere. On server startup, this seeds MongoDB
// with the data below only if the collections are still empty, so a fresh
// local database looks the same as it always has.

const { Order } = require("../models/order.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");

const users = [
  {
    id: "user-1",
    name: "Aditi Verma",
    email: "aditi@example.com",
    password: "aditi123",
    role: "user",
    phone: "+91 98765 43210",
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
    wishlist: [
      { productId: "2", name: "Minimalist Analog Watch", price: 4999, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800" },
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

// Single-store demo, so every order ships from the same ShopSphere Store address.
const STORE_ADDRESS = "14 Anna Salai, T Nagar, Chennai";
const STORE_PHONE = "+91 44 4210 5566";

const orders = [
  {
    id: "ORD-1001",
    userId: "user-1",
    customerName: "Aditi Verma",
    customerEmail: "aditi@example.com",
    customerPhone: "+91 98765 43210",
    customerAddress: "18 Lake View Road, Anna Nagar, Chennai",
    items: [{ name: "Wireless Headphones", qty: 1 }],
    amount: 2499,
    paymentMethod: "Prepaid",
    createdAt: "2026-06-28T10:15:00.000Z",
    sellerName: "ShopSphere Store",
    sellerAddress: STORE_ADDRESS,
    sellerPhone: STORE_PHONE,
    sellerStatus: "Ready For Dispatch",
    deliveryStatus: "Assigned",
    deliveryPartnerId: "partner-1",
    deliveryPartnerName: "Ravi Kumar",
    deliveryPartnerPhone: "9876543210",
    statusHistory: [
      { status: "Assigned", timestamp: "2026-06-28T11:00:00.000Z" },
    ],
  },
  {
    id: "ORD-1002",
    userId: "user-2",
    customerName: "Rahul Nair",
    customerEmail: "rahul@example.com",
    customerPhone: "+91 91234 67890",
    customerAddress: "44 Green Park Avenue, T Nagar, Chennai",
    items: [{ name: "Smart Watch", qty: 1 }],
    amount: 4999,
    paymentMethod: "Cash on Delivery",
    createdAt: "2026-06-29T09:30:00.000Z",
    sellerName: "ShopSphere Store",
    sellerAddress: STORE_ADDRESS,
    sellerPhone: STORE_PHONE,
    sellerStatus: "Shipped",
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
    id: "ORD-1003",
    customerName: "Meera Iyer",
    customerEmail: "meera@example.com",
    customerPhone: "+91 90000 11223",
    customerAddress: "71 West Canal Bank Road, Mylapore, Chennai",
    items: [{ name: "Running Shoes", qty: 2 }],
    amount: 3598,
    paymentMethod: "Prepaid",
    createdAt: "2026-06-30T14:00:00.000Z",
    sellerName: "ShopSphere Store",
    sellerAddress: STORE_ADDRESS,
    sellerPhone: STORE_PHONE,
    sellerStatus: "Delivered",
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
    id: "ORD-1004",
    customerName: "Karan Singh",
    customerEmail: "karan@example.com",
    customerPhone: "+91 99887 66554",
    customerAddress: "9 Orchid Street, Adyar, Chennai",
    items: [{ name: "Blue Denim Jeans", qty: 1 }],
    amount: 1899,
    paymentMethod: "Prepaid",
    createdAt: "2026-07-01T08:45:00.000Z",
    sellerName: "ShopSphere Store",
    sellerAddress: STORE_ADDRESS,
    sellerPhone: STORE_PHONE,
    sellerStatus: "Processing",
    deliveryStatus: null,
    deliveryPartnerId: null,
    deliveryPartnerName: null,
    deliveryPartnerPhone: null,
    statusHistory: [],
  },
  {
    id: "ORD-1005",
    customerName: "Priya Das",
    customerEmail: "priya@example.com",
    customerPhone: "+91 90031 10203",
    customerAddress: "26 Besant Nagar 2nd Street, Chennai",
    items: [{ name: "Bluetooth Speaker", qty: 1 }],
    amount: 1599,
    paymentMethod: "Cash on Delivery",
    createdAt: "2026-07-02T11:00:00.000Z",
    sellerName: "ShopSphere Store",
    sellerAddress: STORE_ADDRESS,
    sellerPhone: STORE_PHONE,
    sellerStatus: "Processing",
    deliveryStatus: null,
    deliveryPartnerId: null,
    deliveryPartnerName: null,
    deliveryPartnerPhone: null,
    statusHistory: [],
  },
  {
    id: "ORD-1006",
    customerName: "Vikram Rao",
    customerEmail: "vikram@example.com",
    customerPhone: "+91 94444 11220",
    customerAddress: "3 Pondy Bazaar, T Nagar, Chennai",
    items: [{ name: "Laptop Backpack", qty: 1 }],
    amount: 2199,
    paymentMethod: "Prepaid",
    createdAt: "2026-07-04T07:00:00.000Z",
    sellerName: "ShopSphere Store",
    sellerAddress: STORE_ADDRESS,
    sellerPhone: STORE_PHONE,
    sellerStatus: "Ready For Dispatch",
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

async function seedDatabase() {
  if ((await DeliveryPartner.countDocuments()) === 0) {
    await DeliveryPartner.insertMany(deliveryPartners);
    console.log(`Seeded ${deliveryPartners.length} delivery partners`);
  }

  if ((await Order.countDocuments()) === 0) {
    await Order.insertMany(orders);
    console.log(`Seeded ${orders.length} orders`);
  }

  // Account.create() (not insertMany) so the pre-save hook actually hashes
  // these plain text demo passwords before they hit the database.
  if ((await Account.countDocuments({ role: "user" })) === 0) {
    await Account.create(users);
    console.log(`Seeded ${users.length} user accounts`);
  }
}

module.exports = seedDatabase;
