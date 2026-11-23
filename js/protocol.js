(function () {
  const KT = window.KT, C = window.KT_CONFIG;
  const motion = document.documentElement.classList.contains('motion');
  const app = document.getElementById('app'), prog = document.getElementById('prog');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const T = KT.T, esc = KT.esc;
  const KEY = 'co-v1';

  let state = load() || { step: -1, a: {} };
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* приватный режим */ } }

  const B = KT.BLOCKS;
  const shield = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>';
  const warn = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>';

  function drawProg(i) {
    prog.innerHTML = B.map((_, k) => `<i class="${k < i ? 'on' : k === i ? 'now' : ''}"></i>`).join('');
  }

  // «Назад» телефона и браузера ведёт на предыдущий шаг, а не со страницы
  function go(step, push) {
    state.step = step; save();
    if (push !== false) history.pushState({ step }, '');
    render();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  addEventListener('popstate', (e) => { const s = e.state && typeof e.state.step === 'number' ? e.state.step : -1; state.step = s; save(); render(); window.scrollTo(0, 0); });
  history.replaceState({ step: state.step }, '');

  function render() {
    if (state.step === -1) return intro();
    if (state.step >= 0 && state.step < B.length) return block(state.step);
    if (state.step === B.length) return result();
    state.step = -1; intro();
  }

  /* ---------- Вступление ---------- */
  function intro() {
    drawProg(-1);
    const started = Object.keys(state.a).length > 0;
    app.innerHTML = `<section class="intro">
      <span class="mark" style="--s:48px"></span>
      <h1 style="margin-top:20px">${T('Цена ошибки твоего решения')}</h1>
      <p class="lead">${T('25 минут, пять блоков, 22 вопроса. Отвечай так, как есть, а не как хотелось бы: от честности цифр зависит, насколько точно получится цена ошибки.')}</p>
      <ul>
        ${B.map((b, i) => `<li><span class="mono">0${i + 1}</span><div><b>${T(b.title)}</b><span>${T(b.lead)}</span></div></li>`).join('')}
      </ul>
      <div class="row">
        <button class="btn btn-main" type="button" id="start">${started ? 'Продолжить с места остановки' : 'Начать расчёт'}</button>
        ${started ? '<button class="btn btn-ghost" type="button" id="reset">Начать заново</button>' : ''}
      </div>
      <p class="privacy">${shield}${T('Ответы и цифры остаются на этом устройстве. Мы их не видим и никуда не отправляем.')}</p>
    </section>`;
    $('#start').addEventListener('click', () => {
      if (!started) return go(0);
      const firstEmpty = B.findIndex((b) => b.q.some((q) => !filled(q)));
      go(firstEmpty === -1 ? B.length : firstEmpty);
    });
    const r = $('#reset'); if (r) r.addEventListener('click', () => { state = { step: -1, a: {} }; save(); go(0); });
  }

  function filled(q) {
    const v = state.a[q.id];
    if (q.kind === 'many') return Array.isArray(v) && v.length > 0;
    if (q.kind === 'money') return v !== undefined && v !== '' && v !== null;
    if (q.kind === 'text') return typeof v === 'string' && v.trim().length >= 3;
    return v !== undefined && v !== '';
  }

  /* ---------- Блок вопросов ---------- */
  function qHtml(q) {
    const v = state.a[q.id];
    const hint = q.hint ? `<p class="q-hint" id="h-${q.id}">${T(q.hint)}</p>` : '';
    const err = `<p class="err" id="e-${q.id}" hidden>${warn}<span></span></p>`;
    let ctl = '';
    if (q.kind === 'type') {
      ctl = `<div class="types" role="group" aria-labelledby="t-${q.id}">${KT.TYPES.map((t) => `<button type="button" class="opt" data-v="${t.id}" aria-pressed="${v === t.id}"><span>${T(t.label)}</span><small>${T(t.hint)}</small></button>`).join('')}</div>`;
    } else if (q.kind === 'one') {
      ctl = `<div class="opts" role="group" aria-labelledby="t-${q.id}">${q.options.map((o) => `<button type="button" class="opt" data-v="${esc(o.v)}" aria-pressed="${String(v) === String(o.v)}">${T(o.t)}</button>`).join('')}</div>`;
    } else if (q.kind === 'many') {
      const arr = Array.isArray(v) ? v : [];
      ctl = `<div class="opts many" role="group" aria-labelledby="t-${q.id}">${q.options.map((o) => `<button type="button" class="opt" data-v="${esc(o.v)}" aria-pressed="${arr.includes(o.v)}">${T(o.t)}</button>`).join('')}</div>`;
    } else if (q.kind === 'money') {
      const shown = v === undefined || v === '' ? '' : Number(v).toLocaleString('ru-RU');
      ctl = `<div class="field money"><input id="i-${q.id}" inputmode="numeric" autocomplete="off" enterkeyhint="next" aria-describedby="${q.hint ? 'h-' + q.id + ' ' : ''}e-${q.id}" placeholder="${esc(q.placeholder || '')}" value="${esc(shown)}"></div>`;
    } else if (q.kind === 'text') {
      ctl = `<div class="field"><input id="i-${q.id}" maxlength="${q.max || 140}" autocomplete="off" enterkeyhint="next" aria-describedby="e-${q.id}" placeholder="${esc(q.placeholder || '')}" value="${esc(v || '')}"><span class="count" id="c-${q.id}">${(v || '').length}/${q.max || 140}</span></div>`;
    }
    const labelTag = (q.kind === 'money' || q.kind === 'text') ? `<label class="q-text" id="t-${q.id}" for="i-${q.id}">${T(q.text)}</label>` : `<span class="q-text" id="t-${q.id}">${T(q.text)}</span>`;
    return `<div class="q" data-q="${q.id}">${labelTag}${hint}${ctl}${err}</div>`;
  }

  function block(i) {
    drawProg(i);
    const b = B[i];
    app.innerHTML = `<section>
      <div class="block-head"><span class="mono">Блок ${i + 1} из ${B.length}</span><h2>${T(b.title)}</h2><p>${T(b.lead)}</p></div>
      <form id="f" novalidate>${b.q.map(qHtml).join('')}
        <div class="nav">
          <button type="button" class="btn btn-ghost" id="back">Назад</button>
          <button type="submit" class="btn btn-main">${i === B.length - 1 ? 'Посчитать' : 'Дальше'}</button>
        </div>
      </form>
    </section>`;

    b.q.forEach((q) => {
      const box = $(`[data-q="${q.id}"]`);
      if (q.kind === 'type' || q.kind === 'one') {
        $$('.opt', box).forEach((btn) => btn.addEventListener('click', () => {
          const raw = btn.dataset.v; const opt = q.options && q.options.find((o) => String(o.v) === raw);
          state.a[q.id] = opt ? opt.v : raw; save();
          $$('.opt', box).forEach((x) => x.setAttribute('aria-pressed', x === btn));
          clearErr(q.id);
        }));
      } else if (q.kind === 'many') {
        $$('.opt', box).forEach((btn) => btn.addEventListener('click', () => {
          let arr = Array.isArray(state.a[q.id]) ? state.a[q.id].slice() : [];
          const val = btn.dataset.v;
          if (val === 'nothing') arr = arr.includes('nothing') ? [] : ['nothing'];
          else { arr = arr.filter((x) => x !== 'nothing'); arr = arr.includes(val) ? arr.filter((x) => x !== val) : arr.concat(val); }
          state.a[q.id] = arr; save();
          $$('.opt', box).forEach((x) => x.setAttribute('aria-pressed', arr.includes(x.dataset.v)));
          clearErr(q.id);
        }));
      } else if (q.kind === 'money') {
        const inp = $('input', box);
        inp.addEventListener('input', () => {
          const digits = inp.value.replace(/[^\d]/g, '').slice(0, 11);
          const caret = inp.value.length - inp.selectionStart;
          inp.value = digits ? Number(digits).toLocaleString('ru-RU') : '';
          const pos = Math.max(0, inp.value.length - caret); inp.setSelectionRange(pos, pos);
          state.a[q.id] = digits === '' ? '' : Number(digits); save(); clearErr(q.id);
        });
      } else if (q.kind === 'text') {
        const inp = $('input', box);
        inp.addEventListener('input', () => { state.a[q.id] = inp.value; save(); $(`#c-${q.id}`).textContent = `${inp.value.length}/${q.max || 140}`; clearErr(q.id); });
      }
    });

    $('#back').addEventListener('click', () => go(i - 1));
    $('#f').addEventListener('submit', (e) => {
      e.preventDefault();
      let first = null;
      b.q.forEach((q) => {
        if (!filled(q)) {
          const msg = q.kind === 'money' ? 'Впиши сумму цифрами, можно 0' : q.kind === 'text' ? 'Напиши хотя бы пару слов' : q.kind === 'many' ? 'Отметь хотя бы один вариант' : 'Выбери вариант';
          showErr(q.id, msg); if (!first) first = q;
        }
      });
      if (first) {
        const box = $(`[data-q="${first.id}"]`);
        box.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
        const f = $('input, .opt', box); f && f.focus({ preventScroll: true });
        return;
      }
      if (i === B.length - 1) return run();
      go(i + 1);
    });
  }
  function showErr(id, msg) { const box = $(`[data-q="${id}"]`); box.classList.add('has-err'); const e = $(`#e-${id}`); e.hidden = false; $('span', e).textContent = msg; const inp = $('input', box); if (inp) inp.setAttribute('aria-invalid', 'true'); }
  function clearErr(id) { const box = $(`[data-q="${id}"]`); if (!box) return; box.classList.remove('has-err'); const e = $(`#e-${id}`); if (e) e.hidden = true; const inp = $('input', box); if (inp) inp.removeAttribute('aria-invalid'); }

  /* ---------- Считаем ---------- */
  function run() {
    drawProg(B.length);
    history.pushState({ step: B.length }, '');
    state.step = B.length; save();
    app.innerHTML = `<section class="running" role="status"><div>${KT.dial(50)}<h2>${T('Считаем')}</h2><p>${T('Цену ошибки, на сколько хватит денег и слабые места')}</p></div></section>`;
    window.scrollTo(0, 0);
    setTimeout(result, motion ? 1600 : 200);
  }

  /* ---------- Расчёт ---------- */
  function result() {
    drawProg(B.length);
    const missing = B.findIndex((b) => b.q.some((q) => !filled(q)));
    if (missing !== -1) {
      app.innerHTML = `<section class="intro"><h2>${T('Не хватает ответов')}</h2><p class="lead">${T('Расчёт собирается из всех пяти блоков. Вернись к блоку ' + (missing + 1) + ' и допиши ответы.')}</p><button class="btn btn-main" type="button" id="fix">Вернуться к блоку ${missing + 1}</button></section>`;
      $('#fix').addEventListener('click', () => go(missing));
      return;
    }
    let r;
    try { r = KT.compute(state.a); } catch (err) {
      app.innerHTML = `<section class="intro"><h2>${T('Что-то сломалось при расчёте')}</h2><p class="lead">${T('Ответы сохранены. Попробуй ещё раз.')}</p><button class="btn btn-main" type="button" id="retry">Повторить</button></section>`;
      $('#retry').addEventListener('click', result); return;
    }
    if (!state.no) { state.no = 'ЦО-' + String(Date.now()).slice(-5); save(); }
    app.innerHTML = `<div class="res-actions no-print">
        <button class="btn btn-main" type="button" id="pdf">Сохранить PDF</button>
        <button class="btn btn-ghost" type="button" id="edit">Поправить ответы</button>
        <button class="btn btn-ghost" type="button" id="again">Проверить другое решение</button>
      </div>
      ${KT.sheet(r, { no: state.no, dialId: 'resDial' })}
      <aside class="upsell night no-print">
        <div><h3>${T('Ставки высокие и нужен второй взгляд?')}</h3><p>${T('Разбор с Андреем, 90 минут. Он заранее смотрит твой расчёт, поэтому время уходит на решение, а не на знакомство.')} <b>15&nbsp;000&nbsp;₽</b></p></div>
        <a class="btn btn-main" href="${esc(C.consultUrl)}" target="_blank" rel="noopener">Записаться</a>
      </aside>
      <p class="restore no-print">${T('Расчёт сохранён на этом устройстве: вернёшься по той же ссылке — он будет здесь.')}</p>`;
    const d = $('#resDial');
    if (d && motion) { const deg = d.style.getPropertyValue('--deg'); d.style.setProperty('--deg', '-90deg'); requestAnimationFrame(() => requestAnimationFrame(() => d.style.setProperty('--deg', deg))); }
    $('#pdf').addEventListener('click', () => window.print());
    $('#edit').addEventListener('click', () => go(0));
    $('#again').addEventListener('click', () => { state = { step: -1, a: {} }; save(); go(0); });
  }

  render();
})();
