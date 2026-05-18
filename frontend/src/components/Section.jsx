import { useRef, useEffect, useState } from 'react';

export default function Section({ id, number, title, description, children, className = '' }) {
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
      className={`py-20 px-6 max-w-7xl mx-auto transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${className}`}
    >
      {number && (
        <span className="text-primary text-sm font-semibold tracking-widest uppercase">
          {number}
        </span>
      )}
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-3">{title}</h2>
      )}
      {description && (
        <p className="text-text-secondary text-lg max-w-2xl leading-relaxed mb-8">
          {description}
        </p>
      )}
      <div className="bg-surface rounded-2xl p-4 md:p-8 border border-border">
        {children}
      </div>
    </section>
  );
}
