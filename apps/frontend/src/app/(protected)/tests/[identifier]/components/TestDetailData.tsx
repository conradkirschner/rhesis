'use client';

import * as React from 'react';
import { Box, Grid, Typography, useTheme } from '@mui/material';
import { InsertDriveFileOutlined as DocumentIcon } from '@mui/icons-material';
import BaseFreesoloAutocomplete, { AutocompleteOption } from '@/components/common/BaseFreesoloAutocomplete';
import { useNotifications } from '@/components/common/NotificationContext';
import TestExecutableField from './TestExecutableField';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  TestDetail,
  Behavior,
  Topic,
  Category,
  TypeLookup,
  BehaviorReference,
  TopicReference,
  CategoryReference,
  TypeLookupReference,
} from '@/api-client/types.gen';

import {
  readBehaviorsBehaviorsGetOptions,
  readTopicsTopicsGetOptions,
  readCategoriesCategoriesGetOptions,
  readTypeLookupsTypeLookupsGetOptions,
  updateTestTestsTestIdPutMutation,
  readTestTestsTestIdGetOptions, // ⬅️ subscribe to the same Test cache
} from '@/api-client/@tanstack/react-query.gen';

interface TestDetailDataProps {
  test: TestDetail; // passed from parent
}

type Id = string;
type OptionShape = AutocompleteOption;

interface SourceDoc {
  document?: string | null;
  source?: string | null;
  content?: string | null;
}

export default function TestDetailData({ test: initialTest }: TestDetailDataProps) {
  const theme = useTheme();
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  // ✅ Subscribe to the same Test cache (no extra network; uses cached data).
  const testOptions = React.useMemo(
      () => readTestTestsTestIdGetOptions({ path: { test_id: initialTest.id as Id } }),
      [initialTest.id],
  );
  const testQuery = useQuery({
    ...testOptions,
    select: (resp): TestDetail => {
      if (!resp) {
        throw new Error('Failed to load test detail');
      }
      return resp;
    },
  });
  const test = testQuery.data ?? initialTest;

  // Reference-data queries
  const behaviorsQuery = useQuery(readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }));
  const topicsQuery = useQuery(
      readTopicsTopicsGetOptions({ query: { entity_type: 'Test', sort_by: 'name', sort_order: 'asc' } }),
  );
  const categoriesQuery = useQuery(
      readCategoriesCategoriesGetOptions({ query: { entity_type: 'Test', sort_by: 'name', sort_order: 'asc' } }),
  );
  const typesQuery = useQuery(
      readTypeLookupsTypeLookupsGetOptions({
        query: { sort_by: 'type_value', sort_order: 'asc', $filter: "type_name eq 'TestType'" },
      }),
  );

  const behaviors: OptionShape[] = React.useMemo(() => {
    const list = (behaviorsQuery.data?.data ?? []) as Behavior[];
    return list
        .filter(b => Boolean(b.id) && Boolean(b.name?.trim()))
        .map(b => ({ id: b.id as Id, name: b.name as string }));
  }, [behaviorsQuery.data]);

  const topics: OptionShape[] = React.useMemo(() => {
    const list = (topicsQuery.data?.data ?? []) as Topic[];
    return list.map(t => ({ id: t.id as Id, name: t.name as string }));
  }, [topicsQuery.data]);

  const categories: OptionShape[] = React.useMemo(() => {
    const list = (categoriesQuery.data?.data ?? []) as Category[];
    return list.map(c => ({ id: c.id as Id, name: c.name as string }));
  }, [categoriesQuery.data]);

  const types: OptionShape[] = React.useMemo(() => {
    const list = (typesQuery.data?.data ?? []) as TypeLookup[];
    return list.map(t => ({ id: t.id as Id, name: t.type_value as string }));
  }, [typesQuery.data]);

  // Mutation with optimistic cache + invalidate
  const updateMutation = useMutation({
    ...updateTestTestsTestIdPutMutation(),
    onError: (err) => {
      // rollback handled in handleUpdate
      // eslint-disable-next-line no-console
      console.error('Error updating test:', err);
      notifications.show('Failed to update test', { severity: 'error', autoHideDuration: 6000 });
    },
  });

  // Update a single field (optimistic update against the Test cache)
  const handleUpdate = async (
      field: 'behavior' | 'topic' | 'category' | 'test_type',
      value: string | AutocompleteOption | null,
  ) => {
    if (typeof value === 'string') {
      notifications.show(`Creating new ${field} is not supported in this version`, {
        severity: 'info',
        autoHideDuration: 6000,
      });
      return;
    }

    const fieldKey = `${field}_id` as 'behavior_id' | 'topic_id' | 'category_id' | 'test_type_id';
    const idOrNull: Id | null = value ? (value.id as Id) : null;

    // Build the next TestDetail based on current cache
    const prev = queryClient.getQueryData<TestDetail>(testOptions.queryKey);

    const next: TestDetail | undefined = prev
        ? (() => {
          const draft: TestDetail = { ...prev };
          switch (field) {
            case 'behavior':
              draft.behavior_id = idOrNull;
              draft.behavior = value ? ({ id: value.id, name: value.name } as BehaviorReference) : null;
              break;
            case 'topic':
              draft.topic_id = idOrNull;
              draft.topic = value ? ({ id: value.id, name: value.name } as TopicReference) : null;
              break;
            case 'category':
              draft.category_id = idOrNull;
              draft.category = value ? ({ id: value.id, name: value.name } as CategoryReference) : null;
              break;
            case 'test_type':
              draft.test_type_id = idOrNull;
              draft.test_type = value ? ({ id: value.id, type_value: value.name } as TypeLookupReference) : null;
              break;
          }
          return draft;
        })()
        : undefined;

    // Optimistic set
    if (next) {
      await queryClient.cancelQueries({ queryKey: testOptions.queryKey });
      queryClient.setQueryData<TestDetail>(testOptions.queryKey, next);
    }

    try {
      await updateMutation.mutateAsync({
        path: { test_id: test.id as Id },
        body: { [fieldKey]: idOrNull },
      });

      notifications.show(`Successfully ${value ? 'updated' : 'cleared'} test ${field}`, {
        severity: 'success',
        autoHideDuration: 6000,
      });
    } catch (e) {
      // Rollback
      if (prev) {
        queryClient.setQueryData<TestDetail>(testOptions.queryKey, prev);
      }
      throw e;
    } finally {
      // Ensure authoritative data
      await queryClient.invalidateQueries({ queryKey: testOptions.queryKey });
    }
  };

  // Current selection values from the (possibly optimistic) cached test
  const currentIds = {
    behavior: (test.behavior_id as Id | null | undefined) ?? null,
    test_type: (test.test_type_id as Id | null | undefined) ?? null,
    topic: (test.topic_id as Id | null | undefined) ?? null,
    category: (test.category_id as Id | null | undefined) ?? null,
  };

  return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <BaseFreesoloAutocomplete
                options={behaviors}
                value={currentIds.behavior}
                onChange={(val) => {
                  if (typeof val === 'string') {
                    const match = behaviors.find(b => b.name === val);
                    handleUpdate('behavior', match ?? val);
                  } else {
                    handleUpdate('behavior', val);
                  }
                }}
                label="Behavior"
                popperWidth="100%"
            />
          </Box>

          <Box>
            <BaseFreesoloAutocomplete
                options={types}
                value={currentIds.test_type}
                onChange={(val) => {
                  if (typeof val === 'string') {
                    const match = types.find(t => t.name === val);
                    handleUpdate('test_type', match ?? val);
                  } else {
                    handleUpdate('test_type', val);
                  }
                }}
                label="Type"
                popperWidth="100%"
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <BaseFreesoloAutocomplete
                options={topics}
                value={currentIds.topic}
                onChange={(val) => {
                  if (typeof val === 'string') {
                    const match = topics.find(t => t.name === val);
                    handleUpdate('topic', match ?? val);
                  } else {
                    handleUpdate('topic', val);
                  }
                }}
                label="Topic"
                popperWidth="100%"
            />
          </Box>

          <Box>
            <BaseFreesoloAutocomplete
                options={categories}
                value={currentIds.category}
                onChange={(val) => {
                  if (typeof val === 'string') {
                    const match = categories.find(c => c.name === val);
                    handleUpdate('category', match ?? val);
                  } else {
                    handleUpdate('category', val);
                  }
                }}
                label="Category"
                popperWidth="100%"
            />
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Test Executable
          </Typography>
          <TestExecutableField
              testId={test.id as Id}
              promptId={test.prompt_id as Id | undefined}
              initialContent={test.prompt?.content ?? ''}
              onUpdate={() => { /* optional: extra actions */ }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Expected Response
          </Typography>
          <TestExecutableField
              testId={test.id as Id}
              promptId={test.prompt_id as Id | undefined}
              initialContent={test.prompt?.expected_response ?? ''}
              onUpdate={() => { /* optional: extra actions */ }}
              fieldName="expected_response"
          />
        </Grid>

        {test.test_metadata?.sources && test.test_metadata.sources.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Source Documents
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {test.test_metadata.sources.map((s, i) => {
                  const source = s as SourceDoc;
                  return (
                      <Box key={i}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <DocumentIcon sx={{ fontSize: theme.iconSizes?.small ?? 18, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {source.document ?? source.source ?? 'Unknown Document'}
                          </Typography>
                        </Box>
                        <Box
                            sx={{
                              p: 2,
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: t => t.shape.borderRadius * 0.25,
                              backgroundColor: 'background.paper',
                              minHeight: '100px',
                              maxHeight: '300px',
                              overflow: 'auto',
                              fontFamily: 'monospace',
                              fontSize: theme.typography.helperText.fontSize,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                        >
                          {source.content ?? 'No content available'}
                        </Box>
                      </Box>
                  );
                })}
              </Box>
            </Grid>
        )}
      </Grid>
  );
}
