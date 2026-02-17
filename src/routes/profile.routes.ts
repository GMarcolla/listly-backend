import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function profileRoutes(app: FastifyInstance) {
    app.addHook('preHandler', async (request) => {
        await request.jwtVerify();
    });

    // GET /profile - Get current user's profile
    app.get('/profile', async (request) => {
        const userId = request.user.sub;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                birthDate: true,
                createdAt: true,
            },
        });

        if (!user) {
            return { message: 'User not found' };
        }

        return user;
    });

    // PATCH /profile - Update current user's profile
    app.patch('/profile', async (request, reply) => {
        const userId = request.user.sub;

        const updateSchema = z.object({
            name: z.string().optional(),
            cpf: z.string().optional(),
            birthDate: z.string().optional(),
        });

        const { name, cpf, birthDate } = updateSchema.parse(request.body);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                cpf,
                birthDate: birthDate ? new Date(birthDate) : undefined,
            },
            select: {
                id: true,
                name: true,
                email: true,
                cpf: true,
                birthDate: true,
            },
        });

        return updatedUser;
    });
}
