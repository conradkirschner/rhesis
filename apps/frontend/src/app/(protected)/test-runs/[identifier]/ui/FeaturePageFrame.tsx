'use client';

import { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
};

export default function FeaturePageFrame({ title, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>
      {children}
    </div>
  );
}