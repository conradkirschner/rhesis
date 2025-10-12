'use client';

import * as React from 'react';
import { Box, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';
import TestSetSelectionDialog from '../../components/TestSetSelectionDialog';
import TrialDrawer from '../../components/TrialDrawer';
import { useNotifications } from '@/components/common/NotificationContext';
import { useMutation } from '@tanstack/react-query';

import type { TestSet } from '@/api-client/types.gen';
import {
  associateTestsWithTestSetTestSetsTestSetIdAssociatePostMutation,
} from '@/api-client/@tanstack/react-query.gen';

interface TestToTestSetProps {
  testId: string;
  parentButton?: React.ReactNode;
}

export default function TestToTestSet({
                                        testId,
                                        parentButton,
                                      }: TestToTestSetProps) {
  const [testSetDialogOpen, setTestSetDialogOpen] = React.useState(false);
  const [trialDrawerOpen, setTrialDrawerOpen] = React.useState(false);
  const notifications = useNotifications();

  const associateMutation = useMutation({
    ...associateTestsWithTestSetTestSetsTestSetIdAssociatePostMutation(),
    onSuccess: () => {
      notifications.show('Successfully associated test with test set', {
        severity: 'success',
        autoHideDuration: 6000,
      });
      setTestSetDialogOpen(false);
    },
    onError: (error: unknown) => {
      const msg =
          (error as Error)?.message ??
          'Failed to associate test with test set';
      if (msg.includes('One or more tests are already associated with this test set')) {
        notifications.show(
            'One or more tests are already associated with this test set',
            { severity: 'warning', autoHideDuration: 6000 },
        );
      } else {
        notifications.show('Failed to associate test with test set', {
          severity: 'error',
          autoHideDuration: 6000,
        });
      }
    },
  });

  const handleTestSetSelect = async (testSet: TestSet) => {
    if (!testSet.id) {
      throw new Error("TestSet Id missing");
    }
    // Call generated mutation
    await associateMutation.mutateAsync({
      path: { test_set_id: testSet.id },
      body: { test_ids: [testId] },
    });
  };

  const handleTrialSuccess = () => {
    setTrialDrawerOpen(false);
  };

  return (
      <>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          {parentButton}
          <Button
              variant="contained"
              color="primary"
              startIcon={<AddToPhotosIcon />}
              onClick={() => setTestSetDialogOpen(true)}
          >
            Assign to test set
          </Button>
          <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => setTrialDrawerOpen(true)}
          >
            Run Test
          </Button>
        </Box>

        <TestSetSelectionDialog
            open={testSetDialogOpen}
            onClose={() => setTestSetDialogOpen(false)}
            onSelect={handleTestSetSelect}
        />

        <TrialDrawer
            open={trialDrawerOpen}
            onClose={() => setTrialDrawerOpen(false)}
            testIds={[testId]}
            onSuccess={handleTrialSuccess}
        />
      </>
  );
}
