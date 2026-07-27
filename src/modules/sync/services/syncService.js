import db from '../../../db/database';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Sync Service for PWA
 * Handles fetching local changes (orders/expenses) and pushing them to the Spring Boot backend.
 */
export const syncService = {
  async performSync(force = false) {
    await this.pushData(force);
    return await this.pullData(force);
  },

  async pushData(force = false) {
    try {
      const config = await db.businessConfig.get('config');
      if (!force && !config?.syncEnabled) return { success: false, message: 'Sync disabled' };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const orders = await db.orders.where('orderDate').above(yesterday).toArray();
      const expenses = await db.expenses.where('date').above(yesterday).toArray();
      const menuItems = await db.menuItems.toArray();
      const inventoryItems = await db.inventoryItems.toArray();
      const recipes = await db.menuItemIngredients.toArray();

      const response = await fetch(`${BACKEND_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders, expenses, menuItems, inventoryItems, recipes, settings: config }),
      });

      if (!response.ok) throw new Error('Push failed');
      return { success: true };
    } catch (error) {
      console.error('Push Error:', error);
      return { success: false, message: error.message };
    }
  },

  async pullData(force = false) {
    try {
      const config = await db.businessConfig.get('config');
      if (!force && !config?.syncEnabled) return { success: false, message: 'Sync disabled' };

      const response = await fetch(`${BACKEND_URL}/sync/master-data`);
      if (!response.ok) throw new Error('Pull failed');
      
      const data = await response.json();

      // Update local DB in a transaction
      await db.transaction('rw', [db.menuItems, db.inventoryItems, db.menuItemIngredients, db.businessConfig], async () => {
        if (data.menuItems?.length) {
          await db.menuItems.clear();
          await db.menuItems.bulkAdd(data.menuItems);
        }
        if (data.inventoryItems?.length) {
          await db.inventoryItems.clear();
          await db.inventoryItems.bulkAdd(data.inventoryItems);
        }
        if (data.recipes?.length) {
          await db.menuItemIngredients.clear();
          await db.menuItemIngredients.bulkAdd(data.recipes);
        }
        if (data.settings && Object.keys(data.settings).length > 0) {
          await db.businessConfig.update('config', data.settings);
        }
        await db.businessConfig.update('config', { lastSyncAt: new Date() });
      });

      return { success: true, message: 'Data updated from server' };
    } catch (error) {
      console.error('Pull Error:', error);
      return { success: false, message: error.message };
    }
  },

  async updateBackendConfig(key, value, description) {
    try {
      await fetch(`${BACKEND_URL}/config/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: String(value), description }),
      });
    } catch (error) {
      console.error('Config Update Error:', error);
    }
  }
};
