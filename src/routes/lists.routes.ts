import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function listsRoutes(app: FastifyInstance) {
    app.addHook('preHandler', async (request) => {
        await request.jwtVerify();
    });

    app.get('/lists', async (request) => {
        const userId = request.user.sub;

        const lists = await prisma.giftList.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                gifts: true,
                _count: {
                    select: { gifts: true }
                }
            }
        });

        return lists;
    });

    app.post('/lists', async (request, reply) => {
        const createListSchema = z.object({
            title: z.string(),
            description: z.string().optional(),
            slug: z.string(),
            eventDate: z.string().optional(),
            eventType: z.string().optional(),
        });

        const { title, description, slug, eventDate, eventType } = createListSchema.parse(request.body);
        const userId = request.user.sub;

        try {
            const list = await prisma.giftList.create({
                data: {
                    title,
                    description,
                    slug,
                    userId,
                    eventDate: eventDate ? new Date(eventDate) : undefined,
                    eventType,
                },
            });
            return reply.status(201).send(list);
        } catch (error) {
            return reply.status(400).send({ message: 'Slug already exists or invalid data.' });
        }
    });

    app.get('/lists/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });

        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;

        const list = await prisma.giftList.findUnique({
            where: { id },
            include: { gifts: true },
        });

        if (!list) {
            return reply.status(404).send({ message: 'List not found.' });
        }

        if (list.userId !== userId) {
            return reply.status(403).send({ message: 'You do not have access to this list.' });
        }

        return list;
    });

    app.delete('/lists/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });

        const { id } = paramsSchema.parse(request.params);
        const userId = request.user.sub;

        const list = await prisma.giftList.findUnique({
            where: { id },
        });

        if (!list) {
            return reply.status(404).send({ message: 'List not found.' });
        }

        if (list.userId !== userId) {
            return reply.status(403).send({ message: 'You do not have access to this list.' });
        }

        await prisma.giftList.delete({
            where: { id },
        });

        return reply.status(204).send();
    });
    app.patch('/lists/:id', async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        });
        const bodySchema = z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            isPrivate: z.boolean().optional(),
            eventDate: z.string().optional(),
            eventType: z.string().optional(),
        });

        const { id } = paramsSchema.parse(request.params);
        const { title, description, isPrivate, eventDate, eventType } = bodySchema.parse(request.body);
        const userId = request.user.sub;

        const list = await prisma.giftList.findUnique({ where: { id } });

        if (!list) return reply.status(404).send({ message: 'List not found' });
        if (list.userId !== userId) return reply.status(403).send({ message: 'Unauthorized' });

        const updatedList = await prisma.giftList.update({
            where: { id },
            data: {
                title,
                description,
                isPrivate,
                eventDate: eventDate ? new Date(eventDate) : undefined,
                eventType,
            }
        });
        return updatedList;
    });
}
