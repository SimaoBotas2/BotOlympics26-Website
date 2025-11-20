import React, { useEffect, useState, useCallback } from 'react';
import FaqCard from './FaqCard';

export default function FaqList({ items = [], className = '' }) {
  // open index map: only one open per row (managed in toggle)
  const [openIndex, setOpenIndex] = useState(null);
  const [columns, setColumns] = useState(() => {
    if (typeof window === 'undefined') return 2;
    return window.innerWidth <= 600 ? 1 : 2;
  });

  const handleResize = useCallback(() => {
    setColumns(window.innerWidth <= 600 ? 1 : 2);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const toggle = (index) => {
    const row = Math.floor(index / columns);
    if (openIndex === index) {
      setOpenIndex(null);
      return;
    }
    // close other items in same row, open clicked
    setOpenIndex(index);
  };

  return (
    <div className={`faq-grid-new ${className}`}>
      {items.map((it, i) => (
        <FaqCard
          key={i}
          question={it.q}
          answer={it.a}
          isOpen={openIndex === i}
          onToggle={() => toggle(i)}
        />
      ))}
    </div>
  );
}
