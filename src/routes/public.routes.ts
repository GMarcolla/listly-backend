import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function publicRoutes(app: FastifyInstance) {
    app.get('/public/lists/:slug', async (request, reply) => {
        const paramsSchema = z.object({
            slug: z.string(),
        });

        const { slug } = paramsSchema.parse(request.params);

        const list = await prisma.giftList.findUnique({
            where: { slug },
            include: {
                user: { select: { name: true } },
                gifts: {
                    where: { status: { not: 'PURCHASED' } } // Optional: Filter purchased gifts or show them differently?
                    // Actually, for a registry, usually you want to see what is taken.
                    // Let's return all gifts for now.
                }
            },
        });

        if (!list) {
            return reply.status(404).send({ message: 'List not found.' });
        }

        // access gifts again to include all
        const fullList = await prisma.giftList.findUnique({
            where: { slug },
            include: {
                user: { select: { name: true } },
                gifts: true
            }
        });

        return fullList;
    });

    app.patch('/public/gifts/:id/purchase', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });
        const { id } = paramsSchema.parse(request.params);

        const gift = await prisma.gift.findUnique({ where: { id } });
        if (!gift) return reply.status(404).send({ message: 'Gift not found.' });

        if (gift.status !== 'AVAILABLE') {
            return reply.status(400).send({ message: 'Gift is not available.' });
        }

        await prisma.gift.update({
            where: { id },
            data: { status: 'PURCHASED' }
        });

        return reply.send({ message: 'Gift marked as purchased.' });
    });
}
