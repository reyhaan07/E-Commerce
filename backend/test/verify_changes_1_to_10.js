const BASE = "http://localhost:5000/api";

async function run() {
  console.log("=== SHOPPING APPLICATION CHANGES 1–10 AUTOMATED VERIFICATION ===\n");
  let passed = 0;
  let failed = 0;

  function assert(desc, condition, err) {
    if (condition) {
      console.log(`  PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  FAIL: ${desc} ${err ? "-> " + err : ""}`);
      failed++;
    }
  }

  // 1. Phone number 10 digits validation
  console.log("1. Testing Phone Number 10 Digits Rule (Req 1)...");
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const invalidRes = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Bad Phone User",
      email: `badphone_${rand}@example.com`,
      password: "password123",
      phone: "12345" // 5 digits
    })
  });
  const invalidJson = await invalidRes.json();
  assert("Reject non-10-digit phone (5 digits)", invalidRes.status === 400 && invalidJson.message.includes("10 digits"), invalidJson.message);

  const validRes = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Good Phone User",
      email: `goodphone_${rand}@example.com`,
      password: "password123",
      phone: "9876543210" // exactly 10 digits
    })
  });
  const validJson = await validRes.json();
  assert("Accept 10-digit phone", validRes.status === 201 && validJson.success, validJson.message);

  // 2. User -> Admin Support Request (Req 4)
  console.log("\n2. Testing Customer Support System (Req 4)...");
  // Login as user
  const userLogin = await (await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `goodphone_${rand}@example.com`, password: "password123", role: "user" })
  })).json();
  const userToken = userLogin.token;

  const supportSubmit = await fetch(`${BASE}/support`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
    body: JSON.stringify({
      subject: "Inquiry about delivery schedule",
      category: "Orders",
      message: "Can my order be delivered before 2 PM tomorrow?",
      orderId: "ORD-1001"
    })
  });
  const supportJson = await supportSubmit.json();
  assert("Customer submits support inquiry", supportSubmit.status === 201 && supportJson.success, supportJson.message);

  // Admin reviews support inquiries
  const adminLogin = await (await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@shopsphere.com", password: "admin1234", role: "admin" })
  })).json();
  const adminToken = adminLogin.token;

  const adminInquiries = await (await fetch(`${BASE}/support`, {
    headers: { "Authorization": `Bearer ${adminToken}` }
  })).json();
  const foundTicket = adminInquiries.requests?.find(t => t.id === supportJson.request?.id);
  assert("Admin views customer inquiry", Boolean(foundTicket) && foundTicket.requesterRole === "user", "Ticket not found or wrong role");

  // 3. High-Value Product Purchase Limit (Req 8)
  console.log("\n3. Testing High-Value Product Purchase Limit (Req 8)...");
  const highValProds = await (await fetch(`${BASE}/products?minPrice=25000`)).json();
  const regularProds = await (await fetch(`${BASE}/products?maxPrice=24999`)).json();
  const highVal = highValProds.products[0];
  const regularVal = regularProds.products[0];

  if (highVal) {
    // Attempt high-value purchase with qty = 2
    const failHighVal = await fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
      body: JSON.stringify({
        userId: userLogin.id,
        customerName: userLogin.name,
        customerEmail: userLogin.email,
        customerPhone: "9876543210",
        customerAddress: "42 MG Road, Bengaluru, 560001",
        customerPincode: "560001",
        items: [{ productId: highVal.id, name: highVal.name, qty: 2, price: highVal.price }],
        amount: highVal.price * 2 + 200,
        paymentMethod: "Cash on Delivery"
      })
    });
    const failJson = await failHighVal.json();
    assert(`Reject high-value purchase (₹${highVal.price}) with qty 2`, failHighVal.status === 400 && failJson.message.includes("limited to 1 unit"), failJson.message);

    // High-value purchase with qty = 1
    const passHighVal = await fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
      body: JSON.stringify({
        userId: userLogin.id,
        customerName: userLogin.name,
        customerEmail: userLogin.email,
        customerPhone: "9876543210",
        customerAddress: "42 MG Road, Bengaluru, 560001",
        customerPincode: "560001",
        items: [{ productId: highVal.id, name: highVal.name, qty: 1, price: highVal.price }],
        amount: highVal.price + 200,
        paymentMethod: "Cash on Delivery"
      })
    });
    const passJson = await passHighVal.json();
    assert(`Accept high-value purchase with qty 1`, passHighVal.status === 201 && passJson.success, passJson.message);
  }

  // Regular item: max 5
  if (regularVal) {
    const failOver5 = await fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
      body: JSON.stringify({
        userId: userLogin.id,
        customerName: userLogin.name,
        customerEmail: userLogin.email,
        customerPhone: "9876543210",
        customerAddress: "42 MG Road, Bengaluru, 560001",
        customerPincode: "560001",
        items: [{ productId: regularVal.id, name: regularVal.name, qty: 6, price: regularVal.price }],
        amount: regularVal.price * 6 + 200,
        paymentMethod: "Cash on Delivery"
      })
    });
    const over5Json = await failOver5.json();
    assert("Reject item quantity > 5 per order", failOver5.status === 400 && over5Json.message.includes("cannot exceed 5 units"), over5Json.message);
  }

  // 4. Discount increase / decrease functionality (Req 10)
  console.log("\n4. Testing Discount Adjustment API (Req 10)...");
  const sellerLogin = await (await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "seller@shopsphere.com", password: "seller1234", role: "seller" })
  })).json();
  const sellerToken = sellerLogin.token;

  const sellerProducts = await (await fetch(`${BASE}/products?sellerId=me`, {
    headers: { "Authorization": `Bearer ${sellerToken}` }
  })).json();
  let targetProd = sellerProducts.products.find(p => p.stock >= 5) || sellerProducts.products[0];

  // Ensure stock is available
  if (!targetProd.stock || targetProd.stock < 5) {
    const stockRes = await (await fetch(`${BASE}/products/${targetProd.id}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sellerToken}` },
      body: JSON.stringify({ stock: 25 })
    })).json();
    targetProd = stockRes.product;
  }

  // Increase discount to 25%
  const disc25 = await (await fetch(`${BASE}/products/${targetProd.id}/discount`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sellerToken}` },
    body: JSON.stringify({ discount: 25 })
  })).json();
  assert("Set discount to 25%", disc25.success && disc25.product.discount === 25, `Discount is ${disc25.product?.discount}`);

  // Decrease discount to 10%
  const disc10 = await (await fetch(`${BASE}/products/${targetProd.id}/discount`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sellerToken}` },
    body: JSON.stringify({ discount: 10 })
  })).json();
  assert("Decrease discount to 10%", disc10.success && disc10.product.discount === 10, `Discount is ${disc10.product?.discount}`);

  // 5. Complete Delivery Flow & Seller Payout Reflection (Req 5, 6, 11)
  console.log("\n5. Testing End-to-End Order Flow & Seller Payout Reflection (Req 5, 6, 11)...");
  // Place an order for seller's product
  const orderPostRes = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${userToken}` },
    body: JSON.stringify({
      userId: userLogin.id,
      customerName: userLogin.name,
      customerEmail: userLogin.email,
      customerPhone: "9876543210",
      customerAddress: "10 Market Road, Chennai, 600100",
      customerPincode: "600100",
      items: [{ productId: targetProd.id, name: targetProd.name, qty: 1, price: targetProd.price }],
      amount: targetProd.price + 200,
      paymentMethod: "Cash on Delivery"
    })
  });
  const newOrderRes = await orderPostRes.json();
  const orderId = newOrderRes.order?.id;
  assert("Place fresh order", Boolean(orderId), newOrderRes.message || JSON.stringify(newOrderRes));

  // Seller packs & marks ready for dispatch
  await fetch(`${BASE}/orders/${orderId}/seller-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sellerToken}` },
    body: JSON.stringify({ sellerStatus: "Packed" })
  });
  await fetch(`${BASE}/orders/${orderId}/seller-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sellerToken}` },
    body: JSON.stringify({ sellerStatus: "Ready For Dispatch" })
  });

  // Admin assigns delivery partner
  const assignRes = await (await fetch(`${BASE}/orders/${orderId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
    body: JSON.stringify({ deliveryPartnerId: "partner-1" })
  })).json();
  assert("Admin assigns delivery partner", assignRes.success && assignRes.order.deliveryStatus === "Assigned", "Assignment failed");

  // Delivery partner logs in
  const deliveryLogin = await (await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ravi.delivery@shopsphere.com", password: "ravi123", role: "delivery" })
  })).json();
  const deliveryToken = deliveryLogin.token;

  // Courier accepts & picks up
  await fetch(`${BASE}/orders/${orderId}/delivery-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deliveryToken}` },
    body: JSON.stringify({ deliveryStatus: "Accepted" })
  });
  await fetch(`${BASE}/orders/${orderId}/delivery-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deliveryToken}` },
    body: JSON.stringify({ deliveryStatus: "Picked Up" })
  });
  await fetch(`${BASE}/orders/${orderId}/delivery-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deliveryToken}` },
    body: JSON.stringify({ deliveryStatus: "Out For Delivery" })
  });

  // Courier marks Delivered
  const deliveredHop = await (await fetch(`${BASE}/orders/${orderId}/delivery-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${deliveryToken}` },
    body: JSON.stringify({ deliveryStatus: "Delivered" })
  })).json();
  assert("Courier marks order Delivered", deliveredHop.success && deliveredHop.order?.deliveryStatus === "Delivered", deliveredHop.message || JSON.stringify(deliveredHop));

  // Verify order automatically advanced sellerStatus to Delivered and paymentStatus to Paid
  assert("Order sellerStatus automatically set to Delivered", deliveredHop.order.sellerStatus === "Delivered", `sellerStatus is ${deliveredHop.order.sellerStatus}`);
  assert("COD payment automatically marked Paid", deliveredHop.order.paymentStatus === "Paid", `paymentStatus is ${deliveredHop.order.paymentStatus}`);

  // Verify Seller Payout reflection
  const sellerOrders = await (await fetch(`${BASE}/orders?sellerId=${sellerLogin.id}`, {
    headers: { "Authorization": `Bearer ${sellerToken}` }
  })).json();
  const checkedOrder = sellerOrders.orders.find(o => o.id === orderId);
  assert("Seller sees order as Delivered in payout stream", checkedOrder && checkedOrder.sellerStatus === "Delivered", "Order not found or wrong status");

  console.log(`\n========================================`);
  console.log(`  SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed === 0 ? 0 : 1);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
