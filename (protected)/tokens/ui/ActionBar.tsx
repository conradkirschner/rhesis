'use client';

import { Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

type Props = {
  onCreate: () => void;
};

export default function ActionBar({ onCreate }: Props) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        data-test-id="create-api-token"
      >
        Create API Token
      </Button>
    </Box>
  );
}