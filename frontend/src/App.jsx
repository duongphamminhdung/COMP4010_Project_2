import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Section from './components/Section';
import Footer from './components/Footer';
import OpeningTree from './components/OpeningTree';
import OpeningRevolution from './components/OpeningRevolution';
import OpeningSimulator from './components/OpeningSimulator';
import EraTimeline from './components/EraTimeline';
import BlunderHeatmap from './components/BlunderHeatmap';
import PieceSquareMap from './components/PieceSquareMap';
import GameLength from './components/GameLength';
import { loadAllData } from './data/dataLoader';

function App() {
  const [data, setData] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    loadAllData().then(setData);
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
        discussion={'The sunburst reveals that the top-level branching structure (1.e4 vs 1.d4) stayed remarkably stable across all four eras. What changed is the depth and diversity of popular lines: post-AI eras show slightly thinner trees at deeper levels, suggesting players converged more quickly onto engine-approved continuations rather than exploring independently. The "Other" slices also shrink over time, indicating a narrowing of the collective opening repertoire.'}
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
        discussion={"The Sicilian Defense maintained its position as the most popular response to 1.e4 across all eras, but the slopes after 2020 show a subtle flattening. The Queen's Gambit gained ground steadily, likely because streaming and engine recommendations made it more approachable. The Italian Game saw a modest resurgence post-NNUE, reflecting how engine evaluations rehabilitated older, classical systems that had fallen out of fashion. The real story is not that openings changed dramatically, but that the distribution became slightly more even as players broadened their repertoires."}
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
        discussion={'Stepping through these openings makes the connection between theory and practice visible. System openings like the London develop pieces to predictable squares regardless of Black\'s response, which is why they surged in popularity among online players: they are learnable and engine-friendly. In contrast, sharp defenses like the Sicilian demand memorization of long variations, an area where engine preparation gives an outsized advantage. The simulator shows that "knowing an opening" means knowing a concrete plan, not just a move order.'}
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
        discussion={"The heatmap shows a clear, consistent decline in blunder rates from the Pre-AI era to the Modern era across every ELO bracket. The improvement is largest in the middle brackets (1400-2200), where players benefit most from post-game engine analysis: they have enough tactical awareness to understand what went wrong, but still make enough errors for the feedback to matter. The 2600+ bracket shows the smallest relative improvement, consistent with the idea that elite players already had strong tactical accuracy before AI tools became widespread. This is the strongest evidence in the project that AI changed how players learn, not just what they learn."}
      >
        <BlunderHeatmap data={data.blunderRate} />
      </Section>

      <Section
        id="piece-square"
        number="Section 05"
        title="Where Do Pieces Go Now?"
        description="Board heatmaps for where pieces most often land."
        notes={[
          { label: 'Read', text: 'Brighter squares mean more frequent piece placement.' },
          { label: 'Why', text: 'Piece locations reveal strategic habits, not just results.' },
          { label: 'Explore', text: 'Switch pieces and compare center versus flank activity.' },
        ]}
        discussion={'The piece-square maps reveal that piece placement patterns are remarkably stable across eras. Knights still cluster on c3, f3, c6, and f6; bishops gravitate toward c4, f4, and the fianchetto squares. This makes sense: the geometry of the board and the movement rules of each piece create natural "best squares" that no amount of AI innovation can override. What AI did change is the frequency with which pieces reach their optimal squares: the heatmaps show slightly more concentrated hot spots in later eras, suggesting players became more efficient at reaching good positions, even if the positions themselves did not shift.'}
      >
        <PieceSquareMap data={data.pieceSquares} />
      </Section>

      <Section
        id="game-length"
        number="Section 06"
        title="Game Length: The Comb Pattern"
        description="Game endings by ply, with time-control spikes highlighted."
        notes={[
          { label: 'Read', text: 'Spikes show many games ending at similar move counts.' },
          { label: 'Why', text: 'Online time controls shape when games collapse or convert.' },
          { label: 'Explore', text: 'Use the zoom panel around ply 80 and 120.' },
        ]}
        discussion={"The comb-shaped distribution is driven almost entirely by online time controls. The spike at ply 80 corresponds to 3+0 games ending in time trouble around move 40, and the spike at ply 120 reflects 5+3 and 10+0 games reaching their natural endgame crisis point. This pattern did not shift meaningfully across eras because it is a structural artifact of how Lichess games are played, not a reflection of chess understanding. The overall shape of the distribution (right-skewed with a long tail) remained consistent, reinforcing the conclusion that while AI changed how players think, it did not change the fundamental rhythm of online chess."}
      >
        <GameLength data={data.gameLength} />
      </Section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
