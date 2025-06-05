export default {
  /**
   * Daily notifications at 9:00 AM every day
   * Cron format: '0 9 * * *' = At 9:00 AM every day
   */
  dailyTaskNotifications: {
    task: async ({ strapi }) => {
      console.log('🕘 Running daily task notifications cron job...');
      
      try {
        // Send daily notifications
        const result = await strapi.service('api::analyzer.email').sendDailyNotificationsToAllUsers();
        console.log('✅ Daily notifications completed:', result);

        // Reset inactive streaks
        console.log('🔄 Checking for inactive streaks to reset...');
        const resetsCount = await strapi.service('api::analyzer.streak').resetInactiveStreaks();
        console.log(`✅ Streak resets completed: ${resetsCount} streaks reset`);

      } catch (error) {
        console.error('❌ Daily cron job failed:', error);
      }
    },
    options: {
      rule: '20 10 * * *', // Every day at 10:20 AM
      tz: 'Europe/Berlin', // Set your timezone here (CEST)
    },
  },

  /**
   * Alternative: Send notifications at multiple times
   * Uncomment this if you want to send at different times
   */
  // morningNotifications: {
  //   task: async ({ strapi }) => {
  //     console.log('🌅 Running morning notifications...');
  //     await strapi.service('api::analyzer.email').sendDailyNotificationsToAllUsers();
  //   },
  //   options: {
  //     rule: '0 8 * * *', // 8:00 AM
  //     tz: 'Europe/Berlin',
  //   },
  // },
  
  // eveningReminders: {
  //   task: async ({ strapi }) => {
  //     console.log('🌇 Running evening reminders...');
  //     // Could send reminder emails for incomplete tasks
  //   },
  //   options: {
  //     rule: '0 18 * * *', // 6:00 PM
  //     tz: 'Europe/Berlin',
  //   },
  // },
}; 