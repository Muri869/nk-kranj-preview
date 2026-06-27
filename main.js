/* =====================================================================
   NK Kranj — glavna skripta
   Sticky glava · mobilni meni · scroll reveal
   ===================================================================== */
(function () {
	'use strict';

	/* ---------- Sticky glava ---------- */
	var header = document.querySelector('[data-header]');
	if (header) {
		var onScroll = function () {
			header.classList.toggle('is-stuck', window.scrollY > 40);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
	}

	/* ---------- Mobilni meni ---------- */
	var toggle = document.querySelector('[data-nav-toggle]');
	var mobileNav = document.querySelector('[data-mobile-nav]');
	if (toggle && mobileNav) {
		toggle.addEventListener('click', function () {
			var open = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', String(!open));
			mobileNav.hidden = open;
			document.body.style.overflow = open ? '' : 'hidden';
		});

		// Zapri ob kliku na povezavo.
		mobileNav.addEventListener('click', function (e) {
			if (e.target.closest('a')) {
				toggle.setAttribute('aria-expanded', 'false');
				mobileNav.hidden = true;
				document.body.style.overflow = '';
			}
		});
	}

	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* ---------- Hero parallax / fade ob drsenju ---------- */
	var heroContent = document.querySelector('.hero__content');
	var heroMedia = document.querySelector('.hero__media');
	if (!reduce && heroContent) {
		var ticking = false;
		var parallax = function () {
			var y = window.scrollY;
			if (y < window.innerHeight) {
				heroContent.style.transform = 'translateY(' + (y * 0.25) + 'px)';
				heroContent.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.7)));
				if (heroMedia) {
					heroMedia.style.transform = 'translateY(' + (y * 0.15) + 'px) scale(1.05)';
				}
			}
			ticking = false;
		};
		window.addEventListener('scroll', function () {
			if (!ticking) { window.requestAnimationFrame(parallax); ticking = true; }
		}, { passive: true });
	}

	/* ---------- Scroll progress (rdeča črta na vrhu) ---------- */
	var progress = document.querySelector('[data-progress]');
	if (progress) {
		var pTicking = false;
		var updateProgress = function () {
			var max = document.documentElement.scrollHeight - window.innerHeight;
			var ratio = max > 0 ? window.scrollY / max : 0;
			progress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, ratio)) + ')';
			pTicking = false;
		};
		updateProgress();
		window.addEventListener('scroll', function () {
			if (!pTicking) { window.requestAnimationFrame(updateProgress); pTicking = true; }
		}, { passive: true });
	}

	/* ---------- Marquee sponzorjev: podvoji vsebino za neskončno zanko ---------- */
	var marqueeTrack = document.querySelector('[data-marquee] .sponsors-track');
	if (marqueeTrack && !reduce) {
		marqueeTrack.innerHTML += marqueeTrack.innerHTML;
	}

	/* ---------- Lightbox za galerije ---------- */
	var galleries = document.querySelectorAll('[data-lightbox]');
	if (galleries.length) {
		var lb = document.createElement('div');
		lb.className = 'lightbox';
		lb.innerHTML = '<button class="lightbox__close" aria-label="Zapri">&times;</button>';
		var lbImg = document.createElement('img'); // src se nastavi ob kliku
		lbImg.alt = '';
		lb.appendChild(lbImg);
		document.body.appendChild(lb);
		var close = function () { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
		lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__close')) close(); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
		galleries.forEach(function (g) {
			g.addEventListener('click', function (e) {
				var img = e.target.closest('img');
				if (!img) return;
				lbImg.src = img.currentSrc || img.src;
				lb.classList.add('is-open');
				document.body.style.overflow = 'hidden';
			});
		});
	}

	/* ---------- Scroll reveal ---------- */
	var revealEls = document.querySelectorAll('[data-reveal]');

	if (reduce || !('IntersectionObserver' in window)) {
		revealEls.forEach(function (el) { el.classList.add('is-visible'); });
	} else {
		var io = new IntersectionObserver(function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

		revealEls.forEach(function (el) { io.observe(el); });
	}
})();
