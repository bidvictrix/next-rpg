// 기본 스탯 인터페이스
export interface Stats {
  str: number;    // 힘 (공격력, 장비 요구사항)
  dex: number;    // 민첩 (명중률, 회피율, 크리티컬)
  int: number;    // 지능 (마법력, MP, 스킬 데미지)
  vit: number;    // 체력 (HP, 방어력, HP 회복)
  luk: number;    // 운 (크리티컬, 드롭률, 회피)
  // 파생 스탯 (계산으로 구함)
  hp?: number;    // 체력 = vit * 10 + level * 5
  maxHp?: number;
  mp?: number;    // 마나 = int * 10 + level * 3
  maxMp?: number;
  atk?: number;   // 공격력 = str * 2 + 장비 공격력
  def?: number;   // 방어력 = vit * 1.5 + 장비 방어력
  acc?: number;   // 명중률 = dex * 0.8 + level
  eva?: number;   // 회피율 = dex * 0.6 + luk * 0.2
  crit?: number;  // 크리티컬 = dex * 0.3 + luk * 0.7
}

// 레벨 및 경험치 시스템
export interface LevelSystem {
  level: number;
  experience: number;
  experienceToNext: number;  // 다음 레벨까지 필요한 경험치
  statPoints: number;        // 할당 가능한 스탯 포인트
  skillPoints: number;       // 할당 가능한 스킬 포인트
}

// 장비 아이템 인터페이스
export interface Equipment {
  weapon?: string | null;    // 무기 아이템 ID
  helmet?: string | null;    // 투구 아이템 ID
  armor?: string | null;     // 갑옷 아이템 ID
  gloves?: string | null;    // 장갑 아이템 ID
  boots?: string | null;     // 신발 아이템 ID
  accessory1?: string | null; // 액세서리1 아이템 ID
  accessory2?: string | null; // 액세서리2 아이템 ID
  ring1?: string | null;     // 반지1 아이템 ID
  ring2?: string | null;     // 반지2 아이템 ID
}

// 인벤토리 아이템
export interface InventoryItem {
  itemId: string;
  quantity: number;
  slot: number;
}

// 플레이어 기본 정보
export interface PlayerInfo {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLoginAt: string;
  isOnline: boolean;
  characterName: string;
  class: string;             // 클래스 (나중에 확장 가능)
}

// 플레이어 위치 정보
export interface PlayerLocation {
  areaId: string;
  x: number;
  y: number;
  mapName: string;
}

// 플레이어 스킬 보유 상태
export interface PlayerSkill {
  skillId: string;
  level: number;
  experience: number;
  equipped: boolean;  // 활성화된 스킬인지
}

// 플레이어 퀘스트 상태
export interface PlayerQuest {
  questId: string;
  status: 'accepted' | 'completed' | 'failed';
  progress: Record<string, number>;  // 퀘스트 진행도 (키-값)
  acceptedAt: string;
  completedAt?: string;
}

// 메인 플레이어 인터페이스
export interface Player {
  // 기본 정보
  info: PlayerInfo;
  
  // 레벨 및 경험치
  level: LevelSystem;
  
  // 스탯
  stats: Stats;
  
  // 장비
  equipment: Equipment;
  
  // 인벤토리 (최대 100슬롯)
  inventory: InventoryItem[];
  inventorySize: number;
  
  // 위치
  location: PlayerLocation;
  
  // 스킬
  skills: PlayerSkill[];
  
  // 퀘스트
  quests: PlayerQuest[];
  
  // 게임 내 화폐
  gold: number;
  
  // 플레이 시간 (분 단위)
  playtime: number;
  
  // PvP 관련
  pvpRank: number;
  pvpPoints: number;
  
  // 길드 정보
  guildId?: string | null;
  guildRank?: string | null;
}

// 플레이어 생성 시 기본값
export const createDefaultPlayer = (
  id: string, 
  username: string, 
  email: string, 
  characterName: string
): Player => {
  const now = new Date().toISOString();
  
  return {
    info: {
      id,
      username,
      email,
      createdAt: now,
      lastLoginAt: now,
      isOnline: true,
      characterName,
      class: 'novice'
    },
    level: {
      level: 1,
      experience: 0,
      experienceToNext: 100,
      statPoints: 5,
      skillPoints: 1
    },
    stats: {
      str: 10,
      dex: 10,
      int: 10,
      vit: 10,
      luk: 10
    },
    equipment: {},
    inventory: [],
    inventorySize: 20,
    location: {
      areaId: 'starter_town',
      x: 0,
      y: 0,
      mapName: '초보자 마을'
    },
    skills: [],
    quests: [],
    gold: 100,
    playtime: 0,
    pvpRank: 0,
    pvpPoints: 0
  };
};