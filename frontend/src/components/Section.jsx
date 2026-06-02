import { useRef, useEffect, useState } from 'react';

export default function Section({ id, number, title, description, notes = [], children, className = '' }) {
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
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`py-12 sm:py-16 lg:py-20 px-4 sm:px-6 max-w-7xl mx-auto transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${className}`}
    >
      {number && (
        <span className="text-primary text-sm font-semibold tracking-widest uppercase">
          {number}
        </span>
      )}
      {title && (
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-2 mb-3 font-serif leading-tight">{title}</h2>
      )}
      {description && (
        <p className="text-text-secondary text-sm sm:text-base max-w-2xl leading-relaxed mb-5">
          {description}
        </p>
      )}
      {notes.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3 mb-6 sm:mb-8">
          {notes.map((note) => (
            <div
              key={note.label}
              className="border border-border bg-card/45 px-3 py-2.5"
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
      <div className="rounded-lg sm:rounded-2xl p-3 sm:p-4 md:p-8 border border-border overflow-x-auto"
        style={{ background: 'rgba(49, 46, 43, 0.6)', backdropFilter: 'blur(12px)' }}>
        {children}
      </div>
    </section>
  );
}
