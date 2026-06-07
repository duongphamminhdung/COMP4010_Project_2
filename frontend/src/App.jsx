import { useState, useEffect } from 'react';
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

function App() {
  const [data, setData] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

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
        id="game-length"
        number="Section 05"
        title="Did Games Become Shorter?"
        description="Normalized game-length distributions across the four eras."
        notes={[
          { label: 'Read', text: 'Each curve shows the percentage of games ending at that ply.' },
          { label: 'Why', text: 'Normalization makes eras comparable despite different sample sizes.' },
          { label: 'Explore', text: 'Hover to compare eras and use the median cards as a summary.' },
        ]}
        discussion={'Games became slightly shorter after the pre-AI era, but the change is modest rather than dramatic. Median length falls from 65 ply (32.5 moves) in Pre-AI games to 62 ply (31 moves) in the NNUE era, then rises slightly to 63 ply in the Modern era. Mean length also declines from 70.7 to 68.7 ply between Pre-AI and Modern. The overlapping curves show that AI did not fundamentally reshape game duration; the result is better interpreted as a small behavioral shift that may also reflect changes in time controls and online playing habits.'}
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
        title="Can We Guess Your ELO?"
        description="Play a game against our bot and let the model predict your rating bracket."
        notes={[
          { label: 'Play', text: 'You play White against a ~1300 ELO bot. Click a piece, then click where to move.' },
          { label: 'Model', text: 'An ACPL regression model predicts your ELO from move quality, calibrated on 200k real games.' },
          { label: 'Explore', text: 'After 20 moves, hit Predict. If you win, your estimate gets a boost.' },
        ]}
        discussion={'The prediction model uses Average Centipawn Loss (ACPL) — the average eval drop per move compared to the best available move. We fitted the regression ELO = a - b × ln(ACPL) on 200,000 Lichess games with known player ratings and Stockfish evaluations. The model demonstrates that playing strength is quantifiable: higher-rated players lose less eval per move on average. Game result against a known-strength bot also factors in: beating the bot sets a floor for your estimate, while losing caps it.'}
      >
        <GuessELO modelData={data.eloModel} />
      </Section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
