'use client';

interface WaveDividerProps {
  bgColor: string;
  fillColor: string;
  variant?: 'standard' | 'transitional' | 'footer';
  flip?: boolean;
}

export default function WaveDivider({ bgColor, fillColor, variant = 'standard', flip = false }: WaveDividerProps) {
  const paths: Record<string, string> = {
    standard: 'M0,60 C300,20 600,60 900,30 C1050,15 1150,40 1200,30 L1200,60 L0,60 Z',
    transitional: 'M0,0 C400,50 800,10 1200,40 L1200,60 L0,60 Z',
    footer: 'M0,30 C200,60 400,0 600,30 C800,60 1000,10 1200,40 L1200,60 L0,60 Z',
  };

  return (
    <div
      className={`wave-divider${flip ? ' flip' : ''}`}
      style={{
        background: bgColor,
        marginTop: flip ? undefined : '-1px',
        marginBottom: flip ? '-1px' : undefined,
      }}
    >
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d={paths[variant]} fill={fillColor} />
      </svg>
    </div>
  );
}
