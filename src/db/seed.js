import db from './database';

const DEFAULT_CATEGORIES = [
  { id: 'cat-momos', name: 'Momos', icon: '🥟', sortOrder: 1, isActive: true, updatedAt: new Date() },
  { id: 'cat-beverages', name: 'Beverages', icon: '☕', sortOrder: 2, isActive: true, updatedAt: new Date() },
  { id: 'cat-combos', name: 'Combos', icon: '🍱', sortOrder: 3, isActive: true, updatedAt: new Date() },
  { id: 'cat-starters', name: 'Starters', icon: '🍗', sortOrder: 4, isActive: true, updatedAt: new Date() },
  { id: 'cat-main-course', name: 'Main Course', icon: '🍛', sortOrder: 5, isActive: true, updatedAt: new Date() },
  { id: 'cat-desserts', name: 'Desserts', icon: '🍰', sortOrder: 6, isActive: true, updatedAt: new Date() },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'exp-rent', name: 'Rent', isActive: true },
  { id: 'exp-staff', name: 'Staff Salary', isActive: true },
  { id: 'exp-raw-material', name: 'Raw Material', isActive: true },
  { id: 'exp-utilities', name: 'Utilities', isActive: true },
  { id: 'exp-maintenance', name: 'Maintenance', isActive: true },
  { id: 'exp-misc', name: 'Miscellaneous', isActive: true },
];

const DEFAULT_BUSINESS_CONFIG = {
  id: 'config',
  businessName: 'My Restaurant',
  logoBase64: '',
  gstNumber: '',
  gstPercent: 5,
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  address: '',
  phone: '',
  footerMessage: 'Thank you! Visit again!',
  currency: '₹',
  theme: 'light',
  syncInterval: 5,
};

const DEFAULT_USER = {
  id: 'user-admin',
  name: 'Admin',
  pin: '1234',
  role: 'admin',
  createdAt: new Date(),
};

const SAMPLE_INVENTORY = [
  { id: 'inv-flour', name: 'Maida (Flour)', unit: 'kg', openingStock: 20, currentStock: 20, minStockAlert: 5, costPerUnit: 40, updatedAt: new Date() },
  { id: 'inv-chicken', name: 'Chicken', unit: 'kg', openingStock: 10, currentStock: 10, minStockAlert: 3, costPerUnit: 220, updatedAt: new Date() },
  { id: 'inv-veggies', name: 'Mixed Vegetables', unit: 'kg', openingStock: 15, currentStock: 15, minStockAlert: 4, costPerUnit: 60, updatedAt: new Date() },
  { id: 'inv-oil', name: 'Cooking Oil', unit: 'litre', openingStock: 10, currentStock: 10, minStockAlert: 3, costPerUnit: 150, updatedAt: new Date() },
  { id: 'inv-coffee', name: 'Coffee Powder', unit: 'kg', openingStock: 5, currentStock: 5, minStockAlert: 1, costPerUnit: 500, updatedAt: new Date() },
  { id: 'inv-milk', name: 'Milk', unit: 'litre', openingStock: 20, currentStock: 20, minStockAlert: 5, costPerUnit: 55, updatedAt: new Date() },
  { id: 'inv-sugar', name: 'Sugar', unit: 'kg', openingStock: 10, currentStock: 10, minStockAlert: 3, costPerUnit: 45, updatedAt: new Date() },
  { id: 'inv-rice', name: 'Rice', unit: 'kg', openingStock: 25, currentStock: 25, minStockAlert: 5, costPerUnit: 60, updatedAt: new Date() },
];

const SAMPLE_MENU_ITEMS = [
  { id: 'menu-steam-momo', categoryId: 'cat-momos', name: 'Steam Momo (Veg)', price: 100, unit: 'plate', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-fried-momo', categoryId: 'cat-momos', name: 'Fried Momo (Veg)', price: 120, unit: 'plate', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-chicken-momo', categoryId: 'cat-momos', name: 'Chicken Momo', price: 150, unit: 'plate', imageBase64: '', isActive: true, isVeg: false, updatedAt: new Date() },
  { id: 'menu-tandoori-momo', categoryId: 'cat-momos', name: 'Tandoori Momo', price: 180, unit: 'plate', imageBase64: '', isActive: true, isVeg: false, updatedAt: new Date() },
  { id: 'menu-coffee', categoryId: 'cat-beverages', name: 'Hot Coffee', price: 50, unit: 'cup', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-cold-coffee', categoryId: 'cat-beverages', name: 'Cold Coffee', price: 80, unit: 'glass', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-tea', categoryId: 'cat-beverages', name: 'Masala Tea', price: 30, unit: 'cup', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-lemonade', categoryId: 'cat-beverages', name: 'Fresh Lemonade', price: 60, unit: 'glass', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-momo-combo', categoryId: 'cat-combos', name: 'Momo + Coffee Combo', price: 140, unit: 'combo', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-spring-roll', categoryId: 'cat-starters', name: 'Spring Roll', price: 90, unit: 'plate', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-fried-rice', categoryId: 'cat-main-course', name: 'Veg Fried Rice', price: 150, unit: 'plate', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
  { id: 'menu-chicken-rice', categoryId: 'cat-main-course', name: 'Chicken Fried Rice', price: 180, unit: 'plate', imageBase64: '', isActive: true, isVeg: false, updatedAt: new Date() },
  { id: 'menu-gulab-jamun', categoryId: 'cat-desserts', name: 'Gulab Jamun', price: 60, unit: '2 pcs', imageBase64: '', isActive: true, isVeg: true, updatedAt: new Date() },
];

const SAMPLE_INGREDIENTS = [
  { id: 'ing-1', menuItemId: 'menu-steam-momo', inventoryItemId: 'inv-flour', quantityRequired: 0.1 },
  { id: 'ing-2', menuItemId: 'menu-steam-momo', inventoryItemId: 'inv-veggies', quantityRequired: 0.15 },
  { id: 'ing-3', menuItemId: 'menu-fried-momo', inventoryItemId: 'inv-flour', quantityRequired: 0.1 },
  { id: 'ing-4', menuItemId: 'menu-fried-momo', inventoryItemId: 'inv-veggies', quantityRequired: 0.15 },
  { id: 'ing-5', menuItemId: 'menu-fried-momo', inventoryItemId: 'inv-oil', quantityRequired: 0.05 },
  { id: 'ing-6', menuItemId: 'menu-chicken-momo', inventoryItemId: 'inv-flour', quantityRequired: 0.1 },
  { id: 'ing-7', menuItemId: 'menu-chicken-momo', inventoryItemId: 'inv-chicken', quantityRequired: 0.2 },
  { id: 'ing-8', menuItemId: 'menu-coffee', inventoryItemId: 'inv-coffee', quantityRequired: 0.01 },
  { id: 'ing-9', menuItemId: 'menu-coffee', inventoryItemId: 'inv-milk', quantityRequired: 0.15 },
  { id: 'ing-10', menuItemId: 'menu-coffee', inventoryItemId: 'inv-sugar', quantityRequired: 0.01 },
  { id: 'ing-11', menuItemId: 'menu-fried-rice', inventoryItemId: 'inv-rice', quantityRequired: 0.2 },
  { id: 'ing-12', menuItemId: 'menu-fried-rice', inventoryItemId: 'inv-veggies', quantityRequired: 0.15 },
  { id: 'ing-13', menuItemId: 'menu-fried-rice', inventoryItemId: 'inv-oil', quantityRequired: 0.03 },
];

export async function seedDatabase() {
  const configCount = await db.businessConfig.count();
  if (configCount > 0) return;

  await db.businessConfig.add(DEFAULT_BUSINESS_CONFIG);
  await db.users.bulkAdd([DEFAULT_USER]);
  await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  await db.expenseCategories.bulkAdd(DEFAULT_EXPENSE_CATEGORIES);
  await db.inventoryItems.bulkAdd(SAMPLE_INVENTORY);
  await db.menuItems.bulkAdd(SAMPLE_MENU_ITEMS);
  await db.menuItemIngredients.bulkAdd(SAMPLE_INGREDIENTS);

  console.log('✅ Database seeded with default data');
}
