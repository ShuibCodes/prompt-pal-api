export default {
  /**
   * Get or create user streak record
   */
  async getOrCreateUserStreak(userId: string) {
    let userStreak = await strapi.documents('api::user-streak.user-streak').findMany({
      filters: {
        users_permissions_user: { documentId: userId }
      },
      limit: 1
    });

    if (userStreak.length === 0) {
      // Create new streak record for user
      userStreak = [await strapi.documents('api::user-streak.user-streak').create({
        data: {
          users_permissions_user: userId,
          currentStreak: 0,
          longestStreak: 0,
          totalCompletedDays: 0,
          lastCompletionDate: null,
          streakStartDate: null
        }
      })];
    }

    return userStreak[0];
  },

  /**
   * Update user streak when they complete a task
   */
  async updateUserStreak(userId: string) {
    const userStreak = await this.getOrCreateUserStreak(userId);
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if user already completed a task today
    if (userStreak.lastCompletionDate) {
      const lastCompletionDateString = new Date(userStreak.lastCompletionDate).toISOString().split('T')[0];
      
      if (lastCompletionDateString === todayDateString) {
        // Already completed today, no streak update needed
        return userStreak;
      }
    }

    // Calculate if streak should continue or reset
    let newCurrentStreak = 1;
    let newStreakStartDate = today;
    
    if (userStreak.lastCompletionDate) {
      const lastCompletion = new Date(userStreak.lastCompletionDate);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastCompletionDateString = lastCompletion.toISOString().split('T')[0];
      const yesterdayDateString = yesterday.toISOString().split('T')[0];
      
      if (lastCompletionDateString === yesterdayDateString) {
        // Streak continues from yesterday
        newCurrentStreak = (userStreak.currentStreak || 0) + 1;
        newStreakStartDate = userStreak.streakStartDate ? new Date(userStreak.streakStartDate) : today;
      }
      // If last completion was before yesterday, streak resets to 1 (handled by default values above)
    }

    // Calculate new longest streak
    const newLongestStreak = Math.max(userStreak.longestStreak || 0, newCurrentStreak);

    // Update the streak record
    const updatedStreak = await strapi.documents('api::user-streak.user-streak').update({
      documentId: userStreak.documentId,
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        totalCompletedDays: (userStreak.totalCompletedDays || 0) + 1,
        lastCompletionDate: today,
        streakStartDate: newStreakStartDate
      }
    });

    console.log(`Updated streak for user ${userId}: ${newCurrentStreak} days (longest: ${newLongestStreak})`);
    return updatedStreak;
  },

  /**
   * Get user's current streak data
   */
  async getUserStreak(userId: string) {
    const userStreak = await this.getOrCreateUserStreak(userId);
    
    // Check if streak should be reset (if last completion was more than 1 day ago)
    if (userStreak.lastCompletionDate && userStreak.currentStreak > 0) {
      const lastCompletion = new Date(userStreak.lastCompletionDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastCompletionDateString = lastCompletion.toISOString().split('T')[0];
      const yesterdayDateString = yesterday.toISOString().split('T')[0];
      const todayDateString = today.toISOString().split('T')[0];
      
      // If last completion was before yesterday and not today, reset streak
      if (lastCompletionDateString !== yesterdayDateString && lastCompletionDateString !== todayDateString) {
        await strapi.documents('api::user-streak.user-streak').update({
          documentId: userStreak.documentId,
          data: {
            currentStreak: 0,
            streakStartDate: null
          }
        });
        
        userStreak.currentStreak = 0;
        userStreak.streakStartDate = null;
      }
    }

    return {
      currentStreak: userStreak.currentStreak || 0,
      longestStreak: userStreak.longestStreak || 0,
      totalCompletedDays: userStreak.totalCompletedDays || 0,
      lastCompletionDate: userStreak.lastCompletionDate,
      streakStartDate: userStreak.streakStartDate
    };
  },

  /**
   * Get streak leaderboard
   */
  async getStreakLeaderboard(limit: number = 10) {
    const streaks = await strapi.documents('api::user-streak.user-streak').findMany({
      filters: {
        currentStreak: {
          $gt: 0
        }
      },
      populate: {
        users_permissions_user: {
          fields: ['username', 'name', 'lastname']
        }
      },
      sort: {
        currentStreak: 'desc'
      },
      limit
    });

    return streaks.map(streak => ({
      userId: streak.users_permissions_user.documentId,
      username: streak.users_permissions_user.username,
      name: streak.users_permissions_user.name,
      lastname: streak.users_permissions_user.lastname,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalCompletedDays: streak.totalCompletedDays
    }));
  },

  /**
   * Reset streaks for users who haven't completed tasks (called by cron)
   */
  async resetInactiveStreaks() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayDateString = today.toISOString().split('T')[0];
    const yesterdayDateString = yesterday.toISOString().split('T')[0];

    // Find users with active streaks who didn't complete tasks yesterday or today
    const activeStreaks = await strapi.documents('api::user-streak.user-streak').findMany({
      filters: {
        currentStreak: {
          $gt: 0
        }
      }
    });

    let resetsCount = 0;

    for (const streak of activeStreaks) {
      if (streak.lastCompletionDate) {
        const lastCompletionDateString = new Date(streak.lastCompletionDate).toISOString().split('T')[0];
        
        // If last completion was before yesterday, reset streak
        if (lastCompletionDateString !== yesterdayDateString && lastCompletionDateString !== todayDateString) {
          await strapi.documents('api::user-streak.user-streak').update({
            documentId: streak.documentId,
            data: {
              currentStreak: 0,
              streakStartDate: null
            }
          });
          resetsCount++;
        }
      }
    }

    console.log(`Reset ${resetsCount} inactive streaks`);
    return resetsCount;
  }
}; 