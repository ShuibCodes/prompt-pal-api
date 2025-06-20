export default {
    routes: [
        {
            method: 'GET',
            path: '/analyzer/users/:userId/results',
            handler: 'analyzer.getUserResults',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/tasks/:taskId/results',
            handler: 'analyzer.getUserResultsForTask',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/tasks',
            handler: 'analyzer.getUserTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/image-tasks',
            handler: 'analyzer.getUserImageTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/streak',
            handler: 'analyzer.getUserStreak',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/completed-tasks',
            handler: 'analyzer.getUserCompletedTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/streak-leaderboard',
            handler: 'analyzer.getStreakLeaderboard',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/tasks/:taskId',
            handler: 'analyzer.getTaskById',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/tasks',
            handler: 'analyzer.getUserTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/image-tasks',
            handler: 'analyzer.getUserImageTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/results',
            handler: 'analyzer.getUserResults',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId/streak',
            handler: 'analyzer.getUserStreak',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/:userId/submit',
            handler: 'analyzer.submitUserSolution',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/:userId',
            handler: 'analyzer.getUserById',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/users/external/:externalId',
            handler: 'analyzer.getUserByExternalId',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/create',
            handler: 'analyzer.createNewUser',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/submissions/:submissionId/check',
            handler: 'analyzer.checkSubmission',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/criteria',
            handler: 'analyzer.getCriteria',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/:userId/send-results',
            handler: 'analyzer.sendResultsEmail',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/:userId/tasks/:taskId/send-results',
            handler: 'analyzer.sendTaskResultsEmail',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/generate-image',
            handler: 'analyzer.generateImage',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/evaluate-images',
            handler: 'analyzer.evaluateImageComparison',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/daily-tasks',
            handler: 'analyzer.getDailyTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/analyzer/average-scores',
            handler: 'analyzer.getAverageScores',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/google-signin',
            handler: 'analyzer.googleSignIn',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/send-daily-notifications',
            handler: 'analyzer.sendDailyNotifications',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/:userId/sync-streak',
            handler: 'analyzer.syncUserStreak',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        // Profile Settings Routes
        {
            method: 'GET',
            path: '/analyzer/users/:userId/profile',
            handler: 'analyzer.getUserProfile',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/analyzer/users/:userId/profile',
            handler: 'analyzer.updateUserProfile',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/analyzer/users/:userId/password',
            handler: 'analyzer.changePassword',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/:userId/account/delete',
            handler: 'analyzer.deleteAccount',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/analyzer/users/:userId/notifications',
            handler: 'analyzer.updateNotificationPreferences',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
    ],
};
