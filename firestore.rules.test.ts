/**
 * Phase 0 Test Runner for Sanjit Musical Store Hardened Firestore Security Rules
 * Verifies all Dirty Dozen adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const dirtyDozenSecuritySuite: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Tenant Creation',
    operation: 'create',
    path: '/tenants/tenant_abc',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      tenantId: 'tenant_abc',
      ownerId: 'victim_uid_999',
      storeName: 'Spoof Store',
      customDomain: 'spoof.sanjitmusic.in',
      primaryColor: '#4C1D95',
      accentColor: '#D97706',
      planId: 'growth',
      status: 'pending',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-Tenant Product Injection',
    operation: 'create',
    path: '/tenants/tenant_xyz/products/prod_1',
    auth: { uid: 'seller_abc_uid', email: 'seller_abc@example.com', email_verified: true },
    payload: {
      productId: 'prod_1',
      tenantId: 'tenant_xyz',
      ownerId: 'seller_abc_uid',
      name: 'Unauthorized Tabla',
      category: 'MUSICAL INSTRUMENTS',
      subcategory: 'Tabla',
      priceInr: 12000,
      stock: 5,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Product Update',
    operation: 'update',
    path: '/tenants/tenant_abc/products/prod_1',
    auth: { uid: 'seller_abc_uid', email: 'seller_abc@example.com', email_verified: true },
    payload: {
      isFeaturedHack: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unverified Email Admin Spoof',
    operation: 'update',
    path: '/tenants/tenant_abc',
    auth: { uid: 'spoof_admin', email: 'www.maa365@gmail.com', email_verified: false },
    payload: {
      status: 'active',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'PII Blanket Read Attack',
    operation: 'get',
    path: '/users/user_victim/private/info',
    auth: { uid: 'user_attacker', email: 'attacker@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Order Terminal State Reversal',
    operation: 'update',
    path: '/tenants/tenant_abc/orders/ord_delivered',
    auth: { uid: 'seller_abc_uid', email: 'seller_abc@example.com', email_verified: true },
    payload: {
      status: 'CONFIRMED',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: '/tenants/tenant_abc/products/invalid$id!with*chars',
    auth: { uid: 'seller_abc_uid', email: 'seller_abc@example.com', email_verified: true },
    payload: {
      productId: 'invalid$id!with*chars',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/tenants/tenant_abc/orders/ord_1',
    auth: { uid: 'customer_1', email: 'customer@example.com', email_verified: true },
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable Owner Mutation on Update',
    operation: 'update',
    path: '/tenants/tenant_abc',
    auth: { uid: 'seller_abc_uid', email: 'seller_abc@example.com', email_verified: true },
    payload: {
      ownerId: 'new_owner_uid',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Negative Price or Stock Value Poisoning',
    operation: 'update',
    path: '/tenants/tenant_abc/products/prod_1',
    auth: { uid: 'seller_abc_uid', email: 'seller_abc@example.com', email_verified: true },
    payload: {
      priceInr: -5000,
      stock: -10,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unauthorized Order List Scraping',
    operation: 'list',
    path: '/tenants/tenant_abc/orders',
    auth: { uid: 'unrelated_user', email: 'stranger@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Chat Message Impersonation',
    operation: 'create',
    path: '/tenants/tenant_abc/messages/msg_1',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      messageId: 'msg_1',
      tenantId: 'tenant_abc',
      senderId: 'victim_uid',
      recipientId: 'seller_abc_uid',
      body: 'Impersonated message',
      flagged: false,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
