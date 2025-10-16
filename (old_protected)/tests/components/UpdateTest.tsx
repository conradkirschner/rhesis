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
import PersonIcon from '@mui/icons-material/Person';
import BaseFreesoloAutocomplete, {
  AutocompleteOption as FreeSoloOption,
} from '@/components/common/BaseFreesoloAutocomplete';
import { useMutation, useQuery } from '@tanstack/react-query';

import type {
  TestDetail,
  TestUpdate,
  User,
  StatusDetail,
} from '@/api-client/types.gen';
import {
  readBehaviorsBehaviorsGetOptions,
  readTopicsTopicsGetOptions,
  readCategoriesCategoriesGetOptions,
  readUsersUsersGetOptions,
  readStatusesStatusesGetOptions,
  updateTestTestsTestIdPutMutation,
  updatePromptPromptsPromptIdPutMutation,
  createBehaviorBehaviorsPostMutation,
  createTopicTopicsPostMutation,
  createCategoryCategoriesPostMutation,
} from '@/api-client/@tanstack/react-query.gen';


type AutocompleteOption = FreeSoloOption;
type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

interface TestFormData {
  behavior_id?: string;
  topic_id?: string;
  category_id?: string;
  priorityLevel?: PriorityLevel;
  prompt_content?: string;
  assignee_id?: string;
  owner_id?: string;
  status_id?: string;
}

interface UserOption extends User {
  displayName: string;
}

interface UpdateTestProps {
  test: TestDetail; // required for update
  onSuccess?: () => void;
  onError?: (error: string) => void;
  submitRef?: React.MutableRefObject<(() => Promise<void>) | undefined>;
}

const PRIORITY_OPTIONS: PriorityLevel[] = ['Low', 'Medium', 'High', 'Urgent'];

const isValidUUID = (str: string): boolean =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function UpdateTest({
                                     test,
                                     onSuccess,
                                     onError,
                                     submitRef,
                                   }: UpdateTestProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<TestFormData>({
    behavior_id: test.behavior?.id ?? test.behavior?.name ?? undefined,
    topic_id: test.topic?.id ?? test.topic?.name ?? undefined,
    category_id: test.category?.id ?? test.category?.name ?? undefined,
    priorityLevel: (test as unknown as { priorityLevel?: PriorityLevel })?.priorityLevel ?? 'Medium',
    prompt_content: test.prompt?.content ?? '',
    assignee_id: test.assignee?.id ?? undefined,
    owner_id: test.owner?.id ?? undefined,
    status_id: test.status?.id ?? undefined,
  });

  const behaviorsQ = useQuery(
      readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }),
  );
  const topicsQ = useQuery(
      readTopicsTopicsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }),
  );
  const categoriesQ = useQuery(
      readCategoriesCategoriesGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }),
  );
  const usersQ = useQuery(readUsersUsersGetOptions({}));
  const statusesQ = useQuery(
      readStatusesStatusesGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }),
  );

  const behaviors: AutocompleteOption[] = useMemo(
      () =>
          (behaviorsQ.data?.data ?? [])
              .map(b => ({ id: b.id ?? '', name: (b.name ?? '').trim() }))
              .filter(o => o.id && o.name),
      [behaviorsQ.data],
  );

  const topics: AutocompleteOption[] = useMemo(
      () =>
          (topicsQ.data?.data ?? [])
              .map(t => ({ id: t.id ?? '', name: (t.name ?? '').trim() }))
              .filter(o => o.id && o.name),
      [topicsQ.data],
  );

  const categories: AutocompleteOption[] = useMemo(
      () =>
          (categoriesQ.data?.data ?? [])
              .map(c => ({ id: c.id ?? '', name: (c.name ?? '').trim() }))
              .filter(o => o.id && o.name),
      [categoriesQ.data],
  );

  const users: UserOption[] = useMemo(
      () =>
          (usersQ.data?.data ?? []).map(u => ({
            ...u,
            displayName:
                u.name ||
                `${u.given_name ?? ''} ${u.family_name ?? ''}`.trim() ||
                u.email,
          })),
      [usersQ.data],
  );

  const statuses: StatusDetail[] = useMemo(
      () => (statusesQ.data?.data ?? []),
      [statusesQ.data],
  );

  const updateTestMutation = useMutation(updateTestTestsTestIdPutMutation());
  const updatePromptMutation = useMutation(updatePromptPromptsPromptIdPutMutation());

  const createBehaviorMutation = useMutation(createBehaviorBehaviorsPostMutation());
  const createTopicMutation = useMutation(createTopicTopicsPostMutation());
  const createCategoryMutation = useMutation(createCategoryCategoriesPostMutation());

  /** Keep form in sync if parent `test` changes */
  useEffect(() => {
    setFormData({
      behavior_id: test.behavior?.id ?? test.behavior?.name ?? undefined,
      topic_id: test.topic?.id ?? test.topic?.name ?? undefined,
      category_id: test.category?.id ?? test.category?.name ?? undefined,
      priorityLevel: (test as unknown as { priorityLevel?: PriorityLevel })?.priorityLevel ?? 'Medium',
      prompt_content: test.prompt?.content ?? '',
      assignee_id: test.assignee?.id ?? undefined,
      owner_id: test.owner?.id ?? undefined,
      status_id: test.status?.id ?? undefined,
    });
  }, [test]);

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

  const PRIORITY_MAP: Readonly<Record<PriorityLevel, number>> = Object.freeze({
    Low: 0,
    Medium: 1,
    High: 2,
    Urgent: 3,
  });

  const validateEntityName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Entity name cannot be empty');
    if (trimmed.length < 2) throw new Error('Entity name must be at least 2 characters long');
    return trimmed;
  };

  /** Ensure we have an ID for an entered value (ID or name); create if needed */
  const ensureEntityId = useCallback(
      async (
          value: string | undefined,
          list: AutocompleteOption[],
          createFn: (name: string) => Promise<{ id: string; name: string }>,
      ): Promise<string> => {
        if (!value) throw new Error('Required field is missing');

        // If it's a UUID, accept it (prefer list match if present)
        if (isValidUUID(value)) {
          const match = list.find(o => o.id === value);
          return match?.id ?? value;
        }

        // Treat it as a name
        const name = validateEntityName(value);
        const existing = list.find(o => o.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing.id;

        // Create new
        const created = await createFn(name);
        return created.id;
      },
      [],
  );

  const createBehavior = useCallback(
      async (name: string) => {
        const res = await createBehaviorMutation.mutateAsync({ body: { name } });
        // Optimistically extend local list (so future lookups see it)
        if (res?.id && res?.name) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          behaviors.push({ id: res.id, name: res.name });
        }
        return { id: res.id ?? '', name: res.name ?? name };
      },
      [createBehaviorMutation, behaviors],
  );

  const createTopic = useCallback(
      async (name: string) => {
        const res = await createTopicMutation.mutateAsync({ body: { name } });
        if (res?.id && res?.name) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          topics.push({ id: res.id, name: res.name });
        }
        return { id: res.id ?? '', name: res.name ?? name };
      },
      [createTopicMutation, topics],
  );

  const createCategory = useCallback(
      async (name: string) => {
        const res = await createCategoryMutation.mutateAsync({ body: { name } });
        if (res?.id && res?.name) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          categories.push({ id: res.id, name: res.name });
        }
        return { id: res.id ?? '', name: res.name ?? name };
      },
      [createCategoryMutation, categories],
  );

  /** Submit */
  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);

      // Prompt content
      const nextContent = (formData.prompt_content ?? '').trim();
      if (!nextContent) {
        onError?.('Prompt content is required');
        return;
      }

      if (nextContent !== (test.prompt?.content ?? '')) {
        await updatePromptMutation.mutateAsync({
          path: { prompt_id: test.prompt_id },
          body: { content: nextContent, language_code: 'en' },
        });
      }

      // Ensure IDs for behavior/topic/category
      const behavior_id = await ensureEntityId(formData.behavior_id, behaviors, createBehavior);
      const topic_id = await ensureEntityId(formData.topic_id, topics, createTopic);
      const category_id = await ensureEntityId(formData.category_id, categories, createCategory);

      const updateBody: TestUpdate = {
        behavior_id,
        topic_id,
        category_id,
        priority: PRIORITY_MAP[formData.priorityLevel ?? 'Medium'],
        assignee_id: formData.assignee_id,
        owner_id: formData.owner_id,
        status_id: formData.status_id,
      };

      await updateTestMutation.mutateAsync({
        path: { test_id: test.id },
        body: updateBody,
      });

      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update test');
    } finally {
      setLoading(false);
    }
  }, [formData.prompt_content, formData.behavior_id, formData.topic_id, formData.category_id, formData.priorityLevel, formData.assignee_id, formData.owner_id, formData.status_id, test.prompt?.content, test.id, test.prompt_id, ensureEntityId, behaviors, createBehavior, topics, createTopic, categories, createCategory, PRIORITY_MAP, updateTestMutation, onSuccess, onError, updatePromptMutation]);

  /** Expose submit via ref */
  useEffect(() => {
    if (submitRef) submitRef.current = handleSubmit;
  }, [submitRef, handleSubmit]);

  return (
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Workflow
        </Typography>

        {/* Status */}
        <FormControl fullWidth>
          <TextField
              select
              label="Status"
              value={formData.status_id ?? ''}
              onChange={e => setFormData(prev => ({ ...prev, status_id: e.target.value }))}
              required
              disabled={loading}
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
            onChange={(_, v) => setFormData(prev => ({ ...prev, assignee_id: v?.id??undefined }))}
            getOptionLabel={o => o.displayName}
            disabled={loading}
            renderInput={p => (
                <TextField
                    {...p}
                    label="Assignee"
                    InputProps={{
                      ...p.InputProps,
                      startAdornment: formData.assignee_id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                            <Avatar
                                src={users.find(u => u.id === formData.assignee_id)?.picture ?? undefined}
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
                      <Avatar src={option.picture ?? undefined} sx={{ width: 32, height: 32 }}>
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
            onChange={(_, v) => setFormData(prev => ({ ...prev, owner_id: v?.id??undefined }))}
            getOptionLabel={o => o.displayName}
            disabled={loading}
            renderInput={p => (
                <TextField
                    {...p}
                    label="Owner"
                    InputProps={{
                      ...p.InputProps,
                      startAdornment: formData.owner_id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                            <Avatar
                                src={users.find(u => u.id === formData.owner_id)?.picture ?? undefined}
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
                      <Avatar src={option.picture ?? undefined} sx={{ width: 32, height: 32 }}>
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
              disabled={loading}
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
              disabled={loading}
          />
        </FormControl>
      </Stack>
  );
}
