export default {
    async getUserById(userId: string) {
        return await strapi.documents('api::app-user.app-user').findOne({ documentId: userId });
    },

    async getUserTasks(userId: string) {
        const user = await this.getUserById(userId);

        // Tasks published earlier than user
        return await strapi.documents('api::task.task').findMany({
            filters: {
                publishedAt: {
                    $lt: user.createdAt
                }
            },
            populate: {
                Image: {
                    populate: '*',
                },
            },
            status: 'published'
        });
    },

    async getUserImageTasks(userId: string) {
        const user = await this.getUserById(userId);

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
    },

    async createNewUser(email: string, name: string) {
        const newUser  = await strapi.documents('api::app-user.app-user').create({
            data: {
                email,
                name,
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