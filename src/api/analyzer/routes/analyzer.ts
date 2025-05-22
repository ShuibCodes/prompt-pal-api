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
            path: '/analyzer/users/:userId/tasks',
            handler: 'analyzer.getUserTasks',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users/:userId/submissions',
            handler: 'analyzer.submitUserSolution',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/users',
            handler: 'analyzer.createNewUser',
            config: {
                policies: [],
                middlewares: [],
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/analyzer/submissions/:submissionId/check',
            handler: 'analyzer.checkSubmission',
            config: {
                policies: [],
                middlewares: [],
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
    ],
};
