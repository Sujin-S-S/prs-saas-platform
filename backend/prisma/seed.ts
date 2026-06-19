import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with SK47 Mens Wear tenant data...');

  // 1. Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const customerPasswordHash = await bcrypt.hash('Admin@1234', saltRounds);

  // 2. Create Super Admin (Global system user)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@prs.com',
      passwordHash: adminPasswordHash,
      role: 'SuperAdmin',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true
    }
  });
  console.log('Created SuperAdmin User:', superAdmin.email);

  // ==========================================
  // TENANT 1: SK47 Mens Wear (Primary Client)
  // ==========================================
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'SK47 Mens Wear',
      subdomain: 'sk47',
      isActive: true
    }
  });
  console.log('Created Tenant A:', tenantA.name);

  // Tenant A Admin
  const adminA = await prisma.user.create({
    data: {
      tenantId: tenantA.id,
      email: 'admin@sk47.com',
      passwordHash: adminPasswordHash,
      role: 'TenantAdmin',
      firstName: 'Shaun',
      lastName: 'Kemp',
      isActive: true
    }
  });

  // Tenant A Categories
  const catA_1 = await prisma.category.create({
    data: {
      tenantId: tenantA.id,
      name: 'Shirts',
      slug: 'shirts',
      description: 'Formal and casual shirts for men'
    }
  });

  const catA_2 = await prisma.category.create({
    data: {
      tenantId: tenantA.id,
      name: 'Jeans & Trousers',
      slug: 'jeans-trousers',
      description: 'Premium denim and tailored trousers'
    }
  });

  const catA_3 = await prisma.category.create({
    data: {
      tenantId: tenantA.id,
      name: 'Jackets & Blazers',
      slug: 'jackets-blazers',
      description: 'Outerwear, winter jackets and wool blazers'
    }
  });

  const catA_4 = await prisma.category.create({
    data: {
      tenantId: tenantA.id,
      name: 'Shoes & Accessories',
      slug: 'shoes-accessories',
      description: 'Premium leather boots, loafers, and designer belts'
    }
  });

  const catA_5 = await prisma.category.create({
    data: {
      tenantId: tenantA.id,
      name: 'Suits & Formalwear',
      slug: 'suits-formalwear',
      description: 'Luxury double-breasted suits and tuxedo ensembles'
    }
  });

  // Tenant A Products & Variants
  // Product 1: Slim Fit Cotton Shirt
  const prodA_1 = await prisma.product.create({
    data: {
      tenantId: tenantA.id,
      categoryId: catA_1.id,
      name: 'Classic Slim-Fit Oxford Shirt',
      sku: 'SK47-OXF-001',
      description: 'Premium pure cotton Oxford shirt, tailored for a clean slim profile.',
      basePrice: 49.99,
      stockQuantity: 60,
      lowStockThreshold: 10
    }
  });

  await prisma.productImage.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_1.id,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80',
      isPrimary: true
    }
  });

  const variantA_1_white = await prisma.productVariant.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_1.id,
      name: 'Color: White / Size: M',
      sku: 'SK47-OXF-001-WHT-M',
      priceDifference: 0.00,
      stockQuantity: 30
    }
  });

  await prisma.productVariant.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_1.id,
      name: 'Color: Light Blue / Size: L',
      sku: 'SK47-OXF-001-BLU-L',
      priceDifference: 5.00,
      stockQuantity: 30
    }
  });

  // Product 2: Premium Denim
  const prodA_2 = await prisma.product.create({
    data: {
      tenantId: tenantA.id,
      categoryId: catA_2.id,
      name: 'Premium Stretch Denim Jeans',
      sku: 'SK47-DNM-002',
      description: 'Classic dark-wash indigo jeans with flexible comfort stretch fibers.',
      basePrice: 79.99,
      stockQuantity: 45,
      lowStockThreshold: 8
    }
  });

  await prisma.productImage.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_2.id,
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80',
      isPrimary: true
    }
  });

  await prisma.productVariant.createMany({
    data: [
      {
        tenantId: tenantA.id,
        productId: prodA_2.id,
        name: 'Waist: 32 / Length: 32',
        sku: 'SK47-DNM-002-32-32',
        priceDifference: 0.00,
        stockQuantity: 25
      },
      {
        tenantId: tenantA.id,
        productId: prodA_2.id,
        name: 'Waist: 34 / Length: 32',
        sku: 'SK47-DNM-002-34-32',
        priceDifference: 0.00,
        stockQuantity: 20
      }
    ]
  });

  // Product 3: Blazer
  const prodA_3 = await prisma.product.create({
    data: {
      tenantId: tenantA.id,
      categoryId: catA_3.id,
      name: 'Modern Fit Wool Blazer',
      sku: 'SK47-BLZ-003',
      description: 'Sophisticated wool-blend blazer jacket in charcoal gray, perfect for smart-casual settings.',
      basePrice: 149.99,
      stockQuantity: 15,
      lowStockThreshold: 3
    }
  });

  await prisma.productImage.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_3.id,
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80',
      isPrimary: true
    }
  });

  await prisma.productVariant.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_3.id,
      name: 'Charcoal / Size: 40R',
      sku: 'SK47-BLZ-003-CH-40R',
      priceDifference: 0.00,
      stockQuantity: 15
    }
  });

  // Product 4: Leather Oxford Shoes
  const prodA_4 = await prisma.product.create({
    data: {
      tenantId: tenantA.id,
      categoryId: catA_4.id,
      name: 'Bespoke Leather Oxford Shoes',
      sku: 'SK47-SHO-004',
      description: 'Handcrafted Italian calfskin leather Oxford shoes in rich tan, featuring a polished finish.',
      basePrice: 189.99,
      stockQuantity: 20,
      lowStockThreshold: 4
    }
  });

  await prisma.productImage.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_4.id,
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=500&q=80',
      isPrimary: true
    }
  });

  await prisma.productVariant.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_4.id,
      name: 'Color: Tan / Size: 10',
      sku: 'SK47-SHO-004-TAN-10',
      priceDifference: 0.00,
      stockQuantity: 20
    }
  });

  // Product 5: Slim Fit Navy Suit
  const prodA_5 = await prisma.product.create({
    data: {
      tenantId: tenantA.id,
      categoryId: catA_5.id,
      name: 'Signature Navy Wool Suit',
      sku: 'SK47-SUI-005',
      description: 'Super 120s pure wool slim-fit navy suit, designed for high-profile weddings and business elegance.',
      basePrice: 299.99,
      stockQuantity: 10,
      lowStockThreshold: 2
    }
  });

  await prisma.productImage.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_5.id,
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80',
      isPrimary: true
    }
  });

  await prisma.productVariant.create({
    data: {
      tenantId: tenantA.id,
      productId: prodA_5.id,
      name: 'Navy / Size: 40R',
      sku: 'SK47-SUI-005-NY-40R',
      priceDifference: 0.00,
      stockQuantity: 10
    }
  });

  // Seed 50 extra items programmatically to test sliders
  for (let i = 1; i <= 50; i++) {
    let categoryId = catA_1.id;
    if (i % 5 === 0) categoryId = catA_5.id;
    else if (i % 5 === 1) categoryId = catA_1.id;
    else if (i % 5 === 2) categoryId = catA_2.id;
    else if (i % 5 === 3) categoryId = catA_3.id;
    else if (i % 5 === 4) categoryId = catA_4.id;

    const prod = await prisma.product.create({
      data: {
        tenantId: tenantA.id,
        categoryId,
        name: `Premium Men's Wear Item #${i}`,
        sku: `SK47-ITEM-${String(i).padStart(3, '0')}`,
        description: `Bespoke handcrafted collection item #${i}. High-grade fabric with tailored seams and modern profile.`,
        basePrice: 39.99 + (i * 3.5),
        stockQuantity: 20 + i,
        lowStockThreshold: 5
      }
    });

    // Seed Image
    await prisma.productImage.create({
      data: {
        tenantId: tenantA.id,
        productId: prod.id,
        imageUrl: i % 2 === 0 
          ? 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80'
          : 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80',
        isPrimary: true
      }
    });

    // Seed Variant
    await prisma.productVariant.create({
      data: {
        tenantId: tenantA.id,
        productId: prod.id,
        name: `Standard Option #${i}`,
        sku: `SK47-ITEM-${String(i).padStart(3, '0')}-VAR`,
        priceDifference: 0.00,
        stockQuantity: 20 + i
      }
    });
  }


  // Tenant A Customer
  const customerA = await prisma.customer.create({
    data: {
      tenantId: tenantA.id,
      firstName: 'Sujin',
      lastName: 'S',
      email: 'sujinss2702@gmail.com',
      passwordHash: customerPasswordHash,
      phone: '415-888-9999'
    }
  });

  const addressA = await prisma.address.create({
    data: {
      tenantId: tenantA.id,
      customerId: customerA.id,
      type: 'Shipping',
      addressLine1: '789 Fashion Avenue',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10018'
    }
  });

  // Tenant A Order & Payment
  const orderA = await prisma.order.create({
    data: {
      tenantId: tenantA.id,
      customerId: customerA.id,
      orderNumber: 'SK47-ORD-1001',
      totalAmount: 49.99,
      status: 'Delivered',
      shippingAddressId: addressA.id,
      billingAddressId: addressA.id
    }
  });

  await prisma.orderItem.create({
    data: {
      tenantId: tenantA.id,
      orderId: orderA.id,
      productVariantId: variantA_1_white.id,
      quantity: 1,
      unitPrice: 49.99
    }
  });

  await prisma.payment.create({
    data: {
      tenantId: tenantA.id,
      orderId: orderA.id,
      amount: 49.99,
      paymentMethod: 'Stripe',
      transactionId: 'ch_sk47_09876',
      status: 'Completed'
    }
  });

  // Tenant A Coupon
  await prisma.coupon.create({
    data: {
      tenantId: tenantA.id,
      code: 'SK47FIRST',
      discountType: 'Percentage',
      discountValue: 15.00,
      expiryDate: new Date('2030-12-31'),
      minOrderAmount: 40.00,
      isActive: true
    }
  });


  // ==========================================
  // TENANT 2: Urban Male Co (Comparator store)
  // ==========================================
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Urban Male Co',
      subdomain: 'urban-male',
      isActive: true
    }
  });
  console.log('Created Tenant B:', tenantB.name);

  // Tenant B Admin
  await prisma.user.create({
    data: {
      tenantId: tenantB.id,
      email: 'admin@urbanmale.com',
      passwordHash: adminPasswordHash,
      role: 'TenantAdmin',
      firstName: 'Ryan',
      lastName: 'Gosling',
      isActive: true
    }
  });

  // Tenant B Category
  const catB_1 = await prisma.category.create({
    data: {
      tenantId: tenantB.id,
      name: 'T-Shirts',
      slug: 't-shirts',
      description: 'Graphic tees, basics and streetwear shirts'
    }
  });

  // Tenant B Product
  const prodB_1 = await prisma.product.create({
    data: {
      tenantId: tenantB.id,
      categoryId: catB_1.id,
      name: 'Vintage Heavyweight Tee',
      sku: 'UM-TEE-001',
      description: 'Vintage-washed boxy fit heavy cotton t-shirt.',
      basePrice: 29.99,
      stockQuantity: 100,
      lowStockThreshold: 10
    }
  });

  await prisma.productImage.create({
    data: {
      tenantId: tenantB.id,
      productId: prodB_1.id,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80',
      isPrimary: true
    }
  });

  const variantB_1 = await prisma.productVariant.create({
    data: {
      tenantId: tenantB.id,
      productId: prodB_1.id,
      name: 'Oversized Charcoal / L',
      sku: 'UM-TEE-001-CH-L',
      priceDifference: 0.00,
      stockQuantity: 50
    }
  });

  // Tenant B Customer
  const customerB = await prisma.customer.create({
    data: {
      tenantId: tenantB.id,
      firstName: 'Chris',
      lastName: 'Evans',
      email: 'chris@evans.com',
      passwordHash: customerPasswordHash,
      phone: '310-555-4321'
    }
  });

  const addressB = await prisma.address.create({
    data: {
      tenantId: tenantB.id,
      customerId: customerB.id,
      type: 'Shipping',
      addressLine1: '100 Hollywood Blvd',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      zipCode: '90028'
    }
  });

  // Tenant B Order
  const orderB = await prisma.order.create({
    data: {
      tenantId: tenantB.id,
      customerId: customerB.id,
      orderNumber: 'UM-ORD-2001',
      totalAmount: 29.99,
      status: 'Pending',
      shippingAddressId: addressB.id,
      billingAddressId: addressB.id
    }
  });

  await prisma.orderItem.create({
    data: {
      tenantId: tenantB.id,
      orderId: orderB.id,
      productVariantId: variantB_1.id,
      quantity: 1,
      unitPrice: 29.99
    }
  });

  console.log('Menswear seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
