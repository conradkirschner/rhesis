'use client';

import { Breadcrumbs, Link as MLink, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

type Crumb = { href: string; label: string };

type Props = {
  readonly breadcrumbs: readonly Crumb[];
  readonly title: string;
  readonly subtitle?: string;
};

export default function StepperHeader({ breadcrumbs, title, subtitle }: Props) {
  return (
    <>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        {breadcrumbs.map((c, i) =>
          i < breadcrumbs.length - 1 ? (
            <MLink key={c.href} href={c.href} underline="none" color="inherit">
              {c.label}
            </MLink>
          ) : (
            <Typography key={c.href} color="text.primary">
              {c.label}
            </Typography>
          ),
        )}
      </Breadcrumbs>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      ) : null}
    </>
  );
}