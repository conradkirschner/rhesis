import type { Meta, StoryObj } from '@storybook/react';
import StepList from '../../ui/steps/StepList';
import type { UiStepListProps } from '../../ui/types';

const meta = {
  title: 'TestSets/StepList',
  component: StepList,
} satisfies Meta<typeof StepList>;

export default meta;
type Story = StoryObj<typeof meta>;

const rows: UiStepListProps['rows'] = [
  {
    id: '1',
    name: 'Onboarding Tests',
    behaviors: ['friendly', 'helpful'],
    categories: ['nlp', 'safety'],
    totalTests: 42,
    status: 'Active',
    assigneeDisplay: 'Ada Lovelace',
    comments: 3,
    tasks: 1,
  },
  {
    id: '2',
    name: 'Regression Pack',
    behaviors: ['concise'],
    categories: ['nlp'],
    totalTests: 10,
    status: 'Draft',
  },
] as const;

export const Default: Story = {
  args: {
    rows,
    totalRows: rows.length,
    page: 0,
    pageSize: 25,
    onPageChange: () => {},
    onPageSizeChange: () => {},
    selectedIds: [],
    onSelectionChange: () => {},
    onRowClick: () => {},
    loading: false,
    onNew: () => {},
    onRun: () => {},
    onDelete: () => {},
  },
};