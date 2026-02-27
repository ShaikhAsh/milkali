require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const admin = await prisma.user.upsert({
        where: { email: 'admin@milkali.com' },
        update: {},
        create: {
            email: 'admin@milkali.com',
            name: 'Admin',
            role: 'ADMIN',
            isVerified: true,
        }
    })
    await prisma.wallet.upsert({
        where: { userId: admin.id },
        update: {},
        create: { userId: admin.id, balance: 0 }
    })
    console.log('✅ Admin user created: admin@milkali.com')

    // Create demo customer
    const customer = await prisma.user.upsert({
        where: { email: 'demo@milkali.com' },
        update: {},
        create: {
            email: 'demo@milkali.com',
            name: 'Demo Customer',
            role: 'B2C',
            isVerified: true,
        }
    })
    await prisma.wallet.upsert({
        where: { userId: customer.id },
        update: {},
        create: { userId: customer.id, balance: 1000 }
    })
    console.log('✅ Demo customer created: demo@milkali.com')

    // Create product
    const product = await prisma.product.upsert({
        where: { slug: 'milk-ali-desi-cow-milk' },
        update: {},
        create: {
            name: 'Milk Ali - Premium Desi Cow Milk',
            slug: 'milk-ali-desi-cow-milk',
            description: 'Farm-fresh, pure Desi Cow Milk sourced directly from village farms. No adulteration, no preservatives — just pure goodness delivered fresh to your doorstep every morning in Mumbai.',
            category: 'Desi Cow Milk',
            imageUrl: '/milk-bottle.png',
        }
    })

    // Create variants
    await prisma.productVariant.upsert({
        where: { id: 'variant-500ml' },
        update: {},
        create: {
            id: 'variant-500ml',
            productId: product.id,
            name: 'Milk Ali 500ml',
            size: '500ml',
            price: 35,
            mrp: 40,
            unit: 'ml',
        }
    })

    await prisma.productVariant.upsert({
        where: { id: 'variant-1l' },
        update: {},
        create: {
            id: 'variant-1l',
            productId: product.id,
            name: 'Milk Ali 1 Litre',
            size: '1L',
            price: 65,
            mrp: 75,
            unit: 'ml',
        }
    })
    console.log('✅ Product & variants created')

    // Create serviceable areas (Mumbai PIN codes)
    const mumbaiAreas = [
        { pincode: '400001', area: 'Fort' },
        { pincode: '400002', area: 'Kalbadevi' },
        { pincode: '400003', area: 'Mandvi' },
        { pincode: '400004', area: 'Girgaon' },
        { pincode: '400005', area: 'Colaba' },
        { pincode: '400006', area: 'Malabar Hill' },
        { pincode: '400007', area: 'Grant Road' },
        { pincode: '400008', area: 'Mumbai Central' },
        { pincode: '400009', area: 'Masjid Bunder' },
        { pincode: '400010', area: 'Mazgaon' },
        { pincode: '400011', area: 'Jacob Circle' },
        { pincode: '400012', area: 'Lalbaug' },
        { pincode: '400013', area: 'Delisle Road' },
        { pincode: '400014', area: 'Dadar' },
        { pincode: '400015', area: 'Sewri' },
        { pincode: '400016', area: 'Mahim' },
        { pincode: '400017', area: 'Dharavi' },
        { pincode: '400018', area: 'Worli' },
        { pincode: '400019', area: 'Sion' },
        { pincode: '400020', area: 'Churchgate' },
        { pincode: '400021', area: 'Nariman Point' },
        { pincode: '400022', area: 'Breach Candy' },
        { pincode: '400025', area: 'Prabhadevi' },
        { pincode: '400026', area: 'Parel' },
        { pincode: '400028', area: 'Dadar East' },
        { pincode: '400030', area: 'Wadala' },
        { pincode: '400031', area: 'Matunga' },
        { pincode: '400033', area: 'Cotton Green' },
        { pincode: '400034', area: 'Kings Circle' },
        { pincode: '400037', area: 'Antop Hill' },
        { pincode: '400042', area: 'Kurla' },
        { pincode: '400049', area: 'Juhu' },
        { pincode: '400050', area: 'Bandra West' },
        { pincode: '400051', area: 'Bandra East' },
        { pincode: '400052', area: 'Khar' },
        { pincode: '400053', area: 'Santacruz West' },
        { pincode: '400054', area: 'Santacruz East' },
        { pincode: '400055', area: 'Vile Parle East' },
        { pincode: '400056', area: 'Vile Parle West' },
        { pincode: '400057', area: 'Andheri West' },
        { pincode: '400058', area: 'Andheri East' },
        { pincode: '400059', area: 'Jogeshwari' },
        { pincode: '400060', area: 'Jogeshwari East' },
        { pincode: '400061', area: 'Goregaon West' },
        { pincode: '400062', area: 'Goregaon East' },
        { pincode: '400063', area: 'Goregaon' },
        { pincode: '400064', area: 'Malad West' },
        { pincode: '400066', area: 'Borivali' },
        { pincode: '400067', area: 'Kandivali' },
        { pincode: '400068', area: 'Dahisar' },
        { pincode: '400069', area: 'Andheri' },
        { pincode: '400070', area: 'Kurla West' },
        { pincode: '400071', area: 'Chembur' },
        { pincode: '400072', area: 'Vikhroli' },
        { pincode: '400074', area: 'Ghatkopar West' },
        { pincode: '400075', area: 'Ghatkopar East' },
        { pincode: '400076', area: 'Powai' },
        { pincode: '400077', area: 'Mulund East' },
        { pincode: '400078', area: 'Bhandup' },
        { pincode: '400079', area: 'Vikhroli East' },
        { pincode: '400080', area: 'Mulund West' },
        { pincode: '400086', area: 'Ghatkopar' },
        { pincode: '400088', area: 'Tilak Nagar' },
        { pincode: '400089', area: 'Govandi' },
        { pincode: '400091', area: 'Borivali East' },
        { pincode: '400092', area: 'Borivali West' },
        { pincode: '400093', area: 'Kandivali East' },
        { pincode: '400097', area: 'Malad East' },
        { pincode: '400098', area: 'Goregaon North' },
        { pincode: '400099', area: 'Versova' },
        { pincode: '400101', area: 'Kandivali West' },
        { pincode: '400102', area: 'Andheri East MIDC' },
        { pincode: '400103', area: 'Andheri West Link Rd' },
        { pincode: '400104', area: 'Dahisar East' },
    ]

    for (const area of mumbaiAreas) {
        await prisma.serviceableArea.upsert({
            where: { pincode: area.pincode },
            update: {},
            create: area,
        })
    }
    console.log('✅ ' + mumbaiAreas.length + ' serviceable areas created')

    // Create sample coupons
    await prisma.coupon.upsert({
        where: { code: 'WELCOME10' },
        update: {},
        create: {
            code: 'WELCOME10',
            description: 'Welcome Offer - 10% off on first order',
            type: 'PERCENTAGE',
            value: 10,
            maxDiscount: 50,
            usageLimit: 1000,
            validFrom: new Date(),
            validUntil: new Date('2027-12-31'),
        }
    })

    await prisma.coupon.upsert({
        where: { code: 'MILK50' },
        update: {},
        create: {
            code: 'MILK50',
            description: 'Flat Rs.50 off on orders above Rs.500',
            type: 'FLAT',
            value: 50,
            minOrder: 500,
            usageLimit: 500,
            validFrom: new Date(),
            validUntil: new Date('2027-12-31'),
        }
    })
    console.log('✅ Sample coupons created')

    console.log('')
    console.log('🎉 Database seeded successfully!')
    console.log('')
    console.log('📋 Quick Access:')
    console.log('   Admin: admin@milkali.com')
    console.log('   Demo Customer: demo@milkali.com')
    console.log('   (Use OTP login - OTP will be logged to console)')
}

main()
    .then(async () => { await prisma.$disconnect() })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
