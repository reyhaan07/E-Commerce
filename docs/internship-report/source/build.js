// Builds REYHAAN_INTERNSHIP_COMPLETION_REPORT.docx
// usage: node build.js <outdir> [toc.json]
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType,
  HeadingLevel, PageBreak, Footer, Header, PageNumber, NumberFormat, WidthType, BorderStyle,
  ShadingType, LevelFormat, PositionalTab, PositionalTabAlignment, PositionalTabRelativeTo,
  PositionalTabLeader, TabStopType, VerticalAlign, TableLayoutType,
} = require('docx');

const OUT = process.argv[2];
const PAGES = process.argv[3] && fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3])) : {};
const A = (p) => fs.readFileSync(path.join(OUT, 'assets', p));
const FONT = 'Times New Roman';
const TEXT_W = 9026 - 360; // A4 width 11906 - left 1800 - right 1440 = 8666 dxa

// ---------- inline markup: **bold**, `code`, _italic_ ----------
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|(?<![A-Za-z0-9])_[^_]+_(?![A-Za-z0-9]))/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), font: 'Consolas', size: (base.size || 24) - 3, ...base, ...{ font: 'Consolas' } }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
const P = (text, o = {}) => new Paragraph({
  children: runs(text, o.run || {}),
  alignment: o.align || AlignmentType.JUSTIFIED,
  spacing: { after: o.after ?? 100, before: o.before ?? 0, line: o.line ?? 288 },
  indent: o.indent, keepNext: o.keepNext, keepLines: o.keepLines,
});
const B = (text, lvl = 0) => new Paragraph({
  children: runs(text), numbering: { reference: 'bul', level: lvl },
  alignment: AlignmentType.JUSTIFIED, spacing: { after: 50, line: 276 },
});
const N = (text) => new Paragraph({
  children: runs(text), numbering: { reference: 'num', level: 0 },
  alignment: AlignmentType.JUSTIFIED, spacing: { after: 50, line: 276 },
});
const C = (text, o = {}) => P(text, { align: AlignmentType.CENTER, ...o });
const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [], spacing: { after: 0 } }));
const pb = () => new Paragraph({ children: [new PageBreak()] });

function H1(num, title) {
  const kids = num
    ? [new TextRun({ text: `CHAPTER ${num}`, bold: true, size: 30 }), new TextRun({ text: title.toUpperCase(), bold: true, size: 30, break: 1 })]
    : [new TextRun({ text: title.toUpperCase(), bold: true, size: 30 })];
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: kids, alignment: AlignmentType.CENTER, pageBreakBefore: true, spacing: { after: 240 } });
}
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, bold: true, size: 26 })], spacing: { before: 200, after: 100 }, keepNext: true });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: t, bold: true, size: 24 })], spacing: { before: 140, after: 60 }, keepNext: true });

// ---------- figures ----------
const FIGS = [], TABS = [];
function caption(kind, id, text) {
  const list = kind === 'Figure' ? FIGS : TABS;
  list.push({ id, text });
  return new Paragraph({
    children: [new TextRun({ text: `${kind} ${id}: `, bold: true, size: 21 }), new TextRun({ text, size: 21 })],
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 180 }, keepNext: kind === 'Table',
  });
}
function img(file, wIn, type = 'png') {
  const buf = A(file);
  // read PNG/JPEG size
  let w, h;
  if (type === 'png') { w = buf.readUInt32BE(16); h = buf.readUInt32BE(20); }
  else { const s = require('child_process').execSync(`python3 -c "from PIL import Image;i=Image.open('${path.join(OUT, 'assets', file)}');print(i.size[0],i.size[1])"`).toString().trim().split(' '); w = +s[0]; h = +s[1]; }
  const W = Math.round(wIn * 96);
  return new ImageRun({ data: buf, type, transformation: { width: W, height: Math.round(W * h / w) } });
}
function figure(file, id, text, wIn = 6.0) {
  return [new Paragraph({ children: [img(file, wIn)], alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 80, after: 0 } }), caption('Figure', id, text)];
}
const noB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
function pair(a, b) {
  // a, b: [file, id, caption]
  const cell = ([file, id, text]) => {
    FIGS.push({ id, text });
    return new TableCell({
      width: { size: 4333, type: WidthType.DXA }, borders: { top: noB, bottom: noB, left: noB, right: noB },
      margins: { left: 40, right: 40 },
      children: [
        new Paragraph({ children: [img(file, 2.85)], alignment: AlignmentType.CENTER, spacing: { after: 20 } }),
        new Paragraph({ children: [new TextRun({ text: `Figure ${id}: `, bold: true, size: 19 }), new TextRun({ text, size: 19 })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
      ],
    });
  };
  return new Table({
    width: { size: 8666, type: WidthType.DXA }, columnWidths: [4333, 4333], alignment: AlignmentType.CENTER,
    borders: { top: noB, bottom: noB, left: noB, right: noB, insideHorizontal: noB, insideVertical: noB },
    rows: [new TableRow({ cantSplit: true, children: [cell(a), cell(b)] })],
  });
}

// ---------- tables ----------
const bd = { style: BorderStyle.SINGLE, size: 4, color: '7F8A99' };
function table(id, title, headers, rows, widths, o = {}) {
  const total = widths.reduce((s, x) => s + x, 0);
  const mk = (t, hdr, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: hdr ? { fill: 'DCE6F2', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    borders: { top: bd, bottom: bd, left: bd, right: bd },
    margins: o.compact ? { top: 10, bottom: 10, left: 60, right: 60 } : { top: 40, bottom: 40, left: 80, right: 80 }, verticalAlign: VerticalAlign.CENTER,
    children: String(t).split('\n').map((line) => new Paragraph({ children: runs(line, { size: o.size || 20, bold: hdr || undefined }), spacing: { after: 0, line: o.compact ? 216 : 252 }, alignment: hdr ? AlignmentType.CENTER : AlignmentType.LEFT })),
  });
  return [caption('Table', id, title), new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths, alignment: AlignmentType.CENTER,
    rows: [new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => mk(h, true, i)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => mk(c, false, i)) }))],
  }), new Paragraph({ children: [], spacing: { after: 120 } })];
}
function code(lines) {
  return new Table({
    width: { size: 8666, type: WidthType.DXA }, columnWidths: [8666],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: 8666, type: WidthType.DXA }, shading: { fill: 'F3F5F8', type: ShadingType.CLEAR, color: 'auto' },
      borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 80, bottom: 80, left: 140, right: 140 },
      children: lines.map((l) => new Paragraph({ children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 17 })], spacing: { after: 0, line: 228 } })),
    })] })],
  });
}

// ---------- TOC (two-pass page numbers) ----------
function tocLine(text, key, lvl) {
  const pg = PAGES[key] ?? '';
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: 8660, leader: 'dot' }],
    children: [new TextRun({ text: `${text}\t${pg}`, bold: lvl === 0, size: 21 })],
    indent: { left: lvl * 440 }, spacing: { after: lvl === 0 ? 20 : 0, before: lvl === 0 ? 50 : 0, line: 250 },
  });
}

// =====================================================================
// CONTENT
// =====================================================================
const TEAMS = 'Ctrl+Alt+Win and Femme Forces';
const body = [];
const push = (...x) => x.flat().forEach((e) => body.push(e));
const TOC = [];
const ch = (n, t) => { TOC.push([`${n}. ${t.toUpperCase()}`, `ch${n}`, 0]); push(H1(n, t)); };
const sec = (id, t) => { TOC.push([`${id}  ${t}`, `s${id}`, 1]); push(H2(`${id}  ${t}`)); };

// ---------------- Chapter 1 ----------------
ch(1, 'Introduction');
sec('1.1', 'Overview of the Internship');
push(P('This report is presented jointly by the teams **Ctrl+Alt+Win** and **Femme Forces**, six students of B.Tech. Information Technology, St. Joseph’s College of Engineering, Chennai, who completed an internship at **TechPower Solutions**, Chennai, from **18 June 2026 to 15 September 2026**. The internship was carried out in the MERN stack domain (MongoDB, Express.js, React and Node.js) and centred on a single team project: **ShopSphere — a Multi-Vendor Social E-Commerce Platform**.'));
push(P('ShopSphere connects four kinds of users — customers, sellers, platform administrators and delivery partners — through five React web applications that share one Node.js/Express API and one MongoDB database. The source code is maintained in the repository https://github.com/reyhaan07/E-Commerce [1]. The work was divided among the members by module, with three main contributors and three supporting members; the division of responsibilities is described in Chapter 7.'));
sec('1.2', 'Objectives of the Internship');
push(B('Gain practical experience in full-stack web development with the MERN stack across the complete development life cycle.'));
push(B('Build RESTful APIs with Node.js and Express, and model persistent data in MongoDB through Mongoose.'));
push(B('Design and implement secure authentication and role-based authorization for a multi-role application using JSON Web Tokens (JWT) and bcrypt password hashing.'));
push(B('Integrate several independently deployed React front-ends with a shared backend, and debug cross-application issues.'));
push(B('Practise collaborative development with Git and GitHub, API testing, regression checking and technical documentation.'));
sec('1.3', 'Scope and Organisation of the Report');
push(P('The technical content of this report was verified against the final project code (commit `f707f90`, 21 October 2026), which includes a last review in which a number of defects were fixed (Section 6.4). The application was installed and run locally for this report, its automated test scripts were executed, and every screenshot was captured from that running instance (Section 6.1). Chapter 2 introduces the project and its technology; Chapter 3 presents the architecture and data model; Chapter 4 the functional modules; Chapter 5 the authentication and authorization implementation; Chapter 6 testing; Chapter 7 the team’s contributions and work allocation; Chapter 8 challenges, outcomes and limitations; and Chapter 9 learning outcomes, conclusions and future enhancements.'));

// ---------------- Chapter 2 ----------------
ch(2, 'Project Overview and Requirements');
sec('2.1', 'Problem Statement');
push(P('A marketplace with many independent sellers has to coordinate several parties around a single order: the customer who pays, the seller who packs it, an operator who approves sellers and listings and assigns couriers, and the courier who delivers it. Each party needs its own interface and must see only the data and actions appropriate to its role. ShopSphere was built to provide these role-specific interfaces over one consistent data store, with secure sign-in and enforced permissions as a core requirement rather than an afterthought.'));
sec('2.2', 'Limitations Addressed and Proposed Solution');
push(P('The repository history shows how the design evolved. In its early form (June–July 2026) each front-end carried its own login page and the backend kept orders and delivery partners in an in-memory, JSON-persisted store. The commit of 16 July 2026, _“Migrate backend to MongoDB and consolidate login into a shared app”_, replaced these with a MongoDB database and a single shared login application. The resulting solution has the following characteristics:'));
push(B('**One identity service for four roles.** A shared login app authenticates every role against `POST /api/login` and routes the user to the correct portal.'));
push(B('**Server-side enforcement.** Every privileged API route is guarded by composable middleware (`requireAuth`, `requireRole`, `requireSelfOrAdmin`, `requireSuperAdmin`), so hiding a page in the UI is never the only protection.'));
push(B('**Persistent, validated data.** Eleven Mongoose models with enumerated statuses and an explicit seller status-transition table prevent invalid order states.'));
push(B('**Coordinated workflows.** Seller verification, product approval, PIN-code-based courier assignment, delivery tracking, cancellations and returns are connected end to end, with real-time Socket.io notifications.'));
sec('2.3', 'Joint Project Teams');
push(P(`ShopSphere was developed as a joint project of two teams, **Ctrl+Alt+Win** and **Femme Forces**, comprising six students. The division of responsibilities, as recorded in the team’s work-allocation workbook, is summarised in Section 7.3.`));
sec('2.4', 'Software Requirements and Development Environment');
push(table('2.1', 'Software requirements and development environment (from README.md and package.json files)',
  ['Item', 'Requirement / version used'],
  [['Runtime', 'Node.js v20 or higher (verified on v22.22.0)'],
   ['Database', 'MongoDB (local service at mongodb://127.0.0.1:27017/shopsphere, or a remote URI via backend/.env); verified with MongoDB 7'],
   ['Package manager / scripts', 'npm; root scripts `install:all`, `dev:all` (concurrently runs 6 processes) and `build:all`'],
   ['Backend configuration', 'backend/.env: PORT, MONGO_URI, JWT_SECRET, LOGIN_APP_URL; optional SMTP_* and Razorpay test keys'],
   ['Development ports', 'API 5000; Admin 5173; Seller 5174; Customer 5175; Delivery 5176; Shared login 5177'],
   ['Tools', 'Visual Studio Code, Git and GitHub, a web browser with developer tools, API test scripts in backend/test'],
   ['Client', 'Any modern browser; each portal is a single-page application served by Vite']],
  [2600, 6066]));
sec('2.5', 'Technology Stack');
push(table('2.2', 'Technology stack confirmed in the repository',
  ['Layer', 'Technology', 'Use in ShopSphere'],
  [['Frontend', 'React 19, Vite 8, React Router 7', 'Five single-page applications (customer, seller, admin, delivery, shared login)'],
   ['Styling / UI', 'Tailwind CSS 4, React Icons, Framer Motion', 'Shared black-and-blue design system; plain CSS in the delivery console'],
   ['State / charts', 'Redux Toolkit, Axios, Recharts (seller portal)', 'Seller state store, HTTP client and analytics charts'],
   ['Backend', 'Node.js, Express 5', 'REST API with 13 route modules under /api'],
   ['Database', 'MongoDB, Mongoose 9', '11 schemas with validation, indexes and toJSON transforms'],
   ['Security', 'jsonwebtoken 9, bcryptjs 3', 'JWT issue/verify (7-day expiry); salted password hashing (cost 10)'],
   ['Real time', 'Socket.io 4 (server and client)', 'Role and user rooms for order and notification events'],
   ['Integrations', 'Razorpay SDK (test mode), Nodemailer', 'Optional online payment with HMAC signature verification; optional SMTP e-mail with console fallback'],
   ['Version control', 'Git, GitHub', 'Shared repository; pull-request based merges']],
  [1700, 2900, 4066]));
push(P('The commit history also records co-author trailers from an AI coding assistant on many commits, across several members’ accounts; AI-assisted development was therefore part of the team’s workflow.', { run: { size: 22 } }));

// ---------------- Chapter 3 ----------------
ch(3, 'System Design');
sec('3.1', 'Overall Architecture');
push(P('ShopSphere follows a three-tier architecture (Figure 3.1). The presentation tier consists of five React applications [8] built with Vite [9], each served on its own development port and therefore on its own browser origin. All of them call the same backend over REST/JSON and open a Socket.io connection for live updates. The application tier is a single Express 5 server [5] (`backend/server.js`) that mounts thirteen route modules, applies authorization middleware per route and converts every unhandled error into a uniform `{ success: false, message }` JSON response. The data tier is a MongoDB database [7] accessed only through Mongoose models [6]. Razorpay and SMTP are optional: without credentials, checkout falls back to Cash on Delivery and e-mails are written to the server console.'));
push(figure('diagrams/fig_architecture.png', '3.1', 'Overall ShopSphere system architecture (drawn from the repository structure)'));
sec('3.2', 'Frontend-to-Backend Request Flow');
push(P('Every portal has a small API client. The customer storefront’s `apiRequest()` (frontend/user/src/api/client.js) reads the saved session from `localStorage`, attaches `Authorization: Bearer <token>`, parses the JSON response and turns `success: false` into a thrown error that the page displays. A `401` response clears the stale session and redirects to the login with a `redirect` parameter so the user returns to the same page after signing in. On the server, a request passes through `cors()` and the JSON body parser, reaches its router, runs the route’s middleware chain (Figure 5.6) and then the handler wrapped in `asyncHandler`, which forwards rejected promises to the central error handler. Mongoose duplicate-key errors become `400 “That value is already in use”`, validation errors become `400`, and anything else becomes a generic `500` so internal details are not leaked.'));
push(P('Real-time updates use a Socket.io hub [10] (`backend/realtime.js`). Clients connect with a `role` and optional `userId` query parameter and are joined to rooms such as `role:admin` or `user:user-1`; route handlers call `emitToRole` and `emitToUser` after state changes, for example when an order is placed or a delivery status changes.'));
sec('3.3', 'Database Design and Data Models');
push(P('The database uses eleven Mongoose models (Figure 3.2). A single **Account** collection stores customers, sellers and administrators, distinguished by `role`; delivery partners are kept in a separate **DeliveryPartner** collection with their own account status, vehicle and document fields. Every model uses a readable business key (`id`, such as “user-1”, “prod-59” or “ORD-1021”) that the API and front-ends reference, generated by an atomic counter (`utils/sequence.js`). The `toJSON` transforms strip `_id`, `__v`, password hashes and reset tokens from every API response. Orders embed snapshots of item name, price and image so that order history survives a product being delisted, and record every state change in `statusHistory` with its phase, actor and timestamp.'));
push(figure('diagrams/fig_data_model.png', '3.2', 'Principal collections and relationships (from backend/models/*.model.js)'));

// ---------------- Chapter 4 ----------------
ch(4, 'Functional Modules and Workflows');
push(P('This chapter describes the modules that were confirmed in the code and exercised in the running application. The screenshots were captured on 21 October 2026 from the final code using the seeded demo data (no real customer data). Product photographs are loaded from an external image CDN that was not reachable from the capture environment, so image areas show placeholder or alternative text.', { run: { size: 22 } }));
sec('4.1', 'Customer Storefront');
push(P('The storefront (frontend/user, port 5175) provides a home page with category navigation, a filterable product listing (category hierarchy, price, rating and sort), product details with specifications, a cart, a wishlist and a checkout page (Figures 4.1–4.4). Only products whose `approvalStatus` is “Approved” and which are not archived are returned to customers. Checkout calls `POST /api/orders`; the server prices the cart from the catalogue rather than trusting the browser, checks PIN-code serviceability, decrements stock, notifies the seller and administrators in real time and sends a confirmation e-mail. The account area lists the customer’s orders and links to a tracking page that renders the order journey (Figures 4.5 and 4.6). Checkout, profile, wishlist and tracking routes are wrapped in a `RequireAuth` component.'));
push(pair(['screenshots/05_user_home.png', '4.1', 'Customer home page after sign-in'], ['screenshots/07_user_product.png', '4.2', 'Product details page']));
push(pair(['screenshots/08_user_cart.png', '4.3', 'Shopping cart with order summary'], ['screenshots/09_user_checkout.png', '4.4', 'Checkout with saved addresses']));
push(pair(['screenshots/10_user_orders.png', '4.5', 'My Orders inside the account area'], ['screenshots/11_user_track.png', '4.6', 'Order tracking timeline (ORD-1021)']));
sec('4.2', 'Seller Portal');
push(P('The seller portal (frontend/seller, port 5174) offers a dashboard with revenue and order statistics, product management, inventory steppers, order processing, analytics, discounts, payouts and store settings including serviceable PIN codes (Figures 4.7 and 4.8). Sellers register through `POST /api/register/seller`, which validates the phone number, the 15-character GSTIN and 10-character PAN formats and the four mandatory documents, and creates the account with `verificationStatus: “Pending”`. A seller can publish products only after an administrator verifies the store; each new listing then enters the approval queue (Figure 4.13). Seller order updates are validated against the `SELLER_TRANSITIONS` table, so an order cannot jump from “Processing” to “Delivered”.'));
push(pair(['screenshots/12_seller_dashboard.png', '4.7', 'Seller dashboard (TechNova Electronics demo store)'], ['screenshots/13_seller_products.png', '4.8', 'Seller product and stock management']));
sec('4.3', 'Administrator Console');
push(P('The admin console (frontend/admin, port 5173) contains the dashboard, user, seller and product management, seller verification with document review, product approval, order monitoring, refunds, delivery-partner management, delivery assignment and tracking, PIN-code coverage, payroll, support inquiries and, for super administrators only, the admin roster (Figures 4.9–4.11). The whole `/api/admin` router is protected by `requireAuth` and `requireRole("admin")`; the roster and payroll routes additionally require the SUPER_ADMIN tier.'));
push(pair(['screenshots/16_admin_seller_verif.png', '4.9', 'Seller verification queue with submitted documents'], ['screenshots/17_admin_product_approval.png', '4.10', 'Product approval queue']));
sec('4.4', 'Delivery Partner Console');
push(P('Delivery partners use frontend/delivery (port 5176) to view assigned orders, advance each job through Accepted, Picked Up, In Transit, Out For Delivery and Delivered, handle reverse pickups for returns and review their delivery history (Figure 4.12). The administrator assigns a partner from a list of eligible partners matched by PIN-code catchment (Figure 4.11). The update endpoint checks that the partner owns the job before changing it.'));
push(pair(['screenshots/18_admin_delivery_assign.png', '4.11', 'Admin delivery assignment by PIN-code eligibility'], ['screenshots/20_delivery_console.png', '4.12', 'Delivery console for a signed-in partner']));
sec('4.5', 'Core Workflows');
push(P('Figure 4.13 shows the seller onboarding and product approval workflow, and Figure 4.14 the complete order lifecycle across the four roles. When a courier marks an order “Picked Up”, the server automatically moves the seller status to “Shipped”; on “Delivered” it marks the seller status delivered and, for Cash on Delivery, records the payment as paid. Cancellations before dispatch restore stock and record refunds, and returns follow a separate pipeline from request through reverse pickup and inspection to refund (routes/returns.js).'));
push(figure('diagrams/fig_seller_approval.png', '4.13', 'Seller onboarding and product approval workflow'));
push(figure('diagrams/fig_order_lifecycle.png', '4.14', 'Order lifecycle across customer, seller, admin and delivery roles'));
sec('4.6', 'Payments, Notifications and Supporting Modules');
push(P('Online payment uses Razorpay in test mode only when test keys are configured. `POST /api/payments/create-order` prices the cart on the server and stores a **PaymentIntent**; order creation then verifies the Razorpay signature with HMAC-SHA256 and a constant-time comparison (`crypto.timingSafeEqual`) as described in Razorpay’s documentation [11], and checks that the intent’s amount matches the order total, so a payment for a smaller amount cannot be reused for a larger cart. In the environment used for this report no Razorpay keys were configured; the payment test suite confirmed that online payment is refused and Cash on Delivery works. **No live or test online payment was performed for this report.** Other implemented modules include in-app notifications, product reviews with moderation, support requests and payroll generation for delivery partners.'));

// ---------------- Chapter 5 ----------------
ch(5, 'Authentication and Authorization Implementation');
push(P('Within the team, the authentication and authorization work was led by Reyhaan S. This chapter describes the mechanism as it exists in the final code. Items marked † were added in the post-internship commit `5452ea8` (20 October 2026) and are described for completeness only; Section 7.3 lists the related commits.', { run: { size: 23 } }));
sec('5.1', 'Shared Login and Role Selection');
push(P('The shared login application (frontend/login, port 5177) is the single sign-in entry point for all four roles. The user first chooses a role (Figure 5.2) and then signs in on a role-specific screen reached through `/login/<role>` or the `?role=` deep link used by the other portals (Figure 5.3); a wrong password produces the generic error in Figure 5.4. The same app hosts the forgot-password and reset-password forms and links to each role’s registration page.'));
sec('5.2', 'Login Processing on the Server');
push(P('`POST /api/login` (backend/routes/auth.js) performs the following steps (Figure 5.1):'));
push(N('**Input validation.** `email`, `password` and `role` must be strings and `role` must be one of `admin`, `seller`, `user` or `delivery`; otherwise the server returns `400`.'));
push(N('**Account lookup.** The account is looked up by e-mail _and_ role, first exactly and then case-insensitively with regular-expression metacharacters escaped. The same e-mail used for a customer account therefore cannot sign in to the seller portal.'));
push(N('**Password verification.** `bcrypt.compare` checks the password against the stored hash. When no account exists, the server still compares against a dummy hash so that “unknown e-mail” and “wrong password” take similar time and return the same `401 “Invalid email or password”` message, which limits account enumeration, as recommended by OWASP [12].'));
push(N('**Account standing.** A suspended or deleted account is refused with `403` and an `accountStatus` field, which the login screen shows as a dedicated panel instead of a credentials error†. For the delivery role, partners stored in the DeliveryPartner collection are also checked.'));
push(N('**Token issue.** `signToken()` creates a JWT containing only `id` and `role` (plus `adminRole` for administrators), signed with `JWT_SECRET` (HMAC-SHA256, the library default [3]) and valid for seven days, following the JWT format of RFC 7519 [2]; `lastLogin` is updated and the response returns the token with the user’s id, name and e-mail.'));
push(figure('diagrams/fig_auth_sequence.png', '5.1', 'Authentication flow from the shared login to a role portal'));
sec('5.3', 'Cross-Portal Session Hand-off');
push(P('Because each portal runs on a different origin, `localStorage` cannot be shared between the login app and the portals. After a successful login the login app therefore builds the destination URL with `safeRedirectForRole()`, which accepts a `redirect` parameter only if its origin is the selected role’s own portal (preventing an open redirect to another site), and appends `authId`, `authName`, `authEmail`, `authRole` and `authToken` as query parameters. In the portal, `consumeAuthHandoff()` in the `useAuth` hook accepts the hand-off only when `authRole` matches the portal’s expected role, saves the session under a portal-specific key, and immediately removes the parameters from the address bar with `history.replaceState()`. The seller and admin portals protect their layouts with a `RequireAuth` component that performs a hard redirect to the shared login (`?role=seller` or `?role=admin` with a `redirect` back), as Figure 5.5 shows for an unauthenticated visit to the admin dashboard.'));
push(pair(['screenshots/01_role_chooser.png', '5.2', 'Shared login: role chooser (port 5177)'], ['screenshots/02_login_user.png', '5.3', 'Role-specific sign-in screen']));
push(pair(['screenshots/03_login_invalid.png', '5.4', 'Generic error for an invalid password'], ['screenshots/04_admin_redirect_unauth.png', '5.5', 'Unauthenticated admin visit redirected to admin sign-in']));
sec('5.4', 'Authorization Middleware');
push(P('Authorization is enforced on the server by small, composable middleware functions in `backend/middleware/auth.js`, applied per route or to a whole router (Figure 5.6 and Table 5.1). The essential pattern is shown below.'));
push(code([
  'function requireAuth(req, res, next) {',
  '  const auth = getAuthFromHeader(req);          // verifies "Bearer <jwt>" with JWT_SECRET',
  '  if (!auth) return res.status(401).json({ success: false,',
  '                     message: "Missing or invalid Authorization header" });',
  '  req.auth = auth;                              // { id, role [, adminRole] }',
  '  next();',
  '}',
  'function requireRole(...roles) {',
  '  return (req, res, next) => roles.includes(req.auth.role) ? next()',
  '    : res.status(403).json({ success: false, message: "You don\'t have access to this resource" });',
  '}',
  '// usage: router.patch("/:id/approval", requireAuth, requireActiveAccount, requireRole("admin"), handler)',
]));
push(new Paragraph({ children: [], spacing: { after: 80 } }));
push(figure('diagrams/fig_authz_pipeline.png', '5.6', 'Server-side authorization pipeline and rejection responses'));
push(table('5.1', 'Authorization guards and where they are applied',
  ['Guard', 'Behaviour', 'Examples of use'],
  [['requireAuth', 'Rejects with 401 unless a valid Bearer JWT is present; sets req.auth', 'All private routes'],
   ['requireRole(...)', '403 unless req.auth.role is in the allowed list', 'admin and coverage routers; product create/approve; seller-status; assignment'],
   ['requireSelfOrAdmin(param)', '403 unless the caller owns the :id or is an admin', 'Every /api/users/:id route (profile, addresses, cart, wishlist)'],
   ['requireSuperAdmin', 'Re-reads the caller from the database and requires an active SUPER_ADMIN†', 'Admin roster, payroll generation and edits'],
   ['requireActiveAccount / requireActivePartner†', 'Re-reads account status so a suspension takes effect before the 7-day token expires', 'Order, product, payment and delivery updates'],
   ['Role-scoped reads', 'Order reads return only the caller’s own orders; the partner roster is admin-only', 'GET /api/orders, /api/orders/:id, /api/delivery-partners'],
   ['Frontend RequireAuth', 'Redirects unauthenticated users to the login; hides super-admin screens', 'Checkout, profile, seller layout, admin layout']],
  [2500, 3300, 2866], { size: 19 }));
sec('5.5', 'Password, Reset and Registration Controls');
push(B('Passwords are hashed with bcrypt [4] (cost factor 10) in a Mongoose `pre("save")` hook, so every code path that sets a password — registration, seed data, admin reset or password reset — stores only a hash. `npm run hash-passwords` re-hashes any legacy plaintext password.'));
push(B('Registration enforces a valid e-mail format, a minimum password length of eight characters and a 10-digit phone number, and the unique index on e-mail blocks duplicates even under concurrent requests.'));
push(B('`POST /api/forgot-password` returns the same message whether or not the account exists; the reset token is 20 random bytes, expires after one hour and is cleared after use.'));
push(B('The seeded founding administrator cannot be demoted, suspended or deleted, so the console cannot be locked out of its own roster.'));

// ---------------- Chapter 6 ----------------
ch(6, 'Testing and Verification');
sec('6.1', 'Test Environment and Approach');
push(P('For this report the final code (commit `f707f90`) was used: dependencies were installed with `npm install` and `npm run install:all`, MongoDB 7 was run in a local Docker container and all six processes were started with `npm run dev:all` using a locally generated `JWT_SECRET`. Testing combined (a) the backend test scripts that ship with the repository, which call the running API and print PASS or FAIL for each check, (b) a focused authentication and authorization check written for this report, and (c) manual walkthroughs of each portal while capturing the screenshots with Playwright [14]. All tests were run on 21 October 2026, after the internship period, against the final code.'));
sec('6.2', 'Repository Test Suites');
push(table('6.1', 'Results of the repository test scripts (backend/test, run on 21 October 2026)',
  ['Script', 'What it checks', 'Result'],
  [['smoke.js (npm test)', 'Catalogue loads; login for all four roles; registration', '6 passed, 0 failed'],
   ['features.js', 'Order journey, status transitions and related features', '24 passed, 0 failed'],
   ['serviceability.test.js', 'PIN-code delivery serviceability rules', '17 passed, 0 failed'],
   ['cancellation.js', 'Order and item cancellation, stock restoration, refunds', '39 passed, 0 failed'],
   ['payments.js', 'Payment integrity in Cash-on-Delivery-only mode (no Razorpay keys)', '6 passed, 0 failed'],
   ['verify_changes_1_to_10.js', 'Regression checks for ten earlier change requests', '15 passed, 0 failed']],
  [2500, 4366, 1800]));
push(P('The payment script reports that prepaid paths are exercised only when the server is restarted with `ENABLE_MOCK_PAYMENTS=true`; that mode was not run, so prepaid checkout is **not** claimed as tested here. There are no automated front-end tests in the repository.'));
sec('6.3', 'Authentication and Authorization Test Cases');
push(P('Table 6.2 lists the security-related checks executed against the running API with the seeded demo accounts. Each row records the expected and the observed HTTP status.'));
push(table('6.2', 'Authentication and authorization checks (expected vs. observed)',
  ['ID', 'Scenario', 'Expected', 'Observed'],
  [['A1', 'Valid customer login', '200 + JWT', '200 ✔'],
   ['A2', 'Wrong password', '401', '401 ✔'],
   ['A3', 'Unknown e-mail (same message as A2)', '401', '401 ✔'],
   ['A4', 'Valid customer credentials used for the seller role', '401', '401 ✔'],
   ['A5–A6', 'Missing role / invalid role value', '400', '400 ✔'],
   ['B1–B2', 'GET /users/me with no token / tampered token', '401', '401 ✔'],
   ['C1–C2', 'Customer or seller calls GET /admin/stats', '403', '403 ✔'],
   ['C3', 'Admin calls GET /admin/stats', '200', '200 ✔'],
   ['C4–C5', 'Customer approves or creates a product', '403', '403 ✔'],
   ['C6', 'Delivery partner changes seller status', '403', '403 ✔'],
   ['D1', 'Customer reads another user’s profile', '403', '403 ✔'],
   ['D3–D4', 'Customer lists another user’s orders / no token', '403 / 401', '403 / 401 ✔'],
   ['D5', 'Admin reads any user profile', '200', '200 ✔'],
   ['F1–F3', 'Short password, malformed e-mail, invalid reset token', '400', '400 ✔'],
   ['G1', 'Password hash absent from /users/me response', 'absent', 'absent ✔'],
   ['G2–G3', 'JWT payload fields and lifetime', 'id, role; 7 days', 'id, role, iat, exp; 7 days ✔'],
   ['H1–H3', 'GET /orders, /orders/:id, /delivery-partners without a token', '401', '401 ✔'],
   ['H4–H5', 'Customer / seller list orders', 'own orders only', 'own orders only ✔'],
   ['H6–H7', 'Customer reads another customer’s order; seller reads partner roster', '403', '403 ✔'],
   ['H8', 'Admin reads the partner roster', '200', '200 ✔']],
  [900, 4466, 1650, 1650], { size: 19 }));

sec('6.4', 'Defects Fixed During the Final Review');
push(P('Before submission the whole codebase was reviewed and the defects in Table 6.3 were fixed. After the fixes all five front-ends build without errors, all six backend test scripts still pass (107 checks), every check in Table 6.2 passes, and every screen in Chapter 4 was re-captured from the fixed code.'));
push(table('6.3', 'Defects fixed in the final review (commits fd224c2, bf17b77, f707f90)',
  ['Area', 'Defect', 'Fix'],
  [['Backend security', 'Order list, order details and partner roster readable without logging in', 'Require a JWT; each role sees only its own orders; roster admin-only'],
   ['Backend', 'Requests without a JSON body crashed with 500; bad JSON or IDs returned 500', 'Empty body defaults to {}; such errors now return 400'],
   ['Cancellations / returns', 'Already-cancelled lines restocked and refunded twice; return quantities not checked', 'Skip cancelled lines; refund only the remainder; cap return quantities'],
   ['Returns / admin', 'Any partner or seller could act on others’ returns; any admin could suspend super admins', 'Ownership checks; admin accounts managed only from the roster'],
   ['Orders', 'Loyalty points from the client-sent amount; delivered status allowed on cancelled orders', 'Use server-priced amount; block updates on closed orders'],
   ['Storefront', 'Cart/wishlist missed same-tab login; local cart could overwrite saved cart; endless image requests on My Orders', 'Same-tab auth event; wait for server cart; cache empty results'],
   ['Storefront checkout', 'Saved card forced a failing prepaid order when only COD was available', 'Saved methods count only when online payment is on'],
   ['Seller / admin / delivery', 'Hook-order crash in seller chart; revenue mixed years; blank /admin page; delivery console reset on every update', 'Hook moved; group by year and month; redirects added; loader only on first load']],
  [1700, 3700, 3266], { size: 17, compact: true }));

// ---------------- Chapter 7 ----------------
ch(7, 'Team Contributions and Collaboration');
sec('7.1', 'Team Structure');
push(P(`ShopSphere was developed jointly by the teams **Ctrl+Alt+Win** and **Femme Forces**. Work was divided by module: three members acted as main contributors with ownership of a core area, one member supported the seller module, and two members carried out limited, bounded testing and evidence tasks. Table 7.1 summarises the responsibilities recorded in the team’s Task Assignment sheet.`));
push(table('7.1', `Team members and responsibilities — ${TEAMS}`,
  ['Member (Reg. No.)', 'Level', 'Main responsibility'],
  [['Reyhaan S (312325205176)', 'Main contributor', 'Authentication, authorization, shared login, protected routes, security validation and integration'],
   ['Sai Saran S (312325205188)', 'Main contributor', 'System architecture, frontend/backend integration, API and data flow, build configuration and coordination'],
   ['Mrityunjai G (312325205132)', 'Main contributor', 'Administration portal, seller and product approvals, role permissions, order and delivery administration'],
   ['Pasupathi G (312325205157)', 'Supporting contributor', 'Seller portal, catalogue and inventory workflows, seller fulfilment and testing'],
   ['Priyadharshini P (312325205165)', 'Limited support', 'Customer UI spot-checks, cart/checkout smoke checks, screenshot evidence'],
   ['Niraimathi V (312325205141)', 'Light support', 'Occasional delivery-workflow checks, screenshots and simple QA notes']],
  [2700, 1700, 4266], { size: 19 }));
sec('7.2', 'Member Contributions');
push(B('**Reyhaan S — authentication, authorization and integration.** The shared login application and per-role login entry, the safe redirect to each role’s portal, the super-administrator tier (`requireSuperAdmin` and `adminRole` in the token), removal of the e-mail OTP step with a migration that re-hashes plaintext passwords, storefront re-authentication on `401`, the four-role login smoke test, and security and cross-portal regression checks (Chapter 5).'));
push(B('**Sai Saran S — architecture, integration and coordination.** Overall system architecture and the mapping of each portal to its backend routes, frontend/backend data flow (including cart-to-order integration), build and run configuration, cross-portal API consistency, error-handling alignment, integration test planning and documentation; the later UI and data-flow enhancements merged as pull request #3 were committed under the Sai Saran S account.'));
push(B('**Mrityunjai G — administration portal.** Seller verification and product approval workflows, user and seller management, role-permission checks on admin-only screens and actions, order administration and delivery assignment, and status-transition verification (Sections 4.3 and 4.5).'));
push(B('**Pasupathi G — seller portal (supporting).** Seller dashboard navigation, product-entry and validation review, inventory and stock workflows, seller-side order handling and fulfilment status, and consistency checks between seller listings and the storefront (Section 4.2).'));
push(B('**Priyadharshini P — customer storefront checks (limited).** Cart and checkout smoke tests, checkout validation, customer UI spot-checks and organisation of customer-flow screenshots.'));
push(B('**Niraimathi V — delivery checks (light).** Occasional delivery-status and navigation spot-checks, cross-role status-label comparison, simple form checks and help with labelling report evidence.'));
sec('7.3', 'Repository Evidence');
push(P('Table 7.2 lists notable commits from the internship period and the one later merge. Commit authorship is useful evidence but is not a complete record of who did what: much of the work was discussed and tested jointly, some members contributed through testing rather than commits, and several commits carry AI co-author trailers.'));
push(table('7.2', 'Notable commits in the shared repository',
  ['Date', 'Commit (author)', 'Change'],
  [['16 Jul 2026', '631eed3 (Reyhaan S)', 'Migrated the backend to MongoDB; replaced each app’s own login with the shared frontend/login app'],
   ['17–18 Jul 2026', 'several (AI-assistant identity)', 'Catalogue, reviews, returns, real-time events, payments; storefront, seller, admin and delivery screens wired to the live API; seed data'],
   ['19 Jul 2026', '3384e7b (reyhaan07)', 'Payroll module, editable admin/seller profiles, per-role login entry, seller onboarding, delivery history'],
   ['25 Jul 2026', 'dc43a8f, 998db43 (reyhaan07)', 'Removed e-mail OTP verification; password re-hash migration; backend smoke test'],
   ['20 Aug 2026', 'e83285c (reyhaan07)', 'Super-admin roster behind requireSuperAdmin; order status-transition graph and phased journey; features test'],
   ['20–22 Aug 2026', 'b00380b, 612e7f0, 44ba684, 4c808b0', 'Seller Center redesign and PIN-code delivery settings; customer profile redesign; storefront re-authentication on 401'],
   ['20 Oct 2026', '5452ea8 (Sai Saran S), merged as PR #3', 'UI and data-flow enhancements, account-status re-checks, delivery self-registration — after the internship period'],
   ['21 Oct 2026', 'fd224c2, bf17b77, f707f90', 'Final review fixes before submission (Section 6.4)']],
  [1350, 2400, 4916], { size: 19 }));
push(P('Earlier commits (26 June – 13 July 2026) by the accounts “Blueundead24” and “Harini-G-07” created the initial project structure, the first login API, the delivery app and the user-account module, including the original `requireAuth` and `requireSelfOrAdmin` guards; these accounts are not mapped to team members in the allocation workbook.'));
sec('7.4', 'Work Allocation Summary');
push(P('The team’s workbook covers **15 July 2026 to 14 September 2026**, a sub-period of the internship (18 June – 15 September 2026). It allocates one recurring task per member for each of 41 working days. The workbook itself states that its daily calendar is a proposed retrospective allocation and not a verified record of attendance or completion dates; it is summarised here as a work-allocation record, not as a daily log.'));
push(table('7.3', 'Recurring task areas per member in the work-allocation calendar (days allocated in brackets)',
  ['Member', 'Recurring task areas'],
  [['Reyhaan S', 'Role authorization (5), API auth integration (5), protected routes (4), auth integration fixes (4), security regression (4), environment configuration (4), cross-portal verification (4), credential validation (4), token/session handling (4), final auth walkthrough (3)'],
   ['Sai Saran S', 'Build/configuration review (5), integration test planning (5), error-handling alignment, documentation consolidation, final integration review, scope and milestones, architecture review, cart/order integration, cross-portal API checks (4 each), API/data-flow tracing (3)'],
   ['Mrityunjai G', 'Regression pass (5), evidence preparation (5), issue verification, seller approval workflow, role permission checks, product administration, user management, status-transition checks, admin API review (4 each), order administration (3)'],
   ['Pasupathi G', 'Seller portal orientation (5), product creation review (5), seller order handling, catalogue consistency, fulfilment status, seller validation QA, evidence capture, cross-role check, final walkthrough (4 each), seller API trace (3)'],
   ['Priyadharshini P', 'Checkout validation (5), customer screenshots (5), cart smoke test and other customer UI spot-checks (3–4 each)'],
   ['Niraimathi V', 'Cross-role display check (5), light regression support (5), delivery UI and journey spot-checks, report evidence and handover support (3–4 each)']],
  [1900, 6766], { size: 19 }));
push(table('7.4', 'Project phases reconstructed from repository history and the allocation workbook',
  ['Period', 'Activity', 'Evidence'],
  [['18 Jun – 14 Jul', 'Onboarding and MERN training; initial project set-up, common login, first backend APIs and user-account module', 'Commits 26 Jun – 13 Jul'],
   ['15 – 31 Jul', 'MongoDB migration and shared login; full module build-out; per-role login; OTP removal and password hashing; smoke test', 'Commits 16 – 25 Jul; workbook'],
   ['1 – 31 Aug', 'Super-admin tier and order journey; seller centre redesign; PIN-code delivery settings; 401 re-authentication', 'Commits 20 – 22 Aug; workbook'],
   ['1 – 15 Sep', 'Regression checks, cross-portal verification, documentation and report preparation', 'Workbook only (no commits dated in September)'],
   ['After 15 Sep', 'UI and data-flow enhancements merged as pull request #3 on 20 Oct 2026', 'Commit 5452ea8 / 8f85bbd — outside the internship period']],
  [1500, 4766, 2400], { size: 19 }));

// ---------------- Chapter 8 ----------------
ch(8, 'Challenges, Outcomes and Limitations');
sec('8.1', 'Challenges and Solutions');
push(P('The challenges below are those that are visible in the code and commit history.'));
push(B('**Sharing a login across separate origins.** Each portal runs on its own port, so a session stored by the login app is invisible to the others. The solution was a one-time hand-off through redirect query parameters, accepted only for the matching role, stored per portal and immediately removed from the URL; redirect targets are restricted to the selected role’s own origin.'));
push(B('**Distinguishing roles for the same person.** Looking up accounts by e-mail _and_ role keeps a customer login from opening the seller or admin console, and gives each portal a clear expected role.'));
push(B('**Registration friction versus security.** The six-digit e-mail OTP step was removed from registration (commit dc43a8f); to keep credential storage safe, a migration was added to re-hash any password not already in bcrypt format.'));
push(B('**Expired sessions breaking pages.** An expired token used to leave customers on a raw “Missing or invalid Authorization header” message. The API client now clears the session and returns the user through the shared login to the same page.'));
push(B('**Graded administrator permissions.** A super-administrator tier was introduced for roster management, with the UI hiding the screen and the API enforcing it independently.'));
sec('8.2', 'Project Outcomes');
push(P('The team delivered a working multi-vendor platform with five role-specific front-ends, a REST API of thirteen route modules, eleven data models and an integrated workflow from seller onboarding to delivery and returns. All six repository test scripts passed (107 checks) and the focused authentication and authorization checks matched the behaviour described in the code. Key results in authentication and integration were a single shared login used by all four roles, server-side role enforcement on privileged routes and a tested session-recovery path in the storefront.'));
sec('8.3', 'Limitations Identified')
push(P('The following limitations were identified while verifying the code for this report (October 2026). They are recorded so that they can be addressed, and are not claimed to have been fixed.'));
push(B('**Read endpoints (fixed).** The order list, order details and delivery-partner roster were readable without a token; this was fixed in the final review (Section 6.4).'));
push(B('**Token handling.** The JWT is passed in the URL during the cross-origin hand-off and stored in `localStorage`, where any injected script could read it [13]. Tokens last seven days and there is no refresh-token or revocation list (the post-internship status re-check reduces, but does not remove, this risk).'));
push(B('**Configuration defaults.** `JWT_SECRET` falls back to a hard-coded development value if the environment variable is missing; CORS and Socket.io accept any origin; and Socket.io rooms are joined from query parameters without verifying a token.'));
push(B('**No rate limiting** on login, registration or password-reset endpoints, and reset tokens are stored unhashed.'));
push(B('**Testing scope.** Prepaid (Razorpay) checkout was not exercised, there are no front-end automated tests and the backend scripts require a running server rather than an isolated test database.'));

// ---------------- Chapter 9 ----------------
ch(9, 'Learning Outcomes, Conclusion and Future Enhancements');
sec('9.1', 'Learning Outcomes');
push(B('Designing token-based authentication end to end: credential validation, bcrypt hashing, JWT signing and verification, expiry, and the difference between authentication (401) and authorization (403).'));
push(B('Composing Express middleware to enforce roles, ownership and permission tiers on the server, and treating client-side route guards as usability features rather than security controls.'));
push(B('Integrating several React applications with one backend, including cross-origin session hand-off, safe redirects and graceful recovery from expired sessions.'));
push(B('Modelling data with Mongoose (schemas, enums, indexes, transforms) and reasoning about state machines for orders.'));
push(B('Testing APIs systematically with scripted checks, comparing expected and observed status codes, and reporting limitations honestly.'));
push(B('Working in a six-member, two-team project with Git and GitHub, pull requests and a shared work-allocation plan.'));
sec('9.2', 'Conclusion');
push(P(`The internship at TechPower Solutions provided practical experience of building a real multi-role web application with the MERN stack. ShopSphere, developed jointly by ${TEAMS}, demonstrates a complete marketplace workflow across customer, seller, administrator and delivery-partner portals. Each member’s work — authentication and the shared login, the overall architecture and integration, the administration and seller portals, and testing of the customer and delivery flows — contributed to one integrated platform. Verifying the system for this report also showed where its security can be strengthened, which forms the basis of the enhancements below.`));
sec('9.3', 'Future Enhancements');
push(B('Move session tokens to secure, HTTP-only cookies or a short-lived access token with a refresh token, and replace the URL hand-off with a one-time code exchange.'));
push(B('Fail start-up when `JWT_SECRET` is missing, restrict CORS and Socket.io origins, and authenticate socket connections with the JWT.'));
push(B('Add rate limiting and lockout on authentication endpoints, hash password-reset tokens and optionally reintroduce e-mail verification or two-factor authentication for administrators.'));
push(B('Add automated front-end and isolated backend tests (for example with an in-memory MongoDB) to continuous integration, and exercise the Razorpay test-mode flow.'));
push(B('Deploy the portals behind a single domain so that sessions can be shared without cross-origin hand-off.'));

// ---------------- References ----------------
TOC.push(['REFERENCES', 'refs', 0]);
push(H1(null, 'References'));
[
  'Ctrl+Alt+Win and Femme Forces, “ShopSphere — Multi-Vendor E-Commerce Platform,” GitHub repository. https://github.com/reyhaan07/E-Commerce (final code, commit f707f90; accessed 21 Oct. 2026).',
  'M. Jones, J. Bradley and N. Sakimura, “JSON Web Token (JWT),” RFC 7519, IETF, May 2015. https://www.rfc-editor.org/rfc/rfc7519',
  'Auth0, “jsonwebtoken” library documentation. https://github.com/auth0/node-jsonwebtoken',
  'D. Wirtz, “bcrypt.js” library documentation. https://github.com/dcodeIO/bcrypt.js',
  'OpenJS Foundation, “Express 5.x API Reference.” https://expressjs.com/en/5x/api.html',
  'Mongoose, “Mongoose Documentation.” https://mongoosejs.com/docs/',
  'MongoDB, Inc., “MongoDB Manual.” https://www.mongodb.com/docs/manual/',
  'Meta Open Source, “React Documentation.” https://react.dev/',
  'Vite, “Vite Guide.” https://vite.dev/guide/',
  'Socket.IO, “Socket.IO v4 Documentation.” https://socket.io/docs/v4/',
  'Razorpay, “Standard Checkout — Verify Payment Signature.” https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/',
  'OWASP Foundation, “Authentication Cheat Sheet.” https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
  'OWASP Foundation, “HTML5 Security Cheat Sheet — Local Storage.” https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html',
  'Microsoft, “Playwright Documentation” (used to capture the screenshots). https://playwright.dev/',
].forEach((r, i) => push(new Paragraph({ children: runs(`[${i + 1}]  ${r}`, { size: 22 }), spacing: { after: 80, line: 264 }, indent: { left: 480, hanging: 480 } })));

// ---------------- Appendix A: demo logins (verified list in creds.json) ----------------
const CREDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'creds.json')));
TOC.push(['APPENDIX A  DEMO LOGIN CREDENTIALS', 'appA', 0]);
push(H1(null, 'Appendix A  Demo Login Credentials'));
push(P('All accounts below are demo accounts created by the database seed script (backend/data) when the backend starts with an empty database; they contain no real personal data. Each of the 80 accounts was signed in successfully through `POST /api/login` on 21 October 2026. Sign in at the shared login (http://localhost:5177) by choosing the role, or open a portal directly and it redirects to the login. These passwords are for local demonstration only and must be changed before any real deployment. For admin-16 to admin-20, the repository’s DEMO_LOGINS.md lists accounts that are not seeded; the accounts below, taken from the seed code, are the ones that work.', { run: { size: 21 }, after: 80 }));
push(table('A.1', 'Quick-start accounts (one per role)',
  ['Role', 'Portal', 'E-mail', 'Password'],
  [['Customer', 'http://localhost:5175', 'aditi@example.com', 'aditi123'],
   ['Seller', 'http://localhost:5174', 'seller@shopsphere.com', 'seller1234'],
   ['Administrator (super admin)', 'http://localhost:5173', 'admin@shopsphere.com', 'admin1234'],
   ['Delivery partner', 'http://localhost:5176', 'ravi.delivery@shopsphere.com', 'ravi123']],
  [2300, 2100, 2800, 1466], { size: 18 }));
[['user', 'Customer storefront accounts (http://localhost:5175)', 'Location'],
 ['seller', 'Seller portal accounts (http://localhost:5174)', 'City'],
 ['delivery', 'Delivery partner accounts (http://localhost:5176)', 'Vehicle, zone PIN'],
 ['admin', 'Administrator console accounts (http://localhost:5173)', 'Role']].forEach(([role, title, extra], i) => {
  const rows = CREDS.filter((c) => c.role === role).map((c) => [c.actualId, c.name, c.email, c.password, c.extra]);
  push(table(`A.${i + 2}`, title, ['ID', role === 'seller' ? 'Store' : 'Name', 'E-mail', 'Password', extra], rows, [1000, 1950, 3050, 1150, 1516], { size: 16, compact: true }));
});

// =====================================================================
// FRONT MATTER
// =====================================================================
const cover = [
  new Paragraph({ children: [img('logos/techpower_logo.png', 3.0)], alignment: AlignmentType.CENTER, spacing: { before: 2700, after: 360 } }),
  C('INTERNSHIP COMPLETION REPORT', { run: { bold: true, size: 34 }, after: 120 }),
  C('MERN Stack Development Internship', { run: { size: 24 }, after: 360 }),
  C('SHOPSPHERE', { run: { bold: true, size: 40 }, after: 40 }),
  C('Multi-Vendor Social E-Commerce Platform', { run: { bold: true, size: 26 }, after: 480 }),
  C('Presented by', { run: { italics: true, size: 24 }, after: 60 }),
  C('CTRL+ALT+WIN  &  FEMME FORCES', { run: { bold: true, size: 28 }, after: 160 }),
  ...[['Reyhaan S', '312325205176'], ['Sai Saran S', '312325205188'], ['Mrityunjai G', '312325205132'], ['Pasupathi G', '312325205157'], ['Priyadharshini P', '312325205165'], ['Niraimathi V', '312325205141']]
    .map(([n, r], k) => C(`${n} – ${r}`, { run: { size: 23 }, after: k === 5 ? 120 : 30 })),
  C('B.Tech. Information Technology, St. Joseph’s College of Engineering, Chennai', { run: { italics: true, size: 21 }, after: 480 }),
  C('Submitted to', { run: { italics: true, size: 24 }, after: 60 }),
  C('TechPower Solutions', { run: { bold: true, size: 25 }, after: 30 }),
  C('#05, 1st Floor, 100 Feet Road, Vadapalani, Chennai – 600 026', { run: { size: 22 }, after: 360 }),
  C('Internship period: 18 June 2026 – 15 September 2026', { run: { bold: true, size: 23 }, after: 0 }),
];

const front = [];
const fpush = (...x) => x.flat().forEach((e) => front.push(e));
const fH = (t) => new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 30 })], alignment: AlignmentType.CENTER, spacing: { after: 300 }, pageBreakBefore: front.length > 0 });
fpush(fH('ABSTRACT'));
fpush(P('This report is presented by the teams Ctrl+Alt+Win and Femme Forces and describes the internship completed by their six members at TechPower Solutions, Chennai, from 18 June to 15 September 2026, in the domain of MERN stack development. The internship centred on the teams’ joint project, ShopSphere, a multi-vendor social e-commerce platform.', { line: 336, after: 160 }));
fpush(P('ShopSphere consists of five React 19 single-page applications — a customer storefront, a seller portal, an administrator console, a delivery-partner console and a shared login application — served by one Node.js/Express 5 API with MongoDB persistence through eleven Mongoose models. The platform implements seller onboarding with GSTIN, PAN and document validation, administrator verification and product approval, cart and checkout with server-side pricing, PIN-code-based delivery assignment, a phased order journey, cancellations, returns, notifications over Socket.io and optional Razorpay test-mode payments with HMAC signature verification.', { line: 336, after: 160 }));
fpush(P('The report explains the system architecture, data model and functional modules, and examines the security design in detail: the shared login, role-aware credential checking with bcrypt and timing-normalised failures, seven-day JSON Web Tokens, the safe cross-origin session hand-off, and the composable Express middleware that enforces roles, ownership and a super-administrator tier on the server. The contribution of each team member is described, with main contributors distinguished from supporting members.', { line: 336, after: 160 }));
fpush(P('The system was run locally for verification: all six repository test scripts passed (107 checks), and a focused set of authentication and authorization checks matched the implemented behaviour. A final review fixed the defects it found, including order and delivery-partner data that was readable without logging in; remaining limitations, such as token storage in the browser, are recorded with recommended enhancements.', { line: 336, after: 160 }));
fpush(P('**Keywords:** MERN stack, multi-vendor e-commerce, JWT, role-based access control, Express middleware, MongoDB, React.', { line: 336 }));

fpush(fH('TABLE OF CONTENTS'));
fpush(tocLine('ABSTRACT', 'abs', 0), tocLine('LIST OF FIGURES AND TABLES', 'lof', 0));
TOC.forEach(([t, k, l]) => fpush(tocLine(t, k, l)));

fpush(fH('LIST OF FIGURES AND TABLES'));
const lofLine = (label, text, key) => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: 8660, leader: 'dot' }],
  children: [new TextRun({ text: `${label}  `, bold: true, size: 20 }), new TextRun({ text: `${text}\t${PAGES[key] ?? ''}`, size: 20 })],
  spacing: { after: 10 }, indent: { left: 1000, hanging: 1000 },
});
fpush(new Paragraph({ children: [new TextRun({ text: 'Figures', bold: true, size: 22 })], spacing: { after: 60 } }));
FIGS.forEach((f) => fpush(lofLine(`Figure ${f.id}`, f.text, `f${f.id}`)));
fpush(new Paragraph({ children: [new TextRun({ text: 'Tables', bold: true, size: 22 })], spacing: { before: 140, after: 60 } }));
TABS.forEach((t) => fpush(lofLine(`Table ${t.id}`, t.text, `t${t.id}`)));

// =====================================================================
// DOCUMENT
// =====================================================================
const pageProps = { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1800, right: 1440, header: 600, footer: 600 } } };
const footer = (fmt) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 22 })] })] });
const header = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '9AA5B4', space: 2 } }, children: [new TextRun({ text: 'ShopSphere — Internship Report  |  Ctrl+Alt+Win & Femme Forces', size: 17, color: '5A6474' })] })] });

const doc = new Document({
  creator: 'Ctrl+Alt+Win & Femme Forces', title: 'Internship Report — ShopSphere', description: 'Internship report, TechPower Solutions, 2026',
  styles: {
    default: { document: { run: { font: FONT, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 26, bold: true }, paragraph: { outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true }, paragraph: { outlineLevel: 2 } },
    ],
  },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 280 } } } },
      { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1000, hanging: 280 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 320 } } } }] },
  ] },
  sections: [
    { properties: { ...pageProps, page: { ...pageProps.page, margin: { top: 1000, bottom: 900, left: 1440, right: 1440 } } }, children: cover },
    { properties: { ...pageProps, page: { ...pageProps.page, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } }, footers: { default: footer() }, children: front },
    { properties: { ...pageProps, page: { ...pageProps.page, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } }, headers: { default: header }, footers: { default: footer() }, children: body },
  ],
});
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(path.join(OUT, 'SHOPSPHERE_TEAM_INTERNSHIP_REPORT.docx'), buf);
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ toc: TOC, figs: FIGS, tabs: TABS }, null, 1));
  console.log('written', FIGS.length, 'figures', TABS.length, 'tables');
});
