import type { ProjectAnalysis } from './types/analysis';

export const sampleAnalysis: ProjectAnalysis = {
  projectName: 'Example FastAPI Project',
  summary: {
    controllers: 2,
    services: 1,
    repositories: 1,
    models: 2,
    apis: 3,
    dependencies: 3,
  },
  nodes: [
    { id: 'UserRouter', label: 'UserRouter', type: 'router', filePath: 'app/routes/users.py' },
    { id: 'AuthRouter', label: 'AuthRouter', type: 'router', filePath: 'app/routes/auth.py' },
    { id: 'UserService', label: 'UserService', type: 'service', filePath: 'app/services/user_service.py' },
    { id: 'UserRepository', label: 'UserRepository', type: 'repository', filePath: 'app/repositories/user_repository.py' },
    { id: 'User', label: 'User', type: 'model', filePath: 'app/models/user.py' },
    { id: 'UserSchema', label: 'UserSchema', type: 'dto', filePath: 'app/schemas/user.py' },
  ],
  edges: [
    { id: 'edge-1', source: 'UserRouter', target: 'UserService', label: 'uses' },
    { id: 'edge-2', source: 'UserService', target: 'UserRepository', label: 'uses' },
    { id: 'edge-3', source: 'UserRepository', target: 'User', label: 'uses' },
  ],
  endpoints: [
    { method: 'GET', path: '/users', handler: 'list_users', filePath: 'app/routes/users.py' },
    { method: 'POST', path: '/users', handler: 'create_user', filePath: 'app/routes/users.py' },
    { method: 'POST', path: '/auth/login', handler: 'login', filePath: 'app/routes/auth.py' },
  ],
  files: [
    { path: 'app/routes/users.py', language: 'python', size: 1520, componentTypes: ['router'] },
    { path: 'app/services/user_service.py', language: 'python', size: 980, componentTypes: ['service'] },
    { path: 'app/repositories/user_repository.py', language: 'python', size: 740, componentTypes: ['repository'] },
    { path: 'app/models/user.py', language: 'python', size: 640, componentTypes: ['model'] },
  ],
};
