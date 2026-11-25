import { Router } from 'express';
import db, { bool } from '../db.js';
import { notFound } from '../http.js';

const router = Router();

const shape = (r) => ({ id: r.id, title: r.title, message: r.message, type: r.type, isRead: bool(r.is_read), createdAt: r.created_at });
const mine = (req) => db('notifications').where({ user_id: req.user.id });

router.get('/', async (req, res) => {
  const rows = await mine(req).orderBy('id', 'desc').limit(50);
  res.json(rows.map(shape));
});

router.patch('/read-all', async (req, res) => {
  const updated = await mine(req).where({ is_read: false }).update({ is_read: true });
  res.json({ updated });
});

router.patch('/:id/read', async (req, res) => {
  if (!(await mine(req).where({ id: req.params.id }).update({ is_read: true }))) throw notFound('Notification');
  res.json(shape(await mine(req).where({ id: req.params.id }).first()));
});

router.delete('/:id', async (req, res) => {
  if (!(await mine(req).where({ id: req.params.id }).del())) throw notFound('Notification');
  res.status(204).end();
});

export default router;
