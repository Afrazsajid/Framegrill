import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (order matters for FK constraints)
  await prisma.upsellRuleProduct.deleteMany();
  await prisma.upsellRule.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.itemAddon.deleteMany();
  await prisma.itemVariation.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.deliveryArea.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create restaurant branding
  await prisma.restaurant.create({
    data: {
      name: "FlameGrill",
      tagline: "Premium Burgers & Grills Since 2018",
      logo: "",
      phone: "+1 555-123-4567",
      email: "hello@flamegrill.com",
      address: "123 Main Street, Downtown, New York, NY 10001",
      openHours: "Mon-Thu: 10AM-10PM | Fri-Sat: 10AM-12AM | Sun: 11AM-9PM",
      primaryColor: "#DC2626",
      secondaryColor: "#1E3A5F",
      accentColor: "#F59E0B",
      currency: "$",
      currencyCode: "USD",
      deliveryFee: 2.99,
      minOrder: 15.0,
      deliveryRadius: 10.0,
      socialFacebook: "https://facebook.com/flamegrill",
      socialInstagram: "https://instagram.com/flamegrill",
      socialTwitter: "https://twitter.com/flamegrill",
      heroImages: JSON.stringify([
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=600&fit=crop",
        "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&h=600&fit=crop",
        "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1200&h=600&fit=crop"
      ]),
      termsLink: "/terms",
      privacyLink: "/privacy",
    },
  });

  // Create delivery areas with real Karachi coordinates
  await prisma.deliveryArea.createMany({
    data: [
      { name: 'Saddar', slug: 'saddar', isActive: true, sortOrder: 1, latitude: 24.8607, longitude: 67.0011, radiusKm: 3.0 },
      { name: 'Burns Road', slug: 'burns-road', isActive: true, sortOrder: 2, latitude: 24.8601, longitude: 67.0103, radiusKm: 2.5 },
      { name: 'Gulshan-e-Iqbal', slug: 'gulshan-e-iqbal', isActive: true, sortOrder: 3, latitude: 24.9138, longitude: 67.0936, radiusKm: 4.0 },
      { name: 'Gulshan-e-Johar', slug: 'gulshan-e-johar', isActive: true, sortOrder: 4, latitude: 24.9280, longitude: 67.0955, radiusKm: 3.5 },
    ],
  });

  // Create categories
  const burgers = await prisma.category.create({
    data: { name: "Signature Burgers", description: "Our award-winning handcrafted burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", sortOrder: 1, isActive: true },
  });
  const chicken = await prisma.category.create({
    data: { name: "Chicken & Wings", description: "Crispy, juicy, and full of flavor", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=300&fit=crop", sortOrder: 2, isActive: true },
  });
  const sides = await prisma.category.create({
    data: { name: "Sides & Snacks", description: "Perfect companions to your meal", image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&h=300&fit=crop", sortOrder: 3, isActive: true },
  });
  const drinks = await prisma.category.create({
    data: { name: "Beverages", description: "Refreshing drinks for every taste", image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=300&fit=crop", sortOrder: 4, isActive: true },
  });
  const desserts = await prisma.category.create({
    data: { name: "Desserts", description: "Sweet endings to your meal", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop", sortOrder: 5, isActive: true },
  });
  const wraps = await prisma.category.create({
    data: { name: "Wraps & Salads", description: "Fresh, healthy, and satisfying", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", sortOrder: 6, isActive: true },
  });

  // Menu Items - Signature Burgers
  const classicBurger = await prisma.menuItem.create({
    data: {
      name: "The Classic Flame",
      description: "Our signature 200g Angus beef patty, aged cheddar, crispy lettuce, vine-ripened tomatoes, pickles, and our secret FlameGrill sauce on a toasted brioche bun.",
      price: 12.99,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=400&fit=crop",
      categoryId: burgers.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: false, calories: 750, prepTime: 15,
      variations: {
        create: [
          { name: "Single", priceMod: 0, isDefault: true },
          { name: "Double", priceMod: 4.50 },
          { name: "Triple", priceMod: 8.00 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Cheese", price: 1.50 },
          { name: "Bacon", price: 2.00 },
          { name: "Avocado", price: 1.75 },
          { name: "Jalapeños", price: 0.75 },
          { name: "Fried Egg", price: 1.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const smokyBBQ = await prisma.menuItem.create({
    data: {
      name: "Smoky BBQ Blaze",
      description: "Char-grilled 200g beef patty glazed with smoky BBQ sauce, crispy onion rings, smoked gouda, and tangy coleslaw on a pretzel bun.",
      price: 14.99,
      image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=400&fit=crop",
      categoryId: burgers.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: false, calories: 820, prepTime: 18,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Large", priceMod: 3.00 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Onion Rings", price: 1.50 },
          { name: "Double Patties", price: 4.00 },
          { name: "Extra BBQ Sauce", price: 0.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const spicyInferno = await prisma.menuItem.create({
    data: {
      name: "Spicy Inferno",
      description: "For the brave! A fiery blend of habanero sauce, pepper jack cheese, fresh jalapeños, and crispy fried onions on a chipotle-infused bun.",
      price: 13.99,
      image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&h=400&fit=crop",
      categoryId: burgers.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: true, isVegetarian: false, calories: 780, prepTime: 16,
      variations: {
        create: [
          { name: "Mild Heat", priceMod: 0 },
          { name: "Medium Heat", priceMod: 0, isDefault: true },
          { name: "Inferno", priceMod: 0 },
        ],
      },
      addons: {
        create: [
          { name: "Ghost Pepper Sauce", price: 1.00 },
          { name: "Extra Jalapeños", price: 0.75 },
          { name: "Creamy Ranch", price: 0.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const mushroomSwiss = await prisma.menuItem.create({
    data: {
      name: "Mushroom Swiss",
      description: "Sautéed wild mushrooms with melted Swiss cheese, garlic aioli, and fresh arugula on a toasted sourdough bun.",
      price: 14.49,
      image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&h=400&fit=crop",
      categoryId: burgers.id,
      isAvailable: true, isPopular: false, isNew: true, isSpicy: false, isVegetarian: false, calories: 710, prepTime: 17,
      variations: {
        create: [
          { name: "Single", priceMod: 0, isDefault: true },
          { name: "Double", priceMod: 4.50 },
        ],
      },
      addons: {
        create: [
          { name: "Truffle Oil", price: 2.00 },
          { name: "Caramelized Onions", price: 1.25 },
          { name: "Extra Swiss", price: 1.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const veggieBurger = await prisma.menuItem.create({
    data: {
      name: "Garden Veggie Burger",
      description: "House-made quinoa and black bean patty with fresh avocado, sprouts, tomato, and herb garlic aioli on a whole wheat bun.",
      price: 11.99,
      image: "https://images.unsplash.com/photo-1520072959219-c595e6cdc07e?w=500&h=400&fit=crop",
      categoryId: burgers.id,
      isAvailable: true, isPopular: false, isNew: true, isSpicy: false, isVegetarian: true, calories: 520, prepTime: 14,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Large", priceMod: 2.50 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Avocado", price: 1.75 },
          { name: "Hummus", price: 1.00 },
          { name: "Feta Cheese", price: 1.25 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  // Chicken & Wings
  const crispyChicken = await prisma.menuItem.create({
    data: {
      name: "Crispy Chicken Burger",
      description: "Buttermilk-brined chicken breast, hand-breaded and fried to golden perfection with pickles and spicy mayo on a buttery bun.",
      price: 11.49,
      image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500&h=400&fit=crop",
      categoryId: chicken.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: false, calories: 680, prepTime: 16,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Spicy", priceMod: 0 },
          { name: "Deluxe (with cheese & bacon)", priceMod: 2.50 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Spicy Mayo", price: 0.50 },
          { name: "Cheese", price: 1.00 },
          { name: "Bacon", price: 2.00 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const buffaloWings = await prisma.menuItem.create({
    data: {
      name: "Buffalo Wings (8pc)",
      description: "Eight crispy fried chicken wings tossed in our tangy buffalo sauce. Served with blue cheese dip and celery sticks.",
      price: 10.99,
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&h=400&fit=crop",
      categoryId: chicken.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: true, isVegetarian: false, calories: 890, prepTime: 20,
      variations: {
        create: [
          { name: "Mild", priceMod: 0 },
          { name: "Medium", priceMod: 0, isDefault: true },
          { name: "Hot", priceMod: 0 },
          { name: "Inferno", priceMod: 0 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Sauce", price: 0.75 },
          { name: "Ranch Dip", price: 0.50 },
          { name: "4 Extra Wings", price: 4.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const chickenTenders = await prisma.menuItem.create({
    data: {
      name: "Chicken Tenders (6pc)",
      description: "Six hand-breaded chicken tenderloins, golden fried and served with your choice of dipping sauce.",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&h=400&fit=crop",
      categoryId: chicken.id,
      isAvailable: true, isPopular: false, isNew: false, isSpicy: false, isVegetarian: false, calories: 620, prepTime: 14,
      variations: {
        create: [
          { name: "Original", priceMod: 0, isDefault: true },
          { name: "Spicy", priceMod: 0 },
          { name: "Honey Mustard Glazed", priceMod: 1.00 },
        ],
      },
      addons: {
        create: [
          { name: "BBQ Sauce", price: 0.50 },
          { name: "Honey Mustard", price: 0.50 },
          { name: "Garlic Parmesan", price: 0.50 },
          { name: "3 Extra Tenders", price: 3.00 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  // Sides
  const loadedFries = await prisma.menuItem.create({
    data: {
      name: "Loaded Flame Fries",
      description: "Crispy golden fries topped with melted cheese sauce, crispy bacon bits, jalapeños, and a drizzle of sour cream.",
      price: 7.99,
      image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=500&h=400&fit=crop",
      categoryId: sides.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: false, calories: 650, prepTime: 10,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Large", priceMod: 2.50 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Cheese", price: 1.00 },
          { name: "Extra Bacon", price: 1.50 },
          { name: "Chili Con Carne", price: 2.00 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const onionRings = await prisma.menuItem.create({
    data: {
      name: "Crispy Onion Rings",
      description: "Thick-cut onion rings in a seasoned crispy batter. Light, crunchy, and irresistible.",
      price: 5.99,
      image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&h=400&fit=crop",
      categoryId: sides.id,
      isAvailable: true, isPopular: false, isNew: false, isSpicy: false, isVegetarian: true, calories: 420, prepTime: 8,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Large", priceMod: 2.00 },
        ],
      },
      addons: {
        create: [
          { name: "Ranch Dip", price: 0.50 },
          { name: "BBQ Dip", price: 0.50 },
          { name: "Chipotle Mayo", price: 0.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const coleslaw = await prisma.menuItem.create({
    data: {
      name: "Fresh Coleslaw",
      description: "Crunchy cabbage and carrot slaw tossed in our creamy house dressing.",
      price: 3.99,
      image: "https://images.unsplash.com/photo-1625938145744-533e82e53957?w=500&h=400&fit=crop",
      categoryId: sides.id,
      isAvailable: true, isPopular: false, isNew: false, isSpicy: false, isVegetarian: true, calories: 180, prepTime: 5,
      variations: { create: [{ name: "Regular", priceMod: 0, isDefault: true }] },
      addons: { create: [{ name: "Extra Dressing", price: 0.25 }] },
    },
    include: { variations: true, addons: true },
  });

  const macCheese = await prisma.menuItem.create({
    data: {
      name: "Truffle Mac & Cheese",
      description: "Creamy three-cheese macaroni with a hint of truffle oil, topped with crispy breadcrumbs.",
      price: 6.99,
      image: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=500&h=400&fit=crop",
      categoryId: sides.id,
      isAvailable: true, isPopular: true, isNew: true, isSpicy: false, isVegetarian: true, calories: 520, prepTime: 12,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Large", priceMod: 3.00 },
        ],
      },
      addons: {
        create: [
          { name: "Bacon Bits", price: 1.50 },
          { name: "Extra Truffle Oil", price: 1.00 },
          { name: "Breaded Topping", price: 0.75 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  // Beverages
  const milkshake = await prisma.menuItem.create({
    data: {
      name: "Premium Milkshake",
      description: "Thick, creamy milkshake made with real ice cream. Available in classic flavors.",
      price: 5.99,
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=400&fit=crop",
      categoryId: drinks.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: true, calories: 450, prepTime: 5,
      variations: {
        create: [
          { name: "Chocolate", priceMod: 0, isDefault: true },
          { name: "Vanilla", priceMod: 0 },
          { name: "Strawberry", priceMod: 0 },
          { name: "Oreo", priceMod: 1.00 },
          { name: "Salted Caramel", priceMod: 1.00 },
        ],
      },
      addons: {
        create: [
          { name: "Whipped Cream", price: 0.50 },
          { name: "Extra Shot of Syrup", price: 0.75 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const freshLemonade = await prisma.menuItem.create({
    data: {
      name: "Fresh Squeezed Lemonade",
      description: "Hand-squeezed lemonade with just the right balance of sweet and tart. Refreshingly cold.",
      price: 3.99,
      image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&h=400&fit=crop",
      categoryId: drinks.id,
      isAvailable: true, isPopular: false, isNew: false, isSpicy: false, isVegetarian: true, calories: 120, prepTime: 3,
      variations: {
        create: [
          { name: "Classic", priceMod: 0, isDefault: true },
          { name: "Mint", priceMod: 0.50 },
          { name: "Strawberry", priceMod: 1.00 },
          { name: "Lavender", priceMod: 1.00 },
        ],
      },
      addons: { create: [{ name: "Extra Sweet", price: 0.00 }] },
    },
    include: { variations: true, addons: true },
  });

  const icedCoffee = await prisma.menuItem.create({
    data: {
      name: "Iced Coffee",
      description: "Cold-brewed coffee served over ice with your choice of milk and sweetener.",
      price: 4.49,
      image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&h=400&fit=crop",
      categoryId: drinks.id,
      isAvailable: true, isPopular: false, isNew: true, isSpicy: false, isVegetarian: true, calories: 80, prepTime: 3,
      variations: {
        create: [
          { name: "Black", priceMod: 0, isDefault: true },
          { name: "With Milk", priceMod: 0.50 },
          { name: "Vanilla Latte", priceMod: 1.00 },
          { name: "Caramel Latte", priceMod: 1.00 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.50 },
          { name: "Whipped Cream", price: 0.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  // Desserts
  const churros = await prisma.menuItem.create({
    data: {
      name: "Churros with Chocolate",
      description: "Warm, crispy churros dusted with cinnamon sugar, served with rich dark chocolate dipping sauce.",
      price: 5.49,
      image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&h=400&fit=crop",
      categoryId: desserts.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: true, calories: 380, prepTime: 8,
      variations: {
        create: [
          { name: "6 Pieces", priceMod: 0, isDefault: true },
          { name: "12 Pieces", priceMod: 3.00 },
        ],
      },
      addons: {
        create: [
          { name: "Caramel Sauce", price: 0.50 },
          { name: "Dulce de Leche", price: 0.75 },
          { name: "Strawberry Sauce", price: 0.50 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const brownie = await prisma.menuItem.create({
    data: {
      name: "Lava Brownie",
      description: "Warm, fudgy chocolate brownie with a molten center, served with vanilla ice cream.",
      price: 6.99,
      image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500&h=400&fit=crop",
      categoryId: desserts.id,
      isAvailable: true, isPopular: true, isNew: false, isSpicy: false, isVegetarian: true, calories: 520, prepTime: 10,
      variations: { create: [{ name: "Regular", priceMod: 0, isDefault: true }] },
      addons: {
        create: [
          { name: "Extra Ice Cream Scoop", price: 1.50 },
          { name: "Whipped Cream", price: 0.50 },
          { name: "Nuts", price: 0.75 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  // Wraps & Salads
  const caesarWrap = await prisma.menuItem.create({
    data: {
      name: "Grilled Chicken Caesar Wrap",
      description: "Tender grilled chicken, crisp romaine, parmesan cheese, and creamy Caesar dressing wrapped in a warm flour tortilla.",
      price: 10.49,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop",
      categoryId: wraps.id,
      isAvailable: true, isPopular: false, isNew: false, isSpicy: false, isVegetarian: false, calories: 480, prepTime: 10,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Large", priceMod: 2.50 },
        ],
      },
      addons: {
        create: [
          { name: "Avocado", price: 1.75 },
          { name: "Bacon", price: 2.00 },
          { name: "Extra Chicken", price: 3.00 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  const greekSalad = await prisma.menuItem.create({
    data: {
      name: "Mediterranean Bowl",
      description: "Mixed greens, cherry tomatoes, cucumber, olives, feta cheese, and grilled halloumi with herb vinaigrette.",
      price: 9.99,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=400&fit=crop",
      categoryId: wraps.id,
      isAvailable: true, isPopular: false, isNew: true, isSpicy: false, isVegetarian: true, calories: 350, prepTime: 8,
      variations: {
        create: [
          { name: "Regular", priceMod: 0, isDefault: true },
          { name: "Add Grilled Chicken", priceMod: 3.00 },
          { name: "Add Grilled Salmon", priceMod: 5.00 },
        ],
      },
      addons: {
        create: [
          { name: "Extra Feta", price: 1.25 },
          { name: "Pita Bread", price: 1.00 },
          { name: "Tzatziki Sauce", price: 0.75 },
        ],
      },
    },
    include: { variations: true, addons: true },
  });

  // Create Riders
  const riders = await Promise.all([
    prisma.rider.create({
      data: { name: "Alex Rodriguez", phone: "+1 555-201-0001", email: "alex@riders.com", vehicleType: "motorcycle", isAvailable: true, password: "rider123" },
    }),
    prisma.rider.create({
      data: { name: "Sarah Chen", phone: "+1 555-201-0002", email: "sarah@riders.com", vehicleType: "scooter", isAvailable: true, password: "rider123" },
    }),
    prisma.rider.create({
      data: { name: "Mike Johnson", phone: "+1 555-201-0003", email: "mike@riders.com", vehicleType: "car", isAvailable: false, password: "rider123" },
    }),
    prisma.rider.create({
      data: { name: "Emma Wilson", phone: "+1 555-201-0004", email: "emma@riders.com", vehicleType: "bicycle", isAvailable: true, password: "rider123" },
    }),
  ]);

  // Create sample orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "FG-1001",
      customerName: "John Mitchell",
      customerPhone: "+1 555-301-0001",
      customerEmail: "john@email.com",
      deliveryAddress: "456 Oak Avenue, Apt 3B, New York, NY 10002",
      deliveryNotes: "Leave at the door, ring the bell",
      orderType: "delivery",
      paymentMethod: "cash",
      status: "delivered",
      subtotal: 31.97,
      deliveryFee: 2.99,
      total: 34.96,
      riderId: riders[0].id,
      items: {
        create: [
          { itemId: classicBurger.id, itemName: "The Classic Flame", itemImage: classicBurger.image, itemPrice: 12.99, quantity: 1, variation: "Double", addons: JSON.stringify(["Extra Cheese", "Bacon"]) },
          { itemId: loadedFries.id, itemName: "Loaded Flame Fries", itemImage: loadedFries.image, itemPrice: 7.99, quantity: 1, variation: "Regular", addons: null },
          { itemId: milkshake.id, itemName: "Premium Milkshake", itemImage: milkshake.image, itemPrice: 5.99, quantity: 1, variation: "Chocolate", addons: null },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "FG-1002",
      customerName: "Lisa Park",
      customerPhone: "+1 555-301-0002",
      customerEmail: "lisa@email.com",
      deliveryAddress: "789 Elm Street, New York, NY 10003",
      deliveryNotes: "",
      orderType: "delivery",
      paymentMethod: "counter",
      status: "on_the_way",
      subtotal: 25.98,
      deliveryFee: 2.99,
      total: 28.97,
      riderId: riders[1].id,
      items: {
        create: [
          { itemId: smokyBBQ.id, itemName: "Smoky BBQ Blaze", itemImage: smokyBBQ.image, itemPrice: 14.99, quantity: 1, variation: "Regular", addons: JSON.stringify(["Extra Onion Rings"]) },
          { itemId: onionRings.id, itemName: "Crispy Onion Rings", itemImage: onionRings.image, itemPrice: 5.99, quantity: 1, variation: "Regular", addons: null },
          { itemId: freshLemonade.id, itemName: "Fresh Squeezed Lemonade", itemImage: freshLemonade.image, itemPrice: 3.99, quantity: 1, variation: "Mint", addons: null },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: "FG-1003",
      customerName: "David Kim",
      customerPhone: "+1 555-301-0003",
      customerEmail: "david@email.com",
      deliveryAddress: "321 Pine Road, New York, NY 10004",
      deliveryNotes: "Call when arriving",
      orderType: "collection",
      paymentMethod: "cash",
      status: "preparing",
      subtotal: 28.98,
      deliveryFee: 0,
      total: 28.98,
      riderId: null,
      items: {
        create: [
          { itemId: spicyInferno.id, itemName: "Spicy Inferno", itemImage: spicyInferno.image, itemPrice: 13.99, quantity: 1, variation: "Inferno", addons: JSON.stringify(["Ghost Pepper Sauce"]) },
          { itemId: crispyChicken.id, itemName: "Crispy Chicken Burger", itemImage: crispyChicken.image, itemPrice: 11.49, quantity: 1, variation: "Spicy", addons: null },
          { itemId: icedCoffee.id, itemName: "Iced Coffee", itemImage: icedCoffee.image, itemPrice: 4.49, quantity: 1, variation: "Caramel Latte", addons: null },
        ],
      },
    },
  });

  const order4 = await prisma.order.create({
    data: {
      orderNumber: "FG-1004",
      customerName: "Anna Thompson",
      customerPhone: "+1 555-301-0004",
      customerEmail: "anna@email.com",
      deliveryAddress: "567 Maple Drive, Suite 12, New York, NY 10005",
      deliveryNotes: "Gate code: 4521",
      orderType: "delivery",
      paymentMethod: "cash",
      status: "pending",
      subtotal: 19.98,
      deliveryFee: 2.99,
      total: 22.97,
      riderId: null,
      items: {
        create: [
          { itemId: mushroomSwiss.id, itemName: "Mushroom Swiss", itemImage: mushroomSwiss.image, itemPrice: 14.49, quantity: 1, variation: "Single", addons: JSON.stringify(["Truffle Oil"]) },
          { itemId: coleslaw.id, itemName: "Fresh Coleslaw", itemImage: coleslaw.image, itemPrice: 3.99, quantity: 1, variation: "Regular", addons: null },
        ],
      },
    },
  });

  const order5 = await prisma.order.create({
    data: {
      orderNumber: "FG-1005",
      customerName: "Chris Martinez",
      customerPhone: "+1 555-301-0005",
      customerEmail: "chris@email.com",
      deliveryAddress: "890 Cedar Lane, New York, NY 10006",
      deliveryNotes: "",
      orderType: "delivery",
      paymentMethod: "counter",
      status: "accepted",
      subtotal: 39.96,
      deliveryFee: 2.99,
      total: 42.95,
      riderId: riders[3].id,
      items: {
        create: [
          { itemId: buffaloWings.id, itemName: "Buffalo Wings (8pc)", itemImage: buffaloWings.image, itemPrice: 10.99, quantity: 1, variation: "Hot", addons: JSON.stringify(["4 Extra Wings", "Ranch Dip"]) },
          { itemId: classicBurger.id, itemName: "The Classic Flame", itemImage: classicBurger.image, itemPrice: 12.99, quantity: 1, variation: "Triple", addons: JSON.stringify(["Bacon", "Fried Egg"]) },
          { itemId: macCheese.id, itemName: "Truffle Mac & Cheese", itemImage: macCheese.image, itemPrice: 6.99, quantity: 1, variation: "Large", addons: null },
          { itemId: brownie.id, itemName: "Lava Brownie", itemImage: brownie.image, itemPrice: 6.99, quantity: 1, variation: "Regular", addons: JSON.stringify(["Extra Ice Cream Scoop"]) },
        ],
      },
    },
  });

  const order6 = await prisma.order.create({
    data: {
      orderNumber: "FG-1006",
      customerName: "Rachel Green",
      customerPhone: "+1 555-301-0006",
      customerEmail: "rachel@email.com",
      deliveryAddress: "234 Birch Court, New York, NY 10007",
      deliveryNotes: "Please be quick, very hungry!",
      orderType: "delivery",
      paymentMethod: "cash",
      status: "cancelled",
      subtotal: 17.48,
      deliveryFee: 2.99,
      total: 20.47,
      riderId: null,
      items: {
        create: [
          { itemId: veggieBurger.id, itemName: "Garden Veggie Burger", itemImage: veggieBurger.image, itemPrice: 11.99, quantity: 1, variation: "Regular", addons: null },
          { itemId: greekSalad.id, itemName: "Mediterranean Bowl", itemImage: greekSalad.image, itemPrice: 9.99, quantity: 1, variation: "Add Grilled Chicken", addons: null },
        ],
      },
    },
  });

  // Create reviews for delivered order
  await prisma.review.create({
    data: {
      orderId: order1.id,
      itemId: classicBurger.id,
      rating: 5,
      comment: "Absolutely incredible burger! The Double Classic Flame is now my go-to. Perfectly cooked, amazing sauce, and the loaded fries were the cherry on top. Will order again!",
      customerName: "John Mitchell",
    },
  });

  // ---- Upsell Rules ----

  // Rule 1: Product-level — when viewing Classic Burger, suggest fries + drink
  const upsellClassic = await prisma.upsellRule.create({
    data: {
      name: "Burger Combo Suggestion",
      type: "product",
      triggerProductId: classicBurger.id,
      placement: "product_page",
      priority: 10,
      isActive: true,
      products: {
        create: [
          { productId: loadedFries.id, sortOrder: 1 },
          { productId: milkshake.id, sortOrder: 2 },
          { productId: onionRings.id, sortOrder: 3 },
        ],
      },
    },
  });

  // Rule 2: Product-level — when viewing Smoky BBQ, suggest drink
  const upsellBBQ = await prisma.upsellRule.create({
    data: {
      name: "BBQ Add-ons",
      type: "product",
      triggerProductId: smokyBBQ.id,
      placement: "product_page",
      priority: 10,
      isActive: true,
      products: {
        create: [
          { productId: coleslaw.id, sortOrder: 1 },
          { productId: freshLemonade.id, sortOrder: 2 },
        ],
      },
    },
  });

  // Rule 3: Category-level — any burger, suggest sides & drinks
  const upsellBurgerCat = await prisma.upsellRule.create({
    data: {
      name: "Burger Category Upsell",
      type: "category",
      triggerCategoryId: burgers.id,
      placement: "product_page",
      priority: 5,
      isActive: true,
      products: {
        create: [
          { productId: loadedFries.id, sortOrder: 1 },
          { productId: onionRings.id, sortOrder: 2 },
          { productId: milkshake.id, sortOrder: 3 },
          { productId: freshLemonade.id, sortOrder: 4 },
        ],
      },
    },
  });

  // Rule 4: Cart-level — if cart has items, suggest drinks at checkout
  const upsellCartDrink = await prisma.upsellRule.create({
    data: {
      name: "Cart Drink Suggestion",
      type: "cart",
      placement: "cart_page",
      priority: 10,
      isActive: true,
      products: {
        create: [
          { productId: milkshake.id, sortOrder: 1 },
          { productId: freshLemonade.id, sortOrder: 2 },
          { productId: icedCoffee.id, sortOrder: 3 },
        ],
      },
    },
  });

  // Rule 5: Checkout-level — cheap add-ons before order
  const upsellCheckout = await prisma.upsellRule.create({
    data: {
      name: "Last Chance Sides",
      type: "global",
      placement: "checkout_page",
      minCartValue: 10,
      priority: 10,
      isActive: true,
      products: {
        create: [
          { productId: coleslaw.id, sortOrder: 1 },
          { productId: macCheese.id, sortOrder: 2 },
          { productId: churros.id, sortOrder: 3 },
        ],
      },
    },
  });

  // Rule 6: Global — popular add-ons shown on cart page as fallback
  const upsellGlobal = await prisma.upsellRule.create({
    data: {
      name: "Popular Add-ons",
      type: "global",
      placement: "cart_page",
      priority: 1,
      isActive: true,
      products: {
        create: [
          { productId: loadedFries.id, sortOrder: 1 },
          { productId: onionRings.id, sortOrder: 2 },
          { productId: brownie.id, sortOrder: 3 },
        ],
      },
    },
  });

  console.log("Database seeded successfully!");
  console.log(`Created: 1 restaurant, 6 categories, ${6 + 3 + 4 + 2 + 3 + 2} menu items, 4 riders, 6 orders, 1 review, 6 upsell rules`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });