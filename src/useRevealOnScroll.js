import { useEffect } from 'react';

export default function useRevealOnScroll() {
  useEffect(() => {
    const targets = document.querySelectorAll(
      'main .service-card, main .identity-card, main .value-card, main .benefit, main .pos-capability, main .pos-preview-window, main .pos-preview-float'
    );

    if (!targets.length) return undefined;
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    targets.forEach((target, index) => {
      target.classList.add('reveal-on-scroll');
      target.style.setProperty('--reveal-delay', `${(index % 3) * 30}ms`);
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);
}
