import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import type { UiProvider } from '../types';

export default function StepSelectProvider({
  providers,
  onSelect,
}: {
  providers: readonly UiProvider[];
  onSelect: (id: string) => void;
}) {
  return (
    <List>
      {providers.map((p) => (
        <ListItemButton key={p.id} onClick={() => onSelect(p.id)} data-test-id={`select-${p.code}`}>
          <ListItemIcon>
            <SmartToy />
          </ListItemIcon>
          <ListItemText primary={p.label} secondary={p.code} />
        </ListItemButton>
      ))}
    </List>
  );
}