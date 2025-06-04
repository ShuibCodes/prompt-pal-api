import crypto from 'crypto';

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

    async getUserResultsForTask(ctx, next) {
        try {
            ctx.body = await strapi.service('api::analyzer.user-results').getUserResultsForTask(
                ctx.params.userId, 
                ctx.params.taskId
            );
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while fetching user results for task',
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
                    Day: task.Day

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

    async getUserImageTasks(ctx, next) {
        try {
            const imageTasks = await strapi.service('api::analyzer.analyzer').getUserImageTasks(ctx.params.userId);
            ctx.body = {
                data: imageTasks.map(task => ({
                    id: task.documentId,
                    name: task.name,
                    question: task.question,
                    idealPrompt: task.idealPrompt,
                    Image: task.Image,
                }))
            };
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while fetching user image tasks',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getTaskById(ctx, next) {
        try {
            const task = await strapi.service('api::analyzer.analyzer').getTaskById(ctx.params.taskId);
            if (!task) {
                ctx.body = {
                    error: 'Task not found',
                };
                ctx.status = 404;
                return;
            }
            
            ctx.body = {
                data: {
                    id: task.documentId,
                    name: task.name,
                    question: task.question,
                    idealPrompt: task.idealPrompt,
                    Image: task.Image,
                }
            };
        } catch (err) {
            ctx.body = {
                error: 'An error occurred while fetching the task',
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
            
            // Check if email configuration is present
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
            }

            await strapi.service('api::analyzer.email').sendResultsEmail(user.email, user.name, results);
            
            ctx.body = { 
                success: true, 
                message: 'Results sent successfully',
                debug: {
                    userId,
                    userEmail: user.email,
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        } catch (err) {
            console.error('sendResultsEmail error:', err);
            ctx.body = {
                error: 'An error occurred while sending results email',
                details: err instanceof Error ? err.message : 'Unknown error',
                debug: {
                    userId: ctx.params.userId,
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    },
                    stack: err instanceof Error ? err.stack : undefined
                }
            };
            ctx.status = 500;
        }
    },

    async generateImage(ctx, next) {
        try {
            const { prompt } = ctx.request.body;
            
            if (!prompt || typeof prompt !== 'string') {
                ctx.body = {
                    error: 'Prompt is required and must be a string',
                };
                ctx.status = 400;
                return;
            }

            // Use OpenAI's cheapest settings
            const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${strapi.config.get('env.OPENAI_API_KEY', process.env.OPENAI_API_KEY)}`,
                },
                body: JSON.stringify({
                    model: 'dall-e-2', // Cheapest model
                    prompt: prompt,
                    n: 1, // Generate only 1 image
                    size: '256x256', // Smallest/cheapest size
                    response_format: 'url'
                })
            });

            if (!imageResponse.ok) {
                const errorData = await imageResponse.json() as { error?: { message?: string } };
                throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const imageData = await imageResponse.json() as { data: Array<{ url: string }> };
            
            ctx.body = {
                success: true,
                imageUrl: imageData.data[0].url,
                prompt: prompt
            };
        } catch (err) {
            console.error('Image generation error:', err);
            ctx.body = {
                error: 'An error occurred while generating the image',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async evaluateImageComparison(ctx, next) {
        try {
            const { taskId, userImageUrl, expectedImageUrl } = ctx.request.body;
            
            if (!taskId || !userImageUrl || !expectedImageUrl) {
                ctx.body = {
                    error: 'taskId, userImageUrl, and expectedImageUrl are required',
                };
                ctx.status = 400;
                return;
            }

            const result = await strapi.service('api::analyzer.submission-checker').checkImageComparison(
                taskId,
                userImageUrl, 
                expectedImageUrl
            );
            
            ctx.body = {
                success: true,
                evaluation: result
            };
        } catch (err) {
            console.error('Image evaluation error:', err);
            ctx.body = {
                error: 'An error occurred while evaluating the images',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getDailyTasks(ctx) {
        try {
            const tasks = await strapi.service('api::analyzer.analyzer').getDailyTasks();
            return ctx.send({ 
                data: tasks.map(task => ({
                    id: task.documentId,
                    name: task.name,
                    question: task.question,
                    idealPrompt: task.idealPrompt,
                    Image: task.Image,
                    Day: task.Day
                }))
            });
        } catch (error) {
            return ctx.badRequest('Failed to fetch daily tasks', { error: error.message });
        }
    },

    async getUserCompletedTasks(ctx) {
        try {
            const { userId } = ctx.params;
            const completedTasks = await strapi.service('api::analyzer.user-results').getUserCompletedTasks(userId);
            
            ctx.body = {
                success: true,
                data: completedTasks
            };
        } catch (err) {
            console.error('getUserCompletedTasks error:', err);
            ctx.body = {
                error: 'An error occurred while fetching completed tasks',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getAverageScores(ctx) {
        try {
            const excludeUserId = ctx.query.excludeUserId; // Get userId from query params
            const averageScores = await strapi.service('api::analyzer.user-results').getAverageScores(excludeUserId);
            
            ctx.body = {
                success: true,
                data: averageScores
            };
        } catch (err) {
            console.error('getAverageScores error:', err);
            ctx.body = {
                error: 'An error occurred while fetching average scores',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async googleSignIn(ctx) {
        try {
            const { email, name, googleId } = ctx.request.body;
            
            if (!email || !name || !googleId) {
                ctx.body = {
                    error: 'Missing required fields: email, name, googleId'
                };
                ctx.status = 400;
                return;
            }

            // Check if user already exists by email
            let user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { email }
            });

            if (user) {
                // User exists, just return their info
                ctx.body = {
                    success: true,
                    user: {
                        id: user.documentId,
                        email: user.email,
                        name: user.name
                    }
                };
            } else {
                // Create new user with Google info
                user = await strapi.query('plugin::users-permissions.user').create({
                    data: {
                        email,
                        username: email, // Use email as username
                        name,
                        confirmed: true, // Auto-confirm Google users
                        blocked: false
                    }
                });

                ctx.body = {
                    success: true,
                    user: {
                        id: user.documentId,
                        email: user.email,
                        name: user.name
                    }
                };
            }
        } catch (err) {
            console.error('Google sign-in error:', err);
            ctx.body = {
                error: 'An error occurred during Google sign-in',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },
};
