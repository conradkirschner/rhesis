import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, QueryClient } from '@tanstack/react-query';
import {
  readProjectsProjectsGetOptions,
  readBehaviorsBehaviorsGetOptions,
  uploadDocumentServicesDocumentsUploadPostMutation,
  extractDocumentContentServicesDocumentsExtractPostMutation,
  generateTextServicesGenerateTextPostMutation,
  generateTestsEndpointServicesGenerateTestsPostMutation,
  generateTestSetTestSetsGeneratePostMutation,
} from '@/api-client/@tanstack/react-query.gen';
import type {
  GenerateTestsPrompt,
  GenerationSample,
  TestSetGenerationConfig as SdkTestSetGenerationConfig,
} from '@/api-client';
import { toPromptFromUiConfig } from '@/lib/generate-tests/format';

type HookProject = { readonly id: string; readonly name: string };
type HookBehavior = { readonly id: string; readonly name: string };
export type HookDocStatus = 'uploading' | 'extracting' | 'generating' | 'completed' | 'error';

export type HookProcessedDocument = {
  readonly id: string;
  readonly originalName: string;
  readonly path: string;
  readonly name: string;
  readonly description: string;
  readonly content: string;
  readonly status: HookDocStatus;
};

export type HookSample = {
  readonly id: number;
  readonly text: string;
  readonly behavior: string;
  readonly topic: string;
  readonly rating: number | null;
  readonly feedback: string;
};

export function useGenerateTestsData() {
  const projectsQuery = useQuery({
    ...readProjectsProjectsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }),
    staleTime: 60_000,
  });

  const behaviorsQuery = useQuery({
    ...readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }),
    staleTime: 60_000,
  });

  const uploadMutation = useMutation({ ...uploadDocumentServicesDocumentsUploadPostMutation() });
  const extractMutation = useMutation({ ...extractDocumentContentServicesDocumentsExtractPostMutation() });
  const genTextForMetadata = useMutation({ ...generateTextServicesGenerateTextPostMutation() });
  const generateTestsMut = useMutation({ ...generateTestsEndpointServicesGenerateTestsPostMutation() });
  const generateTestSetMut = useMutation({ ...generateTestSetTestSetsGeneratePostMutation() });

  const projects: readonly HookProject[] = useMemo(
    () =>
      (projectsQuery.data?.data ?? [])
        .map((p) => ({ id: String(p.id ?? ''), name: String(p.name ?? '').trim() }))
        .filter((p) => p.id && p.name),
    [projectsQuery.data],
  );

  const behaviors: readonly HookBehavior[] = useMemo(
    () =>
      (behaviorsQuery.data?.data ?? [])
        .map((b) => ({ id: String(b.id ?? ''), name: String(b.name ?? '').trim() }))
        .filter((b) => b.id && b.name),
    [behaviorsQuery.data],
  );

  const processDocument = useCallback(
    async (
      file: File,
      onStatus?: (s: HookDocStatus) => void,
    ): Promise<Pick<HookProcessedDocument, 'name' | 'description' | 'content' | 'path'>> => {
      const filenameBase = (name: string) => name.replace(/\.[^/.]+$/, '');
      const parseLLMMetadata = (output: string, fallbackName: string, fallbackDesc: string) => {
        try {
          const parsed = JSON.parse(output) as { name?: string; description?: string };
          return {
            name: (parsed.name ?? '').trim() || fallbackName,
            description: (parsed.description ?? '').trim() || fallbackDesc,
          };
        } catch {
          return { name: fallbackName, description: fallbackDesc };
        }
      };

      onStatus?.('uploading');
      const uploadRes = await uploadMutation.mutateAsync({ body: { document: file } });
      const uploadPath = uploadRes.path ?? '';
      onStatus?.('extracting');

      const extractRes = await extractMutation.mutateAsync({ body: { path: uploadPath } });
      const extracted = extractRes.content ?? '';
      onStatus?.('generating');

      const fallbackName = filenameBase(file.name);
      const fallbackDesc = extracted.slice(0, 160);

      const metaRes = await genTextForMetadata.mutateAsync({
        body: {
          prompt:
            'Given the following document content, produce a short JSON object with "name" and "description". Output ONLY JSON.\n\n---\n' +
            extracted +
            '\n---',
          stream: false,
        },
      });

      const outputText = metaRes.text ?? '';
      const { name, description } = parseLLMMetadata(outputText, fallbackName, fallbackDesc);
      onStatus?.('completed');

      return { name, description, content: extracted, path: uploadPath };
    },
    [uploadMutation, extractMutation, genTextForMetadata],
  );

  const generateSamples = useCallback(
    async (uiConfig: SdkTestSetGenerationConfig, num: number, docs: Array<{ name: string; description: string; content: string }>) => {
      const prompt = toPromptFromUiConfig(uiConfig);
      const res = await generateTestsMut.mutateAsync({
        body: {
          prompt,
          num_tests: num,
          documents: docs,
        },
      });

      const tests = res.tests ?? [];
      const samples: HookSample[] = tests.map((t, i) => ({
        id: i + 1,
        text: t.prompt.content,
        behavior: t.behavior,
        topic: t.topic,
        rating: null,
        feedback: '',
      }));
      return samples;
    },
    [generateTestsMut],
  );

  const loadMoreSamples = useCallback(
    async (
      startFrom: number,
      uiConfig: SdkTestSetGenerationConfig,
      docs: Array<{ name: string; description: string; content: string }>,
      num = 5,
    ) => {
      const prompt: GenerateTestsPrompt = toPromptFromUiConfig(uiConfig);
      const res = await generateTestsMut.mutateAsync({
        body: { prompt, num_tests: num, documents: docs },
      });
      const tests = res.tests ?? [];
      const more: HookSample[] = tests.map((t, i) => ({
        id: startFrom + i,
        text: t.prompt.content,
        behavior: t.behavior,
        topic: t.topic,
        rating: null,
        feedback: '',
      }));
      return more;
    },
    [generateTestsMut],
  );

  const regenerateSample = useCallback(
    async (sample: HookSample) => {
      if (!sample.feedback || sample.rating === null || sample.rating >= 4) return null;

      const res = await generateTestsMut.mutateAsync({
        body: {
          prompt: {
            original_test: sample.text,
            test_type: sample.behavior as 'Single interaction tests' | 'Multi-turn conversation tests',
            topic: sample.topic,
            user_rating: `${sample.rating}/5 stars`,
            improvement_feedback: sample.feedback,
            instruction: 'Please generate a new version that addresses the feedback.',
          },
          num_tests: 1,
        },
      });

      const t = res.tests?.[0];
      if (!t) return null;

      const updated: HookSample = {
        id: sample.id,
        text: t.prompt.content,
        behavior: t.behavior,
        topic: t.topic,
        rating: null,
        feedback: '',
      };
      return updated;
    },
    [generateTestsMut],
  );

  const createTestSet = useCallback(
    async (config: SdkTestSetGenerationConfig, samples: ReadonlyArray<HookSample>) => {
      const payloadSamples:Array<GenerationSample> = samples.map((s) => ({
        id: s.id,
        text: s.text,
        behavior: s.behavior,
        topic: s.topic,
        rating: s.rating,
        feedback: s.feedback,
      }));
      const res = await generateTestSetMut.mutateAsync({
        body: {
          config,
          samples: payloadSamples,
          synthesizer_type: 'prompt',
          batch_size: 20,
        },
      });
      return res.message ?? 'Generation started';
    },
    [generateTestSetMut],
  );

  return {
    projects,
    projectsIsLoading: projectsQuery.isLoading,
    projectsError: projectsQuery.error as Error | null,
    behaviors,
    behaviorsIsLoading: behaviorsQuery.isLoading,
    behaviorsError: behaviorsQuery.error as Error | null,
    processDocument,
    generateSamples,
    loadMoreSamples,
    regenerateSample,
    createTestSet,
  };
}

export async function prefetchGenerateTests(queryClient: QueryClient) {
  await Promise.all([
    queryClient.prefetchQuery({ ...readProjectsProjectsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }), staleTime: 60_000 }),
    queryClient.prefetchQuery({ ...readBehaviorsBehaviorsGetOptions({ query: { sort_by: 'name', sort_order: 'asc' } }), staleTime: 60_000 }),
  ]);
}