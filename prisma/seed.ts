// DEAL Platform - Seed Script
// منصة التجارة والخدمات الجزائرية - سكريبت تعبئة البيانات

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_PASSWORD_HASH = '$2a$10$demo_hash_not_for_production'

async function main() {
  console.log('🌱 Starting DEAL Platform seed...')
  console.log('📋 Clearing existing data...')

  // Delete in correct order to respect foreign keys
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.serviceRequest.deleteMany()
  await prisma.rentalRequest.deleteMany()
  await prisma.rental.deleteMany()
  await prisma.merchantWallet.deleteMany()
  await prisma.product.deleteMany()
  await prisma.service.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Existing data cleared.')

  // ─── 1. CATEGORIES ──────────────────────────────────────────────────────────
  console.log('📂 Creating categories...')

  const productCategoriesData = [
    { nameAr: 'إلكترونيات', nameFr: 'Électronique', icon: '📺', type: 'product' },
    { nameAr: 'ملابس', nameFr: 'Vêtements', icon: '👔', type: 'product' },
    { nameAr: 'أجهزة منزلية', nameFr: 'Électroménager', icon: '🏠', type: 'product' },
    { nameAr: 'مواد غذائية', nameFr: 'Alimentation', icon: '🛒', type: 'product' },
    { nameAr: 'مستحضرات تجميل', nameFr: 'Cosmétiques', icon: '✨', type: 'product' },
    { nameAr: 'أثاث', nameFr: 'Meubles', icon: '🪑', type: 'product' },
    { nameAr: 'هواتف', nameFr: 'Téléphones', icon: '📱', type: 'product' },
    { nameAr: 'حواسيب', nameFr: 'Informatique', icon: '💻', type: 'product' },
    { nameAr: 'حرف يدوية', nameFr: 'Artisanat', icon: '🧶', type: 'product' },
    { nameAr: 'مجوهرات وإكسسوارات', nameFr: 'Bijoux et accessoires', icon: '💍', type: 'product' },
    { nameAr: 'سجاد وزرابي', nameFr: 'Tapis et Zrabia', icon: '🧵', type: 'product' },
    { nameAr: 'فخار وخزف', nameFr: 'Poterie et céramique', icon: '🏺', type: 'product' },
    { nameAr: 'جلد طبيعي', nameFr: 'Cuir naturel', icon: '🥿', type: 'product' },
    { nameAr: 'زي تقليدي جزائري', nameFr: 'Tenue traditionnelle', icon: '👗', type: 'product' },
    { nameAr: 'أعشاب وتوابل', nameFr: 'Herbes et épices', icon: '🌿', type: 'product' },
    { nameAr: 'منتجات نحلية', nameFr: 'Produits apicoles', icon: '🍯', type: 'product' },
    { nameAr: 'كتب ومخطوطات', nameFr: 'Livres et manuscrits', icon: '📚', type: 'product' },
    { nameAr: 'أدوات ومعدات', nameFr: 'Outils et équipements', icon: '🔧', type: 'product' },
    { nameAr: 'مستلزمات أطفال', nameFr: 'Articles pour bébé', icon: '👶', type: 'product' },
    { nameAr: 'رياضة ولياقة', nameFr: 'Sport et fitness', icon: '⚽', type: 'product' },
  ]

  const serviceCategoriesData = [
    { nameAr: 'سباكة', nameFr: 'Plomberie', icon: '🔧', type: 'service' },
    { nameAr: 'كهرباء', nameFr: 'Électricité', icon: '⚡', type: 'service' },
    { nameAr: 'تكييف', nameFr: 'Climatisation', icon: '❄️', type: 'service' },
    { nameAr: 'نجارة', nameFr: 'Menuiserie', icon: '🪚', type: 'service' },
    { nameAr: 'دهان', nameFr: 'Peinture', icon: '🎨', type: 'service' },
    { nameAr: 'نقل وشحن', nameFr: 'Transport et expédition', icon: '🚚', type: 'service' },
    { nameAr: 'تنظيف', nameFr: 'Nettoyage', icon: '🧹', type: 'service' },
    { nameAr: 'صيانة سيارات', nameFr: 'Entretien auto', icon: '🚗', type: 'service' },
    { nameAr: 'حلاقة وتجميل', nameFr: 'Coiffure et beauté', icon: '💇', type: 'service' },
    { nameAr: 'طبخ وتموين', nameFr: 'Cuisine et traiteur', icon: '🍳', type: 'service' },
    { nameAr: 'خياطة وتطريز', nameFr: 'Couture et broderie', icon: '🧵', type: 'service' },
    { nameAr: 'تعليم ودروس خصوصية', nameFr: 'Enseignement et cours', icon: '📖', type: 'service' },
    { nameAr: 'حدادة وألمنيوم', nameFr: 'Ferronnerie et aluminium', icon: '⚙️', type: 'service' },
    { nameAr: 'زراعة وحدائق', nameFr: 'Jardinage et paysagisme', icon: '🌱', type: 'service' },
    { nameAr: 'تصوير فوتوغرافي', nameFr: 'Photographie', icon: '📸', type: 'service' },
    { nameAr: 'صيانة أجهزة إلكترونية', nameFr: 'Réparation électronique', icon: '🛠️', type: 'service' },
    { nameAr: 'محاسبة وضرائب', nameFr: 'Comptabilité et fiscalité', icon: '📊', type: 'service' },
    { nameAr: 'تصميم وطباعة', nameFr: 'Design et impression', icon: '🖨️', type: 'service' },
    { nameAr: 'خدمات منزلية', nameFr: 'Services à domicile', icon: '🏡', type: 'service' },
    { nameAr: 'عطارة وطب شعبي', nameFr: 'Herboristerie et médecine traditionnelle', icon: '🫖', type: 'service' },
  ]

  const rentalCategoriesData = [
    { nameAr: 'معدات بناء ثقيلة', nameFr: 'Engins de chantier', icon: '🏗️', type: 'rental' },
    { nameAr: 'معدات بناء خفيفة', nameFr: 'Outillage de chantier', icon: '🔨', type: 'rental' },
    { nameAr: 'سقالات ودعامات', nameFr: 'Échafaudages et étaiements', icon: '🪜', type: 'rental' },
    { nameAr: 'خلاطة خرسانة', nameFr: 'Bétonnières', icon: '⚙️', type: 'rental' },
    { nameAr: 'رافعات وشاحنات', nameFr: 'Grues et camions', icon: '🚛', type: 'rental' },
    { nameAr: 'معدات حفر', nameFr: 'Équipements de forage', icon: '⛏️', type: 'rental' },
    { nameAr: 'ضواغط هواء', nameFr: 'Compresseurs d\'air', icon: '💨', type: 'rental' },
    { nameAr: 'مولدات كهربائية', nameFr: 'Groupes électrogènes', icon: '⚡', type: 'rental' },
    { nameAr: 'معدات زراعية', nameFr: 'Équipements agricoles', icon: '🚜', type: 'rental' },
    { nameAr: 'معدات تنظيف صناعية', nameFr: 'Matériel de nettoyage industriel', icon: '🧹', type: 'rental' },
    { nameAr: 'معدات تصوير وأحداث', nameFr: 'Matériel de tournage et événementiel', icon: '🎬', type: 'rental' },
    { nameAr: 'معدات تنقل', nameFr: 'Véhicules de location', icon: '🚗', type: 'rental' },
  ]

  const categories = await prisma.$transaction([
    ...productCategoriesData.map(data => prisma.category.create({ data })),
    ...serviceCategoriesData.map(data => prisma.category.create({ data })),
    ...rentalCategoriesData.map(data => prisma.category.create({ data })),
  ])

  const productCategories = categories.slice(0, 20)
  const serviceCategories = categories.slice(20, 40)
  const rentalCategories = categories.slice(40, 52)

  console.log(`  ✅ Created ${categories.length} categories (${productCategories.length} product, ${serviceCategories.length} service, ${rentalCategories.length} rental)`)
  console.log(`     📦 Product categories: 8 original + 12 new Algerian artisanal categories`)
  console.log(`     🔧 Service categories: 8 original + 12 new Algerian traditional service categories`)
  console.log(`     🏗️ Rental categories: 12 equipment rental categories`)

  // ─── 2. USERS ───────────────────────────────────────────────────────────────
  console.log('👥 Creating users...')

  // Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@deal.dz',
      passwordHash: DEMO_PASSWORD_HASH,
      role: 'admin',
      phone: '0550000001',
      address: 'الجزائر العاصمة',
      wilaya: 'الجزائر',
      isVerified: true,
      isActive: true,
    },
  })

  // Merchants
  const merchants = await prisma.$transaction([
    prisma.user.create({
      data: {
        username: 'noor_store',
        email: 'noor@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'merchant',
        phone: '0550000010',
        address: 'شارع ديدوش مراد، الجزائر',
        wilaya: 'الجزائر',
        isVerified: true,
        isActive: true,
        storeName: 'متجر النور',
        regNumber: 'RC-ALG-2024-001',
      },
    }),
    prisma.user.create({
      data: {
        username: 'algeria_electro',
        email: 'electro@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'merchant',
        phone: '0550000011',
        address: 'حي البساتين، وهران',
        wilaya: 'وهران',
        isVerified: true,
        isActive: true,
        storeName: 'إلكترونيات الجزائر',
        regNumber: 'RC-ORN-2024-002',
      },
    }),
    prisma.user.create({
      data: {
        username: 'anaka_moda',
        email: 'moda@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'merchant',
        phone: '0550000012',
        address: 'شارع عبان رمضان، البليدة',
        wilaya: 'البليدة',
        isVerified: true,
        isActive: true,
        storeName: 'أناقة moda',
        regNumber: 'RC-BLD-2024-003',
      },
    }),
  ])

  // Service Providers
  const serviceProviders = await prisma.$transaction([
    prisma.user.create({
      data: {
        username: 'plumber_karim',
        email: 'karim@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'service_provider',
        phone: '0550000020',
        address: 'باب الزوار، الجزائر',
        wilaya: 'الجزائر',
        isVerified: true,
        isActive: true,
        specialty: 'سباكة',
        experience: 12,
      },
    }),
    prisma.user.create({
      data: {
        username: 'electrician_amine',
        email: 'amine@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'service_provider',
        phone: '0550000021',
        address: 'عين الباي، قسنطينة',
        wilaya: 'قسنطينة',
        isVerified: true,
        isActive: true,
        specialty: 'كهرباء',
        experience: 8,
      },
    }),
    prisma.user.create({
      data: {
        username: 'clim_yacine',
        email: 'yacine@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'service_provider',
        phone: '0550000022',
        address: 'سيدي بلعباس',
        wilaya: 'سيدي بلعباس',
        isVerified: true,
        isActive: true,
        specialty: 'تكييف',
        experience: 6,
      },
    }),
  ])

  // Customers
  const customers = await prisma.$transaction([
    prisma.user.create({
      data: {
        username: 'fatima_b',
        email: 'fatima@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'customer',
        phone: '0550000030',
        address: 'براقي، الجزائر',
        wilaya: 'الجزائر',
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'mohamed_k',
        email: 'mohamed@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'customer',
        phone: '0550000031',
        address: 'حي 500 مسكن، وهران',
        wilaya: 'وهران',
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'amina_s',
        email: 'amina@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'customer',
        phone: '0550000032',
        address: 'المدينة الجديدة، قسنطينة',
        wilaya: 'قسنطينة',
        isVerified: true,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'omar_r',
        email: 'omar@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'customer',
        phone: '0550000033',
        address: 'وسط المدينة، تلمسان',
        wilaya: 'تلمسان',
        isVerified: false,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        username: 'leila_m',
        email: 'leila@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'customer',
        phone: '0550000034',
        address: 'سيدي فرج، العاصمة',
        wilaya: 'الجزائر',
        isVerified: true,
        isActive: true,
      },
    }),
  ])

  // Rental Providers
  const rentalProviders = await prisma.$transaction([
    prisma.user.create({
      data: {
        username: 'rental_hassan',
        email: 'hassan@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'rental_provider',
        phone: '0550000040',
        address: 'الحراش، الجزائر',
        wilaya: 'الجزائر',
        isVerified: true,
        isActive: true,
        storeName: 'مؤجر حسان للمعدات',
        specialty: 'كراء معدات البناء',
        experience: 10,
      },
    }),
    prisma.user.create({
      data: {
        username: 'rental_said',
        email: 'said@deal.dz',
        passwordHash: DEMO_PASSWORD_HASH,
        role: 'rental_provider',
        phone: '0550000041',
        address: 'وهران السانية',
        wilaya: 'وهران',
        isVerified: true,
        isActive: true,
        storeName: 'معدات السعيد',
        specialty: 'كراء المعدات الثقيلة',
        experience: 15,
      },
    }),
  ])

  console.log(`  ✅ Created 1 admin, ${merchants.length} merchants, ${serviceProviders.length} service providers, ${rentalProviders.length} rental providers, ${customers.length} customers`)

  // ─── 3. PRODUCTS ────────────────────────────────────────────────────────────
  console.log('📦 Creating products...')

  const productsData = [
    // إلكترونيات (merchant: noor_store)
    { merchantId: merchants[0].id, categoryId: productCategories[0].id, title: 'تلفزيون سامسونج 55 بوصة 4K', description: 'تلفزيون ذكي بدقة 4K UHD، شاشة LED، نظام تشغيل Tizen', price: 95000, stock: 15, isFeatured: true, isNew: true, views: 234 },
    { merchantId: merchants[0].id, categoryId: productCategories[0].id, title: 'سماعات بلوتوث جي بي ال T200', description: 'سماعات لاسلكية ببلوتوث 5.3، بطارية تدوم 6 ساعات', price: 4500, stock: 50, isOnSale: true, salePrice: 3500, isNew: true, views: 189 },

    // ملابس (merchant: anaka_moda)
    { merchantId: merchants[2].id, categoryId: productCategories[1].id, title: 'قميص رجالي قطني', description: 'قميص رسمي من القطن المصري، متوفر بعدة ألوان', price: 3500, stock: 100, isNew: true, views: 156 },
    { merchantId: merchants[2].id, categoryId: productCategories[1].id, title: 'عباية نسائية مطرزة', description: 'عباية أنيقة بتطريز يدوي، مناسبة للمناسبات', price: 8000, stock: 30, isFeatured: true, isNew: false, views: 312 },
    { merchantId: merchants[2].id, categoryId: productCategories[1].id, title: 'حذاء رياضي نايك اير', description: 'حذاء رياضي مريح للجري والمشي، نعل مطاطي', price: 12000, stock: 25, isOnSale: true, salePrice: 9500, views: 278 },
    { merchantId: merchants[2].id, categoryId: productCategories[1].id, title: 'جلباب رجالي تقليدي', description: 'جلباب جزائري تقليدي من الصوف، مناسب للشتاء', price: 6000, stock: 40, views: 145 },

    // أجهزة منزلية (merchant: algeria_electro)
    { merchantId: merchants[1].id, categoryId: productCategories[2].id, title: 'ثلاجة هيير 320 لتر', description: 'ثلاجة ببابين، نظام تبريد متعدد، فريزر سفلي', price: 120000, stock: 8, isFeatured: true, views: 456 },
    { merchantId: merchants[1].id, categoryId: productCategories[2].id, title: 'غسالة أوتوماتيك 8 كغ', description: 'غسالة أوتوماتيكية بسعة 8 كيلوغرام، 16 برنامج غسيل', price: 65000, stock: 12, isOnSale: true, salePrice: 58000, views: 345 },
    { merchantId: merchants[1].id, categoryId: productCategories[2].id, title: 'مكنسة كهربائية دايستون', description: 'مكنسة بدون كابل، بطارية 60 دقيقة، قوة شفط عالية', price: 35000, stock: 20, isNew: true, views: 198 },

    // مواد غذائية (merchant: noor_store)
    { merchantId: merchants[0].id, categoryId: productCategories[3].id, title: 'زيت زيتون جزائري بكر ممتاز', description: 'زيت زيتون من منطقة القبائل، عصر بارد، 1 لتر', price: 1800, stock: 200, views: 567 },
    { merchantId: merchants[0].id, categoryId: productCategories[3].id, title: 'تمر دقلة نور', description: 'تمور فاخرة من بسكرة، 1 كيلوغرام', price: 1200, stock: 150, isFeatured: true, views: 789 },
    { merchantId: merchants[0].id, categoryId: productCategories[3].id, title: 'قهوة جزائرية محمصة', description: 'قهوة محمصة ومطحونة تقليدياً، 250 غرام', price: 800, stock: 300, isOnSale: true, salePrice: 650, views: 432 },

    // مستحضرات تجميل (merchant: anaka_moda)
    { merchantId: merchants[2].id, categoryId: productCategories[4].id, title: 'طقم عناية بالبشرة', description: 'طقم كامل: غسول، تونر، مرطب، واقي شمس', price: 7500, stock: 45, isNew: true, views: 234 },
    { merchantId: merchants[2].id, categoryId: productCategories[4].id, title: 'عطر نسائي فرنسي', description: 'عطر أنيق برائحة الورد والياسمين، 100 مل', price: 4500, stock: 60, views: 189 },

    // أثاث (merchant: noor_store)
    { merchantId: merchants[0].id, categoryId: productCategories[5].id, title: 'طاولة طعام 6 كراسي', description: 'طاولة خشب زان مع 6 كراسي منجدة، صنع محلي', price: 85000, stock: 5, views: 145 },
    { merchantId: merchants[0].id, categoryId: productCategories[5].id, title: 'خزانة ملابس 3 أبواب', description: 'خزانة بثلاثة أبواب مع مرآة، خشب MDF عالي الجودة', price: 55000, stock: 7, isOnSale: true, salePrice: 48000, views: 198 },

    // هواتف (merchant: algeria_electro)
    { merchantId: merchants[1].id, categoryId: productCategories[6].id, title: 'هاتف سامسونج A54', description: 'شاشة 6.4 بوصة، رام 8 جيجا، تخزين 128 جيجا، كاميرا 50 ميجا', price: 45000, stock: 30, isFeatured: true, isNew: true, views: 876 },
    { merchantId: merchants[1].id, categoryId: productCategories[6].id, title: 'هاتف شاومي ريدمي نوت 13', description: 'شاشة AMOLED 6.67، رام 6 جيجا، بطارية 5000 ملي أمبير', price: 28000, stock: 40, isOnSale: true, salePrice: 24500, views: 654 },
    { merchantId: merchants[1].id, categoryId: productCategories[6].id, title: 'آيفون 15 برو ماكس', description: 'شريحة A17 Pro، كاميرا 48 ميجا، شاشة 6.7 بوصة', price: 250000, stock: 5, isNew: true, views: 1023 },

    // حواسيب (merchant: algeria_electro)
    { merchantId: merchants[1].id, categoryId: productCategories[7].id, title: 'لابتوب لينوفو IdeaPad 3', description: 'معالج i5 جيل 12، رام 8 جيجا، SSD 512 جيجا', price: 75000, stock: 15, isFeatured: true, views: 432 },
    { merchantId: merchants[1].id, categoryId: productCategories[7].id, title: 'ماوس لاسلكي لوجيتك', description: 'ماوس لاسلكي مريح، بلوتوث + USB، بطارية تدوم 12 شهر', price: 2500, stock: 80, views: 198 },
  ]

  const products = await prisma.$transaction(
    productsData.map(data => prisma.product.create({ data }))
  )

  console.log(`  ✅ Created ${products.length} products`)

  // ─── 4. SERVICES ────────────────────────────────────────────────────────────
  console.log('🔧 Creating services...')

  const servicesData = [
    // سباكة (provider: karim)
    { providerId: serviceProviders[0].id, categoryId: serviceCategories[0].id, title: 'إصلاح تسربات المياه', description: 'كشف وإصلاح جميع أنواع التسربات المائية باستخدام أحدث التقنيات', priceType: 'fixed', price: 5000, completedProjects: 85, views: 234, coverageWilayas: '["16","42"]' },
    { providerId: serviceProviders[0].id, categoryId: serviceCategories[0].id, title: 'تركيب أنابيب صحية', description: 'تركيب وصيانة الأنابيب الصحية للمنازل والمؤسسات', priceType: 'negotiable', price: null, completedProjects: 62, views: 156, coverageWilayas: '["16"]' },
    { providerId: serviceProviders[0].id, categoryId: serviceCategories[0].id, title: 'تركيب سخان مياه', description: 'تركيب وصيانة سخانات المياه الكهربائية والغازية', priceType: 'fixed', price: 3500, completedProjects: 48, views: 134, coverageWilayas: '["16","42"]' },

    // كهرباء (provider: amine)
    { providerId: serviceProviders[1].id, categoryId: serviceCategories[1].id, title: 'تمديدات كهربائية للمنازل', description: 'تمديدات كهربائية كاملة للمنازل الجديدة والقديمة وفقاً للمعايير', priceType: 'hourly', price: 2500, completedProjects: 95, views: 345, coverageWilayas: '["25"]' },
    { providerId: serviceProviders[1].id, categoryId: serviceCategories[1].id, title: 'تركيب لوحة كهربائية', description: 'تركيب وصيانة اللوحات الكهربائية ولوحات التوزيع', priceType: 'fixed', price: 8000, completedProjects: 40, views: 178, coverageWilayas: '["25"]' },
    { providerId: serviceProviders[1].id, categoryId: serviceCategories[1].id, title: 'إصلاح أعطال كهربائية', description: 'كشف وإصلاح الأعطال الكهربائية والتماسات', priceType: 'fixed', price: 3000, completedProjects: 120, views: 267, coverageWilayas: '["25","16"]' },

    // تكييف (provider: yacine)
    { providerId: serviceProviders[2].id, categoryId: serviceCategories[2].id, title: 'تركيب مكيف سبليت', description: 'تركيب مكيفات سبليت وجدارية مع الضمان', priceType: 'fixed', price: 6000, completedProjects: 72, views: 456, coverageWilayas: '["22","16"]' },
    { providerId: serviceProviders[2].id, categoryId: serviceCategories[2].id, title: 'صيانة وتنظيف المكيفات', description: 'صيانة دورية وتنظيف فلتر المكيف وتعبئة الفريون', priceType: 'fixed', price: 2500, completedProjects: 150, views: 389, coverageWilayas: '["22","16","25"]' },

    // نجارة
    { providerId: serviceProviders[0].id, categoryId: serviceCategories[3].id, title: 'أعمال نجارة المنزل', description: 'تصنيع وتركيب الأبواب والنوافذ الخشبية', priceType: 'negotiable', price: null, completedProjects: 35, views: 167, coverageWilayas: '["16"]' },

    // دهان
    { providerId: serviceProviders[1].id, categoryId: serviceCategories[4].id, title: 'دهان المنازل والمكاتب', description: 'دهان داخلي وخارجي بأجود أنواع الدهان', priceType: 'hourly', price: 2000, completedProjects: 55, views: 198, coverageWilayas: '["25","16"]' },

    // نقل
    { providerId: serviceProviders[2].id, categoryId: serviceCategories[5].id, title: 'نقل أثاث ومنقولات', description: 'نقل الأثاث بحرص مع التغليف والتركيب', priceType: 'negotiable', price: null, completedProjects: 88, views: 312, coverageWilayas: '["22","16","25"]' },

    // تنظيف
    { providerId: serviceProviders[2].id, categoryId: serviceCategories[6].id, title: 'تنظيف شامل للمنازل', description: 'خدمة تنظيف شامل بعد البناء أو قبل السكن', priceType: 'fixed', price: 8000, completedProjects: 44, views: 223, coverageWilayas: '["22"]' },
  ]

  const services = await prisma.$transaction(
    servicesData.map(data => prisma.service.create({ data }))
  )

  console.log(`  ✅ Created ${services.length} services`)

  // ─── RENTALS ────────────────────────────────────────────────────────────
  console.log('🏗️ Creating rentals...')

  const rentalsData = [
    // معدات بناء ثقيلة (provider: hassan)
    { providerId: rentalProviders[0].id, categoryId: rentalCategories[0].id, title: 'حفارة كاتربيلر 320', description: 'حفارة هيدروليكية بمجرفة 1.2 م³، مثالية لأعمال الحفر والتسوية', dailyRate: 45000, weeklyRate: 250000, monthlyRate: 850000, deposit: 200000, minRentalDays: 1, maxRentalDays: 90, completedRentals: 35, views: 189, coverageWilayas: '["16","42","25"]', deliveryAvailable: true, deliveryFee: 15000 },
    { providerId: rentalProviders[0].id, categoryId: rentalCategories[0].id, title: 'بلدوزر كوماتسو D65', description: 'بلدوزر بقوة 170 حصان، مناسب لأعمال الدفع والتسوية', dailyRate: 55000, weeklyRate: 300000, monthlyRate: 1000000, deposit: 300000, minRentalDays: 1, maxRentalDays: 60, completedRentals: 22, views: 145, coverageWilayas: '["16"]', deliveryAvailable: true, deliveryFee: 25000 },

    // معدات بناء خفيفة (provider: hassan)
    { providerId: rentalProviders[0].id, categoryId: rentalCategories[1].id, title: 'مطرقة هيدروليكية تكسير', description: 'مطرقة تكسير هيدروليكية للخرسانة والصخور، قوة 1500 ضربة/دقيقة', dailyRate: 8000, weeklyRate: 45000, monthlyRate: 150000, deposit: 50000, minRentalDays: 1, maxRentalDays: 30, completedRentals: 68, views: 312, coverageWilayas: '["16","42"]', deliveryAvailable: true, deliveryFee: 5000 },

    // خلاطة خرسانة (provider: hassan)
    { providerId: rentalProviders[0].id, categoryId: rentalCategories[3].id, title: 'خلاطة خرسانة 400 لتر', description: 'خلاطة ذاتية التحميل بسعة 400 لتر، محرك ديزل', dailyRate: 5000, weeklyRate: 28000, monthlyRate: 90000, deposit: 30000, minRentalDays: 1, maxRentalDays: 60, completedRentals: 95, views: 456, coverageWilayas: '["16","42","25"]', deliveryAvailable: true, deliveryFee: 3000 },

    // سقالات (provider: hassan)
    { providerId: rentalProviders[0].id, categoryId: rentalCategories[2].id, title: 'سقالات معدنية متعددة الطوابق', description: 'سقالات معدنية قابلة للتجميع، حتى 6 طوابق، مع ألواح ومشابك', dailyRate: 2000, weeklyRate: 10000, monthlyRate: 35000, deposit: 20000, minRentalDays: 7, maxRentalDays: 180, completedRentals: 42, views: 234, coverageWilayas: '["16"]', deliveryAvailable: true, deliveryFee: 8000 },

    // مولدات كهربائية (provider: said)
    { providerId: rentalProviders[1].id, categoryId: rentalCategories[7].id, title: 'مولد كهربائي 100 كيلوفولت', description: 'مولد ديزل بقوة 100 كيلوفولت أمبير، مثالي للمواقع والأحداث', dailyRate: 12000, weeklyRate: 65000, monthlyRate: 220000, deposit: 80000, minRentalDays: 1, maxRentalDays: 90, completedRentals: 55, views: 378, coverageWilayas: '["22","16","25"]', deliveryAvailable: true, deliveryFee: 10000 },
    { providerId: rentalProviders[1].id, categoryId: rentalCategories[7].id, title: 'مولد كهربائي صغير 5 كيلوفولت', description: 'مولد بنزين صغير مناسب للاستخدام المنزلي والمحلات', dailyRate: 3000, weeklyRate: 16000, monthlyRate: 55000, deposit: 15000, minRentalDays: 1, maxRentalDays: 30, completedRentals: 110, views: 523, coverageWilayas: '["22","16"]', deliveryAvailable: true, deliveryFee: 2000 },

    // معدات زراعية (provider: said)
    { providerId: rentalProviders[1].id, categoryId: rentalCategories[8].id, title: 'جرار زراعي ماسsey فerguson', description: 'جرار زراعي بقوة 75 حصان مع ملحقات الحراثة', dailyRate: 15000, weeklyRate: 80000, monthlyRate: 280000, deposit: 100000, minRentalDays: 1, maxRentalDays: 90, completedRentals: 28, views: 167, coverageWilayas: '["22","16"]', deliveryAvailable: true, deliveryFee: 12000 },

    // رافعات (provider: said)
    { providerId: rentalProviders[1].id, categoryId: rentalCategories[4].id, title: 'رافعة شاحنة 15 طن', description: 'رافعة هيدروليكية مركبة على شاحنة، ذراع 21 متر', dailyRate: 35000, weeklyRate: 200000, monthlyRate: 700000, deposit: 150000, minRentalDays: 1, maxRentalDays: 60, completedRentals: 18, views: 198, coverageWilayas: '["22","16","25"]', deliveryAvailable: false },

    // ضواغط هواء (provider: hassan)
    { providerId: rentalProviders[0].id, categoryId: rentalCategories[6].id, title: 'ضاغط هواء 10 بار', description: 'ضاغط هواء بضغط 10 بار، مناسب لأعمال الرش والبناء', dailyRate: 6000, weeklyRate: 32000, monthlyRate: 110000, deposit: 40000, minRentalDays: 1, maxRentalDays: 60, completedRentals: 40, views: 210, coverageWilayas: '["16","42"]', deliveryAvailable: true, deliveryFee: 4000 },

    // معدات تنقل (provider: said)
    { providerId: rentalProviders[1].id, categoryId: rentalCategories[11].id, title: 'شاحنة نقل 10 طن', description: 'شاحنة نقل بسعة 10 طن مع سائق، لنقل البضائع والمواد', dailyRate: 18000, weeklyRate: 95000, monthlyRate: 320000, deposit: 80000, minRentalDays: 1, maxRentalDays: 30, completedRentals: 65, views: 289, coverageWilayas: '["22","16","25"]', deliveryAvailable: false },
  ]

  const rentals = await prisma.$transaction(
    rentalsData.map(data => prisma.rental.create({ data }))
  )

  console.log(`  ✅ Created ${rentals.length} rentals`)

  // ─── 5. MERCHANT WALLETS ────────────────────────────────────────────────────
  console.log('💰 Creating merchant wallets...')

  const wallets = await prisma.$transaction([
    prisma.merchantWallet.create({
      data: { merchantId: merchants[0].id, balance: 125000, totalEarned: 450000, totalCommissionPaid: 22500, pendingWithdrawal: 15000 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: merchants[1].id, balance: 230000, totalEarned: 780000, totalCommissionPaid: 39000, pendingWithdrawal: 25000 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: merchants[2].id, balance: 85000, totalEarned: 320000, totalCommissionPaid: 16000, pendingWithdrawal: 0 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: serviceProviders[0].id, balance: 45000, totalEarned: 180000, totalCommissionPaid: 9000, pendingWithdrawal: 5000 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: serviceProviders[1].id, balance: 62000, totalEarned: 250000, totalCommissionPaid: 12500, pendingWithdrawal: 8000 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: serviceProviders[2].id, balance: 38000, totalEarned: 150000, totalCommissionPaid: 7500, pendingWithdrawal: 0 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: rentalProviders[0].id, balance: 120000, totalEarned: 520000, totalCommissionPaid: 26000, pendingWithdrawal: 20000 },
    }),
    prisma.merchantWallet.create({
      data: { merchantId: rentalProviders[1].id, balance: 95000, totalEarned: 410000, totalCommissionPaid: 20500, pendingWithdrawal: 12000 },
    }),
  ])

  console.log(`  ✅ Created ${wallets.length} merchant wallets`)

  // ─── 6. ORDERS + ORDER ITEMS ────────────────────────────────────────────────
  console.log('🛒 Creating orders...')

  // Order 1: fatima buys phone from algeria_electro
  const order1 = await prisma.order.create({
    data: {
      customerId: customers[0].id,
      merchantId: merchants[1].id,
      totalAmount: 45000,
      commissionAmount: 2250,
      status: 'delivered',
      paymentMethod: 'cod',
      deliveryAddress: 'براقي، الجزائر العاصمة',
      trackingNumber: 'DZ-2024-001',
      notes: 'التوصيل في الصباح إذا ممكن',
      items: {
        create: [
          { productId: products[16].id, quantity: 1, unitPrice: 45000 },
        ],
      },
    },
  })

  // Order 2: mohamed buys clothing from anaka_moda
  const order2 = await prisma.order.create({
    data: {
      customerId: customers[1].id,
      merchantId: merchants[2].id,
      totalAmount: 15500,
      commissionAmount: 775,
      status: 'shipped',
      paymentMethod: 'ccp',
      deliveryAddress: 'حي 500 مسكن، وهران',
      trackingNumber: 'DZ-2024-002',
      items: {
        create: [
          { productId: products[3].id, quantity: 1, unitPrice: 8000 },
          { productId: products[2].id, quantity: 1, unitPrice: 3500 },
          { productId: products[5].id, quantity: 1, unitPrice: 4000 },
        ],
      },
    },
  })

  // Order 3: amina buys food from noor_store
  const order3 = await prisma.order.create({
    data: {
      customerId: customers[2].id,
      merchantId: merchants[0].id,
      totalAmount: 7200,
      commissionAmount: 360,
      status: 'processing',
      paymentMethod: 'cod',
      deliveryAddress: 'المدينة الجديدة، قسنطينة',
      items: {
        create: [
          { productId: products[10].id, quantity: 2, unitPrice: 1800 },
          { productId: products[11].id, quantity: 3, unitPrice: 1200 },
        ],
      },
    },
  })

  // Order 4: omar buys laptop from algeria_electro
  const order4 = await prisma.order.create({
    data: {
      customerId: customers[3].id,
      merchantId: merchants[1].id,
      totalAmount: 77500,
      commissionAmount: 3875,
      status: 'new',
      paymentMethod: 'bank_transfer',
      deliveryAddress: 'وسط المدينة، تلمسان',
      items: {
        create: [
          { productId: products[19].id, quantity: 1, unitPrice: 75000 },
          { productId: products[20].id, quantity: 1, unitPrice: 2500 },
        ],
      },
    },
  })

  // Order 5: leila buys washing machine from algeria_electro
  const order5 = await prisma.order.create({
    data: {
      customerId: customers[4].id,
      merchantId: merchants[1].id,
      totalAmount: 58000,
      commissionAmount: 2900,
      status: 'delivered',
      paymentMethod: 'cod',
      deliveryAddress: 'سيدي فرج، العاصمة',
      items: {
        create: [
          { productId: products[7].id, quantity: 1, unitPrice: 58000 },
        ],
      },
    },
  })

  // Order 6: fatima buys furniture from noor_store
  const order6 = await prisma.order.create({
    data: {
      customerId: customers[0].id,
      merchantId: merchants[0].id,
      totalAmount: 48000,
      commissionAmount: 2400,
      status: 'processing',
      paymentMethod: 'ccp',
      deliveryAddress: 'براقي، الجزائر العاصمة',
      items: {
        create: [
          { productId: products[15].id, quantity: 1, unitPrice: 48000 },
        ],
      },
    },
  })

  // Order 7: mohamed buys cosmetics from anaka_moda
  const order7 = await prisma.order.create({
    data: {
      customerId: customers[1].id,
      merchantId: merchants[2].id,
      totalAmount: 12000,
      commissionAmount: 600,
      status: 'delivered',
      paymentMethod: 'cod',
      deliveryAddress: 'حي 500 مسكن، وهران',
      items: {
        create: [
          { productId: products[13].id, quantity: 1, unitPrice: 7500 },
          { productId: products[14].id, quantity: 1, unitPrice: 4500 },
        ],
      },
    },
  })

  console.log(`  ✅ Created 7 orders with order items`)

  // ─── 7. REVIEWS ─────────────────────────────────────────────────────────────
  console.log('⭐ Creating reviews...')

  const reviewsData = [
    { reviewerId: customers[0].id, targetId: products[16].id, targetType: 'product', rating: 5, comment: 'هاتف ممتاز، الجودة عالية والتوصيل سريع. شكراً!' },
    { reviewerId: customers[1].id, targetId: products[3].id, targetType: 'product', rating: 4, comment: 'عباية جميلة جداً والتطريز دقيق، لكن اللون أفتح قليلاً من الصورة' },
    { reviewerId: customers[1].id, targetId: products[2].id, targetType: 'product', rating: 5, comment: 'قميص مريح وقماشه ممتاز، أنصح به' },
    { reviewerId: customers[4].id, targetId: products[7].id, targetType: 'product', rating: 4, comment: 'غسالة جيدة والبرامج متعددة، الصوت مقبول' },
    { reviewerId: customers[0].id, targetId: products[15].id, targetType: 'product', rating: 3, comment: 'الخزانة جميلة لكن التركيب كان صعباً والتعليمات غير واضحة' },
    { reviewerId: customers[2].id, targetId: merchants[0].id, targetType: 'merchant', rating: 5, comment: 'متجر النور من أفضل المتاجر، خدمة ممتازة وأسعار معقولة' },
    { reviewerId: customers[0].id, targetId: merchants[1].id, targetType: 'merchant', rating: 4, comment: 'إلكترونيات الجزائر موثوقة والتوصيل سريع للعاصمة' },
    { reviewerId: customers[1].id, targetId: serviceProviders[0].id, targetType: 'provider', rating: 5, comment: 'الأخ كريم سباك محترف، أصلح التسرب في وقت قياسي. أنصح الجميع!' },
    { reviewerId: customers[3].id, targetId: serviceProviders[1].id, targetType: 'provider', rating: 4, comment: 'خدمة كهربائية جيدة، تم تركيب اللوحة بنظافة واحترافية' },
    { reviewerId: customers[4].id, targetId: serviceProviders[2].id, targetType: 'provider', rating: 5, comment: 'تركيب المكيف كان ممتاز، الأخ ياسين ملتزم بالمواعيد ونظيف في عمله' },
  ]

  const reviews = await prisma.$transaction(
    reviewsData.map(data => prisma.review.create({ data }))
  )

  console.log(`  ✅ Created ${reviews.length} reviews`)

  // ─── 8. NOTIFICATIONS ───────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...')

  const notificationsData = [
    { userId: merchants[0].id, title: 'طلب جديد', message: 'لقد استلمت طلباً جديداً من أمينة بقيمة 7,200 د.ج', type: 'order' },
    { userId: merchants[1].id, title: 'طلب جديد', message: 'لقد استلمت طلباً جديداً من عمر بقيمة 77,500 د.ج', type: 'order' },
    { userId: merchants[1].id, title: 'تحديث حالة الطلب', message: 'تم توصيل الطلب DZ-2024-001 بنجاح إلى الزبونة فاطمة', type: 'order' },
    { userId: customers[0].id, title: 'تم توصيل طلبك', message: 'تم توصيل طلبك رقم DZ-2024-001 بنجاح. شكراً لاختيارك DEAL!', type: 'order' },
    { userId: customers[1].id, title: 'تم شحن طلبك', message: 'تم شحن طلبك رقم DZ-2024-002 وهو في الطريق إليك', type: 'order' },
    { userId: customers[3].id, title: 'تأكيد الطلب', message: 'تم تأكيد طلبك رقم DZ-2024-004 وبانتظار الدفع', type: 'payment' },
    { userId: merchants[0].id, title: 'تقييم جديد', message: 'حصلت على تقييم 5 نجوم من الزبونة أمينة', type: 'info' },
    { userId: serviceProviders[0].id, title: 'تقييم جديد', message: 'حصلت على تقييم 5 نجوم من الزبون محمد. أحسنت!', type: 'info' },
    { userId: admin.id, title: 'تقرير يومي', message: 'تم تسجيل 7 طلبات جديدة اليوم بإجمالي 263,200 د.ج', type: 'system' },
    { userId: merchants[1].id, title: 'عمولة مستحقة', message: 'عمولة مستحقة بقيمة 2,900 د.ج على الطلب DZ-2024-005', type: 'payment' },
    { userId: customers[0].id, title: 'عرض خاص', message: 'خصم 20% على جميع منتجات الإلكترونيات هذا الأسبوع!', type: 'info', isRead: true },
    { userId: customers[2].id, title: 'مرحباً بك في DEAL', message: 'أهلاً وسهلاً بك في منصة DEAL! استكشف آلاف المنتجات والخدمات', type: 'system', isRead: true },
  ]

  const notifications = await prisma.$transaction(
    notificationsData.map(data => prisma.notification.create({ data }))
  )

  console.log(`  ✅ Created ${notifications.length} notifications`)

  // ─── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50))
  console.log('🎉 DEAL Platform seed completed successfully!')
  console.log('═'.repeat(50))
  console.log(`  📂 Categories:    ${categories.length}`)
  console.log(`  👤 Users:         ${1 + merchants.length + serviceProviders.length + rentalProviders.length + customers.length}`)
  console.log(`  📦 Products:      ${products.length}`)
  console.log(`  🔧 Services:      ${services.length}`)
  console.log(`  🏗️ Rentals:       ${rentals.length}`)
  console.log(`  💰 Wallets:       ${wallets.length}`)
  console.log(`  🛒 Orders:        7`)
  console.log(`  ⭐ Reviews:       ${reviews.length}`)
  console.log(`  🔔 Notifications: ${notifications.length}`)
  console.log('═'.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
