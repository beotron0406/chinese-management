export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  COMPLETED = 'completed'
}

export enum StreakStatus {
  EXCELLENT = 'excellent', // 30+ days
  GOOD = 'good', // 15-29 days
  AVERAGE = 'average', // 7-14 days
  STARTING = 'starting', // 1-6 days
  NONE = 'none' // 0 days
}