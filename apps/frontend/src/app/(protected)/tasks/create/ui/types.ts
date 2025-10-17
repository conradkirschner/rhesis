export type UiUserOption = Readonly<{
  id: string;
  label: string;
  picture?: string;
}>;

export type UiStatusOption = Readonly<{
  id: string;
  name: string;
}>;

export type UiPriorityOption = Readonly<{
  id: string;
  label: string;
}>;

export type UiTaskFormState = Readonly<{
  title: string;
  description: string;
  statusId: string;
  priorityId: string;
  assigneeId?: string;
  entityType?: string;
  entityId?: string;
  commentId?: string;
}>;