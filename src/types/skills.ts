// 스킬 효과 인터페이스
export interface SkillEffect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  target: 'self' | 'enemy' | 'ally' | 'area' | 'all';
  value: number;
  stat?: string;
  duration?: number;
  scaling?: {
    stat: string;
    ratio: number;
  };
  manaCost?: number;
  cooldown?: number;
  range?: number;
  areaSize?: number;
  description: string;
}

// 스킬 요구사항 인터페이스
export interface SkillRequirement {
  id: string;
  type: 'level' | 'skill' | 'stat' | 'item' | 'quest';
  target?: string;
  value: string | number;
  amount?: number;
  description: string;
}

// 스킬 학습 비용 인터페이스
export interface SkillLearnCost {
  skillPoints: number;
  gold: number;
  items?: {
    itemId: string;
    quantity: number;
  }[];
}

// 스킬 위치 인터페이스 (스킬 트리용)
export interface SkillPosition {
  x: number;
  y: number;
  tier: number;
}

// 메인 스킬 인터페이스
export interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: 'active' | 'passive' | 'toggle';
  category: 'combat' | 'magic' | 'support' | 'passive' | 'utility';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  maxLevel: number;
  baseExperience: number;
  experienceMultiplier: number;
  cooldown?: number;
  manaCost?: number;
  effects: SkillEffect[];
  requirements: SkillRequirement[];
  parentSkills?: string[];
  learnCost?: SkillLearnCost;
  position?: SkillPosition;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  usageCount?: number;
}

// 스킬 카테고리 인터페이스
export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  skills: string[];
}

// 스킬 트리 인터페이스
export interface SkillTree {
  id: string;
  name: string;
  description: string;
  categories: string[];
  skills: Record<string, Skill>;
  connections: {
    from: string;
    to: string;
    type: 'prerequisite' | 'synergy' | 'upgrade';
  }[];
}

// 플레이어 스킬 상태 인터페이스
export interface PlayerSkill {
  skillId: string;
  level: number;
  experience: number;
  isUnlocked: boolean;
  learnedAt?: Date;
  lastUsed?: Date;
  totalUsageCount: number;
}

// API 응답 타입들
export interface SkillApiResponse {
  success: boolean;
  data?: Skill | Skill[];
  error?: string;
  message?: string;
  details?: string[];
}

export interface SkillCategoryApiResponse {
  success: boolean;
  data?: SkillCategory | SkillCategory[];
  error?: string;
  message?: string;
}

// 스킬 필터 타입
export interface SkillFilter {
  category?: string;
  type?: string;
  rarity?: string;
  isActive?: boolean;
  search?: string;
}

// 스킬 정렬 타입
export type SkillSortBy = 'name' | 'level' | 'category' | 'rarity' | 'usageCount' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface SkillSort {
  by: SkillSortBy;
  order: SortOrder;
}
