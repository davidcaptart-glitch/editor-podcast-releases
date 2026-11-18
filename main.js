/* Pod KST Editor — landing. Sin dependencias. */
(function () {
  'use strict';

  // ── Ajustes ────────────────────────────────────────────
  var RELEASES_REPO = 'davidcaptart-glitch/editor-podcast-releases';
  // Formulario de contacto: FormSubmit reenvía los mensajes al correo. Se usa el alias
  // que da FormSubmit al activar el formulario, para no enseñar la dirección.
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/da34c382ff3aa01dd5fcaa4dfa1d2c6b';

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

  // ── Vídeo: se reproduce (sin sonido) cuando se ve, y pasos para saltar ──
  var video = $('#demo'), soundBtn = $('#sound'), steps = $$('#chapters button');
  var times = steps.map(function (b) { return parseFloat(b.dataset.t); });
  if (reduced) {
    video.controls = true;
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var pr = video.play();
          if (pr && pr.catch) pr.catch(function () { video.controls = true; });
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 }).observe(video);
  } else {
    video.controls = true;
  }
  video.addEventListener('click', function () { if (video.paused) video.play(); else video.pause(); });
  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    soundBtn.setAttribute('aria-pressed', String(!video.muted));
    soundBtn.querySelector('span').textContent = video.muted ? 'Activar sonido' : 'Quitar sonido';
    if (video.paused) video.play();
  });
  steps.forEach(function (b, i) {
    b.addEventListener('click', function () { video.currentTime = times[i]; video.play(); });
  });
  video.addEventListener('timeupdate', function () {
    var t = video.currentTime, cur = -1;
    for (var k = 0; k < times.length; k++) if (t >= times[k] - 0.05) cur = k;
    if (t >= 27.5) cur = -1; // cierre con el logo
    steps.forEach(function (b, k) { b.classList.toggle('on', k === cur); });
  });

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
