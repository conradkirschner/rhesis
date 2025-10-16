import { Box } from '@mui/material';
import Image from 'next/image';
import type { UiStepperHeaderProps } from './types';

export default function StepperHeader({ logoSrc, logoAlt }: UiStepperHeaderProps) {
  return (
    <Box sx={{ mb: 1 }}>
      <Image
        src={logoSrc}
        alt={logoAlt}
        width={300}
        height={150}
        style={{ objectFit: 'contain' }}
        priority
      />
    </Box>
  );
}