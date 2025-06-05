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

    async sendTaskResultsEmail(ctx) {
        console.log('sendTaskResultsEmail endpoint hit for userId:', ctx.params.userId, 'taskId:', ctx.params.taskId);
        try {
            const { userId, taskId } = ctx.params;
            const user = await strapi.service('api::analyzer.analyzer').getUserById(userId);
            
            if (!user) {
                console.log('User not found:', userId);
                return ctx.notFound('User not found');
            }

            console.log('Sending task-specific email to:', user.email, 'for task:', taskId);
            const results = await strapi.service('api::analyzer.user-results').getUserResultsForTask(userId, taskId);
            
            // Check if email configuration is present
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
            }

            await strapi.service('api::analyzer.email').sendResultsEmail(user.email, user.name, results);
            
            ctx.body = { 
                success: true, 
                message: 'Task results sent successfully',
                debug: {
                    userId,
                    taskId,
                    userEmail: user.email,
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        } catch (err) {
            console.error('sendTaskResultsEmail error:', err);
            ctx.body = {
                error: 'An error occurred while sending task results email',
                details: err instanceof Error ? err.message : 'Unknown error',
                debug: {
                    userId: ctx.params.userId,
                    taskId: ctx.params.taskId,
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
            const { email, name, firstName, lastName, googleId } = ctx.request.body;
            
            if (!email || !name || !googleId) {
                ctx.body = {
                    error: 'Missing required fields: email, name, googleId'
                };
                ctx.status = 400;
                return;
            }

            // Use provided firstName/lastName or fallback to splitting name
            const finalFirstName = firstName || name.split(' ')[0] || '';
            const finalLastName = lastName || name.split(' ').slice(1).join(' ') || 'User';

            console.log('🔍 Google Sign-In Data:', {
                email,
                name,
                firstName: finalFirstName,
                lastName: finalLastName,
                googleId
            });

            // Check if user already exists by email
            let user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { email }
            });

            if (user) {
                // User exists, update with Google name data if missing lastname
                if (!user.lastname && finalLastName) {
                    console.log('📝 Updating existing user with lastname:', finalLastName);
                    user = await strapi.query('plugin::users-permissions.user').update({
                        where: { id: user.id },
                        data: {
                            lastname: finalLastName,
                            name: finalFirstName // Update first name too if needed
                        }
                    });
                }
                
                ctx.body = {
                    success: true,
                    user: {
                        id: user.documentId,
                        email: user.email,
                        name: user.name,
                        lastname: user.lastname
                    }
                };
            } else {
                // Create new user with Google info including lastname
                user = await strapi.query('plugin::users-permissions.user').create({
                    data: {
                        email,
                        username: email, // Use email as username
                        name: finalFirstName,
                        lastname: finalLastName,
                        confirmed: true, // Auto-confirm Google users
                        blocked: false
                    }
                });

                console.log('✅ Created new Google user:', {
                    id: user.documentId,
                    email: user.email,
                    name: user.name,
                    lastname: user.lastname
                });

                ctx.body = {
                    success: true,
                    user: {
                        id: user.documentId,
                        email: user.email,
                        name: user.name,
                        lastname: user.lastname
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

    async sendDailyNotifications(ctx) {
        console.log('Manual daily notifications trigger');
        try {
            const result = await strapi.service('api::analyzer.email').sendDailyNotificationsToAllUsers();
            
            ctx.body = {
                success: true,
                ...result
            };
        } catch (err) {
            console.error('sendDailyNotifications error:', err);
            ctx.body = {
                error: 'An error occurred while sending daily notifications',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getUserStreak(ctx) {
        try {
            const { userId } = ctx.params;
            const streakData = await strapi.service('api::analyzer.streak').getUserStreak(userId);
            
            ctx.body = {
                success: true,
                data: streakData
            };
        } catch (err) {
            console.error('getUserStreak error:', err);
            ctx.body = {
                error: 'An error occurred while fetching user streak',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async getStreakLeaderboard(ctx) {
        try {
            const limit = parseInt(ctx.query.limit as string) || 10;
            const leaderboard = await strapi.service('api::analyzer.streak').getStreakLeaderboard(limit);
            
            ctx.body = {
                success: true,
                data: leaderboard
            };
        } catch (err) {
            console.error('getStreakLeaderboard error:', err);
            ctx.body = {
                error: 'An error occurred while fetching streak leaderboard',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async syncUserStreak(ctx) {
        try {
            const { userId } = ctx.params;
            console.log(`🔄 Syncing streak for user ${userId}...`);
            
            // Get all completed tasks for this user
            const taskScores = await strapi.documents('api::task-score.task-score').findMany({
                filters: {
                    user: { documentId: userId },
                    isCompleted: true
                },
                sort: { completedAt: 'asc' }
            });

            console.log(`📊 Found ${taskScores.length} completed tasks for user ${userId}`);

            if (taskScores.length === 0) {
                ctx.body = {
                    success: true,
                    message: 'No completed tasks found',
                    data: { currentStreak: 0, longestStreak: 0, totalCompletedDays: 0 }
                };
                return;
            }

            // Get or create user streak record
            const userStreak = await strapi.service('api::analyzer.streak').getOrCreateUserStreak(userId);
            
            // Calculate streak based on completion dates
            const completionDates = taskScores.map(score => {
                const date = new Date(score.completedAt);
                return date.toISOString().split('T')[0];
            });

            // Remove duplicates and sort
            const uniqueDates = [...new Set(completionDates)].sort();
            console.log(`📅 Unique completion dates:`, uniqueDates);

            let currentStreak = 0;
            let longestStreak = 0;
            let totalCompletedDays = uniqueDates.length;
            let streakStartDate = null;
            let lastCompletionDate = null;

            if (uniqueDates.length > 0) {
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                
                // Start from the most recent date and work backwards
                let tempStreak = 0;
                let checkDate = new Date(uniqueDates[uniqueDates.length - 1]);
                
                // Check if the streak is current (includes today or yesterday)
                const daysDiff = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
                const isCurrentStreak = daysDiff <= 1;

                if (isCurrentStreak) {
                    // Calculate current streak by working backwards from the latest date
                    for (let i = uniqueDates.length - 1; i >= 0; i--) {
                        const currentDate = uniqueDates[i];
                        
                        if (i === uniqueDates.length - 1) {
                            // First date (most recent)
                            tempStreak = 1;
                            streakStartDate = new Date(currentDate);
                        } else {
                            const prevDate = uniqueDates[i + 1];
                            const currentDateObj = new Date(currentDate);
                            const prevDateObj = new Date(prevDate);
                            const diffDays = Math.floor((prevDateObj.getTime() - currentDateObj.getTime()) / (1000 * 60 * 60 * 24));
                            
                            if (diffDays === 1) {
                                // Consecutive day
                                tempStreak++;
                                streakStartDate = new Date(currentDate);
                            } else {
                                // Break in streak
                                break;
                            }
                        }
                    }
                    currentStreak = tempStreak;
                }

                // Calculate longest streak ever
                let maxStreak = 0;
                tempStreak = 1;
                
                for (let i = 1; i < uniqueDates.length; i++) {
                    const currentDateObj = new Date(uniqueDates[i]);
                    const prevDateObj = new Date(uniqueDates[i - 1]);
                    const diffDays = Math.floor((currentDateObj.getTime() - prevDateObj.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        tempStreak++;
                    } else {
                        maxStreak = Math.max(maxStreak, tempStreak);
                        tempStreak = 1;
                    }
                }
                maxStreak = Math.max(maxStreak, tempStreak);
                longestStreak = maxStreak;

                lastCompletionDate = new Date(uniqueDates[uniqueDates.length - 1]);
            }

            // Update the user streak record
            const updatedStreak = await strapi.documents('api::user-streak.user-streak').update({
                documentId: userStreak.documentId,
                data: {
                    currentStreak,
                    longestStreak,
                    totalCompletedDays,
                    lastCompletionDate,
                    streakStartDate
                }
            });

            console.log(`✅ Updated streak for user ${userId}:`, {
                currentStreak,
                longestStreak,
                totalCompletedDays,
                lastCompletionDate: lastCompletionDate?.toISOString(),
                streakStartDate: streakStartDate?.toISOString()
            });

            ctx.body = {
                success: true,
                message: 'Streak synced successfully',
                data: {
                    currentStreak,
                    longestStreak,
                    totalCompletedDays,
                    lastCompletionDate,
                    streakStartDate,
                    isActiveToday: lastCompletionDate ? 
                        lastCompletionDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] : 
                        false
                }
            };
        } catch (err) {
            console.error('syncUserStreak error:', err);
            ctx.body = {
                error: 'An error occurred while syncing user streak',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    // Profile Settings Handlers
    async getUserProfile(ctx) {
        try {
            const { userId } = ctx.params;
            const user = await strapi.service('api::analyzer.analyzer').getUserById(userId);
            
            if (!user) {
                ctx.body = {
                    error: 'User not found',
                };
                ctx.status = 404;
                return;
            }

            ctx.body = {
                success: true,
                data: {
                    id: user.documentId,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            };
        } catch (err) {
            console.error('getUserProfile error:', err);
            ctx.body = {
                error: 'An error occurred while fetching user profile',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async updateUserProfile(ctx) {
        try {
            const { userId } = ctx.params;
            const { name, email } = ctx.request.body;

            // Validate input
            if (!name && !email) {
                ctx.body = {
                    error: 'At least one field (name or email) is required',
                };
                ctx.status = 400;
                return;
            }

            // Check if user exists
            const user = await strapi.service('api::analyzer.analyzer').getUserById(userId);
            if (!user) {
                ctx.body = {
                    error: 'User not found',
                };
                ctx.status = 404;
                return;
            }

            // Check if email is already taken by another user
            if (email && email !== user.email) {
                const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
                    where: { email }
                });
                
                if (existingUser && existingUser.documentId !== userId) {
                    ctx.body = {
                        error: 'Email is already taken by another user',
                    };
                    ctx.status = 400;
                    return;
                }
            }

            // Prepare update data
            const updateData: any = {};
            if (name) updateData.name = name;
            if (email) updateData.email = email;

            // Update user
            const updatedUser = await strapi.documents('plugin::users-permissions.user').update({
                documentId: userId,
                data: updateData
            });

            ctx.body = {
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedUser.documentId,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    username: updatedUser.username,
                    updatedAt: updatedUser.updatedAt
                }
            };
        } catch (err) {
            console.error('updateUserProfile error:', err);
            ctx.body = {
                error: 'An error occurred while updating user profile',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async changePassword(ctx) {
        try {
            const { userId } = ctx.params;
            const { currentPassword, newPassword } = ctx.request.body;

            // Validate input
            if (!currentPassword || !newPassword) {
                ctx.body = {
                    error: 'Both current password and new password are required',
                };
                ctx.status = 400;
                return;
            }

            if (newPassword.length < 6) {
                ctx.body = {
                    error: 'New password must be at least 6 characters long',
                };
                ctx.status = 400;
                return;
            }

            // Get user with password
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { documentId: userId }
            });

            if (!user) {
                ctx.body = {
                    error: 'User not found',
                };
                ctx.status = 404;
                return;
            }

            // Verify current password
            const validPassword = await strapi.service('plugin::users-permissions.user').validatePassword(
                currentPassword,
                user.password
            );

            if (!validPassword) {
                ctx.body = {
                    error: 'Current password is incorrect',
                };
                ctx.status = 400;
                return;
            }

            // Hash new password
            const hashedPassword = await strapi.service('plugin::users-permissions.user').hashPassword(newPassword);

            // Update password
            await strapi.documents('plugin::users-permissions.user').update({
                documentId: userId,
                data: { password: hashedPassword }
            });

            ctx.body = {
                success: true,
                message: 'Password changed successfully'
            };
        } catch (err) {
            console.error('changePassword error:', err);
            ctx.body = {
                error: 'An error occurred while changing password',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    },

    async deleteAccount(ctx) {
        try {
            const { userId } = ctx.params;
            const { confirmPassword } = ctx.request.body;

            // Validate confirmation password
            if (!confirmPassword) {
                ctx.body = {
                    error: 'Password confirmation is required to delete account',
                };
                ctx.status = 400;
                return;
            }

            // Get user with password
            const user = await strapi.query('plugin::users-permissions.user').findOne({
                where: { documentId: userId }
            });

            if (!user) {
                ctx.body = {
                    error: 'User not found',
                };
                ctx.status = 404;
                return;
            }

            // Verify password
            const validPassword = await strapi.service('plugin::users-permissions.user').validatePassword(
                confirmPassword,
                user.password
            );

            if (!validPassword) {
                ctx.body = {
                    error: 'Password is incorrect',
                };
                ctx.status = 400;
                return;
            }

            // Delete related data before deleting user
            console.log(`🗑️ Deleting account data for user ${userId}...`);

            // Delete user streak
            try {
                const userStreak = await strapi.documents('api::user-streak.user-streak').findFirst({
                    filters: { users_permissions_user: { documentId: userId } }
                });
                if (userStreak) {
                    await strapi.documents('api::user-streak.user-streak').delete({
                        documentId: userStreak.documentId
                    });
                    console.log('✅ Deleted user streak');
                }
            } catch (streakErr) {
                console.warn('Warning: Could not delete user streak:', streakErr);
            }

            // Delete task scores
            try {
                const taskScores = await strapi.documents('api::task-score.task-score').findMany({
                    filters: { user: { documentId: userId } }
                });
                for (const score of taskScores) {
                    await strapi.documents('api::task-score.task-score').delete({
                        documentId: score.documentId
                    });
                }
                console.log(`✅ Deleted ${taskScores.length} task scores`);
            } catch (scoresErr) {
                console.warn('Warning: Could not delete task scores:', scoresErr);
            }

            // Delete submission results - only if the content type exists
            try {
                // Try to delete submission results, but handle gracefully if content type doesn't exist
                const submissions = await strapi.db.query('api::submission-result.submission-result').findMany({
                    where: { user: { documentId: userId } }
                });
                for (const submission of submissions) {
                    await strapi.db.query('api::submission-result.submission-result').delete({
                        where: { documentId: submission.documentId }
                    });
                }
                console.log(`✅ Deleted ${submissions.length} submission results`);
            } catch (submissionsErr) {
                console.warn('Warning: Could not delete submission results (content type might not exist):', submissionsErr);
            }

            // Finally delete the user
            await strapi.documents('plugin::users-permissions.user').delete({
                documentId: userId
            });

            console.log(`✅ Successfully deleted user account ${userId}`);

            ctx.body = {
                success: true,
                message: 'Account deleted successfully'
            };
        } catch (err) {
            console.error('deleteAccount error:', err);
            ctx.body = {
                error: 'An error occurred while deleting account',
                details: err instanceof Error ? err.message : 'Unknown error',
            };
            ctx.status = 500;
        }
    }
};
