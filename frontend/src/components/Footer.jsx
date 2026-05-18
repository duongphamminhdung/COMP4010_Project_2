export default function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <span className="text-2xl">♞</span>
          <span>The Evolution of Human Chess Thought in the Age of AI</span>
        </div>
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
    </footer>
  );
}
