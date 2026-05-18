import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Section from './components/Section';
import Footer from './components/Footer';
import OpeningTree from './components/OpeningTree';
import FirstMoveShift from './components/FirstMoveShift';
import MaterialCurve from './components/MaterialCurve';
import BlunderHeatmap from './components/BlunderHeatmap';
import PieceSquareMap from './components/PieceSquareMap';
import GameLength from './components/GameLength';
import {
  getOpeningTreeData,
  getFirstMoveData,
  getMaterialCurveData,
  getSacrificeData,
  getBlunderHeatmapData,
  getPieceSquareData,
  getGameLengthData,
} from './data/mockData';

function App() {
  const openingTreeData = getOpeningTreeData();
  const firstMoveData = getFirstMoveData();
  const materialCurveData = getMaterialCurveData();
  const sacrificeData = getSacrificeData();
  const blunderHeatmapData = getBlunderHeatmapData();
  const pieceSquareData = getPieceSquareData();
  const gameLengthData = getGameLengthData();

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <Hero />

      <Section
        id="opening-tree"
        number="Section 01"
        title="The Opening Tree"
        description="How has the opening repertoire changed since AI? Click through the most popular move sequences and toggle between time periods to see the shift."
      >
        <OpeningTree data={openingTreeData} />
      </Section>

      <Section
        id="first-move"
        number="Section 02"
        title="The First Move Revolution"
        description="e4 has long been the most popular first move, but its dominance has been slowly eroding. d4, c4, and Nf3 have all gained ground in the post-AI era."
      >
        <FirstMoveShift data={firstMoveData} />
      </Section>

      <Section
        id="material"
        number="Section 03"
        title="Material and Sacrifices"
        description="Modern players hold on to material longer and sacrifice more intentionally. AI has taught us that positional sacrifices — like the exchange sacrifice — can be sound."
      >
        <MaterialCurve curveData={materialCurveData} sacrificeData={sacrificeData} />
      </Section>

      <Section
        id="blunders"
        number="Section 04"
        title="Did AI Make Us Blunder Less?"
        description="Blunder rates have decreased across all ELO brackets since the rise of AI-powered coaching tools. The improvement is most pronounced at intermediate levels."
      >
        <BlunderHeatmap data={blunderHeatmapData} />
      </Section>

      <Section
        id="piece-square"
        number="Section 05"
        title="Where Do Pieces Go Now?"
        description="Piece placement patterns have shifted. Knights venture to the rim more often, bishops prefer fianchetto positions, and queens are more active in the middlegame."
      >
        <PieceSquareMap data={pieceSquareData} />
      </Section>

      <Section
        id="game-length"
        number="Section 06"
        title="Game Length: The Comb Pattern"
        description="Game lengths show a distinctive comb pattern with spikes at time control boundaries. Modern games tend to be slightly longer, reflecting improved technique."
      >
        <GameLength data={gameLengthData} />
      </Section>

      <Footer />
    </div>
  );
}

export default App;
