import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import prisma from '../src/db/prisma';

const app = createApp();

describe('KrishiConnect API End-to-End Suite', () => {
  let adminToken: string;
  let farmerToken: string;
  let farmerRefreshToken: string;
  let vendorToken: string;
  let createdProductId: string;
  let uploadedProductId: string;
  let createdBrandId: string;
  let farmerAddressId: string;
  let testOrderId: string;

  afterAll(async () => {
    try {
      if (testOrderId) {
        await prisma.commissionRecord.deleteMany({ where: { orderId: testOrderId } });
        await prisma.financialLedgerEntry.deleteMany({ where: { entityId: testOrderId } });
        const vendorOrders = await prisma.vendorOrder.findMany({
          where: { orderId: testOrderId },
          select: { id: true },
        });
        const vendorOrderIds = vendorOrders.map((v) => v.id);
        if (vendorOrderIds.length > 0) {
          await prisma.shipment.deleteMany({ where: { vendorOrderId: { in: vendorOrderIds } } });
          await prisma.orderItem.deleteMany({ where: { vendorOrderId: { in: vendorOrderIds } } });
          await prisma.vendorOrder.deleteMany({ where: { id: { in: vendorOrderIds } } });
        }
        const payments = await prisma.payment.findMany({
          where: { orderId: testOrderId },
          select: { id: true },
        });
        if (payments.length > 0) {
          await prisma.paymentAttempt.deleteMany({ where: { paymentId: { in: payments.map((p) => p.id) } } });
          await prisma.payment.deleteMany({ where: { id: { in: payments.map((p) => p.id) } } });
        }
        await prisma.order.deleteMany({ where: { id: testOrderId } });
      }
      const cleanupProductIds = [createdProductId, uploadedProductId].filter(Boolean);
      for (const pid of cleanupProductIds) {
        await prisma.wishlistItem.deleteMany({ where: { productId: pid } });
        await prisma.cartItem.deleteMany({ where: { productId: pid } });
        await prisma.inventoryReservation.deleteMany({
          where: { variant: { productId: pid } },
        });
        await prisma.inventory.deleteMany({
          where: { variant: { productId: pid } },
        });
        await prisma.productApprovalHistory.deleteMany({ where: { productId: pid } });
        await prisma.productVariant.deleteMany({ where: { productId: pid } });
        await prisma.productImage.deleteMany({ where: { productId: pid } });
        await prisma.product.deleteMany({ where: { id: pid } });
      }
      if (createdBrandId) {
        await prisma.brand.deleteMany({ where: { id: createdBrandId } });
      }
    } catch {
      // Best-effort cleanup
    }
  });

  it('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/v1/auth/login should log in platform admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@krishiconnect.in',
        password: 'AdminKrishi#2026',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login should log in farmer', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'farmer@krishiconnect.in',
        password: 'Farmer#12345',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    farmerToken = res.body.data.token;
    farmerRefreshToken = res.body.data.refreshToken;
  });

  it('POST /api/v1/auth/refresh-token should issue a working access token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: farmerRefreshToken });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${res.body.data.accessToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('farmer@krishiconnect.in');
  });

  it('POST /api/v1/auth/login should log in approved vendor', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'vendor1@krishiconnect.in',
        password: 'Vendor#12345',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    vendorToken = res.body.data.token;
  });

  it('GET /api/v1/catalog/categories should list agricultural categories', async () => {
    const res = await request(app).get('/api/v1/catalog/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/catalog/products should return approved products only', async () => {
    const res = await request(app).get('/api/v1/catalog/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Pending review product must not appear
    const pending = res.body.data.find((p: any) => p.status === 'PENDING_REVIEW');
    expect(pending).toBeUndefined();
  });

  it('Farmer should be forbidden from accessing admin endpoints (RBAC check)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(res.status).toBe(403);
  });

  it('Farmer must be forbidden from selling or accessing vendor endpoints (RBAC check)', async () => {
    const res = await request(app)
      .post('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({});
    expect(res.status).toBe(403);

    const profileRes = await request(app)
      .get('/api/v1/vendor/profile')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(profileRes.status).toBe(403);
  });

  it('Unverified / Pending Shop Owner must be forbidden from publishing products until verified', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'vendor3@krishiconnect.in',
        password: 'Vendor#12345',
      });
    expect(loginRes.status).toBe(200);
    const pendingVendorToken = loginRes.body.data.token;

    const catRes = await request(app).get('/api/v1/catalog/categories');
    const categoryId = catRes.body.data[0].id;

    const createRes = await request(app)
      .post('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${pendingVendorToken}`)
      .send({
        title: 'Blocked Unverified Product',
        description: 'Should be blocked until admin approves shop owner.',
        categoryId,
        images: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80'],
        variants: [{ title: '1 Kg', sku: 'UNVERIFIED-1', price: 100, mrp: 120, stock: 5 }],
      });
    expect(createRes.status).toBe(403);
  });

  it('Admin should be able to access metrics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalFarmers).toBeDefined();
    expect(res.body.data.pendingVendors).toBeDefined();
  });

  it('Vendor submits a new product for admin review', async () => {
    // Get category id
    const catRes = await request(app).get('/api/v1/catalog/categories');
    const categoryId = catRes.body.data[0].id;
    const uniqueSuffix = Date.now().toString().slice(-6);

    const res = await request(app)
      .post('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        title: `Organic Trichoderma Bio-Fungicide ${uniqueSuffix}`,
        titleHi: 'ट्राइकोडर्मा विरिडे जैव कवकनाशी',
        description: 'Eco-friendly biocontrol agent that effectively controls root rot, collar rot, and wilt diseases across pulse and oilseed crops.',
        categoryId,
        images: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80'],
        suitableCrops: ['Gram', 'Soybean', 'Groundnut', 'Tomato'],
        dosageInstructions: 'Seed treatment: 5-10g per kg seed. Soil application: 1-2 kg per acre with farmyard manure.',
        batchNumber: `TRI-2026-${uniqueSuffix}`,
        organicCertified: true,
        variants: [
          {
            title: '1 Kg Pack',
            sku: `TRI-SKU-${uniqueSuffix}`,
            price: 650,
            mrp: 799,
            stock: 80,
            weightKg: 1,
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING_REVIEW');
    createdProductId = res.body.data.id;
  });

  it('Newly submitted product must NOT appear in public catalog before admin approval', async () => {
    const res = await request(app).get('/api/v1/catalog/products');
    const found = res.body.data.find((p: any) => p.id === createdProductId);
    expect(found).toBeUndefined();
  });

  it('Admin reviews and APPROVES the product', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/products/${createdProductId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED',
        remarks: 'Compliance verified with organic certification norms.',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('Approved product now appears in public catalog', async () => {
    const res = await request(app).get('/api/v1/catalog/products');
    const found = res.body.data.find((p: any) => p.id === createdProductId);
    expect(found).toBeDefined();
  });

  it('Farmer adds items to cart', async () => {
    // Get product variant
    const prodRes = await request(app).get('/api/v1/catalog/products');
    const product = prodRes.body.data[0];
    const variant = product.variants[0];

    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        productId: product.id,
        variantId: variant.id,
        quantity: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('Farmer checks out and creates Order', async () => {
    // Get farmer address
    const addrRes = await request(app)
      .get('/api/v1/users/addresses')
      .set('Authorization', `Bearer ${farmerToken}`);
    farmerAddressId = addrRes.body.data[0].id;

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        addressId: farmerAddressId,
        paymentMethod: 'UPI',
        couponCode: 'KISAN50',
        customerNotes: 'Please deliver to the farm gate near canal road.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toBeDefined();
    expect(Number(res.body.data.netAmount)).toBeGreaterThan(0);
    testOrderId = res.body.data.id;
  });

  it('Payment simulation verifies and confirms Order', async () => {
    const initRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ orderId: testOrderId });

    expect(initRes.status).toBe(200);
    const { razorpayOrderId } = initRes.body.data;

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        orderId: testOrderId,
        razorpayOrderId,
        razorpayPaymentId: `pay_sandbox_test_${Date.now()}`,
        razorpaySignature: 'sandbox_sig_verified_123',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    // Verify order is now CONFIRMED
    const orderRes = await request(app)
      .get(`/api/v1/orders/${testOrderId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(orderRes.body.data.status).toBe('CONFIRMED');
    expect(orderRes.body.data.paymentStatus).toBe('COMPLETED');
  });

  it('Admin audit logs record the actions', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Authenticated user can fetch and update profile details in PostgreSQL', async () => {
    const getRes = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.role).toBe('FARMER');
    expect(getRes.body.data._count).toBeDefined();

    const originalName = getRes.body.data.fullName;
    const patchRes = await request(app)
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        fullName: 'Ramesh Kumar Patel Updated',
        farmerProfile: { farmSize: 9.0, district: 'Anand' },
      });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.fullName).toBe('Ramesh Kumar Patel Updated');
    expect(Number(patchRes.body.data.farmerProfile.farmSize)).toBe(9);

    // Restore original full name cleanly
    await request(app)
      .patch('/api/v1/users/profile')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ fullName: originalName });
  });

  it('Farmer can add, list from DB, and remove products in Wishlist', async () => {
    const catRes = await request(app).get('/api/v1/catalog/products?limit=2');
    const productId = catRes.body.data[0].id;

    const addRes = await request(app)
      .post(`/api/v1/users/wishlist/${productId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(addRes.status).toBe(201);
    expect(addRes.body.data.productId).toBe(productId);
    expect(addRes.body.data.product.vendor).toBeDefined();

    const listRes = await request(app)
      .get('/api/v1/users/wishlist')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.some((w: any) => w.productId === productId)).toBe(true);

    const delRes = await request(app)
      .delete(`/api/v1/users/wishlist/${productId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(delRes.status).toBe(200);

    const afterDelRes = await request(app)
      .get('/api/v1/users/wishlist')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(afterDelRes.body.data.some((w: any) => w.productId === productId)).toBe(false);
  });

  it('Shop Owner (VENDOR) can sell but is forbidden from buying, using cart, checkout, or wishlist', async () => {
    const catRes = await request(app).get('/api/v1/catalog/products?limit=1');
    const product = catRes.body.data[0];
    const variantId = product.variants[0].id;

    const getCartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(getCartRes.status).toBe(403);

    const addCartRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ productId: product.id, variantId, quantity: 1 });
    expect(addCartRes.status).toBe(403);

    const createOrderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ addressId: farmerAddressId, paymentMethod: 'UPI' });
    expect(createOrderRes.status).toBe(403);

    const custOrdersRes = await request(app)
      .get('/api/v1/orders/customer')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(custOrdersRes.status).toBe(403);

    const payRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ orderId: testOrderId });
    expect(payRes.status).toBe(403);

    const wishRes = await request(app)
      .post(`/api/v1/users/wishlist/${product.id}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(wishRes.status).toBe(403);

    // Confirm seller routes remain accessible to approved shop owner
    const vendorOrdersRes = await request(app)
      .get('/api/v1/orders/vendor')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(vendorOrdersRes.status).toBe(200);
  });

  it('Vendor creates product with uploaded /uploads image, brandName & stock, then Farmer Cart receives complete cart details', async () => {
    const catsRes = await request(app).get('/api/v1/catalog/categories');
    expect(catsRes.status).toBe(200);
    expect(Array.isArray(catsRes.body.data)).toBe(true);
    expect(catsRes.body.data.length).toBeGreaterThan(0);
    const chosenCat = catsRes.body.data[0];

    const skuCode = `KC-UPLOAD-${Date.now()}`;
    const createRes = await request(app)
      .post('/api/v1/vendor/products')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        title: 'E2E Bio-Potash Granules',
        titleHi: 'ई2ई बायो-पोटाश दानेदार',
        description: 'High-solubility agricultural bio-potash for vegetative growth and yield boost.',
        categoryId: chosenCat.id,
        brandName: `E2E Test Brand ${Date.now()}`,
        images: ['/uploads/test-agri-image.png'],
        suitableCrops: ['Wheat', 'Paddy'],
        activeIngredients: 'Organic Potash 14.5%',
        dosageInstructions: '2 kg per acre basal application',
        organicCertified: true,
        variants: [
          {
            title: '1 Kg Pack',
            sku: skuCode,
            mrp: 699,
            price: 549,
            stock: 40,
            weightKg: 1,
          },
        ],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    uploadedProductId = createRes.body.data.id;
    createdBrandId = createRes.body.data.brandId;
    const createdVariant = createRes.body.data.variants[0];
    expect(createRes.body.data.images[0].url).toBe('/uploads/test-agri-image.png');
    expect(createdVariant.title).toBe('1 Kg Pack');
    expect(createdVariant.inventory?.stockQuantity).toBe(40);
    expect(createRes.body.data.brandId).toBeDefined();

    // Update stock via vendor inventory endpoint
    const stockUpdateRes = await request(app)
      .patch(`/api/v1/vendor/inventory/${createdVariant.id}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ stockQuantity: 35 });
    expect(stockUpdateRes.status).toBe(200);
    expect(stockUpdateRes.body.data.stockQuantity).toBe(35);

    // Admin approves product so farmer can add it to Cart
    const approveRes = await request(app)
      .patch(`/api/v1/admin/products/${uploadedProductId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED', remarks: 'Verified agricultural input for cart test' });
    expect(approveRes.status).toBe(200);

    // Farmer adds item to cart and inspects complete Cart item shape
    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ productId: uploadedProductId, variantId: createdVariant.id, quantity: 2 });
    expect(addRes.status).toBe(200);

    const cartRes = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(cartRes.status).toBe(200);
    const matchingItem = cartRes.body.data.items.find(
      (item: any) => item.productId === uploadedProductId
    );
    expect(matchingItem).toBeDefined();
    expect(matchingItem.quantity).toBe(2);
    expect(matchingItem.product.title).toBe('E2E Bio-Potash Granules');
    expect(matchingItem.product.category.name).toBe(chosenCat.name);
    expect(matchingItem.product.images[0].url).toBe('/uploads/test-agri-image.png');
    expect(matchingItem.product.vendor.businessName).toBeDefined();
    expect(matchingItem.variant.title).toBe('1 Kg Pack');
    expect(Number(matchingItem.variant.price)).toBe(549);
    expect(Number(matchingItem.variant.mrp)).toBe(699);
  });
});
