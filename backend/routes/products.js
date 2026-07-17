const express = require("express");
const router = express.Router();
const { Product, APPROVAL_STATUSES } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { Account } = require("../models/account.model");
const { requireAuth, requireRole, getAuthFromHeader } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const { CATEGORY_TREE, isValidPlacement } = require("../data/categories");
const { notifyRole } = require("../utils/notify");
const { emitToRole } = require("../realtime");

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1 },
};

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function nextProductId() {
  const products = await Product.find({}, "id").lean();
  const maxNum = products.reduce((max, p) => {
    const num = parseInt(String(p.id).replace("prod-", ""), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `prod-${maxNum + 1}`;
}

// GET /api/products?q=&category=&minPrice=&maxPrice=&minRating=&sort=&page=&limit=
// Public listing shows Approved products only. The seller console passes
// sellerId=me (with a seller token) to manage its own products regardless of
// approval status; the admin console passes approvalStatus=... (admin token).
router.get("/", asyncHandler(async (req, res) => {
  const { q, category, subcategory, productType, minPrice, maxPrice, minRating, sort, sellerId, approvalStatus } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const filter = {};
  const auth = getAuthFromHeader(req);

  if (sellerId) {
    const resolvedSellerId = sellerId === "me" ? auth && auth.id : sellerId;
    if (!auth || (auth.role !== "admin" && auth.id !== resolvedSellerId)) {
      return res.status(403).json({ success: false, message: "You can only list your own products" });
    }
    filter.sellerId = resolvedSellerId;
  } else if (approvalStatus) {
    if (!auth || auth.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can filter by approval status" });
    }
    if (!APPROVAL_STATUSES.includes(approvalStatus)) {
      return res.status(400).json({ success: false, message: "Invalid approvalStatus" });
    }
    filter.approvalStatus = approvalStatus;
  } else if (auth && auth.role === "admin") {
    // admin product management sees everything
  } else {
    filter.approvalStatus = "Approved";
  }

  if (q && typeof q === "string") {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ name: rx }, { description: rx }, { category: rx }, { brand: rx }];
  }
  if (category) filter.category = category;
  if (subcategory) filter.subcategory = subcategory;
  if (productType) filter.productType = productType;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice) || 0;
    if (maxPrice) filter.price.$lte = Number(maxPrice) || Number.MAX_SAFE_INTEGER;
  }
  if (minRating) filter.rating = { $gte: Number(minRating) || 0 };

  const sortSpec = SORTS[sort] || SORTS.newest;
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortSpec)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    success: true,
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
}));

// GET /api/products/categories — the canonical taxonomy.
// `categories`: flat [{name, count}] (back-compat with older clients);
// `tree`: the full Category → Subcategory → Product Type hierarchy with
// live product counts per category.
router.get("/categories", asyncHandler(async (req, res) => {
  const counted = await Product.aggregate([
    { $match: { approvalStatus: "Approved" } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countByName = Object.fromEntries(counted.map((c) => [c._id, c.count]));

  const tree = CATEGORY_TREE.map((cat) => ({
    name: cat.name,
    count: countByName[cat.name] || 0,
    subcategories: cat.subcategories,
  }));

  res.json({
    success: true,
    categories: tree.filter((c) => c.count > 0).map((c) => ({ name: c.name, count: c.count })),
    tree,
  });
}));

// GET /api/products/:id — product details + seller info + related products
// + review summary, everything the product page needs in one call (Feature 4)
router.get("/:id", asyncHandler(async (req, res) => {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const seller = await Account.findOne({ id: product.sellerId, role: "seller" });
  const sellerInfo = seller
    ? {
        id: seller.id,
        name: seller.name,
        rating: seller.sellerRating,
        ratingCount: seller.sellerRatingCount,
        city: (seller.addresses.find((a) => a.isDefault) || seller.addresses[0] || {}).city || "—",
      }
    : null;

  const related = await Product.find({
    category: product.category,
    approvalStatus: "Approved",
    id: { $ne: product.id },
  })
    .sort({ rating: -1 })
    .limit(4);

  const reviews = await Review.find({ productId: product.id, moderationStatus: "Approved" }).sort({ createdAt: -1 });
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[r.rating] += 1;

  res.json({
    success: true,
    product,
    seller: sellerInfo,
    related,
    reviews: {
      items: reviews,
      average: product.rating,
      count: reviews.length,
      distribution,
    },
  });
}));

function validateProductBody(body, { partial = false } = {}) {
  const { name, category, price } = body;
  if (!partial || name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return "name is required";
  }
  if (!partial || category !== undefined) {
    if (typeof category !== "string" || !category.trim()) return "category is required";
  }
  if (!partial || price !== undefined) {
    if (!Number.isFinite(Number(price)) || Number(price) < 0) return "price must be a non-negative number";
  }
  if (body.stock !== undefined && (!Number.isFinite(Number(body.stock)) || Number(body.stock) < 0)) {
    return "stock must be a non-negative number";
  }
  if (body.images !== undefined && !Array.isArray(body.images)) return "images must be an array";
  if (body.specs !== undefined && !Array.isArray(body.specs)) return "specs must be an array";
  // placement must exist in the canonical taxonomy when hierarchy fields are sent
  if (body.subcategory !== undefined || body.productType !== undefined) {
    const category = body.category;
    if (category !== undefined && !isValidPlacement(category, body.subcategory, body.productType)) {
      return "category/subcategory/productType is not a valid placement in the catalog taxonomy";
    }
  }
  return null;
}

// POST /api/products — seller creates a product (lands in admin approval queue)
router.post("/", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const error = validateProductBody(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  const { name, description, brand, category, subcategory, productType, price, oldPrice, images, specs, sku, stock, isNewArrival } = req.body;
  const id = await nextProductId();
  const numericPrice = Number(price);
  const numericOldPrice = oldPrice ? Number(oldPrice) : null;

  const product = await Product.create({
    id,
    sellerId: req.auth.role === "admin" && req.body.sellerId ? req.body.sellerId : req.auth.id,
    name: name.trim(),
    slug: `${slugify(name)}-${id}`,
    description: description || "",
    brand: brand || "",
    category: category.trim(),
    subcategory: subcategory || "",
    productType: productType || "",
    price: numericPrice,
    oldPrice: numericOldPrice,
    discount: numericOldPrice && numericOldPrice > numericPrice
      ? Math.round(((numericOldPrice - numericPrice) / numericOldPrice) * 100)
      : 0,
    images: images || [],
    specs: specs || [],
    sku: sku || "",
    stock: Number(stock) || 0,
    isNewArrival: Boolean(isNewArrival),
    approvalStatus: req.auth.role === "admin" ? "Approved" : "Pending",
  });

  if (product.approvalStatus === "Pending") {
    await notifyRole("admin", "product-submitted", `Product awaiting approval: ${product.name}`, `Submitted by seller ${product.sellerId}`, { productId: product.id });
  }

  res.status(201).json({ success: true, product });
}));

async function findOwnedProduct(req, res) {
  const product = await Product.findOne({ id: req.params.id });
  if (!product) {
    res.status(404).json({ success: false, message: "Product not found" });
    return null;
  }
  if (req.auth.role !== "admin" && product.sellerId !== req.auth.id) {
    res.status(403).json({ success: false, message: "This product belongs to another seller" });
    return null;
  }
  return product;
}

// PUT /api/products/:id — seller updates their own product (or admin any)
router.put("/:id", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  const error = validateProductBody(req.body, { partial: true });
  if (error) return res.status(400).json({ success: false, message: error });

  const editable = ["name", "description", "brand", "category", "subcategory", "productType", "price", "oldPrice", "images", "specs", "sku", "stock", "isNewArrival"];
  for (const field of editable) {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  }
  if (product.oldPrice && product.oldPrice > product.price) {
    product.discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  } else {
    product.discount = 0;
  }
  await product.save();

  res.json({ success: true, product });
}));

// DELETE /api/products/:id
router.delete("/:id", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req, res);
  if (!product) return;
  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
}));

// PATCH /api/products/:id/stock  { stock } — inventory sync from the seller console
router.patch("/:id/stock", requireAuth, requireRole("seller", "admin"), asyncHandler(async (req, res) => {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  const stock = Number(req.body.stock);
  if (!Number.isFinite(stock) || stock < 0) {
    return res.status(400).json({ success: false, message: "stock must be a non-negative number" });
  }
  product.stock = Math.floor(stock);
  await product.save();

  res.json({ success: true, product });
}));

// PATCH /api/products/:id/approval  { approvalStatus } — admin approve/reject
router.patch("/:id/approval", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const { approvalStatus } = req.body;
  if (!APPROVAL_STATUSES.includes(approvalStatus)) {
    return res.status(400).json({ success: false, message: "Invalid approvalStatus" });
  }

  const product = await Product.findOneAndUpdate({ id: req.params.id }, { approvalStatus }, { new: true });
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  emitToRole("seller", "product-approval", { productId: product.id, approvalStatus });
  res.json({ success: true, product });
}));

module.exports = router;
