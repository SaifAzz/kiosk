import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  console.log('Starting product seeding...');
  
  // First, delete existing products
  await prisma.product.deleteMany();
  console.log('Cleared existing products');
  
  // Get countries to reference them
  const countries = await prisma.country.findMany();
  
  if (countries.length === 0) {
    console.error('No countries found. Please run the main seed file first.');
    return;
  }
  
  // Group countries by name for easier reference
  const countryMap = countries.reduce((acc, country) => {
    acc[country.name] = country;
    return acc;
  }, {} as Record<string, any>);
  
  // Enhanced product list
  const products = [
    // Food items
    {
      name: 'Snickers',
      image: '/products/snickers.jpg',
      purchaseCost: 1.00,
      sellingPrice: 1.50,
      stock: 50
    },
    {
      name: 'Chips',
      image: '/products/chips.jpg',
      purchaseCost: 0.75,
      sellingPrice: 1.00,
      stock: 75
    },
    {
      name: 'Water',
      image: '/products/water.jpg',
      purchaseCost: 0.50,
      sellingPrice: 0.75,
      stock: 100
    },
    {
      name: 'Cola',
      image: '/products/water.jpg', // Using water image as placeholder
      purchaseCost: 0.80,
      sellingPrice: 1.25,
      stock: 60
    },
    {
      name: 'Sandwich',
      image: '/products/chips.jpg', // Using chips image as placeholder
      purchaseCost: 2.00,
      sellingPrice: 3.00,
      stock: 25
    }
  ];
  
  // Create products for each country
  for (const countryName of Object.keys(countryMap)) {
    const country = countryMap[countryName];
    
    for (const product of products) {
      await prisma.product.create({
        data: {
          ...product,
          countryId: country.id
        }
      });
    }
    
    console.log(`Created ${products.length} products for ${countryName}`);
  }
  
  console.log('Product seeding completed successfully');
}

// Execute the function
seedProducts()
  .catch((e) => {
    console.error('Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 