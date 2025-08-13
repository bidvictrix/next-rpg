import { Stats, SkillEffect } from './skill';

// 아이템 타입 정의
export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';
  subType?: string;           // 세부 분류 (검, 도끼, 물약 등)
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  level: number;              // 아이템 레벨
  stackable: boolean;         // 스택 가능 여부
  maxStack: number;           // 최대 스택 수
  value: number;              // 기본 가치 (골드)
  
  // 장비 아이템 전용
  equipmentSlot?: 'weapon' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'accessory' | 'ring';
  statBonus?: Partial<Stats>; // 스탯 보너스
  effects?: SkillEffect[];    // 장비 효과
  durability?: {
    current: number;
    max: number;
  };
  
  // 소모품 전용
  consumableEffect?: {
    type: 'heal' | 'mana' | 'buff' | 'debuff';
    value: number;
    duration?: number;
  };
  
  // 사용 조건
  requirements?: {
    level?: number;
    stats?: Partial<Stats>;
    class?: string[];
  };
  
  // 제작 관련
  craftable?: boolean;
  craftingMaterials?: Array<{
    itemId: string;
    quantity: number;
  }>;
  craftingSkill?: string;
  craftingLevel?: number;
}

// 몬스터 AI 패턴
export interface MonsterAI {
  type: 'passive' | 'aggressive' | 'defensive' | 'smart';
  attackRange: number;
  detectionRange: number;
  moveSpeed: number;
  skills: Array<{
    skillId: string;
    priority: number;
    cooldown: number;
    condition?: string;      // 사용 조건 (HP < 50% 등)
  }>;
}

// 드롭 테이블
export interface DropTable {
  items: Array<{
    itemId: string;
    quantity: { min: number; max: number; };
    chance: number;          // 드롭 확률 (0-100)
    condition?: string;      // 드롭 조건
  }>;
  gold: { min: number; max: number; };
  experience: number;
}

// 몬스터 시스템
export interface Monster {
  id: string;
  name: string;
  description: string;
  type: 'normal' | 'elite' | 'boss' | 'raid_boss';
  level: number;
  
  // 기본 스탯
  stats: Stats;
  
  // 전투 관련
  skills: string[];           // 보유 스킬 ID들
  ai: MonsterAI;
  
  // 드롭 관련
  dropTable: DropTable;
  
  // 스폰 관련
  spawnAreas: string[];       // 스폰 가능한 지역 ID들
  spawnRate: number;          // 스폰 확률
  spawnLimit: number;         // 최대 스폰 수
  respawnTime: number;        // 리스폰 시간 (초)
  
  // 특수 속성
  resistances?: {             // 저항
    physical?: number;
    fire?: number;
    ice?: number;
    lightning?: number;
    poison?: number;
  };
  immunities?: string[];      // 면역 효과들
  
  // 퀘스트 관련
  questTarget?: boolean;      // 퀘스트 타겟인지
  
  // 크기 및 모델 (텍스트 RPG에서는 설명용)
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  appearance: string;         // 외형 설명
}

// 퀘스트 목표 타입
export interface QuestObjective {
  id: string;
  type: 'kill' | 'collect' | 'deliver' | 'escort' | 'talk' | 'explore' | 'craft';
  target: string;             // 대상 ID
  quantity: number;           // 필요 수량
  currentProgress: number;    // 현재 진행도
  description: string;
  completed: boolean;
}

// 퀘스트 보상
export interface QuestReward {
  experience: number;
  gold: number;
  items?: Array<{
    itemId: string;
    quantity: number;
  }>;
  skillPoints?: number;
  statPoints?: number;
  unlockSkills?: string[];    // 해금되는 스킬들
  unlockAreas?: string[];     // 해금되는 지역들
}

// 퀘스트 시스템
export interface Quest {
  id: string;
  name: string;
  description: string;
  story: string;              // 퀘스트 스토리
  type: 'main' | 'side' | 'daily' | 'weekly' | 'event' | 'guild';
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  
  // 조건
  requirements: {
    level?: number;
    completedQuests?: string[];
    items?: Array<{
      itemId: string;
      quantity: number;
    }>;
    area?: string;
  };
  
  // 목표
  objectives: QuestObjective[];
  
  // 보상
  rewards: QuestReward;
  
  // 시간 제한
  timeLimit?: number;         // 제한 시간 (분)
  
  // 반복 가능
  repeatable: boolean;
  resetTime?: 'daily' | 'weekly' | 'monthly';
  
  // NPC 관련
  giver: string;              // 퀘스트 제공 NPC ID
  turnIn?: string;            // 완료 NPC ID (기본값은 giver)
  
  // 다음 퀘스트
  nextQuest?: string;
}

// NPC 타입
export interface NPC {
  id: string;
  name: string;
  description: string;
  type: 'merchant' | 'quest_giver' | 'trainer' | 'guard' | 'citizen';
  
  // 위치
  areaId: string;
  position: { x: number; y: number; };
  
  // 대화
  dialogues: Array<{
    id: string;
    condition?: string;       // 대화 조건
    text: string;
    options?: Array<{
      text: string;
      action: string;
      requirement?: string;
    }>;
  }>;
  
  // 상인 관련
  shop?: {
    items: Array<{
      itemId: string;
      price: number;
      stock: number;          // -1이면 무제한
    }>;
    buyRate: number;          // 구매 가격 배율
    sellRate: number;         // 판매 가격 배율
  };
  
  // 퀘스트 관련
  quests?: string[];          // 제공하는 퀘스트 ID들
  
  // 트레이너 관련
  trainSkills?: string[];     // 훈련 가능한 스킬 ID들
}

// 지역/구역 시스템
export interface Area {
  id: string;
  name: string;
  description: string;
  type: 'town' | 'dungeon' | 'field' | 'pvp' | 'raid' | 'special';
  
  // 접근 조건
  requirements?: {
    level?: number;
    completedQuests?: string[];
    items?: string[];
    guild?: boolean;
  };
  
  // 지역 설정
  size: { width: number; height: number; };
  safeZone: boolean;          // 안전 지역 여부
  pvpEnabled: boolean;        // PvP 가능 여부
  
  // 연결된 지역들
  connections: Array<{
    areaId: string;
    position: { x: number; y: number; };
    requirement?: string;     // 이동 조건
  }>;
  
  // 스폰 정보
  monsterSpawns: Array<{
    monsterId: string;
    spawnPoints: Array<{ x: number; y: number; }>;
    maxCount: number;
    respawnTime: number;
  }>;
  
  // NPC 배치
  npcs: Array<{
    npcId: string;
    position: { x: number; y: number; };
  }>;
  
  // 특수 오브젝트
  objects?: Array<{
    id: string;
    type: 'chest' | 'portal' | 'shrine' | 'resource';
    position: { x: number; y: number; };
    interactive: boolean;
    requirements?: string;
    rewards?: Array<{
      itemId: string;
      quantity: number;
      chance: number;
    }>;
  }>;
  
  // 환경 효과
  environmentEffects?: Array<{
    type: string;
    value: number;
    description: string;
  }>;
  
  // 배경음악 및 분위기
  bgm?: string;
  atmosphere: string;         // 분위기 설명
}

// 이벤트 시스템
export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'exp_boost' | 'drop_boost' | 'special_spawn' | 'pvp' | 'raid';
  
  // 시간
  startTime: string;
  endTime: string;
  duration: number;           // 지속시간 (분)
  
  // 적용 대상
  targetAreas?: string[];     // 적용 지역
  targetLevels?: { min: number; max: number; };
  
  // 효과
  effects: Array<{
    type: string;
    multiplier: number;
    description: string;
  }>;
  
  // 보상
  rewards?: Array<{
    condition: string;
    items: Array<{
      itemId: string;
      quantity: number;
    }>;
  }>;
  
  // 반복
  recurring: boolean;
  schedule?: string;          // cron 형식
}

// 기본 생성 함수들
export const createBasicItem = (
  id: string,
  name: string,
  description: string,
  type: Item['type']
): Item => {
  return {
    id,
    name,
    description,
    type,
    rarity: 'common',
    level: 1,
    stackable: type === 'consumable' || type === 'material',
    maxStack: type === 'consumable' || type === 'material' ? 99 : 1,
    value: 10
  };
};

export const createBasicMonster = (
  id: string,
  name: string,
  level: number
): Monster => {
  return {
    id,
    name,
    description: `레벨 ${level}의 ${name}`,
    type: 'normal',
    level,
    stats: {
      str: 10 + level * 2,
      dex: 10 + level * 2,
      int: 10 + level * 2,
      vit: 10 + level * 2,
      luk: 10 + level * 2
    },
    skills: [],
    ai: {
      type: 'aggressive',
      attackRange: 1,
      detectionRange: 5,
      moveSpeed: 1,
      skills: []
    },
    dropTable: {
      items: [],
      gold: { min: level * 5, max: level * 15 },
      experience: level * 10
    },
    spawnAreas: [],
    spawnRate: 50,
    spawnLimit: 5,
    respawnTime: 300,
    size: 'medium',
    appearance: `일반적인 ${name}의 모습`
  };
};