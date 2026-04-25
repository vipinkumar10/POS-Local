import db from '../../../db/database';

const BACKEND_URL = 'http://localhost:8080/api';

/**
 * Sync Service for PWA
 * Handles fetching local changes (orders/expenses) and pushing them to the Spring Boot backend.
 */
export const syncService = {
  async performSync() {
    try {
      // Get config to check if sync is enabled
      const businessConfig = await db.businessConfig.get('config');
      if (!businessConfig?.syncEnabled) return { success: false, message: 'Sync disabled' };

      // In a real outbox pattern, we would track unsynced records.
      // For this MVP, we'll fetch all records from the last 24 hours.
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const orders = await db.orders.where('orderDate').above(yesterday).toArray();
      const expenses = await db.expenses.where('date').above(yesterday).toArray();

      if (orders.length === 0 && expenses.length === 0) {
        return { success: true, message: 'Nothing to sync' };
      }

      const response = await fetch(`${BACKEND_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders, expenses }),
      });

      if (!response.ok) throw new Error('Sync failed server-side');

      // Update last sync time
      await db.businessConfig.update('config', { lastSyncAt: new Date() });

      return { success: true, message: 'Sync successful' };
    } catch (error) {
      console.error('Sync Error:', error);
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
