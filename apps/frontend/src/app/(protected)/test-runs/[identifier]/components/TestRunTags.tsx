'use client';

import React from 'react';
import { Box } from '@mui/material';
import BaseTag from '@/components/common/BaseTag';

import type { TestRunDetail } from '@/api-client/types.gen';
import { readTestRunTestRunsTestRunIdGetOptions } from '@/api-client/@tanstack/react-query.gen';
import { useQueryClient } from '@tanstack/react-query';

interface TestRunTagsProps {
  testRun: TestRunDetail;
}

// Local structural type compatible with BaseTag's expected TaggableEntity
type TaggableEntityForBase = {
  id: string;
  organization_id?: string | null;
  user_id?: string | null;
  tags?: Array<{ id: string; name: string }>;
};

export default function TestRunTags({ testRun }: TestRunTagsProps) {
  const queryClient = useQueryClient();

  // Keep a local, optimistic list of tag names
  const [tagNames, setTagNames] = React.useState<string[]>(
      Array.isArray(testRun.tags) ? testRun.tags.map(t => t?.name ?? '').filter(Boolean) : [],
  );

  // Sync when a different testRun arrives
  React.useEffect(() => {
    const names =
        Array.isArray(testRun.tags) ? testRun.tags.map(t => t?.name ?? '').filter(Boolean) : [];
    setTagNames(names);
  }, [testRun]);

  // Normalize entity to exactly what BaseTag expects (no `null` in tags)
  const entityForBase: TaggableEntityForBase = React.useMemo(
      () => ({
        id: testRun.id,
        organization_id: testRun.organization_id ?? null,
        user_id: testRun.user_id ?? null,
        tags: Array.isArray(testRun.tags)
            ? testRun.tags
                .filter(Boolean)
                .map(t => ({
                  id: t.id as string,
                  name: (t.name ?? '') as string,
                }))
            : undefined,
      }),
      [testRun],
  );

  // After BaseTag performs tag mutations, refresh the single test run
  const handleTagChange = async (newTagNames: string[]) => {
    setTagNames(newTagNames); // optimistic UI

    try {
      const opts = readTestRunTestRunsTestRunIdGetOptions({
        path: { test_run_id: testRun.id },
      });

      await queryClient.fetchQuery(opts);
      await queryClient.invalidateQueries({ queryKey: opts.queryKey });
    } catch {
      // Non-fatal: BaseTag already handled the mutation; UI remains optimistic
    }
  };

  return (
      <Box sx={{ width: '100%' }}>
        <BaseTag
            value={tagNames}
            onChange={handleTagChange}
            label="Tags"
            placeholder="Add tags (press Enter or comma to add)"
            helperText="These tags help categorize and find this test run"
            chipColor="default"
            addOnBlur
            delimiters={[',', 'Enter']}
            size="small"
            margin="normal"
            fullWidth
            entityType={'TestRun'}
            entity={entityForBase}
        />
      </Box>
  );
}
