'use client';

import type { UiFilterState } from './types';

type Props = {
  filter: UiFilterState;
  onFilterChange: (v: UiFilterState) => void;
  availableBehaviors: Array<{ id: string; name: string }>;
  onDownload: () => void;
  onCompare: () => void;
  isDownloading?: boolean;
  totalTests: number;
  filteredTests: number;
};

export default function TestRunFilterBar({
  filter,
  onFilterChange,
  availableBehaviors,
  onDownload,
  onCompare,
  isDownloading = false,
  totalTests,
  filteredTests,
}: Props) {
  const activeFilterCount = filter.selectedBehaviors.length + (filter.statusFilter !== 'all' ? 1 : 0);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search tests…"
          value={filter.searchQuery}
          onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
          data-test-id="search-input"
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', minWidth: 240 }}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'passed', 'failed'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange({ ...filter, statusFilter: key })}
              data-test-id={`status-${key}`}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #ccc',
                background: filter.statusFilter === key ? '#1976d2' : 'white',
                color: filter.statusFilter === key ? 'white' : 'black',
                cursor: 'pointer',
              }}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {availableBehaviors.length > 0 && (
          <details>
            <summary style={{ cursor: 'pointer' }}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </summary>
            <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginTop: 8, background: '#fafafa' }}>
              {availableBehaviors.map((b) => {
                const checked = filter.selectedBehaviors.includes(b.id);
                return (
                  <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? filter.selectedBehaviors.filter((x) => x !== b.id)
                          : [...filter.selectedBehaviors, b.id];
                        onFilterChange({ ...filter, selectedBehaviors: next });
                      }}
                    />
                    {b.name}
                  </label>
                );
              })}
              {filter.selectedBehaviors.length > 0 && (
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filter, selectedBehaviors: [] })}
                  data-test-id="clear-behaviors"
                  style={{ marginTop: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid #ccc', background: 'white' }}
                >
                  Clear
                </button>
              )}
            </div>
          </details>
        )}

        <span style={{ color: '#666', fontSize: 12 }}>
          {filteredTests === totalTests ? `${totalTests} tests` : `${filteredTests} of ${totalTests} tests`}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onCompare}
          data-test-id="compare"
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #1976d2', background: 'white', cursor: 'pointer' }}
        >
          Compare
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          data-test-id="download"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #1976d2',
            background: isDownloading ? '#90caf9' : '#1976d2',
            color: 'white',
            cursor: isDownloading ? 'not-allowed' : 'pointer',
          }}
        >
          {isDownloading ? 'Downloading…' : 'Download'}
        </button>
      </div>
    </div>
  );
}