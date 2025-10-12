// types/project-ui.ts
import type { ProjectDetail } from '@/api-client/types.gen';

/** Valid environment types for projects (UI-only) */
export type ProjectEnvironment = 'development' | 'staging' | 'production';

/** Valid use cases for projects (UI-only) */
export type ProjectUseCase = 'chatbot' | 'assistant' | 'advisor' | 'other';

/** UI/Frontend-only extension fields, not part of the API model */
export interface ProjectMeta {
    environment?: ProjectEnvironment | string;
    useCase?: ProjectUseCase | string;
    icon?: string;
    tags?: string[];
    createdAt?: string; // optional camelCase mirror for convenience
    system?: {
        name: string;
        description: string;
        primary_goals: string[];
        key_capabilities: string[];
    };
    agents?: Array<{
        name: string;
        description: string;
        responsibilities: string[];
    }>;
    requirements?: Array<{ name: string; description: string }>;
    scenarios?: Array<{ name: string; description: string }>;
    personas?: Array<{ name: string; description: string }>;
}

/** View-model that keeps API data separate from UI meta */
export interface ProjectView {
    api: ProjectDetail;
    meta?: ProjectMeta;
}

/** Helper to build a view-model */
export function toProjectView(api: ProjectDetail, meta?: ProjectMeta): ProjectView {
    return { api, meta };
}
