import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = Fastify({
    logger: true
});

app.register(cors, {
    origin: '*', // Configure properly in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

app.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret'
});

import { authRoutes } from './routes/auth.routes';

import { listsRoutes } from './routes/lists.routes';
import { giftsRoutes } from './routes/gifts.routes';
import { publicRoutes } from './routes/public.routes';
import { profileRoutes } from './routes/profile.routes';

app.register(authRoutes);
app.register(listsRoutes);
app.register(giftsRoutes);
app.register(publicRoutes);
app.register(profileRoutes);

app.get('/health', async (request, reply) => {
    return { status: 'ok' };
});

const start = async () => {
    try {
        await app.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
