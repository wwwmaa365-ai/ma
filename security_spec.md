# Phase 0: Payload-First Security TDD (`security_spec.md`)

## 1. Data Invariants
1. **Strict Tenant Isolation**: A product, order, or chat message inside `/tenants/{tenantId}/...` cannot exist unless `/tenants/{tenantId}` exists, and its `tenantId` field strictly matches the path variable `tenantId`.
2. **Seller Ownership Invariant**: Only the verified `ownerId` of `/tenants/{tenantId}` (or a verified platform admin) can create or modify products in `/tenants/{tenantId}/products/{productId}`. One seller can NEVER read or write another seller's private orders or PII.
3. **PII Split Isolation**: User PII (`email`, `phone`, `address`) is isolated inside `/users/{userId}/private/{docId}` and is strictly inaccessible to any user other than `request.auth.uid == userId` or a verified platform admin.
4. **Terminal Order State Locking**: Once an order in `/tenants/{tenantId}/orders/{orderId}` reaches terminal status `'DELIVERED'` or `'CANCELLED'`, subsequent non-admin state mutations are rejected.
5. **Temporal Integrity & Anti-Update-Gap**: All `createdAt` and `updatedAt` timestamps must match `request.time`. All updates must invoke the full `isValid[Entity](incoming())` blueprint helper and explicitly constrain `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing on Tenant Creation**:
   `{ "tenantId": "tenant_abc", "ownerId": "victim_uid_999", "storeName": "Spoof Store", "customDomain": "spoof.sanjitmusic.in", "primaryColor": "#4C1D95", "accentColor": "#D97706", "planId": "growth", "status": "active", "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }`
2. **Cross-Tenant Product Injection (Tenant A writing to Tenant B)**:
   `{ "productId": "prod_1", "tenantId": "tenant_xyz", "ownerId": "attacker_uid", "name": "Fake Tabla", "category": "MUSICAL INSTRUMENTS", "subcategory": "Tabla", "priceInr": 12000, "stock": 5, "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }`
3. **Shadow Field Injection on Product Update**:
   `{ "productId": "prod_1", "tenantId": "tenant_abc", "ownerId": "owner_1", "name": "Concert Tabla", "category": "MUSICAL INSTRUMENTS", "subcategory": "Tabla", "priceInr": 14000, "stock": 10, "isFeaturedHack": true, "createdAt": "SERVER_TIMESTAMP", "updatedAt": "SERVER_TIMESTAMP" }`
4. **Unverified Email Admin Spoof**:
   Auth context `{ uid: "spoof_admin", token: { email: "www.maa365@gmail.com", email_verified: false } }` attempting to update tenant status.
5. **PII Blanket Read Attack**:
   Authenticated user `user_attacker` attempting `get /users/user_victim/private/info`.
6. **Order Terminal State Reversal**:
   Updating an order with existing `status: "DELIVERED"` back to `status: "CONFIRMED"`.
7. **ID Poisoning Attack (2KB Junk Document ID)**:
   Creating `/tenants/tenant_abc/products/{2048_char_id}` or ID with `$bad/chars!`.
8. **Client Timestamp Forgery**:
   Creating `/tenants/tenant_abc/orders/ord_1` with `createdAt` set to `"2020-01-01T00:00:00Z"` instead of `request.time`.
9. **Immutable Owner Mutation on Update**:
   Updating `/tenants/tenant_abc` by changing `ownerId` from `"uid_1"` to `"uid_2"`.
10. **Negative Price / Stock Value Poisoning**:
    Updating `/tenants/tenant_abc/products/prod_1` with `priceInr: -5000` or `stock: -99`.
11. **Unauthorized Order List Scraping**:
    Authenticated user executing unfiltered `list` on `/tenants/tenant_abc/orders` where `customerId != request.auth.uid` and `sellerOwnerId != request.auth.uid`.
12. **Chat Message Impersonation**:
    Creating `/tenants/tenant_abc/messages/msg_1` where `senderId` is set to another user's UID.
13. **FCM Token Hijacking (Cross-User Token Injection)**:
    Authenticated user `attacker_uid` attempting to write or read `/users/victim_uid/fcmTokens/tok_1` or supplying an unbounded `channels` array (`size() > 5`).
14. **Notification Read-State Tampering & Cross-Tenant Alert Spoofing**:
    Authenticated seller attempting to inject a shadow field (`isSystemOverride: true`) or revert an already-read notification (`read: true` -> `read: false`) in `/tenants/tenant_abc/notifications/notif_1`.
15. **Seller Review Rating / Comment Tampering**:
    Authenticated seller attempting to modify a customer's original `rating` (e.g., from `3` to `5`) or `comment` while submitting `sellerReply` on `/tenants/tenant_abc/reviews/rev_1`.
16. **Cross-Tenant Review Reply Hijacking & Oversized Payload**:
    Authenticated non-owner seller attempting to reply to `/tenants/tenant_abc/reviews/rev_1` or submitting a 2KB `sellerReply` (> 1000 chars) or out-of-range rating (`rating: 9`).


