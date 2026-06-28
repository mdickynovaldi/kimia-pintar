/* Kimia Pintar LMS — shared client behavior (prototype) */
(function () {
  'use strict';

  // ---- Theme (light/dark) — persisted, default follows system ----
  var KEY = 'kp-theme';
  var root = document.documentElement;
  function apply(t) { root.setAttribute('data-theme', t); }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (!saved) {
    saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  apply(saved);

  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-theme-toggle]');
    if (t) { e.preventDefault(); toggleTheme(); }

    // mobile sidebar
    var m = e.target.closest('[data-menu]');
    if (m) { document.querySelector('.app') && document.querySelector('.app').classList.toggle('nav-open'); }
    if (e.target.closest('.sidebar-scrim')) {
      document.querySelector('.app') && document.querySelector('.app').classList.remove('nav-open');
    }

    // tabs
    var tab = e.target.closest('[data-tab]');
    if (tab) {
      var group = tab.closest('[data-tabs]') || document;
      var name = tab.getAttribute('data-tab');
      group.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.toggle('active', b === tab); });
      group.querySelectorAll('[data-panel]').forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-panel') === name);
      });
    }

    // password reveal
    var rev = e.target.closest('[data-reveal]');
    if (rev) {
      var inp = document.getElementById(rev.getAttribute('data-reveal'));
      if (inp) { inp.type = inp.type === 'password' ? 'text' : 'password'; rev.classList.toggle('on'); }
    }
  });

  // ---- Quiz countdown timer (data-countdown="seconds") ----
  document.querySelectorAll('[data-countdown]').forEach(function (el) {
    var left = parseInt(el.getAttribute('data-countdown'), 10) || 0;
    function tick() {
      var m = Math.floor(left / 60), s = left % 60;
      el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      if (left <= 60) el.classList.add('warn');
      if (left <= 0) { el.classList.add('over'); return; }
      left--; setTimeout(tick, 1000);
    }
    tick();
  });

  // ---- Quiz player navigation (prototype, client-only) ----
  var player = document.querySelector('[data-quiz-player]');
  if (player) {
    var qs = Array.prototype.slice.call(player.querySelectorAll('[data-q]'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-qdot]'));
    var cur = 0;
    function show(i) {
      cur = Math.max(0, Math.min(qs.length - 1, i));
      qs.forEach(function (q, n) { q.style.display = n === cur ? '' : 'none'; });
      dots.forEach(function (d, n) { d.classList.toggle('active', n === cur); });
      var pos = document.querySelector('[data-qpos]');
      if (pos) pos.textContent = (cur + 1) + ' / ' + qs.length;
      var prev = document.querySelector('[data-qprev]');
      var next = document.querySelector('[data-qnext]');
      var fin = document.querySelector('[data-qfinish]');
      if (prev) prev.disabled = cur === 0;
      if (next) next.style.display = cur === qs.length - 1 ? 'none' : '';
      if (fin) fin.style.display = cur === qs.length - 1 ? '' : 'none';
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-qnext]')) show(cur + 1);
      if (e.target.closest('[data-qprev]')) show(cur - 1);
      var jump = e.target.closest('[data-qdot]');
      if (jump) show(dots.indexOf(jump));
    });
    // mark answered
    player.addEventListener('change', function (e) {
      var card = e.target.closest('[data-q]');
      if (card) {
        var idx = qs.indexOf(card);
        if (dots[idx]) dots[idx].classList.add('answered');
      }
    });
    show(0);
  }

  // ---- Generic dismiss ----
  document.addEventListener('click', function (e) {
    var d = e.target.closest('[data-dismiss]');
    if (d) { var box = d.closest(d.getAttribute('data-dismiss') || '.card'); box && (box.style.display = 'none'); }
  });
})();
