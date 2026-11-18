/* Pod KST Editor — landing. Sin dependencias. */
(function () {
  'use strict';

  // ── Ajustes ────────────────────────────────────────────
  var RELEASES_REPO = 'davidcaptart-glitch/editor-podcast-releases';
  // Formulario de contacto: FormSubmit reenvía los mensajes al correo.
  // Tras activar el formulario (primer mensaje), FormSubmit da un alias
  // aleatorio: ponerlo aquí en lugar de la dirección para no enseñarla.
  var FORM_TO = ['da.vid.captart', 'gmail.com'].join('@');
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + FORM_TO;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  // ── Barra y año ────────────────────────────────────────
  var nav = $('#nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  $('#year').textContent = new Date().getFullYear();

  // ── Aparecer al hacer scroll ───────────────────────────
  var items = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // ── Descarga: enlace directo al instalador más reciente ─
  // Si la consulta falla, los botones siguen llevando a la página de la versión.
  fetch('https://api.github.com/repos/' + RELEASES_REPO + '/releases/latest')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (rel) {
      var exe = (rel.assets || []).filter(function (a) { return /\.exe$/i.test(a.name); })[0];
      var ver = (rel.tag_name || '').replace(/^v/, '');
      if (exe) {
        $$('[data-download]').forEach(function (a) { a.href = exe.browser_download_url; });
        var mb = Math.round(exe.size / 1048576);
        $$('[data-meta]').forEach(function (el) {
          el.textContent = 'Versión ' + ver + ' · ' + mb + ' MB · Windows 10 y 11';
        });
      }
      if (ver) $$('[data-version]').forEach(function (el) { el.textContent = 'Versión ' + ver; });
    })
    .catch(function () { /* se queda el enlace a la última versión */ });

  // ── Maqueta del editor ─────────────────────────────────
  // Planos: [cámara, duración relativa, subtítulo]
  var SHOTS = [
    [2, 7, 'Bienvenidos a un episodio más.'],
    [0, 12, '…y ahí fue cuando decidimos grabarlo con tres cámaras.'],
    [1, 9, '¿Y cuánto tardabais en montarlo?'],
    [0, 14, 'Una tarde entera. Ahora, lo que tarda en exportar.'],
    [2, 6, '(risas)'],
    [1, 11, 'Pues eso hay que contarlo despacio.'],
    [0, 8, 'Vamos por partes.'],
    [1, 13, 'Primero, el sonido: ¿cómo lo grabáis?'],
    [2, 7, 'Cada uno con su micro.'],
    [0, 13, 'Y el editor sabe quién habla por su micro.']
  ];
  var total = SHOTS.reduce(function (s, x) { return s + x[1]; }, 0);
  var track = $('#track'), wave = $('#wave'), program = $('#program');
  var sub = $('#sub'), tc = $('#tc'), head = $('#playhead'), cams = $$('#cams .cam');

  SHOTS.forEach(function (s) {
    var b = document.createElement('b');
    b.className = 'c' + s[0];
    b.style.flex = s[1];
    track.appendChild(b);
  });
  for (var i = 0; i < 120; i++) {
    var u = document.createElement('u');
    var h = 18 + 70 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)) + 12 * Math.sin(i * 1.9);
    u.style.height = Math.max(8, Math.min(96, h)) + '%';
    wave.appendChild(u);
  }

  var current = -1;
  function show(t) { // t: 0..1 del trozo
    var acc = 0, idx = 0;
    for (var k = 0; k < SHOTS.length; k++) {
      acc += SHOTS[k][1] / total;
      if (t < acc) { idx = k; break; }
    }
    var x0 = track.offsetLeft, w = track.offsetWidth;
    head.style.left = (x0 + t * w) + 'px';
    var secs = 12 * 60 + 41 + Math.floor(t * total);
    tc.textContent = '00:' + String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
    if (idx !== current) {
      current = idx;
      var cam = SHOTS[idx][0];
      program.dataset.cam = cam;
      program.querySelector('.person').style.display = cam === 2 ? 'none' : '';
      sub.textContent = SHOTS[idx][2];
      cams.forEach(function (c) { c.classList.toggle('on', +c.dataset.cam === cam); });
    }
  }
  if (reduced) {
    show(0.12);
  } else {
    var LOOP = 26000, t0 = performance.now();
    (function frame(now) {
      show(((now - t0) % LOOP) / LOOP);
      requestAnimationFrame(frame);
    })(t0);
  }

  // ── Formulario de contacto ─────────────────────────────
  var form = $('#contact-form'), status = $('#form-status');
  function say(text, cls) { status.textContent = text; status.className = 'form-status ' + (cls || ''); }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements, ok = true;
    ['name', 'email', 'message'].forEach(function (n) {
      var bad = !f[n].value.trim() || !f[n].checkValidity();
      f[n].classList.toggle('bad', bad);
      if (bad && ok) { f[n].focus(); ok = false; }
    });
    if (!ok) { say('Revisa los campos marcados.', 'err'); return; }
    if (f._honey.value) { form.reset(); say('¡Mensaje enviado! Te responderé pronto.', 'ok'); return; }

    var btn = form.querySelector('button');
    btn.disabled = true;
    say('Enviando…');
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        message: f.message.value.trim(),
        _subject: 'Pod KST Editor · mensaje de ' + f.name.value.trim(),
        _template: 'table',
        _captcha: 'false'
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || String(res.d.success) !== 'true') throw new Error('rechazado');
        form.reset();
        say('¡Mensaje enviado! Te responderé pronto.', 'ok');
      })
      .catch(function () {
        say('No se ha podido enviar. Inténtalo de nuevo en un momento.', 'err');
      })
      .then(function () { btn.disabled = false; });
  });
})();
