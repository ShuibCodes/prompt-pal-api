export default {
    async calculateSubquestionResult(subquestionId: string, subquestionGptResult: any) {
        const subquestionResult = {
            subquestionId,
            score: 1,
            feedback: subquestionGptResult.feedback
        };

        if (subquestionGptResult.score != null) {
            // Clamp score to [1, 5]
            subquestionResult.score = Math.max(1, Math.min(subquestionGptResult.score, 5))
        }

        return subquestionResult;
    },

    async calculateCriterionResult(criterionId: string, criterionGptResult: any) {
        const criterionResult = {
            criterionId,
            score: 0,
            subquestionResults: []
        };

        for (const [subquestionId, subquestionGptResult] of Object.entries<any>(criterionGptResult.subquestions)) {
            const subquestionResult = await this.calculateSubquestionResult(subquestionId, subquestionGptResult);
            criterionResult.subquestionResults.push(subquestionResult);
            criterionResult.score += subquestionResult.score;
        }
        criterionResult.score = criterionResult.score / Math.max(1, criterionResult.subquestionResults.length);

        return criterionResult;
    },

    async calculateTaskResult(taskId: string, submissionId: string, submittedAt: string, taskGptResult: any) {
        const taskResult = {
            taskId,
            submissionId,
            submittedAt,
            score: 0,
            criterionResults: []
        };

        for (const [criterionId, criterionGptResult] of Object.entries<any>(taskGptResult.criteria)) {
            const criterionResult = await this.calculateCriterionResult(criterionId, criterionGptResult);
            taskResult.criterionResults.push(criterionResult);
            taskResult.score += criterionResult.score;
        }

        taskResult.score = taskResult.score / Math.max(1, taskResult.criterionResults.length);

        return taskResult;
    },

    async calculateUserResult(userTasks: any[], tasksResults: Map<string, any>) {
        const userResult = {
            score: 0,
            taskResults: []
        };

        for (const task of userTasks) {
            if (!tasksResults.has(task.documentId)) {
                userResult.score = null;
            } else {
                const taskResult = tasksResults.get(task.documentId);
                userResult.taskResults.push(taskResult);

                if (userResult.score != null) userResult.score += taskResult.score;
            }
        }

        if (userResult.score != null) {
            userResult.score /= Math.max(1, userTasks.length);
        }

        return userResult;
    },

    async getUserResultsForTask(userId: string, taskId: string) {
        const submissions = await strapi.documents('api::submission.submission').findMany({
            filters: {
                users_permissions_user: {
                    documentId: userId
                },
                task: {
                    documentId: taskId
                }
            },
            populate: {
                task: {
                    fields: ['id', 'name', 'question', 'idealPrompt' ]
                }
            },
            sort: {
                createdAt: 'desc',
            }
        });

        const tasksResults = new Map<string, any>();

        for (const submission of submissions) {
            const submissionTaskId = submission.task.documentId;
            
            const taskGptResult: any = submission.result?.valueOf();
            if (taskGptResult == null) continue;

            const taskResult = await this.calculateTaskResult(
                submissionTaskId,
                submission.documentId,
                submission.createdAt.toString(),
                taskGptResult
            );

            if (!tasksResults.has(submissionTaskId)) {
                tasksResults.set(submissionTaskId, taskResult);
            }
        }

        // Get the specific task info
        const task = await strapi.documents('api::task.task').findOne({
            documentId: taskId,
            fields: ['id', 'name', 'question', 'idealPrompt']
        });

        if (!task) {
            throw new Error(`Task with ID ${taskId} not found`);
        }

        const userResult = {
            score: null,
            taskResults: []
        };

        if (tasksResults.has(taskId)) {
            const taskResult = tasksResults.get(taskId);
            userResult.taskResults.push(taskResult);
            userResult.score = taskResult.score;
        }

        return userResult;
    },

    async getUserResults(userId: string) {
        // Get today's tasks
        const todayTasks = await strapi.service('api::analyzer.analyzer').getDailyTasks();
        const todayTaskIds = new Set(todayTasks.map(task => task.documentId));

        const submissions = await strapi.documents('api::submission.submission').findMany({
            filters: {
                users_permissions_user: {
                    documentId: userId
                }
            },
            populate: {
                task: {
                    fields: ['id', 'name', 'question', 'idealPrompt' ]
                }
            },
            sort: {
                createdAt: 'desc',
            }
        });

        const tasksResults = new Map<string, any>();

        for (const submission of submissions) {
            // Skip submissions with missing task references
            if (!submission.task || !submission.task.documentId) {
                console.warn(`Skipping submission ${submission.documentId} - missing task reference`);
                continue;
            }
            
            const taskId = submission.task.documentId;
            
            // Only process submissions for today's tasks
            if (!todayTaskIds.has(taskId)) continue;

            const taskGptResult: any = submission.result?.valueOf();
            if (taskGptResult == null) continue;

            const taskResult = await this.calculateTaskResult(
                taskId,
                submission.documentId,
                submission.createdAt.toString(),
                taskGptResult
            );

            if (!tasksResults.has(taskId)) {
                tasksResults.set(taskId, taskResult);
            }
        }

        return this.calculateUserResult(todayTasks, tasksResults);
    },

    async updateUserResult(userId: string) {
        const userResults = await this.getUserResults(userId);
        await strapi.query('plugin::users-permissions.user').update({
            where: { documentId: userId },
            data: {
                result: userResults.score?.toFixed(2)
            }
        });
    },

    async submitUserSolution(userId: string, taskId: string, solutionPrompt: string) {
        const SOLUTION_MIN_NON_WHITESPACE_CHARACTERS = 10;

        const solutionNonWhitespaceCharactersCount = await this.countNonWhitespaceCharacters(solutionPrompt);
        if (solutionNonWhitespaceCharactersCount < SOLUTION_MIN_NON_WHITESPACE_CHARACTERS) {
            throw new Error(`Solution should contain at least ${SOLUTION_MIN_NON_WHITESPACE_CHARACTERS} non-whitespace characters, found only ${solutionNonWhitespaceCharactersCount}`);
        }

        console.log('Creating submission with:', { userId, taskId, solutionPrompt: solutionPrompt.substring(0, 50) + '...' });

        try {
            const submission = await strapi.documents('api::submission.submission').create({
                data: {
                    users_permissions_user: userId,
                    task: taskId,
                    solutionPrompt
                }
            });

            console.log('Submission created successfully:', submission.documentId);

            // TODO: Refactor with some queue
            strapi.service('api::analyzer.submission-checker').checkSubmission(submission.documentId);
            
            return submission;
        } catch (error) {
            console.error('Submission creation failed:', error);
            throw error;
        }
    },

    async countNonWhitespaceCharacters(text: string): Promise<number> {
        return text.replace(/\s/g, '').length;
    },

    async createOrUpdateTaskScore(userId: string, taskId: string, submissionId: string, taskResult: any) {
        const totalScore = taskResult.criterionResults.reduce(
            (sum: number, criterion: any) => sum + criterion.score, 0
        );
        const maxPossibleScore = taskResult.criterionResults.length * 5;
        const percentageScore = Math.round((totalScore / maxPossibleScore) * 100);

        // Check if user already has a score for this task
        const existingScore = await strapi.documents('api::task-score.task-score').findMany({
            filters: {
                user: { documentId: userId },
                task: { documentId: taskId }
            },
            limit: 1
        });

        const scoreData = {
            user: userId,
            task: taskId,
            submission: submissionId,
            score: totalScore / taskResult.criterionResults.length, // Average score (1-5)
            percentageScore: percentageScore,
            attempts: 1, // First attempt
            isCompleted: true,
            completedAt: new Date().toISOString()
        };

        let isNewCompletion = false;

        if (existingScore.length > 0) {
            // Update existing score (increment attempts, update score if better)
            const existing = existingScore[0];
            const shouldUpdate = percentageScore > (existing.percentageScore || 0);
            
            await strapi.documents('api::task-score.task-score').update({
                documentId: existing.documentId,
                data: {
                    attempts: (existing.attempts || 1) + 1,
                    ...(shouldUpdate ? {
                        score: scoreData.score,
                        percentageScore: scoreData.percentageScore,
                        submission: submissionId,
                        completedAt: scoreData.completedAt
                    } : {})
                }
            });

            console.log(`Updated task score for user ${userId}, task ${taskId}. Attempt: ${(existing.attempts || 1) + 1}, Score: ${shouldUpdate ? percentageScore : existing.percentageScore}%`);
        } else {
            // Create new score record
            await strapi.documents('api::task-score.task-score').create({
                data: scoreData
            });

            console.log(`Created new task score for user ${userId}, task ${taskId}. Score: ${percentageScore}%`);
            isNewCompletion = true;
        }

        // Update user streak if this is a new task completion
        if (isNewCompletion) {
            try {
                await strapi.service('api::analyzer.streak').updateUserStreak(userId);
                console.log(`Updated streak for user ${userId} after completing task ${taskId}`);
            } catch (error) {
                console.error(`Failed to update streak for user ${userId}:`, error);
                // Don't throw error - streak update shouldn't break task completion
            }
        }
    },

    async getUserCompletedTasks(userId: string) {
        const taskScores = await strapi.documents('api::task-score.task-score').findMany({
            filters: {
                user: { documentId: userId },
                isCompleted: true
            },
            populate: {
                task: {
                    fields: ['id', 'name', 'Day']
                }
            }
        });

        return taskScores.map(score => ({
            taskId: score.task.documentId,
            taskName: score.task.name,
            taskDay: score.task.Day,
            score: score.score,
            percentageScore: score.percentageScore,
            attempts: score.attempts,
            completedAt: score.completedAt
        }));
    },

    async getAverageScores(excludeUserId?: string) {
        // Get all task scores for all users
        const allTaskScores = await strapi.documents('api::task-score.task-score').findMany({
            filters: {
                isCompleted: true,
                ...(excludeUserId ? {
                    user: {
                        documentId: {
                            $ne: excludeUserId // Exclude the specified user
                        }
                    }
                } : {})
            },
            populate: {
                task: {
                    fields: ['id', 'name']
                },
                submission: {
                    fields: ['result']
                }
            }
        });

        // Group scores by task
        const taskScoresMap = new Map();
        const criteriaScoresMap = new Map();

        for (const taskScore of allTaskScores) {
            const taskId = taskScore.task.documentId;
            const taskName = taskScore.task.name;

            // Track task-level average scores
            if (!taskScoresMap.has(taskId)) {
                taskScoresMap.set(taskId, {
                    taskId,
                    taskName,
                    scores: [],
                    totalScore: 0,
                    count: 0
                });
            }

            const taskData = taskScoresMap.get(taskId);
            taskData.scores.push(taskScore.score);
            taskData.totalScore += taskScore.score;
            taskData.count += 1;

            // Track criteria-level average scores from submission results
            if (taskScore.submission?.result) {
                const submissionResult = taskScore.submission.result;
                
                // Type check and parse the result if it's a string
                let resultData: any;
                if (typeof submissionResult === 'string') {
                    try {
                        resultData = JSON.parse(submissionResult);
                    } catch (e) {
                        continue; // Skip if can't parse
                    }
                } else {
                    resultData = submissionResult;
                }
                
                if (resultData && typeof resultData === 'object' && resultData.criteria) {
                    for (const [criterionId, criterionData] of Object.entries(resultData.criteria)) {
                        if (!criteriaScoresMap.has(criterionId)) {
                            criteriaScoresMap.set(criterionId, {
                                criterionId,
                                scores: [],
                                totalScore: 0,
                                count: 0
                            });
                        }

                        const criteriaDataEntry = criteriaScoresMap.get(criterionId);
                        let criterionScore = 0;
                        let subquestionCount = 0;

                        // Calculate criterion score from subquestions
                        if (criterionData && typeof criterionData === 'object' && 'subquestions' in criterionData) {
                            const subquestions = (criterionData as any).subquestions;
                            if (subquestions && typeof subquestions === 'object') {
                                for (const subquestionData of Object.values(subquestions)) {
                                    if (subquestionData && typeof subquestionData === 'object' && 'score' in subquestionData) {
                                        const score = (subquestionData as any).score;
                                        if (typeof score === 'number') {
                                            criterionScore += score;
                                            subquestionCount++;
                                        }
                                    }
                                }
                            }
                        }

                        if (subquestionCount > 0) {
                            const avgCriterionScore = criterionScore / subquestionCount;
                            criteriaDataEntry.scores.push(avgCriterionScore);
                            criteriaDataEntry.totalScore += avgCriterionScore;
                            criteriaDataEntry.count += 1;
                        }
                    }
                }
            }
        }

        // Calculate final averages
        const taskAverages = Array.from(taskScoresMap.values()).map(task => ({
            taskId: task.taskId,
            taskName: task.taskName,
            averageScore: task.totalScore / task.count,
            totalSubmissions: task.count
        }));

        const criteriaAverages = Array.from(criteriaScoresMap.values()).map(criterion => ({
            criterionId: criterion.criterionId,
            averageScore: criterion.totalScore / criterion.count,
            totalSubmissions: criterion.count
        }));

        return {
            taskAverages,
            criteriaAverages
        };
    }
};