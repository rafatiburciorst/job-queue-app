import { Queue, Worker } from 'bullmq';
import { fastify } from 'fastify'
import IORedis from 'ioredis';

const app = fastify()

const connection = new IORedis({
    maxRetriesPerRequest: null
})

const jobQueue = new Queue('jobQueue', { connection })

app.post('/addQueue', async (request, reply) => {
    const job = await jobQueue.add('job', request.body)
    return reply.status(201).send({ jobId: job.id });
})

const worker = new Worker('jobQueue', async (job) => {
    console.log('processamento', job.data)
}, { connection, concurrency: 2 })

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
})

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});

app.listen({
    host: '0.0.0.0',
    port: 3333
}).then(() => console.log('HTTP Server Running'))