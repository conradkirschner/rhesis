import { EntityType } from '@/api-client/types.gen';

/**
 * Get the display name for an entity type
 * @param entityType The entity type
 * @returns The display name for the entity
 */
export const getEntityDisplayName = (entityType: EntityType): string => {
  const entityMap: Record<EntityType, string> = {
    Test: 'Test',
    TestSet: 'Test Set',
    TestRun: 'Test Run',
    TestResult: 'Test Result',
    Task: 'Task',
    General: 'General',
    Metric: 'Metric',
    Model: 'Model',
    Prompt: 'Prompt',
    Behavior: 'Behavior',
    Category: 'Category',
    Topic: 'Topic',
    Dimension: 'Dimension',
    Demographic: 'Demographic',
    Project: 'Project',
    Source: 'Source'
  };
  return entityMap[entityType] || entityType;
};
