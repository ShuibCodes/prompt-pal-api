export default {
    async getUserById(userId: string) {
        return await strapi.documents('plugin::users-permissions.user').findOne({
            documentId: userId
        });
    },

    async getUserByExternalId(externalId: string) {
        try {
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { externalId: externalId }
            });
            return user;
        } catch (error) {
            console.error('Error in getUserByExternalId:', error);
            throw error;
        }
    },

    async getUserTasks(userId: string) {
        try {
            // Get all published tasks regardless of user
            const tasks = await strapi.documents('api::task.task').findMany({
                filters: {
                    Image: {
                        $notNull: false
                    }
                },
                populate: {
                    Image: {
                        populate: '*',
                    },
                },
                status: 'published'
            });

            return tasks;
        } catch (error) {
            console.error('Error in getUserTasks:', error);
            throw error;
        }
    },

    async getUserImageTasks(userId: string) {
        try {
            // Get all image tasks regardless of user
            return await strapi.documents('api::task.task').findMany({
                filters: {
                    Image: {
                        $notNull: true
                    }
                },
                populate: {
                    Image: {
                        populate: '*',
                    },
                },
                status: 'published'
            });
        } catch (error) {
            console.error('Error in getUserImageTasks:', error);
            throw error;
        }
    },

    async createNewUser(email: string, name: string, externalId?: string) {
        try {
            const username = email.split('@')[0]; // Generate username from email
            const password = Math.random().toString(36).slice(-8); // Generate a random password
            
            const userData: any = {
                email,
                username,
                password,
                provider: 'local',
                confirmed: true,
                blocked: false,
                role: 1, // Authenticated role
                name,
                lastname: 'User' // Default lastname
            };

            // Add externalId if provided
            if (externalId) {
                userData.externalId = externalId;
            }
            
            const newUser = await strapi.query('plugin::users-permissions.user').create({
                data: userData
            });

            if (!newUser) {
                throw new Error('Failed to create user');
            }

            return {
                documentId: newUser.id,
                ...newUser
            };
        } catch (error) {
            console.error('Error in createNewUser:', error);
            throw error;
        }
    },

    async getTaskById(taskId: string) {
        return await strapi.documents('api::task.task').findOne({
            documentId: taskId,
            populate: {
                Image: {
                    populate: '*',
                },
            },
            status: 'published'
        });
    },

    async getDailyTasks() {
        try {
            // Get current date in local timezone (not UTC)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`; // Format as YYYY-MM-DD in local timezone

            console.log('Current date for filtering (local timezone):', todayStr);
            console.log('Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

            // First get all tasks to debug
            const allTasks = await strapi.documents('api::task.task').findMany({
                populate: {
                    Image: {
                        populate: '*',
                    },
                },
                status: 'published'
            });

            console.log('All tasks with their dates:', allTasks.map(task => ({
                id: task.documentId,
                name: task.name,
                day: task.Day
            })));

            // Filter tasks for today
            const tasks = allTasks.filter(task => {
                if (!task.Day) return false;
                
                // Parse the task date (which should be stored as YYYY-MM-DD)
                const taskDateStr = task.Day.toString().split('T')[0]; // Handle both Date objects and strings
                
                console.log('Comparing dates:', {
                    taskId: task.documentId,
                    taskName: task.name,
                    taskDate: taskDateStr,
                    today: todayStr,
                    isMatch: taskDateStr === todayStr
                });

                return taskDateStr === todayStr;
            });

            console.log('Filtered tasks for today:', tasks.map(task => ({
                id: task.documentId,
                name: task.name,
                day: task.Day
            })));

            return tasks;
        } catch (error) {
            console.error('Error in getDailyTasks:', error);
            throw error;
        }
    },
};