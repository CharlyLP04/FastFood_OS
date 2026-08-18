/**
 * FASTFOOD OS — script.js
 * ─────────────────────────────────────────────────────────
 * Módulos:
 *  1. Navbar: scroll + hamburguesa
 *  2. FAQ: acordeón accesible
 *  3. Animaciones de entrada (IntersectionObserver)
 *  4. Contadores animados de números
 *  5. CTA: preparado para Google Forms
 *  6. Scroll suave con offset de navbar
 * ─────────────────────────────────────────────────────────
 */

/* ================================================================
   CONFIGURACIÓN GLOBAL
================================================================ */

/**
 * URL del Google Form para el CTA.
 * Cuando tu formulario esté listo, pega el link aquí.
 * Ejemplo: 'https://forms.gle/TU_LINK_AQUI'
 * Los botones se actualizarán automáticamente.
 */
const FORM_URL = '';


/* ================================================================
   1. NAVBAR — SCROLL + HAMBURGUESA
================================================================ */

const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

/**
 * Añade clase "scrolled" cuando el usuario baja de 20px,
 * lo que activa borde y sombra en el navbar (definidos en CSS).
 */
function handleNavbarScroll() {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleNavbarScroll, { passive: true });
handleNavbarScroll(); // revisar al cargar por si empieza scrolleado

/**
 * Hamburguesa: alterna visibilidad del menú en móvil
 * y actualiza aria-expanded para accesibilidad.
 */
hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  navLinks.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

/**
 * Cierra el menú al hacer clic en cualquier enlace de nav.
 */
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

/**
 * Cierra el menú si el usuario hace clic fuera de él.
 */
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target)) {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});


/* ================================================================
   2. FAQ — ACORDEÓN ACCESIBLE
================================================================ */

/**
 * Implementación de acordeón sin librerías.
 * Usa atributos aria-expanded y el atributo "hidden" en el contenido,
 * que es la forma semántica recomendada.
 * Solo un ítem puede estar abierto a la vez.
 */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const button = item.querySelector('.faq-q');
    const answerId = button.getAttribute('aria-controls');
    const answer   = document.getElementById(answerId);

    if (!button || !answer) return;

    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // Cerrar todos los demás ítems primero
      faqItems.forEach(otherItem => {
        const otherBtn = otherItem.querySelector('.faq-q');
        const otherId  = otherBtn?.getAttribute('aria-controls');
        const otherAns = otherId ? document.getElementById(otherId) : null;

        if (otherBtn && otherAns && otherBtn !== button) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherAns.hidden = true;
        }
      });

      // Alternar el ítem actual
      const nextState = !isExpanded;
      button.setAttribute('aria-expanded', String(nextState));
      answer.hidden = !nextState;
    });
  });
}

initFAQ();


/* ================================================================
   3. ANIMACIONES DE ENTRADA — IntersectionObserver
================================================================ */

/**
 * Observa todos los elementos con [data-reveal] y les añade
 * la clase "visible" cuando entran en el viewport.
 * El delay escalonado crea efecto cascada en grids.
 */
function initRevealAnimations() {
  const targets = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window)) {
    // Fallback: mostrar todo sin animación en navegadores antiguos
    targets.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const delay = parseInt(entry.target.dataset.delay || '0', 10);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);

      // Dejar de observar una vez animado
      observer.unobserve(entry.target);
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
  });

  /**
   * Asignar delay escalonado a elementos dentro del mismo contenedor.
   * Se agrupa por el selector de la clase del elemento.
   */
  const groups = [
    { selector: '.problema-card', delay: 80 },
    { selector: '.feature-card',  delay: 70 },
    { selector: '.benefit-card',  delay: 70 },
    { selector: '.testi-card',    delay: 90 },
    { selector: '.faq-item',      delay: 60 },
    { selector: '.dash-card',     delay: 80 },
    { selector: '.assembly-step', delay: 100 },
  ];

  groups.forEach(({ selector, delay }) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.dataset.delay = String(i * delay);
    });
  });

  targets.forEach(el => observer.observe(el));
}

initRevealAnimations();


/* ================================================================
   4. CONTADORES ANIMADOS DE NÚMEROS
================================================================ */

/**
 * Anima los elementos con [data-count] desde 0 hasta su valor objetivo.
 * Usa easing cuadrático para una animación suave.
 * Se activa cuando el elemento entra en viewport.
 */
function animateCounter(element, target, duration = 1800) {
  const start      = performance.now();
  const isDecimal  = target % 1 !== 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Easing: ease-out cuadrático
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = eased * target;

    element.textContent = isDecimal
      ? current.toFixed(1)
      : Math.floor(current).toLocaleString('es-MX');

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = isDecimal
        ? target.toFixed(1)
        : target.toLocaleString('es-MX');
    }
  }

  requestAnimationFrame(step);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');

  if (!counters.length) return;

  if (!('IntersectionObserver' in window)) {
    counters.forEach(el => {
      animateCounter(el, parseFloat(el.dataset.count));
    });
    return;
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const target = parseFloat(entry.target.dataset.count);
      animateCounter(entry.target, target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));
}

initCounters();


/* ================================================================
   5. CTA — BOTONES CONECTADOS A GOOGLE FORMS
================================================================ */

/**
 * Si FORM_URL tiene valor, abre el formulario al hacer clic.
 * Si está vacío, muestra una notificación tipo toast.
 *
 * Para activar:
 *   1. Crea tu Google Form en forms.google.com
 *   2. Copia el link para compartir
 *   3. Pégalo en la constante FORM_URL al inicio del archivo
 */
function initCTAButtons() {
  const ctaIds  = ['hero-cta', 'final-cta'];

  ctaIds.forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      if (FORM_URL) {
        // Link disponible: actualizar href y dejar que el navegador navegue
        this.setAttribute('href', FORM_URL);
      } else {
        // Sin link aún: mostrar aviso y cancelar la navegación
        e.preventDefault();
        showToast('🚧 Formulario de contacto próximamente disponible');
      }
    });
  });
}

/**
 * Muestra una notificación toast temporal.
 * @param {string} message — Texto a mostrar
 * @param {number} duration — Duración en ms (default: 3000)
 */
function showToast(message, duration = 3000) {
  // Evitar múltiples toasts simultáneos
  const existing = document.getElementById('ab-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ab-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  // Estilos inline para que sea autocontenido
  Object.assign(toast.style, {
    position:       'fixed',
    bottom:         '2rem',
    left:           '50%',
    transform:      'translateX(-50%) translateY(10px)',
    background:     '#1F1F1F',
    color:          '#F5F5F5',
    border:         '1px solid rgba(255,255,255,0.1)',
    padding:        '0.8rem 1.6rem',
    borderRadius:   '999px',
    fontSize:       '0.88rem',
    fontFamily:     "'DM Sans', system-ui, sans-serif",
    fontWeight:     '500',
    boxShadow:      '0 8px 32px rgba(0,0,0,0.4)',
    zIndex:         '9999',
    opacity:        '0',
    transition:     'opacity 0.3s ease, transform 0.3s ease',
    whiteSpace:     'nowrap',
  });

  document.body.appendChild(toast);

  // Animar entrada
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
  });

  // Animar salida y remover
  setTimeout(() => {
    toast.style.opacity   = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

initCTAButtons();


/* ================================================================
   6. SCROLL SUAVE CON OFFSET DE NAVBAR
================================================================ */

/**
 * Intercepta todos los enlaces internos (#sección) y calcula
 * la posición de scroll considerando el alto fijo del navbar (64px),
 * más un margen adicional de 16px para respiración visual.
 */
function initSmoothScroll() {
  const NAVBAR_HEIGHT = 64;
  const EXTRA_OFFSET  = 16;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');

      // Ignorar "#" solo (sin destino)
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      const targetTop = targetEl.getBoundingClientRect().top
        + window.scrollY
        - NAVBAR_HEIGHT
        - EXTRA_OFFSET;

      window.scrollTo({
        top:      Math.max(0, targetTop),
        behavior: 'smooth',
      });
    });
  });
}

initSmoothScroll();