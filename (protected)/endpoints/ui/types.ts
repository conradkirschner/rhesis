export type UiProjectIconName =
  | 'SmartToy'
  | 'Devices'
  | 'Web'
  | 'Storage'
  | 'Code'
  | 'DataObject'
  | 'Cloud'
  | 'Analytics'
  | 'ShoppingCart'
  | 'Terminal'
  | 'VideogameAsset'
  | 'Chat'
  | 'Psychology'
  | 'Dashboard'
  | 'Search'
  | 'AutoFixHigh'
  | 'PhoneIphone'
  | 'School'
  | 'Science'
  | 'AccountTree';

export interface UiEndpointRow {
  readonly id: string;
  readonly name: string;
  readonly protocol: string;
  readonly environment: string;
  readonly projectLabel: string;
  readonly projectIconName: UiProjectIconName;
}

export interface UiPaginationModel {
  readonly page: number;
  readonly pageSize: number;
}