import Fastify from 'fastify';
import { MessageBus } from '@marketing-assistant/bus';
import { TaskSchema } from '@marketing-assistant/schemas';
import { DiscoveryService } from './services/discovery.js';
import { initDB, getPool } from './db/index.js';
import { JobRepository } from './repositories/job.js';
import { TaskService } from './services/tasks.js';
import { StorageService } from './services/storage.js';
import { ArtifactRepository, Artifact } from './repositories/artifact.js';

const fastify = Fastify({ logger: true });
const bus = new MessageBus();
const discovery = new DiscoveryService(bus);
const storage = new StorageService();

// NATS URL - assume local for now, or from env
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';

let taskService: TaskService;
let artifactRepo: ArtifactRepository;

fastify.post('/tasks', async (request, reply) => {
    const body = request.body as any;
    // Basic validation using Zod schema (could be middleware)
    const result = TaskSchema.safeParse(body);

    if (!result.success) {
        return reply.status(400).send({ error: result.error });
    }

    const task = result.data;

    try {
        const job = await taskService.submitTask(task);
        return { status: 'queued', taskId: job.id, job };
    } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ error: 'Failed to publish task' });
    }
});

// Artifacts - Get Upload URL
fastify.post('/artifacts/upload-url', async (request, reply) => {
    const { jobId, filename, mimeType } = request.body as any;

    if (!jobId || !filename) {
        return reply.status(400).send({ error: 'jobId and filename required' });
    }

    const objectName = `jobs/${jobId}/${filename}`;
    const uploadUrl = await storage.getUploadUrl(objectName);

    // Create pending artifact record
    const artifact = await artifactRepo.createArtifact({
        job_id: jobId,
        name: filename,
        path: objectName,
        bucket: 'analysis-cache',
        mime_type: mimeType,
    });

    return { uploadUrl, artifactId: artifact.id, path: objectName };
});

// Artifacts - Get Download URL
fastify.get('/artifacts/:id/download-url', async (request, reply) => {
    const { id } = request.params as any;
    const artifact = await artifactRepo.getArtifact(id);

    if (!artifact) {
        return reply.status(404).send({ error: 'Artifact not found' });
    }

    const downloadUrl = await storage.getDownloadUrl(artifact.path);
    return { downloadUrl };
});

// Discovery Endpoint
fastify.get('/tools', async (request, reply) => {
    return discovery.getAllTools();
});

const start = async () => {
    try {
        // Init DB
        initDB();
        const pool = getPool();
        const jobRepo = new JobRepository(pool);
        artifactRepo = new ArtifactRepository(pool);

        await bus.connect(NATS_URL);
        await storage.ensureBucket();

        // Init Services
        taskService = new TaskService(bus, jobRepo);
        await taskService.startResultListener();

        discovery.start();
        // Trigger initial discovery
        await discovery.refresh();

        await fastify.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err: any) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

