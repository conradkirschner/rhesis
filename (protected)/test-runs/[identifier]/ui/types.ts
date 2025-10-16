export type UiPromptMap = Record<string, { content: string; name?: string }>;

export type UiBehavior = {
  id: string;
  name: string;
  description?: string;
  metrics: ReadonlyArray<{ name: string; description?: string }>;
};

export type UiTestResult = {
  id: string;
  testId?: string;
  promptId?: string;
  createdAt?: string;
  outputText?: string;
  metrics: Record<
    string,
    { is_successful?: boolean | null; reason?: string | null; score?: number | null; threshold?: number | null }
  >;
  counts?: { comments?: number; tasks?: number };
  tags?: string[];
};

export type UiTestRunHeaderProps = {
  testRun: {
    id: string;
    name?: string;
    startedAt?: string;
    completedAt?: string;
    environment?: string;
    testConfiguration?: {
      testSet?: { id?: string; name?: string };
      endpoint?: { id?: string; name?: string };
    };
  };
  testResults: ReadonlyArray<UiTestResult>;
  onOpenTestSet?: () => void;
  onOpenEndpoint?: () => void;
};

export type UiFilterState = {
  searchQuery: string;
  statusFilter: 'all' | 'passed' | 'failed';
  selectedBehaviors: string[];
};