import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export default {
    async sendPasswordResetEmail(email: string, resetToken: string) {
        try {
            // Validate email configuration
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
            }

            // Validate input parameters
            if (!email || !resetToken) {
                throw new Error(`Invalid input parameters: email=${!!email}, resetToken=${!!resetToken}`);
            }

            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: `"Prompt Pal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Reset Your Password',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .content { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                            .button { background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; }
                            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="color: #2c3e50; margin-bottom: 10px;">Password Reset Request</h1>
                            </div>
                            
                            <div class="content">
                                <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
                                    You requested a password reset. Click the button below to reset your password:
                                </p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${resetUrl}" class="button">
                                        Reset Password
                                    </a>
                                </div>
                                <p style="color: #7f8c8d; font-size: 14px;">
                                    This link will expire in 1 hour.
                                </p>
                                <p style="color: #7f8c8d; font-size: 14px;">
                                    If you didn't request this, please ignore this email.
                                </p>
                            </div>

                            <div class="footer">
                                <p style="color: #7f8c8d;">Thank you for using Prompt Pal!</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            // Verify transporter configuration
            try {
                await transporter.verify();
            } catch (verifyError) {
                throw new Error(`Email transporter verification failed: ${verifyError.message}`);
            }

            // Send the email
            const info = await transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                debug: {
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw {
                message: error.message || 'Unknown error occurred while sending email',
                stack: error.stack,
                code: error.code,
                debug: {
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        }
    },

    async sendResultsEmail(email: string, name: string, results: any) {
        try {
            // Validate email configuration
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
            }

            // Validate input parameters
            if (!email || !results) {
                throw new Error(`Invalid input parameters: email=${!!email}, results=${!!results}`);
            }

            // Check if user has any task results
            if (!results.taskResults || results.taskResults.length === 0) {
                throw new Error('No task results found for user. User must complete at least one task to receive results email.');
            }

            // Use email username as name if name is not provided
            const displayName = name || email.split('@')[0];

            // Fetch all criteria from the database
            const criteria = await strapi.db.query('api::criterion.criterion').findMany({
                select: ['documentId', 'name'],
            });
            
            if (!criteria || criteria.length === 0) {
                throw new Error('No criteria found in database');
            }

            // Create a map of criterion IDs to names
            const criteriaMap = criteria.reduce((acc: Record<string, string>, criterion: any) => {
                acc[criterion.documentId] = criterion.name;
                return acc;
            }, {});

            // Calculate overall statistics
            const totalScore = results.score;
            const taskScores = results.taskResults.map((task: any) => {
                const taskName = task.taskName || 'Task';
                const totalTaskScore = task.criterionResults.reduce((sum: number, criterion: any) => sum + criterion.score, 0);
                const maxPossibleScore = task.criterionResults.length * 5;
                const percentageScore = Math.round((totalTaskScore / maxPossibleScore) * 100);
                return { taskName, percentageScore };
            });

            // Check if user has completed all tasks (score is not null)
            const hasCompleteResults = totalScore !== null;
            const displayScore = hasCompleteResults ? totalScore.toFixed(2) : 'Incomplete';
            const scoreMessage = hasCompleteResults 
                ? `Your overall score: ${displayScore}/5` 
                : 'Complete all tasks to see your overall score';

            const resultsHtml = results.taskResults.map((task: any) => {
                const taskName = task.taskName || 'Task';
                const totalScore = task.criterionResults.reduce((sum: number, criterion: any) => sum + criterion.score, 0);
                const maxPossibleScore = task.criterionResults.length * 5;
                const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

                return `
                    <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <h3 style="margin-top: 0; color: #2c3e50; font-size: 1.4em;">${taskName}</h3>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0;">
                            <p style="margin: 0; font-size: 1.2em;"><strong>Score:</strong> <span style="color: ${percentageScore >= 70 ? '#2ecc71' : percentageScore >= 50 ? '#f1c40f' : '#e74c3c'}">${percentageScore}%</span> (${totalScore}/${maxPossibleScore} points)</p>
                        </div>
                        <div style="margin-top: 15px;">
                            ${task.criterionResults.map((criterion: any) => `
                                <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 6px;">
                                    <p style="margin: 0 0 10px 0; font-size: 1.1em;"><strong style="color: #34495e;">${criteriaMap[criterion.criterionId] || 'Unknown Criterion'}:</strong> <span style="color: ${criterion.score >= 4 ? '#2ecc71' : criterion.score >= 3 ? '#f1c40f' : '#e74c3c'}">${criterion.score}/5</span></p>
                                    ${criterion.subquestionResults.map((sub: any) => `
                                        <p style="margin: 5px 0 5px 20px; color: #555; font-size: 0.95em;">• ${sub.feedback}</p>
                                    `).join('')}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your Prompt Engineering Results',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .score-card { background: linear-gradient(135deg, #6c5ce7, #a8a4e6); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
                            .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
                            .task-card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="color: #2c3e50; margin-bottom: 10px;">Prompt Engineering Results</h1>
                                <p style="color: #7f8c8d;">Hello ${displayName},</p>
                            </div>
                            
                            <div class="score-card">
                                <h2 style="margin: 0 0 10px 0; font-size: 2em;">Overall Score</h2>
                                <p style="font-size: 3em; margin: 0; font-weight: bold;">${displayScore}</p>
                                ${hasCompleteResults ? '' : '<p style="font-size: 1.2em; margin: 10px 0 0 0; opacity: 0.8;">Complete all daily tasks to see your overall score</p>'}
                            </div>

                            ${hasCompleteResults && taskScores.length > 0 ? `
                            <div class="chart-container">
                                <canvas id="taskScoresChart"></canvas>
                            </div>
                            ` : ''}

                            <div style="margin-top: 30px;">
                                <h2 style="color: #2c3e50; margin-bottom: 20px;">Detailed Results</h2>
                                ${resultsHtml}
                            </div>

                            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #7f8c8d;">${scoreMessage}</p>
                                <p style="color: #7f8c8d;">Thank you for participating in the prompt engineering assessment!</p>
                            </div>
                        </div>

                        ${hasCompleteResults && taskScores.length > 0 ? `
                        <script>
                            // Initialize the chart
                            const ctx = document.getElementById('taskScoresChart').getContext('2d');
                            new Chart(ctx, {
                                type: 'bar',
                                data: {
                                    labels: ${JSON.stringify(taskScores.map((t: any) => t.taskName))},
                                    datasets: [{
                                        label: 'Task Scores (%)',
                                        data: ${JSON.stringify(taskScores.map((t: any) => t.percentageScore))},
                                        backgroundColor: [
                                            '#2ecc71',
                                            '#3498db',
                                            '#9b59b6',
                                            '#e67e22',
                                            '#e74c3c'
                                        ],
                                        borderColor: '#fff',
                                        borderWidth: 1
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            max: 100
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    }
                                }
                            });
                        </script>
                        ` : ''}
                    </body>
                    </html>
                `,
            };

            // Verify transporter configuration
            try {
                await transporter.verify();
            } catch (verifyError) {
                throw new Error(`Email transporter verification failed: ${verifyError.message}`);
            }

            // Send the email
            const info = await transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                debug: {
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        } catch (error) {
            console.error('Error sending email:', error);
            throw {
                message: error.message || 'Unknown error occurred while sending email',
                stack: error.stack,
                code: error.code,
                debug: {
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        }
    },

    async sendDailyTaskNotification(email: string, name: string, todayTasks: any[]) {
        try {
            // Validate email configuration
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
            }

            // Validate input parameters
            if (!email || !todayTasks) {
                throw new Error(`Invalid input parameters: email=${!!email}, todayTasks=${!!todayTasks}`);
            }

            const displayName = name || email.split('@')[0];
            const taskCount = todayTasks.length;
            const todayDate = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const tasksHtml = todayTasks.map((task: any) => `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff9800;">
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 1.3em;">${task.name}</h3>
                    <p style="margin: 0; color: #555; line-height: 1.5;">${task.question.substring(0, 150)}${task.question.length > 150 ? '...' : ''}</p>
                    <div style="margin-top: 15px;">
                        <a href="${process.env.FRONTEND_URL}" 
                           style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Start Challenge →
                        </a>
                    </div>
                </div>
            `).join('');

            const mailOptions = {
                from: `"Prompt Pal" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `🎯 New Daily Challenge${taskCount > 1 ? 's' : ''} for ${todayDate}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #ff9800, #ff6600); color: white; padding: 30px; border-radius: 10px; }
                            .content { background-color: #ffffff; padding: 30px; border-radius: 8px; margin: 20px 0; }
                            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #777; }
                            .emoji { font-size: 1.5em; margin: 0 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="margin: 0; font-size: 2.2em;">🎯 Prompt Pal</h1>
                                <p style="margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9;">Your Daily Challenge${taskCount > 1 ? 's are' : ' is'} Ready!</p>
                            </div>
                            
                            <div class="content">
                                <h2 style="color: #2c3e50; margin-bottom: 20px;">
                                    Hello ${displayName}! <span class="emoji">👋</span>
                                </h2>
                                
                                <p style="font-size: 1.1em; margin-bottom: 25px;">
                                    ${taskCount === 1 
                                        ? 'A new prompt engineering challenge awaits you today!' 
                                        : `${taskCount} new prompt engineering challenges await you today!`
                                    }
                                </p>

                                <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                                    <p style="margin: 0; color: #1976d2; font-weight: 600;">
                                        <span class="emoji">💡</span> 
                                        Ready to test your prompt skills? Each challenge is designed to improve your AI interaction abilities!
                                    </p>
                                </div>

                                <h3 style="color: #2c3e50; margin: 30px 0 20px 0;">Today's Challenge${taskCount > 1 ? 's' : ''}:</h3>
                                ${tasksHtml}

                                <div style="text-align: center; margin: 40px 0 20px 0;">
                                    <a href="${process.env.FRONTEND_URL}/dashboard" 
                                       style="background-color: #ff6600; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1em; display: inline-block; box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);">
                                        <span class="emoji">🚀</span> Go to Dashboard
                                    </a>
                                </div>

                                <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
                                    <p style="margin: 0; text-align: center; color: #555;">
                                        <strong>💪 Challenge yourself daily and become a prompt engineering expert!</strong>
                                    </p>
                                </div>
                            </div>

                            <div class="footer">
                                <p style="margin: 0;">Happy prompting! <span class="emoji">🎉</span></p>
                                <p style="margin: 10px 0 0 0; font-size: 0.9em;">
                                    <a href="${process.env.FRONTEND_URL}/settings" style="color: #777;">Unsubscribe from daily notifications</a>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            // Verify transporter configuration
            try {
                await transporter.verify();
            } catch (verifyError) {
                throw new Error(`Email transporter verification failed: ${verifyError.message}`);
            }

            // Send the email
            const info = await transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
                debug: {
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        } catch (error) {
            console.error('Error sending daily task notification:', error);
            throw {
                message: error.message || 'Unknown error occurred while sending email',
                stack: error.stack,
                code: error.code,
                debug: {
                    emailConfig: {
                        service: process.env.EMAIL_SERVICE || 'gmail',
                        userConfigured: !!process.env.EMAIL_USER,
                        passwordConfigured: !!process.env.EMAIL_PASSWORD
                    }
                }
            };
        }
    },

    async sendDailyNotificationsToAllUsers() {
        try {
            console.log('Starting daily notifications...');
            
            // Get today's tasks
            const todayTasks = await strapi.service('api::analyzer.analyzer').getDailyTasks();
            
            if (todayTasks.length === 0) {
                console.log('No tasks for today, skipping notifications');
                return { success: true, message: 'No tasks for today', sentCount: 0 };
            }

            // Get all users
            const users = await strapi.documents('plugin::users-permissions.user').findMany({
                filters: {
                    blocked: false,
                    confirmed: true
                },
                fields: ['email', 'name']
            });

            console.log(`Found ${users.length} users and ${todayTasks.length} tasks for today`);

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Send emails to all users
            for (const user of users) {
                try {
                    await this.sendDailyTaskNotification(user.email, user.name, todayTasks);
                    successCount++;
                    console.log(`✅ Sent notification to ${user.email}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to send notification to ${user.email}:`, error.message);
                    errors.push({ email: user.email, error: error.message });
                }

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`Daily notifications complete: ${successCount} sent, ${errorCount} failed`);

            return {
                success: true,
                message: `Daily notifications sent to ${successCount} users`,
                sentCount: successCount,
                errorCount,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error('Error in sendDailyNotificationsToAllUsers:', error);
            throw error;
        }
    }
}; 