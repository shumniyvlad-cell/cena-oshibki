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

  /* ---------- Счёт печатается по прокрутке ---------- */
  const scene = $('#scene'), stage = $('#stage'), totalEl = $('#total');
  const lines = $$('.r-line', scene), TOTAL = 1110000;
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ');
  const clamp = (x) => Math.min(1, Math.max(0, x));
  function setFinal() {
    scene.classList.add('static');
    ['--feed', '--stamp', '--after'].forEach((k) => stage.style.setProperty(k, 1));
    lines.forEach((l) => l.style.setProperty('--o', 1));
    totalEl.textContent = fmt(TOTAL);
  }
  let lastTotal = -1;
  const narrow = matchMedia('(max-width: 980px)');
  const receipt = $('.receipt', scene);
  function sceneFrame() {
    let p;
    if (narrow.matches) {
      // на телефоне без закрепления: счёт печатается, пока проезжает через экран
      scene.classList.add('static');
      const rr = receipt.getBoundingClientRect();
      p = 0.12 + 0.8 * clamp((innerHeight * 0.85 - rr.top) / (rr.height * 0.95));
      stage.style.setProperty('--feed', 1);
    } else {
      scene.classList.remove('static');
      const r = scene.getBoundingClientRect();
      p = clamp(-r.top / (scene.offsetHeight - innerHeight));
      stage.style.setProperty('--feed', (1 - Math.pow(1 - clamp(p / 0.5), 2)).toFixed(4));
    }
    lines.forEach((l, i) => l.style.setProperty('--o', clamp((p - 0.12 - i * 0.07) / 0.08).toFixed(3)));
    const t = clamp((p - 0.42) / 0.22);
    const val = Math.round(TOTAL * (1 - Math.pow(1 - t, 3)) / 1000) * 1000;
    if (val !== lastTotal) { totalEl.textContent = fmt(val); lastTotal = val; }
    stage.style.setProperty('--stamp', clamp((p - 0.7) / 0.06).toFixed(3));
    stage.style.setProperty('--after', clamp((p - 0.78) / 0.1).toFixed(3));
  }
  if (motion) {
    let ticking = false;
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { sceneFrame(); ticking = false; }); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    sceneFrame();
  } else setFinal();

  /* ---------- Пример расчёта ---------- */
  const sample = KT.compute({ type: 'quit', what: 'Ухожу из банка и открываю кофейню у дома', think: 'year', push: 'circ', spend: 120000, cushion: 400000, stake: 300000, income: 150000, income6: 60000,
    back: 'worse', back_time: 9, deps: 'some', burn: ['rel'], talked: 0, proof: 'no', small: 'part', before: 'no', dir: 'from', event: 'yes', regret: 'pain', sleep: 'fear' });
  $('#sample').innerHTML = KT.sheet(sample, { compact: true, no: 'ЦО-00417' });

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
    body.innerHTML = `<div class="ex-step mono">Результат экспресс-расчёта</div>
      ${KT.dial(r.force, 'exDial').replace('style="--deg', 'style="--deg-x')}
      <div class="res-force"><b>${r.force}</b><div class="mono">риск из 100</div><p style="margin-top:12px"><span class="chip ${r.verdict}">${v.name}: ${KT.T(v.head.charAt(0).toLowerCase() + v.head.slice(1))}</span></p></div>
      <div class="zone-teaser"><span class="mono">Главное слабое место</span><h4>${KT.T(z.title)}</h4><p style="margin:0">${KT.T(r.zone === 'runway' ? 'Денег после старта хватит ненадолго. Новое почти никогда не выходит на доход раньше, чем через полгода.' : z.why(rr))}</p><div class="say">${KT.T(z.andrey)}</div></div>
      <div class="locked">
        <div>${lock}Цена ошибки в рублях и на сколько хватит денег</div>
        <div>${lock}Ещё два слабых места и что с ними делать</div>
        <div>${lock}Проверка за 14 дней под твой тип решения</div>
      </div>
      <div class="ex-nav" style="flex-wrap:wrap;gap:12px"><a class="btn btn-main" href="${C.buyUrl}" target="_blank" rel="noopener">Полный расчёт <span class="price">${C.price}</span></a><button class="linkbtn" type="button" id="exAgain">Пройти заново</button></div>`;
    const dialEl = $('#exDial'); const deg = -90 + r.force * 1.8;
    dialEl.style.setProperty('--deg', '-90deg');
    requestAnimationFrame(() => requestAnimationFrame(() => dialEl.style.setProperty('--deg', deg + 'deg')));
    $('#exAgain').addEventListener('click', () => { step = 0; Object.keys(ans).forEach((k) => delete ans[k]); ask(); });
    $('.res-force', body).setAttribute('tabindex', '-1'); $('.res-force', body).focus({ preventScroll: true });
  }
  ask();
})();
