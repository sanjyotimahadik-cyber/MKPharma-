import express from 'express';
import { fileURLToPath } from 'node:url';
import { authenticate } from './auth.js';
import { HttpError } from './http.js';
import attendance from './routes/attendance.js';
import auth from './routes/auth.js';
import branches from './routes/branches.js';
import dashboard from './routes/dashboard.js';
import leaves from './routes/leaves.js';
import mr from './routes/mr.js';
import notifications from './routes/notifications.js';
import orders from './routes/orders.js';
import products from './routes/products.js';
import registrations from './routes/registrations.js';
import settings from './routes/settings.js';
import targets from './routes/targets.js';
import users from './routes/users.js';

export const UPLOAD_DIR = fileURLToPath(new URL('../uploads/', import.meta.url));

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);

// Everything below requires a signed-in user (req.user). Role checks live in each router.
app.use('/api', authenticate);
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/users', users);
app.use('/api/registrations', registrations);
app.use('/api/settings', settings);
app.use('/api/branches', branches);
app.use('/api/attendance', attendance);
app.use('/api/leaves', leaves);
app.use('/api/notifications', notifications);
app.use('/api/mr', mr);
app.use('/api/targets', targets);
app.use('/api/dashboard', dashboard);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint not found')));

// Express 5 forwards rejected promises here, so routes can simply throw.
app.use((err, _req, res, _next) => {
  const status = err.status ?? (err.type === 'entity.too.large' ? 413 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server' : err.message });
});

export default app;
