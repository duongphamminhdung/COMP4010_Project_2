import { useState, useEffect } from 'react';

const sections = [
  { id: 'opening-tree', label: 'Opening Tree' },
  { id: 'opening-revolution', label: 'Opening Revolution' },
  { id: 'opening-simulator', label: 'Simulator' },
  { id: 'material', label: 'Material' },
  { id: 'blunders', label: 'Blunders' },
  { id: 'piece-square', label: 'Piece Squares' },
  { id: 'game-length', label: 'Game Length' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-lg shadow-black/20' : ''
      }`}
      style={{
        background: scrolled ? 'rgba(26,26,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid #3D3B38' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-white font-semibold text-lg font-serif">
          <span className="text-2xl">♞</span>
          <span className="hidden sm:inline">Chess & AI</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-text-secondary hover:text-primary text-xs xl:text-sm transition-colors whitespace-nowrap"
            >
              {s.label}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          style={{ background: 'rgba(26,26,26,0.95)', backdropFilter: 'blur(12px)' }}>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block px-6 py-3 text-text-secondary hover:text-primary text-sm"
              onClick={() => setMenuOpen(false)}
            >
              {s.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
