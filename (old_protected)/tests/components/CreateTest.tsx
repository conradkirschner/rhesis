'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TextField,
  FormControl,
  Stack,
  MenuItem,
  Autocomplete,
  Box,
  Avatar,
  Typography,
  Divider,
} from '@mui/material';
import BaseFreesoloAutocomplete, {
  AutocompleteOption as FreeSoloOption,
} from '@/components/common/BaseFreesoloAutocomplete';

import type { User, TestBulkCreateRequest } from '@/api-client/types.gen';
import {
  readBehaviorsBehaviorsGetOptions,
  readTopicsTopicsGetOptions,
  readCategoriesCategoriesGetOptions,
  readUsersUsersGetOptions,
  readStatusesStatusesGetOptions,
  createTestsBulkTestsBulkPostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import PersonIcon from '@mui/icons-material/Person';

type AutocompleteOption = FreeSoloOption;

type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

interface TestFormData {
  behavior_id?: string;
  topic_id?: string;
  category_id?: string;
  priorityLevel?: PriorityLevel;
  prompt_content?: string;
  assignee_id?: string |null;
  owner_id?: string | null;
  status_id?: string;
}

interface UserOption extends User {
  displayName: string;
}

interface CreateTestProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  defaultOwnerId?: string;
  submitRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
  test?: {
    behavior?: { id?: string | null; name?: string | null } | null;
    topic?: { id?: string | null; name?: string | null } | null;
    category?: { id?: string | null; name?: string | null } | null;
    priorityLevel?: PriorityLevel | null;
    prompt?: { content?: string | null } | null;
    assignee?: { id?: string | null } | null;
    owner?: { id?: string | null } | null;
    status?: { id?: string | null } | null;
  };
}

const PRIORITY_OPTIONS: PriorityLevel[] = ['Low', 'Medium', 'High', 'Urgent'];

const defaultFormData: TestFormData = {
  behavior_id: undefined,
  topic_id: undefined,
  category_id: undefined,
  priorityLevel: 'Medium',
  prompt_content: '',
  assignee_id: undefined,
  owner_id: undefined,
  status_id: undefined,
};

export default function CreateTest({
                                     onSuccess,
                                     onError,
                                     defaultOwnerId,
                                     submitRef,
                                     test,
                                   }: CreateTestProps) {
  const [formData, setFormData] = useState<TestFormData>(defaultFormData);

  useEffect(() => {
    if (test) {
      setFormData({
        behavior_id: test.behavior?.id ?? test.behavior?.name ?? undefined,
        topic_id: test.topic?.id ?? test.topic?.name ?? undefined,
        category_id: test.category?.id ?? undefined,
        priorityLevel: test.priorityLevel ?? 'Medium',
        prompt_content: test.prompt?.content ?? '',
        assignee_id: test.assignee?.id ?? undefined,
        owner_id: test.owner?.id ?? undefined,
        status_id: test.status?.id ?? undefined,
      });
    } else if (defaultOwnerId) {
      setFormData(prev => ({ ...prev, owner_id: defaultOwnerId }));
    }
  }, [test, defaultOwnerId]);

  // Queries
  const behaviorsQuery = useQuery(
      readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }),
  );
  const topicsQuery = useQuery(
      readTopicsTopicsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }),
  );
  const categoriesQuery = useQuery(
      readCategoriesCategoriesGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }),
  );
  const usersQuery = useQuery(readUsersUsersGetOptions({}));
  const statusesQuery = useQuery(
      readStatusesStatusesGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }),
  );

  // SAFE mapping to AutocompleteOption
  const behaviors: AutocompleteOption[] = useMemo(() => {
    const rows = behaviorsQuery.data?.data ?? [];
    return rows
        .map(b => ({ id: b.id ?? '', name: (b.name ?? '').trim() }))
        .filter(o => o.id && o.name);
  }, [behaviorsQuery.data]);

  const topics: AutocompleteOption[] = useMemo(() => {
    const rows = topicsQuery.data?.data ?? [];
    return rows
        .map(t => ({ id: t.id ?? '', name: (t.name ?? '').trim() }))
        .filter(o => o.id && o.name);
  }, [topicsQuery.data]);

  const categories: AutocompleteOption[] = useMemo(() => {
    const rows = categoriesQuery.data?.data ?? [];
    return rows
        .map(c => ({ id: c.id ?? '', name: (c.name ?? '').trim() }))
        .filter(o => o.id && o.name);
  }, [categoriesQuery.data]);

  const users: UserOption[] = useMemo(
      () =>
          (usersQuery.data?.data ?? []).map(u => ({
            ...u,
            displayName: u.name || `${u.given_name ?? ''} ${u.family_name ?? ''}`.trim() || u.email,
          })),
      [usersQuery.data],
  );

  const statuses = useMemo(() => statusesQuery.data?.data ?? [], [statusesQuery.data]);

  const createMutation = useMutation({
    ...createTestsBulkTestsBulkPostMutation(),
    onSuccess: () => onSuccess?.(),
    onError: (err: unknown) => onError?.(err instanceof Error ? err.message : 'Failed to create test'),
  });

  const isValidUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  const handleFieldChange =
      (field: keyof TestFormData) =>
          (value: AutocompleteOption | string | null) => {
            if (value === null) {
              setFormData(prev => ({ ...prev, [field]: undefined }));
            } else if (typeof value === 'string') {
              setFormData(prev => ({ ...prev, [field]: value }));
            } else if ('inputValue' in value && value.inputValue) {
              setFormData(prev => ({ ...prev, [field]: value.inputValue }));
            } else {
              setFormData(prev => ({ ...prev, [field]: value.id }));
            }
          };

  const handleChange =
      (field: keyof TestFormData) =>
          (event: React.ChangeEvent<HTMLInputElement>) => {
            setFormData(prev => ({ ...prev, [field]: event.target.value }));
          };

  const resetForm = useCallback(() => {
    setFormData({ ...defaultFormData, owner_id: defaultOwnerId });
  }, [defaultOwnerId]);

  const handleSubmit = useCallback(async () => {
    if (!formData.prompt_content || formData.prompt_content.trim() === '') {
      onError?.('Prompt content is required');
      return;
    }

    const priorityMap: Record<PriorityLevel, number> = {
      Low: 0,
      Medium: 1,
      High: 2,
      Urgent: 3,
    };
    const numericPriority = priorityMap[formData.priorityLevel ?? 'Medium'];

    const lookupName = (value?: string, list?: AutocompleteOption[]): string => {
      if (!value) return '';
      const found = list?.find(o => o.id === value);
      return found?.name ?? value.trim();
    };

    const behaviorName = lookupName(formData.behavior_id, behaviors);
    const topicName = lookupName(formData.topic_id, topics);
    const categoryName = lookupName(formData.category_id, categories);

    if (!behaviorName) return onError?.('Behavior is required');
    if (!topicName) return onError?.('Topic is required');
    if (!categoryName) return onError?.('Category is required');

    const promptData = { content: formData.prompt_content ?? '', language_code: 'en' };

    const body: TestBulkCreateRequest = {
      tests: [
        {
          prompt: promptData,
          behavior: behaviorName,
          category: categoryName,
          topic: topicName,
          test_configuration: {},
          priority: numericPriority,
          ...(formData.assignee_id && isValidUUID(formData.assignee_id) ? { assignee_id: formData.assignee_id } : {}),
          ...(formData.owner_id && isValidUUID(formData.owner_id) ? { owner_id: formData.owner_id } : {}),
          ...(formData.status_id ? { status: statuses.find(s => s.id === formData.status_id)?.name } : {}),
        },
      ],
    };

    await createMutation.mutateAsync({ body });
    resetForm();
  }, [formData, behaviors, topics, categories, statuses, createMutation, onError, resetForm]);

  useEffect(() => {
    if (submitRef) submitRef.current = handleSubmit;
  }, [submitRef, handleSubmit]);

  // Helper: ensure Avatar src is string | undefined (never null)
  const srcOrUndefined = (src: string | null | undefined): string | undefined =>
      src ?? undefined;

  return (
      <Stack spacing={3}>
        <Typography variant="subtitle2" color="text.secondary">
          Workflow
        </Typography>

        <FormControl fullWidth>
          <TextField
              select
              label="Status"
              value={formData.status_id ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, status_id: e.target.value }))}
              required
          >
            {statuses.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
            ))}
          </TextField>
        </FormControl>

        {/* Assignee */}
        <Autocomplete
            options={users}
            value={users.find(u => u.id === formData.assignee_id) ?? null}
            onChange={(_, v) => setFormData(prev => ({ ...prev, assignee_id: v?.id }))}
            getOptionLabel={o => o.displayName}
            renderInput={p => (
                <TextField
                    {...p}
                    label="Assignee"
                    InputProps={{
                      ...p.InputProps,
                      startAdornment:
                          formData.assignee_id ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                                <Avatar
                                    src={srcOrUndefined(users.find(u => u.id === formData.assignee_id)?.picture)}
                                    sx={{ width: 24, height: 24 }}
                                >
                                  <PersonIcon />
                                </Avatar>
                              </Box>
                          ) : (
                              p.InputProps.startAdornment
                          ),
                    }}
                />
            )}
            renderOption={(props, option) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { key, ...rest } = props;
              return (
                  <li key={option.id} {...rest}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={srcOrUndefined(option.picture)} sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography>{option.displayName}</Typography>
                    </Box>
                  </li>
              );
            }}
        />

        {/* Owner */}
        <Autocomplete
            options={users}
            value={users.find(u => u.id === formData.owner_id) ?? null}
            onChange={(_, v) => setFormData(prev => ({ ...prev, owner_id: v?.id }))}
            getOptionLabel={o => o.displayName}
            renderInput={p => (
                <TextField
                    {...p}
                    label="Owner"
                    InputProps={{
                      ...p.InputProps,
                      startAdornment:
                          formData.owner_id ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                                <Avatar
                                    src={srcOrUndefined(users.find(u => u.id === formData.owner_id)?.picture)}
                                    sx={{ width: 24, height: 24 }}
                                >
                                  <PersonIcon />
                                </Avatar>
                              </Box>
                          ) : (
                              p.InputProps.startAdornment
                          ),
                    }}
                />
            )}
            renderOption={(props, option) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { key, ...rest } = props;
              return (
                  <li key={option.id} {...rest}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={srcOrUndefined(option.picture)} sx={{ width: 32, height: 32 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography>{option.displayName}</Typography>
                    </Box>
                  </li>
              );
            }}
        />

        <Divider sx={{ my: 1 }} />

        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
          Test Details
        </Typography>

        <BaseFreesoloAutocomplete
            options={behaviors}
            value={formData.behavior_id}
            onChange={handleFieldChange('behavior_id')}
            label="Behavior"
            required
        />

        <BaseFreesoloAutocomplete
            options={topics}
            value={formData.topic_id}
            onChange={handleFieldChange('topic_id')}
            label="Topic"
            required
        />

        <BaseFreesoloAutocomplete
            options={categories}
            value={formData.category_id}
            onChange={handleFieldChange('category_id')}
            label="Category"
            required
        />

        <FormControl fullWidth>
          <TextField
              select
              label="Priority"
              value={formData.priorityLevel ?? 'Medium'}
              onChange={handleChange('priorityLevel')}
              required
          >
            {PRIORITY_OPTIONS.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
            ))}
          </TextField>
        </FormControl>

        <FormControl fullWidth>
          <TextField
              label="Prompt Content"
              value={formData.prompt_content ?? ''}
              onChange={handleChange('prompt_content')}
              multiline
              rows={4}
              required
          />
        </FormControl>
      </Stack>
  );
}
