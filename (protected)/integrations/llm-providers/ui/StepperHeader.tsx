import { Stack, Typography } from '@mui/material';

export default function StepperHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h4">{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}