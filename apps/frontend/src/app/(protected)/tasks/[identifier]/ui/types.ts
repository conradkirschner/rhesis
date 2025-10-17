export type UiBreadcrumb = {
  readonly title: string;
  readonly path: string;
};

export type UiUserView = {
  readonly id: string;
  readonly name?: string;
  readonly email?: string;
  readonly picture?: string;
};

export type UiTaskView = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly statusId: string;
  readonly priorityId: string;
  readonly assigneeId: string;
  readonly creator?: UiUserView;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly commentId?: string;
};