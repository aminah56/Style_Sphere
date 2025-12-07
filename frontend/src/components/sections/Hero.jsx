import { motion } from 'framer-motion';
import { heroSlides } from '../../data/fallback';

const Hero = () => (
  <div className="container py-10 grid md:grid-cols-2 gap-10 items-center">
    <div>
      <p className="text-xs tracking-[0.4em] uppercase text-purple-500">Eastern Luxury • Purple Edit</p>
      <h1 className="mt-4 text-4xl md:text-5xl font-semibold text-purple-900 leading-tight">
        Draped in royal lilacs inspired by Sapphire & Nishat art direction.
      </h1>
      <p className="body-text mt-4">
        Fluid silhouettes, modern tailoring and rich jamawar textures — built to mirror premium Pakistani fashion
        houses. Browse stitched, unstitched and luxury pret capsules without logging in, or sign in to unlock wishlist
        and cart sync.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="px-6 py-3 rounded-full bg-purple-700 text-white text-xs tracking-[0.4em] uppercase shadow-md">
          Shop Women
        </button>
        <button className="px-6 py-3 rounded-full border border-purple-300 text-purple-700 text-xs tracking-[0.4em] uppercase">
          Shop Men
        </button>
      </div>
      <div className="mt-8 flex gap-8 text-xs uppercase tracking-[0.3em] text-gray-500">
        <div>
          <p className="text-2xl text-purple-800 font-semibold">48h</p>
          <p>Express Dispatch</p>
        </div>
        <div>
          <p className="text-2xl text-purple-800 font-semibold">14</p>
          <p>Experience Stores</p>
        </div>
        <div>
          <p className="text-2xl text-purple-800 font-semibold">100%</p>
          <p>Secure Checkout</p>
        </div>
      </div>
    </div>
    <div className="grid gap-6">
      {heroSlides.map((slide, index) => (
        <motion.div
          key={slide.id}
          className="rounded-3xl overflow-hidden shadow-xl relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <img src={slide.image} alt={slide.title} className="h-64 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent text-white p-6 flex flex-col justify-end">
            <p className="text-xs tracking-[0.4em] uppercase" style={{ color: slide.accent }}>
              {slide.eyebrow}
            </p>
            <h3 className="text-xl font-semibold">{slide.title}</h3>
            <p className="text-sm text-white/80">{slide.copy}</p>
            <button className="mt-3 text-xs tracking-[0.4em] uppercase">{slide.cta}</button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default Hero;

