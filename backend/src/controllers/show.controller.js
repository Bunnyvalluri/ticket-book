import prisma from '../config/database.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Get shows for a movie in a theatre on a date
export const getShows = async (req, res, next) => {
  try {
    const { movieId, theatreId, date } = req.query;

    const where = {
      isActive: true,
      startTime: { gte: new Date() },
      ...(movieId && { movieId }),
      ...(theatreId && { screen: { theatreId } }),
      ...(date && {
        startTime: {
          gte: new Date(`${date}T00:00:00`),
          lte: new Date(`${date}T23:59:59`),
        },
      }),
    };

    const shows = await prisma.show.findMany({
      where,
      include: {
        movie: {
          select: { title: true, posterUrl: true, duration: true, ageRating: true },
        },
        screen: {
          include: { theatre: true },
        },
        language: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Compute availability
    const showsWithAvailability = await Promise.all(
      shows.map(async (show) => {
        const bookedSeats = await prisma.bookingSeat.count({
          where: {
            booking: {
              showId: show.id,
              status: { in: ['CONFIRMED', 'PENDING'] },
            },
          },
        });

        const totalSeats = show.screen.totalSeats;
        const available = totalSeats - bookedSeats;
        const availabilityPercent = (available / totalSeats) * 100;

        return {
          ...show,
          totalSeats,
          availableSeats: available,
          availability:
            available === 0
              ? 'SOLD_OUT'
              : availabilityPercent < 20
              ? 'FILLING_FAST'
              : 'AVAILABLE',
        };
      })
    );

    sendResponse(res, 200, { shows: showsWithAvailability });
  } catch (error) {
    next(error);
  }
};

// Get single show with seat map
export const getShowById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        movie: true,
        screen: {
          include: {
            theatre: true,
            seats: {
              where: { isActive: true },
              include: {
                seatPricings: { where: { showId: id } },
              },
              orderBy: [{ row: 'asc' }, { column: 'asc' }],
            },
          },
        },
        language: true,
        seatPricings: true,
      },
    });

    if (!show) throw new ApiError(404, 'Show not found');

    // Get booked seats
    const bookedSeatIds = await prisma.bookingSeat.findMany({
      where: {
        booking: {
          showId: id,
          status: { in: ['CONFIRMED', 'PENDING'] },
        },
      },
      select: { seatId: true },
    });

    // Get locked seats (real-time)
    const lockedSeats = await prisma.seatLock.findMany({
      where: {
        showId: id,
        isReleased: false,
        expiresAt: { gt: new Date() },
      },
      select: { seatId: true, userId: true },
    });

    const bookedIds = new Set(bookedSeatIds.map((s) => s.seatId));
    const lockedIds = new Map(lockedSeats.map((s) => [s.seatId, s.userId]));

    const seatsWithStatus = show.screen.seats.map((seat) => ({
      ...seat,
      status: bookedIds.has(seat.id)
        ? 'BOOKED'
        : lockedIds.has(seat.id)
        ? lockedIds.get(seat.id) === req.user?.id
          ? 'LOCKED_BY_ME'
          : 'LOCKED'
        : 'AVAILABLE',
      price:
        seat.seatPricings?.[0]?.price ||
        getDefaultPrice(seat.seatType),
      convenienceFee: seat.seatPricings?.[0]?.convenienceFee || 20,
    }));

    sendResponse(res, 200, {
      show: { ...show, screen: { ...show.screen, seats: seatsWithStatus } },
    });
  } catch (error) {
    next(error);
  }
};

function getDefaultPrice(seatType) {
  const prices = {
    SILVER: 150,
    GOLD: 200,
    PREMIUM: 280,
    PLATINUM: 350,
    VIP: 450,
    RECLINER: 500,
    COUPLE: 600,
    WHEELCHAIR: 150,
  };
  return prices[seatType] || 200;
}

// Create show (admin)
export const createShow = async (req, res, next) => {
  try {
    const {
      movieId, screenId, languageId, startTime, format,
      hasSubtitles, subtitleLanguage, seatPricings,
    } = req.body;

    // Get movie duration for endTime
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) throw new ApiError(404, 'Movie not found');

    const start = new Date(startTime);
    const end = new Date(start.getTime() + movie.duration * 60 * 1000 + 30 * 60 * 1000); // +30min buffer

    // Check for conflicts
    const conflict = await prisma.show.findFirst({
      where: {
        screenId,
        isActive: true,
        OR: [
          { startTime: { lte: start }, endTime: { gte: start } },
          { startTime: { lte: end }, endTime: { gte: end } },
          { startTime: { gte: start }, endTime: { lte: end } },
        ],
      },
    });

    if (conflict) throw new ApiError(409, 'Screen has a conflicting show at this time');

    const show = await prisma.show.create({
      data: {
        movieId,
        screenId,
        languageId,
        startTime: start,
        endTime: end,
        format: format || 'TWO_D',
        hasSubtitles: hasSubtitles || false,
        subtitleLanguage: subtitleLanguage || null,
      },
    });

    // Create seat pricings
    if (seatPricings?.length) {
      const seats = await prisma.seat.findMany({ where: { screenId } });
      const pricingData = [];

      for (const seat of seats) {
        const pricing = seatPricings.find((p) => p.seatType === seat.seatType);
        if (pricing) {
          pricingData.push({
            showId: show.id,
            seatId: seat.id,
            price: parseFloat(pricing.price),
            convenienceFee: parseFloat(pricing.convenienceFee || 20),
            gst: parseFloat(pricing.gst || 18),
          });
        }
      }

      if (pricingData.length) {
        await prisma.seatPricing.createMany({ data: pricingData });
      }
    }

    sendResponse(res, 201, { show }, 'Show created');
  } catch (error) {
    next(error);
  }
};

// Update show
export const updateShow = async (req, res, next) => {
  try {
    const show = await prisma.show.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendResponse(res, 200, { show }, 'Show updated');
  } catch (error) {
    next(error);
  }
};

// Delete show
export const deleteShow = async (req, res, next) => {
  try {
    await prisma.show.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    sendResponse(res, 200, null, 'Show cancelled');
  } catch (error) {
    next(error);
  }
};
