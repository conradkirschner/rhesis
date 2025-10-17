'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateTestsData } from '@/hooks/data/GenerateTests/useGenerateTestsData';
import type {
  UiActionBarProps,
  UiConfigureGenerationProps,
  UiConfirmGenerateProps,
  UiDocument,
  UiReviewSamplesProps,
  UiStepKey,
  UiStepLabels,
  UiStepperHeaderProps,
  UiTestSetGenerationConfig as UiCfg,
  UiUploadDocumentsProps,
} from '../ui/types';
import { FeaturePageFrame } from '../ui/FeaturePageFrame';
import { StepperHeader } from '../ui/StepperHeader';
import { ActionBar } from '../ui/ActionBar';
import { StepConfigureGeneration } from '../ui/steps/StepConfigureGeneration';
import { StepUploadDocuments } from '../ui/steps/StepUploadDocuments';
import { StepReviewSamples } from '../ui/steps/StepReviewSamples';
import { StepConfirmGenerate } from '../ui/steps/StepConfirmGenerate';
import { useNotifications } from '@/components/common/NotificationContext';
import { toPromptFromUiConfig, UiTestSetGenerationConfig as FormatUiCfg } from '@/lib/generate-tests/format';
import type { TestSetGenerationConfig } from '@/api-client/types.gen';

const INITIAL_CONFIG: UiCfg = {
  project_name: null,
  behaviors: [],
  purposes: [],
  test_type: 'single_turn',
  response_generation: 'prompt_only',
  test_coverage: 'focused',
  tags: [],
  description: '',
} as const;

const SUPPORTED_FILE_EXTENSIONS = [
  '.docx',
  '.pptx',
  '.xlsx',
  '.pdf',
  '.txt',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.zip',
  '.epub',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const STEP_LABELS: UiStepLabels = [
  'Configure Generation',
  'Upload Documents',
  'Review Samples',
  'Confirm & Generate',
] as const;

/** Convert readonly-array UI config to mutable arrays expected by API client. */
function toMutableApiConfig(cfg: UiCfg): TestSetGenerationConfig {
  return {
    project_name: cfg.project_name ?? undefined,
    behaviors: [...cfg.behaviors],
    purposes: [...cfg.purposes],
    test_type: cfg.test_type,
    response_generation: cfg.response_generation,
    test_coverage: cfg.test_coverage,
    tags: [...cfg.tags],
    description: cfg.description,
  };
}

/** Convert UI config to the *format* module’s expected type (mutable arrays). */
function toFormatUiConfig(cfg: UiCfg): FormatUiCfg {
  return {
    project_name: cfg.project_name,
    behaviors: [...cfg.behaviors],
    purposes: [...cfg.purposes],
    test_type: cfg.test_type,
    response_generation: cfg.response_generation,
    test_coverage: cfg.test_coverage,
    tags: [...cfg.tags],
    description: cfg.description,
  };
}

type OnFilesSelected = NonNullable<UiConfirmGenerateProps['onFilesSelected']>;
type OnDocumentUpdate = NonNullable<UiConfirmGenerateProps['onDocumentUpdate']>;
type OnDocumentRemove = NonNullable<UiConfirmGenerateProps['onDocumentRemove']>;

export default function GenerateTestsContainer() {
  const router = useRouter();
  const { show } = useNotifications();

  const {
    projects,
    behaviors,
    projectsIsLoading,
    behaviorsIsLoading,
    projectsError,
    behaviorsError,
    processDocument,
    generateSamples,
    loadMoreSamples,
    regenerateSample,
    createTestSet,
  } = useGenerateTestsData();

  const [activeStep, setActiveStep] = useState<UiStepKey>(0);
  const [configData, setConfigData] = useState<UiCfg>(INITIAL_CONFIG);
  const [documents, setDocuments] = useState<UiDocument[]>([]);
  const [samples, setSamples] = useState<UiReviewSamplesProps['samples']>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const onConfigSubmit = useCallback<UiConfigureGenerationProps['onSubmit']>((cfg) => {
    setConfigData(cfg);
    setActiveStep(1);
  }, []);

  const onFilesSelected = useCallback<OnFilesSelected>(
      async (files) => {
        if (!files?.length) return;
        for (const file of files) {
          if (file.size > MAX_FILE_SIZE) {
            show(`File "${file.name}" is too large. Maximum size is 5 MB.`, { severity: 'error' });
            continue;
          }
          const id = Math.random().toString(36).slice(2, 11);
          setDocuments((prev) => [
            ...prev,
            {
              id,
              originalName: file.name,
              name: '',
              description: '',
              path: '',
              content: '',
              status: 'uploading',
            },
          ]);

          try {
            const updateStatus = (s: UiDocument['status']) =>
                setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: s } : d)));

            const result = await processDocument(file, updateStatus);
            setDocuments((prev) =>
                prev.map((d) => (d.id === id ? { ...d, ...result, status: 'completed' } : d)),
            );
            show(`Document "${file.name}" processed successfully`, { severity: 'success' });
          } catch {
            setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'error' } : d)));
            show(`Failed to process document "${file.name}"`, { severity: 'error' });
          }
        }
      },
      [processDocument, show],
  );

  const onDocumentUpdate = useCallback<OnDocumentUpdate>((id, field, value) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }, []);

  const onDocumentRemove = useCallback<OnDocumentRemove>((id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleNext = useCallback<UiActionBarProps['onNext']>(async () => {
    if (activeStep === 1) {
      const hasProcessing = documents.some((d) => d.status !== 'completed' && d.status !== 'error');
      if (hasProcessing) {
        show('Please wait for all documents to finish processing', { severity: 'warning' });
        return;
      }
      setActiveStep(2);
      setIsGenerating(true);
      try {
        const docsPayload = documents
            .filter((d) => d.status === 'completed')
            .map((d) => ({
              name: d.name,
              description: d.description,
              content: d.content,
            }));
        const initial = await generateSamples(toMutableApiConfig(configData), 5, docsPayload);
        setSamples(initial);
        show('Samples generated successfully', { severity: 'success' });
      } catch {
        setActiveStep(1);
        show('Failed to generate samples', { severity: 'error' });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (activeStep === 2) {
      const hasUnrated = samples.some((s) => s.rating === null);
      if (hasUnrated) {
        show('Please rate all samples before proceeding', { severity: 'error' });
        return;
      }
    }

    setActiveStep((prev) => (prev + 1) as UiStepKey);
  }, [activeStep, documents, samples, show, generateSamples, configData]);

  const handleBack = useCallback<UiActionBarProps['onBack']>(() => {
    setActiveStep((prev) => (Math.max(0, prev - 1) as UiStepKey));
  }, []);

  const handleLoadMore = useCallback<UiReviewSamplesProps['onLoadMore']>(async () => {
    try {
      const start = (Math.max(0, ...samples.map((s) => s.id)) || 0) + 1;
      const docsPayload = documents
          .filter((d) => d.status === 'completed')
          .map((d) => ({
            name: d.name,
            description: d.description,
            content: d.content,
          }));
      const more = await loadMoreSamples(start, toMutableApiConfig(configData), docsPayload, 5);
      setSamples((prev) => [...prev, ...more]);
      show('Additional samples loaded', { severity: 'success' });
    } catch {
      show('Failed to load more samples', { severity: 'error' });
    }
  }, [documents, samples, loadMoreSamples, configData, show]);

  const handleRegenerate = useCallback<UiReviewSamplesProps['onRegenerate']>(
      async (sampleId) => {
        const sample = samples.find((s) => s.id === sampleId);
        if (!sample) return;
        const updated = await regenerateSample(sample);
        if (updated) {
          setSamples((prev) => prev.map((s) => (s.id === sampleId ? updated : s)));
          show('Test regenerated successfully', { severity: 'success' });
        } else {
          show('Failed to regenerate test', { severity: 'error' });
        }
      },
      [samples, regenerateSample, show],
  );

  const handleFinish = useCallback<UiActionBarProps['onFinish']>(async () => {
    setIsFinishing(true);
    try {
      const message = await createTestSet(toMutableApiConfig(configData), samples);
      show(message, { severity: 'success' });
      setTimeout(() => router.push('/tests'), 300);
    } catch {
      show('Failed to start test generation. Please try again.', { severity: 'error' });
    } finally {
      setIsFinishing(false);
    }
  }, [configData, samples, createTestSet, router, show]);

  const stepProps = useMemo(() => {
    const docsPayload = documents
        .filter((d) => d.status === 'completed')
        .map((d) => ({
          name: d.name,
          description: d.description,
          content: d.content,
        }));

    return {
      configure: {
        projects,
        behaviors,
        isLoading: projectsIsLoading || behaviorsIsLoading,
        error: projectsError?.message || behaviorsError?.message || null,
        configData,
        onConfigChange: setConfigData,
        onSubmit: onConfigSubmit,
        supportedExtensions: SUPPORTED_FILE_EXTENSIONS as readonly string[],
        toPromptPreview: () => toPromptFromUiConfig(toFormatUiConfig(configData)),
      } satisfies UiConfigureGenerationProps,
      upload: {
        documents,
        onFilesSelected,
        onDocumentUpdate,
        onDocumentRemove,
      } satisfies UiUploadDocumentsProps,
      review: {
        samples,
        isGenerating,
        onSamplesChange: setSamples,
        onLoadMore: handleLoadMore,
        onRegenerate: handleRegenerate,
      } satisfies UiReviewSamplesProps,
      confirm: {
        samples,
        configData,
        documents,
        averageRating:
            samples.filter((s) => s.rating !== null).length > 0
                ? (
                    samples.reduce((acc, s) => acc + (s.rating ?? 0), 0) /
                    samples.filter((s) => s.rating !== null).length
                ).toFixed(1)
                : 'N/A',
        promptPreview: toPromptFromUiConfig(toFormatUiConfig(configData)),
        docsPayload,
      } satisfies UiConfirmGenerateProps,
    };
  }, [
    projects,
    behaviors,
    projectsIsLoading,
    behaviorsIsLoading,
    projectsError,
    behaviorsError,
    configData,
    onConfigSubmit,
    documents,
    samples,
    isGenerating,
    onFilesSelected,
    onDocumentUpdate,
    onDocumentRemove,
    handleLoadMore,
    handleRegenerate,
  ]);

  const headerProps = useMemo(
      () =>
          ({
            activeStep,
            labels: STEP_LABELS,
          } satisfies UiStepperHeaderProps),
      [activeStep],
  );

  const actionBarProps = useMemo(
      () =>
          ({
            activeStep,
            isGenerating,
            isFinishing,
            canGoBack: activeStep > 0,
            onBack: handleBack,
            onNext: handleNext,
            onFinish: handleFinish,
            nextDisabled:
                isGenerating ||
                (activeStep === 1 &&
                    documents.some((d) => d.status !== 'completed' && d.status !== 'error')),
          } satisfies UiActionBarProps),
      [activeStep, documents, isGenerating, isFinishing, handleBack, handleNext, handleFinish],
  );

  const StepMap = useMemo(
      () =>
          ({
            0: <StepConfigureGeneration {...stepProps.configure} />,
            1: <StepUploadDocuments {...stepProps.upload} />,
            2: <StepReviewSamples {...stepProps.review} />,
            3: <StepConfirmGenerate {...stepProps.confirm} />,
          } as const),
      [stepProps],
  );

  return (
      <FeaturePageFrame>
        <StepperHeader {...headerProps} />
        {StepMap[activeStep]}
        <ActionBar {...actionBarProps} />
      </FeaturePageFrame>
  );
}
