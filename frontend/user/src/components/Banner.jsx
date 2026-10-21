import { motion } from 'framer-motion';

const Banner = () => {
  return (
    <div className="relative h-[330px] overflow-hidden bg-slate-900 md:h-[520px]">
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80" 
          alt="Campaign Hero"
          className="h-full w-full object-cover opacity-60"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-slate-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_38%)]" />

      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4 md:px-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <span className="mb-4 block text-sm font-bold uppercase tracking-[0.28em] text-blue-200">Summer Collection 2026</span>
            <h1 className="mb-6 text-4xl font-black leading-tight text-white md:text-6xl lg:text-7xl">
              Upgrade Your <br />
              <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">Lifestyle</span> Now
            </h1>
            <p className="mb-8 hidden max-w-md text-base leading-relaxed text-slate-200 md:block">
              Discover premium essentials with fresh drops, limited-time offers, and hand-picked finds for every routine.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary flex items-center gap-2 px-7 py-3 text-base shadow-lg shadow-primary/20">Shop Collection</button>
              <button className="rounded-xl border border-white/25 bg-white/10 px-7 py-3 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20">Learn More</button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
