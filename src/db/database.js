import Dexie from 'dexie';

const db = new Dexie('POSLocalDB');

db.version(1).stores({
  businessConfig: 'id',
  users: 'id, name, role',
  categories: 'id, name, sortOrder, isActive',
  menuItems: 'id, categoryId, name, price, isActive',
  inventoryItems: 'id, name, unit, currentStock',
  menuItemIngredients: 'id, menuItemId, inventoryItemId',
  orders: 'id, orderNumber, orderDate, status, paymentMode',
  orderItems: 'id, orderId, menuItemId',
  expenseCategories: 'id, name, isActive',
  expenses: 'id, categoryId, date, amount',
  inventoryTransactions: 'id, inventoryItemId, orderId, type, createdAt',
  syncQueue: 'id, tableName, recordId, operation, isSynced',
});

export default db;
