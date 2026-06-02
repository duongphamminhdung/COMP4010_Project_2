export default function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden py-20">
      {/* Animated background chess pieces */}
      <div className="absolute inset-0 overflow-hidden opacity-[0.03]">
        {Array.from({ length: 20 }).map((_, i) => {
          const pieces = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝'];
          const piece = pieces[i % pieces.length];
          const size = 40 + Math.random() * 80;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const delay = Math.random() * 4;
          const duration = 8 + Math.random() * 6;
          return (
            <span
              key={i}
              className="absolute text-white animate-pulse-slow"
              style={{
                fontSize: size,
                top: `${top}%`,
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            >
              {piece}
            </span>
          );
        })}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-transparent to-dark" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/50 via-transparent to-dark/50" />

      {/* Subtle radial glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(129,182,76,0.04) 0%, transparent 60%)' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-5 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3">
          <div className="h-px w-8 sm:w-12 bg-primary" />
          <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase">
            Data Visualization Study
          </span>
          <div className="h-px w-8 sm:w-12 bg-primary" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-5 sm:mb-6 font-serif">
          The Evolution of{' '}
          <span className="text-primary">Human Chess Thought</span>{' '}
          in the Age of AI
        </h1>

        <p className="text-text-secondary text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          How AlphaZero and Stockfish NNUE transformed the way humans play chess,
          from opening preparation to piece placement and sacrificial play.
        </p>

        <a
          href="#opening-tree"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-dark font-semibold px-6 sm:px-8 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-primary/25"
        >
          Explore the Data
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-text-muted flex items-start justify-center p-1">
          <div className="w-1.5 h-3 bg-text-muted rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
