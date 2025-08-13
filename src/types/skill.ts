// 스킬 효과 타입 정의
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  target: 'self' | 'enemy' | 'ally' | 'all_enemies' | 'all_allies' | 'area';
  value: number;              // 기본 효과값
  scaling?: {                 // 스탯에 따른 스케일링
    stat: 'str' | 'dex' | 'int' | 'vit' | 'luk';
    ratio: number;            // 스탯 * ratio만큼 추가
  };
  duration?: number;          // 지속시간 (턴 또는 초)
  chance?: number;            // 발동 확률 (0-100)
  cooldown?: number;          // 쿨다운 시간
  manaCost?: number;          // 마나 소모량
  range?: number;             // 사거리
  areaSize?: number;          // 범위 크기
  additionalEffects?: string[]; // 추가 효과 ID들
}

// 스킬 전제조건
export interface SkillRequirement {
  type: 'level' | 'skill' | 'stat' | 'item' | 'class' | 'quest';
  value: string | number;
  amount?: number;            // 필요한 수량이나 레벨
  description: string;        // 조건 설명
}

// 기본 스킬 구조
export interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;              // 아이콘 경로 (나중에 추가 가능)
  type: 'active' | 'passive' | 'toggle';
  category: 'combat' | 'magic' | 'utility' | 'crafting' | 'movement';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  
  // 레벨 시스템
  maxLevel: number;           // 최대 레벨 (0이면 무한)
  baseExperience: number;     // 기본 경험치 요구량
  experienceMultiplier: number; // 레벨당 경험치 증가 배수
  
  // 효과
  effects: SkillEffect[];
  
  // 습득 조건
  requirements: SkillRequirement[];
  
  // 스킬 트리 관련
  parentSkills?: string[];    // 상위 스킬 ID들
  childSkills?: string[];     // 하위 스킬 ID들
  position?: {                // 스킬 트리에서의 위치
    x: number;
    y: number;
    tier: number;             // 티어 (깊이)
  };
  
  // 비용
  learnCost: {
    skillPoints: number;
    gold?: number;
    items?: Array<{
      itemId: string;
      quantity: number;
    }>;
  };
}

// 스킬 트리 노드 (무한 확장 구조)
export interface SkillTreeNode {
  skill: Skill;
  isLearned: boolean;
  currentLevel: number;
  currentExperience: number;
  isAvailable: boolean;       // 학습 가능한지
  connections: {              // 연결된 스킬들
    parents: string[];        // 상위 스킬 ID들
    children: string[];       // 하위 스킬 ID들
  };
}

// 스킬 트리 카테고리
export interface SkillTreeCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color: string;              // 카테고리 색상
  skills: Record<string, SkillTreeNode>;
  unlockRequirements?: SkillRequirement[];
}

// 전체 스킬 트리 구조
export interface SkillTree {
  categories: Record<string, SkillTreeCategory>;
  totalSkillPoints: number;
  usedSkillPoints: number;
  availableSkillPoints: number;
}

// 스킬 사용 결과
export interface SkillUseResult {
  success: boolean;
  damage?: number;
  healing?: number;
  effects: Array<{
    type: string;
    target: string;
    value: number;
    duration?: number;
  }>;
  criticalHit?: boolean;
  message: string;
  manaCost: number;
  cooldownTime?: number;
}

// 스킬 레벨업 결과
export interface SkillLevelUpResult {
  success: boolean;
  newLevel: number;
  newEffects: SkillEffect[];
  unlockedSkills?: string[];  // 새로 해금된 스킬들
  message: string;
}

// 스킬 진화 시스템 (고급 기능)
export interface SkillEvolution {
  fromSkillId: string;
  toSkillId: string;
  requirements: SkillRequirement[];
  materials?: Array<{
    itemId: string;
    quantity: number;
  }>;
  cost: {
    gold: number;
    skillPoints: number;
  };
}

// 스킬 조합 시스템
export interface SkillCombination {
  id: string;
  name: string;
  description: string;
  requiredSkills: Array<{
    skillId: string;
    minLevel: number;
  }>;
  resultSkill: string;
  successRate: number;        // 조합 성공률
  materials?: Array<{
    itemId: string;
    quantity: number;
  }>;
}

// 스킬 효과 스택
export interface SkillEffectStack {
  effectId: string;
  skillId: string;
  type: string;
  value: number;
  duration: number;
  stackCount: number;
  maxStack: number;
  appliedAt: string;          // 적용 시간
}

// 플레이어의 활성 효과들
export interface ActiveEffects {
  buffs: SkillEffectStack[];
  debuffs: SkillEffectStack[];
  toggles: string[];          // 토글 스킬 ID들
}

// 스킬 시전 정보
export interface SkillCast {
  skillId: string;
  casterId: string;
  targetId?: string;
  position?: { x: number; y: number; };
  castTime: number;
  channeling: boolean;
  startTime: string;
}

// 기본 스킬 데이터 생성 함수
export const createBasicSkill = (
  id: string,
  name: string,
  description: string,
  type: Skill['type'],
  category: Skill['category']
): Skill => {
  return {
    id,
    name,
    description,
    type,
    category,
    rarity: 'common',
    maxLevel: 10,
    baseExperience: 100,
    experienceMultiplier: 1.5,
    effects: [],
    requirements: [],
    learnCost: {
      skillPoints: 1,
      gold: 100
    }
  };
};

// 스킬 트리 노드 생성 함수
export const createSkillTreeNode = (skill: Skill): SkillTreeNode => {
  return {
    skill,
    isLearned: false,
    currentLevel: 0,
    currentExperience: 0,
    isAvailable: skill.requirements.length === 0,
    connections: {
      parents: skill.parentSkills || [],
      children: skill.childSkills || []
    }
  };
};