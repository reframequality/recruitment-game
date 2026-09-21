let state = {
  pos: 1,
  turns: 0,
  callbacks: 0,
  rejections: 0,
  finished: false,
  role: null,
  powerups: { network: true, tailor: true, followUp: true },
  networkBoost: false,
  tailorBoost: false,
  skipSnake: false
};

function buildBoard(){
  const board = document.getElementById('board');
  board.innerHTML = '';
  for(let r = ROWS-1; r >= 0; r--){
    for(let c = 0; c < COLS; c++){
      const n = squareNumber(r,c);
      const div = document.createElement('div');
      div.className = 'sq';
      div.id = 'sq-' + n;
      if(LADDERS[n]) div.classList.add('ladder');
      if(SNAKES[n]) div.classList.add('snake');
      if(CHEST_SQUARES.includes(n)) div.classList.add('chest');
      if(CHOICE_SQUARES[n]) div.classList.add('choice');
      if(n === TOTAL) div.classList.add('finish');
      const num = document.createElement('span');
      num.className = 'n';
      num.textContent = n;
      div.appendChild(num);
      if(LADDERS[n]){
        const ic = document.createElement('span');
        ic.className = 'icon';
        ic.textContent = '↑';
        div.appendChild(ic);
      }
      if(SNAKES[n]){
        const ic = document.createElement('span');
        ic.className = 'icon';
        ic.textContent = '↓';
        div.appendChild(ic);
      }
      if(CHEST_SQUARES.includes(n)){
        const ic = document.createElement('span');
        ic.className = 'icon';
        ic.textContent = '❓';
        div.appendChild(ic);
      }
      if(CHOICE_SQUARES[n]){
        const ic = document.createElement('span');
        ic.className = 'icon';
        ic.textContent = '⚖️';
        div.appendChild(ic);
      }
      if(n === TOTAL){
        const ic = document.createElement('span');
        ic.className = 'icon';
        ic.textContent = '🏁';
        div.appendChild(ic);
      }
      if(SQUARE_TEXT[n]) div.classList.add('tone-' + SQUARE_TEXT[n].tone);
      div.addEventListener('mouseenter', () => showSquareInfo(n));
      div.addEventListener('click', () => showSquareInfo(n));
      board.appendChild(div);
    }
  }
}

// Draws real snake and ladder artwork across the board as an SVG overlay.
function drawBoardArt(){
  const boardEl = document.getElementById('board');
  const frame = boardEl.parentElement;
  const svgNS = 'http://www.w3.org/2000/svg';
  let svg = document.getElementById('boardArt');
  if(!svg){
    svg = document.createElementNS(svgNS, 'svg');
    svg.id = 'boardArt';
    frame.appendChild(svg);
  }
  const frameRect = frame.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();
  if(boardRect.width === 0 || boardRect.height === 0) return;
  svg.style.left = (boardRect.left - frameRect.left) + 'px';
  svg.style.top = (boardRect.top - frameRect.top) + 'px';
  svg.style.width = boardRect.width + 'px';
  svg.style.height = boardRect.height + 'px';
  svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
  svg.innerHTML = '';

  function centerOf(n){
    const el = document.getElementById('sq-' + n);
    const r = el.getBoundingClientRect();
    return { x: r.left - boardRect.left + r.width/2, y: r.top - boardRect.top + r.height/2 };
  }
  function el(tag, attrs){
    const e = document.createElementNS(svgNS, tag);
    Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  }

  Object.entries(LADDERS).forEach(([start, end]) => {
    const a = centerOf(+start), b = centerOf(+end);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy/len, ny = dx/len; // perpendicular unit vector
    const offset = 7;
    const rail1 = { a:{x:a.x+nx*offset, y:a.y+ny*offset}, b:{x:b.x+nx*offset, y:b.y+ny*offset} };
    const rail2 = { a:{x:a.x-nx*offset, y:a.y-ny*offset}, b:{x:b.x-nx*offset, y:b.y-ny*offset} };
    svg.appendChild(el('line', { x1:rail1.a.x, y1:rail1.a.y, x2:rail1.b.x, y2:rail1.b.y, class:'ladder-rail' }));
    svg.appendChild(el('line', { x1:rail2.a.x, y1:rail2.a.y, x2:rail2.b.x, y2:rail2.b.y, class:'ladder-rail' }));
    const rungs = 6;
    for(let i=1; i<rungs; i++){
      const t = i/rungs;
      const p1 = { x: rail1.a.x + (rail1.b.x-rail1.a.x)*t, y: rail1.a.y + (rail1.b.y-rail1.a.y)*t };
      const p2 = { x: rail2.a.x + (rail2.b.x-rail2.a.x)*t, y: rail2.a.y + (rail2.b.y-rail2.a.y)*t };
      svg.appendChild(el('line', { x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, class:'ladder-rung' }));
    }
  });

  Object.entries(SNAKES).forEach(([start, end]) => {
    const a = centerOf(+start), b = centerOf(+end);
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy/len, ny = dx/len;
    const segments = 5;
    let d = `M ${a.x} ${a.y}`;
    for(let i=1; i<=segments; i++){
      const t = i/segments;
      const wobble = (i % 2 === 0 ? 1 : -1) * len * 0.09;
      const px = a.x + dx*t + nx*wobble;
      const py = a.y + dy*t + ny*wobble;
      const prevT = (i-0.5)/segments;
      const cx = a.x + dx*prevT + nx*wobble*1.3;
      const cy = a.y + dy*prevT + ny*wobble*1.3;
      d += ` Q ${cx} ${cy} ${px} ${py}`;
    }
    svg.appendChild(el('path', { d, class:'snake-body' }));
    svg.appendChild(el('circle', { cx:a.x, cy:a.y, r:9, class:'snake-head' }));
    svg.appendChild(el('circle', { cx:a.x-3, cy:a.y-3, r:1.4, class:'snake-eye' }));
    svg.appendChild(el('circle', { cx:a.x+3, cy:a.y-3, r:1.4, class:'snake-eye' }));
  });
}

function squareEntry(n){
  const base = SQUARE_TEXT[n] || { tone:'neutral', text:"Nothing happens. This is, itself, an accurate depiction of job hunting." };
  const roleLine = state.role && ROLE_FLAVOUR[n] && ROLE_FLAVOUR[n][state.role];
  return roleLine ? { tone: base.tone, text: roleLine } : base;
}

function infoFor(n){
  if(n === TOTAL) return { tone:'pos', text:"The finish line. The job. The thing this entire board is about." };
  if(LADDERS[n]) return { tone:'pos', text: LADDER_TEXT[n] };
  if(SNAKES[n]) return { tone:'neg', text: SNAKE_TEXT[n] };
  if(CHEST_SQUARES.includes(n)) return { tone:'twist', text:"Community Chest — land here and draw a random hiring event." };
  if(CHOICE_SQUARES[n]) return { tone:'twist', text: CHOICE_SQUARES[n].prompt + " A decision point — you'll get to choose." };
  return squareEntry(n);
}

function showSquareInfo(n){
  const info = infoFor(n);
  const el = document.getElementById('squareInfo');
  el.innerHTML = `<span class="sqnum">Square ${n}</span>${info.text}`;
}

function placeToken(){
  document.querySelectorAll('.token').forEach(t => t.remove());
  const sq = document.getElementById('sq-' + state.pos);
  const tok = document.createElement('span');
  tok.className = 'token';
  tok.textContent = '🧑‍💻';
  sq.appendChild(tok);
}

function log(text, cls){
  const el = document.getElementById('log');
  const entry = document.createElement('div');
  entry.className = 'entry ' + (cls || 'sys');
  entry.textContent = text;
  el.appendChild(entry);
  el.scrollTop = 0;
}

function roleLabelFor(id){
  const r = ROLES.find(x => x.id === id);
  return r ? r.label : 'Candidate';
}

function updateStats(){
  document.getElementById('statSquare').textContent = state.pos;
  document.getElementById('statTurns').textContent = state.turns;
  document.getElementById('statPos').textContent = state.callbacks;
  document.getElementById('statNeg').textContent = state.rejections;
  document.getElementById('statRole').textContent = state.role ? roleLabelFor(state.role) : '–';
}

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function reducedMotion(){
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rollDice(){
  if(state.finished || !state.role) return;
  const btn = document.getElementById('rollBtn');
  btn.disabled = true;
  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const roll = 1 + Math.floor(Math.random()*6);
  const usedNetwork = state.networkBoost;
  const secondRoll = usedNetwork ? (1 + Math.floor(Math.random()*6)) : null;
  const finalRoll = usedNetwork ? Math.max(roll, secondRoll) : roll;

  const finish = () => {
    document.getElementById('diceFace').textContent = faces[finalRoll-1];
    let steps = finalRoll;
    if(usedNetwork){
      state.networkBoost = false;
      log(`Used your network: rolled ${roll} and ${secondRoll}, going with the better one.`, 'sys');
    }
    if(state.tailorBoost){
      steps += 1;
      state.tailorBoost = false;
      log('Tailored CV kicks in: +1 to that roll.', 'sys');
    }
    state.turns++;
    stepMove(steps, btn);
  };

  if(reducedMotion()){
    finish();
    return;
  }
  let ticks = 0;
  const spin = setInterval(() => {
    document.getElementById('diceFace').textContent = faces[Math.floor(Math.random()*6)];
    ticks++;
    if(ticks > 8){
      clearInterval(spin);
      finish();
    }
  }, 60);
}

function stepMove(steps, btn){
  if(reducedMotion()){
    state.pos = Math.min(TOTAL, state.pos + steps);
    placeToken();
    updateStats();
    afterMove(btn);
    return;
  }
  let remaining = steps;
  const interval = setInterval(() => {
    if(remaining <= 0 || state.pos >= TOTAL){
      clearInterval(interval);
      afterMove(btn);
      return;
    }
    state.pos++;
    remaining--;
    placeToken();
    updateStats();
  }, 160);
}

function afterMove(btn){
  if(state.pos >= TOTAL){
    state.pos = TOTAL;
    placeToken();
    updateStats();
    finishGame();
    return;
  }

  let n = state.pos;
  showSquareInfo(n);

  if(LADDERS[n]){
    log(LADDER_TEXT[n] || "Unexpected progress.", 'pos');
    state.callbacks++;
    const delay = reducedMotion() ? 0 : 350;
    setTimeout(() => {
      state.pos = LADDERS[n];
      placeToken();
      updateStats();
      log(`Fast-tracked from square ${n} to square ${state.pos}.`, 'sys');
      finalizeTurn(btn);
    }, delay);
    return;
  }

  if(SNAKES[n]){
    if(state.skipSnake){
      state.skipSnake = false;
      log(`${SNAKE_TEXT[n] || "Unexpected setback."} You follow up politely, and just this once, it doesn't count.`, 'twist');
      finalizeTurn(btn);
      return;
    }
    log(SNAKE_TEXT[n] || "Unexpected setback.", 'neg');
    state.rejections++;
    triggerStamp();
    const delay = reducedMotion() ? 0 : 350;
    setTimeout(() => {
      state.pos = SNAKES[n];
      placeToken();
      updateStats();
      log(`Knocked back from square ${n} to square ${state.pos}.`, 'sys');
      finalizeTurn(btn);
    }, delay);
    return;
  }

  if(CHEST_SQUARES.includes(n)){
    const card = pick(CHEST_DECK);
    log(`Community Chest: ${card.text}`, card.delta > 0 ? 'pos' : 'neg');
    const newPos = Math.min(TOTAL-1, Math.max(2, state.pos + card.delta));
    if(card.delta > 0) state.callbacks++; else if(card.delta < 0) state.rejections++;
    const delay = reducedMotion() ? 0 : 350;
    setTimeout(() => {
      state.pos = newPos;
      placeToken();
      updateStats();
      const dir = card.delta > 0 ? 'forward' : 'back';
      const amount = Math.abs(card.delta);
      log(`Moved ${dir} ${amount} square${amount > 1 ? 's' : ''} to square ${state.pos}.`, 'sys');
      finalizeTurn(btn);
    }, delay);
    return;
  }

  if(CHOICE_SQUARES[n]){
    showChoiceCard(n, btn);
    return;
  }

  const entry = squareEntry(n);
  const cls = entry.tone === 'pos' ? 'pos' : entry.tone === 'neg' ? 'neg' : entry.tone === 'twist' ? 'twist' : 'sys';
  log(entry.text, cls);
  if(entry.tone === 'pos') state.callbacks++;
  if(entry.tone === 'neg') state.rejections++;
  updateStats();
  finalizeTurn(btn);
}

function showChoiceCard(n, btn){
  const card = CHOICE_SQUARES[n];
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <span class="modalTag">Decision point</span>
    <h2>${card.prompt}</h2>
    <div class="choiceRow">
      <button id="choiceA">${card.optionA.label}</button>
      <button id="choiceB">${card.optionB.label}</button>
    </div>
  `;
  document.getElementById('overlay').classList.add('show');
  document.getElementById('choiceA').addEventListener('click', () => resolveChoice(card.optionA, btn));
  document.getElementById('choiceB').addEventListener('click', () => resolveChoice(card.optionB, btn));
}

function resolveChoice(option, btn){
  document.getElementById('overlay').classList.remove('show');
  const cls = option.delta > 0 ? 'pos' : option.delta < 0 ? 'neg' : 'twist';
  log(option.text, cls);
  if(option.delta){
    state.pos = Math.min(TOTAL-1, Math.max(2, state.pos + option.delta));
    if(option.delta > 0) state.callbacks++; else state.rejections++;
    placeToken();
  }
  updateStats();
  finalizeTurn(btn);
}

function finalizeTurn(btn){
  btn.disabled = false;
}

function useNetwork(){
  if(!state.powerups.network || state.finished || !state.role) return;
  state.powerups.network = false;
  state.networkBoost = true;
  document.getElementById('powNetwork').disabled = true;
  log('Networking activated: your next roll takes the best of two.', 'sys');
}
function useTailor(){
  if(!state.powerups.tailor || state.finished || !state.role) return;
  state.powerups.tailor = false;
  state.tailorBoost = true;
  document.getElementById('powTailor').disabled = true;
  log('CV tailored: your next roll gets +1.', 'sys');
}
function useFollowUp(){
  if(!state.powerups.followUp || state.finished || !state.role) return;
  state.powerups.followUp = false;
  state.skipSnake = true;
  document.getElementById('powFollowUp').disabled = true;
  log('Follow-up ready: the next snake bite will be waived.', 'sys');
}

function getEndTitle(){
  const { turns, rejections, callbacks } = state;
  if(rejections >= 10) return `Ghosted ${rejections} times: Resilience Level Expert.`;
  if(turns <= 12) return "Speedrun hire: HR is still confused how that happened.";
  if(rejections === 0) return "Zero rejections. Are you even applying to real jobs?";
  if(rejections <= 2) return "Suspiciously lucky. Hiring gods smiled on you.";
  if(turns >= 35) return "The long haul. You earned every square of this board.";
  if(callbacks >= 8) return "Serial interviewer. You could do this in your sleep now.";
  return "You got the job. Somehow.";
}

function launchConfetti(){
  if(reducedMotion()) return;
  const colors = ['#00E100','#FF1414','#1565FF','#D9A62E','#B44DFF','#FBF9F3'];
  const layer = document.createElement('div');
  layer.className = 'confettiLayer';
  document.body.appendChild(layer);
  for(let i=0; i<90; i++){
    const piece = document.createElement('span');
    piece.className = 'confettiPiece';
    piece.style.left = Math.random()*100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random()*colors.length)];
    piece.style.animationDelay = (Math.random()*0.6) + 's';
    piece.style.animationDuration = (2.2 + Math.random()*1.4) + 's';
    piece.style.transform = `rotate(${Math.random()*360}deg)`;
    layer.appendChild(piece);
  }
  setTimeout(() => layer.remove(), 4200);
}

function triggerStamp(){
  if(reducedMotion()) return;
  const layer = document.createElement('div');
  layer.className = 'rejectStampLayer';
  layer.innerHTML = '<div class="rejectStamp">REJECTED</div>';
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1100);
}

function shareResult(text){
  const btn = document.getElementById('shareBtn');
  const original = btn.textContent;
  const done = () => { btn.textContent = 'Copied to clipboard!'; setTimeout(() => btn.textContent = original, 2000); };
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch(e) { btn.textContent = 'Copy failed — select and copy manually'; }
    document.body.removeChild(ta);
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else {
    fallback();
  }
}

function finishGame(){
  state.finished = true;
  document.getElementById('rollBtn').disabled = true;
  launchConfetti();
  const roleLabel = roleLabelFor(state.role);
  const title = getEndTitle();
  const shareText = `I got the job in ${state.turns} rounds — ${state.rejections} rejections and ${state.callbacks} moments of false hope survived, playing as a ${roleLabel}. ${title} Beat 100:1 odds yourself: ${location.href} #JobHunting #ITRecruitment`;
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <h2>You got the job.</h2>
    <div class="stamp win">OFFER ACCEPTED</div>
    <p class="endTitle">${title}</p>
    <p>It took ${state.turns} rounds of applying, ${state.rejections} rejections and ${state.callbacks} moments of false hope, playing as a ${roleLabel}.</p>
    <p style="font-family:Consolas,Menlo,monospace;font-size:0.8rem;color:var(--ink-soft);">You have officially beaten 100:1 odds. Onboarding starts Monday. There is no laptop.</p>
    <button id="shareBtn" class="secondary">📋 Share my result</button>
    <button id="againBtn">Do it all again</button>
  `;
  document.getElementById('againBtn').addEventListener('click', resetGame);
  document.getElementById('shareBtn').addEventListener('click', () => shareResult(shareText));
  document.getElementById('overlay').classList.add('show');
}

function showRolePicker(){
  const modal = document.getElementById('modal');
  const buttons = ROLES.map(r => `<button class="roleBtn" data-role="${r.id}">${r.icon} ${r.label}</button>`).join('');
  modal.innerHTML = `
    <span class="modalTag">Before you start</span>
    <h2>What are you job hunting as?</h2>
    <div class="roleGrid">${buttons}</div>
    <button id="roleSurprise" class="secondary">🎲 Surprise me</button>
  `;
  document.getElementById('overlay').classList.add('show');
  document.querySelectorAll('.roleBtn').forEach(b => b.addEventListener('click', () => pickRole(b.dataset.role)));
  document.getElementById('roleSurprise').addEventListener('click', () => pickRole(pick(ROLES).id));
}

function pickRole(id){
  state.role = id;
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('rollBtn').disabled = false;
  updateStats();
  log(`Job hunting today as a ${roleLabelFor(id)}. The waiting begins.`, 'sys');
}

function resetGame(){
  const role = state.role;
  state = {
    pos:1, turns:0, callbacks:0, rejections:0, finished:false,
    role: role,
    powerups: { network:true, tailor:true, followUp:true },
    networkBoost:false, tailorBoost:false, skipSnake:false
  };
  document.getElementById('log').innerHTML = '';
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('rollBtn').disabled = false;
  document.getElementById('diceFace').textContent = '🎲';
  ['powNetwork','powTailor','powFollowUp'].forEach(id => {
    const b = document.getElementById(id);
    if(b) b.disabled = false;
  });
  buildBoard();
  requestAnimationFrame(drawBoardArt);
  placeToken();
  updateStats();
  log(`New application cycle started, still job hunting as a ${roleLabelFor(role)}. Good luck out there.`, 'sys');
}

document.getElementById('rollBtn').addEventListener('click', rollDice);
document.getElementById('resetBtn').addEventListener('click', resetGame);
document.getElementById('powNetwork').addEventListener('click', useNetwork);
document.getElementById('powTailor').addEventListener('click', useTailor);
document.getElementById('powFollowUp').addEventListener('click', useFollowUp);

buildBoard();
requestAnimationFrame(drawBoardArt);
placeToken();
updateStats();
showSquareInfo(1);
document.getElementById('rollBtn').disabled = true;
showRolePicker();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawBoardArt, 150);
});
