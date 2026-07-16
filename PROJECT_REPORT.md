# ShopSphere — Project Progress Report

**Project:** ShopSphere — Multi-Vendor E-Commerce Platform
**Module:** User Account Management
**Prepared by:** _______________
**Date:** 15 July 2026
**Status:** User module — all 10 planned account features completed ✅

---

## 1. Project Overview

ShopSphere is a full-stack, multi-vendor e-commerce platform with four separate
frontend applications — **User (customer store)**, **Seller**, **Admin**, and
**Delivery Partner** — backed by a single shared **Node.js + MongoDB** backend.
A unified login page serves all four roles from one place and hands users off
to the correct application after sign-in.

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, React Router 7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose ODM |
| Authentication | JWT (jsonwebtoken), bcrypt password hashing |

### Application Architecture

| Application | Purpose |
|---|---|
| Shared Login | Single sign-in page for all four roles |
| User Store | Product browsing, cart, wishlist, orders, profile |
| Seller Panel | Product, inventory, and order management |
| Admin Panel | User/seller management, order monitoring, delivery assignment, analytics |
| Delivery Console | Assigned orders, pickup/delivery workflow, status timeline |
| Backend API | REST API shared by all frontends |

---

## 2. User Module — Completed Features (10 / 10)

### Phase 1 — Core Account Fields

| # | Feature | Implementation |
|---|---|---|
| 1 | **Unique User ID** | Every account gets a unique, auto-generated ID (`user-1`, `user-2`, …), enforced as unique at the database level. |
| 2 | **Full Name** | Required field, collected at registration and shown across the profile and navbar. |
| 3 | **Email** | Required and unique per account; format-validated on the backend before an account is created. |
| 4 | **Password** | Never stored in plain text — hashed with bcrypt automatically before saving. Minimum length of 8 characters enforced. Passwords are also stripped from every API response. |
| 5 | **Role** | Each account is one of `admin / seller / user / delivery`, enforced by a database-level enum. Login requires the matching role, and the platform routes each role to its own application. |

### Phase 2 — Account Lifecycle Fields

| # | Feature | Implementation |
|---|---|---|
| 6 | **Phone Number** | Collected at registration alongside name and email; stored on the account and editable from the profile. |
| 7 | **Account Created Timestamp** | Set automatically the moment an account is created (`createdAt`), displayed as "member since" information. |
| 8 | **Last Login Timestamp** | Updated on every successful login, giving an audit trail of account activity. |
| 9 | **Account Status** | `active / suspended / deleted` enum with new accounts defaulting to `active`, enabling account moderation without destroying data. |
| 10 | **Email Verified Flag** | Boolean flag stored per account (defaults to unverified), ready for a future email-verification flow. |

---

## 3. Supporting Functionality Delivered

- **Unified login** — one page signs in all four roles and securely hands off
  the session to the right application.
- **User registration** — self-service sign-up for customers with full
  backend validation (name required, valid email, password length, duplicate
  email rejection).
- **Password reset flow** — forgot-password and reset-password endpoints with
  expiring, single-use reset tokens.
- **User account features** — profile, saved addresses, cart, wishlist, and
  order history are persisted per account in MongoDB.

## 4. Security Measures Implemented

- Passwords hashed with **bcrypt** (never stored or returned in plain text).
- **JWT-based authentication** with ownership checks, so a user can only
  access their own data.
- **Input validation** on all auth endpoints (types, email format, password
  length) before touching the database.
- **Timing-attack normalization** on login and forgot-password, so responses
  take the same time whether or not an account exists.
- Sensitive fields (password hash, reset tokens) are stripped from every API
  response at the model level.

## 5. Next Steps

- Admin-driven creation of seller and admin accounts.
- Email-verification flow to activate the `emailVerified` flag.
- Admin UI for suspending/reactivating accounts using the status field.
- Continued build-out of the delivery partner module.

---

*Demo: a screen recording of registration, login, and the profile page
showing the new account fields accompanies this report.*
