import { PrismaClient, UserRole, VendorStatus, VerificationStatus, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
  console.log('🌱 Starting KrishiConnect database seeding...');

  // 1. Clear existing records in proper reverse-relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.vendorQuotation.deleteMany();
  await prisma.quotationRequest.deleteMany();
  await prisma.financialLedgerEntry.deleteMany();
  await prisma.commissionRecord.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.vendorOrder.deleteMany();
  await prisma.paymentAttempt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryReservation.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productApprovalHistory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.soilTestReport.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.vendorVerificationDocument.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('AdminKrishi#2026', 10);
  const farmerPasswordHash = await bcrypt.hash('Farmer#12345', 10);
  const vendorPasswordHash = await bcrypt.hash('Vendor#12345', 10);

  // 2. Create Platform Admin
  const admin = await prisma.user.create({
    data: {
      fullName: 'Krishi Administrator',
      email: 'admin@krishiconnect.in',
      phone: '9876543210',
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
      preferredLanguage: 'en',
    }
  });
  console.log('✅ Admin user created: admin@krishiconnect.in');

  // 3. Create Brands
  const brands = await Promise.all([
    prisma.brand.create({
      data: { name: 'IFFCO', slug: 'iffco', description: 'Indian Farmers Fertiliser Cooperative Limited' }
    }),
    prisma.brand.create({
      data: { name: 'Bayer CropScience', slug: 'bayer-cropscience', description: 'Innovative seeds and crop protection solutions' }
    }),
    prisma.brand.create({
      data: { name: 'Mahyco', slug: 'mahyco', description: 'Maharashtra Hybrid Seeds Company' }
    }),
    prisma.brand.create({
      data: { name: 'Jain Irrigation', slug: 'jain-irrigation', description: 'More Crop Per Drop drip and sprinkler systems' }
    }),
    prisma.brand.create({
      data: { name: 'GreenBio Nutrients', slug: 'greenbio-nutrients', description: 'Certified organic biological farm inputs' }
    }),
  ]);

  // 4. Create Categories
  const catSeeds = await prisma.category.create({
    data: {
      name: 'Seeds & Seedlings',
      nameHi: 'बीज और पौध',
      slug: 'seeds-and-seedlings',
      description: 'Certified hybrid, heirloom, and high-yielding vegetable, cereal, and pulse seeds.',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500&auto=format&fit=crop&q=80',
    }
  });

  const catFertilizers = await prisma.category.create({
    data: {
      name: 'Fertilizers & Nutrients',
      nameHi: 'उर्वरक और मिट्टी पोषण',
      slug: 'fertilizers-and-nutrients',
      description: 'NPK, micronutrients, water-soluble fertilizers, and bio-stimulants.',
      imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80',
    }
  });

  const catCropProtection = await prisma.category.create({
    data: {
      name: 'Crop Protection & Bio-Pesticides',
      nameHi: 'फसल सुरक्षा एवं जैव कीटनाशक',
      slug: 'crop-protection',
      description: 'Insecticides, fungicides, biological pest controls, and organic neem formulations.',
      imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=500&auto=format&fit=crop&q=80',
    }
  });

  const catIrrigation = await prisma.category.create({
    data: {
      name: 'Irrigation & Farm Tools',
      nameHi: 'सिंचाई उपकरण और कृषि औजार',
      slug: 'irrigation-and-tools',
      description: 'Drip lines, sprinkler nozzles, automated timers, sprayers, and farm equipment.',
      imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=500&auto=format&fit=crop&q=80',
    }
  });

  const catOrganic = await prisma.category.create({
    data: {
      name: 'Organic & Bio-Inputs',
      nameHi: 'जैविक खेती उत्पाद',
      slug: 'organic-bio-inputs',
      description: 'Vermi-compost, bio-fertilizers, growth promoters, and soil conditioners.',
      imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
    }
  });

  // 5. Create Approved Vendors
  // Vendor 1: Bharat Krishi Seva Kendra (Ludhiana)
  const vendorUser1 = await prisma.user.create({
    data: {
      fullName: 'Gurpreet Singh',
      email: 'vendor1@krishiconnect.in',
      phone: '9814012345',
      passwordHash: vendorPasswordHash,
      role: UserRole.VENDOR,
      isVerified: true,
      preferredLanguage: 'hi',
      vendorProfile: {
        create: {
          businessName: 'Bharat Krishi Seva Kendra',
          storeSlug: 'bharat-krishi-seva',
          description: 'Authorized distributor of premium certified seeds, bio-fertilizers, and farm tools across North India since 2012.',
          businessAddress: 'GT Road, Mandi Market',
          city: 'Ludhiana',
          state: 'Punjab',
          pincode: '141001',
          gstin: '03AAAAA1234A1Z5',
          licenseNumber: 'PUN-SEED-2021-9981',
          status: VendorStatus.APPROVED,
          commissionRate: 5.0,
          rating: 4.8,
          totalSales: 342,
          documents: {
            create: [
              {
                documentType: 'GST_CERTIFICATE',
                documentUrl: '/uploads/bharat_krishi_gst.pdf',
                fileName: 'gst_certificate.pdf',
                isVerified: true,
              },
              {
                documentType: 'SEED_LICENSE',
                documentUrl: '/uploads/punjab_seed_license.pdf',
                fileName: 'punjab_seed_license.pdf',
                isVerified: true,
              }
            ]
          }
        }
      }
    },
    include: { vendorProfile: true }
  });

  // Vendor 2: Harit Organic Bio-Tech (Nashik)
  const vendorUser2 = await prisma.user.create({
    data: {
      fullName: 'Sunita Patil',
      email: 'vendor2@krishiconnect.in',
      phone: '9822054321',
      passwordHash: vendorPasswordHash,
      role: UserRole.VENDOR,
      isVerified: true,
      preferredLanguage: 'en',
      vendorProfile: {
        create: {
          businessName: 'Harit Organic Bio-Tech',
          storeSlug: 'harit-organic-bio',
          description: 'Specialists in certified organic liquid bio-fertilizers, cold-pressed neem formulations, and sustainable orchard inputs.',
          businessAddress: 'Plot 44, MIDC Ambad',
          city: 'Nashik',
          state: 'Maharashtra',
          pincode: '422010',
          gstin: '27AAAAA5678B1Z2',
          licenseNumber: 'MAH-BIO-2020-4109',
          status: VendorStatus.APPROVED,
          commissionRate: 5.0,
          rating: 4.9,
          totalSales: 518,
          documents: {
            create: [
              {
                documentType: 'GST_CERTIFICATE',
                documentUrl: '/uploads/harit_gst.pdf',
                fileName: 'gst_certificate.pdf',
                isVerified: true,
              }
            ]
          }
        }
      }
    },
    include: { vendorProfile: true }
  });

  // Vendor 3: Pending Vendor (Annapurna Agri Traders)
  const vendorUser3 = await prisma.user.create({
    data: {
      fullName: 'Dinesh Shukla',
      email: 'vendor3@krishiconnect.in',
      phone: '9450098765',
      passwordHash: vendorPasswordHash,
      role: UserRole.VENDOR,
      isVerified: false,
      vendorProfile: {
        create: {
          businessName: 'Annapurna Agri Traders',
          storeSlug: 'annapurna-agri',
          description: 'Local input dealer for eastern UP seeking marketplace verification.',
          businessAddress: 'Shop 12, Krishi Mandi',
          city: 'Gorakhpur',
          state: 'Uttar Pradesh',
          pincode: '273001',
          gstin: '09AAAAA9876C1Z9',
          status: VendorStatus.PENDING,
          documents: {
            create: [
              {
                documentType: 'GST_CERTIFICATE',
                documentUrl: '/uploads/annapurna_gst.pdf',
                fileName: 'annapurna_gst.pdf',
                isVerified: false,
              }
            ]
          }
        }
      }
    },
    include: { vendorProfile: true }
  });

  console.log('✅ Vendors created (2 Approved, 1 Pending)');

  // 6. Create Customer (Farmer) Accounts
  const farmer1 = await prisma.user.create({
    data: {
      fullName: 'Ramesh Kumar Patel',
      email: 'farmer@krishiconnect.in',
      phone: '9898011223',
      passwordHash: farmerPasswordHash,
      role: UserRole.FARMER,
      isVerified: true,
      preferredLanguage: 'hi',
      addresses: {
        create: [
          {
            name: 'Ramesh Patel (Farm House)',
            phone: '9898011223',
            street: 'Farm Plot 14, Near Canal Road',
            villageOrLocality: 'Boriavi Village',
            city: 'Anand',
            district: 'Anand',
            state: 'Gujarat',
            pincode: '388310',
            isDefault: true,
            addressType: 'FARM',
          },
          {
            name: 'Ramesh Patel (Residence)',
            phone: '9898011223',
            street: '12 Shantiniketan Society',
            city: 'Anand',
            district: 'Anand',
            state: 'Gujarat',
            pincode: '388001',
            isDefault: false,
            addressType: 'HOME',
          }
        ]
      },
      farmerProfile: {
        create: {
          farmSize: 8.5,
          farmSizeUnit: 'acres',
          village: 'Boriavi Village',
          city: 'Anand',
          district: 'Anand',
          state: 'Gujarat',
          pincode: '388310',
          status: VerificationStatus.APPROVED,
        }
      },
      cart: { create: {} }
    },
    include: { addresses: true, farmerProfile: true }
  });

  console.log('✅ Farmer created: farmer@krishiconnect.in (Password: Farmer#12345)');

  // 7. Seed Products
  // Product 1: Certified Hybrid Wheat HD-3086 (Approved)
  const prod1 = await prisma.product.create({
    data: {
      vendorId: vendorUser1.vendorProfile!.id,
      categoryId: catSeeds.id,
      brandId: brands[1].id,
      title: 'Certified Hybrid Wheat Seeds HD-3086 (Pusa Gautami)',
      titleHi: 'प्रमाणित संकर गेहूं बीज एचडी-3086 (पूसा गौतमी)',
      slug: 'certified-hybrid-wheat-seeds-hd-3086',
      description: 'High-yielding, rust-resistant wheat seed suitable for timely sown irrigated conditions across Punjab, Haryana, UP, and Rajasthan. Superior grain quality with high protein content and drought tolerance.',
      descriptionHi: 'उच्च उपज और गेरुआ रोग प्रतिरोधी गेहूं बीज। पंजाब, हरियाणा, उत्तर प्रदेश एवं राजस्थान के लिए आदर्श।',
      status: ProductStatus.APPROVED,
      rating: 4.8,
      reviewCount: 24,
      suitableCrops: ['Wheat', 'गेहूं'],
      dosageInstructions: '40 kg seed per acre for broadcast or line sowing with seed drill.',
      batchNumber: 'WHT-2026-B81',
      expiryDate: new Date('2027-11-30'),
      organicCertified: false,
      cibRegistrationNo: 'CIB-PUN-0918-SEED',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80', order: 0, isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop&q=80', order: 1, isPrimary: false },
        ]
      },
      variants: {
        create: [
          {
            title: '40 Kg Bag',
            sku: 'WHT-HD3086-40KG',
            price: 1850.00,
            mrp: 2200.00,
            weightKg: 40.0,
            inventory: {
              create: { stockQuantity: 150, reservedQuantity: 0, lowStockAlert: 20 }
            }
          },
          {
            title: '20 Kg Bag',
            sku: 'WHT-HD3086-20KG',
            price: 980.00,
            mrp: 1150.00,
            weightKg: 20.0,
            inventory: {
              create: { stockQuantity: 200, reservedQuantity: 0, lowStockAlert: 20 }
            }
          }
        ]
      }
    }
  });

  // Product 2: Organic Neem Oil 10000 PPM (Approved)
  const prod2 = await prisma.product.create({
    data: {
      vendorId: vendorUser2.vendorProfile!.id,
      categoryId: catCropProtection.id,
      brandId: brands[4].id,
      title: 'Harit Pure Cold-Pressed Neem Oil (10000 PPM Azadirachtin)',
      titleHi: 'हरित शुद्ध कोल्ड-प्रेस्ड नीम तेल (10000 पीपीएम एज़ाडिराक्टिन)',
      slug: 'pure-cold-pressed-neem-oil-10000ppm',
      description: '100% natural, broad-spectrum botanical bio-insecticide and anti-feedant. Effectively repels and terminates whiteflies, aphids, thrips, caterpillars, and leaf miners. Safe for beneficial pollinators and certified organic.',
      descriptionHi: '100% प्राकृतिक जैविक कीटनाशक। सफ़ेद मक्खी, एफिड, थ्रिप्स और इल्ली से सुरक्षा।',
      status: ProductStatus.APPROVED,
      rating: 4.9,
      reviewCount: 38,
      suitableCrops: ['Cotton', 'Tomato', 'Chilli', 'Paddy', 'Vegetables', 'Orchards'],
      dosageInstructions: 'Mix 3-5 ml per litre of water. Spray during early morning or late evening.',
      activeIngredients: 'Azadirachtin 1% (10000 PPM) EC',
      batchNumber: 'NM-2026-044',
      expiryDate: new Date('2028-06-30'),
      organicCertified: true,
      cibRegistrationNo: 'CIB-BIO-ORG-2023-88',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', order: 0, isPrimary: true },
        ]
      },
      variants: {
        create: [
          {
            title: '1 Litre Bottle',
            sku: 'NEEM-10K-1L',
            price: 649.00,
            mrp: 850.00,
            weightKg: 1.0,
            inventory: {
              create: { stockQuantity: 300, reservedQuantity: 0, lowStockAlert: 25 }
            }
          },
          {
            title: '5 Litres Can',
            sku: 'NEEM-10K-5L',
            price: 2850.00,
            mrp: 3800.00,
            weightKg: 5.0,
            inventory: {
              create: { stockQuantity: 80, reservedQuantity: 0, lowStockAlert: 10 }
            }
          }
        ]
      }
    }
  });

  // Product 3: IFFCO NPK 19-19-19 100% Water Soluble (Approved)
  const prod3 = await prisma.product.create({
    data: {
      vendorId: vendorUser1.vendorProfile!.id,
      categoryId: catFertilizers.id,
      brandId: brands[0].id,
      title: 'IFFCO 100% Water Soluble NPK 19:19:19 Balanced Plant Food',
      titleHi: 'इफको 100% जल में घुलनशील एनपीके 19:19:19 संतुलित पौध पोषक तत्व',
      slug: 'iffco-water-soluble-npk-19-19-19',
      description: 'Fully water-soluble foliar spray and fertigation fertilizer containing equal proportions of Nitrogen, Phosphorus, and Potassium. Boosts vegetative growth, vigorous root development, and uniform blooming.',
      status: ProductStatus.APPROVED,
      rating: 4.7,
      reviewCount: 19,
      suitableCrops: ['All Field Crops', 'Wheat', 'Paddy', 'Sugarcane', 'Cotton', 'Fruits', 'Vegetables'],
      dosageInstructions: 'Drip fertigation: 3-5 kg per acre. Foliar spray: 5-8 grams per litre of water.',
      batchNumber: 'IFF-NPK-1919-992',
      expiryDate: new Date('2028-12-31'),
      organicCertified: false,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80', order: 0, isPrimary: true },
        ]
      },
      variants: {
        create: [
          {
            title: '1 Kg Pouch',
            sku: 'IFF-NPK19-1KG',
            price: 180.00,
            mrp: 220.00,
            weightKg: 1.0,
            inventory: {
              create: { stockQuantity: 500, reservedQuantity: 0, lowStockAlert: 50 }
            }
          },
          {
            title: '25 Kg Bag',
            sku: 'IFF-NPK19-25KG',
            price: 3650.00,
            mrp: 4400.00,
            weightKg: 25.0,
            inventory: {
              create: { stockQuantity: 65, reservedQuantity: 0, lowStockAlert: 10 }
            }
          }
        ]
      }
    }
  });

  // Product 4: Drip Irrigation 1 Acre Kit (Approved)
  const prod4 = await prisma.product.create({
    data: {
      vendorId: vendorUser2.vendorProfile!.id,
      categoryId: catIrrigation.id,
      brandId: brands[3].id,
      title: 'Jain Precision Drip Irrigation Complete Setup Kit (1 Acre)',
      titleHi: 'जैन प्रिसिजन ड्रिप सिंचाई कम्प्लीट किट (1 एकड़)',
      slug: 'jain-precision-drip-irrigation-kit-1-acre',
      description: 'Complete 1-acre micro-irrigation system with 16mm inline lateral tubes (40cm emitter spacing, 2 LPH), screen filter, venturi fertilizer injector, flush valves, punch, and end caps. Saves up to 60% water while increasing yield.',
      status: ProductStatus.APPROVED,
      rating: 5.0,
      reviewCount: 12,
      suitableCrops: ['Vegetables', 'Banana', 'Sugarcane', 'Cotton', 'Pomegranate', 'Papaya'],
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&auto=format&fit=crop&q=80', order: 0, isPrimary: true },
        ]
      },
      variants: {
        create: [
          {
            title: '1 Acre Kit (40cm Spacing)',
            sku: 'JAIN-DRIP-1ACRE-40',
            price: 18999.00,
            mrp: 24500.00,
            weightKg: 48.0,
            inventory: {
              create: { stockQuantity: 25, reservedQuantity: 0, lowStockAlert: 5 }
            }
          }
        ]
      }
    }
  });

  // Product 5: Awaiting Admin Review Listing
  const prod5 = await prisma.product.create({
    data: {
      vendorId: vendorUser1.vendorProfile!.id,
      categoryId: catCropProtection.id,
      brandId: brands[1].id,
      title: 'Bacillus Thuringiensis (BT) Bio-Insecticide Formulation',
      titleHi: 'बैसिलस थुरिंजिएंसिस (बीटी) बायो-कीटनाशक',
      slug: 'bacillus-thuringiensis-bt-bio-insecticide',
      description: 'Specialist microbial formulation for diamondback moth and bollworm control awaiting administrative compliance verification.',
      status: ProductStatus.PENDING_REVIEW,
      suitableCrops: ['Cotton', 'Cabbage', 'Cauliflower'],
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&auto=format&fit=crop&q=80', order: 0, isPrimary: true },
        ]
      },
      variants: {
        create: [
          {
            title: '500 Grams Pack',
            sku: 'BT-BIO-500G',
            price: 499.00,
            mrp: 650.00,
            weightKg: 0.5,
            inventory: {
              create: { stockQuantity: 60, reservedQuantity: 0, lowStockAlert: 10 }
            }
          }
        ]
      },
      approvalHistory: {
        create: {
          fromStatus: ProductStatus.DRAFT,
          toStatus: ProductStatus.PENDING_REVIEW,
          actionBy: vendorUser1.id,
          remarks: 'Submitted for CIB compliance certificate check',
        }
      }
    }
  });

  console.log('✅ Catalog seeded (4 approved products, 1 pending review)');

  // 8. Seed Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'KISAN50',
        discountAmt: 50.0,
        minOrderVal: 500.0,
        validUntil: new Date('2028-12-31'),
        usageLimit: 1000,
        isActive: true,
      },
      {
        code: 'HARVEST10',
        discountPct: 10.0,
        maxDiscount: 500.0,
        minOrderVal: 1500.0,
        validUntil: new Date('2028-12-31'),
        usageLimit: 500,
        isActive: true,
      }
    ]
  });

  // 9. Seed Sample Review
  await prisma.review.create({
    data: {
      userId: farmer1.id,
      productId: prod1.id,
      rating: 5,
      headline: 'Outstanding germination rate of over 95%',
      comment: 'Sowed HD-3086 on my 4-acre plot in Anand. Germination was visible in 5 days. Vigorous tillering and disease-free crop. Very pleased with Bharat Krishi delivery.',
      cropType: 'Wheat',
      isVerifiedPurchase: true,
    }
  });

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

