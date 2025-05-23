export default {
    async getUserResults(ctx, next) {
        try {
            ctx.body = await strapi.service('api::analyzer.user-results').getUserResults(ctx.params.userId);
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while fetching user results',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getUserTasks(ctx, next) {
        try {
            const userTasks = await strapi.service('api::analyzer.analyzer').getUserTasks(ctx.params.userId);
            ctx.body = {
                data: userTasks.map(task => ({
                    id: task.documentId,
                    name: task.name,
                    question: task.question,
                    idealPrompt: task.idealPrompt,
                    Image: task.Image,

                }))
            };
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while fetching user tasks',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async submitUserSolution(ctx, next) {
        try {
            await strapi.service('api::analyzer.user-results').submitUserSolution(
                ctx.params.userId,
                ctx.request.body.taskId,
                ctx.request.body.solutionPrompt,
            );
            ctx.body = null;
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while submitting solution',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async createNewUser(ctx, next) {
        try {
            const newUserId = await strapi.service('api::analyzer.analyzer').createNewUser(ctx.request.body.email, ctx.request.body.name)
            ctx.body = { id: newUserId };
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while creating new user',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async checkSubmission(ctx, next) {
        try {
            ctx.body = await strapi.service('api::analyzer.submission-checker').checkSubmission(ctx.params.submissionId);
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while checking sumbission',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getCriteria(ctx, next) {
        try {
            const criteria = await strapi.service('api::analyzer.submission-checker').getCriteria();
            ctx.body = {
                data: criteria.map(criterion => ({
                    id: criterion.documentId,
                    name: criterion.name,
                    subquestions: criterion.subquestions.map(subquestion => ({
                        id: subquestion.documentId,
                        question: subquestion.question
                    })),
                }))
            };
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while fetching criteria',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async sendResultsEmail(ctx) {
        console.log('sendResultsEmail endpoint hit for userId:', ctx.params.userId);
        try {
            const { userId } = ctx.params;
            const user = await strapi.service('api::analyzer.analyzer').getUserById(userId);
            
            if (!user) {
                console.log('User not found:', userId);
                return ctx.notFound('User not found');
            }

            console.log('Sending email to:', user.email);
            const results = await strapi.service('api::analyzer.user-results').getUserResults(userId);
            await strapi.service('api::analyzer.email').sendResultsEmail(user.email, user.name, results);
            
            ctx.body = { success: true, message: 'Results sent successfully' };
        } catch (err) {
            console.error('sendResultsEmail error:', err);
            ctx.body = {
                error: 'An error occurred while sending results email',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    }
};
