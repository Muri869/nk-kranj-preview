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

	/* ---------- Scroll reveal ---------- */
	var revealEls = document.querySelectorAll('[data-reveal]');
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
