import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================
  // GENRES
  // ============================
  const genres = await Promise.all([
    prisma.genre.upsert({ where: { slug: 'action' }, update: {}, create: { name: 'Action', slug: 'action', colorHex: '#ef4444' } }),
    prisma.genre.upsert({ where: { slug: 'drama' }, update: {}, create: { name: 'Drama', slug: 'drama', colorHex: '#8b5cf6' } }),
    prisma.genre.upsert({ where: { slug: 'comedy' }, update: {}, create: { name: 'Comedy', slug: 'comedy', colorHex: '#f59e0b' } }),
    prisma.genre.upsert({ where: { slug: 'thriller' }, update: {}, create: { name: 'Thriller', slug: 'thriller', colorHex: '#1d4ed8' } }),
    prisma.genre.upsert({ where: { slug: 'horror' }, update: {}, create: { name: 'Horror', slug: 'horror', colorHex: '#7f1d1d' } }),
    prisma.genre.upsert({ where: { slug: 'romance' }, update: {}, create: { name: 'Romance', slug: 'romance', colorHex: '#ec4899' } }),
    prisma.genre.upsert({ where: { slug: 'sci-fi' }, update: {}, create: { name: 'Sci-Fi', slug: 'sci-fi', colorHex: '#06b6d4' } }),
    prisma.genre.upsert({ where: { slug: 'animation' }, update: {}, create: { name: 'Animation', slug: 'animation', colorHex: '#10b981' } }),
    prisma.genre.upsert({ where: { slug: 'adventure' }, update: {}, create: { name: 'Adventure', slug: 'adventure', colorHex: '#f97316' } }),
    prisma.genre.upsert({ where: { slug: 'fantasy' }, update: {}, create: { name: 'Fantasy', slug: 'fantasy', colorHex: '#6366f1' } }),
  ]);
  console.log(`✅ Created ${genres.length} genres`);

  // ============================
  // LANGUAGES
  // ============================
  const languages = await Promise.all([
    prisma.language.upsert({ where: { code: 'en' }, update: {}, create: { name: 'English', code: 'en', nativeName: 'English' } }),
    prisma.language.upsert({ where: { code: 'hi' }, update: {}, create: { name: 'Hindi', code: 'hi', nativeName: 'हिंदी' } }),
    prisma.language.upsert({ where: { code: 'te' }, update: {}, create: { name: 'Telugu', code: 'te', nativeName: 'తెలుగు' } }),
    prisma.language.upsert({ where: { code: 'ta' }, update: {}, create: { name: 'Tamil', code: 'ta', nativeName: 'தமிழ்' } }),
    prisma.language.upsert({ where: { code: 'ml' }, update: {}, create: { name: 'Malayalam', code: 'ml', nativeName: 'മലയാളം' } }),
    prisma.language.upsert({ where: { code: 'kn' }, update: {}, create: { name: 'Kannada', code: 'kn', nativeName: 'ಕನ್ನಡ' } }),
  ]);
  console.log(`✅ Created ${languages.length} languages`);

  // ============================
  // ADMIN USER
  // ============================
  const adminPass = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cinemax.com' },
    update: {},
    create: {
      email: 'admin@cinemax.com',
      passwordHash: adminPass,
      firstName: 'Admin',
      lastName: 'CineMax',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      notificationSettings: { create: {} },
    },
  });
  console.log(`✅ Admin user: ${admin.email} / Admin@1234`);

  // Demo customer
  const custPass = await bcrypt.hash('Test@1234', 12);
  await prisma.user.upsert({
    where: { email: 'customer@cinemax.com' },
    update: {},
    create: {
      email: 'customer@cinemax.com',
      passwordHash: custPass,
      firstName: 'Test',
      lastName: 'Customer',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isEmailVerified: true,
      phone: '+919876543210',
      notificationSettings: { create: {} },
    },
  });
  console.log(`✅ Customer: customer@cinemax.com / Test@1234`);

  // ============================
  // MOVIES
  // ============================
  const moviesData = [
    {
      title: 'Galactic Odyssey',
      slug: 'galactic-odyssey-2026',
      synopsis: 'A breathtaking journey across galaxies where humanity faces its ultimate test. When Earth receives a signal from the edge of the universe, one crew sets out on a mission that will change the fate of all civilizations.',
      tagline: 'The universe has a plan for us.',
      posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 148,
      releaseDate: new Date('2026-06-15'),
      imdbRating: 8.7,
      status: 'NOW_SHOWING',
      ageRating: 'U/A',
      country: 'USA',
      isFeatured: true,
      isTrending: true,
    },
    {
      title: 'Crimson Blade',
      slug: 'crimson-blade-2026',
      synopsis: 'In a world where honor is currency, a disgraced samurai must reclaim his legacy before an empire falls to corruption.',
      tagline: 'Honor has a price. Glory has a cost.',
      posterUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 132,
      releaseDate: new Date('2026-07-01'),
      imdbRating: 7.9,
      status: 'NOW_SHOWING',
      ageRating: 'A',
      country: 'Japan',
      isFeatured: true,
      isTrending: true,
    },
    {
      title: 'Neon Dreams',
      slug: 'neon-dreams-2026',
      synopsis: 'In a cyberpunk Mumbai of 2087, a hacker discovers a conspiracy that reaches the highest corridors of power.',
      tagline: 'The truth is encrypted.',
      posterUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 126,
      releaseDate: new Date('2026-07-20'),
      imdbRating: 8.2,
      status: 'NOW_SHOWING',
      ageRating: 'U/A',
      country: 'India',
      isFeatured: true,
      isTrending: true,
    },
    {
      title: 'The Last Monsoon',
      slug: 'the-last-monsoon-2026',
      synopsis: 'A heartwarming drama about two strangers who find unexpected love during the last monsoon in a small coastal town before it disappears underwater.',
      tagline: 'Some stories are worth getting wet for.',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 142,
      releaseDate: new Date('2026-08-01'),
      imdbRating: null,
      status: 'COMING_SOON',
      ageRating: 'U',
      country: 'India',
      isFeatured: false,
      isTrending: false,
    },
    {
      title: 'Phantom Protocol',
      slug: 'phantom-protocol-2026',
      synopsis: 'An elite black ops unit goes rogue to stop a rogue AI that has infiltrated every government in the world.',
      tagline: 'No mission. No orders. No limits.',
      posterUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 155,
      releaseDate: new Date('2026-09-12'),
      imdbRating: null,
      status: 'COMING_SOON',
      ageRating: 'A',
      country: 'USA',
      isFeatured: false,
      isTrending: false,
    },
    {
      title: 'Laughter Therapy',
      slug: 'laughter-therapy-2026',
      synopsis: 'Five strangers stuck in a hospital waiting room discover that laughter really is the best medicine.',
      tagline: 'Prescription: one movie. Side effects: joy.',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80',
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: 108,
      releaseDate: new Date('2026-06-20'),
      imdbRating: 7.1,
      status: 'NOW_SHOWING',
      ageRating: 'U',
      country: 'India',
      isFeatured: false,
      isTrending: true,
    },
  ];

  const createdMovies = [];
  for (const movieData of moviesData) {
    const movie = await prisma.movie.upsert({
      where: { slug: movieData.slug },
      update: {},
      create: {
        ...movieData,
        genres: {
          create: [
            { genreId: genres[movieData.status === 'NOW_SHOWING' ? 0 : 3].id },
          ],
        },
        languages: {
          create: [{ languageId: languages[0].id }, { languageId: languages[1].id }],
        },
        cast: {
          create: [
            { name: 'Alex Morgan', character: 'Lead Character', order: 0 },
            { name: 'Sam Chen', character: 'Supporting Role', order: 1 },
          ],
        },
        crew: {
          create: [
            { name: 'Director Name', role: 'Director' },
            { name: 'Producer Name', role: 'Producer' },
          ],
        },
      },
    });
    createdMovies.push(movie);
  }
  console.log(`✅ Created ${createdMovies.length} movies`);

  // ============================
  // THEATRES & SCREENS
  // ============================
  const theatresData = [
    {
      name: 'CineMax IMAX Hyderabad',
      slug: 'cinemax-imax-hyderabad',
      address: 'Inorbit Mall, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      phone: '+914023456789',
      email: 'hyderabad@cinemax.com',
      hasParking: true,
      hasFoodCourt: true,
      hasAtm: true,
      hasWifi: true,
    },
    {
      name: 'CineMax PVR Mumbai',
      slug: 'cinemax-pvr-mumbai',
      address: 'Phoenix Palladium, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400013',
      phone: '+912222334455',
      email: 'mumbai@cinemax.com',
      hasParking: true,
      hasFoodCourt: true,
      hasAtm: true,
      hasWifi: true,
    },
  ];

  const createdTheatres = [];
  for (const theatreData of theatresData) {
    const theatre = await prisma.theatre.upsert({
      where: { slug: theatreData.slug },
      update: {},
      create: theatreData,
    });

    // Create screens for each theatre
    const screenFormats = ['TWO_D', 'THREE_D', 'IMAX'];
    for (const format of screenFormats) {
      const existingScreen = await prisma.screen.findFirst({
        where: { theatreId: theatre.id, name: `Screen ${format}` },
      });

      if (!existingScreen) {
        const rows = format === 'IMAX' ? 15 : 12;
        const columns = format === 'IMAX' ? 20 : 16;
        const screen = await prisma.screen.create({
          data: {
            theatreId: theatre.id,
            name: `Screen ${format}`,
            format,
            totalSeats: rows * columns,
            rows,
            columns,
            hasImax: format === 'IMAX',
            has3D: format.includes('THREE') || format === 'IMAX',
          },
        });

        // Create seats
        const seatData = [];
        const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < rows; r++) {
          for (let c = 1; c <= columns; c++) {
            const rowLabel = rowLabels[r];
            let seatType = 'SILVER';
            if (r >= rows * 0.5 && r < rows * 0.75) seatType = 'GOLD';
            if (r >= rows * 0.75 && r < rows * 0.9) seatType = 'PREMIUM';
            if (r >= rows * 0.9) seatType = format === 'IMAX' ? 'RECLINER' : 'PLATINUM';

            seatData.push({
              screenId: screen.id,
              row: rowLabel,
              column: c,
              label: `${rowLabel}${c}`,
              seatType,
            });
          }
        }
        await prisma.seat.createMany({ data: seatData, skipDuplicates: true });
      }
    }
    createdTheatres.push(theatre);
  }
  console.log(`✅ Created ${createdTheatres.length} theatres with screens`);

  // ============================
  // SHOWS
  // ============================
  const nowShowingMovies = createdMovies.filter((m) => m.status === 'NOW_SHOWING');
  const screens = await prisma.screen.findMany({ take: 4 });

  const showTimes = ['10:00', '13:30', '17:00', '20:30', '23:00'];
  const showsCreated = [];

  for (const movie of nowShowingMovies.slice(0, 3)) {
    for (const screen of screens.slice(0, 2)) {
      for (const time of showTimes.slice(0, 3)) {
        const [hours, minutes] = time.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);
        startTime.setDate(startTime.getDate() + 1); // Tomorrow

        const existingShow = await prisma.show.findFirst({
          where: { movieId: movie.id, screenId: screen.id, startTime },
        });

        if (!existingShow) {
          const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000 + 30 * 60 * 1000);
          const show = await prisma.show.create({
            data: {
              movieId: movie.id,
              screenId: screen.id,
              languageId: languages[0].id,
              startTime,
              endTime,
              format: screen.format,
            },
          });

          // Create seat pricings
          const seats = await prisma.seat.findMany({ where: { screenId: screen.id } });
          const pricingData = seats.map((seat) => {
            const prices = { SILVER: 150, GOLD: 220, PREMIUM: 300, PLATINUM: 380, VIP: 450, RECLINER: 500, COUPLE: 600, WHEELCHAIR: 120 };
            return {
              showId: show.id,
              seatId: seat.id,
              price: prices[seat.seatType] || 200,
              convenienceFee: 20,
            };
          });

          await prisma.seatPricing.createMany({ data: pricingData, skipDuplicates: true });
          showsCreated.push(show);
        }
      }
    }
  }
  console.log(`✅ Created ${showsCreated.length} shows with pricing`);

  // ============================
  // COUPONS
  // ============================
  await prisma.coupon.upsert({
    where: { code: 'CINEMAX20' },
    update: {},
    create: {
      code: 'CINEMAX20',
      title: '20% Off Your First Booking',
      description: 'Get 20% discount on your first movie booking!',
      type: 'PERCENTAGE',
      value: 20,
      minOrderAmount: 200,
      maxDiscount: 150,
      usageLimit: 1000,
      userUsageLimit: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT100' },
    update: {},
    create: {
      code: 'FLAT100',
      title: 'Flat ₹100 Off',
      description: 'Get flat ₹100 off on bookings above ₹400',
      type: 'FLAT',
      value: 100,
      minOrderAmount: 400,
      usageLimit: 500,
      userUsageLimit: 2,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Created coupons');

  console.log('\n🎉 Seeding complete!\n');
  console.log('📧 Admin: admin@cinemax.com / Admin@1234');
  console.log('📧 Customer: customer@cinemax.com / Test@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
