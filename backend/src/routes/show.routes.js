import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as showCtrl from '../controllers/show.controller.js';

const router = express.Router();

// Public
router.get('/', showCtrl.getShows);
router.get('/:id', showCtrl.getShowById);

// Admin
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), showCtrl.createShow);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), showCtrl.updateShow);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), showCtrl.deleteShow);

export default router;
