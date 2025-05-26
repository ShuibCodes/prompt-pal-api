import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export default {
    async sendResultsEmail(email: string, name: string, results: any) {
        try {
            // Validate email configuration
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
                throw new Error('Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set');
            }

            // Validate input parameters
            if (!email || !name || !results) {
                throw new Error(`Invalid input parameters: email=${!!email}, name=${!!name}, results=${!!results}`);
            }

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
                                <p style="color: #7f8c8d;">Hello ${name},</p>
                            </div>
                            
                            <div class="score-card">
                                <h2 style="margin: 0 0 10px 0; font-size: 2em;">Overall Score</h2>
                                <p style="font-size: 3em; margin: 0; font-weight: bold;">${totalScore.toFixed(2)}</p>
                            </div>

                            <div class="chart-container">
                                <canvas id="taskScoresChart"></canvas>
                            </div>

                            <div style="margin-top: 30px;">
                                <h2 style="color: #2c3e50; margin-bottom: 20px;">Detailed Results</h2>
                                ${resultsHtml}
                            </div>

                            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #7f8c8d;">Thank you for participating in the prompt engineering assessment!</p>
                            </div>
                        </div>

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
}; 