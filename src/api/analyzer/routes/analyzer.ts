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
    ],
};
