const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = process.argv[2];
const wait = ms => new Promise(r => setTimeout(r, ms));
async function login(page, role, email, pw) {
  await page.goto(`http://localhost:5177/login/${role}`);
  await page.fill('#login-email', email);
  await page.fill('#login-password', pw);
  await Promise.all([page.waitForURL(u => !u.toString().startsWith('http://localhost:5177'), { timeout: 20000 }), page.click('button[type=submit]')]);
  await page.waitForLoadState('networkidle'); await wait(1500);
}
async function shot(page, name, url) {
  if (url) { await page.goto(url); await page.waitForLoadState('networkidle').catch(()=>{}); await wait(2000); }
  await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('ok', name);
}
(async () => {
  const b = await chromium.launch();
  const mk = async () => (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  try {
    let p = await mk();
    await shot(p, '01_role_chooser', 'http://localhost:5177/');
    await shot(p, '02_login_user', 'http://localhost:5177/login/user');
    await p.fill('#login-email', 'aditi@example.com'); await p.fill('#login-password', 'wrong-password');
    await p.click('button[type=submit]'); await wait(2000); await shot(p, '03_login_invalid');
    // unauthenticated admin -> redirected to shared login
    await p.goto('http://localhost:5173/admin/dashboard'); await p.waitForURL(/5177/, {timeout:15000}); await wait(1500);
    await shot(p, '04_admin_redirect_unauth');
    // customer
    p = await mk();
    await login(p, 'user', 'aditi@example.com', 'aditi123');
    await shot(p, '05_user_home');
    await shot(p, '06_user_listing', 'http://localhost:5175/products');
    await shot(p, '07_user_product', 'http://localhost:5175/product/prod-59');
    const add = p.getByRole('button', { name: /add to cart/i }).first();
    if (await add.count()) { await add.click(); await wait(1500); }
    await shot(p, '08_user_cart', 'http://localhost:5175/cart');
    await shot(p, '09_user_checkout', 'http://localhost:5175/checkout');
    await shot(p, '10_user_orders', 'http://localhost:5175/profile?tab=orders');
    await shot(p, '11_user_track', 'http://localhost:5175/track-order/ORD-1021');
    // seller
    p = await mk();
    await login(p, 'seller', 'seller@shopsphere.com', 'seller1234');
    await shot(p, '12_seller_dashboard');
    await shot(p, '13_seller_products', 'http://localhost:5174/seller/products');
    await shot(p, '14_seller_orders', 'http://localhost:5174/seller/orders');
    // admin
    p = await mk();
    await login(p, 'admin', 'admin@shopsphere.com', 'admin1234');
    await shot(p, '15_admin_dashboard');
    await shot(p, '16_admin_seller_verif', 'http://localhost:5173/admin/seller-verification');
    await shot(p, '17_admin_product_approval', 'http://localhost:5173/admin/product-approval');
    await shot(p, '18_admin_delivery_assign', 'http://localhost:5173/admin/delivery-assignment');
    await shot(p, '19_admin_orders', 'http://localhost:5173/admin/orders');
    // delivery
    p = await mk();
    await login(p, 'delivery', 'ravi.delivery@shopsphere.com', 'ravi123');
    await shot(p, '20_delivery_console');
  } catch (e) { console.error('ERR', e.message); }
  await b.close();
})();
