# ShopSphere — Demo Login Credentials & Testing Guide

This document contains all pre-configured demo accounts across all 4 platform roles (**Customer/User**, **Seller**, **Delivery Partner**, and **Platform Admin**), as well as Razorpay test payment credentials.

---

## 🌐 Quick Access Portal URLs

| Portal | URL | Purpose |
| :--- | :--- | :--- |
| **Unified Multi-Role Login** | [http://localhost:5177](http://localhost:5177) | Universal role picker & sign-in |
| **Platform Admin Portal** | [http://localhost:5173](http://localhost:5173) | Moderation, delivery fleets, users, orders & approvals |
| **Seller Portal** | [http://localhost:5174](http://localhost:5174) | Store catalog, inventory, order processing & metrics |
| **Customer Storefront** | [http://localhost:5175](http://localhost:5175) | Browsing products, cart, checkout, returns & tracking |
| **Delivery Partner Console** | [http://localhost:5176](http://localhost:5176) | Dispatch, order acceptance, live delivery tracking & profile |
| **Backend REST & Socket API** | [http://localhost:5000](http://localhost:5000) | Core Express API & MongoDB backend |

---

## 🚀 Headline Demo Accounts (Fastest Path)

| Role | Name / Store | Email | Password | Direct Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Platform Admin | `admin@shopsphere.com` | `admin1234` | [http://localhost:5173](http://localhost:5173) |
| **Seller** | TechNova Electronics | `seller@shopsphere.com` | `seller1234` | [http://localhost:5174](http://localhost:5174) |
| **User (Customer)** | Aditi Verma | `aditi@example.com` | `aditi123` | [http://localhost:5175](http://localhost:5175) |
| **Delivery Partner** | Ravi Kumar | `ravi.delivery@shopsphere.com` | `ravi123` | [http://localhost:5176](http://localhost:5176) |

---

## 👤 1. Storefront Customers / Users (Port 5175)

All customer accounts can log in via [http://localhost:5177/login/user](http://localhost:5177/login/user) or directly on the User storefront.

| # | User ID | Name | Email | Password | Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `user-1` | Aditi Verma | `aditi@example.com` | `aditi123` | Mumbai, Maharashtra |
| 2 | `user-2` | Rahul Nair | `rahul@example.com` | `rahul123` | Delhi, Delhi |
| 3 | `user-3` | Priya Sharma | `priya.sharma@example.com` | `priya123` | Bengaluru, Karnataka |
| 4 | `user-4` | Arjun Mehta | `arjun.mehta@example.com` | `arjun123` | Chennai, Tamil Nadu |
| 5 | `user-5` | Sneha Iyer | `sneha.iyer@example.com` | `sneha123` | Hyderabad, Telangana |
| 6 | `user-6` | Vikram Singh | `vikram.singh@example.com` | `vikram123` | Pune, Maharashtra |
| 7 | `user-7` | Ananya Das | `ananya.das@example.com` | `ananya123` | Jaipur, Rajasthan |
| 8 | `user-8` | Karthik Reddy | `karthik.reddy@example.com` | `karthik123` | Kolkata, West Bengal |
| 9 | `user-9` | Ishita Banerjee | `ishita.banerjee@example.com` | `ishita123` | Ahmedabad, Gujarat |
| 10 | `user-10` | Rohan Kulkarni | `rohan.kulkarni@example.com` | `rohan123` | Lucknow, Uttar Pradesh |
| 11 | `user-11` | Meera Pillai | `meera.pillai@example.com` | `meera123` | Kochi, Kerala |
| 12 | `user-12` | Aakash Gupta | `aakash.gupta@example.com` | `aakash123` | Indore, Madhya Pradesh |
| 13 | `user-13` | Divya Menon | `divya.menon@example.com` | `divya123` | Mumbai, Maharashtra |
| 14 | `user-14` | Siddharth Joshi | `siddharth.joshi@example.com` | `siddharth123` | Delhi, Delhi |
| 15 | `user-15` | Nisha Agarwal | `nisha.agarwal@example.com` | `nisha123` | Bengaluru, Karnataka |
| 16 | `user-16` | Farhan Khan | `farhan.khan@example.com` | `farhan123` | Chennai, Tamil Nadu |
| 17 | `user-17` | Lakshmi Raman | `lakshmi.raman@example.com` | `lakshmi123` | Hyderabad, Telangana |
| 18 | `user-18` | Dev Patel | `dev.patel@example.com` | `dev12345` | Pune, Maharashtra |
| 19 | `user-19` | Tanvi Deshpande | `tanvi.deshpande@example.com` | `tanvi123` | Jaipur, Rajasthan |
| 20 | `user-20` | Harpreet Kaur | `harpreet.kaur@example.com` | `harpreet123` | Kolkata, West Bengal |

---

## 🏪 2. Verified Sellers (Port 5174)

Sellers manage their inventory, add products, adjust stock directly in the table, and view incoming orders.

| # | Seller ID | Store Name | Email | Password | Primary City |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `seller-1` | TechNova Electronics | `seller@shopsphere.com` | `seller1234` | Chennai |
| 2 | `seller-2` | PixelPort Mobiles | `contact@pixelport.example.com` | `pixel1234` | Bengaluru |
| 3 | `seller-3` | ByteWorks Computing | `sales@byteworks.example.com` | `byte1234` | Hyderabad |
| 4 | `seller-4` | LensCraft Studio | `hello@lenscraft.example.com` | `lens1234` | Mumbai |
| 5 | `seller-5` | SoundWave Audio | `care@soundwave.example.com` | `sound1234` | Pune |
| 6 | `seller-6` | HomeCraft Living | `support@homecraft.example.com` | `home1234` | Jaipur |
| 7 | `seller-7` | BrightNest Appliances | `orders@brightnest.example.com` | `nest1234` | Delhi |
| 8 | `seller-8` | SpiceRoute Kitchen | `team@spiceroute.example.com` | `spice1234` | Kochi |
| 9 | `seller-9` | UrbanWeave Fashion | `style@urbanweave.example.com` | `weave1234` | Mumbai |
| 10 | `seller-10` | StrideZone Footwear | `walk@stridezone.example.com` | `stride1234` | Agra |
| 11 | `seller-11` | TimeAxis Watches | `tick@timeaxis.example.com` | `time1234` | Kolkata |
| 12 | `seller-12` | GlowLeaf Beauty | `glow@glowleaf.example.com` | `glow1234` | Bengaluru |
| 13 | `seller-13` | FitPulse Sports | `coach@fitpulse.example.com` | `pulse1234` | Chandigarh |
| 14 | `seller-14` | PageTurner Books | `read@pageturner.example.com` | `page1234` | Lucknow |
| 15 | `seller-15` | LittleSprouts Baby | `care@littlesprouts.example.com` | `sprout1234` | Ahmedabad |
| 16 | `seller-16` | AutoMoto Hub | `garage@automoto.example.com` | `moto1234` | Indore |
| 17 | `seller-17` | PetJoy Supplies | `woof@petjoy.example.com` | `pet1234` | Pune |
| 18 | `seller-18` | MelodyMakers Instruments | `jam@melodymakers.example.com` | `melody1234` | Chennai |
| 19 | `seller-19` | OfficeMate Supplies | `desk@officemate.example.com` | `office1234` | Gurugram |
| 20 | `seller-20` | FestiveNest Gifting | `joy@festivenest.example.com` | `gift1234` | Varanasi |

---

## 🚚 3. Delivery Fleet Partners (Port 5176)

Delivery partners can view assigned orders, update dispatch timelines (Accepted -> Picked Up -> In Transit -> Out for Delivery -> Delivered), and upload documents.

| # | Partner ID | Name | Email | Password | Vehicle | Zone PIN | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `partner-01` | Ravi Kumar | `ravi.delivery@shopsphere.com` | `ravi123` | Bike | `600100` | Active |
| 2 | `partner-02` | Sunita Sharma | `sunita.delivery@shopsphere.com` | `sunita123` | Van | `600096` | Active |
| 3 | `partner-03` | Mohammed Irfan | `irfan.delivery@shopsphere.com` | `irfan123` | Bike | `400001` | On Delivery |
| 4 | `partner-04` | Ganesh Yadav | `ganesh.delivery@shopsphere.com` | `ganesh123` | Bike | `400050` | Active |
| 5 | `partner-05` | Lakhan Singh | `lakhan.delivery@shopsphere.com` | `lakhan123` | Truck | `110001` | Active |
| 6 | `partner-06` | Prakash Jha | `prakash.delivery@shopsphere.com` | `prakash123` | Bike | `600096` | Offline |
| 7 | `partner-07` | Suresh Babu | `suresh.delivery@shopsphere.com` | `suresh123` | Van | `560001` | Active |
| 8 | `partner-08` | Anil Kumble | `anil.delivery@shopsphere.com` | `anil1234` | Bike | `560034` | On Delivery |
| 9 | `partner-09` | Ramesh Iyer | `ramesh.delivery@shopsphere.com` | `ramesh123` | Bike | `500001` | Active |
| 10 | `partner-10` | Vijay Antony | `vijay.delivery@shopsphere.com` | `vijay123` | Van | `500032` | Active |
| 11 | `partner-11` | Santosh Pawar | `santosh.delivery@shopsphere.com` | `santosh123` | Bike | `411001` | Active |
| 12 | `partner-12` | Kiran Rathod | `kiran.delivery@shopsphere.com` | `kiran123` | Bike | `600073` | Active |
| 13 | `partner-13` | Bhavesh Solanki | `bhavesh.delivery@shopsphere.com` | `bhavesh123` | Van | `600042` | Active |
| 14 | `partner-14` | Dinesh Meena | `dinesh.delivery@shopsphere.com` | `dinesh123` | Bike | `302001` | Active |
| 15 | `partner-15` | Sourav Ganguly | `sourav.delivery@shopsphere.com` | `sourav123` | Bike | `700001` | On Delivery |
| 16 | `partner-16` | Alok Verma | `alok.delivery@shopsphere.com` | `alok1234` | Truck | `226001` | Active |
| 17 | `partner-17` | Joseph Thomas | `joseph.delivery@shopsphere.com` | `joseph123` | Bike | `682001` | Active |
| 18 | `partner-18` | Narendra Rawat | `narendra.delivery@shopsphere.com` | `narendra123` | Van | `452001` | Active |
| 19 | `partner-19` | Salim Sheikh | `salim.delivery@shopsphere.com` | `salim123` | Bike | `400058` | Active |
| 20 | `partner-20` | Tara Chand | `tara.delivery@shopsphere.com` | `tara1234` | Bike | `110017` | Active |

---

## 🛡️ 4. Platform Administrators (Port 5173)

Administrators moderate catalog listings, inspect seller & delivery partner registrations, review unsuspension requests, and audit transactions.

| # | Admin ID | Name | Email | Password | Role / Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `admin-1` | Platform Admin | `admin@shopsphere.com` | `admin1234` | Platform Administrator (Super Admin) |
| 2 | `admin-2` | Rajesh Khanna | `rajesh.ops@shopsphere.com` | `rajesh123` | Operations Admin |
| 3 | `admin-3` | Sunita Rao | `sunita.catalog@shopsphere.com` | `sunita123` | Catalog Moderator |
| 4 | `admin-4` | Amit Bhatt | `amit.catalog@shopsphere.com` | `amit1234` | Catalog Moderator |
| 5 | `admin-5` | Kavya Nambiar | `kavya.refunds@shopsphere.com` | `kavya123` | Refund & Dispute Officer |
| 6 | `admin-6` | Manoj Tiwari | `manoj.refunds@shopsphere.com` | `manoj123` | Refund & Dispute Officer |
| 7 | `admin-7` | Pooja Hegde | `pooja.logistics@shopsphere.com` | `pooja123` | Logistics Coordinator |
| 8 | `admin-8` | Sanjay Dutt | `sanjay.logistics@shopsphere.com` | `sanjay123` | Logistics Coordinator |
| 9 | `admin-9` | Ritika Malhotra | `ritika.sellers@shopsphere.com` | `ritika123` | Seller-Verification Officer |
| 10 | `admin-10` | Deepak Chopra | `deepak.sellers@shopsphere.com` | `deepak123` | Seller-Verification Officer |
| 11 | `admin-11` | Neha Kapoor | `neha.support@shopsphere.com` | `neha1234` | Support Lead |
| 12 | `admin-12` | Vivek Oberoi | `vivek.support@shopsphere.com` | `vivek123` | Support Lead |
| 13 | `admin-13` | Shruti Haasan | `shruti.reviews@shopsphere.com` | `shruti123` | Review Moderator |
| 14 | `admin-14` | Gaurav Taneja | `gaurav.fraud@shopsphere.com` | `gaurav123` | Fraud & Risk Analyst |
| 15 | `admin-15` | Asha Bhonsle | `asha.payments@shopsphere.com` | `asha1234` | Payments Officer |
| 16 | `admin-16` | Nikhil Chinapa | `nikhil.growth@shopsphere.com` | `nikhil123` | Growth & Promotions Admin |
| 17 | `admin-17` | Swati Mohan | `swati.data@shopsphere.com` | `swati123` | Data & Analytics Admin |
| 18 | `admin-18` | Imran Qureshi | `imran.delivery@shopsphere.com` | `imran123` | Delivery Network Manager |
| 19 | `admin-19` | Rekha Jain | `rekha.compliance@shopsphere.com` | `rekha123` | Compliance Officer |
| 20 | `admin-20` | Arvind Swamy | `arvind.escalations@shopsphere.com` | `arvind123` | Escalations Manager |

---

## 💳 5. Razorpay Sandbox / Test Payment Credentials

ShopSphere features integrated Razorpay payment gateway checkout alongside Cash on Delivery (COD).

### Sandbox API Key
- **Key ID:** `rzp_test_1DP5mmOlF5G5ag` (pre-configured in frontend checkout)
- **Key Secret:** Configured in `backend/.env` / `backend/utils/razorpay.js`

### Test Cards for Checkout Testing
When placing an order with Razorpay online payment, use the following test details in the modal:

| Field | Test Value |
| :--- | :--- |
| **Card Number** | `4111 1111 1111 1111` (or any valid Visa/Mastercard test card) |
| **Expiry Date** | Any future date (e.g. `12/30`) |
| **CVV** | `123` |
| **OTP** | Any 4 or 6 digit number (e.g. `123456`) in test mode |

---

## 🧪 Testing via cURL / Terminal

When executing direct API calls, the `role` attribute is required during login:

```bash
# Customer Login
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" \
  -d '{"email":"aditi@example.com","password":"aditi123","role":"user"}'

# Seller Login
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" \
  -d '{"email":"seller@shopsphere.com","password":"seller1234","role":"seller"}'

# Admin Login
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" \
  -d '{"email":"admin@shopsphere.com","password":"admin1234","role":"admin"}'

# Delivery Partner Login
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" \
  -d '{"email":"ravi.delivery@shopsphere.com","password":"ravi123","role":"delivery"}'
```
