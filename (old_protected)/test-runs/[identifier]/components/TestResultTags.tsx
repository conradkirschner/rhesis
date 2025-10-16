'use client';

import React from 'react';
import { Box } from '@mui/material';
import BaseTag, {TaggableEntity} from '@/components/common/BaseTag';

import type { TestResultDetail } from '@/api-client/types.gen';
import { readTestResultTestResultsTestResultIdGetOptions } from '@/api-client/@tanstack/react-query.gen';

import { useQueryClient } from '@tanstack/react-query';

interface TestResultTagsProps {
  testResult: TestResultDetail;
  onUpdate: (updatedTest: TestResultDetail) => void;
}

export default function TestResultTags({
                                         testResult,
                                         onUpdate,
                                       }: TestResultTagsProps) {
  const queryClient = useQueryClient();

  const entity = React.useMemo<TaggableEntity>(() => {
    const orgId =
        'organization_id' in testResult
            ?
            (testResult as { organization_id?: string | null }).organization_id ?? null
            : null;

    const userId =
        'user_id' in testResult
            ?
            (testResult as { user_id?: string | null }).user_id ?? null
            : null;
    return {
      id: testResult.id,
      organization_id: orgId,
      user_id: userId,
      tags: Array.isArray(testResult.tags) ? testResult.tags : [],
    };
  }, [testResult]);

  const [tagNames, setTagNames] = React.useState<string[]>(
      entity.tags?.map(t => t.name ?? '').filter(Boolean) ?? [],
  );

  React.useEffect(() => {
    setTagNames(entity.tags?.map(t => t.name ?? '').filter(Boolean) ?? []);
  }, [entity]);

  const handleTagChange = async (newTagNames: string[]) => {
    setTagNames(newTagNames); // optimistic UI

    try {
      const opts = readTestResultTestResultsTestResultIdGetOptions({
        path: { test_result_id: testResult.id },
      });

      const updated = await queryClient.fetchQuery(opts);
      onUpdate(updated as TestResultDetail);

      await queryClient.invalidateQueries({ queryKey: opts.queryKey });
    } catch {
    }
  };

  return (
      <Box sx={{ width: '100%' }}>
        <BaseTag
            value={tagNames}
            onChange={handleTagChange}
            label="Test Result Tags"
            placeholder="Add tags (press Enter or comma to add)"
            helperText="Tags help categorize and find this test result"
            chipColor="primary"
            addOnBlur
            delimiters={[',', 'Enter']}
            size="small"
            margin="normal"
            fullWidth
            entityType={'TestResult'}
            entity={entity}
        />
      </Box>
  );
}
