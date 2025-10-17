'use client';

type Props = {
  primaryAction: null | { label: string; onClick: () => void; disabled?: boolean; 'data-test-id'?: string };
};

export default function ActionBar({ primaryAction }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
      {primaryAction ? (
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          data-test-id={primaryAction['data-test-id'] ?? 'primary-action'}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #1976d2',
            background: primaryAction.disabled ? '#90caf9' : '#1976d2',
            color: 'white',
            cursor: primaryAction.disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {primaryAction.label}
        </button>
      ) : null}
    </div>
  );
}