export type Page =
  | 'dashboard'
  | 'processes'
  | 'process-detail'
  | 'import'
  | 'import-history'
  | 'analytics'
  | 'reports'
  | 'users'
  | 'settings';

export type NavigateFn = (page: Page, params?: { processId?: number }) => void;
