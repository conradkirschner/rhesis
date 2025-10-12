'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import BaseTag, { TaggableEntity } from '@/components/common/BaseTag';
import type { TestSet, Tag } from '@/api-client/types.gen';

interface TestSetTagsProps {
    testSet: TestSet;
}

export default function TestSetTags({ testSet }: TestSetTagsProps) {
    const [tagNames, setTagNames] = useState<string[]>(
        (testSet.tags ?? []).map((t: Tag) => t.name),
    );

    // Keep tag names in sync if the parent provides updated tags
    useEffect(() => {
        setTagNames((testSet.tags ?? []).map((t: Tag) => t.name));
    }, [testSet.tags]);

    // Guard: we can only tag when we have a concrete string id
    const entity: TaggableEntity | null = useMemo(() => {
        if (!testSet.id) return null;
        // Include tags if your BaseTag uses them; extra fields are fine
        return { id: testSet.id, tags: testSet.tags ?? [] } as TaggableEntity;
    }, [testSet.id, testSet.tags]);

    if (!entity) {
        // You could render a disabled field instead if preferred
        return null;
    }

    return (
        <Box sx={{ width: '100%' }} suppressHydrationWarning>
            <BaseTag
                value={tagNames}
                onChange={setTagNames}
                label="Tags"
                placeholder="Add tags (press Enter or comma to add)"
                helperText="These tags help categorize and find this test set"
                chipColor="primary"
                addOnBlur
                delimiters={[',', 'Enter']}
                size="small"
                margin="normal"
                fullWidth
                entityType={"TestSet"}
                entity={entity}
                className="test-set-tags"
                sx={{
                    '&.test-set-tags .MuiInputBase-root': {
                        padding: theme => theme.spacing(2),
                    },
                }}
            />
        </Box>
    );
}
