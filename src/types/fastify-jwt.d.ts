import '@fastify/jwt'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { sub: string; name: string }
        user: { sub: string; name: string, iat: number, exp: number }
    }
}
