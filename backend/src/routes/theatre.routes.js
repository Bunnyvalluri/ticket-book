import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as theatreCtrl from '../controllers/theatre.controller.js';

const router = express.Router();

// Public
router.get('/', theatreCtrl.getTheatres);
router.get('/cities', theatreCtrl.getCities);
router.get('/:id', theatreCtrl.getTheatreById);

// Admin
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), theatreCtrl.createTheatre);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), theatreCtrl.updateTheatre);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), theatreCtrl.deleteTheatre);

// Screen management
router.post('/screens', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), theatreCtrl.createScreen);
router.put('/screens/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), theatreCtrl.updateScreen);

export default router;
