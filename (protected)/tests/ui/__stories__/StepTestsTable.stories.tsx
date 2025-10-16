import type { Meta, StoryObj } from '@storybook/react';
import StepTestsTable from '../../ui/steps/StepTestsTable';
import type { UiTestRow, UiLookupSets } from '../../ui/types';

const meta = {
  title: 'Tests/StepTestsTable',
  component: StepTestsTable,
} satisfies Meta<typeof StepTestsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows: readonly UiTestRow[] = [
  {
    id: '1',
    content: 'Example prompt content...',
    behaviorName: 'Behavior A',
    topicName: 'Topic 1',
    categoryName: 'Cat X',
    assigneeDisplay: 'Jane Doe',
    comments: 2,
    tasks: 1,
  },
];

const lookups: UiLookupSets = {
  behaviors: [{ id: 'b1', name: 'Behavior A' }],
  topics: [{ id: 't1', name: 'Topic 1' }],
  categories: [{ id: 'c1', name: 'Cat X' }],
  users: [{ id: 'u1', displayName: 'Jane Doe' }],
  statuses: [{ id: 's1', name: 'Open' }],
};

export const Default: Story = {
  args: {
    rows,
    totalCount: 1,
    loading: false,
    error: undefined,
    page: 0,
    pageSize: 25,
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
    lookups,
  },
};