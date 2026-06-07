import { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Section from './components/Section';
import Footer from './components/Footer';
import OpeningTree from './components/OpeningTree';
import OpeningRevolution from './components/OpeningRevolution';
import OpeningSimulator from './components/OpeningSimulator';
import EraTimeline from './components/EraTimeline';
import BlunderHeatmap from './components/BlunderHeatmap';
import GameLength from './components/GameLength';
import PieceSquareMap from './components/PieceSquareMap';
import GuessELO from './components/GuessELO';
import { loadAllData } from './data/dataLoader';

const PIECES = ['♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝'];

function buildPiecePositions() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  return Array.from({ length: 32 }, (_, i) => ({
    piece: PIECES[i % PIECES.length],
    size: 48 + rand() * 100,
    top: rand() * 100,
    left: rand() * 100,
    delay: rand() * 5,
    duration: 10 + rand() * 8,
    opacity: 0.018 + rand() * 0.025,
  }));
}

function App() {
  const [data, setData] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const piecePositions = useMemo(() => buildPiecePositions(), []);

  useEffect(() => {
    loadAllData().then(setData).catch((err) => {
      console.error('Failed to load data:', err);
      setData({});
    });
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? scrollTop / docHeight : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-dark">
        <nav className="h-14" />
        <div className="flex items-center justify-center min-h-[80svh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-border" />
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-text-muted text-sm font-medium tracking-wide">
              Loading chess data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark grain-overlay">
      <a href="#opening-tree" className="skip-link">Skip to content</a>

      {/* Global chess piece background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {piecePositions.map((p, i) => (
          <span
            key={i}
            className="absolute text-white animate-pulse-slow select-none"
            style={{
              fontSize: p.size,
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              opacity: p.opacity,
            }}
          >
            {p.piece}
          </span>
        ))}
      </div>

      {/* Scroll progress bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-primary origin-left"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      <Navbar />
      <main>
        <Hero />
        <EraTimeline />

      <Section
        id="opening-tree"
        number="Section 01"
        title="The Opening Tree"
        description="A branching view of popular move sequences across eras."
        notes={[
          { label: 'Read', text: 'Each ring is one move deeper into the opening.' },
          { label: 'Why', text: 'A wider branch means more players chose that line.' },
          { label: 'Explore', text: 'Switch eras and hover to compare repertoire depth.' },
        ]}
        discussion={<>
          The sunburst reveals that the top-level branching structure (<strong className="text-white">1.e4 vs 1.d4</strong>) stayed remarkably stable across all four eras. What changed is the depth and diversity of popular lines:{' '}
          <span style={{ color: '#c084fc', fontWeight: 700 }}>post-AI eras</span> show slightly thinner trees at deeper levels, suggesting players converged more quickly onto engine-approved continuations rather than exploring independently. The{' '}
          <em className="text-white">"Other"</em> slices also shrink over time, indicating a <strong className="text-white">narrowing of the collective opening repertoire</strong>.
        </>}
      >
        <OpeningTree data={data.openingTree} />
      </Section>

      <Section
        id="opening-revolution"
        number="Section 02"
        title="The Opening Revolution"
        description="A shared line chart for named openings over time."
        notes={[
          { label: 'Read', text: 'Higher lines show openings that dominate the pool.' },
          { label: 'Why', text: 'Slopes show which openings gained or lost share after AI.' },
          { label: 'Explore', text: 'Use the 2017 and 2020 markers as AI reference points.' },
        ]}
        discussion={<>
          The <strong className="text-white">Sicilian Defense</strong> maintained its position as the most popular response to 1.e4 across all eras, but the slopes after{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>2020</span> show a subtle flattening. The <strong className="text-white">Queen's Gambit</strong> gained ground steadily, likely because streaming and engine recommendations made it more approachable. The <strong className="text-white">Italian Game</strong> saw a modest resurgence{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>post-NNUE</span>, reflecting how engine evaluations rehabilitated older, classical systems that had fallen out of fashion. The real story is not that openings changed dramatically, but that the distribution became <em className="text-white">slightly more even</em> as players broadened their repertoires.
        </>}
      >
        <OpeningRevolution data={data.openingByYear} />
      </Section>

      <Section
        id="opening-simulator"
        number="Section 03"
        title="Opening Simulator"
        description="A playable board for common openings and defenses."
        notes={[
          { label: 'Read', text: 'The highlighted squares show the latest move.' },
          { label: 'Why', text: 'The simulator links opening names to actual piece plans.' },
          { label: 'Explore', text: 'Compare system openings with sharp defensive setups.' },
        ]}
        discussion={<>
          Stepping through these openings makes the connection between theory and practice visible. System openings like the <strong className="text-white">London</strong> develop pieces to predictable squares regardless of Black's response, which is why they <span style={{ color: '#34d399', fontWeight: 700 }}>surged in popularity</span> among online players: they are learnable and engine-friendly. In contrast, sharp defenses like the <strong className="text-white">Sicilian</strong> demand memorization of long variations, an area where engine preparation gives an <em className="text-white">outsized advantage</em>. The simulator shows that <em>"knowing an opening"</em> means knowing a concrete plan, not just a move order.
        </>}
      >
        <OpeningSimulator />
      </Section>

      <Section
        id="blunders"
        number="Section 04"
        title="Did AI Make Us Blunder Less?"
        description="A heatmap of blunders per game by rating and era."
        notes={[
          { label: 'Read', text: 'Rows are ELO groups; columns are time periods.' },
          { label: 'Why', text: 'Post-game AI review should reduce repeated tactical errors.' },
          { label: 'Explore', text: 'Use the side badges for Pre-AI to Modern change.' },
        ]}
        discussion={<>
          The heatmap shows a clear, consistent decline in blunder rates from the{' '}
          <span style={{ color: '#60a5fa', fontWeight: 700 }}>Pre-AI</span> era to the{' '}
          <span style={{ color: '#34d399', fontWeight: 700 }}>Modern</span> era across every ELO bracket. The improvement is largest in the middle brackets (<strong className="text-white">1400–2200</strong>), where players benefit most from post-game engine analysis: they have enough tactical awareness to understand what went wrong, but still make enough errors for the feedback to matter. The <strong className="text-white">2600+</strong> bracket shows the smallest relative improvement, consistent with the idea that elite players already had strong tactical accuracy before AI tools became widespread. This is the <em className="text-white">strongest evidence in the project</em> that AI changed <strong className="text-white">how players learn</strong>, not just what they learn.
        </>}
      >
        <BlunderHeatmap data={data.blunderRate} />
      </Section>

      <Section
        id="game-length"
        number="Section 05"
        title="Did Games Become Shorter?"
        description="Normalized game-length distributions across the four eras."
        notes={[
          { label: 'Read', text: 'Each curve shows the percentage of games ending at that ply.' },
          { label: 'Why', text: 'Normalization makes eras comparable despite different sample sizes.' },
          { label: 'Explore', text: 'Hover to compare eras and use the median cards as a summary.' },
        ]}
        discussion={<>
          At first glance the histogram looks like a <strong className="text-white">comb distribution</strong>: odd-numbered plies have noticeably higher peaks, meaning Black is more likely to end any given game (win, lose or draw). Ignoring the peaks, the overall shape is a normal distribution centered around 70 ply. But the peaks are the real story. The largest peak sits at <span style={{ color: '#e2e8f0', fontWeight: 700 }}>ply 81</span> (Black's 40th move), a second peak at <span style={{ color: '#e2e8f0', fontWeight: 700 }}>ply 120</span> (White's 60th move), and a tiny but visible peak at ply 160. These align almost perfectly with <span style={{ color: '#60a5fa', fontWeight: 700 }}>classical time controls</span>: 120 minutes for 40 moves, then 60 minutes for 20 moves, then 15 minutes for the rest with a 30-second increment starting on move 61. The peaks likely reflect players pushing to make the time control, only to realize they have ruined their position — or simply running out of time. The correspondence is too precise to be coincidental.
        </>}
      >
        <GameLength data={data.gameLength} />
      </Section>

      <Section
        id="piece-square"
        number="Section 06"
        title="Where Do Pieces Go Now?"
        description="Board heatmaps for where pieces most often land."
        notes={[
          { label: 'Read', text: 'Brighter squares mean more frequent piece placement.' },
          { label: 'Why', text: 'Piece locations reveal strategic habits, not just results.' },
          { label: 'Explore', text: 'Switch pieces and compare center versus flank activity.' },
        ]}
      >
        <PieceSquareMap data={data.pieceSquares} />
      </Section>

      <Section
        id="guess-elo"
        number="Section 07"
        title="How Strong Did This Game Look?"
        description="Play a game against our bot and inspect a rough single-game rating signal."
        notes={[
          { label: 'Play', text: 'You play White against a ~1300 ELO bot. Click a piece, then click where to move.' },
          { label: 'Model', text: 'A noisy ACPL regression demo turns move quality into an illustrative bracket signal.' },
          { label: 'Explore', text: 'After 20 moves, estimate the signal. Treat it as a visualization, not a real rating.' },
        ]}
        discussion={<>
          The rating signal uses <strong className="text-white">Average Centipawn Loss (ACPL)</strong> — the average eval drop per move compared to the best available move. The population-level regression captures a real pattern: <span style={{ color: '#34d399', fontWeight: 700 }}>stronger players</span> usually lose fewer centipawns per move. But one short game against a lightweight bot is <em className="text-white">too noisy</em> to identify a real rating, so the output is best read as an <span style={{ color: '#34d399', fontWeight: 700 }}>educational visualization</span> of move quality rather than an actual ELO prediction.
        </>}
      >
        <GuessELO modelData={data.eloModel} />
      </Section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
