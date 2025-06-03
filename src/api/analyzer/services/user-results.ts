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

    async getUserResults(userId: string) {
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

        const userTasks = await strapi.service('api::analyzer.analyzer').getUserTasks(userId);

        const tasksResults = new Map<string, any>();

        for (const submission of submissions) {
            const taskId = submission.task.documentId;
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

        return this.calculateUserResult(userTasks, tasksResults);
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

        const submission = await strapi.documents('api::submission.submission').create({
            data: {
                users_permissions_user: userId,
                task: taskId,
                solutionPrompt
            }
        });

        // TODO: Refactor with some queue
        strapi.service('api::analyzer.submission-checker').checkSubmission(submission.documentId);
    },

    async countNonWhitespaceCharacters(text: string): Promise<number> {
        return text.replace(/\s/g, '').length;
    }
};