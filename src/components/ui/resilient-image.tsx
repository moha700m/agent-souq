"use client";

/* eslint-disable @next/next/no-img-element -- Runtime fallback supports arbitrary validated HTTPS media. */
import {
  useEffect,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type ReactNode,
} from "react";

interface ResilientImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
  fallback: ReactNode;
}

export function ResilientImage({ src, alt, fallback, onError, ...props }: ResilientImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const image = imageRef.current;

    // A fast failure can occur before hydration attaches onError.
    if (image?.complete && image.naturalWidth === 0) {
      queueMicrotask(() => {
        if (active) setFailed(true);
      });
    }

    // A stalled third-party host may never dispatch an error event. Keep the
    // placeholder bounded so broken alt text cannot remain indefinitely.
    const timeout = window.setTimeout(() => {
      const current = imageRef.current;
      if (active && (!current?.complete || current.naturalWidth === 0)) setFailed(true);
    }, 6_000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [src]);

  if (failed) return fallback;

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      {...props}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
