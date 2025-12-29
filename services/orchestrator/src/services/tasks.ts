import { MessageBus } from '@marketing-assistant/bus';
import { JobRepository } from '../repositories/job.js';
import { Job, Task, BusSubjects, Result } from '@marketing-assistant/schemas';

export class TaskService {
    private bus: MessageBus;
    private jobRepo: JobRepository;

    constructor(bus: MessageBus, jobRepo: JobRepository) {
        this.bus = bus;
        this.jobRepo = jobRepo;
    }

    async submitTask(task: Task): Promise<Job> {
        // 1. Persist Job
        const job: Job = {
            type: task.type,
            status: 'pending',
            config: task.payload,
            trace_id: task.id, // Using task ID as trace for now
        };

        const savedJob = await this.jobRepo.createJob(job);

        // 2. Publish to NATS
        // We use the job ID as the canonical Task ID on the bus now? 
        // Or keep the correlation. Let's use the Saved Job ID.
        const busTask: Task = {
            id: savedJob.id!, // Use database ID
            type: savedJob.type,
            payload: savedJob.config,
        };

        const subject = `task.${task.type}`;
        await this.bus.publish(subject, busTask);

        console.log(`Task submitted: ${savedJob.id} (${subject})`);

        return savedJob;
    }

    async startResultListener() {
        this.bus.subscribe<Result>(BusSubjects.TaskResult, async (result) => {
            console.log(`Received result for task: ${result.taskId}, status: ${result.status}`);

            await this.jobRepo.updateStatus(
                result.taskId,
                result.status === 'success' ? 'completed' : 'failed',
                new Date()
            );
        });
    }
}
