/* 운동일지 — 개인 운동 기록 PWA (데이터는 이 기기의 localStorage에만 저장) */
'use strict';

/* ---------- 유틸 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => ymd(new Date());
const ymd = (d) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const fmtSec = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const fmtDate = (s) => { const d = new Date(s + 'T00:00:00'); return `${d.getMonth() + 1}/${d.getDate()} (${WEEK[d.getDay()]})`; };
const e1rm = (w, r) => (w && r ? (r === 1 ? w : w * (1 + r / 30)) : 0); // Epley
const round1 = (n) => Math.round(n * 10) / 10;

/* ---------- 운동 유형 ---------- */
// weight: 무게×횟수 / reps: 횟수 / hold: 버티기(초) / cardio: 시간(분)·거리(km)
const TYPES = {
  weight: { label: '웨이트', fields: [['w', 'kg'], ['r', '회']] },
  reps: { label: '맨몸', fields: [['r', '회']] },
  hold: { label: '홀드', fields: [['s', '초']] },
  cardio: { label: '유산소', fields: [['min', '분'], ['km', 'km']] },
};
const CATS = ['하체', '등', '가슴', '어깨', '팔', '코어', '필라테스', '호흡', '유산소', '기타'];

const SEED_EXERCISES = [
  ['스쿼트', 'weight', '하체'], ['데드리프트', 'weight', '하체'], ['루마니안 데드리프트', 'weight', '하체'],
  ['레그프레스', 'weight', '하체'], ['런지', 'weight', '하체'], ['힙 쓰러스트', 'weight', '하체'],
  ['힌지 드릴', 'reps', '하체', '좌골뼈 천장 방향, 엉덩이 텐션 유지'],
  ['맨몸 스쿼트 드릴', 'reps', '하체', '발 11자·발바닥 셋점, 발목 외회전 텐션'],
  ['랫풀다운', 'weight', '등', '손볼 지지 + 새끼손가락 관절'], ['시티드 로우', 'weight', '등'], ['덤벨 로우', 'weight', '등'],
  ['벤치프레스', 'weight', '가슴', '검지·중지 지지, 전거근 세팅'], ['덤벨 프레스', 'weight', '가슴'], ['푸시업', 'reps', '가슴'],
  ['숄더프레스', 'weight', '어깨'], ['사이드 레터럴 레이즈', 'weight', '어깨'],
  ['바이셉 컬', 'weight', '팔'], ['트라이셉 푸시다운', 'weight', '팔'],
  ['플랭크', 'hold', '코어'], ['네발기기 호버', 'hold', '코어', '무릎 1~2cm 띄워 10초+, 손바닥 전체 접지'],
  ['덤벨 데드버그(5kg)', 'reps', '코어', '덤벨 천장으로 밀며 테이블탑·뒤꿈치 터치'],
  ['대각선 사지 교차', 'reps', '코어'],
  ['하프 롤업', 'reps', '필라테스'], ['풀 롤업', 'reps', '필라테스'], ['롤다운', 'reps', '필라테스', '스쿱 → 척추 하나씩, 머리 마지막'],
  ['호흡 (8~10초 날숨)', 'hold', '호흡', '갈비뼈 3D 확장 들숨 → 8~10초 날숨'],
  ['자전거', 'cardio', '유산소'], ['러닝머신', 'cardio', '유산소'], ['걷기', 'cardio', '유산소'], ['천국의 계단', 'cardio', '유산소'],
];

// 2026-10-27 PT 세션 과제
const SEED_TASKS = [
  '호흡·복압: 코 들숨(갈비뼈 3D 확장) → 입으로 8~10초 날숨 ×3세트, 대화 중 \'배 빵빵\' 유지',
  '골반 인지: 스쿱 / 중립(허리 뒤 손바닥 하나) / 오리 엉덩이 — 누워서·서서·힌지 자세 비교',
  '손목 보호 접지: 네발기기 시 손가락 끝 대신 손바닥 전체·엄지 손등으로 지지, 흉추 밀어올리기',
  '웨이트 그립: 등 운동 = 새끼손가락 관절·외회전 / 가슴 운동 = 검지·중지 + 전거근 세팅',
  '롤업/롤다운: 턱 당기고 정수리 길게, 목 긴장 없이 하복부·흉곽 호흡 연결',
  '스쿼트·힌지: 발 11자 셋점 접지 + 발목 외회전 텐션, 힌지는 좌골뼈 천장·엉덩이 텐션 유지',
];
const PAIN_PARTS = ['손목', '종아리', '허리', '어깨', '무릎'];

/* ---------- 상태 저장 ---------- */
const KEY = 'workoutlog.v1';
let S;
function defaultState() {
  return {
    v: 1,
    exercises: SEED_EXERCISES.map(([name, type, cat, note]) => ({ id: uid(), name, type, cat, note: note || '' })),
    sessions: [],
    body: [],
    tasks: SEED_TASKS.map((text) => ({ id: uid(), text, active: true })),
    taskLog: {},
    condition: [],
    settings: { rest: 90, sound: true },
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    S = raw ? JSON.parse(raw) : defaultState();
  } catch { S = defaultState(); }
  const d = defaultState();
  for (const k of Object.keys(d)) if (S[k] == null) S[k] = d[k];
  save();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('저장 실패: 저장 공간을 확인하세요'); }
}
const exById = (id) => S.exercises.find((e) => e.id === id) || { name: '(삭제된 운동)', type: 'weight', cat: '기타' };

/* ---------- 라우팅 ---------- */
const TITLES = { today: '오늘', history: '기록', progress: '진척', body: '신체측정', pt: 'PT 과제 · 컨디션' };
let tab = 'today';
let workDate = today();
let progressEx = null;
let pickCat = '전체';

function go(t) {
  tab = t;
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
  render();
  window.scrollTo(0, 0);
}
function render() {
  $('#title').textContent = tab === 'today' && workDate !== today() ? fmtDate(workDate) : TITLES[tab];
  $('#topActions').innerHTML = '';
  ({ today: renderToday, history: renderHistory, progress: renderProgress, body: renderBody, pt: renderPT })[tab]();
}

/* ---------- 세션 ---------- */
const sessionOf = (date) => S.sessions.find((s) => s.date === date);
function ensureSession(date) {
  let s = sessionOf(date);
  if (!s) { s = { id: uid(), date, entries: [], note: '' }; S.sessions.push(s); S.sessions.sort((a, b) => a.date.localeCompare(b.date)); }
  return s;
}
function lastEntryBefore(exId, date) {
  for (let i = S.sessions.length - 1; i >= 0; i--) {
    const s = S.sessions[i];
    if (s.date >= date) continue;
    const en = s.entries.find((e) => e.exId === exId && e.sets.some((x) => x.done));
    if (en) return { date: s.date, entry: en };
  }
  return null;
}
function setText(type, x) {
  if (type === 'weight') return `${x.w ?? 0}kg×${x.r ?? 0}`;
  if (type === 'reps') return `${x.r ?? 0}회`;
  if (type === 'hold') return `${x.s ?? 0}초`;
  return `${x.min ?? 0}분${x.km ? ' ' + x.km + 'km' : ''}`;
}
function entryVolume(en) {
  const ex = exById(en.exId);
  if (ex.type !== 'weight') return 0;
  return en.sets.filter((x) => x.done).reduce((a, x) => a + (x.w || 0) * (x.r || 0), 0);
}
function sessionStats(s) {
  const doneSets = s.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
  const vol = s.entries.reduce((a, e) => a + entryVolume(e), 0);
  const cardio = s.entries.reduce((a, e) => exById(e.exId).type === 'cardio' ? a + e.sets.filter((x) => x.done).reduce((b, x) => b + (x.min || 0), 0) : a, 0);
  return { doneSets, vol, cardio };
}

/* ---------- 기록 / PR ---------- */
function metricOf(type, sets) {
  const d = sets.filter((x) => x.done);
  if (!d.length) return null;
  if (type === 'weight') return {
    e1rm: Math.max(...d.map((x) => e1rm(x.w || 0, x.r || 0))),
    maxW: Math.max(...d.map((x) => x.w || 0)),
    vol: d.reduce((a, x) => a + (x.w || 0) * (x.r || 0), 0),
  };
  if (type === 'reps') return { maxR: Math.max(...d.map((x) => x.r || 0)), total: d.reduce((a, x) => a + (x.r || 0), 0) };
  if (type === 'hold') return { maxS: Math.max(...d.map((x) => x.s || 0)), total: d.reduce((a, x) => a + (x.s || 0), 0) };
  return { min: d.reduce((a, x) => a + (x.min || 0), 0), km: d.reduce((a, x) => a + (x.km || 0), 0) };
}
const MAIN_METRIC = { weight: ['e1rm', '추정 1RM', 'kg'], reps: ['maxR', '최다 횟수', '회'], hold: ['maxS', '최장 버티기', '초'], cardio: ['min', '운동 시간', '분'] };
function history(exId) {
  const ex = exById(exId);
  const out = [];
  for (const s of S.sessions) for (const en of s.entries) if (en.exId === exId) {
    const m = metricOf(ex.type, en.sets);
    if (m) out.push({ date: s.date, m, sets: en.sets.filter((x) => x.done) });
  }
  return out;
}
function bestBefore(exId, date) {
  const ex = exById(exId); const k = MAIN_METRIC[ex.type][0];
  return history(exId).filter((h) => h.date < date).reduce((a, h) => Math.max(a, h.m[k] || 0), 0);
}

/* ---------- 오늘 ---------- */
function renderToday() {
  const s = sessionOf(workDate);
  $('#topActions').innerHTML = `<input type="date" id="workDate" value="${workDate}" style="width:150px;min-height:36px;padding:4px 8px">`;
  $('#workDate').onchange = (e) => { workDate = e.target.value || today(); render(); };

  let h = '';
  if (s && s.entries.length) {
    const st = sessionStats(s);
    h += `<div class="summary">
      <div class="stat"><b>${s.entries.length}</b><span>운동</span></div>
      <div class="stat"><b>${st.doneSets}</b><span>완료 세트</span></div>
      <div class="stat"><b>${st.vol ? Math.round(st.vol).toLocaleString() : st.cardio || 0}</b><span>${st.vol ? '볼륨(kg)' : '유산소(분)'}</span></div>
    </div>`;
    s.entries.forEach((en, i) => { h += entryCard(s, en, i); });
    h += `<label class="field"><span>오늘 메모 (컨디션, 트레이너 피드백 등)</span>
      <textarea data-act="sess-note">${esc(s.note)}</textarea></label>`;
  } else {
    h += `<div class="empty">${workDate === today() ? '오늘' : fmtDate(workDate)} 기록이 없습니다.<br>아래에서 운동을 추가하세요.</div>`;
    const rec = recentExercises(6);
    if (rec.length) h += `<div class="card"><h3>최근 한 운동</h3><div class="row wrap">${rec.map((e) => `<button class="chip" data-act="add-ex" data-id="${e.id}">${esc(e.name)}</button>`).join('')}</div></div>`;
  }
  h += `<button class="btn primary block" data-act="open-picker">＋ 운동 추가</button>`;
  $('#view').innerHTML = h;
}
function recentExercises(n) {
  const seen = new Set(); const out = [];
  for (let i = S.sessions.length - 1; i >= 0 && out.length < n; i--) for (const en of S.sessions[i].entries) {
    if (!seen.has(en.exId) && S.exercises.some((e) => e.id === en.exId)) { seen.add(en.exId); out.push(exById(en.exId)); }
  }
  return out.slice(0, n);
}
function entryCard(s, en, i) {
  const ex = exById(en.exId); const T = TYPES[ex.type];
  const prev = lastEntryBefore(en.exId, s.date);
  const m = metricOf(ex.type, en.sets); const k = MAIN_METRIC[ex.type][0];
  const isPR = m && m[k] > 0 && m[k] > bestBefore(en.exId, s.date) && history(en.exId).some((h) => h.date < s.date);
  let h = `<div class="card" data-entry="${i}">
    <div class="ex-head"><div class="grow">
      <div class="ex-name">${esc(ex.name)} ${isPR ? '<span class="tag pr">🏆 PR</span>' : ''}</div>
      <div class="muted">${T.label}${ex.note ? ' · ' + esc(ex.note) : ''}</div>
    </div>
    <button class="icon-btn" data-act="entry-menu" data-i="${i}" aria-label="메뉴">⋯</button></div>
    <div class="sets">`;
  en.sets.forEach((x, j) => {
    const one = T.fields.length === 1;
    h += `<div class="set ${one ? 'one' : ''} ${x.done ? 'done' : ''}">
      <div class="no">${j + 1}</div>
      ${T.fields.map(([f, u]) => `<div class="unit" data-u="${u}"><input type="number" inputmode="decimal" step="any" min="0" value="${x[f] ?? ''}" data-act="set-input" data-i="${i}" data-j="${j}" data-f="${f}"></div>`).join('')}
      <button class="chk" data-act="${ex.type === 'hold' && !x.done ? 'hold-start' : 'set-done'}" data-i="${i}" data-j="${j}" aria-label="완료">${x.done ? '✓' : ex.type === 'hold' ? '▶' : '○'}</button>
    </div>`;
  });
  h += `</div>
    ${prev ? `<div class="prev">지난번 ${fmtDate(prev.date)}: ${prev.entry.sets.filter((x) => x.done).map((x) => setText(ex.type, x)).join(', ')}</div>` : ''}
    <div class="row" style="margin-top:8px">
      <button class="btn sm grow" data-act="add-set" data-i="${i}">＋ 세트</button>
      <button class="btn sm" data-act="del-set" data-i="${i}">− 세트</button>
    </div></div>`;
  return h;
}
function addExercise(exId) {
  const s = ensureSession(workDate);
  const ex = exById(exId);
  const prev = lastEntryBefore(exId, workDate);
  let sets;
  if (prev) sets = prev.entry.sets.filter((x) => x.done).map((x) => ({ ...x, done: false }));
  if (!sets || !sets.length) {
    const base = { weight: { w: 20, r: 10 }, reps: { r: 10 }, hold: { s: ex.cat === '호흡' ? 10 : 30 }, cardio: { min: 20 } }[ex.type];
    sets = Array.from({ length: ex.type === 'cardio' ? 1 : 3 }, () => ({ ...base, done: false }));
  }
  s.entries.push({ exId, sets });
  save(); closeModal(); render();
  setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
}

/* ---------- 운동 선택 모달 ---------- */
function openPicker() {
  const draw = (q = '') => {
    const cats = ['전체', ...CATS.filter((c) => S.exercises.some((e) => e.cat === c))];
    const list = S.exercises.filter((e) => (pickCat === '전체' || e.cat === pickCat) && e.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => CATS.indexOf(a.cat) - CATS.indexOf(b.cat) || a.name.localeCompare(b.name, 'ko'));
    $('#pickList').innerHTML = list.length ? list.map((e) => `<button class="pick" data-act="add-ex" data-id="${e.id}"><span>${esc(e.name)}</span><span class="tag">${e.cat} · ${TYPES[e.type].label}</span></button>`).join('')
      : `<div class="empty">검색 결과 없음</div>`;
    $('#pickCats').innerHTML = cats.map((c) => `<button class="chip ${c === pickCat ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
  };
  openModal(`<div class="row between"><h2 style="margin:0">운동 선택</h2><button class="icon-btn" data-act="close">✕</button></div>
    <input type="search" id="pickQ" placeholder="검색" style="margin:10px 0">
    <div class="chips" id="pickCats"></div>
    <div id="pickList"></div>
    <div class="sep"></div>
    <button class="btn block" data-act="new-ex">＋ 새 운동 만들기</button>`);
  draw();
  $('#pickQ').oninput = (e) => draw(e.target.value);
  $('#pickCats').onclick = (e) => { const c = e.target.dataset.cat; if (c) { pickCat = c; draw($('#pickQ').value); } };
}
function openExEditor(ex, addToSession = true) {
  const isNew = !ex;
  ex = ex || { name: '', type: 'weight', cat: '하체', note: '' };
  openModal(`<h2>${isNew ? '새 운동' : '운동 수정'}</h2>
    <label class="field"><span>이름</span><input type="text" id="exName" value="${esc(ex.name)}"></label>
    <div class="grid2">
      <label class="field"><span>유형</span><select id="exType">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}" ${k === ex.type ? 'selected' : ''}>${t.label}</option>`).join('')}</select></label>
      <label class="field"><span>부위</span><select id="exCat">${CATS.map((c) => `<option ${c === ex.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
    </div>
    <label class="field"><span>메모 / 자세 큐</span><input type="text" id="exNote" value="${esc(ex.note)}"></label>
    <div class="row"><button class="btn grow" data-act="close">취소</button><button class="btn primary grow" id="exSave">저장</button></div>`);
  $('#exSave').onclick = () => {
    const name = $('#exName').value.trim(); if (!name) return toast('이름을 입력하세요');
    const data = { name, type: $('#exType').value, cat: $('#exCat').value, note: $('#exNote').value.trim() };
    if (isNew) { const n = { id: uid(), ...data }; S.exercises.push(n); save(); addToSession ? addExercise(n.id) : manageExercises(); }
    else { Object.assign(ex, data); save(); closeModal(); render(); }
  };
}
function entryMenu(i) {
  const s = sessionOf(workDate); const en = s.entries[i]; const ex = exById(en.exId);
  openModal(`<h2>${esc(ex.name)}</h2>
    <button class="btn block" data-act="move" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>↑ 위로</button><div style="height:8px"></div>
    <button class="btn block" data-act="move" data-i="${i}" data-d="1" ${i === s.entries.length - 1 ? 'disabled' : ''}>↓ 아래로</button><div style="height:8px"></div>
    <button class="btn block" data-act="see-progress" data-id="${ex.id}">📈 진척 보기</button><div style="height:8px"></div>
    <button class="btn block" data-act="edit-ex" data-id="${ex.id}">✏️ 운동 정보 수정</button><div style="height:8px"></div>
    <button class="btn block danger" data-act="del-entry" data-i="${i}">🗑 오늘 기록에서 삭제</button><div style="height:8px"></div>
    <button class="btn block" data-act="close">닫기</button>`);
}

/* ---------- 타이머 ---------- */
let timer = null;
function startTimer(sec, label, mode, onDone) {
  stopTimer(true);
  timer = { end: Date.now() + sec * 1000, label, mode, onDone, iv: null };
  const el = $('#timer');
  el.className = `timer ${mode === 'hold' ? 'hold' : ''}`; document.body.classList.add('timer-on');
  $('#timerLabel').textContent = label;
  const tick = () => {
    const left = Math.max(0, (timer.end - Date.now()) / 1000);
    $('#timerTime').textContent = fmtSec(Math.ceil(left));
    if (left <= 0) {
      clearInterval(timer.iv); beep(); try { navigator.vibrate?.([200, 100, 200]); } catch {}
      const cb = timer.onDone; el.classList.add('done'); $('#timerLabel').textContent = mode === 'hold' ? '완료!' : '휴식 끝';
      timer.onDone = null; cb && cb();
      setTimeout(() => { if (timer && Date.now() - timer.end > 2500) stopTimer(); }, 3000);
    }
  };
  tick(); timer.iv = setInterval(tick, 250);
}
function stopTimer(silent) {
  if (!timer) return; clearInterval(timer.iv);
  const cb = timer.onDone; timer = null; $('#timer').classList.add('hidden'); document.body.classList.remove('timer-on');
  if (!silent && cb) cb();
}
let actx;
function beep() {
  if (!S.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = actx.createOscillator(); const g = actx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.25, actx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + t + 0.2);
      o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.2);
    });
  } catch {}
}

/* ---------- 기록 탭 ---------- */
function renderHistory() {
  const list = S.sessions.filter((s) => s.entries.length).slice().reverse();
  const weeks = [0, 1, 2, 3].map((w) => {
    const from = addDays(today(), -7 * (w + 1) + 1), to = addDays(today(), -7 * w);
    return list.filter((s) => s.date >= from && s.date <= to).length;
  });
  let h = `<div class="summary">
    <div class="stat"><b>${weeks[0]}</b><span>최근 7일</span></div>
    <div class="stat"><b>${weeks.reduce((a, b) => a + b, 0)}</b><span>최근 4주</span></div>
    <div class="stat"><b>${list.length}</b><span>전체 운동일</span></div></div>`;
  if (!list.length) h += `<div class="empty">아직 기록이 없습니다.</div>`;
  for (const s of list) {
    const st = sessionStats(s);
    h += `<div class="card"><div class="row between"><b>${fmtDate(s.date)}</b>
      <div class="row"><button class="btn sm" data-act="open-day" data-date="${s.date}">열기</button></div></div>
      <div class="muted">${st.doneSets}세트${st.vol ? ' · ' + Math.round(st.vol).toLocaleString() + 'kg' : ''}${st.cardio ? ' · 유산소 ' + st.cardio + '분' : ''}</div>
      <div style="margin-top:6px">${s.entries.map((en) => {
        const ex = exById(en.exId); const d = en.sets.filter((x) => x.done);
        return `<div class="small">• ${esc(ex.name)} <span class="muted">${d.map((x) => setText(ex.type, x)).join(', ') || '미완료'}</span></div>`;
      }).join('')}</div>
      ${s.note ? `<div class="muted" style="margin-top:6px">📝 ${esc(s.note)}</div>` : ''}</div>`;
  }
  h += settingsCard();
  $('#view').innerHTML = h;
}
function settingsCard() {
  return `<div class="card"><h3>설정 · 백업</h3>
    <label class="field"><span>기본 휴식 시간 (초)</span><input type="number" inputmode="numeric" id="restSec" value="${S.settings.rest}"></label>
    <label class="row small" style="margin-bottom:10px"><input type="checkbox" id="soundOn" ${S.settings.sound ? 'checked' : ''}> 타이머 종료 알림음</label>
    <div class="row wrap">
      <button class="btn sm" data-act="export">⬇ 백업 내보내기</button>
      <button class="btn sm" data-act="import">⬆ 백업 불러오기</button>
      <button class="btn sm" data-act="csv">CSV 내보내기</button>
      <button class="btn sm" data-act="manage-ex">운동 목록 관리</button>
    </div>
    <p class="muted">데이터는 이 기기 브라우저에만 저장됩니다. 주기적으로 백업 파일을 내보내 구글 드라이브 등에 보관하세요.</p>
  </div>`;
}

/* ---------- 진척 탭 ---------- */
function renderProgress() {
  const used = S.exercises.filter((e) => history(e.id).length);
  if (!used.length) { $('#view').innerHTML = `<div class="empty">운동을 완료하면 그래프와 최고기록이 여기에 표시됩니다.</div>`; return; }
  if (!progressEx || !used.some((e) => e.id === progressEx)) progressEx = used[0].id;
  const ex = exById(progressEx); const hs = history(ex.id); const [k, label, unit] = MAIN_METRIC[ex.type];
  let h = `<select id="pSel" style="margin-bottom:12px">${used.map((e) => `<option value="${e.id}" ${e.id === ex.id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>`;
  const best = (key) => hs.reduce((a, x) => Math.max(a, x.m[key] || 0), 0);
  h += `<div class="summary">`;
  if (ex.type === 'weight') h += stat(round1(best('e1rm')), '추정 1RM kg') + stat(best('maxW'), '최고 무게 kg') + stat(Math.round(best('vol')).toLocaleString(), '최대 볼륨 kg');
  else if (ex.type === 'reps') h += stat(best('maxR'), '최다 횟수') + stat(best('total'), '세션 총 횟수') + stat(hs.length, '운동일');
  else if (ex.type === 'hold') h += stat(best('maxS'), '최장(초)') + stat(best('total'), '세션 총(초)') + stat(hs.length, '운동일');
  else h += stat(best('min'), '최장(분)') + stat(round1(best('km')), '최장(km)') + stat(Math.round(hs.reduce((a, x) => a + x.m.min, 0)), '누적(분)');
  h += `</div>`;
  h += `<div class="card"><h3>${label} 추이</h3><canvas class="chart" id="pChart"></canvas></div>`;
  if (ex.type === 'weight') h += `<div class="card"><h3>볼륨 추이 (kg)</h3><canvas class="chart" id="pChart2"></canvas></div>`;
  h += `<div class="card"><h3>세션별 기록</h3>${hs.slice().reverse().slice(0, 30).map((x) =>
    `<div class="list-item"><div class="row between"><b class="small">${fmtDate(x.date)}</b><span class="small">${round1(x.m[k])}${unit}</span></div>
     <div class="muted">${x.sets.map((s) => setText(ex.type, s)).join(', ')}</div></div>`).join('')}</div>`;
  $('#view').innerHTML = h;
  $('#pSel').onchange = (e) => { progressEx = e.target.value; render(); };
  lineChart($('#pChart'), hs.map((x) => ({ x: x.date, y: x.m[k] })), unit);
  if (ex.type === 'weight') lineChart($('#pChart2'), hs.map((x) => ({ x: x.date, y: x.m.vol })), 'kg', '#60a5fa');
}
const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;

function lineChart(cv, pts, unit = '', color = '#4ade80') {
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1; const W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
  if (!pts.length) return;
  const pad = { l: 40, r: 12, t: 12, b: 24 };
  const ys = pts.map((p) => p.y); let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 1; hi += 1; } const span = hi - lo; lo -= span * 0.1; hi += span * 0.1;
  const X = (i) => pad.l + (pts.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (pts.length - 1));
  const Y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  c.font = '11px sans-serif'; c.fillStyle = '#8a92a3'; c.strokeStyle = '#2b303b'; c.lineWidth = 1;
  for (let g = 0; g <= 3; g++) {
    const v = lo + ((hi - lo) * g) / 3; const y = Y(v);
    c.beginPath(); c.moveTo(pad.l, y); c.lineTo(W - pad.r, y); c.stroke();
    c.textAlign = 'right'; c.fillText(Math.round(v * 10) / 10, pad.l - 6, y + 4);
  }
  c.textAlign = 'center';
  const step = Math.max(1, Math.ceil(pts.length / 5));
  pts.forEach((p, i) => { if (i % step === 0 || i === pts.length - 1) c.fillText(p.x.slice(5).replace('-', '/'), X(i), H - 6); });
  c.strokeStyle = color; c.lineWidth = 2.5; c.lineJoin = 'round'; c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(X(i), Y(p.y)) : c.moveTo(X(i), Y(p.y)))); c.stroke();
  c.fillStyle = color; pts.forEach((p, i) => { c.beginPath(); c.arc(X(i), Y(p.y), 3.5, 0, Math.PI * 2); c.fill(); });
}

/* ---------- 신체측정 ---------- */
const BODY_FIELDS = [['weight', '체중', 'kg'], ['muscle', '골격근량', 'kg'], ['fat', '체지방률', '%'], ['waist', '허리둘레', 'cm']];
let bodyMetric = 'weight';
function renderBody() {
  const last = S.body[S.body.length - 1] || {};
  let h = `<div class="card"><h3>측정 입력</h3>
    <label class="field"><span>날짜</span><input type="date" id="bDate" value="${today()}"></label>
    <div class="grid2">${BODY_FIELDS.map(([k, l, u]) => `<label class="field"><span>${l} (${u})</span><input type="number" inputmode="decimal" step="any" id="b_${k}" placeholder="${last[k] ?? ''}"></label>`).join('')}</div>
    <label class="field"><span>메모</span><input type="text" id="bNote" placeholder="예: 인바디, 공복"></label>
    <button class="btn primary block" data-act="body-save">저장</button></div>`;
  if (S.body.length) {
    h += `<div class="chips">${BODY_FIELDS.map(([k, l]) => `<button class="chip ${k === bodyMetric ? 'on' : ''}" data-act="body-metric" data-k="${k}">${l}</button>`).join('')}</div>
      <div class="card"><canvas class="chart" id="bChart"></canvas></div>
      <div class="card"><h3>측정 기록</h3>${S.body.slice().reverse().map((b) => `<div class="list-item row between">
        <div><b class="small">${fmtDate(b.date)}</b><div class="muted">${BODY_FIELDS.filter(([k]) => b[k] != null).map(([k, l, u]) => `${l} ${b[k]}${u}`).join(' · ')}${b.note ? ' · ' + esc(b.note) : ''}</div></div>
        <button class="icon-btn" data-act="body-del" data-id="${b.id}">🗑</button></div>`).join('')}</div>`;
  } else h += `<div class="empty">PT 신체 측정 결과(인바디 등)를 기록해 두면 변화를 그래프로 볼 수 있어요.</div>`;
  $('#view').innerHTML = h;
  const u = BODY_FIELDS.find((f) => f[0] === bodyMetric)[2];
  lineChart($('#bChart'), S.body.filter((b) => b[bodyMetric] != null).map((b) => ({ x: b.date, y: b[bodyMetric] })), u, '#f59e0b');
}

/* ---------- PT 과제 · 컨디션 ---------- */
let ptDate = today();
function renderPT() {
  const active = S.tasks.filter((t) => t.active);
  const doneIds = new Set(S.taskLog[ptDate] || []);
  const cond = S.condition.find((c) => c.date === ptDate) || { pain: {}, energy: 5, note: '' };
  $('#topActions').innerHTML = `<input type="date" id="ptDate" value="${ptDate}" style="width:150px;min-height:36px;padding:4px 8px">`;
  $('#ptDate').onchange = (e) => { ptDate = e.target.value || today(); render(); };

  // 최근 14일 과제 달성률
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const heat = days.map((d) => {
    const n = (S.taskLog[d] || []).filter((id) => active.some((t) => t.id === id)).length;
    const r = active.length ? n / active.length : 0;
    return `<div title="${d} ${n}/${active.length}" style="background:${r ? `rgba(74,222,128,${0.25 + r * 0.75})` : ''}"></div>`;
  }).join('');

  let h = `<div class="card"><div class="row between"><h3 style="margin:0">과제 체크 <span class="muted">${doneIds.size && active.length ? [...doneIds].filter((id) => active.some((t) => t.id === id)).length : 0}/${active.length}</span></h3>
      <button class="btn sm" data-act="task-manage">편집</button></div>
    ${active.map((t) => `<label class="task ${doneIds.has(t.id) ? 'done' : ''}"><input type="checkbox" data-act="task-toggle" data-id="${t.id}" ${doneIds.has(t.id) ? 'checked' : ''}><span class="ttext">${esc(t.text)}</span></label>`).join('') || '<div class="muted">과제가 없습니다.</div>'}
    <div class="muted" style="margin-top:8px">최근 14일</div><div class="heat">${heat}</div></div>`;

  h += `<div class="card"><h3>컨디션 · 통증</h3>
    ${PAIN_PARTS.map((p) => `<div class="range-row"><span class="small">${p}</span><input type="range" min="0" max="10" value="${cond.pain[p] || 0}" data-act="pain" data-p="${p}"><b class="small" id="pv_${p}">${cond.pain[p] || 0}</b></div>`).join('')}
    <div class="range-row"><span class="small">컨디션</span><input type="range" min="1" max="10" value="${cond.energy}" data-act="energy" style="accent-color:var(--accent)"><b class="small" id="pv_energy">${cond.energy}</b></div>
    <p class="muted" style="margin:0 0 8px">통증 0 = 없음, 10 = 심함 · 컨디션 10 = 최상</p>
    <label class="field"><span>메모 (수면, 금주, 트레이너 코멘트 등)</span><textarea id="condNote">${esc(cond.note)}</textarea></label>
    <button class="btn primary block" data-act="cond-save">컨디션 저장</button></div>`;

  const recent = S.condition.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  if (recent.length) h += `<div class="card"><h3>최근 컨디션</h3>${recent.map((c) => {
    const pains = PAIN_PARTS.filter((p) => c.pain[p]).map((p) => `${p} ${c.pain[p]}`).join(' · ');
    return `<div class="list-item"><div class="row between"><b class="small">${fmtDate(c.date)}</b><span class="small">컨디션 ${c.energy}</span></div>
      <div class="muted">${pains || '통증 없음'}${c.note ? ' — ' + esc(c.note) : ''}</div></div>`;
  }).join('')}</div>`;
  $('#view').innerHTML = h;
}
function readCond() {
  const pain = {};
  document.querySelectorAll('[data-act=pain]').forEach((r) => { const v = +r.value; if (v) pain[r.dataset.p] = v; });
  return { date: ptDate, pain, energy: +$('[data-act=energy]').value, note: $('#condNote').value.trim() };
}
function manageTasks() {
  const draw = () => {
    $('#tList').innerHTML = S.tasks.map((t) => `<div class="task"><input type="checkbox" data-tid="${t.id}" ${t.active ? 'checked' : ''} title="사용">
      <span class="ttext grow small">${esc(t.text)}</span><button class="icon-btn" data-tdel="${t.id}">🗑</button></div>`).join('');
  };
  openModal(`<div class="row between"><h2 style="margin:0">과제 편집</h2><button class="icon-btn" data-act="close">✕</button></div>
    <p class="muted">체크 해제 = 숨김(기록 유지). 트레이너가 새 과제를 주면 추가하세요.</p>
    <div id="tList"></div>
    <div class="row" style="margin-top:10px"><input type="text" id="tNew" placeholder="새 과제"><button class="btn primary" id="tAdd">추가</button></div>`);
  draw();
  $('#tList').onclick = (e) => {
    const d = e.target.dataset.tdel;
    if (d && confirm('삭제할까요?')) { S.tasks = S.tasks.filter((t) => t.id !== d); save(); draw(); }
  };
  $('#tList').onchange = (e) => { const t = S.tasks.find((x) => x.id === e.target.dataset.tid); if (t) { t.active = e.target.checked; save(); } };
  $('#tAdd').onclick = () => { const v = $('#tNew').value.trim(); if (v) { S.tasks.push({ id: uid(), text: v, active: true }); save(); $('#tNew').value = ''; draw(); } };
}
function manageExercises() {
  openModal(`<div class="row between"><h2 style="margin:0">운동 목록</h2><button class="icon-btn" data-act="close">✕</button></div>
    ${CATS.map((c) => {
      const l = S.exercises.filter((e) => e.cat === c); if (!l.length) return '';
      return `<h3 style="margin:14px 0 4px">${c}</h3>${l.map((e) => `<div class="row between list-item"><span class="small">${esc(e.name)} <span class="muted">${TYPES[e.type].label}</span></span>
        <span><button class="icon-btn" data-act="edit-ex" data-id="${e.id}">✏️</button><button class="icon-btn" data-act="del-ex" data-id="${e.id}">🗑</button></span></div>`).join('')}`;
    }).join('')}
    <div class="sep"></div><button class="btn block" data-act="new-ex-only">＋ 새 운동</button>`);
}

/* ---------- 모달 / 토스트 ---------- */
function openModal(html) { $('#modalBody').innerHTML = html; const m = $('#modal'); if (!m.open) m.showModal(); }
function closeModal() { const m = $('#modal'); if (m.open) m.close(); }
function toast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);background:#20242d;border:1px solid #2b303b;padding:10px 16px;border-radius:12px;z-index:99;font-size:14px';
  document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
}

/* ---------- 백업 ---------- */
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportCSV() {
  const rows = [['날짜', '운동', '부위', '세트', '무게kg', '횟수', '초', '분', 'km']];
  for (const s of S.sessions) for (const en of s.entries) {
    const ex = exById(en.exId);
    en.sets.filter((x) => x.done).forEach((x, j) => rows.push([s.date, ex.name, ex.cat, j + 1, x.w ?? '', x.r ?? '', x.s ?? '', x.min ?? '', x.km ?? '']));
  }
  download(`운동일지_${today()}.csv`, '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
}
function importJSON() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (!data.exercises || !data.sessions) throw new Error();
      if (!confirm('현재 데이터를 백업 파일로 덮어쓸까요?')) return;
      localStorage.setItem(KEY, JSON.stringify(data)); load(); render(); toast('불러오기 완료');
    } catch { toast('올바른 백업 파일이 아닙니다'); }
  };
  inp.click();
}

/* ---------- 이벤트 ---------- */
document.addEventListener('click', (e) => {
  const tb = e.target.closest('.tabbar button'); if (tb) return go(tb.dataset.tab);
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act; const i = +b.dataset.i; const j = +b.dataset.j;
  const s = sessionOf(workDate);
  switch (a) {
    case 'open-picker': return openPicker();
    case 'add-ex': return addExercise(b.dataset.id);
    case 'new-ex': return openExEditor(null);
    case 'new-ex-only': return openExEditor(null, false);
    case 'edit-ex': return openExEditor(S.exercises.find((x) => x.id === b.dataset.id));
    case 'del-ex': if (confirm('운동을 목록에서 삭제할까요? (과거 기록은 남습니다)')) { S.exercises = S.exercises.filter((x) => x.id !== b.dataset.id); save(); manageExercises(); } return;
    case 'manage-ex': return manageExercises();
    case 'close': return closeModal();
    case 'entry-menu': return entryMenu(i);
    case 'move': { const d = +b.dataset.d; const arr = s.entries; [arr[i], arr[i + d]] = [arr[i + d], arr[i]]; save(); closeModal(); return render(); }
    case 'del-entry': if (confirm('삭제할까요?')) { s.entries.splice(i, 1); if (!s.entries.length && !s.note) S.sessions = S.sessions.filter((x) => x !== s); save(); closeModal(); render(); } return;
    case 'see-progress': progressEx = b.dataset.id; closeModal(); return go('progress');
    case 'add-set': { const en = s.entries[i]; const last = en.sets[en.sets.length - 1] || {}; en.sets.push({ ...last, done: false }); save(); return render(); }
    case 'del-set': { const en = s.entries[i]; if (en.sets.length > 1) { en.sets.pop(); save(); render(); } return; }
    case 'set-done': {
      const en = s.entries[i]; const x = en.sets[j]; x.done = !x.done; save(); render();
      const ex = exById(en.exId);
      if (x.done && ex.type !== 'cardio') {
        const more = en.sets.some((y) => !y.done) || s.entries.some((y) => y.sets.some((z) => !z.done));
        if (more) startTimer(S.settings.rest, `휴식 · ${ex.name}`, 'rest');
      }
      return;
    }
    case 'hold-start': {
      const en = s.entries[i]; const x = en.sets[j]; const ex = exById(en.exId);
      const sec = x.s || 30;
      startTimer(3, `준비 · ${ex.name}`, 'hold', () => startTimer(sec, `${ex.name} ${j + 1}세트`, 'hold', () => {
        x.done = true; save(); if (tab === 'today') render();
      }));
      return;
    }
    case 'timer-add': if (timer) timer.end += (+b.dataset.sec) * 1000; return;
    case 'timer-stop': timer && (timer.onDone = null); return stopTimer();
    case 'open-day': workDate = b.dataset.date; return go('today');
    case 'export': return download(`운동일지_백업_${today()}.json`, JSON.stringify(S, null, 1), 'application/json');
    case 'import': return importJSON();
    case 'csv': return exportCSV();
    case 'body-save': {
      const rec = { id: uid(), date: $('#bDate').value || today(), note: $('#bNote').value.trim() };
      let any = false; BODY_FIELDS.forEach(([k]) => { const v = num($('#b_' + k).value); if (v != null) { rec[k] = v; any = true; } });
      if (!any) return toast('값을 하나 이상 입력하세요');
      S.body.push(rec); S.body.sort((x, y) => x.date.localeCompare(y.date)); save(); toast('저장됨'); return render();
    }
    case 'body-del': if (confirm('삭제할까요?')) { S.body = S.body.filter((x) => x.id !== b.dataset.id); save(); render(); } return;
    case 'body-metric': bodyMetric = b.dataset.k; return render();
    case 'task-manage': return manageTasks();
    case 'cond-save': {
      const c = readCond(); S.condition = S.condition.filter((x) => x.date !== c.date); S.condition.push(c); save(); toast('컨디션 저장됨'); return render();
    }
  }
});
document.addEventListener('input', (e) => {
  const t = e.target; const a = t.dataset.act;
  if (a === 'set-input') {
    const s = sessionOf(workDate); const x = s.entries[+t.dataset.i].sets[+t.dataset.j];
    x[t.dataset.f] = num(t.value); save();
  } else if (a === 'sess-note') { const s = sessionOf(workDate); s.note = t.value; save(); }
  else if (a === 'pain') $('#pv_' + t.dataset.p).textContent = t.value;
  else if (a === 'energy') $('#pv_energy').textContent = t.value;
  else if (t.id === 'restSec') { const v = num(t.value); if (v && v > 0) { S.settings.rest = Math.round(v); save(); } }
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.act === 'task-toggle') {
    const set = new Set(S.taskLog[ptDate] || []); t.checked ? set.add(t.dataset.id) : set.delete(t.dataset.id);
    S.taskLog[ptDate] = [...set]; save(); render();
  } else if (t.id === 'soundOn') { S.settings.sound = t.checked; save(); }
});
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && tab === 'today' && workDate !== today() && !sessionOf(workDate)) { workDate = today(); render(); } });

/* ---------- 시작 ---------- */
load(); render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
