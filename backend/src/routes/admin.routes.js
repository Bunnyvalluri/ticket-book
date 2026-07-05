import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as adminCtrl from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require ADMIN or SUPER_ADMIN role
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// Dashboard
router.get('/dashboard', adminCtrl.getDashboardStats);
router.get('/analytics/revenue', adminCtrl.getRevenueAnalytics);
router.get('/analytics/top-movies', adminCtrl.getTopMovies);
router.get('/analytics/user-growth', adminCtrl.getUserGrowth);

// User management
router.get('/users', adminCtrl.getAllUsers);
router.put('/users/:id', adminCtrl.updateUserStatus);

// Booking management
router.get('/bookings', adminCtrl.getAllBookings);

// Coupon management
router.get('/coupons', adminCtrl.getCoupons);
router.post('/coupons', adminCtrl.createCoupon);
router.put('/coupons/:id', adminCtrl.updateCoupon);
router.delete('/coupons/:id', adminCtrl.deleteCoupon);

// Audit logs
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN'), adminCtrl.getAuditLogs);

export default router;
