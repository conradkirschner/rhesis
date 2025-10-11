import { UUID } from 'crypto';



export interface TagCreate extends TagBase {}

export interface TagUpdate extends Partial<TagBase> {}

export interface Tag extends TagBase {
  id: UUID;
  created_at: string;
  updated_at: string;
}

export interface TagAssignment {
  entity_id: UUID;
  entity_type: EntityType;
}
