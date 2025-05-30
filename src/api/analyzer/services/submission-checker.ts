import OpenAI from "openai";

const openai = new OpenAI();
openai.apiKey = process.env.OPENAI_API_KEY;

export default {
    async getCriteria() {
        return await strapi.documents('api::criterion.criterion').findMany({
            fields: [ 'name' ],
            filters: {
                subquestions: {
                    id: {
                        $notNull: true
                    }
                }
            },
            status: 'published',
            populate: {
                subquestions: {
                    fields: [ 'question' ],
                }
            }
        });
    },

    async generateGptResponseSchemaSubquestions(subquestions: any) {
        let subquestionsSchema: any = {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": false,
        };

        for (const subquestion of subquestions) {
            subquestionsSchema.properties[subquestion.documentId] = {
                "type": "object",
                "properties": {
                    "score": {
                        "type": "number",
                        //"minimum": 1,
                        //"maximum": 5
                    },
                    "feedback": {
                        "type": "string",
                        //"maxLength": 200
                    }
                },
                "required": [ "score", "feedback" ],
                "additionalProperties": false,
            };
            subquestionsSchema.required.push(subquestion.documentId);
        }

        return subquestionsSchema;
    },

    async generateGptResponseSchemaCriteria(criteria: any) {
        let criteriaSchema: any = {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": false,
        };

        for (const criterion of criteria) {
            criteriaSchema.properties[criterion.documentId] = {
                "type": "object",
                "properties": {
                    "subquestions": await this.generateGptResponseSchemaSubquestions(criterion.subquestions)
                },
                "required": [ "subquestions" ],
                "additionalProperties": false,
            };
            criteriaSchema.required.push(criterion.documentId);
        }

        return criteriaSchema;
    },

    async generateGptResponseSchema(criteria: any) {
        let schema: any = {
            "type": "object",
            "properties": {
                "criteria": await this.generateGptResponseSchemaCriteria(criteria)
            },
            "required": [ "criteria" ],
            "additionalProperties": false,
        };

        return schema;
    },

    async checkSubmission(submissionId: string) {
        const submission = await strapi.documents('api::submission.submission').findOne({
            documentId: submissionId,
            populate: {
                task: {
                    fields: [ 'name', 'question', 'idealPrompt' ]
                },
                appUser: {
                    fields: []
                }
            }
        });
        const criteria = await this.getCriteria();

        const gptResponseSchema = await this.generateGptResponseSchema(criteria);

        const gptGuidelines = `
        You are given a task for user to write a prompt. You need to analyze user's entered solution prompt and score it depending on given ideal prompt and criteria. Of course, ideal prompt is just a reference, you need to base your scores mostly on criteria. Provide score (from 1 to 5) and feedback (up to 200 letters) for each criterion subquestion (JSON schema for output is provided). Don't hesitate to provide low scores when needed. If prompt is irrelevant, e.g. empty or just a set of random words/letters, rate it with score 1. If prompt is effectively just a reworded copy of the task, rate it with score 1 or 2.

        Task for user to write a prompt:
        [${submission.task.name}] ${submission.task.question}

        Ideal prompt:
        ${submission.task.idealPrompt}

        Criteria (as JSON, don't look at "id" properties - use "documentId" instead):
        ${JSON.stringify({ criteria })}
        `;

        const userSolution = `My solution:\n${submission.solutionPrompt}`;

        const response = await openai.responses.create({
            model: "gpt-4o-mini-2024-07-18",
            input: [
                {"role": "system", "content": gptGuidelines},
                {"role": "user", "content": userSolution}
            ],
            text: {
                format: {
                    type: "json_schema",
                    name: "prompt_results",
                    schema: gptResponseSchema,
                }
            }
        });

        await strapi.documents('api::submission.submission').update({
            documentId: submission.documentId,
            data: {
                result: JSON.parse(response.output_text)
            }
        });

        await strapi.service('api::analyzer.user-results').updateUserResult(submission.appUser.documentId);
    },

    async checkImageComparison(taskId: string, userImageUrl: string, expectedImageUrl: string) {
        try {
            console.log('Starting image comparison for task:', taskId);
            console.log('User image URL:', userImageUrl);
            console.log('Expected image URL:', expectedImageUrl);

            const task = await strapi.service('api::analyzer.analyzer').getTaskById(taskId);
            
            if (!task) {
                throw new Error('Task not found');
            }

            console.log('Task found:', task.name);

            const criteria = await this.getCriteria();
            console.log('Criteria loaded:', criteria.length, 'criteria');

            const gptResponseSchema = await this.generateGptResponseSchema(criteria);

            const gptGuidelines = `
            You are an expert image evaluator. You need to analyze and compare two images: the user's generated image and the expected target image. Score the user's image based on how well it matches the expected result using the given criteria.

            Task that the user was trying to accomplish:
            [${task.name}] ${task.question}

            Your job is to compare:
            1. The user's generated image (first image)
            2. The expected target image (second image)

            Evaluate how well the user's generated image matches the expected result based on these criteria. Consider aspects like:
            - Visual similarity and composition
            - Color scheme and style matching
            - Subject matter accuracy
            - Overall quality and adherence to the task requirements

            Provide score (from 1 to 5) and feedback (up to 200 characters) for each criterion subquestion. Be objective and thorough in your evaluation.

            Criteria (as JSON, don't look at "id" properties - use "documentId" instead):
            ${JSON.stringify({ criteria })}
            `;

            console.log('Making OpenAI API call...');

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Cheapest vision model
                messages: [
                    {
                        role: "system",
                        content: gptGuidelines
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Please evaluate how well the first image (user's result) matches the second image (expected result) based on the criteria provided."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: userImageUrl,
                                    detail: "low" // Use low detail for cost efficiency
                                }
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: expectedImageUrl,
                                    detail: "low" // Use low detail for cost efficiency
                                }
                            }
                        ]
                    }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "image_evaluation_results",
                        schema: gptResponseSchema,
                    }
                },
                max_tokens: 2000
            });

            console.log('OpenAI response received');
            console.log('Response content:', response.choices[0].message.content);

            if (!response.choices[0].message.content) {
                throw new Error('No content received from OpenAI API');
            }

            const result = JSON.parse(response.choices[0].message.content);
            console.log('Parsed result:', JSON.stringify(result, null, 2));
            
            return result;
        } catch (error) {
            console.error('Error in checkImageComparison:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    },
}