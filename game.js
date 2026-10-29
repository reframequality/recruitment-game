// ---------- small utilities ----------

const $ = id => document.getElementById(id);

function reducedMotion(){
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
// Waits for animations; collapses to an immediate tick when motion is reduced.
function sleep(ms){
  return new Promise(res => setTimeout(res, reducedMotion() ? 0 : ms));
}
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function cosmeticPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// Seeded PRNG so the daily challenge deals everyone the same market and dice.
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashString(s){
  let h = 1779033703 ^ s.length;
  for(let i=0; i<s.length; i++){
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return h >>> 0;
}

function todayKey(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const DAILY_EPOCH = Date.UTC(2026, 9, 13); // Daily #1
function dailyNumber(){
  const d = new Date();
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - DAILY_EPOCH) / 86400000) + 1;
}

// ---------- persistence (per-browser records, badges, settings) ----------

const STORE_KEY = 'itRecruitmentGame.v2';
function defaultStore(){
  return { played:0, wins:0, losses:0, bestWeeks:null, bestSalary:null, achievements:{}, rolesWon:[], daily:{}, muted:false, lastRole:null };
}
function loadStore(){
  try { return Object.assign(defaultStore(), JSON.parse(localStorage.getItem(STORE_KEY)) || {}); }
  catch(e){ return defaultStore(); }
}
function saveStore(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch(e){}
}
let store = loadStore();

// ---------- sound: tiny synthesised effects, no audio files ----------

const Sound = {
  ctx: null,
  init(){
    if(store.muted) return;
    if(!this.ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      try { this.ctx = new AC(); } catch(e){ return; }
    }
    if(this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, o = {}){
    if(store.muted) return;
    this.init();
    const ctx = this.ctx; if(!ctx) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if(o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.07, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  },
  noise(dur, o = {}){
    if(store.muted) return;
    this.init();
    const ctx = this.ctx; if(!ctx) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0; i<data.length; i++) data[i] = (Math.random()*2 - 1) * (1 - i/data.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = o.freq || 1500;
    const g = ctx.createGain(); g.gain.value = o.vol || 0.15;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
  },
  roll(){ for(let i=0; i<7; i++) this.noise(0.05, { delay:i*0.11, vol:0.25, freq:1600 + Math.random()*1600 }); },
  step(){ this.tone(620 + Math.random()*60, 0.06, { type:'triangle', vol:0.04 }); },
  rivalStep(){ this.tone(300, 0.05, { type:'triangle', vol:0.025 }); },
  ladder(){ [523,659,784,1047].forEach((f,i) => this.tone(f, 0.16, { type:'triangle', delay:i*0.08, vol:0.07 })); },
  snake(){ this.tone(560, 0.7, { type:'sawtooth', to:80, vol:0.04 }); },
  stamp(){ this.tone(120, 0.2, { type:'square', to:45, vol:0.1 }); this.noise(0.15, { vol:0.35, freq:500 }); },
  card(){ this.tone(880, 0.08, { type:'triangle', vol:0.05 }); this.tone(1320, 0.14, { type:'triangle', delay:0.07, vol:0.05 }); },
  good(){ this.tone(660, 0.1, { type:'triangle' }); this.tone(990, 0.18, { type:'triangle', delay:0.08 }); },
  bad(){ this.tone(330, 0.16, { type:'square', to:220, vol:0.04 }); this.tone(247, 0.3, { type:'square', delay:0.14, to:180, vol:0.04 }); },
  cash(){ [1319,1568,2093].forEach((f,i) => this.tone(f, 0.12, { type:'square', delay:i*0.06, vol:0.03 })); },
  tick(){ this.tone(1200, 0.03, { type:'square', vol:0.02 }); },
  win(){ [523,659,784,1047,784,1047].forEach((f,i) => this.tone(f, i===5 ? 0.6 : 0.14, { type:'triangle', delay:i*0.12, vol:0.08 })); },
  lose(){ [392,370,349,330].forEach((f,i) => this.tone(f, i===3 ? 0.8 : 0.3, { type:'sawtooth', delay:i*0.34, vol:0.04, to: i===3 ? 250 : undefined })); }
};

// ---------- game state ----------

let state = null;          // null until a run starts
let rngs = null;           // separate seeded streams: dice, rival, events
let snakePaths = {};       // start square -> SVG path, for sliding the token down
let eventCardTimer = null;

function currentLadders(){ return state ? state.ladders : LADDERS; }
function currentSnakes(){ return state ? state.snakes : SNAKES; }
function roleById(id){ return ROLES.find(r => r.id === id); }
function roleLabelFor(id){ const r = roleById(id); return r ? r.label : 'Candidate'; }

function newState(mode, role, market){
  return {
    mode, role, market, dailyKey: todayKey(), dailyNo: dailyNumber(),
    ladders: Object.assign({}, LADDERS, market.ladders || {}),
    snakes: Object.assign({}, SNAKES, market.snakes || {}),
    pos: 1, rival: market.rivalStart || 1,
    turns: 0, callbacks: 0, rejections: 0, bites: 0, climbs: 0,
    morale: 60, skipTurns: 0, burnouts: 0,
    powerups: { network:1, tailor:1, followUp:1 }, powerupsUsed: 0,
    networkBoost: false, tailorBoost: false, skipSnake: false,
    pushes: 0, rescinds: 0, salary: null, pulledBy: null,
    history: [], unlockedThisRun: [],
    rivalWarned: false, finished: false, busy: true
  };
}

// ---------- board ----------

function buildBoard(){
  const board = $('board');
  board.innerHTML = '';
  const L = currentLadders(), S = currentSnakes();
  for(let r = ROWS-1; r >= 0; r--){
    for(let c = 0; c < COLS; c++){
      const n = squareNumber(r, c);
      const div = document.createElement('div');
      div.className = 'sq ' + ((r + c) % 2 ? 'odd' : 'even');
      div.id = 'sq-' + n;
      div.tabIndex = 0;
      let icon = '', kind = '';
      if(L[n]){ div.classList.add('ladder'); icon = '⬆'; kind = 'ladder'; }
      else if(S[n]){ div.classList.add('snake'); icon = '⬇'; kind = 'snake'; }
      else if(CHEST_SQUARES.includes(n)){ div.classList.add('chest'); icon = '❓'; kind = 'hiring event'; }
      else if(CHOICE_SQUARES[n]){ div.classList.add('choice'); icon = '⚖️'; kind = 'decision'; }
      else if(n === TOTAL){ div.classList.add('finish'); icon = '🏁'; kind = 'the offer'; }
      else if(SQUARE_TEXT[n]) div.classList.add('tone-' + SQUARE_TEXT[n].tone);
      if(state && ((state.market.ladders || {})[n] || (state.market.snakes || {})[n])) div.classList.add('marketSq');
      div.setAttribute('aria-label', `Square ${n}${kind ? ', ' + kind : ''}`);
      div.innerHTML = `<span class="n">${n}</span>${icon ? `<span class="icon">${icon}</span>` : ''}`;
      div.addEventListener('mouseenter', () => showSquareInfo(n));
      div.addEventListener('focus', () => showSquareInfo(n));
      div.addEventListener('click', () => showSquareInfo(n));
      board.appendChild(div);
    }
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'boardArt';
  svg.setAttribute('aria-hidden', 'true');
  board.appendChild(svg);
  const layer = document.createElement('div');
  layer.id = 'tokenLayer';
  layer.innerHTML = `<div class="token rival" id="rivalToken" title="The internal candidate"><span class="face">👔</span></div>
                     <div class="token player" id="playerToken" title="You"><span class="face" id="playerFace">🧑‍💻</span></div>`;
  board.appendChild(layer);
  const card = document.createElement('div');
  card.id = 'eventCard';
  card.className = 'eventCard';
  card.setAttribute('aria-hidden', 'true');
  board.appendChild(card);
}

function centerOf(n){
  const el = $('sq-' + n);
  return { x: el.offsetLeft + el.offsetWidth/2, y: el.offsetTop + el.offsetHeight/2 };
}

// Draws the snakes and ladders over the board as SVG.
function drawBoardArt(){
  const board = $('board');
  const svg = $('boardArt');
  if(!svg) return;
  const W = board.clientWidth, H = board.clientHeight;
  if(!W || !H) return;
  const cell = $('sq-1').offsetWidth;
  board.style.setProperty('--cell', cell + 'px');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.innerHTML = '';
  snakePaths = {};
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    (parent || svg).appendChild(e);
    return e;
  };

  Object.entries(currentLadders()).forEach(([start, end]) => {
    const a = centerOf(+start), b = centerOf(+end);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy/len, ny = dx/len, off = cell * 0.17;
    const g = el('g', { class:'ladderArt' });
    el('line', { x1:a.x, y1:a.y, x2:b.x, y2:b.y, class:'ladder-glow', 'stroke-width': cell*0.62 }, g);
    const r1 = { ax:a.x+nx*off, ay:a.y+ny*off, bx:b.x+nx*off, by:b.y+ny*off };
    const r2 = { ax:a.x-nx*off, ay:a.y-ny*off, bx:b.x-nx*off, by:b.y-ny*off };
    const rungs = Math.max(3, Math.round(len / (cell*0.32)));
    for(let i=1; i<rungs; i++){
      const t = i/rungs;
      el('line', { x1:r1.ax+(r1.bx-r1.ax)*t, y1:r1.ay+(r1.by-r1.ay)*t, x2:r2.ax+(r2.bx-r2.ax)*t, y2:r2.ay+(r2.by-r2.ay)*t, class:'ladder-rung', 'stroke-width': cell*0.06 }, g);
    }
    [r1, r2].forEach(r => {
      el('line', { x1:r.ax, y1:r.ay, x2:r.bx, y2:r.by, class:'ladder-rail-edge', 'stroke-width': cell*0.11 }, g);
      el('line', { x1:r.ax, y1:r.ay, x2:r.bx, y2:r.by, class:'ladder-rail', 'stroke-width': cell*0.07 }, g);
    });
  });

  const palette = [
    ['#d7263d','#ffb3ba'], ['#e8590c','#ffd8a8'], ['#9c36b5','#e5dbff'],
    ['#c2255c','#ffdeeb'], ['#b02a1a','#ffc9c9'], ['#5f3dc4','#d0bfff']
  ];
  Object.entries(currentSnakes()).forEach(([start, end], i) => {
    const a = centerOf(+start), b = centerOf(+end);
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const ux = dx/len, uy = dy/len, nx = -uy, ny = ux;
    const segs = Math.max(2, Math.round(len / (cell*1.4)));
    const amp = cell * 0.26;
    let d = `M ${a.x} ${a.y}`;
    for(let s=1; s<=segs; s++){
      const t0 = (s-1)/segs, t1 = s/segs;
      const side = (s % 2 ? 1 : -1) * amp * (s === segs ? 0.6 : 1);
      const c1t = t0 + (t1-t0)/3, c2t = t0 + 2*(t1-t0)/3;
      const c1 = { x: a.x + dx*c1t + nx*side, y: a.y + dy*c1t + ny*side };
      const c2 = { x: a.x + dx*c2t + nx*side, y: a.y + dy*c2t + ny*side };
      const p = { x: a.x + dx*t1, y: a.y + dy*t1 };
      d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p.x} ${p.y}`;
    }
    const [col, light] = palette[i % palette.length];
    const g = el('g', { class:'snakeArt' });
    el('path', { d, class:'snake-outline', 'stroke-width': cell*0.19 }, g);
    const body = el('path', { d, class:'snake-body', stroke: col, 'stroke-width': cell*0.14 }, g);
    el('path', { d, class:'snake-pattern', stroke: light, 'stroke-width': cell*0.05, 'stroke-dasharray': `${cell*0.06} ${cell*0.14}` }, g);
    snakePaths[start] = body;
    // Head faces back along the body, so it points "up" the snake, away from the tail.
    const firstC = { x: a.x + dx/(3*segs) + nx*amp, y: a.y + dy/(3*segs) + ny*amp };
    const headAngle = Math.atan2(a.y - firstC.y, a.x - firstC.x) * 180 / Math.PI;
    const hr = cell * 0.15;
    const head = el('g', { transform:`translate(${a.x} ${a.y}) rotate(${headAngle})` }, g);
    el('path', { d:`M ${hr*0.9} 0 l ${hr*0.75} 0 l ${hr*0.3} ${-hr*0.25} M ${hr*1.65} 0 l ${hr*0.3} ${hr*0.25}`, class:'snake-tongue', 'stroke-width': Math.max(1, cell*0.025) }, head);
    el('ellipse', { cx:0, cy:0, rx:hr*1.15, ry:hr*0.9, fill: col, class:'snake-head' }, head);
    [-1, 1].forEach(sgn => {
      el('circle', { cx:hr*0.35, cy:sgn*hr*0.45, r:hr*0.3, class:'snake-eye' }, head);
      el('circle', { cx:hr*0.45, cy:sgn*hr*0.45, r:hr*0.14, class:'snake-pupil' }, head);
    });
  });
  positionTokens(true);
}

// ---------- tokens and juice ----------

function positionTokens(instant){
  const p = $('playerToken'), r = $('rivalToken');
  if(!p || !r) return;
  const cell = $('sq-1').offsetWidth;
  const ppos = state ? state.pos : 1, rpos = state ? state.rival : 1;
  const same = ppos === rpos;
  place(p, centerOf(ppos), same ? -cell*0.17 : 0, instant);
  place(r, centerOf(rpos), same ? cell*0.17 : 0, instant);
  r.style.display = state ? '' : 'none';
  p.classList.toggle('waiting', !state);
}
function place(el, c, dx, instant){
  if(instant) el.style.transition = 'none';
  el.style.transform = `translate(${c.x + dx}px, ${c.y}px)`;
  if(instant){ void el.offsetWidth; el.style.transition = ''; }
}
function hop(el){
  if(reducedMotion()) return;
  el.classList.remove('hop');
  void el.offsetWidth;
  el.classList.add('hop');
}

// Moves a token along an arbitrary curve (fn: t in 0..1 -> {x,y}).
function tweenToken(el, fn, ms){
  return new Promise(res => {
    if(reducedMotion() || document.hidden){ res(); return; }
    el.style.transition = 'none';
    const t0 = performance.now();
    let done = false;
    const finish = () => {
      if(done) return;
      done = true;
      el.style.transition = '';
      res();
    };
    // rAF pauses in background tabs; this timer makes sure the turn still completes.
    setTimeout(finish, ms + 400);
    const frame = now => {
      if(done) return;
      const t = Math.min(1, (now - t0) / ms);
      const e = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
      const p = fn(e);
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      if(t < 1) requestAnimationFrame(frame);
      else finish();
    };
    requestAnimationFrame(frame);
  });
}

function floatText(n, text, cls){
  if(reducedMotion()) return;
  const c = centerOf(n);
  const f = document.createElement('div');
  f.className = 'floatText ' + (cls || '');
  f.textContent = text;
  f.style.left = c.x + 'px';
  f.style.top = c.y + 'px';
  $('board').appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

function sparkle(n, colors){
  if(reducedMotion()) return;
  const c = centerOf(n);
  const cols = colors || ['#00E100','#FFD400','#FBF9F3','#1565FF'];
  for(let i=0; i<16; i++){
    const s = document.createElement('span');
    s.className = 'spark';
    const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random()*40;
    s.style.left = c.x + 'px';
    s.style.top = c.y + 'px';
    s.style.setProperty('--dx', Math.cos(ang)*dist + 'px');
    s.style.setProperty('--dy', Math.sin(ang)*dist + 'px');
    s.style.background = cols[i % cols.length];
    $('board').appendChild(s);
    setTimeout(() => s.remove(), 800);
  }
}

function shake(){
  if(reducedMotion()) return;
  const f = $('boardFrame');
  f.classList.remove('shake');
  void f.offsetWidth;
  f.classList.add('shake');
}

function triggerStamp(word){
  if(reducedMotion()) return;
  const layer = document.createElement('div');
  layer.className = 'rejectStampLayer';
  layer.innerHTML = `<div class="rejectStamp">${word || 'REJECTED'}</div>`;
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1100);
}

function launchConfetti(){
  if(reducedMotion()) return;
  const colors = ['#00E100','#FF1414','#1565FF','#FFD400','#B44DFF','#FBF9F3'];
  const layer = document.createElement('div');
  layer.className = 'confettiLayer';
  document.body.appendChild(layer);
  for(let i=0; i<120; i++){
    const piece = document.createElement('span');
    piece.className = 'confettiPiece';
    piece.style.left = Math.random()*100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.animationDelay = (Math.random()*0.7) + 's';
    piece.style.animationDuration = (2.2 + Math.random()*1.6) + 's';
    piece.style.setProperty('--drift', (Math.random()*160 - 80) + 'px');
    layer.appendChild(piece);
  }
  setTimeout(() => layer.remove(), 4600);
}

function showEventCard(tag, text, fx, tone){
  const card = $('eventCard');
  if(!card) return;
  clearTimeout(eventCardTimer);
  card.className = 'eventCard ' + (tone || '');
  card.innerHTML = `<div class="ecTag">${tag}</div><div class="ecText">${text}</div>${fx ? `<div class="ecFx">${fx}</div>` : ''}`;
  void card.offsetWidth;
  card.classList.add('show');
  eventCardTimer = setTimeout(hideEventCard, 4200);
}
function hideEventCard(){
  clearTimeout(eventCardTimer);
  const card = $('eventCard');
  if(card) card.classList.remove('show');
}

function toast(html){
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html;
  $('toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 3200);
  setTimeout(() => t.remove(), 3700);
}

// ---------- the 3D die ----------

const DIE_ROT = { 1:[0,0], 2:[-90,0], 3:[0,-90], 4:[0,90], 5:[90,0], 6:[0,180] };
const PIPS = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
let dieTurns = 0;

function buildDie(){
  const die = $('die');
  die.innerHTML = [1,2,3,4,5,6].map(f =>
    `<div class="dface f${f}">${PIPS[f].map(p => `<span class="pip p${p}"></span>`).join('')}</div>`
  ).join('');
}
async function spinDie(face){
  const die = $('die');
  const [rx, ry] = DIE_ROT[face];
  if(reducedMotion()){
    die.style.transition = 'none';
    die.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    return;
  }
  dieTurns += 2;
  const stage = $('dieStage');
  stage.classList.remove('tumble');
  void stage.offsetWidth;
  stage.classList.add('tumble');
  die.style.transition = '';
  die.style.transform = `rotateX(${dieTurns*360 + rx}deg) rotateY(${dieTurns*360 + ry}deg)`;
  await sleep(950);
}

// ---------- UI rendering ----------

function infoFor(n){
  const L = currentLadders(), S = currentSnakes();
  if(n === TOTAL) return { text:"The offer. The job. The thing this entire board is about. Land here to negotiate your salary." };
  if(L[n]) return { text: ladderText(n) + ` <em>Ladder to square ${L[n]}.</em>` };
  if(S[n]) return { text: snakeText(n) + ` <em>Snake down to square ${S[n]}.</em>` };
  if(CHEST_SQUARES.includes(n)) return { text:"Hiring event — land here and draw a random card. Could be good, could be the internal candidate's lucky week." };
  if(CHOICE_SQUARES[n]) return { text: CHOICE_SQUARES[n].prompt + " <em>A decision point — you'll get to choose.</em>" };
  return { text: squareEntry(n, false).text };
}
function ladderText(n){
  return LADDER_TEXT[n] || (state && state.market.ladderText && state.market.ladderText[n]) || "Unexpected progress.";
}
function snakeText(n){
  return SNAKE_TEXT[n] || (state && state.market.snakeText && state.market.snakeText[n]) || "Unexpected setback.";
}
function squareEntry(n, randomise){
  const base = SQUARE_TEXT[n] || { tone:'neutral', text:"Nothing happens. This is, itself, an accurate depiction of job hunting." };
  const roleLine = state && ROLE_FLAVOUR[n] && ROLE_FLAVOUR[n][state.role];
  if(roleLine) return { tone: base.tone, text: roleLine };
  if(randomise && ALT_TEXT[n]) return { tone: base.tone, text: cosmeticPick(ALT_TEXT[n]) };
  return base;
}
function showSquareInfo(n){
  $('squareInfo').innerHTML = `<span class="sqnum">Square ${n}</span>${infoFor(n).text}`;
}

function log(text, cls){
  const el = $('log');
  const entry = document.createElement('div');
  entry.className = 'entry ' + (cls || 'sys');
  if(state && state.turns) {
    const wk = document.createElement('span');
    wk.className = 'wk';
    wk.textContent = 'W' + state.turns;
    entry.appendChild(wk);
  }
  entry.appendChild(document.createTextNode(text));
  el.appendChild(entry);
  el.scrollTop = 0;
  $('liveRegion').textContent = text;
}

function moraleFace(m){
  if(m >= 80) return '😄';
  if(m >= 60) return '🙂';
  if(m >= 40) return '😐';
  if(m >= 20) return '😟';
  return '😫';
}

function updateAll(){
  const s = state;
  $('statRole').textContent = s ? roleLabelFor(s.role) : '–';
  $('statSquare').textContent = s ? s.pos : 1;
  $('statTurns').textContent = s ? s.turns : 0;
  $('statPos').textContent = s ? s.callbacks : 0;
  $('statNeg').textContent = s ? s.rejections : 0;
  const pos = s ? s.pos : 1, riv = s ? s.rival : 1, mor = s ? s.morale : 60;
  $('raceYou').style.width = (pos / TOTAL * 100) + '%';
  $('raceRival').style.width = (riv / TOTAL * 100) + '%';
  $('raceYouNum').textContent = pos;
  $('raceRivalNum').textContent = riv;
  $('raceRival').classList.toggle('danger', riv >= 52);
  $('raceYouLabel').textContent = s ? `${roleById(s.role).icon} You` : 'You';
  $('moraleBar').style.width = mor + '%';
  $('moraleBar').className = 'fill morale ' + (mor >= 60 ? 'high' : mor >= 30 ? 'mid' : 'low');
  $('moraleNum').textContent = mor;
  $('moraleFace').textContent = s && s.skipTurns ? '🫠' : moraleFace(mor);
  const face = $('playerFace');
  if(face) face.textContent = s ? roleById(s.role).icon : '🧑‍💻';
  updateControls();
}

function updateControls(){
  const s = state;
  const canAct = !!s && !s.busy && !s.finished;
  $('rollBtn').disabled = !canAct;
  $('rollBtn').classList.toggle('ready', canAct);
  $('resetBtn').disabled = !!s && s.busy && !s.finished;
  const pw = [['network','powNetwork','cntNetwork','networkBoost'], ['tailor','powTailor','cntTailor','tailorBoost'], ['followUp','powFollowUp','cntFollowUp','skipSnake']];
  pw.forEach(([key, btnId, cntId, flag]) => {
    const count = s ? s.powerups[key] : 1;
    const armed = !!s && s[flag];
    $(cntId).textContent = armed ? 'armed' : '×' + count;
    $(btnId).classList.toggle('armed', armed);
    $(btnId).disabled = !canAct || armed || count <= 0;
  });
  let note = 'Pick a role to begin';
  if(s && s.finished) note = 'Search over. Start a new one?';
  else if(s && s.busy && s.turns) note = s.lastRoll ? `Week ${s.turns}: rolled ${s.lastRoll}` : `Week ${s.turns}…`;
  else if(s && s.skipTurns) note = 'Burnout: next week is a week off';
  else if(s) note = `Week ${s.turns + 1} — your move`;
  $('rollNote').textContent = note;
}

function renderMarketBanner(){
  const b = $('marketBanner');
  if(!state){ b.hidden = true; return; }
  const m = state.market;
  const modeLabel = state.mode === 'daily' ? `📅 Daily challenge #${state.dailyNo}` : '🎲 Free play';
  b.hidden = false;
  b.innerHTML = `<span class="mbMode">${modeLabel}</span><span class="mbMarket">${m.icon} <strong>${m.name}</strong> — ${m.text}</span>`;
}

function renderTrophies(){
  const unlocked = ACHIEVEMENTS.filter(a => store.achievements[a.id]).length;
  $('trophyCount').textContent = `${unlocked}/${ACHIEVEMENTS.length}`;
  const parts = [`Hired ${store.wins} of ${store.played}`];
  if(store.bestWeeks) parts.push(`fastest ${store.bestWeeks} wks`);
  if(store.bestSalary) parts.push(`top offer £${store.bestSalary}k`);
  $('record').textContent = store.played ? parts.join(' · ') : 'No job searches yet. Lucky you.';
  $('badges').innerHTML = ACHIEVEMENTS.map(a => {
    const got = !!store.achievements[a.id];
    return `<span class="badge ${got ? 'got' : ''}" tabindex="0" title="${a.name}: ${a.desc}" aria-label="${a.name}: ${a.desc}${got ? ' (unlocked)' : ' (locked)'}">${a.icon}</span>`;
  }).join('');
}

function unlock(id){
  if(store.achievements[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if(!a) return;
  store.achievements[id] = todayKey();
  saveStore();
  if(state) state.unlockedThisRun.push(id);
  toast(`<span class="tIcon">${a.icon}</span><span><strong>Achievement unlocked</strong><br>${a.name}</span>`);
  renderTrophies();
}

// ---------- modals ----------

function openModal(html, cls){
  const modal = $('modal');
  modal.className = 'modal ' + (cls || '');
  modal.innerHTML = html;
  $('overlay').classList.add('show');
  if(!reducedMotion()){
    modal.classList.remove('pop');
    void modal.offsetWidth;
    modal.classList.add('pop');
  }
  const first = modal.querySelector('[data-autofocus]') || modal.querySelector('button');
  if(first) setTimeout(() => first.focus(), 30);
}
function closeModal(){ $('overlay').classList.remove('show'); }

function showSetup(){
  const key = todayKey();
  const done = store.daily[key];
  let mode = done ? 'free' : 'daily';
  const resume = state && !state.finished;
  const render = () => {
    const roles = ROLES.map(r =>
      `<button class="roleBtn${store.lastRole === r.id ? ' last' : ''}" data-role="${r.id}"><span class="rIcon">${r.icon}</span><span class="rName">${r.label}</span><span class="rSal">offers from £${r.salary}k</span></button>`
    ).join('');
    openModal(`
      <span class="modalTag">Application form 27B/6</span>
      <h2>Start your job hunt</h2>
      <div class="modeRow" role="radiogroup" aria-label="Game mode">
        <button class="modeBtn ${mode === 'daily' ? 'sel' : ''}" data-mode="daily" role="radio" aria-checked="${mode === 'daily'}">
          <strong>📅 Daily challenge #${dailyNumber()}</strong>
          <span>Same market, same dice for everyone today. Compare results.</span>
          ${done ? `<span class="done">Today: ${done.win ? `hired in ${done.weeks} wks, £${done.salary}k` : 'lost to the internal candidate'}</span>` : ''}
        </button>
        <button class="modeBtn ${mode === 'free' ? 'sel' : ''}" data-mode="free" role="radio" aria-checked="${mode === 'free'}">
          <strong>🎲 Free play</strong>
          <span>A random market every time. Play as often as you like.</span>
        </button>
      </div>
      <p class="pickLabel">Applying as:</p>
      <div class="roleGrid">${roles}
        <button class="roleBtn surprise" data-role="?"><span class="rIcon">🎲</span><span class="rName">Surprise me</span><span class="rSal">fate decides</span></button>
      </div>
      ${resume ? '<button id="resumeBtn" class="secondary">Back to my current search</button>' : ''}
    `, 'setup');
    document.querySelectorAll('.modeBtn').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode;
      Sound.tick();
      document.querySelectorAll('.modeBtn').forEach(x => {
        x.classList.toggle('sel', x === b);
        x.setAttribute('aria-checked', x === b);
      });
    }));
    document.querySelectorAll('.roleBtn').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.role === '?' ? cosmeticPick(ROLES).id : b.dataset.role;
      startRun(mode, id);
    }));
    if(resume) $('resumeBtn').addEventListener('click', closeModal);
  };
  render();
}

function startRun(mode, role){
  Sound.init();
  const seed = mode === 'daily' ? hashString('itrg-daily-' + todayKey()) : (Math.random() * 4294967296) >>> 0;
  const marketRng = mulberry32(seed);
  rngs = { dice: mulberry32(seed ^ 0x9e3779b9), rival: mulberry32(seed ^ 0x85ebca6b), events: mulberry32(seed ^ 0xc2b2ae35) };
  const market = MARKETS[Math.floor(marketRng() * MARKETS.length)];
  state = newState(mode, role, market);
  store.lastRole = role;
  saveStore();
  $('log').innerHTML = '';
  hideEventCard();
  buildBoard();
  drawBoardArt();
  buildDie();
  renderMarketBanner();
  updateAll();
  showSquareInfo(1);
  log(`Job hunting as a ${roleLabelFor(role)}. Market conditions: ${market.name}. The waiting begins.`, 'sys');
  showMarketReveal();
}

function showMarketReveal(){
  const m = state.market;
  const rivalMax = m.rivalMax || RIVAL.max;
  Sound.card();
  openModal(`
    <span class="modalTag">This week's market</span>
    <div class="marketIcon">${m.icon}</div>
    <h2>${m.name}</h2>
    <p>${m.text}</p>
    <div class="rivalIntro">
      <span class="rivalBig">👔</span>
      <p><strong>You're up against the internal candidate.</strong> They move ${RIVAL.min}–${rivalMax} squares a week and never meet a snake — because of course they don't. Reach square ${TOTAL} first, negotiate your offer, then hope it survives until your start date.</p>
    </div>
    <button id="goBtn" class="primary" data-autofocus>Start applying</button>
  `, 'flip');
  $('goBtn').addEventListener('click', () => {
    closeModal();
    state.busy = false;
    updateAll();
    $('rollBtn').focus();
  });
}

function showHelp(){
  openModal(`
    <span class="modalTag">How to play</span>
    <h2>Beat the internal candidate to the offer</h2>
    <ul class="helpList">
      <li><span class="sw ladder"></span><strong>Ladders</strong> fast-track you up the board.</li>
      <li><span class="sw snake"></span><strong>Snakes</strong> are rejections. They hurt your square <em>and</em> your morale.</li>
      <li><span class="sw chest"></span><strong>Hiring events</strong> draw a card: moves, morale, extra power-ups, or bad news for your rival.</li>
      <li><span class="sw choice"></span><strong>Decisions</strong> are real choices. Some are 50/50 gambles.</li>
      <li>👔 <strong>The internal candidate</strong> moves every week. If they reach ${TOTAL} first, the role is theirs.</li>
      <li>🙂 <strong>Morale</strong> drops with every knock. Hit zero and you burn out: one week off.</li>
      <li>🏁 <strong>The offer</strong>: on reaching ${TOTAL}, accept or push for more money. Each push is riskier. Push too far and the offer is rescinded.</li>
      <li>🪦 <strong>The start date</strong>: an accepted offer isn't a job until you start. Budgets, reorgs and CEOs can still pull it.</li>
      <li>🧰 <strong>Power-ups</strong>: network (best of two dice), tailor CV (+1), follow up (block a snake). Hiring events can refill them.</li>
      <li>📅 <strong>Daily challenge</strong>: everyone gets the same market and dice. Share your result and compare.</li>
    </ul>
    <p class="keys">Keys: <kbd>Space</kbd> roll · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> power-ups</p>
    <button id="helpClose" class="primary">Got it</button>
  `);
  $('helpClose').addEventListener('click', closeModal);
}

// Shows a decision card and resolves with the chosen option.
function askChoice(card){
  return new Promise(res => {
    const optHtml = (opt, id) => `<button id="${id}" class="choiceBtn">${opt.label}${opt.gamble ? '<span class="gambleTag">🎲 50/50 gamble</span>' : ''}</button>`;
    openModal(`
      <span class="modalTag">Decision point</span>
      <h2 class="prompt">${card.prompt}</h2>
      <div class="choiceRow">${optHtml(card.optionA, 'choiceA')}${optHtml(card.optionB, 'choiceB')}</div>
    `, 'flip');
    $('choiceA').addEventListener('click', () => { closeModal(); res(card.optionA); });
    $('choiceB').addEventListener('click', () => { closeModal(); res(card.optionB); });
  });
}

function negotiationRisk(pushes){
  const risks = NEGOTIATION.risks;
  if(pushes >= risks.length) return null;
  let r = risks[pushes];
  if(state.morale >= 70) r -= 0.05;
  if(state.morale < 30) r += 0.05;
  return clamp(r, 0.05, 0.95);
}

function askNegotiation(offer, base, pushes){
  return new Promise(res => {
    const risk = negotiationRisk(pushes);
    const next = Math.round(base * (1 + NEGOTIATION.raisePct * (pushes + 1)));
    let moraleNote = '';
    if(state.morale >= 70) moraleNote = `Your confidence (morale ${state.morale}) is shaving 5% off the risk.`;
    else if(state.morale < 30) moraleNote = `You sound a bit desperate (morale ${state.morale}). +5% risk.`;
    openModal(`
      <span class="modalTag">Final stage — the offer</span>
      <h2>${pushes === 0 ? "They'd like to make you an offer." : 'They come back with a new number.'}</h2>
      <div class="offerAmount">£${offer}k</div>
      <p class="offerSub">${roleLabelFor(state.role)} · ${pushes === 0 ? 'opening offer' : `pushed ${pushes}×`}</p>
      ${risk !== null ? `<div class="riskMeter" aria-label="Risk of the offer being rescinded: ${Math.round(risk*100)} percent"><div class="riskFill" style="width:${Math.round(risk*100)}%"></div><span>${Math.round(risk*100)}% chance they withdraw the offer</span></div>` : '<p class="offerSub">They will not move any further. Trust us.</p>'}
      ${moraleNote ? `<p class="moraleNote">${moraleNote}</p>` : ''}
      <div class="choiceRow">
        <button id="acceptBtn" class="acceptBtn" data-autofocus>✅ Accept £${offer}k</button>
        ${risk !== null ? `<button id="pushBtn" class="pushBtn">📈 Push for £${next}k</button>` : ''}
      </div>
    `, 'flip offer');
    $('acceptBtn').addEventListener('click', () => res('accept'));
    if(risk !== null) $('pushBtn').addEventListener('click', () => res('push'));
  });
}

// ---------- turn flow ----------

function rollDie(){
  const min = state.market.minRoll || 1;
  return min + Math.floor(rngs.dice() * (7 - min));
}

async function playTurn(){
  if(!state || state.busy || state.finished) return;
  state.busy = true;
  hideEventCard();
  Sound.init();
  state.turns++;
  state.lastRoll = null;
  updateAll();

  if(state.skipTurns > 0){
    state.skipTurns--;
    log("Burnout. You take the week off to recover. Your morale thanks you; the internal candidate does not.", 'twist');
    floatText(state.pos, '💤 week off', 'twist');
    state.history.push('💤');
    await sleep(800);
  } else {
    const steps = await rollAndReport();
    await walkPlayer(steps);
    if(state.pos >= TOTAL){
      const won = await negotiate();
      if(won) return;
    } else {
      await resolveSquare(state.pos);
    }
  }
  updateAll();
  if(state.finished) return;
  await sleep(250);
  await rivalTurn();
  if(state.finished) return;
  state.busy = false;
  updateAll();
}

async function rollAndReport(){
  const r1 = rollDie();
  let final = r1, detail = '';
  if(state.networkBoost){
    const r2 = rollDie();
    final = Math.max(r1, r2);
    state.networkBoost = false;
    detail = `Used your network: rolled ${r1} and ${r2}, going with the ${final}.`;
  }
  Sound.roll();
  await spinDie(final);
  if(detail) log(detail, 'sys');
  let steps = final;
  if(state.tailorBoost){
    steps++;
    state.tailorBoost = false;
    log('Tailored CV kicks in: +1 to that roll.', 'sys');
  }
  state.lastRoll = `${final}${steps !== final ? ' +1' : ''}`;
  updateControls();
  return steps;
}

async function walkPlayer(steps){
  const tok = $('playerToken');
  for(let i=0; i<steps && state.pos < TOTAL; i++){
    state.pos++;
    positionTokens();
    hop(tok);
    Sound.step();
    updateAll();
    await sleep(170);
  }
}

// Shifts the player a few squares forward/back (event cards and decisions).
async function movePlayerBy(delta){
  const target = clamp(state.pos + delta, 2, TOTAL - 1);
  const dir = Math.sign(target - state.pos);
  floatText(state.pos, (delta > 0 ? '+' : '−') + Math.abs(delta), delta > 0 ? 'pos' : 'neg');
  while(state.pos !== target){
    state.pos += dir;
    positionTokens();
    hop($('playerToken'));
    Sound.step();
    updateAll();
    await sleep(150);
  }
}

async function moveRivalBy(delta){
  const target = clamp(state.rival + delta, 1, TOTAL);
  const dir = Math.sign(target - state.rival);
  while(state.rival !== target){
    state.rival += dir;
    positionTokens();
    hop($('rivalToken'));
    Sound.rivalStep();
    updateAll();
    await sleep(110);
  }
}

function changeMorale(delta){
  if(delta < 0) delta = Math.round(delta * (state.market.moraleLoss || 1));
  state.morale = clamp(state.morale + delta, 0, 100);
  if(state.morale <= 0 && !state.skipTurns){
    state.skipTurns = 1;
    state.burnouts++;
    state.morale = 45;
    log("Burnout. Your morale has hit zero. You'll take next week off to recover.", 'neg');
    floatText(state.pos, '🫠 burnout', 'neg');
    Sound.bad();
    unlock('burnout');
  }
  updateAll();
}

function nearMiss(n){
  const L = state.ladders, S = state.snakes;
  if(L[n] || S[n]) return;
  if(L[n+1]) log(`So close — the ladder on square ${n+1} was one square away.`, 'sys');
  if(S[n-1]) log(`Phew — you skipped right past the snake on square ${n-1}.`, 'sys');
}

async function resolveSquare(n){
  showSquareInfo(n);
  nearMiss(n);
  const L = state.ladders, S = state.snakes;
  const tok = $('playerToken');

  if(L[n]){
    const to = L[n];
    log(ladderText(n), 'pos');
    state.callbacks++; state.climbs++;
    Sound.ladder();
    floatText(n, `🪜 +${to - n}`, 'pos');
    await sleep(300);
    const a = centerOf(n), b = centerOf(to);
    await tweenToken(tok, t => ({ x: a.x + (b.x - a.x)*t, y: a.y + (b.y - a.y)*t }), 700);
    state.pos = to;
    positionTokens();
    sparkle(to);
    changeMorale(15);
    log(`Fast-tracked from square ${n} to square ${to}.`, 'sys');
    state.history.push('🟩');
    return;
  }

  if(S[n]){
    if(state.skipSnake){
      state.skipSnake = false;
      log(`${snakeText(n)} You follow up politely, and just this once, it doesn't count.`, 'twist');
      floatText(n, '🛡️ waived', 'twist');
      Sound.good();
      state.history.push('🛡️');
      return;
    }
    const to = S[n];
    log(snakeText(n), 'neg');
    state.rejections++; state.bites++;
    triggerStamp();
    shake();
    Sound.stamp();
    floatText(n, `🐍 −${n - to}`, 'neg');
    await sleep(550);
    Sound.snake();
    const path = snakePaths[n];
    if(path){
      const len = path.getTotalLength();
      await tweenToken(tok, t => path.getPointAtLength(len * t), 1100);
    }
    state.pos = to;
    positionTokens();
    log(`Knocked back from square ${n} to square ${to}.`, 'sys');
    changeMorale(-20);
    state.history.push('🟥');
    if(state.bites >= 5) unlock('thickskin');
    return;
  }

  if(CHEST_SQUARES.includes(n)){
    await drawHiringEvent();
    return;
  }

  if(CHOICE_SQUARES[n]){
    await makeDecision(n);
    return;
  }

  const entry = squareEntry(n, true);
  const cls = entry.tone === 'pos' ? 'pos' : entry.tone === 'neg' ? 'neg' : entry.tone === 'twist' ? 'twist' : 'sys';
  log(entry.text, cls);
  if(entry.tone === 'pos'){ state.callbacks++; changeMorale(8); Sound.good(); state.history.push('🟦'); }
  else if(entry.tone === 'neg'){ state.rejections++; changeMorale(-6); state.history.push('🟧'); }
  else state.history.push('⬜');
}

async function drawHiringEvent(){
  const card = CHEST_DECK[Math.floor(rngs.events() * CHEST_DECK.length)];
  const k = state.market.chestMult || 1;
  const fx = [];
  if(card.delta) fx.push(`${card.delta > 0 ? '+' : '−'}${Math.abs(card.delta*k)} square${Math.abs(card.delta*k) > 1 ? 's' : ''}`);
  if(card.rival) fx.push(`👔 ${card.rival > 0 ? '+' : '−'}${Math.abs(card.rival*k)}`);
  if(card.morale) fx.push(`morale ${card.morale > 0 ? '+' : '−'}${Math.abs(card.morale*k)}`);
  if(card.grant) fx.push('+1 power-up');
  const good = (card.delta || 0) > 0 || (card.rival || 0) < 0 || (card.morale || 0) > 0 || !!card.grant;
  Sound.card();
  showEventCard(k > 1 ? 'Hiring event ×2' : 'Hiring event', card.text, fx.join(' · '), good ? 'good' : 'bad');
  log(`Hiring event: ${card.text}`, good ? 'pos' : 'neg');
  await sleep(1100);
  if(card.delta){
    if(card.delta > 0) state.callbacks++; else state.rejections++;
    await movePlayerBy(card.delta * k);
  }
  if(card.rival){
    floatText(state.rival, `👔 ${card.rival > 0 ? '+' : '−'}${Math.abs(card.rival*k)}`, card.rival > 0 ? 'neg' : 'pos');
    await moveRivalBy(card.rival * k);
  }
  if(card.morale) changeMorale(card.morale * k);
  if(card.grant){
    state.powerups[card.grant] = Math.min(3, state.powerups[card.grant] + 1);
    Sound.good();
  }
  state.history.push('🟨');
  updateAll();
}

async function makeDecision(n){
  const card = CHOICE_SQUARES[n];
  Sound.card();
  const option = await askChoice(card);
  let outcome = option;
  if(option.gamble){
    const won = rngs.events() < option.gamble.chance;
    outcome = won ? option.gamble.win : option.gamble.lose;
    log(won ? '🎲 The gamble pays off.' : '🎲 The gamble backfires.', won ? 'pos' : 'neg');
    if(won) Sound.good(); else Sound.bad();
  }
  const cls = outcome.delta > 0 ? 'pos' : outcome.delta < 0 ? 'neg' : 'twist';
  log(outcome.text, cls);
  showEventCard('Decision', outcome.text, '', outcome.delta >= 0 ? 'good' : 'bad');
  if(outcome.delta){
    if(outcome.delta > 0) state.callbacks++; else state.rejections++;
    await movePlayerBy(outcome.delta);
  }
  if(outcome.morale) changeMorale(outcome.morale);
  state.history.push('🟪');
}

// Push-your-luck salary negotiation on reaching the final square.
async function negotiate(){
  state.pos = TOTAL;
  positionTokens();
  updateAll();
  sparkle(TOTAL, ['#1565FF','#FFD400','#FBF9F3']);
  Sound.good();
  log('You reach the final stage. An offer is on the table.', 'pos');
  await sleep(500);
  const base = roleById(state.role).salary;
  let offer = base, pushes = 0;
  while(true){
    const choice = await askNegotiation(offer, base, pushes);
    if(choice === 'accept'){
      closeModal();
      state.salary = offer;
      state.pushes = pushes;
      if(await offerSurvives()) await winGame();
      else await loseGame();
      return true;
    }
    const risk = negotiationRisk(pushes);
    openModal(`<span class="modalTag">Final stage — the offer</span><h2>Waiting for the budget holder…</h2><div class="thinking"><span></span><span></span><span></span></div>`, 'offer');
    Sound.tick();
    await sleep(1300);
    if(rngs.events() < risk){
      closeModal();
      state.rescinds++;
      state.rejections++;
      unlock('greedy');
      log(cosmeticPick(NEGOTIATION.rescindLines), 'neg');
      Sound.stamp();
      triggerStamp('RESCINDED');
      shake();
      state.history.push('💸');
      await sleep(700);
      const to = NEGOTIATION.rescindTo;
      floatText(TOTAL, `💸 −${TOTAL - to}`, 'neg');
      Sound.snake();
      const a = centerOf(TOTAL), b = centerOf(to);
      await tweenToken($('playerToken'), t => ({ x: a.x + (b.x - a.x)*t, y: a.y + (b.y - a.y)*t - Math.sin(t*Math.PI)*40 }), 900);
      state.pos = to;
      positionTokens();
      log(`Back to square ${to}. The role has been "reopened".`, 'sys');
      changeMorale(-20);
      return false;
    }
    pushes++;
    offer = Math.round(base * (1 + NEGOTIATION.raisePct * pushes));
    log(`${cosmeticPick(NEGOTIATION.pushLines)} New offer: £${offer}k.`, 'pos');
    Sound.cash();
  }
}

// After accepting: the gap between "yes" and day one, where offers go to die.
async function offerSurvives(){
  log(`Offer accepted: £${state.salary}k. Now you just have to make it to your start date.`, 'pos');
  openModal(`<span class="modalTag">Final stage — the start date</span><h2>Waiting for the contract…</h2><p class="offerSub">HR says it's "with legal". Legal says it's "with HR".</p><div class="thinking"><span></span><span></span><span></span></div>`, 'offer');
  Sound.tick();
  await sleep(1800);
  closeModal();
  if(rngs.events() >= OFFER_FATE.chance){
    log(cosmeticPick(OFFER_FATE.survive), 'twist');
    await sleep(400);
    return true;
  }
  const fate = OFFER_FATE.pulled[Math.floor(rngs.events() * OFFER_FATE.pulled.length)];
  state.pulledBy = fate;
  state.rejections++;
  unlock('pulled');
  log(fate.text, 'neg');
  showEventCard('Before your start date', fate.text, '', 'bad');
  return false;
}

async function rivalTurn(){
  const m = state.market;
  let mv = RIVAL.min + Math.floor(rngs.rival() * ((m.rivalMax || RIVAL.max) - RIVAL.min + 1));
  if(m.minRoll) mv = Math.max(mv, m.minRoll);
  const eventRoll = rngs.rival();
  const ev = RIVAL_EVENTS[Math.floor(rngs.rival() * RIVAL_EVENTS.length)];
  if(eventRoll < RIVAL.eventChance){
    mv += ev.delta;
    log(`👔 ${ev.text}`, ev.delta > 0 ? 'neg' : 'pos');
    showEventCard('The internal candidate', ev.text, `👔 ${ev.delta > 0 ? '+' : '−'}${Math.abs(ev.delta)}`, ev.delta > 0 ? 'bad' : 'good');
  }
  const before = state.rival;
  await moveRivalBy(mv);
  if(before < state.pos && state.rival > state.pos) log('👔 The internal candidate overtakes you.', 'neg');
  else if(before > state.pos && state.rival < state.pos) log('You overtake the internal candidate. They look briefly worried.', 'pos');
  if(!state.rivalWarned && state.rival >= 52 && state.rival < TOTAL){
    state.rivalWarned = true;
    log('👔 The internal candidate has reached final interviews. Hurry.', 'neg');
    Sound.bad();
  }
  if(state.rival >= TOTAL) await loseGame();
}

// ---------- endings ----------

function getEndTitle(){
  const { turns, rejections, callbacks, pushes, bites } = state;
  if(pushes >= 3) return "Shark tank survivor. You squeezed every last pound out of them.";
  if(state.burnouts >= 2) return "Burnt out twice and still showed up. Hire this person.";
  if(rejections >= 10) return `Rejected ${rejections} times: Resilience Level Expert.`;
  if(turns <= 12) return "Speedrun hire: HR is still confused how that happened.";
  if(bites === 0) return "Zero snake bites. Are you even applying to real jobs?";
  if(TOTAL - state.rival <= 6) return "Photo finish. The internal candidate is drafting a strongly worded Slack message.";
  if(rejections <= 2) return "Suspiciously lucky. The hiring gods smiled on you.";
  if(turns >= 35) return "The long haul. You earned every square of this board.";
  if(callbacks >= 8) return "Serial interviewer. You could do this in your sleep now.";
  return "You got the job. Somehow.";
}
function getLoseTitle(){
  if(state.pulledBy){
    if(state.pushes) return `You negotiated £${state.salary}k for a job that no longer exists.`;
    if(state.turns <= 14) return "Fastest hire-and-fire in company history. You never even got a laptop.";
    return "So close. You'd already told your current boss.";
  }
  const gap = TOTAL - state.pos;
  if(state.rescinds) return "Greed, then nepotism. A classic double.";
  if(gap <= 6) return `So close. You were ${gap} square${gap === 1 ? '' : 's'} from the offer.`;
  if(state.bites >= 5) return "The snakes had a field day. The internal candidate had a coffee.";
  if(state.burnouts) return "You burnt out; they never even broke a sweat.";
  return "'We've decided to go with someone who already knows where the kettle is.'";
}

function historyGrid(){
  const rows = [];
  for(let i=0; i<state.history.length; i += 8) rows.push(state.history.slice(i, i+8).join(''));
  return rows.join('\n');
}

function shareTextFor(won){
  const role = roleById(state.role);
  const m = state.market;
  const head = state.mode === 'daily' ? `The Modern IT Recruitment Game — Daily #${state.dailyNo}` : 'The Modern IT Recruitment Game';
  const result = won
    ? `${role.icon} ${role.label}: hired in ${state.turns} weeks at £${state.salary}k${state.pushes ? ` (pushed ${state.pushes}×)` : ''}`
    : state.pulledBy
      ? `${role.icon} ${role.label}: accepted £${state.salary}k after ${state.turns} weeks. Then: ${state.pulledBy.stamp.toLowerCase()}.`
      : `${role.icon} ${role.label}: lost to the internal candidate on square ${state.pos} of ${TOTAL}`;
  const tally = `🐍 ${state.bites}  🪜 ${state.climbs}  🫠 ${state.burnouts}${state.rescinds ? `  💸 ${state.rescinds}` : ''}`;
  const url = /^https?:/.test(location.protocol) ? location.origin + location.pathname : '';
  return [head, result, `${m.icon} ${m.name}`, historyGrid(), tally, url ? `Can you beat it? ${url}` : '', '#JobHunting #ITRecruitment']
    .filter(Boolean).join('\n');
}

function recordResult(won){
  store.played++;
  if(won){
    store.wins++;
    if(!store.bestWeeks || state.turns < store.bestWeeks) store.bestWeeks = state.turns;
    if(!store.bestSalary || state.salary > store.bestSalary) store.bestSalary = state.salary;
    if(!store.rolesWon.includes(state.role)) store.rolesWon.push(state.role);
  } else {
    store.losses++;
  }
  if(state.mode === 'daily' && !store.daily[state.dailyKey]){
    store.daily[state.dailyKey] = { win: won, weeks: state.turns, salary: state.salary, role: state.role };
  }
  saveStore();
  if(state.mode === 'daily') unlock('daily');
  renderTrophies();
}

async function winGame(){
  state.finished = true;
  state.busy = false;
  state.history.push('🏆');
  recordResult(true);
  unlock('hired');
  if(state.turns <= 14) unlock('speedrun');
  if(state.pushes >= 3) unlock('shark');
  if(state.powerupsUsed === 0) unlock('purist');
  if(TOTAL - state.rival <= 6) unlock('photo');
  if(ROLES.every(r => store.rolesWon.includes(r.id))) unlock('polymath');
  log(`Day one. You actually start. Onboarding is on Monday. There is no laptop.`, 'pos');
  updateAll();
  Sound.win();
  launchConfetti();
  await sleep(600);
  showEndModal(true);
}

async function loseGame(){
  state.finished = true;
  state.busy = false;
  const pulled = !!state.pulledBy;
  state.history.push(pulled ? '🪦' : '💀');
  recordResult(false);
  if(!pulled){
    unlock('nepotism');
    log("'We've decided to go with an internal candidate.'", 'neg');
  }
  updateAll();
  Sound.lose();
  shake();
  triggerStamp(pulled ? state.pulledBy.stamp : 'POSITION FILLED');
  await sleep(900);
  showEndModal(false);
}

function showEndModal(won){
  const role = roleById(state.role);
  const badges = state.unlockedThisRun.map(id => {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    return `<span class="endBadge">${a.icon} ${a.name}</span>`;
  }).join('');
  const salaryHtml = won ? `<div class="offerAmount">£${state.salary}k</div><p class="offerSub">${role.label}${state.pushes ? ` · pushed ${state.pushes}× for +£${state.salary - role.salary}k` : ' · opening offer accepted'}</p>` : '';
  openModal(`
    <span class="modalTag">${state.mode === 'daily' ? `Daily challenge #${state.dailyNo}` : 'Free play'} · ${state.market.icon} ${state.market.name}</span>
    <h2>${won ? 'You got the job.' : state.pulledBy ? 'The offer has been withdrawn.' : "We've decided to go with an internal candidate."}</h2>
    <div class="stamp ${won ? 'win' : ''}">${won ? 'OFFER ACCEPTED' : state.pulledBy ? state.pulledBy.stamp : 'POSITION FILLED'}</div>
    ${!won && state.pulledBy ? `<p class="pulledReason">${state.pulledBy.text}</p>` : ''}
    ${salaryHtml}
    <p class="endTitle">${won ? getEndTitle() : getLoseTitle()}</p>
    <div class="endStats">
      <div><strong>${state.turns}</strong><span>weeks</span></div>
      <div><strong>${state.rejections}</strong><span>rejections</span></div>
      <div><strong>${state.bites}</strong><span>snake bites</span></div>
      <div><strong>${state.callbacks}</strong><span>callbacks</span></div>
    </div>
    <pre class="historyGrid" aria-label="Your week-by-week journey">${historyGrid()}</pre>
    ${badges ? `<div class="endBadges">${badges}</div>` : ''}
    <button id="shareBtn" class="secondary" data-autofocus>📋 Share my result</button>
    <button id="againBtn" class="primary">${won ? 'Do it all again' : 'Try again'}</button>
  `, 'end');
  const text = shareTextFor(won);
  $('shareBtn').addEventListener('click', () => shareResult(text));
  $('againBtn').addEventListener('click', showSetup);
}

function shareResult(text){
  const btn = $('shareBtn');
  const original = btn.textContent;
  const done = () => { btn.textContent = 'Copied — paste it anywhere!'; setTimeout(() => btn.textContent = original, 2200); };
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch(e){ btn.textContent = 'Copy failed — select and copy manually'; }
    document.body.removeChild(ta);
  };
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
}

// ---------- power-ups ----------

function usePower(key, flag, message){
  if(!state || state.busy || state.finished || state[flag] || state.powerups[key] <= 0) return;
  state.powerups[key]--;
  state.powerupsUsed++;
  state[flag] = true;
  Sound.tick();
  log(message, 'sys');
  updateAll();
}
const useNetwork = () => usePower('network', 'networkBoost', 'Networking activated: your next roll takes the best of two.');
const useTailor = () => usePower('tailor', 'tailorBoost', 'CV tailored: your next roll gets +1.');
const useFollowUp = () => usePower('followUp', 'skipSnake', 'Follow-up ready: the next snake bite will be waived.');

// ---------- wiring ----------

function renderSoundBtn(){
  const b = $('soundBtn');
  b.textContent = store.muted ? '🔇' : '🔊';
  b.setAttribute('aria-label', store.muted ? 'Sound off' : 'Sound on');
}

$('rollBtn').addEventListener('click', playTurn);
$('resetBtn').addEventListener('click', showSetup);
$('powNetwork').addEventListener('click', useNetwork);
$('powTailor').addEventListener('click', useTailor);
$('powFollowUp').addEventListener('click', useFollowUp);
$('helpBtn').addEventListener('click', showHelp);
$('soundBtn').addEventListener('click', () => {
  store.muted = !store.muted;
  saveStore();
  renderSoundBtn();
  if(!store.muted) Sound.good();
});

document.addEventListener('keydown', e => {
  if($('overlay').classList.contains('show')) return;
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if(tag === 'input' || tag === 'textarea') return;
  if((e.key === ' ' || e.key === 'Enter') && tag !== 'button'){
    e.preventDefault();
    playTurn();
  } else if(e.key === '1') useNetwork();
  else if(e.key === '2') useTailor();
  else if(e.key === '3') useFollowUp();
});

buildBoard();
buildDie();
renderSoundBtn();
renderTrophies();
updateAll();
showSquareInfo(1);
requestAnimationFrame(drawBoardArt);
showSetup();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawBoardArt, 120);
});
