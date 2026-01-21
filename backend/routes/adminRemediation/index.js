const adminRemediationService = require('../../services/payment/adminRemediationService');
const { verifyAuth } = require('../../plugins/authVerify');

// Simplified schema validation for endpoints
const forceTransitionSchema = {
    body: {
        type: 'object',
        required: ['payoutId', 'targetStatus', 'justification', 'idempotencyKey'],
        properties: {
            payoutId: { type: 'string' },
            targetStatus: { type: 'string', enum: ['FAILED', 'CANCELLED'] },
            justification: { type: 'string', minLength: 5 },
            idempotencyKey: { type: 'string' }
        }
    }
};

const ledgerCorrectionSchema = {
    body: {
        type: 'object',
        required: ['targetUserUid', 'type', 'amount', 'currency', 'justification', 'anchors', 'idempotencyKey'],
        properties: {
            targetUserUid: { type: 'string' },
            type: { type: 'string', enum: ['admin_correction_credit', 'admin_correction_debit'] },
            amount: { type: 'integer' }, // Fastify/AJV integer validation
            currency: { type: 'string', minLength: 3, maxLength: 3 },
            justification: { type: 'string', minLength: 5 },
            anchors: {
                type: 'object',
                properties: {
                    relatedPayoutId: { type: 'string' },
                    relatedLedgerEntryId: { type: 'string' },
                    externalReference: { type: 'string' }
                }
            },
            idempotencyKey: { type: 'string' }
        }
    }
};

const resolveAnomalySchema = {
    body: {
        type: 'object',
        required: ['targetModel', 'targetId', 'note', 'idempotencyKey'],
        properties: {
            targetModel: { type: 'string', enum: ['Payout', 'LedgerEntry'] },
            targetId: { type: 'string' },
            note: { type: 'string', minLength: 5 },
            idempotencyKey: { type: 'string' }
        }
    }
};

async function adminRemediationRoutes(fastify, options) {
    // Auth Middleware: Strict SUPER_ADMIN only
    const superAdminAuth = verifyAuth(['super_admin']);

    fastify.post('/force-transition', {
        schema: forceTransitionSchema,
        preHandler: superAdminAuth
    }, async (request, reply) => {
        const { payoutId, targetStatus, justification, idempotencyKey } = request.body;
        const result = await adminRemediationService.forceTransitionPayout(
            request.user.uid,
            payoutId,
            targetStatus,
            justification,
            idempotencyKey
        );
        return result;
    });

    fastify.post('/ledger-correction', {
        schema: ledgerCorrectionSchema,
        preHandler: superAdminAuth
    }, async (request, reply) => {
        const { targetUserUid, type, amount, currency, justification, anchors, idempotencyKey } = request.body;
        const result = await adminRemediationService.applyLedgerCorrection(
            request.user.uid,
            targetUserUid,
            type,
            amount,
            currency,
            justification,
            anchors,
            idempotencyKey
        );
        return result;
    });

    fastify.post('/resolve-anomaly', {
        schema: resolveAnomalySchema,
        preHandler: superAdminAuth
    }, async (request, reply) => {
        const { targetModel, targetId, note, idempotencyKey } = request.body;
        const result = await adminRemediationService.resolveAnomaly(
            request.user.uid,
            targetModel,
            targetId,
            note,
            idempotencyKey
        );
        return result;
    });
}

module.exports = adminRemediationRoutes;
