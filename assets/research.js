// Interactive controls for the animated research diagrams:
// play / pause, a scrubber, and clickable stages that jump to a moment.
(function () {
  var CYCLE = 9; // seconds, matches the CSS animation loop
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('figure.diagram[data-stages]').forEach(function (fig) {
    var svg = fig.querySelector('svg.anim');
    if (!svg || reduce) return;
    var stages;
    try { stages = JSON.parse(fig.getAttribute('data-stages')); } catch (e) { return; }

    var bar = document.createElement('div');
    bar.className = 'player';
    bar.innerHTML =
      '<button type="button" class="pp" aria-label="Pause animation"><span class="i-pause"></span></button>' +
      '<input type="range" class="scrub" min="0" max="' + (CYCLE * 1000) + '" step="10" value="0" aria-label="Animation time">' +
      '<div class="stages" role="group" aria-label="Jump to a stage"></div>';
    fig.insertBefore(bar, fig.querySelector('figcaption'));
    var pp = bar.querySelector('.pp'), scrub = bar.querySelector('.scrub'), wrap = bar.querySelector('.stages');
    var hint = document.createElement('p');
    hint.className = 'player-hint';
    hint.textContent = 'Drag the slider or tap a stage to explore.';
    bar.after(hint);

    stages.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stage';
      b.innerHTML = '<span>' + (i + 1) + '</span>' + s[0];
      b.addEventListener('click', function () { pause(); seek(s[1] * 1000); });
      wrap.appendChild(b);
    });
    var btns = wrap.querySelectorAll('.stage');

    function anims() { return svg.getAnimations ? svg.getAnimations({ subtree: true }) : []; }
    function now() {
      var a = anims().filter(function (x) { var t = x.effect && x.effect.getTiming && x.effect.getTiming(); return t && t.duration === CYCLE * 1000 && !t.delay; })[0];
      if (!a || a.currentTime == null) return 0;
      return a.currentTime % (CYCLE * 1000);
    }
    var playing = true;
    function mark(ms) {
      scrub.value = ms;
      scrub.style.setProperty('--p', (ms / (CYCLE * 10)) + '%');
      var cur = -1;
      stages.forEach(function (s, i) { if (ms >= s[1] * 1000 - 250) cur = i; });
      btns.forEach(function (b, i) { b.classList.toggle('on', i === cur); b.setAttribute('aria-pressed', i === cur); });
    }
    function seek(ms) {
      anims().forEach(function (a) { a.currentTime = ms; });
      if (svg.setCurrentTime) svg.setCurrentTime(ms / 1000);
      mark(ms);
    }
    function pause() {
      playing = false;
      anims().forEach(function (a) { a.pause(); });
      if (svg.pauseAnimations) svg.pauseAnimations();
      pp.innerHTML = '<span class="i-play"></span>'; pp.setAttribute('aria-label', 'Play animation');
    }
    function play() {
      playing = true;
      anims().forEach(function (a) { a.play(); });
      if (svg.unpauseAnimations) svg.unpauseAnimations();
      pp.innerHTML = '<span class="i-pause"></span>'; pp.setAttribute('aria-label', 'Pause animation');
      tick();
    }
    function tick() { if (!playing) return; mark(now()); requestAnimationFrame(tick); }
    pp.addEventListener('click', function () { playing ? pause() : play(); });
    scrub.addEventListener('input', function () { pause(); seek(+scrub.value); });
    // start every diagram from the beginning when it first scrolls into view
    var started = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !started) { started = true; seek(0); play(); } });
    }, { threshold: 0.35 });
    io.observe(fig);
    tick();
  });
})();
