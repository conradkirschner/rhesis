import type { Meta, StoryObj } from '@storybook/react';
import StepMain from '../../ui/steps/StepMain';
import type { UiStepMainProps } from '../../ui/types';

const meta: Meta<typeof StepMain> = {
  title: 'TestSets/StepMain',
  component: StepMain,
};
export default meta;

const baseProps: UiStepMainProps = {
  charts: { stats: null },
  details: {
    name: 'Sample Test Set',
    description: 'A description',
    metadata: { behaviors: ['Helpful'], categories: ['Safety'], topics: ['Privacy'], sources: [] },
    tags: ['demo'],
    onEditName: () => {},
    onEditDescription: () => {},
    onDownload: () => {},
  },
  grid: {
    rows: [
      { id: '1', promptContent: 'Prompt 1', behaviorName: 'Helpful', topicName: 'Privacy' },
      { id: '2', promptContent: 'Prompt 2', behaviorName: 'Honest', topicName: 'Security' },
    ],
    totalRows: 2,
    loading: false,
    pagination: { page: 0, pageSize: 25 },
    onPaginationChange: () => {},
    onRowClick: () => {},
    onRemoveSelected: () => {},
    error: null,
    onRefetch: () => {},
  },
  taskContext: null,
};

export const Default: StoryObj<typeof StepMain> = {
  args: baseProps,
};