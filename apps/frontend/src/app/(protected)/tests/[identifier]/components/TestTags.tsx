'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import BaseTag, { TaggableEntity } from '@/components/common/BaseTag';

import type { TestDetail, Tag, TagRead } from '@/api-client/types.gen';

interface TestTagsProps {
  test: TestDetail;
}

export default function TestTags({ test }: TestTagsProps) {
  // derive tag names from TestDetail.tags (TagRead[] | null | undefined)
  const [tagNames, setTagNames] = useState<string[]>(
      (test.tags ?? []).map((t: TagRead) => t.name),
  );

  // keep tag names in sync if the parent updates the test
  useEffect(() => {
    setTagNames((test.tags ?? []).map((t: TagRead) => t.name));
  }, [test.tags]);

  // normalize TestDetail.tags (TagRead[]) -> Tag[] (what BaseTag expects)
  const normalizedTags: Tag[] | undefined = useMemo(() => {
    const arr = test.tags ?? undefined;
    return arr?.map((t: TagRead) => ({
      id: t.id as string,
      name: t.name,
    }));
  }, [test.tags]);

  // Build a TaggableEntity explicitly (avoid `satisfies`/structural mismatch)
  const taggableTest: TaggableEntity = useMemo(
      () => ({
        id: test.id as string,
        tags: normalizedTags,
      }),
      [test.id, normalizedTags],
  );

  return (
      <Box sx={{ width: '100%' }}>
        <BaseTag
            value={tagNames}
            onChange={setTagNames}
            label="Tags"
            placeholder="Add tags (press Enter or comma to add)"
            helperText="These tags help categorize and find this test"
            chipColor="primary"
            addOnBlur
            delimiters={[',', 'Enter']}
            size="small"
            margin="normal"
            fullWidth
            entityType={'Test'}
            entity={taggableTest}
            className="test-tags"
        />
      </Box>
  );
}
