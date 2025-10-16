export type UiTestSetGenerationConfig = {
  readonly project_name?: string | null;
  readonly behaviors?: string[];
  readonly purposes?: string[];
  readonly test_type?: string;
  readonly response_generation?:string; //'prompt_only' | 'prompt_and_response';
  readonly test_coverage?: string;//'focused' | 'standard' | 'comprehensive';
  readonly tags?: string[];
  readonly description?: string;
};

export function toPromptFromUiConfig(config: UiTestSetGenerationConfig) {
  return {
    project_context: config?.project_name ?? 'General',
    test_behaviors: config.behaviors ?? [],
    test_purposes: config.purposes ?? [],
    key_topics: config.tags,
    specific_requirements: config.description,
    test_type: config.test_type === 'single_turn' ? 'Single interaction tests' : 'Multi-turn conversation tests',
    output_format:
      config.response_generation === 'prompt_only'
        ? 'Generate only user inputs'
        : 'Generate both user inputs and expected responses',
  } as const;
}