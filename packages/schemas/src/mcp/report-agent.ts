import { z } from 'zod';

export const CompileReportSchema = z.object({
    job_id: z.string().uuid(),
    format: z.enum(['markdown', 'json']).default('markdown'),
});

export type CompileReportInput = z.infer<typeof CompileReportSchema>;

export const ExportPdfSchema = z.object({
    report_content: z.string(),
    job_id: z.string().uuid(),
});

export type ExportPdfInput = z.infer<typeof ExportPdfSchema>;
