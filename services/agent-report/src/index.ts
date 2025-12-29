import { McpAgent } from '@marketing-assistant/mcp-core';
import { Result } from '@marketing-assistant/schemas';

class ReportAgent extends McpAgent {
    constructor() {
        super({
            name: 'agent-report',
            version: '0.0.1'
        });

        this.registerTool({
            name: 'compile_report',
            description: 'Compiles analysis results into a structured format (Markdown).',
            inputSchema: {
                type: 'object',
                properties: {
                    job_id: { type: 'string' },
                    data: { type: 'object' }
                },
                required: ['job_id', 'data']
            }
        });

        this.registerTool({
            name: 'export_pdf',
            description: 'Converts report content into a PDF file.',
            inputSchema: {
                type: 'object',
                properties: {
                    job_id: { type: 'string' },
                    report_content: { type: 'string' }
                },
                required: ['job_id', 'report_content']
            }
        });
    }

    async start() {
        await this.connect();

        // Handle Compile Task
        this.bus.subscribe<any>('task.report.compile', async (task) => {
            console.log(`Received compile task: ${task.id}`);
            try {
                // Logic: Transform JSON data to Markdown
                const markdown = `# Marketing Analysis Report\nJob ID: ${task.payload.job_id}\n\n## Analysis\n${JSON.stringify(task.payload.data, null, 2)}`;

                const result: Result = {
                    taskId: task.id,
                    status: 'success',
                    data: {
                        markdown: markdown,
                        format: 'markdown'
                    }
                };
                await this.bus.publish('task.result', result);
            } catch (err: any) {
                console.error(err);
                await this.bus.publish('task.result', { taskId: task.id, status: 'error', error: err.message });
            }
        });

        // Handle Export Task
        this.bus.subscribe<any>('task.report.pdf', async (task) => {
            console.log(`Received PDF export task: ${task.id}`);
            try {
                // Logic: Simulate PDF generation
                // Real flow: HTML -> PDF -> Upload to S3 -> Return URL
                // M0: Return stub
                console.log('Generating PDF...');
                await new Promise(r => setTimeout(r, 1000));

                const result: Result = {
                    taskId: task.id,
                    status: 'success',
                    data: {
                        pdfUrl: `http://minio/analysis-cache/jobs/${task.payload.job_id}/report.pdf`,
                        size: 1024
                    }
                };
                await this.bus.publish('task.result', result);
            } catch (err: any) {
                console.error(err);
                await this.bus.publish('task.result', { taskId: task.id, status: 'error', error: err.message });
            }
        });
    }
}

const agent = new ReportAgent();
agent.start().catch(err => {
    console.error(err);
    process.exit(1);
});
