export default function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden py-20">
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark/40 to-dark" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/60 via-transparent to-dark/60" />

      {/* Radial glow - more visible */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(129,182,76,0.07) 0%, transparent 70%)' }}
      />

      {/* Secondary ambient glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 40% 30% at 30% 60%, rgba(129,182,76,0.03) 0%, transparent 60%)' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
          <div className="h-px w-10 sm:w-14 bg-primary/60" />
          <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase">
            Data Visualization Study
          </span>
          <div className="h-px w-10 sm:w-14 bg-primary/60" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 sm:mb-7 font-serif text-balance">
          The Evolution of{' '}
          <span className="text-primary">Human Chess Thought</span>{' '}
          in the Age of AI
        </h1>

        <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed">
          How AlphaZero and Stockfish NNUE transformed the way humans play chess,
          from opening preparation to piece placement and sacrificial play.
        </p>

        <a
          href="#opening-tree"
          className="btn-press inline-flex items-center gap-2.5 bg-primary hover:bg-primary-hover text-dark font-semibold px-7 sm:px-9 py-3.5 rounded-full transition-all hover:shadow-lg hover:shadow-primary/30 active:shadow-md active:shadow-primary/20"
        >
          Explore the Data
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-text-muted/50 flex items-start justify-center p-1.5">
          <div className="w-1 h-3 bg-text-muted/60 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
