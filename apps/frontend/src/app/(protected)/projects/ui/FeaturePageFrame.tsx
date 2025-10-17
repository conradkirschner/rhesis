'use client';

import { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { PageContainer } from '@toolpad/core/PageContainer';

type Props = {
  readonly title: string;
  readonly children: ReactNode;
  readonly onCreate?: () => void;
};

export default function FeaturePageFrame({ title, children, onCreate }: Props) {
  return (
    <PageContainer title={title} breadcrumbs={[{ title, path: '/projects' }]}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        {onCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            data-test-id="create-project-btn"
          >
            Create Project
          </Button>
        )}
      </Box>
      {children}
    </PageContainer>
  );
}