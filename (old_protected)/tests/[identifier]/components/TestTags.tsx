'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import BaseTag, { TaggableEntity } from '@/components/common/BaseTag';

import type { TestDetail, Tag, TagRead } from '@/api-client/types.gen';

interface TestTagsProps {
  test: TestDetail;
}

export default function TestTags({ test }: TestTagsProps) {
  const [tagNames, setTagNames] = useState<string[]>(
      (test.tags ?? []).map((t: TagRead) => t.name),
  );

  useEffect(() => {
    setTagNames((test.tags ?? []).map((t: TagRead) => t.name));
  }, [test.tags]);

  const normalizedTags: Tag[] | undefined = useMemo(() => {
    const arr = test.tags ?? undefined;
    return arr?.map((t: TagRead) => ({
      id: t.id as string,
      name: t.name,
    }));
  }, [test.tags]);

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
