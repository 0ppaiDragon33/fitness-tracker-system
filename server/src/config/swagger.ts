import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'FitTrack API', version: '1.0.0', description: 'Fitness Tracking System REST API — Express + Firebase' },
    servers: [{ url: '/api' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Firebase ID Token' } } },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
});
