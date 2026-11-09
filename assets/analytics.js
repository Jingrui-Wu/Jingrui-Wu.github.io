// Shared GA4 setup. The Google tag loads only after the visitor opts in.
(function () {
  'use strict';
  var measurementId = 'G-8D44YTGGTQ';
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) return;

  var preferenceKey = 'jw-analytics-consent-v1';
  var maxAge = 180 * 24 * 60 * 60 * 1000;
  var started = false;
  var banner;
  var previousFocus;

  function readPreference() {
    try {
      var saved = JSON.parse(localStorage.getItem(preferenceKey));
      if (saved && Date.now() - saved.at < maxAge &&
          (saved.value === 'granted' || saved.value === 'denied')) return saved.value;
    } catch (e) { /* A storage restriction must not break the page. */ }
    return null;
  }

  function cleanUrl(value) {
    try {
      var url = new URL(value);
      return url.origin + url.pathname;
    } catch (e) { return ''; }
  }

  function enableAnalytics() {
    window['ga-disable-' + measurementId] = false;
    if (started) {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      return;
    }
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: window.location.hostname,
      cookie_expires: maxAge / 1000,
      cookie_update: false,
      page_location: cleanUrl(window.location.href),
      page_referrer: cleanUrl(document.referrer)
    });
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(tag);
  }

  function disableAnalytics() {
    window['ga-disable-' + measurementId] = true;
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['', '; domain=' + window.location.hostname, '; domain=.' + window.location.hostname]
        .forEach(function (domain) {
          document.cookie = name + '=; max-age=0; path=/' + domain + '; SameSite=Lax; Secure';
        });
    });
  }

  function applyPreference(value) {
    if (value === 'granted') enableAnalytics();
    else disableAnalytics();
  }

  function choose(value) {
    try { localStorage.setItem(preferenceKey, JSON.stringify({ value: value, at: Date.now() })); }
    catch (e) { /* The choice still applies to this page if storage is unavailable. */ }
    applyPreference(value);
    banner.hidden = true;
    if (previousFocus) previousFocus.focus();
  }

  function buildControls() {
    banner = document.createElement('section');
    banner.className = 'analytics-consent';
    banner.setAttribute('aria-label', 'Optional website analytics');
    banner.innerHTML = '<p>May I use Google Analytics cookies to understand visits to my research website? ' +
      'You can change your choice at any time. <a href="/privacy.html">Privacy details</a></p>' +
      '<div class="analytics-actions"><button type="button" data-consent="denied">Decline</button>' +
      '<button type="button" data-consent="granted">Accept analytics</button></div>';
    banner.querySelectorAll('button').forEach(function (button) {
      button.addEventListener('click', function () { choose(button.dataset.consent); });
    });
    var saved = readPreference();
    banner.hidden = saved !== null;
    document.body.appendChild(banner);
    document.querySelectorAll('[data-analytics-settings]').forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', function () {
        previousFocus = button;
        banner.hidden = false;
        banner.querySelector('button').focus();
      });
    });
    applyPreference(saved);
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== preferenceKey) return;
    var saved = readPreference();
    applyPreference(saved);
    if (banner) banner.hidden = saved !== null;
  });
  buildControls();
})();
