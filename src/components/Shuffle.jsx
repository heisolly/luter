import React, { useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/**
 * Shuffle - hover-only letter scramble animation.
 *
 * Design: Each character is wrapped in a clipped <span> that shows exactly one
 * character-height window. Inside sits a vertical strip of spans (scramble chars
 * + the real char at the bottom). GSAP slides the strip upward on hover to
 * reveal random chars then the final correct letter.
 *
 * Layout impact: ZERO. The outer wrapper is inline-block with the same text
 * content as before. Characters are absolutely-positioned inside fixed-width
 * cells that match the natural text dimensions.
 */

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const rand = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

const Shuffle = ({
  text = '',
  className = '',
  style = {},
  tag: Tag = 'span',
  duration = 0.35,
  stagger = 0.025,
  ease = 'power3.out',
  scrambleSteps = 3,
  triggerOnHover = true,
}) => {
  const containerRef = useRef(null);
  const tlRef = useRef(null);
  const animatingRef = useRef(false);

  const buildAnimation = useCallback(() => {
    if (!containerRef.current || animatingRef.current) return;
    animatingRef.current = true;

    const wrappers = Array.from(containerRef.current.querySelectorAll('.sh-char-wrap'));
    if (!wrappers.length) {
      animatingRef.current = false;
      return;
    }

    if (tlRef.current) tlRef.current.kill();

    const tl = gsap.timeline({
      onComplete: () => { animatingRef.current = false; }
    });

    wrappers.forEach((wrap, i) => {
      const strip = wrap.querySelector('.sh-strip');
      if (!strip) return;

      // Regenerate scramble chars each time for variety
      const scrambleCells = strip.querySelectorAll('.sh-scramble');
      scrambleCells.forEach(cell => { cell.textContent = rand(); });

      // Reset strip to top (showing first scramble char)
      const totalSlots = scrambleSteps + 1; // scrambles + final char
      gsap.set(strip, { yPercent: 0 });

      // Animate strip upward so the final char slides into view
      tl.to(strip, {
        yPercent: -(100 / totalSlots) * scrambleSteps,
        duration,
        ease,
      }, i * stagger);
    });

    tlRef.current = tl;
  }, [duration, stagger, ease, scrambleSteps]);

  const handleMouseEnter = useCallback(() => {
    if (triggerOnHover) buildAnimation();
  }, [triggerOnHover, buildAnimation]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !triggerOnHover) return;
    el.addEventListener('mouseenter', handleMouseEnter);
    return () => el.removeEventListener('mouseenter', handleMouseEnter);
  }, [handleMouseEnter, triggerOnHover]);

  if (!text) return null;

  const totalSlots = scrambleSteps + 1;
  const slotHeightPct = 100 / totalSlots;

  return (
    <Tag
      ref={containerRef}
      className={className}
      style={{
        display: 'inline-block',
        lineHeight: 'inherit',
        cursor: triggerOnHover ? 'default' : undefined,
        ...style,
      }}
    >
      {text.split('').map((char, idx) => {
        if (char === ' ') {
          return (
            <span
              key={idx}
              style={{ display: 'inline-block', width: '0.3em' }}
              aria-hidden="true"
            />
          );
        }

        // Build the strip: [scramble × N] + [real char]
        const scrambles = Array.from({ length: scrambleSteps }, (_, k) => (
          <span
            key={`sc-${k}`}
            className="sh-scramble"
            aria-hidden="true"
            style={{
              display: 'block',
              height: `${slotHeightPct}%`,
              textAlign: 'center',
              lineHeight: `${1 / (totalSlots) * 100}%`,
              userSelect: 'none',
            }}
          >
            {rand()}
          </span>
        ));

        const realChar = (
          <span
            key="real"
            style={{
              display: 'block',
              height: `${slotHeightPct}%`,
              textAlign: 'center',
              lineHeight: `${1 / (totalSlots) * 100}%`,
            }}
          >
            {char}
          </span>
        );

        return (
          <span
            key={idx}
            className="sh-char-wrap"
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              height: '1em',
              verticalAlign: 'middle',
              // Width matches the real character naturally
            }}
          >
            {/* The strip starts at yPercent=0 showing first scramble;
                GSAP slides it so the real char at the bottom is visible */}
            <span
              className="sh-strip"
              style={{
                display: 'block',
                height: `${totalSlots * 100}%`,
                willChange: 'transform',
              }}
            >
              {scrambles}
              {realChar}
            </span>
          </span>
        );
      })}
    </Tag>
  );
};

export default Shuffle;
