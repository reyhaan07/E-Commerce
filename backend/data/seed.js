// Seeds the full ShopSphere demo world on first boot (each collection is
// only seeded while empty, so a populated database is never overwritten).
// `npm run reseed` drops the database and rebuilds this exact world.

const { Order } = require("../models/order.model");
const { DeliveryPartner } = require("../models/deliveryPartner.model");
const { Account } = require("../models/account.model");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { ReturnRequest } = require("../models/returnRequest.model");
const { Notification } = require("../models/notification.model");

const { buildProducts } = require("./build");
const { buildWorld } = require("./world");
const { sellerAccounts, SELLERS } = require("./sellers");
const { userAccounts, adminAccounts, deliveryPartners } = require("./people");

// give half the users a lived-in cart and wishlist drawn from the catalog
function decorateUsers(users, products) {
  const approved = products.filter((p) => p.approvalStatus === "Approved" && p.stock > 0);
  users.forEach((user, idx) => {
    if (idx % 2 === 1) {
      user.cart = Array.from({ length: 2 + (idx % 3) }, (_, k) => {
        const p = approved[(idx * 17 + k * 31) % approved.length];
        return { productId: p.id, name: p.name, price: p.price, image: p.images[0], qty: 1 + (k % 2) };
      });
    }
    if (idx % 3 !== 2) {
      user.wishlist = Array.from({ length: 2 + (idx % 4) }, (_, k) => {
        const p = approved[(idx * 23 + k * 41) % approved.length];
        return { productId: p.id, name: p.name, price: p.price, image: p.images[0] };
      });
    }
  });
  return users;
}

// recompute product + seller rating aggregates from the approved reviews so
// the numbers on product pages are mathematically consistent
async function recomputeAggregates() {
  const approvedReviews = await Review.find({ moderationStatus: "Approved" }).lean();
  const byProduct = {};
  for (const review of approvedReviews) {
    (byProduct[review.productId] = byProduct[review.productId] || []).push(review.rating);
  }

  const products = await Product.find({}, "id sellerId").lean();
  const bySeller = {};
  for (const product of products) {
    const ratings = byProduct[product.id] || [];
    if (ratings.length) {
      const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
      await Product.updateOne({ id: product.id }, { rating: avg, ratingCount: ratings.length });
    }
    (bySeller[product.sellerId] = bySeller[product.sellerId] || []).push(...ratings);
  }

  for (const [sellerId, ratings] of Object.entries(bySeller)) {
    if (!ratings.length) continue;
    const avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    await Account.updateOne({ id: sellerId, role: "seller" }, { sellerRating: avg, sellerRatingCount: ratings.length });
  }
}

async function seedDatabase() {
  const products = buildProducts();

  if ((await DeliveryPartner.countDocuments()) === 0) {
    await DeliveryPartner.insertMany(deliveryPartners());
    console.log("Seeded 20 delivery partners");
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products across 44 categories`);
  }

  // Account.create() (not insertMany) so the pre-save hook bcrypt-hashes
  // the plain-text demo passwords.
  let users = userAccounts();
  if ((await Account.countDocuments({ role: "user" })) === 0) {
    users = decorateUsers(users, products);
    await Account.create(users);
    console.log("Seeded 20 user accounts");
  }
  if ((await Account.countDocuments({ role: "seller" })) === 0) {
    await Account.create(sellerAccounts());
    console.log("Seeded 20 seller stores");
  }
  if ((await Account.countDocuments({ role: "admin" })) === 0) {
    await Account.create(adminAccounts());
    console.log("Seeded 20 admin accounts");
  }

  if ((await Order.countDocuments()) === 0) {
    const { orders, reviews, returns, notifications } = buildWorld(products, users);

    // stamp the seller snapshot onto each order
    const sellerById = Object.fromEntries(SELLERS.map((s) => [s.id, s]));
    for (const order of orders) {
      const seller = sellerById[order.sellerId];
      if (seller) {
        order.sellerName = seller.name;
        order.sellerAddress = `${seller.name}, ${seller.city}`;
        order.sellerPhone = "+91 80 4000 1000";
      }
    }

    await Order.insertMany(orders);
    await Review.insertMany(reviews);
    await ReturnRequest.insertMany(returns);
    await Notification.insertMany(notifications);
    console.log(`Seeded ${orders.length} orders, ${reviews.length} reviews, ${returns.length} returns, ${notifications.length} notifications`);

    await recomputeAggregates();
    console.log("Recomputed product & seller rating aggregates");
  }

  console.log("Key demo credentials (full table in README.md):");
  for (const [role, email, password] of [
    ["admin", "admin@shopsphere.com", "admin1234"],
    ["seller", "seller@shopsphere.com", "seller1234"],
    ["user", "aditi@example.com", "aditi123"],
    ["delivery", "ravi.delivery@shopsphere.com", "ravi123"],
  ]) {
    console.log(`  ${role.padEnd(8)} ${email.padEnd(32)} ${password}`);
  }
}

module.exports = seedDatabase;
