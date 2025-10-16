import type { Meta, StoryObj } from '@storybook/react';
import DashboardCharts from '../DashboardCharts';
import FeaturePageFrame from '../FeaturePageFrame';

const meta: Meta<typeof DashboardCharts> = {
  title: 'Dashboard/Charts',
  component: DashboardCharts,
};
export default meta;

type Story = StoryObj<typeof DashboardCharts>;

export const ChartsExample: Story = {
  args: {
    isLoading: false,
    errorMessage: null,
    testCasesData: [
      { name: 'May 2025', total: 10 },
      { name: 'Jun 2025', total: 25 },
      { name: 'Jul 2025', total: 40 },
    ],
    testExecutionTrendData: [
      { name: 'May 2025', tests: 5, passed: 4, failed: 1 },
      { name: 'Jun 2025', tests: 10, passed: 8, failed: 2 },
      { name: 'Jul 2025', tests: 15, passed: 12, failed: 3 },
    ],
    behaviorData: [
      { name: 'Reliability', value: 10 },
      { name: 'Robustness', value: 6 },
      { name: 'Compliance', value: 3 },
    ],
    categoryData: [
      { name: 'Harmless', value: 12 },
      { name: 'Harmful', value: 5 },
      { name: 'Jailbreak', value: 2 },
    ],
  },
};

export const FrameExample = {
  render: () => (
    <FeaturePageFrame
      charts={<div>Charts here</div>}
      sections={[
        { key: 'a', kind: 'tests', title: 'Newest Tests', content: <div>Table A</div> },
        { key: 'b', kind: 'activities', title: 'Updated Tests', content: <div>Table B</div> },
        { key: 'c', kind: 'testSets', title: 'Newest Test Sets', content: <div>Table C</div> },
        { key: 'd', kind: 'testRuns', title: 'Recent Test Runs', content: <div>Table D</div> },
      ]}
    />
  ),
};