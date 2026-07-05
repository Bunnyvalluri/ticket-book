import prisma from '../config/database.js';
import { sendResponse } from '../utils/ApiResponse.js';

// Dashboard overview
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalUsers,
      newUsersToday,
      totalMovies,
      totalTheatres,
      totalBookings,
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      todayBookings,
      pendingBookings,
      cancelledBookings,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null, role: 'CUSTOMER' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday }, role: 'CUSTOMER' } }),
      prisma.movie.count({ where: { deletedAt: null } }),
      prisma.theatre.count({ where: { isActive: true } }),
      prisma.booking.count({ where: { status: { in: ['CONFIRMED', 'CANCELLED'] } } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      prisma.booking.count({ where: { createdAt: { gte: startOfToday }, status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
    ]);

    const monthlyRevenueVal = monthlyRevenue._sum.amount || 0;
    const lastMonthVal = lastMonthRevenue._sum.amount || 0;
    const revenueGrowth = lastMonthVal
      ? ((monthlyRevenueVal - lastMonthVal) / lastMonthVal) * 100
      : 100;

    sendResponse(res, 200, {
      overview: {
        totalUsers,
        newUsersToday,
        totalMovies,
        totalTheatres,
        totalBookings,
        todayBookings,
        pendingBookings,
        cancelledBookings,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        monthly: monthlyRevenueVal,
        lastMonth: lastMonthVal,
        growth: revenueGrowth.toFixed(1),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Revenue analytics
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy, dateFormat;
    if (period === 'daily') {
      // Last 30 days
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }

      const payments = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM payments
        WHERE status = 'COMPLETED'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      sendResponse(res, 200, { data: payments, period });
    } else {
      // Monthly for a year
      const payments = await prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM created_at) as month,
          EXTRACT(YEAR FROM created_at) as year,
          SUM(amount) as revenue,
          COUNT(*) as transactions
        FROM payments
        WHERE status = 'COMPLETED'
          AND EXTRACT(YEAR FROM created_at) = ${parseInt(year)}
        GROUP BY month, year
        ORDER BY month ASC
      `;

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = months.map((name, i) => {
        const found = payments.find((p) => parseInt(p.month) === i + 1);
        return {
          name,
          revenue: found ? parseFloat(found.revenue) : 0,
          transactions: found ? parseInt(found.transactions) : 0,
        };
      });

      sendResponse(res, 200, { data, period });
    }
  } catch (error) {
    next(error);
  }
};

// Top movies
export const getTopMovies = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const topMovies = await prisma.booking.groupBy({
      by: ['showId'],
      where: { status: 'CONFIRMED' },
      _count: { id: true },
      _sum: { grandTotal: true },
      orderBy: { _count: { id: 'desc' } },
      take: parseInt(limit),
    });

    const movieIds = await prisma.show.findMany({
      where: { id: { in: topMovies.map((b) => b.showId) } },
      select: { id: true, movieId: true },
    });

    const movieMap = new Map(movieIds.map((s) => [s.id, s.movieId]));

    const movies = await prisma.movie.findMany({
      where: { id: { in: [...new Set(Object.values(Object.fromEntries(movieMap)))] } },
      select: { id: true, title: true, posterUrl: true, status: true, imdbRating: true },
    });

    sendResponse(res, 200, {
      movies: movies.map((m) => {
        const bookingData = topMovies.find((b) => movieMap.get(b.showId) === m.id);
        return {
          ...m,
          bookings: bookingData?._count?.id || 0,
          revenue: bookingData?._sum?.grandTotal || 0,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

// User growth chart
export const getUserGrowth = async (req, res, next) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        EXTRACT(MONTH FROM created_at) as month_num,
        EXTRACT(YEAR FROM created_at) as year,
        COUNT(*) as new_users
      FROM users
      WHERE role = 'CUSTOMER'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month, month_num, year
      ORDER BY year ASC, month_num ASC
    `;

    sendResponse(res, 200, { data });
  } catch (error) {
    next(error);
  }
};

// Admin: all bookings
export const getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { bookingNumber: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          show: {
            include: {
              movie: { select: { title: true } },
              screen: { include: { theatre: { select: { name: true } } } },
            },
          },
          payment: { select: { status: true, method: true, amount: true } },
          seats: { select: { seatType: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    sendResponse(res, 200, {
      bookings,
      pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: all users
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          isEmailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { bookings: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendResponse(res, 200, {
      users,
      pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: update user status
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(role && req.user.role === 'SUPER_ADMIN' && { role }),
      },
      select: { id: true, email: true, status: true, role: true },
    });
    sendResponse(res, 200, { user }, 'User updated');
  } catch (error) {
    next(error);
  }
};

// Coupon CRUD
export const createCoupon = async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        ...req.body,
        code: req.body.code.toUpperCase(),
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        value: parseFloat(req.body.value),
        minOrderAmount: parseFloat(req.body.minOrderAmount || 0),
        maxDiscount: req.body.maxDiscount ? parseFloat(req.body.maxDiscount) : null,
        usageLimit: req.body.usageLimit ? parseInt(req.body.usageLimit) : null,
      },
    });
    sendResponse(res, 201, { coupon }, 'Coupon created');
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    sendResponse(res, 200, { coupons });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    sendResponse(res, 200, { coupon }, 'Coupon updated');
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    await prisma.coupon.update({
      where: { id: req.params.id },
      data: { isActive: false, status: 'DISABLED' },
    });
    sendResponse(res, 200, null, 'Coupon disabled');
  } catch (error) {
    next(error);
  }
};

// Audit logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    sendResponse(res, 200, {
      logs,
      pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};
