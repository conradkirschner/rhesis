export type UiTestRow = {
  readonly id: string;
  readonly content: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly assigneeDisplay: string;
  readonly assigneePicture?: string;
  readonly comments: number;
  readonly tasks: number;
};

export type UiPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type UiCreateTestFormData = {
  readonly statusId: string;
  readonly assigneeId?: string;
  readonly ownerId?: string;
  readonly behaviorName: string;
  readonly topicName: string;
  readonly categoryName: string;
  readonly priorityLevel: UiPriority;
  readonly promptContent: string;
};

export type UiLookupOption = { readonly id: string; readonly name: string };
export type UiUserOption = { readonly id: string; readonly displayName: string; readonly picture?: string };
export type UiStatusOption = { readonly id: string; readonly name: string };

export type UiLookupSets = {
  readonly behaviors: readonly UiLookupOption[];
  readonly topics: readonly UiLookupOption[];
  readonly categories: readonly UiLookupOption[];
  readonly users: readonly UiUserOption[];
  readonly statuses: readonly UiStatusOption[];
};