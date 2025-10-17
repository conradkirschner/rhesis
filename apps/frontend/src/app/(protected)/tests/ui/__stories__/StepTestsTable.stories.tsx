import type { Meta, StoryObj } from '@storybook/react';
import StepTestsTable from '../steps/StepTestsTable';
import type { UiTestRow } from '../types';

const meta: Meta<typeof StepTestsTable> = {
  title: 'Tests/StepTestsTable',
  component: StepTestsTable,
};
export default meta;

type Story = StoryObj<typeof StepTestsTable>;

const rows: readonly UiTestRow[] = [
  {
    id: '1',
    content: 'Prompt content',
    behaviorName: 'Helpful',
    topicName: 'Billing',
    categoryName: 'Regression',
    assigneeDisplay: 'Jane Doe',
    comments: 3,
    tasks: 1,
  },
];

export const Default: Story = {
  args: {
    rows,
    totalCount: rows.length,
    page: 0,
    pageSize: 25,
    loading: false,
    error: undefined,
    onPaginationChange: () => {},
    onFilterODataChange: () => {},
    selectedIds: [],
    onSelectedIdsChange: () => {},
    onRowClick: () => {},
    onDeleteSelected: () => {},
    onAssociateSelected: () => {},
    onCreateTest: () => {},
    onGenerateTests: () => {},
    onWriteMultiple: () => {},
  },
};
