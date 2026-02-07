
import { z } from 'zod';
import { insertUserSchema, insertTournamentSchema, insertCategorySchema, insertTeamSchema, insertMatchSchema, users, tournaments, categories, teams, matches } from './schema';

// Shared error schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
  },
  tournaments: {
    list: {
      method: 'GET' as const,
      path: '/api/tournaments' as const,
      responses: {
        200: z.array(z.custom<typeof tournaments.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tournaments/:id' as const,
      responses: {
        200: z.custom<typeof tournaments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tournaments' as const,
      input: insertTournamentSchema,
      responses: {
        201: z.custom<typeof tournaments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tournaments/:id' as const,
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/tournaments/:id/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories' as const,
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
      },
    },
  },
  teams: {
    list: {
      method: 'GET' as const,
      path: '/api/categories/:categoryId/teams' as const,
      responses: {
        200: z.array(z.custom<typeof teams.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teams' as const,
      input: insertTeamSchema,
      responses: {
        201: z.custom<typeof teams.$inferSelect>(),
      },
    },
    approve: {
      method: 'PATCH' as const,
      path: '/api/teams/:id/approve' as const,
      responses: {
        200: z.custom<typeof teams.$inferSelect>(),
      },
    },
  },
  matches: {
    list: {
      method: 'GET' as const,
      path: '/api/categories/:categoryId/matches' as const,
      responses: {
        200: z.array(z.custom<typeof matches.$inferSelect>()),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/categories/:categoryId/generate-matches' as const,
      responses: {
        201: z.array(z.custom<typeof matches.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/matches/:id' as const,
      input: insertMatchSchema.partial(),
      responses: {
        200: z.custom<typeof matches.$inferSelect>(),
      },
    },
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
