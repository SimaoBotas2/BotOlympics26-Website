import React, { useRef, useEffect } from 'react';

export default function FaqCard({ question, answer, isOpen = false, onToggle = () => {} }) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const transitionMs = 360;
    el.style.transition = `height ${transitionMs}ms cubic-bezier(.2,.9,.2,1), opacity ${transitionMs / 1.6}ms ease, transform ${transitionMs}ms cubic-bezier(.2,.9,.2,1)`;

    // cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (isOpen) {
      // Ensure element is visible and start from 0px to measured height for smooth animation
      el.style.display = 'block';
      el.style.overflow = 'hidden';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
      el.style.height = '0px';
      // force reflow so transition can start from 0
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;

      // measure and animate to measured height in next animation frame
      rafRef.current = requestAnimationFrame(() => {
        const h = inner.scrollHeight;
        el.style.height = `${h}px`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        // after transition, set height to auto so content can resize naturally
        const id = setTimeout(() => {
          el.style.height = 'auto';
          el.style.overflow = ''; // restore
        }, transitionMs);
        // cleanup for this effect cleanup
        rafRef.current = null;
        return () => clearTimeout(id);
      });
    } else {
      // closing: animate from current height to 0
      // if height is auto, measure actual height first
      const currentHeight = inner.scrollHeight;
      el.style.height = `${currentHeight}px`;
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight;
      // then animate to 0
      rafRef.current = requestAnimationFrame(() => {
        el.style.height = '0px';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px)';
        const id = setTimeout(() => {
          el.style.display = 'none';
          el.style.overflow = ''; // restore
        }, transitionMs);
        rafRef.current = null;
        return () => clearTimeout(id);
      });
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isOpen]);

  const handleClick = (e) => {
    const target = e.target;
    if (target && (target.tagName === 'A' || (target.closest && target.closest('a')))) return;
    onToggle();
  };

  return (
    <div
      className={`faq-card ${isOpen ? 'open' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); } }}
      aria-expanded={isOpen}
    >
      <div className="faq-card-head">
        <div className="faq-question">{question}</div>
        <div className="faq-toggle">{isOpen ? '–' : '+'}</div>
      </div>

      <div
        className="faq-card-body"
        ref={containerRef}
        aria-hidden={!isOpen}
        // initial inline styles are managed by effect
        style={{ height: 0, overflow: 'hidden', opacity: 0, transform: 'translateY(-6px)' }}
      >
        <div ref={innerRef} className="faq-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}
