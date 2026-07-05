import prisma from '../config/database.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Get theatres (with optional city/movie filter)
export const getTheatres = async (req, res, next) => {
  try {
    const { city, movieId, showDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      deletedAt: null,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
    };

    // If filtering by movie, join through shows
    if (movieId) {
      const showWhere = {
        movieId,
        isActive: true,
        ...(showDate && {
          startTime: {
            gte: new Date(`${showDate}T00:00:00`),
            lte: new Date(`${showDate}T23:59:59`),
          },
        }),
      };

      const theatreIds = await prisma.show.findMany({
        where: showWhere,
        select: { screen: { select: { theatreId: true } } },
        distinct: ['screenId'],
      });

      const ids = [...new Set(theatreIds.map((s) => s.screen.theatreId))];
      where.id = { in: ids };
    }

    const [theatres, total] = await Promise.all([
      prisma.theatre.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          screens: {
            where: { isActive: true },
            include: {
              shows: movieId
                ? {
                    where: {
                      movieId,
                      isActive: true,
                      startTime: { gte: new Date() },
                      ...(showDate && {
                        startTime: {
                          gte: new Date(`${showDate}T00:00:00`),
                          lte: new Date(`${showDate}T23:59:59`),
                        },
                      }),
                    },
                    include: { language: true },
                    orderBy: { startTime: 'asc' },
                  }
                : false,
            },
          },
          _count: { select: { screens: true } },
        },
      }),
      prisma.theatre.count({ where }),
    ]);

    sendResponse(res, 200, {
      theatres,
      pagination: {
        page: parseInt(page),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single theatre
export const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await prisma.theatre.findUnique({
      where: { id: req.params.id, isActive: true },
      include: {
        screens: {
          where: { isActive: true },
          include: {
            seats: { orderBy: [{ row: 'asc' }, { column: 'asc' }] },
          },
        },
      },
    });

    if (!theatre) throw new ApiError(404, 'Theatre not found');
    sendResponse(res, 200, { theatre });
  } catch (error) {
    next(error);
  }
};

// Create theatre (admin)
export const createTheatre = async (req, res, next) => {
  try {
    const data = req.body;
    if (req.file) data.imageUrl = req.file.path;

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');

    const theatre = await prisma.theatre.create({
      data: { ...data, slug: `${slug}-${Date.now()}` },
    });

    sendResponse(res, 201, { theatre }, 'Theatre created');
  } catch (error) {
    next(error);
  }
};

// Update theatre (admin)
export const updateTheatre = async (req, res, next) => {
  try {
    const data = req.body;
    if (req.file) data.imageUrl = req.file.path;

    const theatre = await prisma.theatre.update({
      where: { id: req.params.id },
      data,
    });
    sendResponse(res, 200, { theatre }, 'Theatre updated');
  } catch (error) {
    next(error);
  }
};

// Delete theatre (admin)
export const deleteTheatre = async (req, res, next) => {
  try {
    await prisma.theatre.update({
      where: { id: req.params.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    sendResponse(res, 200, null, 'Theatre deleted');
  } catch (error) {
    next(error);
  }
};

// Create screen (admin)
export const createScreen = async (req, res, next) => {
  try {
    const { theatreId, name, format, totalSeats, rows, columns, hasImax, has3D, hasDolby } = req.body;

    const screen = await prisma.screen.create({
      data: {
        theatreId,
        name,
        format: format || 'TWO_D',
        totalSeats: parseInt(totalSeats),
        rows: parseInt(rows),
        columns: parseInt(columns),
        hasImax: hasImax === 'true',
        has3D: has3D === 'true',
        hasDolby: hasDolby === 'true',
      },
    });

    // Auto-generate seats based on rows/columns
    const seatData = [];
    const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let r = 0; r < parseInt(rows); r++) {
      for (let c = 1; c <= parseInt(columns); c++) {
        const rowLabel = rowLabels[r];
        let seatType = 'SILVER';
        if (r >= parseInt(rows) * 0.75) seatType = 'GOLD';
        if (r >= parseInt(rows) * 0.88) seatType = 'PREMIUM';

        seatData.push({
          screenId: screen.id,
          row: rowLabel,
          column: c,
          label: `${rowLabel}${c}`,
          seatType,
        });
      }
    }

    await prisma.seat.createMany({ data: seatData });

    sendResponse(res, 201, { screen }, 'Screen and seats created');
  } catch (error) {
    next(error);
  }
};

// Update screen
export const updateScreen = async (req, res, next) => {
  try {
    const screen = await prisma.screen.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendResponse(res, 200, { screen }, 'Screen updated');
  } catch (error) {
    next(error);
  }
};

// Get cities
export const getCities = async (req, res, next) => {
  try {
    const cities = await prisma.theatre.findMany({
      where: { isActive: true, deletedAt: null },
      select: { city: true, state: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    sendResponse(res, 200, { cities: cities.map((c) => c.city) });
  } catch (error) {
    next(error);
  }
};
