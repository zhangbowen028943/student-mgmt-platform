import swaggerJsdoc from 'swagger-jsdoc';
import { config as c } from './config';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '学生管理平台 API',
      version: '0.1.0'
    },
    servers: [
      { url: `http://localhost:${c.port}` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: []
});

