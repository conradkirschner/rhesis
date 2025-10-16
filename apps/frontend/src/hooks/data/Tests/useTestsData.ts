import { keepPreviousData, useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  readTestsTestsGetOptions,
  deleteTestTestsTestIdDeleteMutation,
  associateTestsWithTestSetTestSetsTestSetIdAssociatePostMutation,
  readBehaviorsBehaviorsGetOptions,
  readTopicsTopicsGetOptions,
  readCategoriesCategoriesGetOptions,
  readUsersUsersGetOptions,
  readStatusesStatusesGetOptions,
  createBehaviorBehaviorsPostMutation,
  createTopicTopicsPostMutation,
  createCategoryCategoriesPostMutation,
  createTestsBulkTestsBulkPostMutation,
  updatePromptPromptsPromptIdPutMutation,
  updateTestTestsTestIdPutMutation,
  generateTestStatsTestsStatsGetOptions,
} from '@/api-client/@tanstack/react-query.gen';

type SortOrder = 'asc' | 'desc';

export type TestsListItem = {
  readonly id: string;
  readonly promptContent: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly assignee?: {
    readonly id?: string;
    readonly displayName: string;
    readonly picture?: string;
  } | null;
  readonly counts: {
    readonly comments: number;
    readonly tasks: number;
  };
};

export type LookupOption = { readonly id: string; readonly name: string };
export type UserOption = { readonly id: string; readonly displayName: string; readonly picture?: string };
export type StatusOption = { readonly id: string; readonly name: string };
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export type CreateTestInput = {
  readonly promptContent: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly priorityLevel: PriorityLevel;
  readonly assigneeId?: string | null;
  readonly ownerId?: string | null;
  readonly statusId: string;
};

export type UpdateTestInput = {
  readonly testId: string;
  readonly promptId: string;
  readonly nextPromptContent: string;
  readonly behaviorOrId: string; // UUID or name
  readonly topicOrId: string; // UUID or name
  readonly categoryOrId: string; // UUID or name
  readonly priorityLevel: PriorityLevel;
  readonly assigneeId?: string | null;
  readonly ownerId?: string | null;
  readonly statusId: string;
};

export type PieDatum = { readonly name: string; readonly value: number };

export type UseTestsDataArgs = {
  readonly skip: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: SortOrder;
  readonly odataFilter?: string;
};

const PRIORITY_MAP: Readonly<Record<PriorityLevel, number>> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Urgent: 3,
} as const;

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Data access for Tests feature. Owns all SDK I/O and returns minimal serializable shapes + mutation fns.
 */
export function useTestsData(args: UseTestsDataArgs) {
  const {
    skip,
    limit,
    sortBy = 'created_at',
    sortOrder = 'desc',
    odataFilter,
  } = args;

  // LIST
  const listQuery = useQuery({
    ...readTestsTestsGetOptions({
      query: {
        skip,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...(odataFilter ? { $filter: odataFilter } : {}),
      },
    }),
    placeholderData: keepPreviousData,
  });

  const rows: readonly TestsListItem[] =
    (listQuery.data?.data ?? []).map((r) => {
      const displayName =
        r.assignee?.name ||
        `${r.assignee?.given_name ?? ''} ${r.assignee?.family_name ?? ''}`.trim() ||
        r.assignee?.email ||
        '';
      return {
        id: r.id ?? '',
        promptContent: r.prompt?.content ?? '',
        behaviorName: r.behavior?.name ?? '',
        topicName: r.topic?.name ?? '',
        categoryName: r.category?.name ?? '',
        assignee: r.assignee
          ? {
              id: r.assignee.id ?? undefined,
              displayName,
              picture: r.assignee.picture ?? undefined,
            }
          : null,
        counts: {
          comments: r.counts?.comments ?? 0,
          tasks: r.counts?.tasks ?? 0,
        },
      };
    }) ?? [];

  const totalCount = listQuery.data?.pagination?.totalCount ?? 0;

  // LOOKUPS
  const behaviorsQ = useQuery(readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }));
  const topicsQ = useQuery(readTopicsTopicsGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }));
  const categoriesQ = useQuery(readCategoriesCategoriesGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }));
  const usersQ = useQuery(readUsersUsersGetOptions({}));
  const statusesQ = useQuery(readStatusesStatusesGetOptions({ query: { sort_by: 'name', sort_order: 'asc', entity_type: 'Test' } }));

  const behaviors: readonly LookupOption[] =
    (behaviorsQ.data?.data ?? [])
      .map((b) => ({ id: b.id ?? '', name: (b.name ?? '').trim() }))
      .filter((o) => o.id && o.name);

  const topics: readonly LookupOption[] =
    (topicsQ.data?.data ?? [])
      .map((t) => ({ id: t.id ?? '', name: (t.name ?? '').trim() }))
      .filter((o) => o.id && o.name);

  const categories: readonly LookupOption[] =
    (categoriesQ.data?.data ?? [])
      .map((c) => ({ id: c.id ?? '', name: (c.name ?? '').trim() }))
      .filter((o) => o.id && o.name);

  const users: readonly UserOption[] =
    (usersQ.data?.data ?? []).map((u) => ({
      id: u.id ?? '',
      displayName: u.name || `${u.given_name ?? ''} ${u.family_name ?? ''}`.trim() || u.email || '',
      picture: u.picture ?? undefined,
    }));

  const statuses: readonly StatusOption[] =
    (statusesQ.data?.data ?? []).map((s) => ({ id: s.id ?? '', name: s.name ?? '' })).filter((s) => s.id && s.name);

  // STATS
  const topMax = Math.max(5, 3, 5, 5);
  const statsQ: UseQueryResult<any, unknown> = useQuery(
    generateTestStatsTestsStatsGetOptions({ query: { top: topMax, months: 1 } }),
  );

  const toPie = (bucket: { breakdown?: Record<string, number> | null } | null | undefined, top: number): readonly PieDatum[] => {
    if (!bucket?.breakdown) return [{ name: 'No data', value: 100 }];
    return Object.entries(bucket.breakdown)
      .map(([name, value]) => ({ name, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, top);
  };

  const pies = {
    behavior: toPie(statsQ.data?.stats?.behavior ?? statsQ.data?.data?.stats?.behavior, 5),
    topic: toPie(statsQ.data?.stats?.topic ?? statsQ.data?.data?.stats?.topic, 3),
    category: toPie(statsQ.data?.stats?.category ?? statsQ.data?.data?.stats?.category, 5),
    status: toPie(statsQ.data?.stats?.status ?? statsQ.data?.data?.stats?.status, 5),
  } as const;

  // MUTATIONS
  const deleteM = useMutation(deleteTestTestsTestIdDeleteMutation());
  const associateM = useMutation(associateTestsWithTestSetTestSetsTestSetIdAssociatePostMutation());
  const createBehaviorM = useMutation(createBehaviorBehaviorsPostMutation());
  const createTopicM = useMutation(createTopicTopicsPostMutation());
  const createCategoryM = useMutation(createCategoryCategoriesPostMutation());
  const createBulkM = useMutation(createTestsBulkTestsBulkPostMutation());
  const updatePromptM = useMutation(updatePromptPromptsPromptIdPutMutation());
  const updateTestM = useMutation(updateTestTestsTestIdPutMutation());

  const ensureId = async (
    value: string,
    list: readonly LookupOption[],
    create: (name: string) => Promise<LookupOption>,
  ): Promise<string> => {
    if (isUUID(value)) {
      const match = list.find((o) => o.id === value);
      return match?.id ?? value;
    }
    const name = value.trim();
    const found = list.find((o) => o.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;
    const created = await create(name);
    return created.id;
  };

  const createBehavior = async (name: string): Promise<LookupOption> => {
    const res = await createBehaviorM.mutateAsync({ body: { name } });
    return { id: res.id ?? '', name: res.name ?? name };
  };
  const createTopic = async (name: string): Promise<LookupOption> => {
    const res = await createTopicM.mutateAsync({ body: { name } });
    return { id: res.id ?? '', name: res.name ?? name };
  };
  const createCategory = async (name: string): Promise<LookupOption> => {
    const res = await createCategoryM.mutateAsync({ body: { name } });
    return { id: res.id ?? '', name: res.name ?? name };
  };

  const deleteTests = async (ids: readonly string[]) => {
    await Promise.all(ids.map((id) => deleteM.mutateAsync({ path: { test_id: id } })));
  };

  const associateWithTestSet = async (testSetId: string, testIds: readonly string[]) => {
    await associateM.mutateAsync({
      path: { test_set_id: testSetId },
      body: { test_ids: [...testIds] },
    });
  };

  const createSingleTest = async (input: CreateTestInput) => {
    const statusName = statuses.find((s) => s.id === input.statusId)?.name ?? '';
    await createBulkM.mutateAsync({
      body: {
        tests: [
          {
            prompt: { content: input.promptContent, language_code: 'en' },
            behavior: input.behaviorName,
            category: input.categoryName,
            topic: input.topicName,
            test_configuration: {},
            priority: PRIORITY_MAP[input.priorityLevel],
            ...(input.assigneeId ? { assignee_id: input.assigneeId } : {}),
            ...(input.ownerId ? { owner_id: input.ownerId } : {}),
            ...(statusName ? { status: statusName } : {}),
          },
        ],
      },
    });
  };

  const updateSingleTest = async (input: UpdateTestInput) => {
    const statusId = input.statusId;
    const behavior_id = await ensureId(input.behaviorOrId, behaviors, createBehavior);
    const topic_id = await ensureId(input.topicOrId, topics, createTopic);
    const category_id = await ensureId(input.categoryOrId, categories, createCategory);

    const nextContent = input.nextPromptContent.trim();
    if (nextContent) {
      await updatePromptM.mutateAsync({
        path: { prompt_id: input.promptId },
        body: { content: nextContent, language_code: 'en' },
      });
    }

    await updateTestM.mutateAsync({
      path: { test_id: input.testId },
      body: {
        behavior_id,
        topic_id,
        category_id,
        priority: PRIORITY_MAP[input.priorityLevel],
        assignee_id: input.assigneeId ?? undefined,
        owner_id: input.ownerId ?? undefined,
        status_id: statusId,
      },
    });
  };

  return {
    list: {
      rows,
      totalCount,
      isFetching: listQuery.isFetching,
      error: (listQuery.error as Error | undefined)?.message ?? null,
      refetch: listQuery.refetch,
    },
    lookups: {
      behaviors,
      topics,
      categories,
      users,
      statuses,
    },
    stats: {
      pies,
      isFetching: statsQ.isFetching,
      error: (statsQ.error as Error | undefined)?.message ?? null,
    },
    mutations: {
      deleteTests,
      associateWithTestSet,
      createSingleTest,
      updateSingleTest,
    },
  } as const;
}