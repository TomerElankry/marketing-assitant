import { z } from 'zod';

export const ValidateQuestionnaireSchema = z.object({
    questionnaire_id: z.string().uuid(),
});

export type ValidateQuestionnaireInput = z.infer<typeof ValidateQuestionnaireSchema>;

export const NormalizationResultSchema = z.object({
    valid: z.boolean(),
    issues: z.array(z.string()),
    normalized_data: z.record(z.any()).optional(),
});

export type NormalizationResult = z.infer<typeof NormalizationResultSchema>;
