import express from 'express';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import * as movieCtrl from '../controllers/movie.controller.js';
import * as showCtrl from '../controllers/show.controller.js';

const router = express.Router();

// Public
router.get('/', optionalAuth, movieCtrl.getMovies);
router.get('/now-showing', movieCtrl.getNowShowing);
router.get('/coming-soon', movieCtrl.getComingSoon);
router.get('/trending', movieCtrl.getTrending);
router.get('/genres', movieCtrl.getGenres);
router.get('/languages', movieCtrl.getLanguages);
router.get('/:slug', optionalAuth, movieCtrl.getMovieBySlug);

// Reviews (authenticated)
router.post('/:movieId/reviews', authenticate, movieCtrl.addReview);
router.post('/:movieId/wishlist', authenticate, movieCtrl.toggleWishlist);
router.post('/:movieId/favorite', authenticate, movieCtrl.toggleFavorite);

// Shows for movie
router.get('/:movieId/shows', showCtrl.getShows);

// Admin only
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), movieCtrl.createMovie);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), movieCtrl.updateMovie);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), movieCtrl.deleteMovie);

export default router;
