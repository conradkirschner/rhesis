/**
 * BaseTag component for managing entity tags with TanStack Query
 * Uses generated mutation options directly (optimistic updates + rollback).
 */

'use client';

import React, {
  useState,
  useRef,
  KeyboardEvent,
  ClipboardEvent,
  FocusEvent,
  useEffect,
  useMemo,
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/components/common/NotificationContext';
import { client } from '@/api-client/client.gen';

import {
  assignTagToEntityTagsEntityTypeEntityIdPostMutation,
  removeTagFromEntityTagsEntityTypeEntityIdTagIdDeleteMutation,
} from '@/api-client/@tanstack/react-query.gen';

import type {
  AssignTagToEntityTagsEntityTypeEntityIdPostData,
  AssignTagToEntityTagsEntityTypeEntityIdPostResponse,
  AssignTagToEntityTagsEntityTypeEntityIdPostError,
  RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteData,
  RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteResponse,
  RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteError,
  EntityType,
  Tag,
} from '@/api-client/types.gen';
import { Options } from '@/api-client';

type UUID = string;

export interface TaggableEntity {
  id: UUID;
  organization_id?: UUID | null;
  user_id?: UUID | null;
  tags?: Tag[];
}

export interface BaseTagProps
    extends Omit<TextFieldProps, 'onChange' | 'value' | 'defaultValue'> {
  value: readonly string[];
  onChange: (value: string[]) => void;

  validate?: (value: string) => boolean;
  addOnBlur?: boolean;
  chipColor?:
      | 'primary'
      | 'secondary'
      | 'default'
      | 'error'
      | 'info'
      | 'success'
      | 'warning';
  clearInputOnBlur?: boolean;
  delimiters?: string[];
  placeholder?: string;
  disableEdition?: boolean;
  uniqueTags?: boolean;
  maxTags?: number;
  disableDeleteOnBackspace?: boolean;

  /** Enables API mode */
  entityType?: EntityType;
  entity?: TaggableEntity;
}

const TagValidation = {
  isValidLength: (value: string) => value.length > 0 && value.length <= 50,
  isValidFormat: (value: string) =>
      /^[a-zA-Z0-9\-_\s\u00C0-\u017F\u0180-\u024F.,!?()]+$/.test(value),
  isValidTag: (value: string) =>
      TagValidation.isValidLength(value) && TagValidation.isValidFormat(value),
};

type TagMutationCtx = {
  snapshotTags: string[];
  snapshotMap: Map<string, Tag>;
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
                                  InputProps: customInputProps,
                                  InputLabelProps: customInputLabelProps,
                                  id,
                                  helperText,
                                  ...textFieldProps
                                }: BaseTagProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [focused, setFocused] = useState<boolean>(false);
  const [localTags, setLocalTags] = useState<string[]>([...value]);
  const [tagObjectsMap, setTagObjectsMap] = useState<Map<string, Tag>>(
      new Map(),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingKeyboardInput = useRef<boolean>(false);
  const notifications = useNotifications();
  const queryClient = useQueryClient();

  useEffect(() => {
    setLocalTags([...value]);
  }, [value]);

  useEffect(() => {
    if (entity?.tags) {
      const m = new Map<string, Tag>();
      for (const t of entity.tags) {
        if (t?.name) m.set(t.name, t);
      }
      setTagObjectsMap(m);
    }
  }, [entity?.tags]);

  const hasApi = Boolean(entityType && entity);

  const updateLocalTags = (next: string[]) => {
    setLocalTags(next);
    onChange(next);
  };

  const isTagInputDisabled =
      disabled || (maxTags !== undefined && localTags.length >= maxTags);

  const inputLabelProps: MuiInputLabelProps = useMemo(
      () => ({
        ...customInputLabelProps,
        shrink: focused || !!inputValue || localTags.length > 0,
      }),
      [customInputLabelProps, focused, inputValue, localTags.length],
  );

  // ---------- Mutations (compose generated mutation options with our own) ----------

  const assignMutationOptions = assignTagToEntityTagsEntityTypeEntityIdPostMutation(
      { client },
  );

  const assignTagMutation = useMutation<
      AssignTagToEntityTagsEntityTypeEntityIdPostResponse,
      AssignTagToEntityTagsEntityTypeEntityIdPostError,
      Options<AssignTagToEntityTagsEntityTypeEntityIdPostData>,
      TagMutationCtx
  >({
    ...assignMutationOptions,
    mutationKey: ['assignTag', entityType, entity?.id],
    onMutate: async (variables) => {
      await queryClient.cancelQueries();
      const snapshotTags = localTags;
      const snapshotMap = new Map(tagObjectsMap);

      const name = variables?.body?.name ?? '';
      if (
          name &&
          (!uniqueTags || !snapshotTags.includes(name)) &&
          (maxTags === undefined || snapshotTags.length < maxTags)
      ) {
        updateLocalTags([...snapshotTags, name]);
      }
      return { snapshotTags, snapshotMap };
    },
    onSuccess: (createdTag) => {
      if (createdTag?.name) {
        setTagObjectsMap((prev) => {
          const m = new Map(prev);
          m.set(createdTag.name, createdTag);
          return m;
        });
      }
      notifications?.show('Tag hinzugefügt', {
        severity: 'success',
        autoHideDuration: 2000,
      });
    },
    onError: (err, _vars, ctx) => {
      if (ctx) {
        setTagObjectsMap(ctx.snapshotMap);
        updateLocalTags(ctx.snapshotTags);
      }
      notifications?.show(
          (err as Error).message || 'Tag konnte nicht hinzugefügt werden',
          { severity: 'error', autoHideDuration: 6000 },
      );
    },
  });

  const removeMutationOptions =
      removeTagFromEntityTagsEntityTypeEntityIdTagIdDeleteMutation({ client });

  const removeTagMutation = useMutation<
      RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteResponse,
      RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteError,
      Options<RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteData>,
      TagMutationCtx
  >({
    ...removeMutationOptions,
    mutationKey: ['removeTag', entityType, entity?.id],
    onMutate: async (variables) => {
      await queryClient.cancelQueries();
      const snapshotTags = localTags;
      const snapshotMap = new Map(tagObjectsMap);

      const tagId =
          variables?.path?.tag_id ?? undefined;

      const name =
          [...snapshotMap.entries()].find(([, t]) => t.id === tagId)?.[0] ??
          undefined;

      if (name) {
        updateLocalTags(snapshotTags.filter((t) => t !== name));
        setTagObjectsMap((prev) => {
          const m = new Map(prev);
          m.delete(name);
          return m;
        });
      }
      return { snapshotTags, snapshotMap };
    },
    onSuccess: () => {
      notifications?.show('Tag entfernt', {
        severity: 'success',
        autoHideDuration: 2000,
      });
    },
    onError: (err, _vars, ctx) => {
      if (ctx) {
        setTagObjectsMap(ctx.snapshotMap);
        updateLocalTags(ctx.snapshotTags);
      }
      notifications?.show(
          (err as Error).message || 'Tag konnte nicht entfernt werden',
          { severity: 'error', autoHideDuration: 6000 },
      );
    },
  });

  const isUpdating = assignTagMutation.isPending || removeTagMutation.isPending;

  // ---------- Handlers ----------

  const handleAddTag = (tagValue: string) => {
    if (!tagValue || disabled || isUpdating) return;

    const trimmedValue = tagValue.trim();
    if (!trimmedValue || !validate(trimmedValue)) return;
    if (maxTags !== undefined && localTags.length >= maxTags) return;
    if (uniqueTags && localTags.includes(trimmedValue)) {
      notifications?.show(`Tag "${trimmedValue}" existiert bereits`, {
        severity: 'info',
        autoHideDuration: 2500,
      });
      setInputValue('');
      return;
    }

    if (hasApi && entity && entityType) {
      const vars: Options<AssignTagToEntityTagsEntityTypeEntityIdPostData> = {
        path: { entity_type: entityType, entity_id: entity.id },
        body: {
          name: trimmedValue,
          organization_id: entity.organization_id ?? null,
          user_id: entity.user_id ?? null,
        },
      };
      assignTagMutation.mutate(vars);
    } else {
      updateLocalTags([...localTags, trimmedValue]);
      notifications?.show('Tag hinzugefügt (lokal)', {
        severity: 'success',
        autoHideDuration: 1500,
      });
    }
    setInputValue('');
  };

  const handleDeleteTag = (name: string) => {
    if (disabled || isUpdating) return;

    if (hasApi && entity && entityType) {
      const tag = tagObjectsMap.get(name);
      if (!tag?.id) {
        notifications?.show('Unerwarteter Zustand: Tag-ID fehlt', {
          severity: 'error',
          autoHideDuration: 4000,
        });
        return;
      }
      const vars: Options<RemoveTagFromEntityTagsEntityTypeEntityIdTagIdDeleteData> =
          {
            path: { entity_type: entityType, entity_id: entity.id, tag_id: tag.id },
          };
      removeTagMutation.mutate(vars);
    } else {
      updateLocalTags(localTags.filter((t) => t !== name));
      notifications?.show('Tag entfernt (lokal)', {
        severity: 'success',
        autoHideDuration: 1500,
      });
    }
    inputRef.current?.focus();
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
      handleDeleteTag(localTags[localTags.length - 1]);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || isUpdating) return;

    const pastedText = event.clipboardData.getData('text');
    if (!pastedText) return;

    const splitRegex =
        delimiters.length > 0
            ? new RegExp(`[${delimiters.join('')}\n;]+`)
            : /[,\n;]+/;
    const parts = pastedText.split(splitRegex).filter(Boolean);

    const toAdd: string[] = [];
    const seen = new Set(localTags);

    for (const raw of parts) {
      const t = raw.trim();
      if (!t || !validate(t)) continue;
      if (uniqueTags && seen.has(t)) continue;
      if (maxTags !== undefined && localTags.length + toAdd.length >= maxTags)
        break;
      toAdd.push(t);
      seen.add(t);
    }

    if (toAdd.length === 0) return;

    if (hasApi && entity && entityType) {
      for (const name of toAdd) {
        const vars: Options<AssignTagToEntityTagsEntityTypeEntityIdPostData> = {
          path: { entity_type: entityType, entity_id: entity.id },
          body: {
            name,
            organization_id: entity.organization_id ?? null,
            user_id: entity.user_id ?? null,
          },
        };
        assignTagMutation.mutate(vars);
      }
    } else {
      updateLocalTags([...localTags, ...toAdd]);
    }

    setInputValue('');
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

    if (clearInputOnBlur) setInputValue('');
    textFieldProps.onBlur?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    textFieldProps.onFocus?.(event);
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

              const toAdd = newValue.filter((v) => !localTags.includes(v));
              const toRemove = localTags.filter((v) => !newValue.includes(v));

              if (hasApi && entity && entityType) {
                toRemove.forEach((name) => handleDeleteTag(name));
                toAdd.forEach((name) => handleAddTag(name));
              } else {
                updateLocalTags(newValue);
              }
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
            renderInput={(params) => (
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
                          ? 'Tags werden aktualisiert …'
                          : helperText ?? (error ? 'Ungültige(r) Tag(s)' : undefined)
                    }
                />
            )}
        />
      </Box>
  );
}
