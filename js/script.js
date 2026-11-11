/* Shared progressive enhancements. All page content and links work without JS. */
'use strict';
(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const mobile = window.matchMedia('(max-width: 1000px)');
  function closeMenu() {
    nav.classList.toggle('is-collapsed', mobile.matches);
    menu.setAttribute('aria-expanded', 'false');
  }
  menu.hidden = false;
  closeMenu();
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-collapsed', expanded);
  });
  mobile.addEventListener('change', closeMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (mobile.matches && !event.target.closest('.site-header')) closeMenu();
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.querySelectorAll('[data-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  // Content is visible by default. Only animate elements below the viewport.
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!motion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-waiting');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('is-waiting');
        observer.observe(element);
      }
    });
    motion.addEventListener('change', () => {
      if (motion.matches) {
        observer.disconnect();
        document.querySelectorAll('.is-waiting').forEach(el => el.classList.remove('is-waiting'));
      }
    });
  }

  const form = document.querySelector('#enquiry-form');
  if (!form) return;
  const button = document.querySelector('#submit-enquiry');
  const status = document.querySelector('#form-status');
  const settings = window.SITE_CONFIG?.enquiry || {};
  const params = new URLSearchParams(window.location.search);
  // Accept only an existing select option; URL text is never inserted as HTML.
  for (const [parameter, id] of [['product', 'product'], ['business', 'business']]) {
    const select = document.getElementById(id);
    const value = params.get(parameter);
    if ([...select.options].some(option => option.value === value)) select.value = value;
  }
  let endpoint = null;
  try {
    const url = new URL(settings.webhookUrl || '', window.location.href);
    if (settings.webhookUrl && settings.webhookVerified === true &&
        url.protocol === 'https:' && !url.username && !url.password) endpoint = url.href;
  } catch { /* Invalid configuration keeps online submission disabled. */ }
  const idleText = 'Send enquiry ↗';
  if (endpoint) {
    button.disabled = false;
    button.textContent = idleText;
    document.querySelector('#form-note').textContent = 'Share your requirements with our team. Fields marked * are required.';
  }
  let sending = false;
  let deliveredFingerprint = null;
  let pendingFingerprint = null;
  let requestId = null;
  const message = (text, state) => {
    status.textContent = text;
    status.dataset.state = state;
  };
  form.addEventListener('input', event => {
    if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!endpoint || sending) return;
    const name = document.getElementById('name');
    const phone = document.getElementById('phone');
    const body = document.getElementById('message');
    name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(/^[+\d\s().-]+$/.test(phone.value) && digits.length >= 7 && digits.length <= 15 ? '' : 'Please enter a valid phone number with 7–15 digits.');
    body.setCustomValidity(body.value.trim().length >= 10 ? '' : 'Please enter a message of at least 10 characters.');
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('website')) return;
    const fields = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      email: String(data.get('email')).trim(),
      businessType: String(data.get('businessType')),
      productInterest: String(data.get('productInterest')),
      message: body.value.trim(),
      consent: data.get('consent') === 'on'
    };
    const fingerprint = JSON.stringify(fields);
    if (fingerprint === deliveredFingerprint) {
      message('This enquiry has already been received. Please change the details if you need to send another.', 'success');
      return;
    }
    if (pendingFingerprint !== fingerprint) {
      pendingFingerprint = fingerprint;
      requestId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    message('Sending your enquiry…', 'pending');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), settings.timeoutMs || 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({ schemaVersion: 1, requestId, source: 'shree-balaji-agro-website', submittedAt: new Date().toISOString(), ...fields })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Not acknowledged');
      deliveredFingerprint = fingerprint;
      message('Thank you. Your enquiry has been received. Our team will be in touch.', 'success');
      // Keep entered details visible; prevent a second identical enquiry this session.
    } catch {
      message('We couldn’t confirm delivery. Your details are still here. Please call, email or WhatsApp our team before trying again.', 'error');
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = idleText;
      form.removeAttribute('aria-busy');
    }
  });
})();
