import type { Meta, StoryObj } from '@storybook/react';
import StepNewTestsGrid from '../steps/StepNewTestsGrid';
import type { UiNewTestRow, UiOption } from '../types';

const rows: readonly UiNewTestRow[] = [
  {
    id: 'new-1',
    behaviorId: '',
    behaviorName: '',
    // must match UiTestType union
    testType: 'Single interaction tests',
    topicId: '',
    topicName: 'Topic A',
    categoryName: 'Cat',
    priority: 1,
    promptContent: 'Prompt here',
    statusName: 'Draft',
  },
];

const options: readonly UiOption[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

const meta = {
  title: 'Tests/StepNewTestsGrid',
  component: StepNewTestsGrid,
} satisfies Meta<typeof StepNewTestsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rows,
    behaviorOptions: options,
    topicOptions: options,
    onRowUpdate: (newRow) => newRow,
    onRowUpdateError: (_err: Error) => {},
    loading: false,
  },
};
