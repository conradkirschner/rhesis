'use client';

type Props = {
  title: string;
  subtitle?: string;
};

export default function StepperHeader({ title, subtitle }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      {subtitle ? <span style={{ color: '#777' }}>{subtitle}</span> : null}
    </div>
  );
}