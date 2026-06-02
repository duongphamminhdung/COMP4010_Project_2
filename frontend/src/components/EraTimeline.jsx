import { useEffect, useRef, useState } from 'react';

const ERAS = [
  {
    id: 'pre-ai',
    years: '2015-2016',
    label: 'Pre-AI',
    accent: '#60a5fa',
    milestone: 'Human theory baseline',
    trigger: 'Before AlphaZero',
    piece: '\u2658',
    description:
      'Opening choices mostly reflect human books, coach advice, and traditional engine checking. This is the project baseline.',
    signal: 'Purely human preparation',
  },
  {
    id: 'early-post-ai',
    years: '2018-2019',
    label: 'Early Post-AI',
    accent: '#c084fc',
    milestone: 'AlphaZero shock',
    trigger: '2017 breakthrough',
    piece: '\u265A',
    description:
      'AlphaZero reframed what strong chess could look like: long-term pressure, unusual sacrifices, and less dogmatic opening thinking.',
    signal: 'New ideas enter culture',
  },
  {
    id: 'nnue-era',
    years: '2021-2022',
    label: 'NNUE Era',
    accent: '#fbbf24',
    milestone: 'Strong AI becomes ordinary',
    trigger: '2020 Stockfish NNUE',
    piece: '\u265D',
    description:
      'Neural evaluation arrives inside the free engine most players already use. High-quality review becomes normal after games.',
    signal: 'Engine feedback at scale',
  },
  {
    id: 'modern',
    years: '2024-2025',
    label: 'Modern',
    accent: '#34d399',
    milestone: 'AI-native play',
    trigger: 'Everyday analysis',
    piece: '\u265B',
    description:
      'Players now learn in an environment shaped by analysis tools, opening explorers, puzzle trainers, and human-like models.',
    signal: 'AI as training partner',
  },
];

const BREAKPOINTS = [
  { year: '2017', label: 'AlphaZero', color: '#c084fc' },
  { year: '2020', label: 'Stockfish NNUE', color: '#fbbf24' },
];

export default function EraTimeline() {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18 },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative px-4 sm:px-6 py-14 sm:py-18 lg:py-20 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #3D3B38, transparent)' }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div
          className={`grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12 items-end mb-10 sm:mb-12 transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <div>
            <span className="text-primary text-xs sm:text-sm font-semibold tracking-widest uppercase">
              Historical Frame
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2 mb-4 leading-tight">
              Four eras of human chess under AI
            </h2>
            <p className="text-text-secondary text-base sm:text-lg leading-relaxed max-w-2xl">
              The visualizations compare players before and after neural engines became part of
              ordinary chess culture. Read each chart as a movement across these four periods.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {BREAKPOINTS.map((item) => (
              <div
                key={item.year}
                className="border border-border bg-card/40 px-4 py-3"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>
                    {item.year}
                  </span>
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Key reference point for interpreting post-AI changes.
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute left-[12.5%] right-[12.5%] top-[2.1rem] h-px bg-border" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {ERAS.map((era, index) => (
              <article
                key={era.id}
                className={`relative border bg-card/45 transition-all duration-700 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  borderColor: `${era.accent}45`,
                  transitionDelay: visible ? `${index * 110}ms` : '0ms',
                }}
              >
                <div className="absolute -top-2 left-5 flex items-center gap-2">
                  <span
                    className="w-4 h-4 border-2 border-dark"
                    style={{
                      background: era.accent,
                      boxShadow: `0 0 18px ${era.accent}55`,
                    }}
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: era.accent }}>
                        {era.years}
                      </p>
                      <h3 className="text-xl font-bold text-white font-serif mt-1">
                        {era.label}
                      </h3>
                    </div>
                    <span
                      className="text-4xl leading-none font-serif opacity-80"
                      style={{ color: era.accent }}
                    >
                      {era.piece}
                    </span>
                  </div>

                  <div
                    className="h-1 w-16 mb-4"
                    style={{ background: era.accent }}
                  />

                  <p className="text-sm font-semibold text-white mb-1">
                    {era.milestone}
                  </p>
                  <p className="text-xs text-text-muted mb-3">
                    {era.trigger}
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {era.description}
                  </p>

                  <div
                    className="border-t pt-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ borderColor: `${era.accent}35`, color: era.accent }}
                  >
                    {era.signal}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
