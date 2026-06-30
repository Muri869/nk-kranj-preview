/* =====================================================================
   NK Kranj — glavna skripta
   Sticky glava · mobilni meni · scroll reveal
   ===================================================================== */
(function () {
	'use strict';

	/* ---------- Pokvarjene vsebinske slike (s stare strani) — čist videz ----------
	   Dokler mediji niso preneseni lokalno, se slike, ki se ne naložijo, skupaj z
	   napisom skrijejo, da ni »napisov brez slik«. */
	(function () {
		var imgs = document.querySelectorAll('.entry-content img, .prose img');
		var hide = function (img) {
			var fig = img.closest('figure, .wp-caption');
			(fig || img).style.display = 'none';
		};
		imgs.forEach(function (img) {
			if (img.complete && img.naturalWidth === 0) { hide(img); }
			else { img.addEventListener('error', function () { hide(img); }); }
		});
	})();

	/* ---------- Hero vrtiljak novic ----------
	   Napredovanje poganja zanesljiv časovnik (setTimeout), obroč okoli zavihka
	   je le vizualni prikaz napredka (Web Animations API). Tako se samodejni
	   tek zažene ob nalaganju tudi, če WAAPI »onfinish« ne sproži (nekateri
	   brskalniki ga ob neaktivnem zavihku zadržijo). */
	(function () {
		var hc = document.querySelector('[data-hero-carousel]');
		if (!hc) return;
		var slides = hc.querySelectorAll('.hero-slide');
		var tabs = hc.querySelectorAll('.hero-tab');
		var n = slides.length;
		if (n < 1) return;
		var cur = 0, timer = null, ring = null, startedAt = 0, remaining = 6000;
		var DUR = 6000;
		var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var now = function () { return (window.performance && performance.now) ? performance.now() : Date.now(); };

		var paintRing = function () {
			if (ring) { try { ring.cancel(); } catch (e) {} ring = null; }
			if (reduce || n < 2) return;
			var rect = tabs[cur].querySelector('.hero-tab__ring rect');
			if (!rect || typeof rect.animate !== 'function') return;
			// Odštevalnik: obroč se PRAZNI (poln → prazen) — ob prihodu takoj viden, jasen »čas do menjave«.
			ring = rect.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: 100 }], { duration: DUR, easing: 'linear', fill: 'forwards' });
		};
		var tabsWrap = tabs[0].parentNode;
		var scrollActiveIntoView = function () {
			// Le na mobilnem, ko je trak zavihkov vodoravno drsljiv.
			if (tabsWrap.scrollWidth <= tabsWrap.clientWidth + 4) return;
			var wrapRect = tabsWrap.getBoundingClientRect();
			var tabRect = tabs[cur].getBoundingClientRect();
			tabsWrap.scrollBy({ left: tabRect.left - wrapRect.left - 12, behavior: 'smooth' });
		};
		var setActive = function (idx) {
			slides[cur].classList.remove('is-active'); slides[cur].setAttribute('aria-hidden', 'true');
			tabs[cur].classList.remove('is-active'); tabs[cur].setAttribute('aria-selected', 'false');
			cur = idx;
			slides[cur].classList.add('is-active'); slides[cur].removeAttribute('aria-hidden');
			tabs[cur].classList.add('is-active'); tabs[cur].setAttribute('aria-selected', 'true');
			scrollActiveIntoView();
		};
		var schedule = function (ms) {
			if (timer) { clearTimeout(timer); timer = null; }
			if (reduce || n < 2) return;
			remaining = ms;
			startedAt = now();
			timer = window.setTimeout(function () { go(cur + 1); }, ms);
		};
		var go = function (idx) { setActive((idx + n) % n); paintRing(); schedule(DUR); };

		var pause = function () {
			if (!timer) return;
			clearTimeout(timer); timer = null;
			remaining = Math.max(0, remaining - (now() - startedAt));
			if (ring) { try { ring.pause(); } catch (e) {} }
		};
		var resume = function () {
			if (timer || reduce || n < 2) return;
			if (ring) { try { ring.play(); } catch (e) {} }
			schedule(remaining > 0 ? remaining : DUR);
		};

		tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
		if (n > 1) {
			// Banner teče naprej tudi ob premiku miške čezenj (brez pause-on-hover).
			// Zaustavimo le, ko je zavihek skrit (varčevanje + pravilnost odštevanja).
			document.addEventListener('visibilitychange', function () { document.hidden ? pause() : resume(); });
		}
		paintRing();      // obroč prvega zavihka
		schedule(DUR);    // samodejni zagon ob nalaganju
	})();

	/* ---------- Odštevalnik do naslednje tekme ---------- */
	(function () {
		var cd = document.querySelector('[data-countdown]');
		if (!cd) return;
		var iso = cd.getAttribute('data-countdown');
		if (!iso) return;
		var target = new Date(iso).getTime();
		if (isNaN(target)) return;
		var out = {
			d: cd.querySelector('[data-cd="d"]'),
			h: cd.querySelector('[data-cd="h"]'),
			m: cd.querySelector('[data-cd="m"]'),
			s: cd.querySelector('[data-cd="s"]')
		};
		var pad = function (n) { return (n < 10 ? '0' : '') + n; };
		var tick = function () {
			var diff = Math.max(0, target - Date.now());
			var sec = Math.floor(diff / 1000);
			var d = Math.floor(sec / 86400);
			var h = Math.floor((sec % 86400) / 3600);
			var m = Math.floor((sec % 3600) / 60);
			var s = sec % 60;
			if (out.d) out.d.textContent = pad(d);
			if (out.h) out.h.textContent = pad(h);
			if (out.m) out.m.textContent = pad(m);
			if (out.s) out.s.textContent = pad(s);
			if (diff <= 0 && timer) { clearInterval(timer); }
		};
		tick();
		var timer = setInterval(tick, 1000);
	})();

	/* ---------- Vrtiljak prihajajočih tekem (puščice + drsno pripenjanje) ---------- */
	(function () {
		var root = document.querySelector('[data-match-carousel]');
		if (!root) return;
		var track = root.querySelector('.match-carousel__track');
		var prev = root.querySelector('.match-carousel__arrow--prev');
		var next = root.querySelector('.match-carousel__arrow--next');
		if (!track) return;
		var step = function () {
			var card = track.querySelector('.fixture-card');
			return card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
		};
		var update = function () {
			var max = track.scrollWidth - track.clientWidth - 1;
			if (prev) prev.disabled = track.scrollLeft <= 1;
			if (next) next.disabled = track.scrollLeft >= max;
			var hidden = max <= 1;
			if (prev) prev.hidden = hidden;
			if (next) next.hidden = hidden;
		};
		if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
		if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
		track.addEventListener('scroll', function () {
			if (!root._t) { root._t = window.requestAnimationFrame(function () { update(); root._t = 0; }); }
		}, { passive: true });
		window.addEventListener('resize', update, { passive: true });
		update();
	})();

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

	/* ---------- Lightbox za galerije (s prejšnjo/naslednjo) ---------- */
	var galleries = document.querySelectorAll('[data-lightbox]');
	if (galleries.length) {
		var lb = document.createElement('div');
		lb.className = 'lightbox';
		lb.innerHTML =
			'<button class="lightbox__close" aria-label="Zapri">&times;</button>' +
			'<button class="lightbox__nav lightbox__nav--prev" aria-label="Prejšnja">&#8249;</button>' +
			'<button class="lightbox__nav lightbox__nav--next" aria-label="Naslednja">&#8250;</button>' +
			'<span class="lightbox__counter" aria-hidden="true"></span>';
		var lbImg = document.createElement('img');
		lbImg.alt = '';
		lb.appendChild(lbImg);
		document.body.appendChild(lb);

		var current = [];   // seznam slik trenutne galerije
		var index = 0;
		var counter = lb.querySelector('.lightbox__counter');

		var show = function (i) {
			if (!current.length) return;
			index = (i + current.length) % current.length;
			var img = current[index];
			lbImg.src = img.currentSrc || img.src;
			lbImg.alt = img.alt || '';
			counter.textContent = (index + 1) + ' / ' + current.length;
			counter.style.display = current.length > 1 ? '' : 'none';
		};
		var open = function () { lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
		var close = function () { lb.classList.remove('is-open'); document.body.style.overflow = ''; };
		var prevBtn = lb.querySelector('.lightbox__nav--prev');
		var nextBtn = lb.querySelector('.lightbox__nav--next');

		lb.addEventListener('click', function (e) {
			if (e.target === lb || e.target.classList.contains('lightbox__close')) close();
		});
		prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(index - 1); });
		nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(index + 1); });
		document.addEventListener('keydown', function (e) {
			if (!lb.classList.contains('is-open')) return;
			if (e.key === 'Escape') close();
			else if (e.key === 'ArrowLeft') show(index - 1);
			else if (e.key === 'ArrowRight') show(index + 1);
		});

		galleries.forEach(function (g) {
			g.addEventListener('click', function (e) {
				var img = e.target.closest('img');
				if (!img) return;
				current = Array.prototype.slice.call(g.querySelectorAll('img'));
				show(current.indexOf(img));
				open();
			});
		});
	}

	/* ---------- Obvestilo o piškotkih ---------- */
	var cookieBanner = document.querySelector('[data-cookie-banner]');
	if (cookieBanner) {
		var CONSENT_KEY = 'nkkranj_cookie_consent';
		var stored;
		try { stored = window.localStorage.getItem(CONSENT_KEY); } catch (e) { stored = '1'; }
		if (!stored) {
			cookieBanner.hidden = false;
			requestAnimationFrame(function () { cookieBanner.classList.add('is-visible'); });
		}
		var acceptBtn = cookieBanner.querySelector('[data-cookie-accept]');
		if (acceptBtn) {
			acceptBtn.addEventListener('click', function () {
				try { window.localStorage.setItem(CONSENT_KEY, '1'); } catch (e) {}
				cookieBanner.classList.remove('is-visible');
				window.setTimeout(function () { cookieBanner.hidden = true; }, 400);
			});
		}
	}

	/* ---------- Več zaporednih slik v članku → urejena mreža ---------- */
	(function () {
		var proseBlocks = document.querySelectorAll('.prose, .entry-content');
		proseBlocks.forEach(function (prose) {
			var group = [];
			var flush = function () {
				if (group.length >= 2) {
					var grid = document.createElement('div');
					grid.className = 'prose-gallery';
					group[0].parentNode.insertBefore(grid, group[0]);
					group.forEach(function (el) { grid.appendChild(el); });
				}
				group = [];
			};
			Array.prototype.slice.call(prose.children).forEach(function (el) {
				var isImageFig =
					el.tagName === 'FIGURE' ||
					el.classList.contains('wp-caption') ||
					(el.tagName === 'P' && el.querySelector('img') && el.textContent.trim() === '');
				if (isImageFig) { group.push(el); } else { flush(); }
			});
			flush();
		});
	})();

	/* ---------- Scroll reveal ---------- */
	var revealEls = document.querySelectorAll('[data-reveal]');

	if (reduce || !('IntersectionObserver' in window)) {
		revealEls.forEach(function (el) { el.classList.add('is-visible'); });
	} else {
		// threshold 0: sproži ob VSTOPU elementa (katera koli vidna pika).
		// Prag 0.12 je bil hrošč: dolge strani (npr. statut) so višje od zaslona,
		// zato 12 % elementa nikoli ni vidnih naenkrat → vsebina je ostala skrita.
		var io = new IntersectionObserver(function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0, rootMargin: '0px 0px -5% 0px' });

		revealEls.forEach(function (el) {
			// Element že (delno) viden ob nalaganju → odkrij takoj; sicer opazuj.
			var r = el.getBoundingClientRect();
			if (r.top < window.innerHeight && r.bottom > 0) {
				el.classList.add('is-visible');
			} else {
				io.observe(el);
			}
		});
	}

	/* ---------- Video facade (click-to-load YouTube — GDPR/hitrost) ---------- */
	document.addEventListener('click', function (e) {
		var btn = e.target.closest ? e.target.closest('.video-lite') : null;
		if (!btn || btn.classList.contains('is-playing')) { return; }
		var id = btn.getAttribute('data-yt');
		if (!id || !/^[A-Za-z0-9_-]{6,15}$/.test(id)) { return; }
		var iframe = document.createElement('iframe');
		iframe.setAttribute('src', 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0');
		iframe.setAttribute('title', btn.getAttribute('aria-label') || 'Video');
		iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
		iframe.setAttribute('allowfullscreen', '');
		iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
		btn.classList.add('is-playing');
		btn.appendChild(iframe);
	});
})();
