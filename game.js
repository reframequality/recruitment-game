let state = {
  pos: 1,
  turns: 0,
  callbacks: 0,
  rejections: 0,
  finished: false
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

function infoFor(n){
  if(n === TOTAL) return { tone:'pos', text:"The finish line. The job. The thing this entire board is about." };
  if(LADDERS[n]) return { tone:'pos', text: LADDER_TEXT[n] };
  if(SNAKES[n]) return { tone:'neg', text: SNAKE_TEXT[n] };
  return SQUARE_TEXT[n] || { tone:'neutral', text:"Nothing recorded for this square." };
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

function updateStats(){
  document.getElementById('statSquare').textContent = state.pos;
  document.getElementById('statTurns').textContent = state.turns;
  document.getElementById('statPos').textContent = state.callbacks;
  document.getElementById('statNeg').textContent = state.rejections;
}

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function rollDice(){
  if(state.finished) return;
  const btn = document.getElementById('rollBtn');
  btn.disabled = true;
  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const roll = 1 + Math.floor(Math.random()*6);
  let ticks = 0;
  const spin = setInterval(() => {
    document.getElementById('diceFace').textContent = faces[Math.floor(Math.random()*6)];
    ticks++;
    if(ticks > 8){
      clearInterval(spin);
      document.getElementById('diceFace').textContent = faces[roll-1];
      state.turns++;
      stepMove(roll, btn);
    }
  }, 60);
}

function stepMove(steps, btn){
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
    setTimeout(() => {
      state.pos = LADDERS[n];
      placeToken();
      updateStats();
      log(`Fast-tracked from square ${n} to square ${state.pos}.`, 'sys');
      finalizeTurn(btn);
    }, 350);
    return;
  }

  if(SNAKES[n]){
    log(SNAKE_TEXT[n] || "Unexpected setback.", 'neg');
    state.rejections++;
    setTimeout(() => {
      state.pos = SNAKES[n];
      placeToken();
      updateStats();
      log(`Knocked back from square ${n} to square ${state.pos}.`, 'sys');
      finalizeTurn(btn);
    }, 350);
    return;
  }

  const entry = SQUARE_TEXT[n] || { tone:'neutral', text:"Nothing happens. This is, itself, an accurate depiction of job hunting." };
  const cls = entry.tone === 'pos' ? 'pos' : entry.tone === 'neg' ? 'neg' : entry.tone === 'twist' ? 'twist' : 'sys';
  log(entry.text, cls);
  if(entry.tone === 'pos') state.callbacks++;
  if(entry.tone === 'neg') state.rejections++;
  updateStats();
  finalizeTurn(btn);
}

function finalizeTurn(btn){
  btn.disabled = false;
}

function finishGame(){
  state.finished = true;
  document.getElementById('rollBtn').disabled = true;
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <h2>You got the job.</h2>
    <div class="stamp win">OFFER ACCEPTED</div>
    <p>It took ${state.turns} rounds of applying, ${state.rejections} rejections and ${state.callbacks} moments of false hope.</p>
    <p style="font-family:Consolas,Menlo,monospace;font-size:0.8rem;color:var(--ink-soft);">You have officially beaten 100:1 odds. Onboarding starts Monday. There is no laptop.</p>
    <button id="againBtn">Do it all again</button>
  `;
  document.getElementById('againBtn').addEventListener('click', resetGame);
  document.getElementById('overlay').classList.add('show');
}

function resetGame(){
  state = { pos:1, turns:0, callbacks:0, rejections:0, finished:false };
  document.getElementById('log').innerHTML = '';
  document.getElementById('overlay').classList.remove('show');
  document.getElementById('rollBtn').disabled = false;
  document.getElementById('diceFace').textContent = '🎲';
  buildBoard();
  placeToken();
  updateStats();
  log('New application cycle started. Good luck out there.', 'sys');
}

document.getElementById('rollBtn').addEventListener('click', rollDice);
document.getElementById('resetBtn').addEventListener('click', resetGame);

buildBoard();
placeToken();
updateStats();
showSquareInfo(1);
log('Application submitted. The waiting begins.', 'sys');
