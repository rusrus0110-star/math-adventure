export type VirtualRewardCategory = 'accessory';

export interface VirtualReward {
  id: string;
  name: string;
  icon: string;
  thresholdCoins: number;
  category: VirtualRewardCategory;
}

export interface RealRewardOption {
  id: string;
  name: string;
  icon: string;
  allowsCustomTitle?: boolean;
}

export interface MotivationSettings {
  playerId: string;
  selectedVirtualRewardId: string;
  equippedVirtualRewardId: string | null;
  weeklyGoalEnabled: boolean;
  weeklyRewardId: string;
  weeklyCustomRewardTitle: string | null;
  weeklyRequiredDays: number;
  updatedAt: string;
}

export interface WeeklyGoalProgress {
  completedDays: number;
  requiredDays: number;
  completed: boolean;
  dayKeys: string[];
}
