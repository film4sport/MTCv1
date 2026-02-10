'use client';

interface WaveDividerProps {
  bgColor: string;
  fillColor: string;
  flip?: boolean;
  height?: number;
  overlap?: boolean;
}

export default function WaveDivider({ bgColor, fillColor, flip = false, height = 60, overlap = false }: WaveDividerProps) {
  const viewBox = `0 0 1200 ${height}`;
  const path = flip
    ? `M0,${height} C300,${height * 0.33} 600,${height} 900,${height * 0.5} C1050,${height * 0.25} 1150,${height * 0.67} 1200,${height * 0.5} L1200,${height} L0,${height} Z`
    : `M0,${height * 0.5} C200,${height} 400,0 600,${height * 0.5} C800,${height} 1000,${height * 0.17} 1200,${height * 0.67} L1200,${height} L0,${height} Z`;

  return (
    <div
      className={`wave-divider${flip ? ' flip' : ''}`}
      style={{
        background: bgColor,
        marginTop: overlap ? `-${height}px` : flip ? undefined : '-1px',
        marginBottom: flip ? '-1px' : undefined,
        position: overlap ? 'relative' : undefined,
        zIndex: overlap ? 20 : undefined,
      }}
    >
      <svg viewBox={viewBox} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ height: `${height}px` }}>
        <path d={path} fill={fillColor} />
      </svg>
    </div>
  );
}
