export default {
    async getUserById(userId: string) {
        return await strapi.documents('plugin::users-permissions.user').findOne({
            documentId: userId
        });
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

    async createNewUser(email: string, name: string) {
        const username = email.split('@')[0]; // Generate username from email
        const password = Math.random().toString(36).slice(-8); // Generate a random password
        
        const newUser = await strapi.query('plugin::users-permissions.user').create({
            data: {
                email,
                username,
                password,
                provider: 'local',
                confirmed: true,
                blocked: false,
                role: 1, // Authenticated role
                name
            }
        });

        return newUser;
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
};