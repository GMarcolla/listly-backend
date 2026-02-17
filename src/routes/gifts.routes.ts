import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function giftsRoutes(app: FastifyInstance) {
    app.addHook('preHandler', async (request) => {
        await request.jwtVerify();
    });

    app.post('/lists/:listId/gifts', async (request, reply) => {
        const paramsSchema = z.object({
            listId: z.string().uuid(),
        });

        const bodySchema = z.object({
            name: z.string(),
            description: z.string().optional(),
            price: z.number().min(0),
            imageUrl: z.string().url().optional(),
            category: z.string().optional(),
        });

        const { listId } = paramsSchema.parse(request.params);
        const { name, description, price, imageUrl, category } = bodySchema.parse(request.body);
        const userId = request.user.sub;

        const list = await prisma.giftList.findUnique({
            where: { id: listId },
        });

        if (!list) return reply.status(404).send({ message: 'List not found.' });
        if (list.userId !== userId) return reply.status(403).send({ message: 'Unauthorized.' });

        const gift = await prisma.gift.create({
            data: {
                name,
                description,
                price,
                imageUrl,
                category: category || 'OUTROS',
                listId,
            },
        });

        return reply.status(201).send(gift);
    });

    app.delete('/gifts/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });

        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;

        const gift = await prisma.gift.findUnique({
            where: { id },
            include: { list: true }
        });

        if (!gift) return reply.status(404).send({ message: 'Gift not found.' });
        if (gift.list.userId !== userId) return reply.status(403).send({ message: 'Unauthorized.' });

        await prisma.gift.delete({
            where: { id },
        });

        return reply.status(204).send();
    });

    app.patch('/gifts/:id/status', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });

        const bodySchema = z.object({
            status: z.enum(['AVAILABLE', 'RESERVED', 'PURCHASED']),
        });

        const { id } = paramsSchema.parse(request.params);
        const { status } = bodySchema.parse(request.body);

        // Public endpoint for now, or protected? 
        // Usually public users can mark as purchased.
        // So we might skip jwtVerify for this specific route if we move it out of the protected block,
        // or we make it protected but allow "guest" tokens.
        // For simplicity, let's keep it protected for owner OR make it public in public.routes.ts?
        // Actually, let's put it in public.routes.ts if we want guests to use it.
        // If it's here, it requires auth.
        // Let's assume only the owner can change status for now (managing the list), 
        // OR we move it to public routes. 
        // The requirement didn't specify. Let's keep it here for owner.

        // WAIT: If I want the "guest" to click "Buy", they need to change status.
        // I should probably move this to `publicRoutes` or make a separate public action.
        // I'll put a specific "mark-purchased" in `publicRoutes`.

        const userId = request.user.sub;
        const gift = await prisma.gift.findUnique({
            where: { id },
            include: { list: true }
        });

        if (!gift) return reply.status(404).send({ message: 'Gift not found.' });
        if (gift.list.userId !== userId) return reply.status(403).send({ message: 'Unauthorized.' });

        const updatedGift = await prisma.gift.update({
            where: { id },
            data: { status }
        });

        return reply.send(updatedGift);
    });
    app.put('/gifts/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });

        const bodySchema = z.object({
            name: z.string(),
            description: z.string().optional(),
            price: z.number().min(0),
            imageUrl: z.string().url().optional(),
            category: z.string().optional(),
        });

        const { id } = paramsSchema.parse(request.params);
        const { name, description, price, imageUrl, category } = bodySchema.parse(request.body);
        const userId = request.user.sub;

        const gift = await prisma.gift.findUnique({
            where: { id },
            include: { list: true }
        });

        if (!gift) return reply.status(404).send({ message: 'Gift not found.' });
        if (gift.list.userId !== userId) return reply.status(403).send({ message: 'Unauthorized.' });

        const updatedGift = await prisma.gift.update({
            where: { id },
            data: {
                name,
                description,
                price,
                imageUrl,
                category: category || 'OUTROS',
            }
        });

        return reply.send(updatedGift);
    });
}
