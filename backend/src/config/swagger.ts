export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title:       'CertiChain API',
    version:     '1.0.0',
    description: 'Digital certificate management and verification platform.',
    contact:     { name: 'CertiChain', url: 'https://certichain.app' },
  },
  servers: [
    { url: '/api', description: 'Current server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type:         'http',
        scheme:       'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data:    { },
          message: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new organization + user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'organizationName'],
                properties: {
                  name:             { type: 'string', example: 'Amit Chaurasiya' },
                  email:            { type: 'string', example: 'amit@example.com' },
                  password:         { type: 'string', example: 'SecurePass@1' },
                  organizationName: { type: 'string', example: 'KIT University' },
                  organizationType: { type: 'string', example: 'University' },
                  website:          { type: 'string', example: 'https://kit.edu' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Account created' },
          400: { description: 'Validation error' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', example: 'admin@certichain.demo' },
                  password: { type: 'string', example: 'Demo@1234' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful, returns JWT token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user + organizations',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user data' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/auth/me/password': {
      put: {
        tags: ['Auth'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword:     { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password updated' },
          401: { description: 'Current password incorrect' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { email: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Reset link sent (if email exists)' } },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token:    { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Password reset' }, 400: { description: 'Invalid token' } },
      },
    },
    '/auth/verify-email': {
      get: {
        tags: ['Auth'],
        summary: 'Verify email address',
        parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Email verified' }, 400: { description: 'Invalid token' } },
      },
    },
    '/verify/{certificateId}': {
      get: {
        tags: ['Verification'],
        summary: 'Verify a certificate (public, no auth)',
        parameters: [{
          in: 'path', name: 'certificateId', required: true,
          schema: { type: 'string', example: 'CC-2026-DEMO01' },
        }],
        responses: {
          200: { description: 'Certificate found (check .verified and .status fields)' },
          404: { description: 'Certificate not found' },
        },
      },
    },
    '/organizations/{orgId}': {
      get: {
        tags: ['Organization'],
        summary: 'Get organization details',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Organization data' }, 403: { description: 'Forbidden' } },
      },
      put: {
        tags: ['Organization'],
        summary: 'Update organization',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated' } },
      },
    },
    '/organizations/{orgId}/analytics': {
      get: {
        tags: ['Organization'],
        summary: 'Get organization analytics',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Analytics data with trend chart' } },
      },
    },
    '/organizations/{orgId}/certificates': {
      get: {
        tags: ['Certificates'],
        summary: 'List certificates',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path',  name: 'orgId',  required: true, schema: { type: 'string' } },
          { in: 'query', name: 'page',   schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit',  schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'REVOKED', 'EXPIRED'] } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated certificate list' } },
      },
      post: {
        tags: ['Certificates'],
        summary: 'Issue a new certificate',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientName', 'recipientEmail', 'title', 'issueDate'],
                properties: {
                  recipientName:  { type: 'string', example: 'Amit Chaurasiya' },
                  recipientEmail: { type: 'string', example: 'amit@example.com' },
                  title:          { type: 'string', example: 'Certificate of Completion' },
                  achievement:    { type: 'string', example: 'B.Tech — Information Technology' },
                  description:    { type: 'string' },
                  customMessage:  { type: 'string' },
                  issueDate:      { type: 'string', format: 'date', example: '2026-08-19' },
                  expiryDate:     { type: 'string', format: 'date' },
                  templateId:     { type: 'string' },
                  sendEmail:      { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Certificate issued with PDF + QR URLs' } },
      },
    },
    '/organizations/{orgId}/certificates/bulk': {
      post: {
        tags: ['Certificates'],
        summary: 'Bulk issue certificates from CSV',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary', description: 'CSV: name,email,certificate_title,issue_date,achievement' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Bulk issue results with issued count and errors' } },
      },
    },
    '/organizations/{orgId}/certificates/{id}': {
      get: {
        tags: ['Certificates'],
        summary: 'Get certificate by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'orgId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id',    required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Certificate detail' }, 404: { description: 'Not found' } },
      },
    },
    '/organizations/{orgId}/certificates/{id}/revoke': {
      post: {
        tags: ['Certificates'],
        summary: 'Revoke a certificate',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'orgId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'id',    required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason'],
                properties: { reason: { type: 'string', example: 'Issued in error' } },
              },
            },
          },
        },
        responses: { 200: { description: 'Certificate revoked' }, 409: { description: 'Already revoked' } },
      },
    },
    '/organizations/{orgId}/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List certificate templates',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Template list' } },
      },
      post: {
        tags: ['Templates'],
        summary: 'Create a certificate template',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'orgId', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'configuration'],
                properties: {
                  name:          { type: 'string' },
                  configuration: {
                    type: 'object',
                    properties: {
                      layout:       { type: 'string', enum: ['landscape', 'portrait'] },
                      primaryColor: { type: 'string', example: '#112a29' },
                      accentColor:  { type: 'string', example: '#ddf05c' },
                      showQR:       { type: 'boolean' },
                      showLogo:     { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Template created' } },
      },
    },
    '/organizations/{orgId}/recipients': {
      get: {
        tags: ['Recipients'],
        summary: 'List recipients',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path',  name: 'orgId',  required: true, schema: { type: 'string' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'page',   schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Paginated recipient list' } },
      },
    },
    '/organizations/{orgId}/audit-logs': {
      get: {
        tags: ['Audit'],
        summary: 'Get audit logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path',  name: 'orgId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'page',  schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Paginated audit log' } },
      },
    },
  },
};
