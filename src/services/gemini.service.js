const axios = require('axios');
const { withRetry } = require('../utils/retry');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const MODEL = 'gemini-3.8-flash';

const triageSchema = {
    type: 'object',
    properties: {
        category: {
            type: 'string',
            enum: ['how_to', 'bug', 'billing', 'access_issue', 'feature_request', 'other']
        },
        can_auto_resolve: { type: 'boolean' },
        suggested_response: { type: 'string' },
        escalation_reason: { type: 'string' }
    },
    required: ['category', 'can_auto_resolve', 'suggested_response']
};

const SYSTEM_INSTRUCTION = `You are a support ticket triage assistant for a SaaS helpdesk.
For each ticket, classify it, decide if it can be safely auto-resolved, and draft a response.

Rules:
- can_auto_resolve is true only for common, low-risk issues with a clear standard fix (password resets, how-to questions, known settings changes).
- can_auto_resolve is false for anything involving a possible bug, data loss, billing disputes, or an enterprise-tier account reporting an outage.
- When can_auto_resolve is false, escalation_reason must briefly explain why a human needs to look at it.
- suggested_response is always required: if auto-resolving, it's the reply to send the customer. If escalating, it's a short internal note for the agent picking it up.`;



function extractTriageJson(data) {
    if (data.output_text) return JSON.parse(data.output_text);
    const outputStep = [...(data.steps || [])].reverse().find((s) => s.type === 'model_output');
    const textBlock = outputStep?.content?.find((c) => c.type === 'text');
    if (!textBlock) throw new Error('No model output found in Gemini response');
    return JSON.parse(textBlock.text);
}

module.exports = { triageTicket };

async function triageTicket(ticket) {
    const input = `Subject: ${ticket.subject}
Account tier: ${ticket.account_tier}
Description: ${ticket.description}`;

    const call = () =>
        axios.post(
            GEMINI_URL,
            {
                model: MODEL,
                system_instruction: SYSTEM_INSTRUCTION,
                input,
                response_format: {
                    type: 'text',
                    mime_type: 'application/json',
                    schema: triageSchema
                }
            },
            {
                headers: {
                    'x-goog-api-key': process.env.GEMINI_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

    const response = await withRetry(call);
    return extractTriageJson(response.data);
}

module.exports = { triageTicket };