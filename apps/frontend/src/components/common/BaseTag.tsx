/**
 * BaseTag component for managing entity tags with customizable behavior
 * UI-first: optionally integrates with API via assignTag/removeTag callbacks.
 */

'use client';

import React, {
  useState,
  useRef,
  KeyboardEvent,
  ClipboardEvent,
  FocusEvent,
  useEffect,
} from 'react';
import styles from '@/styles/BaseTag.module.css';
import {
  Box,
  Chip,
  TextField,
  TextFieldProps,
  InputLabelProps as MuiInputLabelProps,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useNotifications } from '@/components/common/NotificationContext';

// Use only generated types
import type { Tag } from '@/api-client/types.gen';
export enum EntityType {
  TEST = 'Test',
  TEST_SET = 'TestSet',
  TEST_RUN = 'TestRun',
  TEST_RESULT = 'TestResult',
  PROMPT = 'Prompt',
  BEHAVIOR = 'Behavior',
  CATEGORY = 'Category',
  ENDPOINT = 'Endpoint',
  PROJECT = 'Project',
  ORGANIZATION = 'Organization',
  METRIC = 'Metric',
  MODEL = 'Model',
  /* Will be used laters*/
  // eslint-disable-next-line no-use-before-define
  USE_CASE = 'UseCase',
  // eslint-disable-next-line no-use-before-define
  RESPONSE_PATTERN = 'ResponsePattern',
  // eslint-disable-next-line no-use-before-define
  PROMPT_TEMPLATE = 'PromptTemplate',
}

type UUID = string;

// Type definitions
interface TaggableEntity {
  id: UUID;
  organization_id?: UUID | null;
  user_id?: UUID | null;
  tags?: Tag[];
}

export interface BaseTagProps
    extends Omit<TextFieldProps, 'onChange' | 'value' | 'defaultValue'> {
  /** Current tag values */
  value: string[];
  /** Callback when tags change (local state is already updated) */
  onChange: (value: string[]) => void;

  /** Function to validate tag values */
  validate?: (value: string) => boolean;
  /** Whether to add tag on blur */
  addOnBlur?: boolean;
  /** Color of the tag chips */
  chipColor?:
      | 'primary'
      | 'secondary'
      | 'default'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
  /** Whether to clear input on blur */
  clearInputOnBlur?: boolean;
  /** Characters that trigger tag addition */
  delimiters?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether to disable tag editing */
  disableEdition?: boolean;
  /** Whether tags must be unique */
  uniqueTags?: boolean;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Whether to disable tag deletion on backspace */
  disableDeleteOnBackspace?: boolean;

  /** (Optional) Entity type for tag management */
  entityType?: EntityType;
  /** (Optional) Entity for tag management */
  entity?: TaggableEntity;

  /**
   * Optional API callbacks (wire these with your generated TanStack mutations)
   * If not provided, the component will only update local value via onChange.
   */
  assignTag?: (args: {
    entityType: EntityType;
    entityId: string;
    name: string;
    organization_id?: string | null;
    user_id?: string | null;
  }) => Promise<Tag>;

  removeTag?: (args: {
    entityType: EntityType;
    entityId: string;
    tagId: string;
  }) => Promise<void>;
}

// Tag validation utilities
const TagValidation = {
  isValidLength: (value: string) => value.length > 0 && value.length <= 50,
  isValidFormat: (value: string) =>
      /^[a-zA-Z0-9\-_\s\u00C0-\u017F\u0180-\u024F.,!?()]+$/.test(value),
  isValidTag: (value: string) =>
      TagValidation.isValidLength(value) && TagValidation.isValidFormat(value),
};

export default function BaseTag({
                                  value = [],
                                  onChange,
                                  validate = TagValidation.isValidTag,
                                  addOnBlur = false,
                                  chipColor = 'default',
                                  clearInputOnBlur = false,
                                  delimiters = [',', 'Enter'],
                                  placeholder = '',
                                  disableEdition = false,
                                  uniqueTags = true,
                                  maxTags,
                                  label,
                                  disabled = false,
                                  error = false,
                                  disableDeleteOnBackspace = false,
                                  entityType,
                                  entity,
                                  assignTag,
                                  removeTag,
                                  InputProps: customInputProps,
                                  InputLabelProps: customInputLabelProps,
                                  id,
                                  helperText,
                                  ...textFieldProps
                                }: BaseTagProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [localTags, setLocalTags] = useState<string[]>(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingKeyboardInput = useRef<boolean>(false);
  const notifications = useNotifications();

  // Keep track of current tag objects (name -> tag mapping)
  const [tagObjectsMap, setTagObjectsMap] = useState<Map<string, Tag>>(
      new Map()
  );

  // Sync local state when `value` prop changes
  useEffect(() => {
    setLocalTags(value);
  }, [value]);

  // Update tag objects map when entity tags change
  useEffect(() => {
    if (entity?.tags) {
      const newMap = new Map<string, Tag>();
      entity.tags.forEach(tag => {
        if (tag?.name) newMap.set(tag.name, tag);
      });
      setTagObjectsMap(newMap);
    }
  }, [entity?.tags]);

  const callAssignTag = async (namesToAdd: string[]) => {
    if (!assignTag || !entity || !entityType) return;

    for (const name of namesToAdd) {
      try {
        const newTag = await assignTag({
          entityType,
          entityId: entity.id,
          name,
          organization_id: entity.organization_id ?? null,
          user_id: entity.user_id ?? null,
        });
        // Update map with the tag returned by API
        if (newTag?.name) {
          setTagObjectsMap(prev => {
            const m = new Map(prev);
            m.set(newTag.name, newTag);
            return m;
          });
        }
      } catch (e) {
        throw e;
      }
    }
  };

  const callRemoveTag = async (namesToRemove: string[]) => {
    if (!removeTag || !entity || !entityType) return;

    for (const name of namesToRemove) {
      const tag = tagObjectsMap.get(name);
      if (!tag?.id) continue;
      try {
        await removeTag({
          entityType,
          entityId: entity.id,
          tagId: tag.id,
        });
        // Remove from local map
        setTagObjectsMap(prev => {
          const m = new Map(prev);
          m.delete(name);
          return m;
        });
      } catch (e) {
        throw e;
      }
    }
  };

  const handleTagsChange = async (newTagNames: string[]) => {
    // Always update local/UI immediately
    const initialTagNames = localTags;
    setLocalTags(newTagNames);
    onChange(newTagNames);

    // If there are no API callbacks, we’re done
    if (!assignTag && !removeTag) return;
    if (!entityType || !entity) return;

    // Determine add/remove sets
    const namesToRemove = initialTagNames.filter(n => !newTagNames.includes(n));
    const namesToAdd = newTagNames.filter(n => !initialTagNames.includes(n));

    if (namesToAdd.length === 0 && namesToRemove.length === 0) return;

    setIsUpdating(true);
    const snapshotMap = new Map(tagObjectsMap);

    try {
      // Remove first (so uniqueness constraints on backend don’t collide)
      if (namesToRemove.length > 0) {
        await callRemoveTag(namesToRemove);
      }

      // Then add
      if (namesToAdd.length > 0) {
        await callAssignTag(namesToAdd);
      }

      notifications?.show('Tags updated successfully', {
        severity: 'success',
        autoHideDuration: 3000,
      });
    } catch (err) {
      // Revert UI on error
      setLocalTags(initialTagNames);
      onChange(initialTagNames);
      setTagObjectsMap(snapshotMap);

      notifications?.show(
          err instanceof Error ? err.message : 'Failed to update tags',
          { severity: 'error', autoHideDuration: 6000 }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTag = (tagValue: string) => {
    if (!tagValue || disabled || isUpdating) return;

    const trimmedValue = tagValue.trim();
    if (!trimmedValue || !validate(trimmedValue)) return;

    // Check for max tags limit
    if (maxTags !== undefined && localTags.length >= maxTags) return;

    // Check if tag already exists
    if (uniqueTags && localTags.includes(trimmedValue)) {
      notifications?.show(`Tag "${trimmedValue}" already exists`, {
        severity: 'info',
        autoHideDuration: 2500,
      });
      setInputValue('');
      return;
    }

    void handleTagsChange([...localTags, trimmedValue]);
    setInputValue('');
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const isDelimiter = delimiters.includes(event.key);

    if (isDelimiter && inputValue) {
      event.preventDefault();
      event.stopPropagation();
      isProcessingKeyboardInput.current = true;
      handleAddTag(inputValue);
      setTimeout(() => {
        isProcessingKeyboardInput.current = false;
      }, 0);
    } else if (
        event.key === 'Backspace' &&
        !inputValue &&
        localTags.length > 0 &&
        !disableDeleteOnBackspace
    ) {
      event.preventDefault();
      void handleTagsChange(localTags.slice(0, -1));
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (disabled || isUpdating) return;
    void handleTagsChange(localTags.filter(tag => tag !== tagToDelete));
    inputRef.current?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || isUpdating) return;

    const pastedText = event.clipboardData.getData('text');
    if (!pastedText) return;

    // Split by all single-char delimiters OR newline/comma/semicolon by default
    const splitRegex =
        delimiters.length > 0
            ? new RegExp(`[${delimiters.join('')}\n;]+`)
            : /[,\n;]+/;
    const parts = pastedText.split(splitRegex).filter(Boolean);

    const newTags = [...localTags];
    const duplicates: string[] = [];

    for (const raw of parts) {
      const t = raw.trim();
      if (!t || !validate(t)) continue;

      if (uniqueTags && newTags.includes(t)) {
        duplicates.push(t);
        continue;
      }
      if (maxTags !== undefined && newTags.length >= maxTags) break;

      newTags.push(t);
    }

    if (newTags.length !== localTags.length) {
      void handleTagsChange(newTags);
      setInputValue('');
    }

    if (duplicates.length > 0) {
      const msg =
          duplicates.length === 1
              ? `Tag "${duplicates[0]}" already exists`
              : `${duplicates.length} duplicate tags skipped`;
      notifications?.show(msg, { severity: 'info', autoHideDuration: 2500 });
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setFocused(false);

    if (addOnBlur && inputValue) {
      isProcessingKeyboardInput.current = true;
      handleAddTag(inputValue);
      setTimeout(() => {
        isProcessingKeyboardInput.current = false;
      }, 0);
    }

    if (clearInputOnBlur) {
      setInputValue('');
    }

    textFieldProps.onBlur?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    textFieldProps.onFocus?.(event);
  };

  // Field is disabled if component is disabled or max tags is reached
  const isTagInputDisabled =
      disabled || (maxTags !== undefined && localTags.length >= maxTags);

  // Combine default and custom InputLabelProps
  const inputLabelProps: MuiInputLabelProps = {
    ...customInputLabelProps,
    shrink: focused || !!inputValue || localTags.length > 0,
  };

  return (
      <Box className={styles.tagContainer}>
        <Autocomplete
            multiple
            freeSolo
            clearIcon={false}
            options={[]}
            value={localTags}
            inputValue={inputValue}
            disabled={disabled || disableEdition}
            onChange={(_event, newValue: string[]) => {
              if (isProcessingKeyboardInput.current) return;
              void handleTagsChange(newValue);
            }}
            onInputChange={(_event, newInputValue: string, reason) => {
              if (reason === 'input') setInputValue(newInputValue);
              else if (reason === 'clear') setInputValue('');
            }}
            onKeyDown={handleInputKeyDown}
            renderTags={(vals: string[], getTagProps) =>
                vals.map((option: string, index: number) => (
                    <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        color={chipColor}
                        variant="outlined"
                        disabled={disabled}
                        className={styles.baseTag}
                        onDelete={
                          !disabled && !disableEdition
                              ? () => handleDeleteTag(option)
                              : undefined
                        }
                    />
                ))
            }
            renderInput={params => (
                <TextField
                    {...params}
                    {...textFieldProps}
                    id={id}
                    label={label}
                    placeholder={localTags.length === 0 ? placeholder : ''}
                    error={error}
                    inputRef={inputRef}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onPaste={handlePaste}
                    InputLabelProps={inputLabelProps}
                    InputProps={{
                      ...params.InputProps,
                      ...customInputProps,
                      readOnly: disableEdition,
                    }}
                    fullWidth
                    disabled={isTagInputDisabled || disabled}
                    helperText={
                      isUpdating
                          ? 'Updating tags...'
                          : helperText ?? (error ? 'Invalid tag(s)' : undefined)
                    }
                />
            )}
        />
        {/* Optional helper/error text when not using TextField.helperText */}
        {/* {error && <FormHelperText error>Invalid tag(s)</FormHelperText>} */}
      </Box>
  );
}
