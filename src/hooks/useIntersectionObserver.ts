'use client';

import { useEffect, useRef } from 'react';

interface Options extends IntersectionObserverInit {
  once?: boolean;
}

export function useIntersectionObserver<T extends Element>(
  callback: (entry: IntersectionObserverEntry) => void,
  options: Options = {}
) {
  const ref = useRef<T>(null);
  const { once = false, threshold = 0.1, rootMargin = '0px', root } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          callback(entry);
          if (once && entry.isIntersecting) observer.unobserve(el);
        });
      },
      { threshold, rootMargin, root }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [callback, once, threshold, rootMargin, root]);

  return ref;
}
