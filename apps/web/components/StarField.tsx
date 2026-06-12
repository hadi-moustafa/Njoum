'use client';

/* Fixed twinkling star background — visible in dark mode only */

const STARS: { x: number; y: number; s: number; variant: 'a' | 'b' | 'c'; dur: number; delay: number }[] = [
  { x:  3, y: 8,  s: 1.5, variant: 'a', dur: 3.2, delay: 0.0 },
  { x:  7, y: 45, s: 1.0, variant: 'b', dur: 4.1, delay: 1.2 },
  { x: 12, y: 20, s: 2.0, variant: 'c', dur: 2.8, delay: 0.6 },
  { x: 17, y: 72, s: 1.0, variant: 'a', dur: 3.7, delay: 2.1 },
  { x: 22, y: 15, s: 1.5, variant: 'b', dur: 4.5, delay: 0.3 },
  { x: 27, y: 55, s: 1.0, variant: 'c', dur: 3.0, delay: 1.7 },
  { x: 32, y: 88, s: 1.5, variant: 'a', dur: 4.8, delay: 0.9 },
  { x: 37, y: 30, s: 2.0, variant: 'b', dur: 3.3, delay: 2.5 },
  { x: 42, y: 65, s: 1.0, variant: 'c', dur: 2.6, delay: 1.1 },
  { x: 47, y: 12, s: 1.5, variant: 'a', dur: 4.2, delay: 0.7 },
  { x: 52, y: 78, s: 1.0, variant: 'b', dur: 3.9, delay: 1.9 },
  { x: 57, y: 40, s: 2.0, variant: 'c', dur: 2.9, delay: 0.4 },
  { x: 62, y: 92, s: 1.0, variant: 'a', dur: 4.6, delay: 2.3 },
  { x: 67, y: 22, s: 1.5, variant: 'b', dur: 3.1, delay: 0.8 },
  { x: 72, y: 58, s: 1.0, variant: 'c', dur: 4.3, delay: 1.5 },
  { x: 77, y:  5, s: 2.0, variant: 'a', dur: 2.7, delay: 0.2 },
  { x: 82, y: 70, s: 1.0, variant: 'b', dur: 4.9, delay: 2.7 },
  { x: 87, y: 35, s: 1.5, variant: 'c', dur: 3.4, delay: 1.3 },
  { x: 92, y: 85, s: 1.0, variant: 'a', dur: 4.0, delay: 0.5 },
  { x: 95, y: 18, s: 2.0, variant: 'b', dur: 3.6, delay: 2.0 },
  { x: 10, y: 60, s: 1.0, variant: 'c', dur: 2.5, delay: 1.4 },
  { x: 25, y: 95, s: 1.5, variant: 'a', dur: 4.7, delay: 0.1 },
  { x: 40, y: 50, s: 1.0, variant: 'b', dur: 3.8, delay: 1.8 },
  { x: 55, y: 28, s: 2.0, variant: 'c', dur: 2.4, delay: 2.4 },
  { x: 70, y: 80, s: 1.0, variant: 'a', dur: 4.4, delay: 0.8 },
  { x: 85, y: 48, s: 1.5, variant: 'b', dur: 3.5, delay: 1.6 },
  { x: 15, y: 38, s: 1.0, variant: 'c', dur: 2.3, delay: 2.2 },
  { x: 30, y: 68, s: 2.0, variant: 'a', dur: 4.1, delay: 0.3 },
  { x: 45, y:  8, s: 1.0, variant: 'b', dur: 3.2, delay: 1.0 },
  { x: 60, y: 42, s: 1.5, variant: 'c', dur: 4.6, delay: 2.6 },
  { x: 75, y: 92, s: 1.0, variant: 'a', dur: 2.8, delay: 0.7 },
  { x: 90, y: 25, s: 2.0, variant: 'b', dur: 3.9, delay: 1.9 },
  { x:  8, y: 82, s: 1.0, variant: 'c', dur: 4.3, delay: 0.5 },
  { x: 20, y: 52, s: 1.5, variant: 'a', dur: 3.0, delay: 2.1 },
  { x: 35, y: 18, s: 1.0, variant: 'b', dur: 4.8, delay: 1.2 },
  { x: 50, y: 75, s: 2.0, variant: 'c', dur: 2.6, delay: 0.4 },
  { x: 65, y: 38, s: 1.0, variant: 'a', dur: 4.1, delay: 2.8 },
  { x: 80, y: 62, s: 1.5, variant: 'b', dur: 3.4, delay: 1.6 },
  { x: 95, y: 45, s: 1.0, variant: 'c', dur: 2.9, delay: 0.9 },
  { x:  5, y: 30, s: 2.0, variant: 'a', dur: 4.5, delay: 2.3 },
  { x: 42, y: 85, s: 1.0, variant: 'b', dur: 3.7, delay: 0.6 },
  { x: 58, y: 15, s: 1.5, variant: 'c', dur: 2.5, delay: 1.7 },
  { x: 73, y: 55, s: 1.0, variant: 'a', dur: 4.2, delay: 0.2 },
  { x: 88, y: 10, s: 2.0, variant: 'b', dur: 3.3, delay: 2.5 },
  { x: 18, y: 48, s: 1.0, variant: 'c', dur: 4.7, delay: 1.1 },
  { x: 33, y: 78, s: 1.5, variant: 'a', dur: 2.7, delay: 0.8 },
  { x: 48, y: 32, s: 1.0, variant: 'b', dur: 4.0, delay: 2.0 },
  { x: 63, y: 68, s: 2.0, variant: 'c', dur: 3.6, delay: 1.4 },
  { x: 78, y: 25, s: 1.0, variant: 'a', dur: 2.4, delay: 0.3 },
  { x: 93, y: 58, s: 1.5, variant: 'b', dur: 4.9, delay: 2.7 },
  { x: 13, y: 90, s: 1.0, variant: 'c', dur: 3.1, delay: 1.3 },
  { x: 28, y:  5, s: 2.0, variant: 'a', dur: 4.4, delay: 0.7 },
  { x: 53, y: 48, s: 1.0, variant: 'b', dur: 3.8, delay: 1.9 },
  { x: 68, y: 15, s: 1.5, variant: 'c', dur: 2.6, delay: 0.4 },
  { x: 83, y: 72, s: 1.0, variant: 'a', dur: 4.6, delay: 2.2 },
];

const SHOOTING_STARS = [
  { x: 90, y: 5,  dur: '7s',  delay: '0s'   },
  { x: 65, y: 12, dur: '9s',  delay: '3.5s' },
  { x: 78, y: 3,  dur: '11s', delay: '7s'   },
];

export default function StarField() {
  return (
    <div className="star-field" aria-hidden="true">
      {/* Twinkling dots */}
      {STARS.map((star, i) => (
        <div
          key={i}
          className={`star-dot ${star.variant}`}
          style={{
            left:  `${star.x}%`,
            top:   `${star.y}%`,
            width:  `${star.s}px`,
            height: `${star.s}px`,
            '--dur':   `${star.dur}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Shooting stars */}
      {SHOOTING_STARS.map((ss, i) => (
        <div
          key={`ss-${i}`}
          className="shooting-star"
          style={{
            right: `${ss.x}%`,
            top:   `${ss.y}%`,
            '--dur':   ss.dur,
            '--delay': ss.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Background nebula glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(122,78,122,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(181,88,106,0.05) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
