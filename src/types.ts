export interface UnityVersion {
  version: string;
  changeSet: string;
}

export interface BuildJob {
  version: string;
  changeSet: string;
  retries: number;
  status: 'pending' | 'building' | 'failed' | 'completed';
}