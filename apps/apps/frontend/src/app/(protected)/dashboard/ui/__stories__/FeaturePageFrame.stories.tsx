import type { Meta, StoryObj } from '@storybook/react';
import FeaturePageFrame from '../FeaturePageFrame';
import type { UiDashboardViewProps } from '../types';

const meta: Meta<typeof FeaturePageFrame> = {
  title: 'Dashboard/FeaturePageFrame',
  component: FeaturePageFrame,
};
export default meta;

type Story = StoryObj<typeof FeaturePageFrame>;

const sampleProps: UiDashboardViewProps = {
  charts: {
    data: {
      testCasesData: [
        { name: 'May 2025', total: 10 },
        { name: 'Jun 2025', total: 20 },
        { name: 'Jul 2025', total: 35 },
        { name: 'Aug 2025', total: 42 },
        { name: 'Sep 2025', total: 55 },
        { name: 'Oct 2025', total: 60 },
      ],
      testExecutionTrendData: [
        { name: 'May 2025', tests: 10, passed: 8, failed: 2, pass_rate: 80 },
        { name: 'Jun 2025', tests: 12, passed: 9, failed: 3, pass_rate: 75 },
      ],
      behaviorData: [
        { name: 'Reliability', value: 5 },
        { name: 'Robustness', value: 3 },
        { name: 'Compliance', value: 2 },
      ],
      categoryData: [
        { name: 'Harmless', value: 6 },
        { name: 'Harmful', value: 3 },
        { name: 'Jailbreak', value: 1 },
      ],
    },
    isLoading: false,
    error: null,
  },
  recentCreated: {
    title: 'Newest Tests',
    rows: [
      {
        id: '1',
        behaviorName: 'Reliability',
        topicName: 'General',
        prompt: 'Explain gravity',
        ownerDisplayName: 'Ada Lovelace',
        createdAt: '2025-10-10T10:00:00Z',
      },
    ],
    totalRows: 1,
    loading: false,
    error: null,
    pagination: { page: 0, pageSize: 10 },
    onChangePagination: () => {},
    linkBasePath: '/tests',
  },
  recentUpdated: {
    title: 'Updated Tests',
    rows: [
      {
        id: '2',
        behaviorName: 'Compliance',
        topicName: 'Policy',
        prompt: 'List safety rules',
        ownerDisplayName: 'Alan Turing',
        updatedAt: '2025-10-12T09:00:00Z',
      },
    ],
    totalRows: 1,
    loading: false,
    error: null,
    pagination: { page: 0, pageSize: 10 },
    onChangePagination: () => {},
    linkBasePath: '/tests',
  },
  testSets: {
    title: 'Newest Test Sets',
    rows: [{ id: 'ts1', name: 'Core Safety', description: 'Base checks', visibility: 'Public' }],
    totalRows: 1,
    loading: false,
    error: null,
    pagination: { page: 0, pageSize: 10 },
    onChangePagination: () => {},
    linkBasePath: '/test-sets',
  },
};

export const Default: Story = { args: sampleProps };