import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Minus,
  Plus,
  Play,
  Pause,
  RotateCcw,
  GitCommit,
  FastForward,
  SkipBack,
  SkipForward,
} from 'lucide-react';

/**
 * DETERMINISTIC MAP F(x,y):
 * Starting at (startX, 2).
 * If gcd(x,y) = 1: Move Right (x+1, y) -> Smooth Growth
 * If gcd(x,y) != 1: Move Up (x, y+1)   -> Genetic "Knot"
 */
const calculateGCD = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    x %= y;
    [x, y] = [y, x];
  }
  return x;
};

// Full list of boundary points provided by user (up to ~1M)
const BOUNDARIES = [
  0, 2, 4, 10, 26, 44, 92, 160, 194, 220, 334, 500, 566, 722, 950,
  1004, 1010, 1180, 1390, 1580, 2110, 2294, 2644, 2894, 3010, 3812,
  3944, 4094, 4106, 4646, 4760, 5710, 5936, 6152, 6254, 6662, 6692,
  6866, 7256, 7760, 7900, 9914, 10880, 11246, 12260, 12602, 13022,
  13724, 13814, 14230, 14912, 16210, 16316, 17066, 19466, 22060, 22550,
  22930, 23320, 23380, 24812, 26344, 27146, 28322, 28712, 29734, 30244,
  30784, 31502, 33482, 33784, 34832, 35410, 36932, 38702, 38804, 42070,
  42280, 44336, 46034, 49730, 52274, 52484, 54170, 58226, 58720, 59432,
  59486, 59854, 60086, 61382, 61562, 62254, 63290, 66034, 66490, 69404,
  70424, 72440, 74444, 75260, 80734, 81932, 82592, 83882, 85474, 87422,
  89906, 90512, 94262, 95254, 98180, 100994, 101744, 102550, 103604,
  104762, 107300, 108070, 113930, 120664, 122012, 124994, 128300,
  131786, 133502, 133874, 134072, 139090, 140222, 146324, 146654,
  147194, 148304, 150752, 151220, 151400, 157406, 165212, 167480,
  168140, 171890, 171904, 177422, 180344, 181232, 182150, 182690,
  192734, 193262, 196532, 199244, 200300, 204770, 206312, 206500,
  207422, 207940, 213160, 215972, 223076, 231392, 231830, 234782,
  236204, 238166, 240070, 242456, 243010, 249254, 251936, 258230,
  259444, 259802, 260432, 260900, 268970, 270224, 278320, 285610,
  285710, 294476, 297170, 313844, 313976, 317054, 325504, 325616,
  328022, 328480, 328984, 329546, 331070, 342074, 345160, 345452,
  348662, 371126, 374104, 376810, 377764, 379562, 383000, 387530,
  390760, 391570, 393770, 395210, 398044, 400720, 401966, 406664,
  411340, 411446, 420080, 428804, 431246, 432430, 442052, 447310,
  449246, 449822, 461720, 463180, 463892, 474272, 479804, 491504,
  496690, 498752, 502682, 504040, 504964, 512726, 513154, 525590,
  528574, 530576, 533110, 544100, 548366, 551744, 563012, 563546,
  565534, 569132, 589060, 594272, 596972, 598352, 598750, 607502,
  607796, 620050, 621890, 635644, 640370, 640660, 653582, 654770,
  655442, 660034, 667054, 670270, 671114, 673142, 682082, 687980,
  691654, 705074, 731642, 733802, 737170, 740164, 742690, 745322,
  745346, 754130, 756266, 779300, 780872, 794294, 802154, 805172,
  810530, 811412, 811624, 823730, 824972, 826480, 835340, 858536,
  861790, 862444, 869246, 871150, 882124, 882254, 893906, 904196,
  905270, 907100, 909152, 912146, 916270, 917792, 921254, 923080,
  928780, 936730, 945080, 959080, 964724, 967180, 981290, 983944,
  986780, 989942, 990206, 992960,
];

const MathText = ({ children }) => (
  <span className="font-serif italic tracking-wide">{children}</span>
);

const ControlRow = ({ label, value, onChange, min, max, step, fineStep }) => {
  const handleStep = (direction) => {
    const newValue = value + direction * (fineStep || step);
    if (newValue >= min && newValue <= max) {
      const cleanValue = Number.isInteger(step)
        ? Math.round(newValue)
        : parseFloat(newValue.toFixed(2));
      onChange(cleanValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="text-xs font-black uppercase text-stone-500 tracking-tighter">
          {label}
        </label>
        <span className="text-xs font-mono text-orange-500">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleStep(-1)}
          className="p-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-orange-500 transition-colors"
        >
          <Minus size={14} />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-orange-600"
        />
        <button
          onClick={() => handleStep(1)}
          className="p-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-orange-500 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const canvasRef = useRef(null);

  // Defaults
  const [iterations, setIterations] = useState(45000);
  const [zoom, setZoom] = useState(0.2);
  const [tightness, setTightness] = useState(1.5);

  // Starting X State
  const [startX, setStartX] = useState(1);

  // Input State Management
  const [inputValue, setInputValue] = useState('1');
  const [isEditing, setIsEditing] = useState(false);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(50); // 1-100

  const [hoverData, setHoverData] = useState(null);

  const pointsRef = useRef([]);
  const lastTickTime = useRef(0);
  const GOLDEN_ANGLE = 137.507764 * (Math.PI / 180);

  // Determine current Component
  let compIndex = -1;
  for (let i = 0; i < BOUNDARIES.length; i++) {
    if (startX >= BOUNDARIES[i]) {
      compIndex = i;
    } else {
      break;
    }
  }

  const compStart = compIndex !== -1 ? BOUNDARIES[compIndex] : 0;
  const compEnd =
    compIndex !== -1 && compIndex < BOUNDARIES.length - 1
      ? BOUNDARIES[compIndex + 1]
      : '∞';
  const isTransition = BOUNDARIES.includes(startX);

  // Component Navigation Helpers
  const skipToComponent = (direction) => {
    let targetIndex = compIndex + direction;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= BOUNDARIES.length) targetIndex = BOUNDARIES.length - 1;
    setStartX(BOUNDARIES[targetIndex]);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1) {
      setStartX(num);
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setInputValue(startX.toString());
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  // Ref to hold speed so the effect doesn't need to restart on speed change
  const animSpeedRef = useRef(animSpeed);
  useEffect(() => {
    animSpeedRef.current = animSpeed;
  }, [animSpeed]);

  // Animation Loop - Stabilized
  useEffect(() => {
    if (!isPlaying) {
      lastTickTime.current = 0;
      return;
    }

    let animationFrameId;

    const loop = (time) => {
      if (!lastTickTime.current) lastTickTime.current = time;

      const speed = animSpeedRef.current;
      // Map 1-100 slider to a delay in ms
      const minDelay = 0;
      const maxDelay = 200;
      const delay = maxDelay - ((speed - 1) * (maxDelay - minDelay)) / 99;

      if (time - lastTickTime.current >= delay) {
        setStartX((prev) => prev + 1);
        lastTickTime.current = time;
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const isHighCount = iterations > 50000;
    // New optimization: Omit coprime points entirely at extreme counts
    const omitCoprime = iterations > 100000;

    // Skip hover data if playing, or if we are skipping coprime points
    const skipStore = isPlaying || omitCoprime;

    ctx.fillStyle = '#050403';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    let x = startX;
    let y = 2;
    const newPoints = [];

    const dotScale = isHighCount ? 0.3 : 1;

    const safeIterations = Math.max(0, iterations);

    for (let i = 0; i < safeIterations; i++) {
      const g = calculateGCD(x, y);
      const angle = i * GOLDEN_ANGLE;
      const radius = Math.sqrt(i) * 12 * zoom * tightness;

      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;

      if (!skipStore) {
        newPoints.push({ px, py, x, y, g, step: i });
      }

      if (g === 1) {
        // Optimization: Skip drawing coprime points entirely at extreme iteration counts
        if (!omitCoprime) {
          ctx.fillStyle = `hsla(35, 60%, ${40 + (i / iterations) * 40}%, 0.8)`;

          if (isHighCount) {
            const s = Math.max(0.8, 2 * zoom * dotScale);
            ctx.fillRect(px - s / 2, py - s / 2, s, s);
          } else {
            ctx.beginPath();
            const r = 1.5 * zoom;
            if (r > 0.2) {
              ctx.arc(px, py, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        x += 1;
      } else {
        const hue = (g * 137.5) % 360;

        if (isHighCount) {
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, 1)`;
          const s = Math.max(1.5, Math.min(g, 15) * zoom * dotScale);
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        } else {
          if (zoom > 0.3) {
            ctx.shadowBlur = 10 * zoom;
            ctx.shadowColor = `hsla(${hue}, 90%, 50%, 0.6)`;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fillStyle = `hsla(${hue}, 100%, 70%, 1)`;

          ctx.beginPath();
          const knotSize = Math.max(3 * zoom, Math.min(g * 1.5, 20) * zoom);
          ctx.arc(px, py, knotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        y += 1;
      }
    }
    pointsRef.current = newPoints;
  }, [iterations, zoom, tightness, startX, isPlaying]);

  const handleMouseMove = useCallback(
    (e) => {
      if (pointsRef.current.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);

      let closest = null;
      let minDist = 30 * zoom;
      const len = pointsRef.current.length;

      const step = len > 50000 ? 5 : 1;

      for (let i = 0; i < len; i += step) {
        const p = pointsRef.current[i];
        const dx = mx - p.px;
        const dy = my - p.py;
        if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            closest = p;
          }
        }
      }
      setHoverData(closest);
    },
    [zoom]
  );

  useEffect(() => {
    drawTree();
  }, [drawTree]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050403] text-stone-200 p-4 font-sans">
      <div className="max-w-7xl w-full space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-stone-800 pb-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tighter text-orange-500 uppercase">
              Prime Dendrochronology
            </h1>
            <p className="text-stone-500 font-medium text-sm flex items-center gap-2">
              <span>Map</span>
              <MathText>F(x,y)</MathText>
              <span>seeded at</span>
              <span className="font-mono text-cyan-500">x = {startX}</span>
            </p>
          </div>

          <div className="h-16 w-48 bg-stone-900/50 rounded-xl border border-stone-800 flex flex-col items-center justify-center">
            {hoverData ? (
              <div className="animate-in fade-in slide-in-from-bottom-1 duration-200 text-center">
                <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">
                  Step {hoverData.step}
                </div>
                <div className="text-lg font-mono text-white">
                  ({hoverData.x}, {hoverData.y})
                </div>
                <div className="text-[10px] text-orange-400 font-bold underline">
                  <MathText>gcd</MathText> = {hoverData.g}
                </div>
              </div>
            ) : (
              <span className="text-stone-600 text-xs font-bold uppercase tracking-widest">
                {iterations > 100000
                  ? 'View Only'
                  : iterations > 50000
                    ? 'Analysis Only'
                    : 'Hover a point'}
              </span>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Canvas */}
          <div className="lg:col-span-3 relative aspect-square rounded-[3rem] border-4 border-stone-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden bg-black group">
            <canvas
              ref={canvasRef}
              width={1600}
              height={1600}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverData(null)}
              className="w-full h-full object-contain cursor-crosshair transition-transform duration-500"
            />

            {/* LARGE Component ID Watermark */}
            <div className="absolute top-6 right-6 pointer-events-none select-none">
              <span className="text-[6rem] font-black text-stone-500 leading-none tracking-tighter opacity-50">
                {compIndex === -1 ? '-' : compIndex}
              </span>
            </div>

            {/* Component / Regime HUD */}
            <div className="absolute top-6 left-6 pointer-events-none transition-opacity duration-300">
              <div
                className={`flex items-center gap-2 px-4 py-2 backdrop-blur-md rounded-lg border shadow-xl transition-colors duration-200 ${
                  isTransition
                    ? 'bg-cyan-900/40 border-cyan-500/50'
                    : 'bg-stone-900/80 border-stone-700/50'
                }`}
              >
                <GitCommit
                  size={14}
                  className={isTransition ? 'text-cyan-400' : 'text-stone-400'}
                />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                    Component
                  </span>
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      isTransition ? 'text-cyan-300' : 'text-orange-400'
                    }`}
                  >
                    [{compStart}, {compEnd})
                  </span>
                </div>
              </div>
              {isTransition && (
                <div className="mt-2 px-4 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
                  Boundary Point
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            <div className="bg-stone-900/40 p-6 rounded-3xl border border-stone-800 space-y-8 shadow-xl">
              {/* Animation Controls */}
              <div className="pb-6 border-b border-stone-800 space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase text-stone-500 tracking-tighter">
                    Starting X
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setStartX(1);
                      }}
                      className="p-2 bg-stone-800 rounded-full hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                      title="Reset to 1"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                        isPlaying
                          ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]'
                          : 'bg-stone-200 text-stone-900 hover:bg-white'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause size={12} fill="currentColor" />
                      ) : (
                        <Play size={12} fill="currentColor" />
                      )}
                      {isPlaying ? 'Halt' : 'Run'}
                    </button>
                  </div>
                </div>

                {/* Custom Input for Arbitrary X */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStartX((s) => Math.max(1, s - 1))}
                    className="p-2 rounded bg-stone-800 text-stone-400 hover:text-orange-500"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    id="startXInput"
                    type="text"
                    value={isEditing ? inputValue : startX}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full bg-black/50 border border-stone-700 rounded p-2 text-center font-mono text-lg text-cyan-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    onClick={() => setStartX((s) => s + 1)}
                    className="p-2 rounded bg-stone-800 text-stone-400 hover:text-orange-500"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Manual Scan Slider with Skip Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => skipToComponent(-1)}
                    className="p-1.5 bg-stone-800 rounded hover:bg-stone-700 text-stone-400 hover:text-cyan-400 transition-colors"
                    title="Previous Component"
                  >
                    <SkipBack size={14} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="1000000"
                    step="1"
                    value={startX}
                    onChange={(e) => setStartX(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                  <button
                    onClick={() => skipToComponent(1)}
                    className="p-1.5 bg-stone-800 rounded hover:bg-stone-700 text-stone-400 hover:text-cyan-400 transition-colors"
                    title="Next Component"
                  >
                    <SkipForward size={14} />
                  </button>
                </div>

                {/* Speed Control */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-stone-500">
                    <span className="flex items-center gap-1">
                      <FastForward size={10} /> Tick Rate
                    </span>
                    <span>{animSpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={animSpeed}
                    onChange={(e) => setAnimSpeed(parseInt(e.target.value))}
                    className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>

              {/* Visual Sliders */}
              <ControlRow
                label="Longevity (Steps)"
                value={iterations}
                onChange={setIterations}
                min={0}
                max={2000000}
                step={5000}
                fineStep={1000}
              />

              <ControlRow
                label="Ring Density"
                value={tightness}
                onChange={setTightness}
                min={0.1}
                max={6}
                step={0.1}
                fineStep={0.05}
              />

              <ControlRow
                label="Lens Zoom"
                value={zoom}
                onChange={setZoom}
                min={0.01}
                max={5}
                step={0.01}
                fineStep={0.01}
              />
            </div>

            <div className="p-6 bg-gradient-to-br from-stone-900 to-black rounded-3xl border border-stone-800">
              <h4 className="text-xs font-bold text-stone-400 uppercase mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                Performance Note
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Iterations {'>'} 50k enable "High Performance" mode: shadows are
                disabled.
                <br />
                Iterations {'>'} 100k enable "Structure Mode":{' '}
                <strong>Coprime points are hidden</strong> to focus purely on
                the collision structure and improve performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
