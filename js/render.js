/* Отрисовка протокола и прибора. Нужен method.js */
(function (KT) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = (s) => esc(KT.typo(s));

  function polar(cx, cy, r, deg) { const a = (deg - 180) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(from, to, r) {
    const a = polar(160, 160, r, from * 1.8), b = polar(160, 160, r, to * 1.8);
    return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} A${r} ${r} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  function dial(force, id) {
    const ticks = Array.from({ length: 11 }, (_, i) => {
      const p1 = polar(160, 160, 100, i * 18), p2 = polar(160, 160, i % 5 === 0 ? 84 : 92, i * 18);
      return `<line x1="${p1[0].toFixed(1)}" y1="${p1[1].toFixed(1)}" x2="${p2[0].toFixed(1)}" y2="${p2[1].toFixed(1)}" stroke="#0E0E0F" stroke-width="${i % 5 === 0 ? 3 : 2}"/>`;
    }).join('');
    const deg = -90 + Math.max(0, Math.min(100, force)) * 1.8;
    return `<svg class="dial" viewBox="0 0 320 178" role="img" aria-label="Сила удара ${force} из 100" id="${id || ''}" style="--deg:${deg}deg">
      <path d="${arc(0, 32, 130)}" stroke="#1C7A35" stroke-width="26" fill="none"/>
      <path d="${arc(32, 60, 130)}" stroke="#FFD21F" stroke-width="26" fill="none"/>
      <path d="${arc(60, 100, 130)}" stroke="#C8260F" stroke-width="26" fill="none"/>
      <path d="${arc(0, 100, 144)}" stroke="#0E0E0F" stroke-width="2" fill="none"/>
      ${ticks}
      <g class="needle"><path d="M156 160 L160 38 L164 160 Z" fill="#0E0E0F"/></g>
      <circle cx="160" cy="160" r="14" fill="#0E0E0F"/><circle cx="160" cy="160" r="5" fill="#FFD21F"/>
    </svg>`;
  }

  const typeLabel = (id) => (KT.TYPES.find((t) => t.id === id) || KT.TYPES[0]).label;

  function sheet(r, opt) {
    opt = opt || {};
    const v = KT.VERDICT[r.verdict];
    const td = KT.TEST_DRIVE[r.type] || KT.TEST_DRIVE.quit;
    const ask = KT.ASK[r.type] || KT.ASK.quit;
    const no = opt.no || ('КТ-' + String(Date.now()).slice(-5));
    const today = KT.dateRu(new Date());
    const what = r.answers.what && r.answers.what.trim() ? r.answers.what.trim() : typeLabel(r.type);
    const zones = r.zones.map((k, i) => {
      const z = KT.ZONES[k];
      return `<div class="zone">
        <div class="zone-n mono">Зона ${i + 1}</div>
        <h4>${T(z.title)}</h4>
        <p>${T(z.why(r))}</p>
        <blockquote><span class="mono">Андрей:</span> ${T(z.andrey)}</blockquote>
        <p class="fix"><b>Что сделать:</b> ${T(z.fix(r))}</p>
      </div>`;
    }).join('');
    const days = td.days.map((d) => `<tr><th class="mono">День ${esc(d[0])}</th><td>${T(d[1])}</td></tr>`).join('');
    const runwayTxt = r.runway >= 99 ? 'без ограничений' : KT.fmtMonths(r.runway);

    return `<article class="sheet${opt.compact ? ' compact' : ''}" aria-label="Протокол краш-теста">
      <header class="sh-head">
        <div class="sh-brand"><span class="mark"></span><div><b>Протокол краш-теста</b><span class="mono">${esc(no)} от ${esc(today)}</span></div></div>
        <div class="sh-obj"><span class="mono">Объект испытания</span><b>${T(what)}</b><span>${esc(typeLabel(r.type))}</span></div>
      </header>

      <section class="sh-verdict v-${r.verdict}">
        <div class="sh-dial">${dial(r.force, opt.dialId)}<div class="sh-force"><b>${r.force}</b><span>сила удара из 100</span></div></div>
        <div class="sh-vtext"><span class="chip ${r.verdict}">${esc(v.name)}</span><h3>${T(v.head)}</h3><p>${T(v.text)}</p></div>
      </section>

      <section class="sh-nums">
        <div><span class="mono">Цена ошибки</span><b class="red">${KT.money(r.price)}</b><small>${T('ставка ' + KT.money(r.stake) + ' и недополученный доход ' + KT.money(r.lostIncome) + ' за ' + r.backTime + ' ' + KT.plural(r.backTime, 'месяц', 'месяца', 'месяцев') + ' отката')}</small></div>
        <div><span class="mono">Запас хода</span><b>${esc(runwayTxt)}</b><small>${T('на столько хватит денег после старта, если доход будет таким, как ты написал')}</small></div>
        <div><span class="mono">Безопасная подушка</span><b>${KT.money(r.safeCushion)}</b><small>${T('полгода расходов плюс стартовая сумма; у тебя сейчас ' + KT.money(r.cushion))}</small></div>
      </section>

      <section class="sh-block">
        <h3>Зоны деформации</h3>
        <p class="sh-lead">${T('Где решение сомнётся первым, если ударит. Каждую зону можно усилить до прыжка.')}</p>
        <div class="zones">${zones}</div>
      </section>

      <section class="sh-block">
        <h3>Тест-заезд на 14 дней</h3>
        <p class="sh-lead">${T('Цель: ' + td.goal + '. Проверяешь малыми деньгами, мосты не сжигаешь.')}</p>
        <table class="days">${days}</table>
        <div class="crit">
          <div class="go"><span class="mono">Едешь дальше, если</span><p>${T(td.go)}</p></div>
          <div class="stop"><span class="mono">Тормозишь, если</span><p>${T(td.stop)}</p></div>
        </div>
      </section>

      <section class="sh-block">
        <h3>Пять вопросов тем, кто уже разбился или доехал</h3>
        <ol class="ask">${ask.map((q) => `<li>${T(q)}</li>`).join('')}</ol>
      </section>

      <section class="sh-block sh-point">
        <div><span class="mono">Точка невозврата</span><b>${esc(KT.dateRu(r.decideOn))}</b><p>${T('Решение принимается в этот день. Не раньше: эмоция остынет, тест-заезд даст факты. Не позже: раздумья тоже стоят денег.')}</p></div>
        <div class="contract">
          <p>${T('Я, ________________, проверяю решение «' + what + '».')}</p>
          <p>${T('Если к ' + KT.dateRu(r.decideOn) + ' ' + td.go + ', я делаю это и не откатываю назад три месяца.')}</p>
          <p>${T('Если нет, я не прыгаю, а усиливаю зоны деформации и прохожу тест ещё раз.')}</p>
          <div class="sign"><span>Подпись</span><span>Дата</span></div>
        </div>
      </section>

      <footer class="sh-foot"><span>${T('Методика Андрея Харда. Это расчёт и план проверки, а не финансовая или психологическая консультация.')}</span><span class="mono">krash-test</span></footer>
    </article>`;
  }

  KT.dial = dial;
  KT.sheet = sheet;
  KT.esc = esc;
  KT.T = T;
})(window.KT);
