import React from 'react';

const WAVE_BAR_HEIGHTS = ["50%", "75%", "100%", "75%", "50%"];

const Wave = ({ className, color = "currentColor", size = "20px" }) => {
  return (
    <>
      <style>{`
        @keyframes loading-ui-wave {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.6);
          }
        }
      `}</style>
      <span
        role="status"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2.5%',
          width: size,
          height: size,
          color: color
        }}
        className={className}
      >
        {WAVE_BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              display: 'inline-block',
              borderRadius: '9999px',
              backgroundColor: 'currentColor',
              width: "12.5%",
              height,
              animation: "loading-ui-wave 1s ease-in-out infinite",
              animationDelay: `${index * 100}ms`,
            }}
          />
        ))}
        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>Loading</span>
      </span>
    </>
  );
};

export { Wave };
