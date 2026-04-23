/**
 * LaunchKit — main.js
 * Vanilla JavaScript for all interactive behavior.
 * No dependencies, no frameworks.
 */

'use strict';

/* =============================================================
   UTILITY: Run code after DOM is ready
   ============================================================= */
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

onReady(init);

function init() {
  initNav();
  initTabs();
  initFAQ();
  initReveal();
  initForm();
  initFileInput();
  initSmoothScroll();
  initPackageButtons();
  initSubmitSuccess();
  initDarkModeToggle();
}


/* =============================================================
   1. NAVIGATION
   - Adds .scrolled class on scroll for shadow/bg effect
   - Hamburger toggle for mobile menu
   ============================================================= */
function initNav() {
  const nav       = document.getElementById('nav');
  const toggle    = document.getElementById('nav-toggle');
  const mobile    = document.getElementById('nav-mobile');
  const mobileLinks = mobile ? mobile.querySelectorAll('.nav-mobile-link') : [];

  if (!nav) return;

  // Scroll: add .scrolled when past threshold
  const SCROLL_THRESHOLD = 10;
  let lastScrollY = 0;

  function handleScroll() {
    const y = window.scrollY;
    if (y > SCROLL_THRESHOLD && !nav.classList.contains('scrolled')) {
      nav.classList.add('scrolled');
    } else if (y <= SCROLL_THRESHOLD && nav.classList.contains('scrolled')) {
      nav.classList.remove('scrolled');
    }
    lastScrollY = y;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // Mobile hamburger toggle
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const isOpen = mobile.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      mobile.setAttribute('aria-hidden', String(!isOpen));
    });

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobile.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('aria-hidden', 'true');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && mobile.classList.contains('open')) {
        mobile.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobile.setAttribute('aria-hidden', 'true');
      }
    });
  }
}


/* =============================================================
   2. TABBED FEATURE SHOWCASE
   Desktop: shows/hides panels with a fade-up animation.
   Mobile (≤600px): horizontal carousel with touch swipe support.
   ============================================================= */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels  = document.querySelectorAll('.tab-panel');
  const track      = document.querySelector('.tab-track');
  const dots       = document.querySelectorAll('.tab-dot');

  if (!tabButtons.length) return;

  const MOBILE_BP = 600;

  function isMobile() { return window.innerWidth <= MOBILE_BP; }

  /* ── Set panel widths to container px (carousel fix) ──────── */
  function syncPanelWidths() {
    if (!track) return;
    const w = track.parentElement.offsetWidth;
    tabPanels.forEach(p => { p.style.width = w + 'px'; });
  }

  /* ── Activate a tab by index ─────────────────────────────── */
  function activateTab(index) {
    const btn         = tabButtons[index];
    const targetId    = btn ? btn.getAttribute('data-target') : null;
    const targetPanel = targetId ? document.getElementById(targetId) : null;

    // Update button states
    tabButtons.forEach((b, i) => {
      b.classList.toggle('active', i === index);
      b.setAttribute('aria-selected', String(i === index));
    });

    // Update dot indicators
    dots.forEach((d, i) => d.classList.toggle('active', i === index));

    if (isMobile() && track) {
      // ── Mobile: slide the track using pixel widths ──────────
      tabPanels.forEach(p => { p.hidden = false; });
      syncPanelWidths();
      const panelPx = track.parentElement.offsetWidth;
      track.style.transform = `translateX(-${index * panelPx}px)`;
    } else {
      // ── Desktop: hide/show with fade-up animation ───────────
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        panel.hidden = true;
      });
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.hidden = false;
        targetPanel.style.opacity   = '0';
        targetPanel.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            targetPanel.style.transition = 'opacity 300ms ease, transform 300ms ease';
            targetPanel.style.opacity    = '1';
            targetPanel.style.transform  = 'translateY(0)';
          });
        });
      }
    }
  }

  /* ── Button clicks ───────────────────────────────────────── */
  tabButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => activateTab(index));
  });

  /* ── Dot clicks ──────────────────────────────────────────── */
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => activateTab(index));
  });

  /* ── Touch swipe (mobile only) ───────────────────────────── */
  if (track) {
    let touchStartX = 0;
    let currentIndex = 0;

    function getCurrentIndex() {
      return [...tabButtons].findIndex(b => b.classList.contains('active'));
    }

    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', e => {
      if (!isMobile()) return;
      const dx    = e.changedTouches[0].clientX - touchStartX;
      const total = tabButtons.length;
      const idx   = getCurrentIndex();
      if (dx < -40 && idx < total - 1) activateTab(idx + 1);
      if (dx >  40 && idx > 0)         activateTab(idx - 1);
    }, { passive: true });
  }

  /* ── On resize: re-sync widths and active position ─────────── */
  window.addEventListener('resize', () => {
    const idx = [...tabButtons].findIndex(b => b.classList.contains('active'));
    activateTab(idx >= 0 ? idx : 0);
  }, { passive: true });

  // Initial sync on load
  syncPanelWidths();
}


/* =============================================================
   3. FAQ ACCORDION
   Animates open/close via max-height.
   Only one item open at a time (optional — currently allows multiple).
   ============================================================= */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', () => {
      const isExpanded = question.getAttribute('aria-expanded') === 'true';

      // Toggle this item
      if (isExpanded) {
        closeFaqItem(question, answer);
      } else {
        openFaqItem(question, answer);
      }
    });
  });
}

function openFaqItem(question, answer) {
  question.setAttribute('aria-expanded', 'true');
  answer.classList.add('open');
}

function closeFaqItem(question, answer) {
  question.setAttribute('aria-expanded', 'false');
  answer.classList.remove('open');
}


/* =============================================================
   4. SCROLL REVEAL
   Uses IntersectionObserver to fade-up elements with .reveal
   as they enter the viewport. Removes the observer once triggered.
   ============================================================= */
function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');

  if (!revealEls.length) return;

  // If IntersectionObserver not supported, just show everything immediately
  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // Fire once only
        }
      });
    },
    {
      threshold: 0.12,      // trigger when 12% of the element is visible
      rootMargin: '0px 0px -40px 0px'  // slight offset from bottom of viewport
    }
  );

  revealEls.forEach(el => observer.observe(el));
}


/* =============================================================
   5. INTAKE FORM HANDLING
   Client-side validation and success state display.
   NOTE: This is a static site — no server-side processing.
   To actually receive form submissions, integrate with a form
   service such as Formspree (https://formspree.io), AWS API
   Gateway, or a similar endpoint.
   Replace the submitForm function body with your fetch() call.
   ============================================================= */
/*
 * STRIPE PAYMENT LINKS
 * After the intake form is submitted, Formsubmit emails you the details
 * and redirects the user straight to the Stripe payment page for their
 * selected package. Replace each placeholder URL with your real Stripe
 * Payment Link from https://dashboard.stripe.com/payment-links
 */
const STRIPE_LINKS = {
  light:    'https://buy.stripe.com/REPLACE_LIGHT_LINK',
  full:     'https://buy.stripe.com/REPLACE_FULL_LINK',
  ultimate: 'https://buy.stripe.com/REPLACE_ULTIMATE_LINK',
  consult:  'https://buy.stripe.com/REPLACE_CONSULT_LINK',
};

function initForm() {
  const form          = document.getElementById('intake-form');
  const submitBtn     = document.getElementById('form-submit-btn');
  const packageSelect = document.getElementById('f-package');
  const nextInput     = form ? form.querySelector('[name="_next"]') : null;

  if (!form) return;

  form.addEventListener('submit', (e) => {
    // Client-side validation — prevent submit if invalid
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      clearFieldError(field);
      if (!field.value.trim()) {
        showFieldError(field, 'This field is required.');
        isValid = false;
      } else if (field.type === 'email' && !isValidEmail(field.value)) {
        showFieldError(field, 'Please enter a valid email address.');
        isValid = false;
      }
    });

    if (!isValid) {
      e.preventDefault();
      const firstError = form.querySelector('.form-field-error');
      if (firstError) {
        firstError.previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Point _next at the Stripe Payment Link for the selected package.
    // Formsubmit will email you the intake data then redirect the user to pay.
    if (nextInput && packageSelect) {
      const stripeUrl = STRIPE_LINKS[packageSelect.value];
      if (stripeUrl) nextInput.value = stripeUrl;
    }

    // Show loading state — form submits natively to Formsubmit (supports file uploads)
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;
  });
}

/*
 * initSubmitSuccess — detects the ?submitted=1 redirect from Formsubmit
 * and shows the success state without a full page reload experience.
 * Formsubmit redirects back here after a native POST (required for file uploads).
 */
function initSubmitSuccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('submitted') !== '1') return;

  const form      = document.getElementById('intake-form');
  const successEl = document.getElementById('form-success');

  if (form && successEl) {
    form.style.display = 'none';
    successEl.hidden   = false;
    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Clean the URL
  history.replaceState(null, '', window.location.pathname + '#contact');
}

/** Show an error message below a field */
function showFieldError(field, message) {
  field.style.borderColor = '#C0392B';
  const err = document.createElement('span');
  err.className   = 'form-field-error';
  err.textContent = message;
  err.style.cssText = 'display:block; font-size:0.8125rem; color:#C0392B; margin-top:4px;';
  field.parentNode.appendChild(err);
}

/** Clear error state from a field */
function clearFieldError(field) {
  field.style.borderColor = '';
  const existing = field.parentNode.querySelector('.form-field-error');
  if (existing) existing.remove();
}

/** Show a global error banner above the submit button */
function showGlobalError(form, message) {
  const existing = form.querySelector('.form-global-error');
  if (existing) existing.remove();

  const err = document.createElement('p');
  err.className   = 'form-global-error';
  err.textContent = message;
  err.style.cssText = 'font-size:0.875rem; color:#C0392B; margin-top:8px;';
  const submitRow = form.querySelector('.form-row-submit');
  if (submitRow) submitRow.prepend(err);
}

/** Simple email format check */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* =============================================================
   6. FILE INPUT DISPLAY
   Updates the file label text when a file is selected.
   ============================================================= */
function initFileInput() {
  const fileInput = document.getElementById('f-resume-upload');
  const fileText  = document.getElementById('form-file-text');

  if (!fileInput || !fileText) return;

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      const name = fileInput.files[0].name;
      // Truncate long filenames
      fileText.textContent = name.length > 32 ? name.slice(0, 30) + '…' : name;
    } else {
      fileText.textContent = 'Choose file…';
    }
  });
}


/* =============================================================
   7. SMOOTH SCROLLING
   Handles anchor links with hash targets for browsers that
   don't support CSS scroll-behavior, and offsets for sticky nav.
   ============================================================= */
function initSmoothScroll() {
  const NAV_OFFSET = 72; // px — matches nav height + a bit of breathing room

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id     = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);

      if (!target) return;

      e.preventDefault();

      const targetTop = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });

      // Update URL without triggering scroll
      history.pushState(null, '', '#' + id);
    });
  });
}


/* =============================================================
   8. PACKAGE BUTTON INTERACTIONS
   When a "Get Started" button on a package card is clicked,
   it pre-selects that package in the contact form and scrolls there.
   ============================================================= */
function initPackageButtons() {
  const packageBtns = document.querySelectorAll('.package-btn[data-package]');
  const packageSelect = document.getElementById('f-package');

  if (!packageBtns.length || !packageSelect) return;

  packageBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pkg = btn.getAttribute('data-package');
      if (!pkg) return;

      // Map display name to select value
      const valueMap = {
        'Light':   'light',
        'Full':    'full',
        'Ultimate':'ultimate',
        'Consult': 'consult'
      };

      const selectValue = valueMap[pkg];
      if (selectValue) {
        packageSelect.value = selectValue;

        // Brief visual feedback on the select
        packageSelect.style.borderColor = 'var(--color-accent)';
        packageSelect.style.boxShadow   = '0 0 0 3px rgba(75,107,78,0.12)';
        setTimeout(() => {
          packageSelect.style.borderColor = '';
          packageSelect.style.boxShadow   = '';
        }, 1800);
      }
      // Smooth scroll is handled by initSmoothScroll via the href="#contact"
    });
  });
}


/* =============================================================
   9. DARK MODE TOGGLE
   Manual toggle stores preference in localStorage.
   Works alongside OS-level prefers-color-scheme.
   ============================================================= */
function initDarkModeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const html = document.documentElement;

  // Apply stored preference on load (before paint if possible)
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') {
    html.setAttribute('data-theme', 'dark');
  } else if (stored === 'light') {
    html.setAttribute('data-theme', 'light');
  }

  toggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark'
      || (!html.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      html.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      toggle.setAttribute('aria-label', 'Switch to dark mode');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      toggle.setAttribute('aria-label', 'Switch to light mode');
    }
  });
}
