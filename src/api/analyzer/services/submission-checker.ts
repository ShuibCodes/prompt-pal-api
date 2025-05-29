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
}