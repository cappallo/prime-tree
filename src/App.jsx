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
 * Let f(n) be a selectable transform.
 * If gcd(f(x), f(y)) = 1: Move Right (x+1, y) -> Smooth Growth
 * If gcd(f(x), f(y)) != 1: Move Up (x, y+1)   -> Genetic "Knot"
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

const BOUNDARIES_N2_PLUS_1 = [
  0,
  3, 173, 2723, 21008, 23828, 67562, 156138, 251672, 624668, 829502,
  878377, 1443778, 2261478, 2979388, 3541342, 3751028, 4449438,
  5357008, 5814843, 6905753, 8974123, 13091218, 14563383, 15194933,
  18305033, 18566823, 20399468, 20822453, 23687623, 26799023,
  31614717, 37105078, 40978723, 43130942, 43230823, 51108422,
  55881358, 62315587, 62446968, 62964108, 70189848, 75423563,
  84047858, 86904343, 89640222, 91080963, 97039387, 118338067,
  120525318, 127646933, 131908223, 139914083, 142076398, 152861468,
  154435363, 161483242, 165380823, 174152083, 221421578, 224320298,
  243253948, 256941362, 265526353, 274236923, 275567267, 288922713,
  341080023, 342660368, 346219213, 449076583, 454200818, 468249432,
  477713732, 495910998, 532286663, 552635222, 567698163, 626805083,
  642417348, 730703268, 747412017, 783979158, 791406503, 881895838,
  906700723, 978733803, 993207543,
];

const BOUNDARIES_N2_MINUS_1 =
  `0,2,14,75,186,453,1014,1616,2600,3042,4160,5576,6060,6282,6996,7766,8766,9243,9296,10812,11901,12122,13221,13935,14265,15276,15860,17138,18140,19734,20412,20690,21320,23024,23985,24375,24585,25664,26160,26805,27555,28761,30158,30912,32186,32355,32823,33396,34254,35378,36375,37431,38376,38570,39080,39633,41403,41940,42680,43694,46101,46460,46950,47916,48666,49311,49776,50136,51152,52442,52545,54452,55004,55496,56448,56982,58122,58746,60480,60621,61940,62546,63284,64101,65042,65472,66900,66924,68133,68952,69476,70296,71192,72656,73250,73542,74630,75308,76616,76815,77402,78200,79388,80180,80463,81345,83049,83162,84414,85052,86010,86450,87075,87836,88046,89804,91202,92312,93555,93896,94292,94622,95492,96158,96645,97034,97545,98540,98802,99870,100076,100566,101496,101574,102884,103610,104766,105236,105885,107186,108051,109292,110670,111471,111840,112215,112652,113984,114290,115820,116370,117080,117702,118490,119745,120086,121640,122232,122433,123930,124304,125454,125595,126492,127220,128466,128898,129165,129336,130233,131222,131954,133070,133562,133911,135656,136389,137048,137706,138822,139623,140900,141374,141792,143181,143342,143684,144302,145160,145314,146991,147710,148358,148772,149316,149546,149973,150993,151436,152220,152360,153746,153848,154316,154716,155090,155742,156672,157280,157640,158340,159614,159920,160832,161196,161313,162218,163161,164768,164802,165696,166400,167066,167180,167841,169323,169626,170184,171644,172082,172350,173502,173535,173912,174200,175100,175476,176222,176373,177716,178584,179450,180710,181014,181220,182226,183770,184316,185472,185880,186186,186861,187605,188222,189188,190046,191516,192026,193136,193590,194325,194733,195680,196701,198093,198146,198902,199446,199746,200280,201279,201518,203163,203510,204624,204882,205665,206768,206822,207723,208065,208713,209522,210066,211202,211575,213278,214082,214214,214566,215325,215732,216600,217611,218205,218600,218918,220296,221052,221706,222510,223122,224211,225080,226095,226604,228051,228344,228890,230541,231012,231506,232080,234039,234260,235356,236574,236960,237050,237854,238506,240230,240306,240494,241395,243405,244152,245256,245390,246465,247191,248066,248786,249105,250512,251160,252008,252993,253136,254846,255045,255375,256269,258159,258962,259470,259820,261230,262221,262598,264153,265086,265332,266474,267224,267726,268296,269192,270600,271316,272102,273716,274221,274716,275144,276486,277266,277845,279123,279615,279918,281469,282152,282621,284106,284946,285255,286122,286836,287562,287792,289614,290586,291290,291651,291956,293742,293910,295206,295503,297276,297596,298034,299300,299703,300258,301512,301820,302708,303824,305031,305540,306660,307476,308385,308816,309806,310323,311742,311792,312036,313676,313928,314640,315776,317163,318096,318560,319166,320330,320586,321516,322125,323400,323630,324290,324534,326054,326822,328592,330081,331148,331665,332916,333026,334134,335390,335556,335636,336512,337293,337800,337988,340041,341576,342428,342552,342912,344892,345182,345830,346424,347126,348482,349386,349962,351591,352545,353396,354260,355046,355686,356592,356642,357392,359214,359492,360711,361041,362610,363662,364058,364154,364926,365823,366810,367016,367964,369186,370436,371163,371690,372672,373352,374595,375260,375752,377168,378996,379286,380070,380700,381822,382083,382616,383660,384542,384933,385778,387840,388191,388550,389402,390014,391323,392066,392271,392394,394856,395955,396864,397083,399411,399696,399762,400893,401810,402645,403611,404294,404834,405314,406538,407370,407744,408956,409563,411114,411332,412695,413385,413688,414219,415922,416582,416870,417692,418112,419826,420200,420561,422025,423552,423830,424062,424875,425775,428031,428352,428466,428726,429506,430814,431052,431420,431952,433692,434589,434888,435603,436446,437514,437900,438330,439230,439466,440685,442116,443664,444410,445400,445808,446823,447540,448449,448526,449556,450975,451605,452220,452622,453740,454796,455576,456855,457182,457556,458510,459471,459680,460224,460776,461892,463296,463520,464222,464828,466233,467258,467840,467964,469592,469794,471446,471470,472305,473330,475436,475950,476084,476916,477981,478820,479690,480488,481418,481881,482106,483224,483834,484053,485451,486816,487344,487863,488150,489230,489480,490622,491226,491996,492765,494376,494816,496040,497313,497606,498044,498884,499863,500895,501543,501753,502383,503712,504735,504792,505764,506540,507486,508266,509810,510102,511784,512280,513228,513513,513590,514626,516153,516342,516836,517332,517880,518652,519708,521763,521964,522654,524019,524721,524954,525381,526592,527865,528978,529275,529971,530312,530862,531302,533102,533505,534524,535550,536235,536876,536954,537372,538034,539136,540498,540584,540968,542126,542880,543726,544154,544464,544698,545235,545600,546210,547770,548502,548793,548912,549096,550122,550562,551210,552632,552903,554673,555810,556530,557232,557592,557870,559299,559638,560286,561405,562016,563120,563784,565436,565622,566982,567150,568074,569400,570075,570416,571352,572109,573002,574016,574206,576402,576812,577214,577953,578763,579974,581042,582516,582825,584000,584838,585426,585836,587006,587630,588654,588996,590018,591164,592112,592280,594032,594608,595100,596121,597362,598635,599486,599775,600470,600990,602294,602846,603186,603380,604635,605340,605948,607365,607662,609366,610194,610506,611744,612806,613665,614120,614420,614856,616302,617202,617606,618564,619785,620216,621201,621504,622191,623492,624140,624566,625022,626396,627320,627890,628880,629606,629852,631620,632046,632775,634662,635414,635816,636690,637164,637296,638924,639444,639651,641355,641595,642123,643014,644022,644841,645660,646340,648342,648858,649092,649754,650025,650253,651522,652665,652992,653334,654225,655710,656061,657501,658410,659636,660465,661598,662246,663663,664070,664716,665016,666312,666744,667430,668216,669840,670185,670833,671972,673436,674060,674312,674652,675806,677028,677871,678273,679286,680252,681066,681186,681782,683904,685155,685400,685784,686048,687290,687732,688413,689433,690339,691574,692076,692576,693992,694982,695420,696396,697305,698060,699362,699531,699882,700964,702543,703593,703716,705146,705561,705804,706826,708060,708830,709104,710523,710919,712098,713613,714210,714351,716090,717111,717705,718352,718472,719952,720032,722163,722852,723141,723315,724830,726186,726636,726914,728058,728180,729654,731172,731544,731982,732411,732830,734415,734943,735230,736592,737960,738480,738948,740774,741434,742370,742874,743624,744432,745446,745874,746811,747624,748428,748682,749784,750686,751070,751502,752223,754172,754224,755756,756171,757041,758655,760166,760376,761565,762008,762962,763802,764082,764931,766725,767181,768704,769416,769670,769806,770468,770750,771585,773412,773514,774468,775215,775622,777548,777900,778035,779108,779690,781200,782496,782966,783393,784092,785610,785774,786150,786620,787785,789810,789986,790770,791703,792962,793496,794714,795015,796536,797810,798134,799580,799616,800475,801903,802310,802790,803606,804200,805716,807729,807975,808512,808874,809930,810798,811850,812480,812901,814400,815102,816096,816608,817004,818292,818952,820352,820844,821066,822546,822663,823250,823682,824124,824582,824982,826146,827598,827738,829101,829584,830223,830858,830922,832293,833115,834420,834822,835074,835902,836420,837332,838353,838850,838965,840764,841676,841956,843780,843908,844250,845376,846531,846824,847926,848703,849950,850442,851630,852360,852620,854232,854883,856116,856482,857000,858002,859068,859706,860250,860834,862070,863156,863984,864896,866322,866844,868461,869114,870402,871242,871298,872366,873446,873885,874610,874952,875942,876282,876980,878178,878492,879546,879714,880256,881126,881792,883742,883994,884924,885632,886806,887030,888585,888992,889098,890358,891122,891750,892065,892143,893346,894156,895893,896115,896612,897854,898820,898988,899391,900692,902594,902904,903432,904136,904740,905685,906126,906795,908448,909050,910326,911580,911976,913100,913521,914871,915306,915800,916454,916916,919124,920226,920534,920666,922686,923019,923066,924104,926343,926510,927936,928125,928830,929553,930360,931140,931886,932162,933470,933878,934251,934893,936950,937250,937860,938810,940136,940694,941126,941562,943635,944175,945165,945710,946152,946671,947760,948872,949076,950040,951369,951920,952983,953121,954020,954618,956384,956691,956892,957594,958530,959442,960830,961365,962160,962793,963579,965085,965670,966636,967440,967692,968540,969266,970122,971700,972180,972855,973334,975002,975612,975696,976770,977430,978416,979845,979904,981242,981375,982670,983376,984081,984402,985676,986763,987560,988890,989792,989976,990546,991896,992982,994722,994896,995598,996438,997362,997766,998780`
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n));

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

  const [transformKey, setTransformKey] = useState('id');

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

  const boundaries =
    transformKey === 'n2p1'
      ? BOUNDARIES_N2_PLUS_1
      : transformKey === 'n2m1'
        ? BOUNDARIES_N2_MINUS_1
        : BOUNDARIES;

  const transform = (n) => {
    if (transformKey === 'n2p1') return n * n + 1;
    if (transformKey === 'n2m1') return n * n - 1;
    return n;
  };

  // Determine current Component
  let compIndex = -1;
  for (let i = 0; i < boundaries.length; i++) {
    if (startX >= boundaries[i]) {
      compIndex = i;
    } else {
      break;
    }
  }

  const compStart = compIndex !== -1 ? boundaries[compIndex] : 0;
  const compEnd =
    compIndex !== -1 && compIndex < boundaries.length - 1
      ? boundaries[compIndex + 1]
      : '∞';
  const isTransition = boundaries.includes(startX);

  // Component Navigation Helpers
  const skipToComponent = (direction) => {
    let targetIndex = compIndex + direction;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= boundaries.length) targetIndex = boundaries.length - 1;
    setStartX(boundaries[targetIndex]);
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
      const g = calculateGCD(transform(x), transform(y));
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
  }, [iterations, zoom, tightness, startX, isPlaying, transformKey]);

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
              {/* f(n) Selector */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black uppercase text-stone-500 tracking-tighter">
                    Transform f(n)
                  </label>
                  <span className="text-[10px] font-mono text-orange-500">
                    {transformKey === 'n2p1'
                      ? 'n^2+1'
                      : transformKey === 'n2m1'
                        ? 'n^2-1'
                        : 'n'}
                  </span>
                </div>
                <select
                  value={transformKey}
                  onChange={(e) => setTransformKey(e.target.value)}
                  className="w-full bg-black/50 border border-stone-700 rounded p-2 text-center font-mono text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="id">f(n) = n</option>
                  <option value="n2p1">f(n) = n^2 + 1</option>
                  <option value="n2m1">f(n) = n^2 - 1</option>
                </select>
              </div>

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
