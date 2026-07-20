/* =========================================================
   MWANGUKU FARMS LTD — SCRIPT.JS (API-connected)
   Modules:
   0. API Configuration
   1. Preloader
   2. Sticky Navigation + Mobile Menu
   3. Smooth Scroll + Active Link Tracking
   4. Reveal on Scroll (IntersectionObserver)
   5. Stats — fetched from API, then animated
   6. Products — fetched from API
   7. Gallery — fetched from API (render + lightbox)
   8. Testimonials — fetched from API (carousel)
   9. Contact Form — posts to API
   10. Ripple Effect
   11. Floating "Scroll to Top" visibility
   12. Misc (footer year)
   ========================================================= */

/* =========================================================
   0. API CONFIGURATION
   Point this at your deployed backend, e.g:
   "https://mwanguku-backend.onrender.com"
   Leave as an empty string if this file is served from the
   same domain as the API (same-origin deployment).
   ========================================================= */
const API_BASE_URL = ''; // <-- set your Render backend URL here

async function apiGet(path) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API request failed for ${path}:`, err.message);
    return null; // caller falls back to static/placeholder content
  }
}

function resolveImage(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
}

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================================
     1. PRELOADER
     ========================================================= */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('hidden'), 600);
  });
  setTimeout(() => preloader.classList.add('hidden'), 3000);

  /* =========================================================
     2. STICKY NAVIGATION + MOBILE MENU
     ========================================================= */
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  const toggleNavbarBg = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  toggleNavbarBg();
  window.addEventListener('scroll', toggleNavbarBg, { passive: true });

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* =========================================================
     3. SMOOTH SCROLL + ACTIVE LINK TRACKING
     ========================================================= */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-link');

  const setActiveLink = () => {
    let current = '';
    const offset = 140;
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - offset) current = section.getAttribute('id');
    });
    navAnchors.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  };
  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  /* =========================================================
     4. REVEAL ON SCROLL
     Re-usable so dynamically injected cards (products/gallery/
     testimonials) can be observed after they're rendered too.
     ========================================================= */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  const observeReveal = (root = document) => {
    root.querySelectorAll('.reveal-up:not(.in-view)').forEach(elToObserve => revealObserver.observe(elToObserve));
  };
  observeReveal();

  /* =========================================================
     5. STATS — fetch from API, then animate counters
     ========================================================= */
  const statNumbers = document.querySelectorAll('.stat-number');

  const animateCounter = (numberEl) => {
    const target = parseInt(numberEl.dataset.target, 10) || 0;
    const suffix = numberEl.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      numberEl.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else numberEl.textContent = target + suffix;
    };
    requestAnimationFrame(tick);
  };

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  async function loadStats() {
    const data = await apiGet('/api/stats');
    if (data && data.stats && data.stats.length && statNumbers.length) {
      // Map fetched stats onto the existing stat-number elements in order
      data.stats.forEach((stat, i) => {
        if (statNumbers[i]) {
          statNumbers[i].dataset.target = stat.value;
          statNumbers[i].dataset.suffix = stat.suffix || '';
          const labelEl = statNumbers[i].closest('.stat-card')?.querySelector('.stat-label');
          if (labelEl) labelEl.textContent = stat.label;
        }
      });
    }
    // Fall back silently to whatever is already hardcoded in the HTML
    statNumbers.forEach(numberEl => statObserver.observe(numberEl));
  }
  loadStats();

  /* =========================================================
     6. PRODUCTS — fetch from API and render into the grid
     Falls back to the static cards already in index.html if
     the API is unreachable or returns no products.
     ========================================================= */
  async function loadProducts() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    const data = await apiGet('/api/products');
    if (!data || !data.products || !data.products.length) return; // keep static fallback markup

    const eggSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16.5L8.5 11L12 14.5L16 10L20 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="7.5" r="1.75" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>`;

    grid.innerHTML = data.products.map(product => {
      const imgUrl = resolveImage(product.image);
      const imgContent = imgUrl
        ? `<img src="${imgUrl}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
        : `${eggSvg}`;
      return `
        <div class="product-card reveal-up">
          <div class="img-placeholder product-img">${imgContent}</div>
          <div class="product-body">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <a href="#contact" class="link-arrow">Learn More <span>&rarr;</span></a>
          </div>
        </div>
      `;
    }).join('');

    observeReveal(grid);
  }
  loadProducts();

  /* =========================================================
     7. GALLERY — fetch from API (falls back to placeholders)
     ========================================================= */
  const galleryGrid = document.getElementById('gallery-grid');
  const eggSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 16.5L8.5 11L12 14.5L16 10L20 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="7.5" r="1.75" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/></svg>`;

  const fallbackGalleryImages = [
    { label: 'Free Range Flock' }, { label: 'Fresh Egg Collection' }, { label: 'Farm Facilities' },
    { label: 'Broiler House' }, { label: 'Quality Inspection' }, { label: 'Delivery Fleet' },
  ];

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  function openLightbox(label, imgUrl) {
    lightboxImg.innerHTML = imgUrl
      ? `<img src="${imgUrl}" alt="${label}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
      : `${eggSvg}<span>${label}</span>`;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  async function loadGallery() {
    if (!galleryGrid) return;
    const data = await apiGet('/api/gallery');
    const images = (data && data.images && data.images.length)
      ? data.images.map(img => ({ label: img.title, url: resolveImage(img.image) }))
      : fallbackGalleryImages;

    galleryGrid.innerHTML = '';
    images.forEach(img => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = img.url
        ? `<div class="img-placeholder"><img src="${img.url}" alt="${img.label}" style="width:100%;height:100%;object-fit:cover;"></div>`
        : `<div class="img-placeholder">${eggSvg}<span>${img.label}</span></div>`;
      item.addEventListener('click', () => openLightbox(img.label, img.url));
      galleryGrid.appendChild(item);
    });
  }
  loadGallery();

  /* =========================================================
     8. TESTIMONIALS CAROUSEL — fetch from API (falls back to
     the static slides already written into index.html)
     ========================================================= */
  const testimonialTrack = document.getElementById('testimonial-track');
  const testimonialDots = document.getElementById('testimonial-dots');
  let slides = document.querySelectorAll('.testimonial-slide');
  let dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  let carouselTimer;

  const goToSlide = (index) => {
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = (index + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
  };
  const startCarousel = () => {
    clearInterval(carouselTimer);
    if (slides.length > 1) carouselTimer = setInterval(() => goToSlide(currentSlide + 1), 5500);
  };
  const wireDots = () => {
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); startCarousel(); }));
  };
  wireDots();
  if (slides.length) startCarousel();

  async function loadTestimonials() {
    const data = await apiGet('/api/testimonials'); // approved only
    if (!data || !data.testimonials || !data.testimonials.length || !testimonialTrack) return;

    const initials = (name) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    testimonialTrack.innerHTML = data.testimonials.map((t, i) => `
      <div class="testimonial-slide ${i === 0 ? 'active' : ''}">
        <p class="testimonial-quote">"${t.content}"</p>
        <div class="testimonial-author">
          <span class="author-avatar">${initials(t.name)}</span>
          <div><strong>${t.name}</strong><span>${t.position || ''}</span></div>
        </div>
      </div>
    `).join('');

    testimonialDots.innerHTML = data.testimonials.map((_, i) =>
      `<button class="dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Testimonial ${i + 1}"></button>`
    ).join('');

    // Re-select the freshly rendered elements and restart the carousel
    slides = document.querySelectorAll('.testimonial-slide');
    dots = document.querySelectorAll('.dot');
    currentSlide = 0;
    wireDots();
    startCarousel();
  }
  loadTestimonials();

  /* =========================================================
     9. CONTACT FORM — validates, then posts to the API
     ========================================================= */
  const form = document.getElementById('contact-form');
  const successMsg = document.getElementById('form-success');

  const validators = {
    name: (v) => v.trim().length >= 2 || 'Please enter your full name.',
    phone: (v) => /^[\d\s+()-]{7,15}$/.test(v.trim()) || 'Please enter a valid phone number.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
    message: (v) => v.trim().length >= 10 || 'Message should be at least 10 characters.',
  };

  const validateField = (field) => {
    const input = form.elements[field];
    const row = input.closest('.form-row');
    const errorEl = document.getElementById(`error-${field}`);
    const result = validators[field](input.value);

    if (result === true) {
      row.classList.remove('invalid');
      errorEl.textContent = '';
      return true;
    } else {
      row.classList.add('invalid');
      errorEl.textContent = result;
      return false;
    }
  };

  ['name', 'phone', 'email', 'message'].forEach(field => {
    form.elements[field].addEventListener('blur', () => validateField(field));
    form.elements[field].addEventListener('input', () => {
      if (form.elements[field].closest('.form-row').classList.contains('invalid')) validateField(field);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = ['name', 'phone', 'email', 'message'];
    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) {
      successMsg.classList.remove('visible');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value,
          phone: form.elements.phone.value,
          email: form.elements.email.value,
          message: form.elements.message.value,
        }),
      });
      if (!res.ok) throw new Error('Request failed');

      successMsg.textContent = "Thank you! Your message has been sent — we'll be in touch shortly.";
      successMsg.classList.add('visible');
      form.reset();
    } catch (err) {
      successMsg.textContent = "We couldn't send your message right now — please try WhatsApp or call us directly.";
      successMsg.style.background = '#FDECEA';
      successMsg.style.color = '#E53935';
      successMsg.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      setTimeout(() => successMsg.classList.remove('visible'), 6000);
    }
  });

  /* =========================================================
     10. RIPPLE EFFECT (buttons)
     ========================================================= */
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      circle.className = 'ripple-circle';
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 650);
    });
  });

  /* =========================================================
     11. FLOATING "SCROLL TO TOP" VISIBILITY
     ========================================================= */
  const scrollTopBtn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* =========================================================
     12. MISC — FOOTER YEAR
     ========================================================= */
  document.getElementById('year').textContent = new Date().getFullYear();

});
