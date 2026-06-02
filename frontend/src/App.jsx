import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Section from './components/Section';
import Footer from './components/Footer';
import OpeningTree from './components/OpeningTree';
import OpeningRevolution from './components/OpeningRevolution';
import OpeningSimulator from './components/OpeningSimulator';
import EraTimeline from './components/EraTimeline';
import MaterialCurve from './components/MaterialCurve';
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
      >
        <OpeningSimulator />
      </Section>

      <Section
        id="material"
        number="Section 04"
        title="Material and Sacrifices"
        description="Average sacrifice rate by era for stronger amateur games."
        notes={[
          { label: 'Read', text: 'Each dot is average sacrifices per game.' },
          { label: 'Why', text: 'AI made non-obvious compensation easier to study.' },
          { label: 'Explore', text: 'Look for jumps or drops between adjacent eras.' },
        ]}
      >
        <MaterialCurve sacrificeData={data.sacrifice} />
      </Section>

      <Section
        id="blunders"
        number="Section 05"
        title="Did AI Make Us Blunder Less?"
        description="A heatmap of blunders per game by rating and era."
        notes={[
          { label: 'Read', text: 'Rows are ELO groups; columns are time periods.' },
          { label: 'Why', text: 'Post-game AI review should reduce repeated tactical errors.' },
          { label: 'Explore', text: 'Use the side badges for Pre-AI to Modern change.' },
        ]}
      >
        <BlunderHeatmap data={data.blunderRate} />
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
        id="game-length"
        number="Section 07"
        title="Game Length: The Comb Pattern"
        description="Game endings by ply, with time-control spikes highlighted."
        notes={[
          { label: 'Read', text: 'Spikes show many games ending at similar move counts.' },
          { label: 'Why', text: 'Online time controls shape when games collapse or convert.' },
          { label: 'Explore', text: 'Use the zoom panel around ply 80 and 120.' },
        ]}
      >
        <GameLength data={data.gameLength} />
      </Section>

      <Section
        id="discussion"
        number="Section 08"
        title="Discussion"
        description="The plots point to one main shift: AI changed how players learn, choose openings, and convert games."
        notes={[
          { label: 'Openings', text: 'Dominant lines still lead, but the slopes show where players rethink their choices.' },
          { label: 'Learning', text: 'Blunder declines suggest AI analysis became a daily feedback loop, not just elite prep.' },
          { label: 'Structure', text: 'Piece maps and game length show that AI also changes style, pace, and setup habits.' },
        ]}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card-hover border border-border bg-card/45 p-5">
            <h3 className="text-sm font-semibold text-white mb-2 font-serif">Openings are not just labels</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              The simulator and opening plots show that a name like Sicilian or London System hides a concrete plan, not just a move order.
            </p>
          </div>
          <div className="card-hover border border-border bg-card/45 p-5">
            <h3 className="text-sm font-semibold text-white mb-2 font-serif">AI changes the middle layer first</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              The dominant opening may stay dominant, but the smaller lines move fastest once AI ideas spread through the player pool.
            </p>
          </div>
          <div className="card-hover border border-border bg-card/45 p-5">
            <h3 className="text-sm font-semibold text-white mb-2 font-serif">Learning shows up in blunders</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Lower blunder rates across eras suggest players are reviewing mistakes more effectively, especially with engine help.
            </p>
          </div>
          <div className="card-hover border border-border bg-card/45 p-5">
            <h3 className="text-sm font-semibold text-white mb-2 font-serif">The game itself keeps its fingerprints</h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Piece-square patterns and the comb-shaped game length distribution show that AI shapes style, but not the basic structure of chess.
            </p>
          </div>
        </div>
      </Section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
