import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FaqList from './components/FaqList';
import TeamMember from './components/TeamMember';

export default function App() {
  const { t, i18n } = useTranslation();
  const setLang = (lng) => i18n.changeLanguage(lng);

  const header = t('header', { returnObjects: true });
  const landing = t('landing', { returnObjects: true });
  const date = t('date', { returnObjects: true });
  const about = t('about', { returnObjects: true });
  const challenges = t('challenges', { returnObjects: true });
  const schedule = t('schedule', { returnObjects: true });
  const faq = t('faq', { returnObjects: true });
  const previous = t('previousEdition', { returnObjects: true });
  const sponsors = t('sponsors', { returnObjects: true });
  const team = t('team', { returnObjects: true });
  const location = t('location', { returnObjects: true });
  const footer = t('footer', { returnObjects: true });

  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  // new: registrations config fetched at runtime (fixed endpoint + periodic refresh)
  const [registrations, setRegistrations] = useState({});
  useEffect(() => {
    // if server injected preloaded registrations, use them and skip polling/fetch
    try {
      const pre = (typeof window !== 'undefined' && window.__PRELOADED__) ? window.__PRELOADED__.registrations : null;
      if (pre && typeof pre === 'object') {
        setRegistrations(pre);
        return () => { };
      }
    } catch (e) { /* ignore access errors */ }

    // fallback: single fetch at runtime (no polling) so client still works in environments without server injection
    let mounted = true;
    const fetchCfg = () => {
      fetch('/_config/registrations.json').then(r => {
        if (!r.ok) return;
        return r.json();
      }).then(data => {
        if (mounted && data && typeof data === 'object') setRegistrations(data);
      }).catch(() => { });
    };
    fetchCfg();
    return () => { mounted = false; };
  }, []);

  // ensure PT is the default on first visit (do not override an existing preference)
  useEffect(() => {
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('i18nextLng') : null;
      if (!stored) {
        i18n.changeLanguage('pt');
      }
    } catch (e) {
      // ignore (e.g. localStorage not available)
    }
  }, [i18n]);

  // set the favicon to /assets/logo.svg (create or update link[rel~="icon"])
  useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const href = '/assets/logo.svg';
      let icon = document.querySelector('link[rel~="icon"]');
      if (icon) {
        icon.setAttribute('href', href);
        icon.setAttribute('type', 'image/svg+xml');
      } else {
        icon = document.createElement('link');
        icon.setAttribute('rel', 'icon');
        icon.setAttribute('href', href);
        icon.setAttribute('type', 'image/svg+xml');
        document.head.appendChild(icon);
      }
    } catch (e) {
      // ignore any DOM errors
    }
  }, []);

  // new: smooth controlled pan when navigating to hashes (click / load / hashchange)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const headerSelector = '.bo-header';
    const DEFAULT_DURATION = 900; // ms

    const easeInOutCubic = (t) => t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const getHeaderOffset = () => {
      const h = document.querySelector(headerSelector);
      return h ? h.offsetHeight : 0;
    };

    const scrollToElement = (el, duration = DEFAULT_DURATION) => {
      if (!el) return;
      const startY = window.scrollY || window.pageYOffset;
      const rect = el.getBoundingClientRect();
      const targetY = rect.top + startY - getHeaderOffset() - 12; // small breathing room
      const distance = targetY - startY;
      let startTime = null;

      const step = (ts) => {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        window.scrollTo(0, Math.round(startY + distance * eased));
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    };

    const scrollToHash = (hash, duration = DEFAULT_DURATION) => {
      if (!hash) return;
      const id = hash.replace(/^#/, '');
      const el = document.getElementById(id);
      if (!el) return;
      scrollToElement(el, duration);
    };

    // intercept clicks on same-page hash anchors
    const onDocumentClick = (ev) => {
      const a = ev.target.closest && ev.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      // allow links with data-skip-smooth to bypass the smooth scroll if needed
      if (a.hasAttribute('data-skip-smooth')) return;
      // prevent default jump and perform smooth scroll
      ev.preventDefault();
      const hash = href;
      // update URL without causing default jump (pushState keeps history)
      if (history && history.pushState) {
        history.pushState(null, '', hash);
      } else {
        location.hash = hash;
      }
      scrollToHash(hash);
    };

    // respond to hashchange (keyboard navigation / back-forward)
    const onHashChange = () => scrollToHash(location.hash);

    // if page loads with a hash, animate to it after a short delay (allow layout)
    const initialHash = location.hash;
    if (initialHash) {
      // small timeout to allow layout/paint
      setTimeout(() => scrollToHash(initialHash, DEFAULT_DURATION), 80);
    }

    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('hashchange', onHashChange, false);

    return () => {
      document.removeEventListener('click', onDocumentClick, true);
      window.removeEventListener('hashchange', onHashChange, false);
    };
  }, []);

  // dynamic previous edition gallery (array of image URLs)
  const [previousGallery, setPreviousGallery] = useState(Array.isArray(previous.images) ? previous.images : []);
  // prevent double-fetch in strict/dev — still fetch only once per full page load
  const galleryFetchedRef = useRef(false);

  // per-image random metadata used to vary size/offset/overlap/z-index
  const [galleryMeta, setGalleryMeta] = useState([]);

  // fetch gallery once on initial mount (reload). This avoids repeated requests when the app rerenders.
  useEffect(() => {
    if (galleryFetchedRef.current) return; // already done
    galleryFetchedRef.current = true;

    const dir = (typeof previous.images === 'string' && previous.images.trim())
      ? previous.images.trim()
      : (previous.galleryPath && typeof previous.galleryPath === 'string' ? previous.galleryPath : null);

    // if server injected preloaded galleries, use them
    try {
      const pre = (typeof window !== 'undefined' && window.__PRELOADED__) ? window.__PRELOADED__.galleries : null;
      if (pre) {
        // try exact dir, then try without leading slash
        const maybe = dir && (pre[dir] || pre[String(dir).replace(/^\/+/, '')] || pre[dir.replace(/^\/+/, '')]);
        if (Array.isArray(maybe) && maybe.length) {
          setPreviousGallery(maybe);
          return () => {};
        }
      }
    } catch (e) { /* ignore */ }

    let mounted = true;

    const fetchGallery = async () => {
      if (!dir || !mounted) return;
      try {
        const res = await fetch(`/_gallery?dir=${encodeURIComponent(dir)}`);
        if (!res.ok) return;
        const list = await res.json();
        if (mounted && Array.isArray(list)) setPreviousGallery(list);
      } catch (e) { /* ignore, keep previousGallery as-is */ }
    };

    // use explicit locale images if present; otherwise, perform a single fetch
    if (Array.isArray(previous.images) && previous.images.length) {
      setPreviousGallery(previous.images);
    } else if (dir) {
      fetchGallery();
    } else {
      setPreviousGallery([]);
    }

    return () => { mounted = false; };
  }, []); // run once on mount

  // generate random layout metadata whenever the gallery list changes
  useEffect(() => {
    if (!previousGallery || !previousGallery.length) {
      setGalleryMeta([]);
      return;
    }
    // print
    console.log('Gallery metadata:', galleryMeta);
    // create deterministic-ish randomness per filename using simple hash so re-renders remain stable
    const hashSeed = (s) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
      }
      return h;
    };

    const makeMeta = (src, i) => {
      const seed = hashSeed(src + '|' + i);
      const rnd = (a, b) => {
        // xorshift-ish using seed
        const v = ((seed + i * 9973) ^ (seed >>> (i % 7))) >>> 0;
        const x = (v % (b - a + 1)) + a;
        return x;
      };
      return {
        // reduced base sizes so images appear smaller
        h: rnd(120, 220),           // image height (unchanged)
        ty: rnd(-90, 90),          // vertical translate
        rotate: (rnd(-6, 6)),      // small rotation
        z: rnd(1, 12),             // z-index for overlap ordering
        // smaller negative margin => more space between items (less overlap)
        ml: -rnd(6, 40)           // negative margin-left to overlap previous item (reduced)
      };
    };

    const meta = previousGallery.map((src, i) => makeMeta(src, i));
    setGalleryMeta(meta);
  }, [previousGallery]);

  return (
    <div className="bo-site">
      <header className="bo-header">
        <div className="wrap header-row">
          <div className="brand-left">
            <img src={header.logo} alt="logo" className="site-logo" />
          </div>
          <div className="brand-right">
            {/* language buttons show active state depending on current language */}
            <button
              className={`lang-btn ${i18n.language && i18n.language.startsWith('pt') ? 'active' : ''}`}
              data-lang="pt"
              onClick={() => setLang('pt')}
              aria-pressed={i18n.language && i18n.language.startsWith('pt')}
            >
              PT
            </button>
            <button
              className={`lang-btn ${i18n.language && i18n.language.startsWith('en') ? 'active' : ''}`}
              data-lang="en"
              onClick={() => setLang('en')}
              aria-pressed={i18n.language && i18n.language.startsWith('en')}
            >
              EN
            </button>
            <a className="btn-cta" href="#challenges">{header.registerText}</a>
          </div>
        </div>
      </header>

      <section className="landing" style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${landing.background}')`
      }}>
        <div className="wrap landing-inner">
          <img className="landing-logo" src={landing.foregroundLogo} alt="edition logo" />
        </div>
      </section>

      {/*--------------------------- DATE SECTION ---------------------------*/}
      <section className="date-section">
        <h2>{date.text}</h2>
      </section>

      <main>
        {/*-------------------------- ABOUT SECTION -------------------------*/}
        <section className="wrap section" id="about">
          <h2>{about.title}</h2>
          <p>{about.text1}</p>
          <p>{about.text2}</p>
          <p>{about.text3}</p>
        </section>

        {/*----------------------- CHALLENGES SECTION -----------------------*/}
        <section className="wrap section" id="challenges">
          <h2>{challenges.title}</h2>
          <p>{challenges.text}</p>
          <div>
            <a
              className="btn-pill btn-pill-primary btn-pill-primary-lg"
              href={challenges.generalRegulationUrl}
              target="_blank"
              rel="noreferrer"
            >
              {challenges.generalRegulationLabel}
            </a>
          </div>
          <div className="challenges-grid">
            {challenges.items.map((c, i) => {
              // determine state from runtime config first, then from any fallback in the item
              const state = (registrations && registrations[c.id]) ? String(registrations[c.id]).toLowerCase() : '';
              const isBefore = state.includes('before');
              const isAfter = state.includes('after');
              const isClosed = isBefore || isAfter;
              const regLabel = isBefore
                ? challenges.registerBeforeLabel
                : isAfter
                  ? challenges.registerAfterLabel
                  : challenges.registerOpenLabel;

              return (
                <article key={i} className="challenge-card" style={{ backgroundImage: `url('${c.bg}')` }}>
                  {/* boxed content */}
                  <div className="challenge-box">
                    <div className="challenge-header">
                      <h3 className="challenge-name">{c.name}</h3>
                      <img src={c.logo} alt={`${c.name} logo`} className="challenge-logo" />
                    </div>

                    <div className="divider" />

                    <div className="challenge-level">{c.subtitle}</div>

                    <div className="challenge-desc">{c.description}</div>

                    <div className="challenge-actions">
                      <a
                        className="btn-pill btn-pill-primary"
                        href={isClosed ? undefined : c.formUrl}
                        target={isClosed ? undefined : "_blank"}
                        rel={isClosed ? undefined : "noreferrer"}
                        aria-disabled={isClosed}
                        onClick={(e) => { if (isClosed) e.preventDefault(); }}
                      >
                        {regLabel}
                      </a>

                      {c.rulesStatus === "building" ? (
                        <span className="btn-pill btn-pill-outline" style={{ cursor: 'default', opacity: 0.7 }}>
                          {c.rulesMessage}
                        </span>
                      ) : (
                        <a className="btn-pill btn-pill-outline" href={c.rulesUrl} target="_blank" rel="noreferrer">
                          {challenges.regulationLabel}
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="wrap section" id="schedule">
          <h2>{schedule.title}</h2>
          <p>{schedule.description}</p>
          <div className="schedule-image"><img src={schedule.image} alt={schedule.missing} /></div>
        </section>

        <section className="wrap section" id="faq">
          <h2>{faq.title}</h2>
          <p>{faq.description}</p>
          <FaqList items={faq.items} />
        </section>

        <section className="wrap section" id="previous">
          <h2>{previous.title}</h2>
          <p>{previous.description}</p>

          {previousGallery && previousGallery.length > 0 ? (
            <div className="prev-carousel" aria-label="Previous edition gallery">
              <div
                className="carousel-track"
                style={{ animationDuration: `${Math.max(12, previousGallery.length * 3)}s` }}
              >
                {(() => {
                  // build items with their meta, then duplicate for seamless loop
                  const items = previousGallery.map((src, i) => {
                    const m = galleryMeta[i] || { h: 160, ty: 0, rotate: 0, z: 1, ml: -24 }; // smaller default (less overlap)
                    return { src, meta: m, key: `${i}-${src}` };
                  });
                  const dup = [...items, ...items];
                  return dup.map((it, idx) => {
                    const isFirst = idx === 0;
                    const style = {
                      transform: `translateY(${it.meta.ty}px) rotate(${it.meta.rotate}deg)`,
                      zIndex: it.meta.z,
                      marginLeft: isFirst ? 0 : `${it.meta.ml}px`
                    };
                    const imgStyle = { height: `${it.meta.h}px`, width: 'auto' };
                    return (
                      <div key={`${idx}-${it.key}`} className="carousel-item" style={style}>
                        <img src={it.src} alt={`previous-${idx % previousGallery.length}`} style={imgStyle} />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="gallery-grid">
              {previous.images && previous.images.map && previous.images.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" className="gallery-item">
                  <img src={src} alt={`previous-${i}`} />
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="wrap section" id="sponsors">
          <h2>{sponsors.title}</h2>
          <p dangerouslySetInnerHTML={{
            __html: sponsors.description.replace(
              /* email regex to convert all email in the text to mailto link */
              /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
              (email) => `<a href="mailto:${email}">${email}</a>`
            )
          }} />
          {sponsors.tiers.map((tier, ti) => (
            <div key={ti} className="sponsor-tier" style={{ textAlign: ti % 2 === 1 ? 'left' : 'right' }}>
              <h3 className="tier-name" style={{ color: tier.color }}>{tier.name}</h3>
              {/* colored underline matching the tier color */}
              <div
                className="tier-underline"
                style={{ backgroundColor: tier.color }}
              />
              <div className="tier-logos">
                {tier.sponsors.map((s, si) => (
                  <a key={si} href={s.url} target="_blank" rel="noreferrer" className="sponsor-link">
                    <img src={s.logo} alt={s.name} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="wrap section" id="team">
          <h2>{team.title}</h2>
          <div className="team-grid">
            {team.members.map((m, i) => (
              <TeamMember key={i} member={m} />
            ))}
          </div>
        </section>

        <section className="wrap section" id="location">
          <h2>{location.title}</h2>
          <p>{location.description}</p>
          <div className="map-embed">
            <iframe title="event-location" src={location.mapEmbedUrl} style={{ width: '100%', height: '420px', border: 0 }} allowFullScreen loading="lazy"></iframe>
          </div>
        </section>
      </main>

      <footer className="site-footer" role="contentinfo">
        <div className="wrap footer-inner">
          <div className="footer-left">
            <h3>{footer.socialsLabel}</h3>
            <div className="social-row" aria-label="Social media">
              {Array.isArray(footer.socials) && footer.socials.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn"
                  aria-label={s.name}
                >
                  <img src={s.icon} alt={s.name} />
                </a>
              ))}
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '1.05em', fontWeight: 'bold', marginBottom: '6px' }}>
                {i18n.language && i18n.language.startsWith('pt') ? 'Edições passadas' : 'Past Editions'}
              </div>
              <a href="https://past.botolympics.pt/" target="_blank" rel="noreferrer" style={{ fontSize: '0.95em' }}>past.botolympics.pt</a>
            </div>
          </div>

          <div className="footer-center">
            <h3>{footer.contactsLabel}</h3>
            {Array.isArray(footer.contacts) && footer.contacts.map((c, ci) => (
              <div key={ci} className="contact-item">
                <div className="contact-label">{c.label}</div>
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </div>
            ))}
          </div>

          <div className="footer-right">
            <h3>{footer.organizationLabel}</h3>
            <div className="org-logos">
              {Array.isArray(footer.organizations) && footer.organizations.map((o, oi) => (
                <a key={oi} href={o.url} target="_blank" rel="noreferrer" title={o.name}>
                  <img src={o.logo} alt={o.name} className="org-logo" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
