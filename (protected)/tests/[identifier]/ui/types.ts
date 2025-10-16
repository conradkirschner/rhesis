export interface UiCurrentUser {
  readonly id: string;
  readonly name: string;
  readonly picture?: string;
}

export type UiOwner = {
  readonly id: string;
  readonly name: string;
  readonly avatarUrl?: string;
};