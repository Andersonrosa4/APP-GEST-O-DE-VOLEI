import { z } from 'zod';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: { method: 'POST' as const, path: '/api/login' as const, input: z.object({ email: z.string(), password: z.string() }), responses: { 200: z.any(), 401: z.object({ message: z.string() }) } },
    logout: { method: 'POST' as const, path: '/api/logout' as const, responses: { 200: z.object({ message: z.string() }) } },
    me: { method: 'GET' as const, path: '/api/user' as const, responses: { 200: z.any(), 401: z.null() } },
    athleteAccess: { method: 'POST' as const, path: '/api/athlete-access' as const, input: z.object({ code: z.string().length(4) }), responses: { 200: z.any(), 404: errorSchemas.notFound } },
  },
  users: {
    list: { method: 'GET' as const, path: '/api/users' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/users' as const, input: z.any(), responses: { 201: z.any(), 400: errorSchemas.validation } },
    delete: { method: 'DELETE' as const, path: '/api/users/:id' as const, responses: { 200: z.any(), 404: errorSchemas.notFound } },
  },
  tournaments: {
    list: { method: 'GET' as const, path: '/api/tournaments' as const, responses: { 200: z.array(z.any()) } },
    get: { method: 'GET' as const, path: '/api/tournaments/:id' as const, responses: { 200: z.any(), 404: errorSchemas.notFound } },
    create: { method: 'POST' as const, path: '/api/tournaments' as const, input: z.any(), responses: { 201: z.any() } },
    update: { method: 'PATCH' as const, path: '/api/tournaments/:id' as const, input: z.any(), responses: { 200: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/tournaments/:id' as const, responses: { 200: z.any() } },
  },
  categories: {
    list: { method: 'GET' as const, path: '/api/tournaments/:id/categories' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/categories' as const, input: z.any(), responses: { 201: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/categories/:id' as const, responses: { 200: z.any() } },
  },
  athletes: {
    list: { method: 'GET' as const, path: '/api/tournaments/:id/athletes' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/athletes' as const, input: z.any(), responses: { 201: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/athletes/:id' as const, responses: { 200: z.any() } },
  },
  teams: {
    list: { method: 'GET' as const, path: '/api/categories/:categoryId/teams' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/teams' as const, input: z.any(), responses: { 201: z.any() } },
    delete: { method: 'DELETE' as const, path: '/api/teams/:id' as const, responses: { 200: z.any() } },
  },
  matches: {
    list: { method: 'GET' as const, path: '/api/categories/:categoryId/matches' as const, responses: { 200: z.array(z.any()) } },
    generate: { method: 'POST' as const, path: '/api/categories/:categoryId/generate-matches' as const, responses: { 201: z.array(z.any()) } },
    update: { method: 'PATCH' as const, path: '/api/matches/:id' as const, input: z.any(), responses: { 200: z.any() } },
    generateBracket: { method: 'POST' as const, path: '/api/categories/:categoryId/generate-bracket' as const, responses: { 201: z.array(z.any()) } },
  },
  athleteCodes: {
    list: { method: 'GET' as const, path: '/api/tournaments/:id/athlete-codes' as const, responses: { 200: z.array(z.any()) } },
    create: { method: 'POST' as const, path: '/api/athlete-codes' as const, input: z.any(), responses: { 201: z.any() } },
  },
  standings: {
    get: { method: 'GET' as const, path: '/api/categories/:categoryId/standings' as const, responses: { 200: z.array(z.any()) } },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
