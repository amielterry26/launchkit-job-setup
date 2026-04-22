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
   Switches between Resume, Collateral, and Profiles panels.
   Handles aria attributes for accessibility.
   ============================================================= */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels  = document.querySelectorAll('.tab-panel');

  if (!tabButtons.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;

      // Deactivate all tabs
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      // Hide all panels
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        panel.hidden = true;
      });

      // Activate clicked tab
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Show target panel
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.hidden = false;

        // Subtle entrance animation: reset opacity and re-trigger
        targetPanel.style.opacity = '0';
        targetPanel.style.transform = 'translateY(8px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            targetPanel.style.transition = 'opacity 300ms ease, transform 300ms ease';
            targetPanel.style.opacity   = '1';
            targetPanel.style.transform = 'translateY(0)';
          });
        });
      }
    });
  });
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
function initForm() {
  const form        = document.getElementById('intake-form');
  const submitBtn   = document.getElementById('form-submit-btn');
  const successEl   = document.getElementById('form-success');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic client-side validation
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
      // Scroll to first error
      const firstError = form.querySelector('.form-field-error');
      if (firstError) {
        firstError.previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Loading state
    submitBtn.textContent = 'Sending…';
    submitBtn.disabled = true;

    try {
      await submitForm(form);

      // Show success state
      form.style.display    = 'none';
      successEl.hidden      = false;

      // Scroll to success message
      successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error('Form submission error:', err);
      submitBtn.textContent = 'Submit Intake Form';
      submitBtn.disabled    = false;
      showGlobalError(form, 'Something went wrong. Please try again or send an email directly.');
    }
  });
}

/**
 * submitForm — Formspree integration.
 *
 * SETUP INSTRUCTIONS (takes about 2 minutes):
 * 1. Create a free account at https://formspree.io
 * 2. Click "New Form" — give it a name like "LaunchKit Intake"
 * 3. Formspree gives you a Form ID that looks like: xkgnopqr
 * 4. Replace 'YOUR_FORM_ID' in FORMSPREE_ENDPOINT below
 * 5. Also update the form's action attribute in index.html
 *    (search for: action="https://formspree.io/f/YOUR_FORM_ID")
 * 6. Every submission will be emailed to your Formspree account email
 *
 * NOTE ON FILE UPLOADS:
 * File upload support requires Formspree's paid plan (Gold).
 * On the free plan the resume file field is silently ignored.
 * Workaround: ask clients to paste a Google Drive share link
 * in the notes textarea instead, and optionally remove the
 * file input from the form.
 *
 * ALTERNATIVE BACKENDS:
 * Basin (usebasin.com), Netlify Forms, EmailJS, or your own
 * endpoint all work — just swap the fetch() call below.
 */
async function submitForm(form) {
  // ================================================================
  // REPLACE 'YOUR_FORM_ID' with your actual Formspree Form ID.
  // Example: 'https://formspree.io/f/xkgnopqr'
  // ================================================================
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

  const res = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    let errorMsg = 'Submission failed. Please try again.';
    try {
      const data = await res.json();
      if (data.errors && data.errors.length) {
        errorMsg = data.errors.map(e => e.message).join(', ');
      }
    } catch (_) { /* ignore JSON parse failures */ }
    throw new Error(errorMsg);
  }
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
