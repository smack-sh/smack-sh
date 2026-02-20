import { z } from 'zod';
import { createHash } from 'crypto';

/**
 * Fullstack AI Generator - Generates complete backend applications from frontend analysis
 */
export class FullstackAIGenerator {
  private frontendModels: Map<string, any>;
  private apiEndpoints: Map<string, any>;

  constructor() {
    this.frontendModels = new Map();
    this.apiEndpoints = new Map();
  }

  /**
   * Analyze frontend code to detect API requirements
   */
  public analyzeFrontendCode(frontendCode: string): void {
    // Parse frontend code to extract API calls (simplified for demo)
    const apiCallRegex = /fetch\('([^']+)'/g;
    const matches = [...frontendCode.matchAll(apiCallRegex)];

    matches.forEach(match => {
      const endpoint = match[1];
      this.apiEndpoints.set(endpoint, {
        method: 'GET', // Default, would be detected in real implementation
        usedBy: [endpoint]
      });
    });

    // Extract data models from frontend state
    const modelRegex = /interface\s+(\w+)\s*{[^}]+}/g;
    const modelMatches = [...frontendCode.matchAll(modelRegex)];

    modelMatches.forEach(match => {
      const modelName = match[1];
      const modelContent = match[0];
      this.frontendModels.set(modelName, this.parseModelContent(modelContent));
    });
  }

  /**
   * Parse model content from interface definition
   */
  private parseModelContent(modelContent: string): any {
    // Simplified parsing - in real implementation would use proper AST parsing
    const properties: Record<string, string> = {};
    
    // Extract properties
    const propRegex = /(\w+):\s*(\w+)/g;
    const propMatches = [...modelContent.matchAll(propRegex)];

    propMatches.forEach(match => {
      properties[match[1]] = match[2];
    });

    return properties;
  }

  /**
   * Generate backend application matching frontend needs
   */
  public async generateBackendApp(appName: string, outputDir: string): Promise<void> {
    // Create project structure
    const projectStructure = this.createProjectStructure(appName);

    // Generate Express.js server
    const expressServer = this.generateExpressServer();

    // Generate Prisma schema
    const prismaSchema = this.generatePrismaSchema();

    // Generate API endpoints
    const apiEndpoints = this.generateAPIEndpoints();

    // Generate middleware
    const middleware = this.generateMiddleware();

    // Generate deployment configuration
    const deploymentConfig = this.generateDeploymentConfig();

    // In a real implementation, these would be written to files
    console.log('Generated backend structure:', projectStructure);
    console.log('Generated Express server:', expressServer);
    console.log('Generated Prisma schema:', prismaSchema);
    console.log('Generated API endpoints:', apiEndpoints);
    console.log('Generated middleware:', middleware);
    console.log('Generated deployment config:', deploymentConfig);
  }

  /**
   * Create project structure
   */
  private createProjectStructure(appName: string): any {
    return {
      name: appName,
      structure: {
        'src/': {
          'server.ts': 'Main server file',
          'routes/': 'API routes',
          'controllers/': 'Route controllers',
          'services/': 'Business logic',
          'models/': 'Data models',
          'middleware/': 'Middleware functions',
          'config/': 'Configuration files',
          'utils/': 'Utility functions'
        },
        'prisma/': {
          'schema.prisma': 'Prisma schema',
          'seed.ts': 'Database seeding'
        },
        '.env': 'Environment variables',
        'package.json': 'Project configuration',
        'tsconfig.json': 'TypeScript configuration',
        'Dockerfile': 'Docker configuration',
        '.dockerignore': 'Docker ignore file'
      }
    };
  }

  /**
   * Generate Express.js server
   */
  public generateExpressServer(): string {
    return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rateLimiter';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Database connection check
app.use(async (req, res, next) => {
  try {
    await prisma.$connect();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/data', authMiddleware, require('./routes/data'));

// WebSocket connection
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected:', socket.id);
  });
});

// Error handling
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export { app, httpServer, io, prisma };`;
  }

  /**
   * Generate Prisma schema from frontend models
   */
  public generatePrismaSchema(): string {
    let schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`;

    // Generate models from frontend analysis
    this.frontendModels.forEach((properties, modelName) => {
      schema += `
model ${modelName} {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
`;

      // Add properties
      for (const [propName, propType] of Object.entries(properties)) {
        const prismaType = this.mapTypeToPrisma(propType);
        schema += `  ${propName} ${prismaType}
`;
      }

      schema += `}
`;
    });

    // Add common models
    schema += `
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String?
  role      String    @default("user")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  sessions  Session[]
}

model Session {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
`;

    return schema;
  }

  /**
   * Map TypeScript types to Prisma types
   */
  private mapTypeToPrisma(tsType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'datetime',
      'any': 'json',
      'object': 'json'
    };

    return typeMap[tsType.toLowerCase()] || 'string';
  }

  /**
   * Generate API endpoints with Zod validation
   */
  public generateAPIEndpoints(): string {
    let endpoints = '';

    // Generate endpoints for each model
    this.frontendModels.forEach((properties, modelName) => {
      const lowercaseName = modelName.toLowerCase();
      
      // Create Zod schema
      endpoints += `// ${modelName} Schema
`;
      endpoints += `export const ${modelName}Schema = z.object({
`;

      for (const [propName, propType] of Object.entries(properties)) {
        const zodType = this.mapTypeToZod(propType);
        endpoints += `  ${propName}: z.${zodType}(),
`;
      }

      endpoints += `});

`;

      // Create CRUD endpoints
      endpoints += `// ${modelName} Routes
`;
      endpoints += `router.get('/${lowercaseName}', async (req, res, next) => {
  try {
    const items = await prisma.${lowercaseName}.findMany();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/${lowercaseName}/:id', async (req, res, next) => {
  try {
    const item = await prisma.${lowercaseName}.findUnique({
      where: { id: req.params.id }
    });
    if (!item) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/${lowercaseName}', validateRequest(${modelName}Schema), async (req, res, next) => {
  try {
    const item = await prisma.${lowercaseName}.create({
      data: req.body
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/${lowercaseName}/:id', validateRequest(${modelName}Schema), async (req, res, next) => {
  try {
    const item = await prisma.${lowercaseName}.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/${lowercaseName}/:id', async (req, res, next) => {
  try {
    await prisma.${lowercaseName}.delete({
      where: { id: req.params.id }
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

`;
    });

    return endpoints;
  }

  /**
   * Map TypeScript types to Zod types
   */
  private mapTypeToZod(tsType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'any': 'any',
      'object': 'object'
    };

    return typeMap[tsType.toLowerCase()] || 'string';
  }

  /**
   * Generate authentication setup
   */
  public generateAuthSetup(): string {
    return `import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../server';
import { z } from 'zod';

// Authentication schemas
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Authentication controller
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};`;
  }

  /**
   * Generate WebSocket configuration
   */
  public generateWebSocketConfig(): string {
    return `import { Server } from 'socket.io';
import { prisma } from '../server';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('New WebSocket connection:', socket.id);

    // Authentication
    socket.on('authenticate', async (token) => {
      try {
        const session = await prisma.session.findUnique({
          where: { token },
          include: { user: true }
        });

        if (session) {
          socket.join(\`user-\${session.userId}\`);
          socket.data.user = session.user;
          socket.emit('authenticated', { user: session.user });
        } else {
          socket.emit('authentication_failed', { error: 'Invalid token' });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('authentication_error', { error: 'Authentication failed' });
      }
    });

    // Real-time data subscription
    socket.on('subscribe', (topic) => {
      socket.join(topic);
      console.log(\`Socket \${socket.id} subscribed to \${topic}\`);
    });

    socket.on('unsubscribe', (topic) => {
      socket.leave(topic);
      console.log(\`Socket \${socket.id} unsubscribed from \${topic}\`);
    });

    // Real-time updates
    socket.on('update', async (data) => {
      try {
        const { topic, payload } = data;
        
        // Broadcast to all subscribers
        io.to(topic).emit('update', payload);
        
        // Store update in database if needed
        if (data.storeInDb) {
          await prisma.dataUpdate.create({
            data: {
              topic,
              payload: JSON.stringify(payload),
              userId: socket.data.user?.id
            }
          });
        }
      } catch (error) {
        console.error('Update error:', error);
        socket.emit('update_error', { error: 'Update failed' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected:', socket.id);
    });
  });
}

export function broadcastToUser(userId: string, event: string, data: any) {
  io.to(\`user-\${userId}\`).emit(event, data);
}

export function broadcastToTopic(topic: string, event: string, data: any) {
  io.to(topic).emit(event, data);
}`;
  }

  /**
   * Generate middleware
   */
  public generateMiddleware(): string {
    return `import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Error handling middleware
export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

// Authentication middleware
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
    
    // Check session
    const session = await prisma.session.findUnique({
      where: { token }
    });
    
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Attach user to request
    req.user = { userId: decoded.userId };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Role-based authorization middleware
export function authorize(roles: string[] = []) {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true }
      });
      
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(403).json({ error: 'Forbidden' });
    }
  };
}

// Request validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        next(error);
      }
    }
  };
}

// Rate limiting middleware
const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

export function rateLimiterMiddleware(req, res, next) {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({ error: 'Too Many Requests' });
    });
}

// Logging middleware
export function loggingMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.path} \${res.statusCode} \${duration}ms\`);
  });
  
  next();
}

// CORS middleware with dynamic origin
export function corsMiddleware(req, res, next) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}`;
  }

  /**
   * Generate database schema from frontend models
   */
  public generateDatabaseSchema(): string {
    let schema = '';

    this.frontendModels.forEach((properties, modelName) => {
      schema += `-- ${modelName} Table\n`;
      schema += `CREATE TABLE ${modelName.toLowerCase()} (\n`;
      schema += `  id SERIAL PRIMARY KEY,\n`;
      schema += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      schema += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;

      // Add columns from properties
      for (const [propName, propType] of Object.entries(properties)) {
        const sqlType = this.mapTypeToSQL(propType);
        schema += `,  ${propName.toLowerCase()} ${sqlType}\n`;
      }

      schema += `);\n\n`;
    });

    // Add common tables
    schema += `-- Users Table\n`;
    schema += `CREATE TABLE users (\n`;
    schema += `  id SERIAL PRIMARY KEY,\n`;
    schema += `  email VARCHAR(255) UNIQUE NOT NULL,\n`;
    schema += `  password_hash VARCHAR(255) NOT NULL,\n`;
    schema += `  name VARCHAR(255),\n`;
    schema += `  role VARCHAR(50) DEFAULT 'user',\n`;
    schema += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
    schema += `  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
    schema += `);\n\n`;

    schema += `-- Sessions Table\n`;
    schema += `CREATE TABLE sessions (\n`;
    schema += `  id SERIAL PRIMARY KEY,\n`;
    schema += `  user_id INTEGER REFERENCES users(id),\n`;
    schema += `  token VARCHAR(255) UNIQUE NOT NULL,\n`;
    schema += `  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,\n`;
    schema += `  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
    schema += `);\n`;

    return schema;
  }

  /**
   * Map TypeScript types to SQL types
   */
  private mapTypeToSQL(tsType: string): string {
    const typeMap: Record<string, string> = {
      'string': 'varchar(255)',
      'number': 'integer',
      'boolean': 'boolean',
      'date': 'timestamp with time zone',
      'any': 'jsonb',
      'object': 'jsonb'
    };

    return typeMap[tsType.toLowerCase()] || 'varchar(255)';
  }

  /**
   * Generate deployment configuration
   */
  public generateDeploymentConfig(): string {
    return `{
  "vercel": {
    "projectName": "${this.frontendModels.size > 0 ? Array.from(this.frontendModels.keys())[0] : 'my-app'}",
    "framework": "express",
    "buildCommand": "npm run build",
    "installCommand": "npm install",
    "outputDirectory": "dist",
    "env": {
      "NODE_ENV": "production",
      "DATABASE_URL": "@database-url",
      "JWT_SECRET": "@jwt-secret",
      "FRONTEND_URL": "@frontend-url"
    },
    "regions": ["iad1", "sfo1", "fra1"],
    "memory": 1024,
    "maxDuration": 30
  },
  "aws": {
    "region": "us-east-1",
    "ecs": {
      "cluster": "my-app-cluster",
      "service": "my-app-service",
      "taskDefinition": "my-app-task",
      "containerPort": 3001,
      "healthCheckPath": "/health",
      "desiredCount": 2,
      "autoScaling": {
        "min": 2,
        "max": 10,
        "cpuThreshold": 70
      }
    },
    "rds": {
      "instanceClass": "db.t3.micro",
      "engine": "postgres",
      "engineVersion": "15.4",
      "allocatedStorage": 20,
      "multiAz": false,
      "publiclyAccessible": false
    },
    "cloudfront": {
      "enabled": true,
      "defaultCacheBehavior": {
        "allowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        "cachedMethods": ["GET", "HEAD"],
        "forwardedValues": {
          "query": true,
          "headers": ["Authorization", "Content-Type"]
        }
      }
    }
  },
  "railway": {
    "services": [
      {
        "name": "backend",
        "type": "node",
        "buildCommand": "npm run build",
        "startCommand": "npm start",
        "env": {
          "NODE_ENV": "production",
          "PORT": "3001"
        },
        "cpu": 1,
        "memory": 1024
      },
      {
        "name": "database",
        "type": "postgres",
        "version": "15",
        "cpu": 1,
        "memory": 1024,
        "disk": 10240
      }
    ],
    "domains": [
      {
        "name": "api.myapp.com",
        "service": "backend"
      }
    ]
  },
  "docker": {
    "version": "3.8",
    "services": {
      "app": {
        "build": ".",
        "ports": ["3001:3001"],
        "environment": {
          "NODE_ENV": "production",
          "DATABASE_URL": "postgresql://user:password@db:5432/db"
        },
        "depends_on": ["db"],
        "restart": "unless-stopped"
      },
      "db": {
        "image": "postgres:15",
        "environment": {
          "POSTGRES_USER": "user",
          "POSTGRES_PASSWORD": "password",
          "POSTGRES_DB": "db"
        },
        "volumes": ["postgres_data:/var/lib/postgresql/data"],
        "restart": "unless-stopped"
      }
    },
    "volumes": {
      "postgres_data": {}
    }
  },
  "github": {
    "workflows": {
      "ci": {
        "name": "CI",
        "on": ["push", "pull_request"],
        "jobs": {
          "test": {
            "runs-on": "ubuntu-latest",
            "steps": [
              {
                "uses": "actions/checkout@v4"
              },
              {
                "uses": "actions/setup-node@v4",
                "with": {
                  "node-version": "20"
                }
              },
              {
                "run": "npm install"
              },
              {
                "run": "npm run test"
              }
            ]
          }
        }
      },
      "cd": {
        "name": "CD",
        "on": {
          "push": {
            "branches": ["main"]
          }
        },
        "jobs": {
          "deploy": {
            "runs-on": "ubuntu-latest",
            "steps": [
              {
                "uses": "actions/checkout@v4"
              },
              {
                "uses": "actions/setup-node@v4",
                "with": {
                  "node-version": "20"
                }
              },
              {
                "run": "npm install"
              },
              {
                "run": "npm run build"
              },
              {
                "uses": "vercel/vercel-action@v2",
                "with": {
                  "token": "\${{ secrets.VERCEL_TOKEN }}",
                  "project-id": "\${{ secrets.VERCEL_PROJECT_ID }}",
                  "org-id": "\${{ secrets.VERCEL_ORG_ID }}"
                }
              }
            ]
          }
        }
      }
    }
  }
}`;
  }

  /**
   * Generate CI/CD pipeline
   */
  public generateCICDPipeline(): string {
    return `.github/workflows/ci-cd.yml:
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Install dependencies
        run: npm install
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build

  deploy-staging:
    name: Deploy to Staging
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Install dependencies
        run: npm install
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/vercel-action@v2
        with:
          token: \${{ secrets.VERCEL_TOKEN }}
          project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-args: '--prod'
        env:
          DATABASE_URL: \${{ secrets.STAGING_DATABASE_URL }}
          JWT_SECRET: \${{ secrets.STAGING_JWT_SECRET }}

  deploy-production:
    name: Deploy to Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - name: Install dependencies
        run: npm install
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push docker image
        env:
          REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          REPOSITORY: my-app
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t $REGISTRY/$REPOSITORY:$IMAGE_TAG .
          docker push $REGISTRY/$REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ecs-task-definition.json
          service: my-app-service
          cluster: my-app-cluster
          wait-for-service-stability: true

  notify:
    name: Notify Deployment
    needs: deploy-production
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Send Slack notification
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: \${{ secrets.SLACK_WEBHOOK }}
          SLACK_COLOR: \${{ job.status }}
          SLACK_TITLE: 'Deployment Status'
          SLACK_MESSAGE: 'Deployment to production completed with status: \${{ job.status }}'`;
  }

  /**
   * Generate database schema from frontend models
   */
  public generateDatabaseSchemaFromFrontend(): string {
    let schema = '';

    this.frontendModels.forEach((properties, modelName) => {
      schema += `// ${modelName} Model\n`;
      schema += `export interface ${modelName} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
`;

      // Add properties
      for (const [propName, propType] of Object.entries(properties)) {
        schema += `  ${propName}: ${propType};\n`;
      }

      schema += `}\n\n`;
    });

    // Add common models
    schema += `// User Model\n`;
    schema += `export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}\n\n`;

    schema += `// Session Model\n`;
    schema += `export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}\n`;

    return schema;
  }

  /**
   * Generate API client for frontend
   */
  public generateAPIClient(): string {
    return `import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class APIClient {
  private token: string | null = null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public clearToken() {
    this.token = null;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = \`Bearer \${this.token}\`;
    }

    return headers;
  }

  private async request(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: \`\${API_BASE_URL}\${endpoint}\`,
        headers: this.getHeaders(),
        data
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  // Auth endpoints
  public async register(email: string, password: string, name?: string) {
    return this.request('POST', '/auth/register', { email, password, name });
  }

  public async login(email: string, password: string) {
    const result = await this.request('POST', '/auth/login', { email, password });
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  public async logout() {
    const result = await this.request('POST', '/auth/logout');
    this.clearToken();
    return result;
  }

  public async getCurrentUser() {
    return this.request('GET', '/auth/me');
  }

  // CRUD endpoints for models
  ${Array.from(this.frontendModels.keys()).map(modelName => {
    const lowercaseName = modelName.toLowerCase();
    return `
  // ${modelName} endpoints
  public async get${modelName}s() {
    return this.request('GET', '/${lowercaseName}');
  }

  public async get${modelName}(id: string) {
    return this.request('GET', '/${lowercaseName}/' + id);
  }

  public async create${modelName}(data: any) {
    return this.request('POST', '/${lowercaseName}', data);
  }

  public async update${modelName}(id: string, data: any) {
    return this.request('PUT', '/${lowercaseName}/' + id, data);
  }

  public async delete${modelName}(id: string) {
    return this.request('DELETE', '/${lowercaseName}/' + id);
  }`;
  }).join('')}

  // WebSocket connection
  public connectWebSocket(onMessage: (event: string, data: any) => void) {
    const socket = new WebSocket(\`\${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}\`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      if (this.token) {
        socket.send(JSON.stringify({ type: 'authenticate', token: this.token }));
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data.type, data.payload);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return socket;
  }
}

export const apiClient = new APIClient();`;
  }

  /**
   * Generate environment configuration
   */
  public generateEnvironmentConfig(): string {
    return `# Environment Configuration

# Application
NODE_ENV=development
PORT=3001
APP_NAME=my-app

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db
DATABASE_POOL_SIZE=10
DATABASE_SSL=false

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Frontend
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_POINTS=100
RATE_LIMIT_DURATION=60

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Email (for password reset, etc.)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=no-reply@example.com

# AWS (for file uploads, etc.)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-license-key

# Production overrides
# NODE_ENV=production
# DATABASE_URL=postgresql://user:password@db:5432/db
# DATABASE_SSL=true
# JWT_SECRET=${this.generateSecureRandomString(32)}
# SESSION_SECRET=${this.generateSecureRandomString(32)}`;
  }

  /**
   * Generate secure random string
   */
  private generateSecureRandomString(length: number): string {
    return createHash('sha256')
      .update(Math.random().toString() + Date.now().toString())
      .digest('hex')
      .substring(0, length);
  }

  /**
   * Generate Docker configuration
   */
  public generateDockerConfig(): string {
    return `# Dockerfile for Node.js backend application

# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source files
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["npm", "start"]

# Docker Compose configuration
docker-compose.yml:
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/db
    depends_on:
      - db
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d db"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:`;
  }

  /**
   * Generate testing setup
   */
  public generateTestingSetup(): string {
    return `import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import request from 'supertest';
import { app, prisma } from '../src/server';
import { faker } from '@faker-js/faker';

describe('API Tests', () => {
  let testUser: any;
  let authToken: string;

  before(async () => {
    // Clean up database
    await prisma.user.deleteMany();
    await prisma.session.deleteMany();

    // Create test user
    const password = faker.internet.password();
    const userData = {
      email: faker.internet.email(),
      password: password,
      name: faker.person.fullName()
    };

    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(200);

    testUser = registerResponse.body.user;
    authToken = registerResponse.body.token;
  });

  after(async () => {
    // Clean up
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const userData = {
        email: faker.internet.email(),
        password: faker.internet.password(),
        name: faker.person.fullName()
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('email', userData.email);
    });

    it('should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'test-password' // This would be the actual password in real test
        })
        .expect(200);

      expect(response.body).to.have.property('token');
    });

    it('should get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).to.have.property('email', testUser.email);
    });
  });

  ${Array.from(this.frontendModels.keys()).map(modelName => {
    const lowercaseName = modelName.toLowerCase();
    return `
  describe('${modelName} API', () => {
    let testItem: any;

    it('should create ${lowercaseName}', async () => {
      const itemData = {
        // Generate test data based on model properties
        ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
          const propType = this.frontendModels.get(modelName)[prop];
          if (propType === 'string') {
            return `${prop}: faker.lorem.word(),`;
          } else if (propType === 'number') {
            return `${prop}: faker.number.int(),`;
          } else if (propType === 'boolean') {
            return `${prop}: faker.datatype.boolean(),`;
          } else {
            return `${prop}: faker.lorem.word(),`;
          }
        }).join('\n        ')}
      };

      const response = await request(app)
        .post('/api/${lowercaseName}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(itemData)
        .expect(201);

      expect(response.body).to.have.property('id');
      testItem = response.body;
    });

    it('should get all ${lowercaseName}s', async () => {
      const response = await request(app)
        .get('/api/${lowercaseName}')
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });

    it('should get single ${lowercaseName}', async () => {
      const response = await request(app)
        .get('/api/${lowercaseName}/' + testItem.id)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(200);

      expect(response.body).to.have.property('id', testItem.id);
    });

    it('should update ${lowercaseName}', async () => {
      const updateData = {
        // Update data
        ${Object.keys(this.frontendModels.get(modelName) || {}).slice(0, 1).map(prop => {
          return `${prop}: faker.lorem.word(),`;
        }).join('\n        ')}
      };

      const response = await request(app)
        .put('/api/${lowercaseName}/' + testItem.id)
        .set('Authorization', \`Bearer \${authToken}\`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('id', testItem.id);
    });

    it('should delete ${lowercaseName}', async () => {
      await request(app)
        .delete('/api/${lowercaseName}/' + testItem.id)
        .set('Authorization', \`Bearer \${authToken}\`)
        .expect(204);
    });
  });`;
  }).join('')}
});`;
  }

  /**
   * Generate documentation
   */
  public generateDocumentation(): string {
    return `# API Documentation

## Authentication

### Register
\`POST /api/auth/register\`

Request Body:
\`\`\`json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
\`\`\`

Response:
\`\`\`json
{
  "token": "jwt.token.here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
\`\`\`

### Login
\`POST /api/auth/login\`

Request Body:
\`\`\`json
{
  "email": "user@example.com",
  "password": "securepassword"
}
\`\`\`

Response:
\`\`\`json
{
  "token": "jwt.token.here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
\`\`\`

### Get Current User
\`GET /api/auth/me\`

Headers:
- Authorization: Bearer jwt.token.here

Response:
\`\`\`json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
\`\`\`

${Array.from(this.frontendModels.keys()).map(modelName => {
    const lowercaseName = modelName.toLowerCase();
    return `
## ${modelName}

### Get All ${modelName}s
\`GET /api/${lowercaseName}\`

Headers:
- Authorization: Bearer jwt.token.here

Response:
\`\`\`json
[
  {
    "id": "item-id",
    ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
      return `"${prop}": "value"`;
    }).join(',\n    ')}
  }
]
\`\`\`

### Get Single ${modelName}
\`GET /api/${lowercaseName}/:id\`

Headers:
- Authorization: Bearer jwt.token.here

Response:
\`\`\`json
{
  "id": "item-id",
  ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
    return `"${prop}": "value"`;
  }).join(',\n  ')}
}
\`\`\`

### Create ${modelName}
\`POST /api/${lowercaseName}\`

Headers:
- Authorization: Bearer jwt.token.here
- Content-Type: application/json

Request Body:
\`\`\`json
{
  ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
    return `"${prop}": "value"`;
  }).join(',\n  ')}
}
\`\`\`

Response:
\`\`\`json
{
  "id": "new-item-id",
  ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
    return `"${prop}": "value"`;
  }).join(',\n  ')}
}
\`\`\`

### Update ${modelName}
\`PUT /api/${lowercaseName}/:id\`

Headers:
- Authorization: Bearer jwt.token.here
- Content-Type: application/json

Request Body:
\`\`\`json
{
  ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
    return `"${prop}": "updated-value"`;
  }).join(',\n  ')}
}
\`\`\`

Response:
\`\`\`json
{
  "id": "item-id",
  ${Object.keys(this.frontendModels.get(modelName) || {}).map(prop => {
    return `"${prop}": "updated-value"`;
  }).join(',\n  ')}
}
\`\`\`

### Delete ${modelName}
\`DELETE /api/${lowercaseName}/:id\`

Headers:
- Authorization: Bearer jwt.token.here

Response:
\`\`\`
HTTP 204 No Content
\`\`\`
`;
  }).join('')}

## WebSocket API

### Connection
\`wss://api.example.com\`

### Authentication
\`\`\`json
{
  "type": "authenticate",
  "token": "jwt.token.here"
}
\`\`\`

### Subscription
\`\`\`json
{
  "type": "subscribe",
  "topic": "topic-name"
}
\`\`\`

### Unsubscription
\`\`\`json
{
  "type": "unsubscribe",
  "topic": "topic-name"
}
\`\`\`

### Real-time Update
\`\`\`json
{
  "type": "update",
  "topic": "topic-name",
  "payload": {
    // Update data
  }
}
\`\`\`

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Forbidden"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

### 429 Too Many Requests
\`\`\`json
{
  "error": "Too Many Requests"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal Server Error",
  "stack": "Error stack trace (in development only)"
}
\`\`\`
`;
  }
}