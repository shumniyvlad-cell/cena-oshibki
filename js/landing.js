(function () {
  const C = window.KT_CONFIG, KT = window.KT;
  const motion = document.documentElement.classList.contains('motion');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Конфиг в вёрстку ---------- */
  $$('[data-cfg]').forEach((el) => { if (C[el.dataset.cfg]) el.textContent = C[el.dataset.cfg]; });
  $$('.js-buy').forEach((a) => { if (a.getAttribute('href') === '#') { a.href = C.buyUrl; a.target = '_blank'; a.rel = 'noopener'; } });
  $$('.js-consult').forEach((a) => { a.href = C.consultUrl; a.target = '_blank'; a.rel = 'noopener'; });
  const seats = $('#seats');
  if (seats) {
    seats.innerHTML = Array.from({ length: C.seatsTotal }, (_, i) => `<i class="${i < C.seatsTaken ? 'taken' : ''}"></i>`).join('');
    const left = C.seatsTotal - C.seatsTaken;
    $('#seatsTxt').textContent = `Свободно ${left} из ${C.seatsTotal} мест в декабре`;
  }

  /* ---------- Типограф: без висячих предлогов ---------- */
  function typoTree(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentNode && /SCRIPT|STYLE/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach((n) => { const t = KT.typo(KT.typo(n.nodeValue)); if (t !== n.nodeValue) n.nodeValue = t; });
  }
  typoTree(document.body);

  /* ---------- Появление ---------- */
  if (motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rise').forEach((el) => io.observe(el));
  }

  /* ---------- Кнопка в шапке прячется, пока видна кнопка героя ---------- */
  const top = $('#top'), heroCta = $('.hero .btn-main');
  if ('IntersectionObserver' in window && heroCta) {
    new IntersectionObserver(([e]) => top.classList.toggle('hidden', e.isIntersecting)).observe(heroCta);
  }

  /* ---------- Разгон и удар ---------- */
  const crash = $('#crash'), stage = $('#stage'), car = $('#car'), kmh = $('#kmh'), bill = $('#bill'), flash = $('#flash'), shardsBox = $('#shards'), label = $('#carLabel');
  const labels = ['Уволюсь в понедельник', 'Открою кофейню на подушку', 'Вложу всё в стройку', 'Уеду в Дананг', 'Войду в долю к другу'];
  shardsBox.innerHTML = Array.from({ length: 14 }, (_, i) => {
    const a = (-150 + i * 22) * Math.PI / 180, d = 90 + (i * 37) % 120;
    return `<i style="--dx:${Math.round(Math.cos(a) * d * -1)}px;--dy:${Math.round(Math.sin(a) * d)}px;--rot:${(i * 67) % 360}deg"></i>`;
  }).join('');

  const crumple = 'polygon(0 0, 78% 0, 86% 12%, 80% 26%, 92% 38%, 84% 52%, 96% 64%, 86% 78%, 94% 90%, 84% 100%, 0 100%)';
  function setFinal() {
    crash.classList.add('static');
    const trackW = stage.querySelector('.track').clientWidth, wallX = stage.querySelector('.wall').offsetLeft;
    car.style.setProperty('--x', Math.max(0, wallX - car.offsetWidth * 0.82) + 'px');
    car.style.setProperty('--crush', '0.82');
    car.querySelector('.body').style.setProperty('--clip', crumple);
    stage.style.setProperty('--bill', 1);
    kmh.textContent = '0';
    void trackW;
  }

  let lastLabel = -1, shook = false;
  function crashFrame() {
    const r = crash.getBoundingClientRect();
    const total = crash.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    const wall = stage.querySelector('.wall');
    const wallX = wall.offsetLeft;
    const carW = car.offsetWidth;
    const startX = -carW * 0.4;
    const hitX = wallX - carW;
    const IMPACT = 0.62;
    let x, crush = 1, fl = 0, bl = 0, blur = 0, shard = 0, fly = 0, speed;
    if (p < IMPACT) {
      const t = p / IMPACT; const e = t * t; // разгон
      x = startX + (hitX - startX) * e;
      speed = Math.round(e * 140);
      blur = Math.min(1, t * 1.4) * 0.6;
      const li = Math.min(labels.length - 1, Math.floor(t * labels.length));
      if (li !== lastLabel) { label.textContent = KT.typo(labels[li]); lastLabel = li; }
      car.querySelector('.body').style.setProperty('--clip', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)');
      shook = false;
    } else {
      const t = Math.min(1, (p - IMPACT) / 0.12);
      crush = 1 - 0.18 * Math.min(1, t * 2);
      x = hitX;
      speed = Math.round(140 * Math.max(0, 1 - t * 3));
      fl = Math.max(0, 0.85 - t * 2.2);
      shard = t < 1 ? 1 - t * 0.6 : 0.4; fly = Math.min(1, t * 1.6);
      bl = Math.min(1, Math.max(0, (p - IMPACT - 0.08) / 0.12));
      car.querySelector('.body').style.setProperty('--clip', crumple);
      if (!shook && t > 0 && t < 0.5) { shook = true; stage.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-10px,6px)' }, { transform: 'translate(8px,-6px)' }, { transform: 'translate(-5px,3px)' }, { transform: 'translate(0,0)' }], { duration: 320, easing: 'ease-out' }); }
    }
    car.style.setProperty('--x', x + 'px');
    car.style.setProperty('--crush', crush);
    car.style.setProperty('--blur', blur);
    stage.style.setProperty('--flash', fl);
    stage.style.setProperty('--bill', bl);
    shardsBox.style.setProperty('--shard', shard);
    shardsBox.style.setProperty('--fly', fly);
    kmh.textContent = speed;
  }
  if (motion) {
    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { crashFrame(); ticking = false; }); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    crashFrame();
  } else {
    setFinal();
    addEventListener('resize', setFinal);
  }

  /* ---------- Пример протокола ---------- */
  const sample = KT.compute({ type: 'quit', what: 'Ухожу из банка и открываю кофейню у дома', think: 'year', push: 'circ', spend: 120000, cushion: 400000, stake: 300000, income: 150000, income6: 60000,
    back: 'worse', back_time: 9, deps: 'some', burn: ['rel'], talked: 0, proof: 'no', small: 'part', before: 'no', dir: 'from', event: 'yes', regret: 'pain', sleep: 'fear' });
  $('#sample').innerHTML = KT.sheet(sample, { compact: true, no: 'КТ-00417' });

  const tilt = $('#tilt');
  if (motion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    tilt.addEventListener('pointermove', (e) => {
      const b = tilt.getBoundingClientRect(); const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
      tilt.style.setProperty('--ry', ((px - 0.5) * 10).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', ((0.5 - py) * 7).toFixed(2) + 'deg');
      tilt.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
      tilt.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      tilt.style.setProperty('--go', 1);
    });
    tilt.addEventListener('pointerleave', () => { ['--rx', '--ry'].forEach((k) => tilt.style.setProperty(k, '0deg')); tilt.style.setProperty('--go', 0); });
  }

  /* ---------- Экспресс-тест ---------- */
  const Q = KT.EXPRESS, bar = $('#exBar'), body = $('#exBody');
  let step = 0; const ans = {};
  const lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function drawBar(n) { bar.innerHTML = Q.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''); }
  function ask() {
    drawBar(step);
    const q = Q[step];
    body.innerHTML = `<div class="ex-step mono">Вопрос ${step + 1} из ${Q.length}</div>
      <div class="ex-q" id="exQ">${KT.T(q.text)}</div>
      <div class="opts" role="group" aria-labelledby="exQ">${q.options.map((o) => `<button class="opt" type="button" data-v="${KT.esc(o.v)}" aria-pressed="${String(ans[q.id]) === String(o.v)}">${KT.T(o.t)}</button>`).join('')}</div>
      <div class="ex-nav"><button class="linkbtn" type="button" id="exBack" ${step === 0 ? 'hidden' : ''}>Назад</button><span class="mono">${step === 0 ? 'бесплатно' : ''}</span></div>`;
    $$('.opt', body).forEach((b) => b.addEventListener('click', () => {
      ans[q.id] = b.dataset.v;
      $$('.opt', body).forEach((x) => x.setAttribute('aria-pressed', x === b));
      setTimeout(() => { step++; if (step < Q.length) ask(); else result(); }, motion ? 180 : 0);
    }));
    const back = $('#exBack'); if (back) back.addEventListener('click', () => { step--; ask(); });
    if (step > 0) { const first = $('.opt', body); first && first.focus({ preventScroll: true }); }
  }
  function result() {
    drawBar(Q.length);
    const r = KT.express(ans); const v = KT.VERDICT[r.verdict]; const z = KT.ZONES[r.zone];
    const rr = { answers: { push: '' }, runway: Number(ans.rw), spend: 100000, safeCushion: 0 };
    body.innerHTML = `<div class="ex-step mono">Результат экспресс-теста</div>
      ${KT.dial(r.force, 'exDial').replace('style="--deg', 'style="--deg-x')}
      <div class="res-force"><b>${r.force}</b><div class="mono">сила удара из 100</div><p style="margin-top:12px"><span class="chip ${r.verdict}">${v.name}: ${KT.T(v.head)}</span></p></div>
      <div class="zone-teaser"><span class="mono">Главная зона деформации</span><h4>${KT.T(z.title)}</h4><p style="margin:0">${KT.T(r.zone === 'runway' ? 'Денег после старта хватит ненадолго. Новое почти никогда не выходит на доход раньше, чем через полгода.' : z.why(rr))}</p><div class="say">${KT.T(z.andrey)}</div></div>
      <div class="locked">
        <div>${lock}Цена ошибки в рублях и запас хода в месяцах</div>
        <div>${lock}Ещё две зоны деформации и что с ними делать</div>
        <div>${lock}Тест-заезд на 14 дней под твой тип решения</div>
      </div>
      <div class="ex-nav" style="flex-wrap:wrap;gap:12px"><a class="btn btn-main" href="${C.buyUrl}" target="_blank" rel="noopener">Полный протокол <span class="price">${C.price}</span></a><button class="linkbtn" type="button" id="exAgain">Пройти заново</button></div>`;
    const dialEl = $('#exDial'); const deg = -90 + r.force * 1.8;
    dialEl.style.setProperty('--deg', '-90deg');
    requestAnimationFrame(() => requestAnimationFrame(() => dialEl.style.setProperty('--deg', deg + 'deg')));
    $('#exAgain').addEventListener('click', () => { step = 0; Object.keys(ans).forEach((k) => delete ans[k]); ask(); });
    $('.res-force', body).setAttribute('tabindex', '-1'); $('.res-force', body).focus({ preventScroll: true });
  }
  ask();
})();
