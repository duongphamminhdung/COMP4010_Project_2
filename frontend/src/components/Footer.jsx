export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <span className="text-2xl">♞</span>
          <span>The Evolution of Human Chess Thought in the Age of AI</span>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <a
            href="#"
            className="btn-press inline-flex items-center gap-2 text-xs text-text-muted hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-full hover:border-primary/30"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Back to top
          </a>
          <div className="text-text-muted text-sm text-center md:text-right">
            <p>COMP4010 Data Visualization &middot; VinUniversity</p>
            <p className="mt-1">
              Data from{' '}
              <a
                href="https://lichess.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Lichess.org
              </a>{' '}
              open database
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border/50 flex flex-col items-center gap-2">
        <p className="text-xs text-text-muted uppercase tracking-widest">Authors</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
          {['Duong Pham Minh Dung', 'Chau Hoang Phuc', 'Vu Duc Duy', 'Trinh Tuan Hung'].map((name) => (
            <span key={name} className="text-sm font-medium text-text-secondary">{name}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
