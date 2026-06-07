import { useRef, useEffect, useState } from 'react';

export default function Section({ id, number, title, description, notes = [], discussion, children, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`section-glow py-14 sm:py-20 lg:py-24 px-4 sm:px-6 max-w-7xl mx-auto transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${className}`}
    >
      <div className="section-divider mb-10 sm:mb-14" />

      {number && (
        <span className="text-primary text-base sm:text-lg font-bold tracking-widest uppercase">
          {number}
        </span>
      )}
      {title && (
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2 mb-3 font-serif leading-tight text-balance">{title}</h2>
      )}
      {description && (
        <p className="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
          {description}
        </p>
      )}
      {notes.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3 mb-6 sm:mb-8">
          {notes.map((note) => (
            <div
              key={note.label}
              className="card-hover border border-border bg-card/80 px-3.5 py-3"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">
                {note.label}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-8 overflow-x-auto">
        {children}
      </div>

      {discussion && (
        <div className="mt-6 rounded-lg border p-5 sm:p-7" style={{ background: 'rgba(26,26,26,0.95)', borderColor: 'rgba(129,182,76,0.25)' }}>
          <h3 className="text-xl sm:text-2xl font-bold text-primary mb-4 font-serif">Discussion</h3>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">{discussion}</p>
        </div>
      )}
    </section>
  );
}
