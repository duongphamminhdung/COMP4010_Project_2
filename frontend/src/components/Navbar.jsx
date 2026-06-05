import { useState, useEffect, useCallback } from 'react';

const sections = [
  { id: 'opening-tree', label: 'Opening Tree' },
  { id: 'opening-revolution', label: 'Opening Revolution' },
  { id: 'opening-simulator', label: 'Simulator' },
  { id: 'blunders', label: 'Blunders' },
  { id: 'pca-scatter', label: 'Player Profiles' },
  { id: 'piece-square', label: 'Piece Squares' },
  { id: 'guess-elo', label: 'Guess ELO' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg' : ''
      }`}
      style={{
        background: scrolled ? 'rgba(26,26,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #3D3B38' : 'none',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-white font-semibold text-lg font-serif group">
          <span className="text-2xl transition-transform duration-200 group-hover:scale-110">♞</span>
          <span className="hidden sm:inline">Chess & AI</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={handleNavClick}
                aria-current={isActive ? 'step' : undefined}
                className={`relative px-3 py-1.5 text-xs xl:text-sm transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {s.label}
                <span
                  className={`absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full transition-all duration-300 ${
                    isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                />
              </a>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white text-2xl active:scale-90 transition-transform duration-150"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden border-t border-border overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-[calc(100vh-3.5rem)] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="py-2">
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`block px-6 py-2.5 text-sm transition-colors duration-150 ${
                  isActive
                    ? 'text-primary font-semibold bg-primary/5'
                    : 'text-text-secondary hover:text-primary hover:bg-white/[0.02]'
                }`}
                onClick={handleNavClick}
                aria-current={isActive ? 'step' : undefined}
              >
                {isActive && <span className="inline-block w-1 h-1 rounded-full bg-primary mr-2 align-middle" />}
                {s.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
