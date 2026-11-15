const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');
const outputPath = path.join(root, 'docs', 'emin-backend.postman_collection.json');

const methodMap = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
};

const bodyExamples = {
  'auth/register': {
    firstName: 'Saif',
    lastName: 'Ahmed',
    email: 'saif@example.com',
    phone: '+8801700000000',
    password: 'secret123',
  },
  'auth/login': { email: 'saif@example.com', password: 'secret123' },
  'auth/forgot-password': { email: 'saif@example.com' },
  'auth/verify-otp': { email: 'saif@example.com', otp: '123456' },
  'auth/reset-password': { email: 'saif@example.com', otp: '123456', password: 'newSecret123' },
  'auth/change-password': { currentPassword: 'secret123', newPassword: 'newSecret123' },
  'auctions/:auctionId/bids': {
    bidderId: '66f000000000000000000002',
    amount: '125.50',
  },
  'platform-customization/default': {
    payload: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#1eb9c7',
      supportEmail: 'support@example.com',
      branding: { siteName: 'Emin' },
      aiRules: { maxDiscountPercent: 15 },
    },
  },
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath.endsWith('.controller.ts') ? [fullPath] : [];
  });
}

function decoratorValue(text, decorator) {
  const regex = new RegExp(`@${decorator}\\(([^)]*)\\)`);
  const match = text.match(regex);
  if (!match) return '';
  const value = match[1].trim();
  if (!value) return '';
  return value.replace(/^['"`]|['"`]$/g, '');
}

function joinRoute(controllerPath, routePath) {
  return [controllerPath, routePath]
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
}

function postmanPath(route) {
  return route.split('/').filter(Boolean).map((part) => {
    if (part.startsWith(':')) return `{{${part.slice(1)}}}`;
    return part;
  });
}

function collectionUrl(route, method) {
  const pathParts = postmanPath(route);
  const url = {
    raw: `{{baseUrl}}/${pathParts.join('/')}`,
    host: ['{{baseUrl}}'],
    path: pathParts,
  };

  if (method === 'GET' && !route.includes('/:id') && !route.includes(':')) {
    url.query = [
      { key: 'page', value: '1', disabled: false },
      { key: 'limit', value: '25', disabled: false },
    ];
    url.raw += '?page=1&limit=25';
  }

  return url;
}

function requestBody(route, method) {
  if (!['POST', 'PUT', 'PATCH'].includes(method)) return undefined;
  const example = bodyExamples[route] ?? { payload: {} };
  return {
    mode: 'raw',
    raw: JSON.stringify(example, null, 2),
    options: { raw: { language: 'json' } },
  };
}

const routes = [];

for (const file of walk(srcRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  const controllerPath = decoratorValue(source, 'Controller');
  const methodRegex = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g;
  let match;

  while ((match = methodRegex.exec(source))) {
    const decorator = match[1];
    const routePath = match[2].trim().replace(/^['"`]|['"`]$/g, '');
    const method = methodMap[decorator];
    const route = joinRoute(controllerPath, routePath);
    routes.push({
      method,
      route,
      file: path.relative(root, file).replace(/\\/g, '/'),
    });
  }
}

routes.sort((a, b) => a.route.localeCompare(b.route) || a.method.localeCompare(b.method));

const folders = new Map();
for (const route of routes) {
  const folderName = route.route.split('/')[0] || 'root';
  if (!folders.has(folderName)) folders.set(folderName, []);

  const headers = [{ key: 'Accept', value: 'application/json' }];
  const body = requestBody(route.route, route.method);
  if (body) headers.push({ key: 'Content-Type', value: 'application/json' });

  folders.get(folderName).push({
    name: `${route.method} /${route.route}`,
    request: {
      method: route.method,
      header: headers,
      url: collectionUrl(route.route, route.method),
      ...(body ? { body } : {}),
      description: `Source: ${route.file}`,
    },
    response: [],
  });
}

const collection = {
  info: {
    name: 'Emin Backend API',
    description: 'Generated from NestJS controllers. Set baseUrl before running requests.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [...folders.entries()].map(([name, item]) => ({ name, item })),
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000' },
    { key: 'id', value: '66f000000000000000000001' },
    { key: 'auctionId', value: '66f000000000000000000010' },
  ],
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Generated ${routes.length} endpoints at ${path.relative(root, outputPath)}`);
