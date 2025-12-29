import { connect, NatsConnection, JSONCodec } from 'nats';

export class MessageBus {
    private nc: NatsConnection | undefined;
    private jsonCodec = JSONCodec();

    async connect(url: string) {
        this.nc = await connect({ servers: url });
        console.log(`Connected to NATS at ${url}`);
    }

    async publish<T>(subject: string, data: T) {
        if (!this.nc) {
            throw new Error('Not connected to NATS');
        }
        this.nc.publish(subject, this.jsonCodec.encode(data));
    }

    subscribe<T>(subject: string, callback: (data: T) => void) {
        if (!this.nc) {
            throw new Error('Not connected to NATS');
        }
        const sub = this.nc.subscribe(subject);
        (async () => {
            for await (const m of sub) {
                callback(this.jsonCodec.decode(m.data) as T);
            }
        })();
    }

    async close() {
        if (this.nc) {
            await this.nc.close();
        }
    }
}
