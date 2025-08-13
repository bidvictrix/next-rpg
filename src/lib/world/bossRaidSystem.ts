import { Player, Stats } from '@/types/game';
import { logger } from '../logger';

// 레이드 보스 정의
interface RaidBoss {
  id: string;
  name: string;
  displayName: string;
  description: string;
  level: number;
  type: BossType;
  rarity: BossRarity;
  stats: BossStats;
  abilities: BossAbility[];
  phases: BossPhase[];
  resistances: Resistance[];
  weaknesses: Weakness[];
  dropTable: DropTable;
  respawnTime: number; // 시간 단위
  respawnVariance: number; // 편차 (%)
  requirements: RaidRequirement[];
  maxParticipants: number;
  minParticipants: number;
  timeLimit: number; // 분 단위
  difficultyScaling: boolean;
  modelId?: string;
  animationSet?: string;
  soundEffects?: string[];
}

// 보스 타입
type BossType = 'world' | 'dungeon' | 'raid' | 'epic' | 'legendary' | 'event' | 'guild';

// 보스 희귀도
type BossRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// 보스 스탯
interface BossStats extends Stats {
  armor: number;
  magicResistance: number;
  criticalResistance: number;
  statusResistance: number;
  regeneration: number; // HP 재생/초
  manaRegeneration: number; // MP 재생/초
}

// 보스 능력
interface BossAbility {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  cooldown: number; // 초 단위
  castTime: number; // 초 단위
  range: number;
  damage?: number;
  effects: AbilityEffect[];
  animation?: string;
  soundEffect?: string;
  conditions: AbilityCondition[];
  isChanneled: boolean;
  canBeInterrupted: boolean;
}

// 능력 타입
type AbilityType = 'attack' | 'spell' | 'buff' | 'debuff' | 'heal' | 'summon' | 'teleport' | 'special';

// 능력 효과
interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'knockback' | 'stun' | 'silence' | 'fear' | 'charm';
  value: number;
  duration?: number; // 초 단위
  radius?: number;
  targetType: 'self' | 'single' | 'area' | 'all_players' | 'random_player' | 'closest_player';
  statModifier?: string; // 영향받는 스탯
}

// 능력 조건
interface AbilityCondition {
  type: 'health_percent' | 'mana_percent' | 'phase' | 'time_elapsed' | 'player_count' | 'random';
  value: number | string | { min?: number; max?: number };
  operator?: 'less_than' | 'greater_than' | 'equals' | 'not_equals';
}

// 보스 페이즈
interface BossPhase {
  id: string;
  name: string;
  description: string;
  healthThreshold: number; // HP 비율 (%)
  duration?: number; // 시간 제한 (초)
  abilities: string[]; // 사용 가능한 능력 ID들
  statModifiers: Record<string, number>;
  specialEffects: PhaseEffect[];
  nextPhase?: string;
  isSkippable: boolean;
}

// 페이즈 효과
interface PhaseEffect {
  type: 'spawn_adds' | 'environment_change' | 'player_teleport' | 'buff_boss' | 'debuff_players';
  data: Record<string, unknown>;
  triggerCondition?: string;
}

// 저항력/약점
interface Resistance {
  damageType: DamageType;
  value: number; // 감소율 (%)
}

interface Weakness {
  damageType: DamageType;
  value: number; // 증가율 (%)
  condition?: string; // 조건
}

type DamageType = 'physical' | 'magical' | 'fire' | 'ice' | 'lightning' | 'poison' | 'holy' | 'dark';

// 드롭 테이블
interface DropTable {
  guaranteedDrops: DropItem[];
  randomDrops: DropPool[];
  firstKillBonus: DropItem[];
  mvpRewards: DropItem[];
  participationRewards: DropItem[];
}

// 드롭 아이템
interface DropItem {
  itemId: string;
  itemName: string;
  quantity: { min: number; max: number };
  chance: number; // 확률 (%)
  condition?: string; // 드롭 조건
}

// 드롭 풀
interface DropPool {
  name: string;
  maxPicks: number;
  items: DropItem[];
}

// 레이드 요구사항
interface RaidRequirement {
  type: 'level' | 'class' | 'party_size' | 'guild' | 'item' | 'quest' | 'achievement';
  condition: Record<string, unknown> | number | string;
  message: string;
}

// 레이드 인스턴스
interface RaidInstance {
  id: string;
  bossId: string;
  boss: RaidBoss;
  status: RaidStatus;
  participants: Map<string, RaidParticipant>;
  bossState: BossState;
  startTime: Date;
  endTime?: Date;
  duration: number;
  currentPhase: string;
  events: RaidEvent[];
  loot: RaidLoot[];
  statistics: RaidStatistics;
  settings: RaidSettings;
  isPublic: boolean;
  createdBy: string;
  maxRewards: boolean; // 최대 보상 조건 달성 여부
}

// 레이드 상태
type RaidStatus = 'waiting' | 'starting' | 'active' | 'completed' | 'failed' | 'cancelled';

// 레이드 참가자
interface RaidParticipant {
  playerId: string;
  playerName: string;
  level: number;
  class: string;
  role: PlayerRole;
  joinedAt: Date;
  position: RaidPosition;
  status: ParticipantStatus;
  stats: ParticipantStats;
  buffs: RaidBuff[];
  debuffs: RaidDebuff[];
  contribution: ParticipantContribution;
  isLeader: boolean;
  lastActivity: Date;
}

// 플레이어 역할
type PlayerRole = 'tank' | 'dps' | 'healer' | 'support' | 'any';

// 레이드 위치
interface RaidPosition {
  x: number;
  y: number;
  z?: number;
  facing: number;
}

// 참가자 상태
type ParticipantStatus = 'alive' | 'dead' | 'offline' | 'left';

// 참가자 스탯
interface ParticipantStats {
  currentHP: number;
  maxHP: number;
  currentMP: number;
  maxMP: number;
  attack: number;
  defense: number;
  speed: number;
  criticalRate: number;
  criticalDamage: number;
}

// 레이드 버프/디버프
interface RaidBuff {
  id: string;
  name: string;
  description: string;
  type: 'buff' | 'debuff';
  stat: string;
  value: number;
  duration: number;
  remaining: number;
  source: string; // 소스 (보스 능력, 아이템 등)
  stackable: boolean;
  stacks: number;
}

interface RaidDebuff extends RaidBuff {
  type: 'debuff';
}

// 참가자 기여도
interface ParticipantContribution {
  damageDealt: number;
  damageReceived: number;
  healing: number;
  deaths: number;
  timeAlive: number;
  buffTime: number;
  debuffTime: number;
  mvpScore: number;
}

// 보스 상태
interface BossState {
  currentHP: number;
  maxHP: number;
  currentMP: number;
  maxMP: number;
  currentPhase: string;
  phaseStartTime: Date;
  lastAbilityUsed?: Date;
  abilityCooldowns: Record<string, number>;
  buffs: RaidBuff[];
  debuffs: RaidDebuff[];
  isChanneling: boolean;
  channelStartTime?: Date;
  channelAbility?: string;
  position: RaidPosition;
  targetPlayerId?: string;
  isEnraged: boolean;
  enrageTime?: Date;
}

// 레이드 이벤트
interface RaidEvent {
  id: string;
  timestamp: Date;
  type: RaidEventType;
  actorId: string; // 보스 또는 플레이어 ID
  targetId?: string;
  abilityId?: string;
  damage?: number;
  healing?: number;
  description: string;
  metadata?: Record<string, unknown>;
}

// 레이드 이벤트 타입
type RaidEventType = 
  | 'damage_dealt' | 'damage_received' | 'healing' | 'ability_used' 
  | 'phase_change' | 'player_death' | 'player_revive' | 'buff_applied' 
  | 'debuff_applied' | 'buff_removed' | 'debuff_removed';

// 레이드 전리품
interface RaidLoot {
  itemId: string;
  itemName: string;
  quantity: number;
  winner?: string; // 획득한 플레이어 ID
  distributionMethod: LootDistribution;
  rollResults?: Record<string, number>; // 플레이어별 주사위 결과
  isDistributed: boolean;
}

// 전리품 분배 방식
type LootDistribution = 'free_for_all' | 'round_robin' | 'dkp' | 'roll' | 'leader_decision';

// 레이드 통계
interface RaidStatistics {
  totalDamage: number;
  totalHealing: number;
  totalDeaths: number;
  averageDPS: number;
  averageHPS: number;
  fastestKill?: number; // 초 단위
  participantCount: number;
  phaseProgression: Record<string, number>; // 페이즈별 소요 시간
  abilityUsageCount: Record<string, number>;
  mostValuablePlayer?: string;
}

// 레이드 설정
interface RaidSettings {
  allowLateJoin: boolean;
  autoRevive: boolean;
  reviveOnPhaseChange: boolean;
  lootDistribution: LootDistribution;
  difficultyModifier: number; // 1.0 = 기본 난이도
  timeExtension: boolean;
  friendlyFire: boolean;
  showDamageNumbers: boolean;
  recordStats: boolean;
}

export class BossRaidSystem {
  private bosses: Map<string, RaidBoss> = new Map();
  private activeRaids: Map<string, RaidInstance> = new Map();
  private raidHistory: RaidInstance[] = [];
  private spawnTimers: Map<string, NodeJS.Timeout> = new Map();
  private maxHistorySize: number = 1000;

  constructor() {
    this.initializeDefaultBosses();
    this.startRaidManagement();
  }

  /**
   * 기본 레이드 보스들 초기화
   */
  private initializeDefaultBosses(): void {
    const defaultBosses: RaidBoss[] = [
      {
        id: 'dragon_lord',
        name: 'dragon_lord',
        displayName: '드래곤 로드',
        description: '고대부터 이 땅을 지배해온 전설의 용',
        level: 50,
        type: 'raid',
        rarity: 'legendary',
        stats: {
          hp: 500000,
          mp: 50000,
          str: 1000,
          dex: 800,
          int: 1200,
          vit: 1500,
          luk: 500,
          def: 800,
          armor: 500,
          magicResistance: 300,
          criticalResistance: 200,
          statusResistance: 150,
          regeneration: 100,
          manaRegeneration: 50
        },
        abilities: [
          {
            id: 'fire_breath',
            name: '화염 브레스',
            description: '전방 광범위에 화염 피해를 가합니다',
            type: 'attack',
            cooldown: 15,
            castTime: 3,
            range: 500,
            damage: 8000,
            effects: [
              {
                type: 'damage',
                value: 8000,
                targetType: 'area',
                radius: 200
              },
              {
                type: 'debuff',
                value: 20,
                duration: 10,
                targetType: 'area',
                radius: 200,
                statModifier: 'defense'
              }
            ],
            conditions: [
              {
                type: 'health_percent',
                value: 80,
                operator: 'greater_than'
              }
            ],
            isChanneled: true,
            canBeInterrupted: false
          },
          {
            id: 'tail_sweep',
            name: '꼬리 휩쓸기',
            description: '뒤쪽의 모든 적을 공격합니다',
            type: 'attack',
            cooldown: 8,
            castTime: 1,
            range: 300,
            damage: 5000,
            effects: [
              {
                type: 'damage',
                value: 5000,
                targetType: 'area',
                radius: 300
              },
              {
                type: 'knockback',
                value: 200,
                targetType: 'area',
                radius: 300
              }
            ],
            conditions: [],
            isChanneled: false,
            canBeInterrupted: false
          },
          {
            id: 'meteor_storm',
            name: '메테오 스톰',
            description: '하늘에서 운석들이 떨어집니다',
            type: 'spell',
            cooldown: 45,
            castTime: 8,
            range: 0,
            damage: 12000,
            effects: [
              {
                type: 'damage',
                value: 12000,
                targetType: 'random_player',
                radius: 150
              }
            ],
            conditions: [
              {
                type: 'health_percent',
                value: 50,
                operator: 'less_than'
              }
            ],
            isChanneled: true,
            canBeInterrupted: true
          },
          {
            id: 'dragon_roar',
            name: '용의 포효',
            description: '모든 플레이어에게 공포를 가합니다',
            type: 'debuff',
            cooldown: 30,
            castTime: 2,
            range: 0,
            effects: [
              {
                type: 'fear',
                value: 1,
                duration: 5,
                targetType: 'all_players'
              },
              {
                type: 'debuff',
                value: 30,
                duration: 15,
                targetType: 'all_players',
                statModifier: 'attack'
              }
            ],
            conditions: [
              {
                type: 'health_percent',
                value: 25,
                operator: 'less_than'
              }
            ],
            isChanneled: false,
            canBeInterrupted: false
          }
        ],
        phases: [
          {
            id: 'phase_1',
            name: '격노 전',
            description: '드래곤이 플레이어들을 경계하고 있습니다',
            healthThreshold: 100,
            abilities: ['fire_breath', 'tail_sweep'],
            statModifiers: {},
            specialEffects: [],
            nextPhase: 'phase_2',
            isSkippable: false
          },
          {
            id: 'phase_2',
            name: '격노',
            description: '드래곤이 격노하여 더욱 강력해졌습니다',
            healthThreshold: 50,
            abilities: ['fire_breath', 'tail_sweep', 'meteor_storm'],
            statModifiers: {
              attack: 150,
              speed: 120
            },
            specialEffects: [
              {
                type: 'buff_boss',
                data: { stat: 'attack', value: 150 }
              }
            ],
            nextPhase: 'phase_3',
            isSkippable: false
          },
          {
            id: 'phase_3',
            name: '최후의 몸부림',
            description: '드래곤이 최후의 힘을 발휘합니다',
            healthThreshold: 25,
            abilities: ['fire_breath', 'tail_sweep', 'meteor_storm', 'dragon_roar'],
            statModifiers: {
              attack: 200,
              speed: 150,
              regeneration: 200
            },
            specialEffects: [
              {
                type: 'environment_change',
                data: { effect: 'lava_floor' }
              }
            ],
            isSkippable: false
          }
        ],
        resistances: [
          { damageType: 'fire', value: 80 },
          { damageType: 'physical', value: 30 }
        ],
        weaknesses: [
          { damageType: 'ice', value: 50 },
          { damageType: 'holy', value: 30 }
        ],
        dropTable: {
          guaranteedDrops: [
            {
              itemId: 'dragon_scale',
              itemName: '드래곤 비늘',
              quantity: { min: 5, max: 10 },
              chance: 100
            }
          ],
          randomDrops: [
            {
              name: '무기 풀',
              maxPicks: 1,
              items: [
                {
                  itemId: 'dragon_sword',
                  itemName: '드래곤 소드',
                  quantity: { min: 1, max: 1 },
                  chance: 20
                },
                {
                  itemId: 'dragon_staff',
                  itemName: '드래곤 스태프',
                  quantity: { min: 1, max: 1 },
                  chance: 20
                }
              ]
            }
          ],
          firstKillBonus: [
            {
              itemId: 'dragon_lord_title',
              itemName: '드래곤 슬레이어 칭호',
              quantity: { min: 1, max: 1 },
              chance: 100
            }
          ],
          mvpRewards: [
            {
              itemId: 'dragon_heart',
              itemName: '드래곤 하트',
              quantity: { min: 1, max: 1 },
              chance: 100
            }
          ],
          participationRewards: [
            {
              itemId: 'experience_gem',
              itemName: '경험치 보석',
              quantity: { min: 1, max: 3 },
              chance: 100
            }
          ]
        },
        respawnTime: 24, // 24시간
        respawnVariance: 20, // ±20%
        requirements: [
          {
            type: 'level',
            condition: { min: 40 },
            message: '레벨 40 이상만 참여할 수 있습니다.'
          },
          {
            type: 'party_size',
            condition: { min: 5, max: 20 },
            message: '5-20명의 파티가 필요합니다.'
          }
        ],
        maxParticipants: 20,
        minParticipants: 5,
        timeLimit: 60, // 60분
        difficultyScaling: true,
        modelId: 'dragon_lord_model',
        soundEffects: ['dragon_roar.wav', 'fire_breath.wav']
      },
      {
        id: 'shadow_king',
        name: 'shadow_king',
        displayName: '그림자 왕',
        description: '어둠의 힘을 다루는 고대 왕의 망령',
        level: 35,
        type: 'dungeon',
        rarity: 'epic',
        stats: {
          hp: 200000,
          mp: 30000,
          str: 600,
          dex: 900,
          int: 1100,
          vit: 800,
          luk: 400,
          def: 500,
          armor: 300,
          magicResistance: 600,
          criticalResistance: 100,
          statusResistance: 200,
          regeneration: 50,
          manaRegeneration: 100
        },
        abilities: [
          {
            id: 'shadow_bolt',
            name: '그림자 화살',
            description: '어둠의 화살을 발사합니다',
            type: 'spell',
            cooldown: 3,
            castTime: 1.5,
            range: 800,
            damage: 3000,
            effects: [
              {
                type: 'damage',
                value: 3000,
                targetType: 'single'
              }
            ],
            conditions: [],
            isChanneled: false,
            canBeInterrupted: true
          },
          {
            id: 'shadow_bind',
            name: '그림자 속박',
            description: '대상을 그림자로 속박합니다',
            type: 'debuff',
            cooldown: 20,
            castTime: 2,
            range: 600,
            effects: [
              {
                type: 'stun',
                value: 1,
                duration: 8,
                targetType: 'single'
              }
            ],
            conditions: [],
            isChanneled: false,
            canBeInterrupted: true
          },
          {
            id: 'summon_shadows',
            name: '그림자 소환',
            description: '그림자 졸개들을 소환합니다',
            type: 'summon',
            cooldown: 60,
            castTime: 5,
            range: 0,
            effects: [
              {
                type: 'buff',
                value: 3,
                duration: 30,
                targetType: 'self',
                statModifier: 'summon_count'
              }
            ],
            conditions: [
              {
                type: 'health_percent',
                value: 70,
                operator: 'less_than'
              }
            ],
            isChanneled: true,
            canBeInterrupted: true
          }
        ],
        phases: [
          {
            id: 'normal',
            name: '일반',
            description: '그림자 왕의 기본 상태',
            healthThreshold: 100,
            abilities: ['shadow_bolt', 'shadow_bind'],
            statModifiers: {},
            specialEffects: [],
            nextPhase: 'summoning',
            isSkippable: false
          },
          {
            id: 'summoning',
            name: '소환',
            description: '그림자 왕이 졸개들을 소환합니다',
            healthThreshold: 70,
            abilities: ['shadow_bolt', 'shadow_bind', 'summon_shadows'],
            statModifiers: {
              magicResistance: 150
            },
            specialEffects: [
              {
                type: 'spawn_adds',
                data: { type: 'shadow_minion', count: 3 }
              }
            ],
            nextPhase: 'enraged',
            isSkippable: false
          },
          {
            id: 'enraged',
            name: '격분',
            description: '그림자 왕이 격분합니다',
            healthThreshold: 30,
            abilities: ['shadow_bolt', 'shadow_bind', 'summon_shadows'],
            statModifiers: {
              attack: 200,
              speed: 150
            },
            specialEffects: [],
            isSkippable: false
          }
        ],
        resistances: [
          { damageType: 'dark', value: 90 },
          { damageType: 'magical', value: 50 }
        ],
        weaknesses: [
          { damageType: 'holy', value: 100 },
          { damageType: 'fire', value: 30 }
        ],
        dropTable: {
          guaranteedDrops: [
            {
              itemId: 'shadow_essence',
              itemName: '그림자 정수',
              quantity: { min: 2, max: 5 },
              chance: 100
            }
          ],
          randomDrops: [
            {
              name: '장비 풀',
              maxPicks: 2,
              items: [
                {
                  itemId: 'shadow_cloak',
                  itemName: '그림자 망토',
                  quantity: { min: 1, max: 1 },
                  chance: 30
                },
                {
                  itemId: 'dark_ring',
                  itemName: '어둠의 반지',
                  quantity: { min: 1, max: 1 },
                  chance: 25
                }
              ]
            }
          ],
          firstKillBonus: [],
          mvpRewards: [
            {
              itemId: 'shadow_crown',
              itemName: '그림자 왕관',
              quantity: { min: 1, max: 1 },
              chance: 50
            }
          ],
          participationRewards: [
            {
              itemId: 'gold_coin',
              itemName: '골드',
              quantity: { min: 1000, max: 3000 },
              chance: 100
            }
          ]
        },
        respawnTime: 6, // 6시간
        respawnVariance: 30,
        requirements: [
          {
            type: 'level',
            condition: { min: 25 },
            message: '레벨 25 이상만 참여할 수 있습니다.'
          }
        ],
        maxParticipants: 8,
        minParticipants: 3,
        timeLimit: 30, // 30분
        difficultyScaling: false
      }
    ];

    defaultBosses.forEach(boss => {
      this.bosses.set(boss.id, boss);
      this.scheduleRespawn(boss);
    });
  }

  /**
   * 레이드 생성
   */
  async createRaid(
    bossId: string,
    leaderId: string,
    settings?: Partial<RaidSettings>
  ): Promise<{ success: boolean; raidId?: string; error?: string }> {
    
    const boss = this.bosses.get(bossId);
    if (!boss) {
      return { success: false, error: '존재하지 않는 보스입니다.' };
    }

    const leader = await this.getPlayerInfo(leaderId);
    if (!leader) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 요구사항 확인
    const requirementCheck = this.checkRaidRequirements(boss, leader);
    if (!requirementCheck.allowed) {
      return { success: false, error: requirementCheck.reason };
    }

    const raidId = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultSettings: RaidSettings = {
      allowLateJoin: false,
      autoRevive: false,
      reviveOnPhaseChange: false,
      lootDistribution: 'roll',
      difficultyModifier: 1.0,
      timeExtension: false,
      friendlyFire: false,
      showDamageNumbers: true,
      recordStats: true
    };

    const leaderParticipant: RaidParticipant = {
      playerId: leaderId,
      playerName: leader.name,
      level: leader.level,
      class: leader.class || 'warrior',
      role: 'any',
      joinedAt: new Date(),
      position: { x: 0, y: 0, facing: 0 },
      status: 'alive',
      stats: this.convertPlayerStats(leader.stats),
      buffs: [],
      debuffs: [],
      contribution: this.createEmptyContribution(),
      isLeader: true,
      lastActivity: new Date()
    };

    const raid: RaidInstance = {
      id: raidId,
      bossId,
      boss: { ...boss },
      status: 'waiting',
      participants: new Map([[leaderId, leaderParticipant]]),
      bossState: this.createInitialBossState(boss),
      startTime: new Date(),
      duration: 0,
      currentPhase: boss.phases[0].id,
      events: [],
      loot: [],
      statistics: this.createEmptyStatistics(),
      settings: { ...defaultSettings, ...settings },
      isPublic: true,
      createdBy: leaderId,
      maxRewards: false
    };

    this.activeRaids.set(raidId, raid);

    logger.info(`레이드 생성: ${boss.displayName} by ${leader.name} (${raidId})`);

    return { success: true, raidId };
  }

  /**
   * 레이드 참가
   */
  async joinRaid(
    raidId: string,
    playerId: string,
    role?: PlayerRole
  ): Promise<{ success: boolean; error?: string }> {
    
    const raid = this.activeRaids.get(raidId);
    if (!raid) {
      return { success: false, error: '존재하지 않는 레이드입니다.' };
    }

    if (raid.status !== 'waiting') {
      if (raid.status !== 'starting' || !raid.settings.allowLateJoin) {
        return { success: false, error: '참가할 수 없는 레이드 상태입니다.' };
      }
    }

    if (raid.participants.has(playerId)) {
      return { success: false, error: '이미 참가한 레이드입니다.' };
    }

    if (raid.participants.size >= raid.boss.maxParticipants) {
      return { success: false, error: '레이드가 가득 찼습니다.' };
    }

    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 요구사항 확인
    const requirementCheck = this.checkRaidRequirements(raid.boss, player);
    if (!requirementCheck.allowed) {
      return { success: false, error: requirementCheck.reason };
    }

    const participant: RaidParticipant = {
      playerId,
      playerName: player.name,
      level: player.level,
      class: player.class || 'warrior',
      role: role || 'any',
      joinedAt: new Date(),
      position: this.getSpawnPosition(raid),
      status: 'alive',
      stats: this.convertPlayerStats(player.stats),
      buffs: [],
      debuffs: [],
      contribution: this.createEmptyContribution(),
      isLeader: false,
      lastActivity: new Date()
    };

    raid.participants.set(playerId, participant);

    // 레이드 이벤트 기록
    this.addRaidEvent(raid, {
      type: 'damage_dealt', // 임시, 실제로는 'player_joined' 등의 타입 필요
      actorId: playerId,
      description: `${player.name}이(가) 레이드에 참가했습니다.`
    });

    logger.info(`레이드 참가: ${player.name} → ${raid.boss.displayName} (${raidId})`);

    return { success: true };
  }

  /**
   * 레이드 시작
   */
  async startRaid(raidId: string, leaderId: string): Promise<{ success: boolean; error?: string }> {
    const raid = this.activeRaids.get(raidId);
    if (!raid) {
      return { success: false, error: '존재하지 않는 레이드입니다.' };
    }

    const leader = raid.participants.get(leaderId);
    if (!leader || !leader.isLeader) {
      return { success: false, error: '레이드 리더만 시작할 수 있습니다.' };
    }

    if (raid.status !== 'waiting') {
      return { success: false, error: '시작할 수 없는 레이드 상태입니다.' };
    }

    if (raid.participants.size < raid.boss.minParticipants) {
      return { success: false, error: `최소 ${raid.boss.minParticipants}명이 필요합니다.` };
    }

    raid.status = 'starting';
    raid.startTime = new Date();

    // 난이도 조정
    if (raid.boss.difficultyScaling) {
      this.adjustBossDifficulty(raid);
    }

    // 준비 시간 (10초)
    setTimeout(() => {
      this.beginRaidCombat(raidId);
    }, 10000);

    // 참가자들에게 알림
    this.broadcastToRaid(raid, {
      type: 'raid_starting',
      message: '레이드가 곧 시작됩니다! 준비하세요!'
    });

    logger.info(`레이드 시작: ${raid.boss.displayName} (${raidId})`);

    return { success: true };
  }

  /**
   * 레이드 전투 시작
   */
  private async beginRaidCombat(raidId: string): Promise<void> {
    const raid = this.activeRaids.get(raidId);
    if (!raid) return;

    raid.status = 'active';
    raid.startTime = new Date();

    // 첫 번째 페이즈 시작
    await this.activatePhase(raid, raid.boss.phases[0].id);

    // AI 루프 시작
    this.startBossAI(raid);

    // 타임 리미트 설정
    setTimeout(() => {
      if (raid.status === 'active') {
        this.endRaid(raidId, 'failed', '시간 초과');
      }
    }, raid.boss.timeLimit * 60 * 1000);

    this.broadcastToRaid(raid, {
      type: 'combat_start',
      message: '전투가 시작되었습니다!'
    });

    logger.info(`레이드 전투 시작: ${raid.boss.displayName} (${raidId})`);
  }

  /**
   * 보스 AI 시작
   */
  private startBossAI(raid: RaidInstance): void {
    const aiInterval = setInterval(() => {
      if (raid.status !== 'active') {
        clearInterval(aiInterval);
        return;
      }

      this.processBossAI(raid);
    }, 1000); // 1초마다 AI 처리
  }

  /**
   * 보스 AI 처리
   */
  private processBossAI(raid: RaidInstance): void {
    const boss = raid.bossState;
    const now = Date.now();

    // 채널링 중인지 확인
    if (boss.isChanneling && boss.channelStartTime && boss.channelAbility) {
      const ability = raid.boss.abilities.find(a => a.id === boss.channelAbility);
      if (ability) {
        const elapsed = (now - boss.channelStartTime.getTime()) / 1000;
        if (elapsed >= ability.castTime) {
          // 채널링 완료, 능력 실행
          this.executeBossAbility(raid, ability);
          boss.isChanneling = false;
          boss.channelStartTime = undefined;
          boss.channelAbility = undefined;
        }
      }
      return; // 채널링 중이면 다른 행동 불가
    }

    // 사용 가능한 능력 찾기
    const currentPhase = raid.boss.phases.find(p => p.id === raid.currentPhase);
    if (!currentPhase) return;

    const availableAbilities = raid.boss.abilities.filter(ability => {
      // 페이즈에서 사용 가능한지 확인
      if (!currentPhase.abilities.includes(ability.id)) return false;

      // 쿨다운 확인
      const lastUsed = boss.abilityCooldowns[ability.id] || 0;
      if (now - lastUsed < ability.cooldown * 1000) return false;

      // 조건 확인
      return this.checkAbilityConditions(raid, ability);
    });

    if (availableAbilities.length > 0) {
      // 랜덤하게 능력 선택 (실제로는 더 정교한 AI 로직 필요)
      const ability = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
      this.useBossAbility(raid, ability);
    }

    // 페이즈 전환 확인
    this.checkPhaseTransition(raid);

    // 버프/디버프 업데이트
    this.updateBossBuffs(raid);
  }

  /**
   * 보스 능력 사용
   */
  private useBossAbility(raid: RaidInstance, ability: BossAbility): void {
    const boss = raid.bossState;

    if (ability.isChanneled) {
      // 채널링 시작
      boss.isChanneling = true;
      boss.channelStartTime = new Date();
      boss.channelAbility = ability.id;

      this.broadcastToRaid(raid, {
        type: 'boss_channeling',
        abilityId: ability.id,
        abilityName: ability.name,
        castTime: ability.castTime
      });
    } else {
      // 즉시 실행
      this.executeBossAbility(raid, ability);
    }

    boss.abilityCooldowns[ability.id] = Date.now();

    this.addRaidEvent(raid, {
      type: 'ability_used',
      actorId: 'boss',
      abilityId: ability.id,
      description: `${raid.boss.displayName}이(가) ${ability.name}을(를) 사용했습니다.`
    });
  }

  /**
   * 보스 능력 실행
   */
  private executeBossAbility(raid: RaidInstance, ability: BossAbility): void {
    for (const effect of ability.effects) {
      this.applyAbilityEffect(raid, ability, effect);
    }

    raid.statistics.abilityUsageCount[ability.id] = 
      (raid.statistics.abilityUsageCount[ability.id] || 0) + 1;
  }

  /**
   * 능력 효과 적용
   */
  private applyAbilityEffect(raid: RaidInstance, ability: BossAbility, effect: AbilityEffect): void {
    const targets = this.getAbilityTargets(raid, effect.targetType, effect.radius);

    for (const target of targets) {
      switch (effect.type) {
        case 'damage':
          this.dealDamageToPlayer(raid, target.playerId, effect.value, ability.type);
          break;
        case 'heal':
          this.healBoss(raid, effect.value);
          break;
        case 'buff':
        case 'debuff':
          this.applyBuffToPlayer(raid, target.playerId, {
            id: `${ability.id}_${effect.type}`,
            name: ability.name,
            description: ability.description,
            type: effect.type,
            stat: effect.statModifier || 'hp',
            value: effect.value,
            duration: effect.duration || 30,
            remaining: effect.duration || 30,
            source: ability.id,
            stackable: false,
            stacks: 1
          });
          break;
        case 'stun':
        case 'silence':
        case 'fear':
          this.applyStatusEffect(raid, target.playerId, effect.type, effect.duration || 5);
          break;
        case 'knockback':
          this.knockbackPlayer(raid, target.playerId, effect.value);
          break;
      }
    }
  }

  /**
   * 플레이어 공격 처리
   */
  async playerAttack(
    raidId: string,
    playerId: string,
    damage: number,
    damageType: DamageType = 'physical'
  ): Promise<{ success: boolean; actualDamage?: number; error?: string }> {
    
    const raid = this.activeRaids.get(raidId);
    if (!raid || raid.status !== 'active') {
      return { success: false, error: '활성 상태가 아닌 레이드입니다.' };
    }

    const participant = raid.participants.get(playerId);
    if (!participant || participant.status !== 'alive') {
      return { success: false, error: '공격할 수 없는 상태입니다.' };
    }

    // 데미지 계산 (저항력/약점 적용)
    let actualDamage = damage;
    
    // 저항력 적용
    const resistance = raid.boss.resistances.find(r => r.damageType === damageType);
    if (resistance) {
      actualDamage = Math.floor(actualDamage * (100 - resistance.value) / 100);
    }

    // 약점 적용
    const weakness = raid.boss.weaknesses.find(w => w.damageType === damageType);
    if (weakness) {
      actualDamage = Math.floor(actualDamage * (100 + weakness.value) / 100);
    }

    // 보스에게 데미지 적용
    raid.bossState.currentHP = Math.max(0, raid.bossState.currentHP - actualDamage);
    
    // 기여도 기록
    participant.contribution.damageDealt += actualDamage;
    participant.contribution.mvpScore += actualDamage;
    participant.lastActivity = new Date();

    // 통계 업데이트
    raid.statistics.totalDamage += actualDamage;

    // 이벤트 기록
    this.addRaidEvent(raid, {
      type: 'damage_dealt',
      actorId: playerId,
      targetId: 'boss',
      damage: actualDamage,
      description: `${participant.playerName}이(가) ${raid.boss.displayName}에게 ${actualDamage} 데미지를 가했습니다.`
    });

    // 보스 사망 확인
    if (raid.bossState.currentHP <= 0) {
      await this.endRaid(raidId, 'completed', '보스 처치 성공');
    }

    return { success: true, actualDamage };
  }

  /**
   * 레이드 종료
   */
  private async endRaid(
    raidId: string, 
    result: 'completed' | 'failed' | 'cancelled',
    reason?: string
  ): Promise<void> {
    
    const raid = this.activeRaids.get(raidId);
    if (!raid) return;

    raid.status = result;
    raid.endTime = new Date();
    raid.duration = raid.endTime.getTime() - raid.startTime.getTime();

    // 최종 통계 계산
    this.calculateFinalStatistics(raid);

    if (result === 'completed') {
      // 보상 처리
      await this.generateLoot(raid);
      await this.distributeLoot(raid);
      
      // MVP 결정
      this.determineMVP(raid);
    }

    // 참가자들에게 알림
    const message = result === 'completed' ? 
      '레이드가 성공적으로 완료되었습니다!' :
      `레이드가 ${result === 'failed' ? '실패' : '취소'}되었습니다.${reason ? ` (${reason})` : ''}`;

    this.broadcastToRaid(raid, {
      type: 'raid_end',
      result,
      message
    });

    // 히스토리에 추가
    this.addToHistory(raid);

    // 활성 레이드에서 제거
    this.activeRaids.delete(raidId);

    logger.info(`레이드 종료: ${raid.boss.displayName} (${raidId}) - ${result}`);
  }

  // 헬퍼 함수들
  private checkRaidRequirements(boss: RaidBoss, player: Player): { allowed: boolean; reason?: string } {
    for (const requirement of boss.requirements) {
      switch (requirement.type) {
        case 'level':
          if (requirement.condition.min && player.level < requirement.condition.min) {
            return { allowed: false, reason: requirement.message };
          }
          if (requirement.condition.max && player.level > requirement.condition.max) {
            return { allowed: false, reason: requirement.message };
          }
          break;
        case 'class':
          const allowedClasses = requirement.condition.classes || [];
          if (allowedClasses.length > 0 && !allowedClasses.includes(player.class)) {
            return { allowed: false, reason: requirement.message };
          }
          break;
        // 추가 요구사항들...
      }
    }
    return { allowed: true };
  }

  private createInitialBossState(boss: RaidBoss): BossState {
    return {
      currentHP: boss.stats.hp,
      maxHP: boss.stats.hp,
      currentMP: boss.stats.mp,
      maxMP: boss.stats.mp,
      currentPhase: boss.phases[0].id,
      phaseStartTime: new Date(),
      abilityCooldowns: {},
      buffs: [],
      debuffs: [],
      isChanneling: false,
      position: { x: 0, y: 0, facing: 0 },
      isEnraged: false
    };
  }

  private convertPlayerStats(stats: Stats): ParticipantStats {
    return {
      currentHP: stats.hp,
      maxHP: stats.hp,
      currentMP: stats.mp,
      maxMP: stats.mp,
      attack: stats.str,
      defense: stats.def,
      speed: stats.dex,
      criticalRate: stats.luk * 0.1,
      criticalDamage: 150
    };
  }

  private createEmptyContribution(): ParticipantContribution {
    return {
      damageDealt: 0,
      damageReceived: 0,
      healing: 0,
      deaths: 0,
      timeAlive: 0,
      buffTime: 0,
      debuffTime: 0,
      mvpScore: 0
    };
  }

  private createEmptyStatistics(): RaidStatistics {
    return {
      totalDamage: 0,
      totalHealing: 0,
      totalDeaths: 0,
      averageDPS: 0,
      averageHPS: 0,
      participantCount: 0,
      phaseProgression: {},
      abilityUsageCount: {},
      mostValuablePlayer: undefined
    };
  }

  private getSpawnPosition(raid: RaidInstance): RaidPosition {
    // 간단한 스폰 위치 계산 (실제로는 더 정교하게)
    const angle = Math.random() * 2 * Math.PI;
    const distance = 300 + Math.random() * 200;
    
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      facing: angle + Math.PI
    };
  }

  private adjustBossDifficulty(raid: RaidInstance): void {
    const participantCount = raid.participants.size;
    const baseParticipants = raid.boss.minParticipants;
    const scalingFactor = participantCount / baseParticipants;

    // HP 스케일링
    raid.bossState.maxHP = Math.floor(raid.boss.stats.hp * scalingFactor);
    raid.bossState.currentHP = raid.bossState.maxHP;

    // 기타 스탯 조정
    raid.boss.stats.str = Math.floor(raid.boss.stats.str * Math.sqrt(scalingFactor));
    raid.boss.stats.def = Math.floor(raid.boss.stats.def * Math.sqrt(scalingFactor));
  }

  private checkAbilityConditions(raid: RaidInstance, ability: BossAbility): boolean {
    const boss = raid.bossState;

    for (const condition of ability.conditions) {
      switch (condition.type) {
        case 'health_percent':
          const healthPercent = (boss.currentHP / boss.maxHP) * 100;
          switch (condition.operator) {
            case 'less_than':
              if (healthPercent >= condition.value) return false;
              break;
            case 'greater_than':
              if (healthPercent <= condition.value) return false;
              break;
            case 'equals':
              if (Math.abs(healthPercent - condition.value) > 5) return false;
              break;
          }
          break;
        case 'phase':
          if (raid.currentPhase !== condition.value) return false;
          break;
        case 'player_count':
          const aliveCount = Array.from(raid.participants.values())
            .filter(p => p.status === 'alive').length;
          if (!this.checkNumberCondition(aliveCount, condition.value, condition.operator)) {
            return false;
          }
          break;
        case 'random':
          if (Math.random() * 100 > condition.value) return false;
          break;
      }
    }

    return true;
  }

  private checkNumberCondition(actual: number, target: number, operator?: string): boolean {
    switch (operator) {
      case 'less_than': return actual < target;
      case 'greater_than': return actual > target;
      case 'equals': return actual === target;
      case 'not_equals': return actual !== target;
      default: return actual >= target;
    }
  }

  private getAbilityTargets(
    raid: RaidInstance, 
    targetType: string, 
    radius?: number
  ): RaidParticipant[] {
    const alivePlayers = Array.from(raid.participants.values())
      .filter(p => p.status === 'alive');

    switch (targetType) {
      case 'single':
      case 'closest_player':
        return alivePlayers.slice(0, 1); // 첫 번째 플레이어 (실제로는 거리 계산 필요)
      case 'random_player':
        if (alivePlayers.length === 0) return [];
        const randomIndex = Math.floor(Math.random() * alivePlayers.length);
        return [alivePlayers[randomIndex]];
      case 'all_players':
        return alivePlayers;
      case 'area':
        // 실제로는 위치 기반 계산 필요
        return alivePlayers.slice(0, Math.ceil(alivePlayers.length / 2));
      default:
        return [];
    }
  }

  private dealDamageToPlayer(
    raid: RaidInstance, 
    playerId: string, 
    damage: number, 
    abilityType: AbilityType
  ): void {
    const participant = raid.participants.get(playerId);
    if (!participant || participant.status !== 'alive') return;

    // 방어력 적용
    const actualDamage = Math.max(1, damage - participant.stats.defense);
    
    participant.stats.currentHP = Math.max(0, participant.stats.currentHP - actualDamage);
    participant.contribution.damageReceived += actualDamage;

    // 사망 처리
    if (participant.stats.currentHP <= 0) {
      participant.status = 'dead';
      participant.contribution.deaths++;
      raid.statistics.totalDeaths++;

      this.addRaidEvent(raid, {
        type: 'player_death',
        actorId: playerId,
        description: `${participant.playerName}이(가) 사망했습니다.`
      });

      // 전멸 확인
      const aliveCount = Array.from(raid.participants.values())
        .filter(p => p.status === 'alive').length;
      
      if (aliveCount === 0) {
        this.endRaid(raid.id, 'failed', '전멸');
      }
    }

    this.addRaidEvent(raid, {
      type: 'damage_received',
      actorId: 'boss',
      targetId: playerId,
      damage: actualDamage,
      description: `${participant.playerName}이(가) ${actualDamage} 데미지를 받았습니다.`
    });
  }

  private healBoss(raid: RaidInstance, amount: number): void {
    raid.bossState.currentHP = Math.min(
      raid.bossState.maxHP,
      raid.bossState.currentHP + amount
    );
  }

  private applyBuffToPlayer(raid: RaidInstance, playerId: string, buff: RaidBuff): void {
    const participant = raid.participants.get(playerId);
    if (!participant) return;

    // 기존 같은 버프 확인
    const existingBuff = participant.buffs.find(b => b.id === buff.id);
    if (existingBuff) {
      if (buff.stackable) {
        existingBuff.stacks++;
        existingBuff.remaining = buff.duration;
      } else {
        existingBuff.remaining = buff.duration;
      }
    } else {
      participant.buffs.push(buff);
    }
  }

  private applyStatusEffect(
    raid: RaidInstance, 
    playerId: string, 
    effectType: string, 
    duration: number
  ): void {
    // 상태 효과 적용 로직
    logger.debug(`상태 효과 적용: ${effectType} to ${playerId} for ${duration}s`);
  }

  private knockbackPlayer(raid: RaidInstance, playerId: string, distance: number): void {
    // 넉백 효과 로직
    logger.debug(`넉백: ${playerId} ${distance} units`);
  }

  private checkPhaseTransition(raid: RaidInstance): void {
    const boss = raid.bossState;
    const healthPercent = (boss.currentHP / boss.maxHP) * 100;
    
    const nextPhase = raid.boss.phases.find(phase => 
      phase.healthThreshold < healthPercent && 
      phase.id !== raid.currentPhase
    );

    if (nextPhase) {
      this.activatePhase(raid, nextPhase.id);
    }
  }

  private async activatePhase(raid: RaidInstance, phaseId: string): Promise<void> {
    const phase = raid.boss.phases.find(p => p.id === phaseId);
    if (!phase) return;

    raid.currentPhase = phaseId;
    raid.bossState.currentPhase = phaseId;
    raid.bossState.phaseStartTime = new Date();

    // 페이즈 효과 적용
    for (const effect of phase.specialEffects) {
      await this.applyPhaseEffect(raid, effect);
    }

    // 스탯 수정자 적용
    Object.entries(phase.statModifiers).forEach(([stat, modifier]) => {
      const statsRecord = raid.boss.stats as unknown as Record<string, number>;
      const currentValue = statsRecord[stat] || 0;
      statsRecord[stat] = Math.floor(currentValue * (modifier / 100));
    });

    // 페이즈 전환 복구 처리
    if (raid.settings.reviveOnPhaseChange) {
      raid.participants.forEach(participant => {
        if (participant.status === 'dead') {
          participant.status = 'alive';
          participant.stats.currentHP = Math.floor(participant.stats.maxHP * 0.5);
        }
      });
    }

    this.addRaidEvent(raid, {
      type: 'phase_change',
      actorId: 'boss',
      description: `페이즈가 변경되었습니다: ${phase.name}`
    });

    this.broadcastToRaid(raid, {
      type: 'phase_change',
      phaseId,
      phaseName: phase.name,
      description: phase.description
    });

    logger.info(`페이즈 전환: ${raid.boss.displayName} → ${phase.name} (${raid.id})`);
  }

  private async applyPhaseEffect(raid: RaidInstance, effect: PhaseEffect): Promise<void> {
    switch (effect.type) {
      case 'spawn_adds':
        // 졸개 스폰 로직
        logger.debug(`졸개 스폰: ${effect.data.type} x${effect.data.count}`);
        break;
      case 'environment_change':
        // 환경 변화 로직
        logger.debug(`환경 변화: ${effect.data.effect}`);
        break;
      case 'buff_boss':
        // 보스 버프 로직
        logger.debug(`보스 버프: ${effect.data.stat} +${effect.data.value}`);
        break;
      // 추가 효과들...
    }
  }

  private updateBossBuffs(raid: RaidInstance): void {
    const now = Date.now();
    
    // 버프/디버프 시간 감소
    raid.bossState.buffs = raid.bossState.buffs.filter(buff => {
      buff.remaining--;
      return buff.remaining > 0;
    });

    raid.bossState.debuffs = raid.bossState.debuffs.filter(debuff => {
      debuff.remaining--;
      return debuff.remaining > 0;
    });

    // 재생 효과
    if (raid.boss.stats.regeneration > 0) {
      raid.bossState.currentHP = Math.min(
        raid.bossState.maxHP,
        raid.bossState.currentHP + raid.boss.stats.regeneration
      );
    }
  }

  private addRaidEvent(
    raid: RaidInstance, 
    event: Omit<RaidEvent, 'id' | 'timestamp'>
  ): void {
    const raidEvent: RaidEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    raid.events.push(raidEvent);

    // 이벤트 수 제한
    if (raid.events.length > 1000) {
      raid.events = raid.events.slice(-1000);
    }
  }

  private broadcastToRaid(raid: RaidInstance, message: Record<string, unknown>): void {
    raid.participants.forEach((participant, playerId) => {
      this.sendMessageToPlayer(playerId, message);
    });
  }

  private async sendMessageToPlayer(playerId: string, message: Record<string, unknown>): Promise<void> {
    // 실제로는 웹소켓 등으로 구현
    logger.debug(`메시지 전송 to ${playerId}:`, message);
  }

  private async generateLoot(raid: RaidInstance): Promise<void> {
    const dropTable = raid.boss.dropTable;

    // 확정 드롭
    for (const drop of dropTable.guaranteedDrops) {
      const quantity = Math.floor(
        Math.random() * (drop.quantity.max - drop.quantity.min + 1)
      ) + drop.quantity.min;

      raid.loot.push({
        itemId: drop.itemId,
        itemName: drop.itemName,
        quantity,
        distributionMethod: raid.settings.lootDistribution,
        isDistributed: false
      });
    }

    // 랜덤 드롭
    for (const pool of dropTable.randomDrops) {
      const picks = Math.min(pool.maxPicks, pool.items.length);
      const availableItems = [...pool.items];

      for (let i = 0; i < picks; i++) {
        const item = availableItems[Math.floor(Math.random() * availableItems.length)];
        if (Math.random() * 100 < item.chance) {
          const quantity = Math.floor(
            Math.random() * (item.quantity.max - item.quantity.min + 1)
          ) + item.quantity.min;

          raid.loot.push({
            itemId: item.itemId,
            itemName: item.itemName,
            quantity,
            distributionMethod: raid.settings.lootDistribution,
            isDistributed: false
          });
        }
        availableItems.splice(availableItems.indexOf(item), 1);
      }
    }

    // MVP 보상
    if (raid.statistics.mostValuablePlayer) {
      for (const mvpReward of dropTable.mvpRewards) {
        if (Math.random() * 100 < mvpReward.chance) {
          raid.loot.push({
            itemId: mvpReward.itemId,
            itemName: mvpReward.itemName,
            quantity: mvpReward.quantity.min,
            winner: raid.statistics.mostValuablePlayer,
            distributionMethod: 'leader_decision',
            isDistributed: true
          });
        }
      }
    }
  }

  private async distributeLoot(raid: RaidInstance): Promise<void> {
    const undistributedLoot = raid.loot.filter(item => !item.isDistributed);

    for (const loot of undistributedLoot) {
      switch (loot.distributionMethod) {
        case 'free_for_all':
          // 자유 획득 (첫 번째 참가자)
          const firstParticipant = Array.from(raid.participants.keys())[0];
          loot.winner = firstParticipant;
          loot.isDistributed = true;
          break;

        case 'round_robin':
          // 순서대로 분배
          const participantIds = Array.from(raid.participants.keys());
          const distributedCount = raid.loot.filter(l => l.isDistributed).length;
          loot.winner = participantIds[distributedCount % participantIds.length];
          loot.isDistributed = true;
          break;

        case 'roll':
          // 주사위 굴리기 (시뮬레이션)
          const rollResults: Record<string, number> = {};
          raid.participants.forEach((participant, playerId) => {
            rollResults[playerId] = Math.floor(Math.random() * 100) + 1;
          });

          const winner = Object.entries(rollResults)
            .sort(([, a], [, b]) => b - a)[0][0];

          loot.winner = winner;
          loot.rollResults = rollResults;
          loot.isDistributed = true;
          break;

        // 다른 분배 방식들...
      }

      if (loot.winner) {
        // 실제 아이템 지급
        await this.giveItemToPlayer(loot.winner, loot.itemId, loot.quantity);
      }
    }
  }

  private calculateFinalStatistics(raid: RaidInstance): void {
    const stats = raid.statistics;
    const duration = raid.duration / 1000; // 초 단위

    stats.participantCount = raid.participants.size;

    if (duration > 0) {
      stats.averageDPS = stats.totalDamage / duration;
      stats.averageHPS = stats.totalHealing / duration;
    }

    if (raid.status === 'completed') {
      stats.fastestKill = duration;
    }
  }

  private determineMVP(raid: RaidInstance): void {
    let mvpPlayerId = '';
    let maxScore = 0;

    raid.participants.forEach((participant, playerId) => {
      if (participant.contribution.mvpScore > maxScore) {
        maxScore = participant.contribution.mvpScore;
        mvpPlayerId = playerId;
      }
    });

    if (mvpPlayerId) {
      raid.statistics.mostValuablePlayer = mvpPlayerId;
    }
  }

  private addToHistory(raid: RaidInstance): void {
    this.raidHistory.unshift({ ...raid });

    if (this.raidHistory.length > this.maxHistorySize) {
      this.raidHistory = this.raidHistory.slice(0, this.maxHistorySize);
    }
  }

  private scheduleRespawn(boss: RaidBoss): void {
    const baseTime = boss.respawnTime * 60 * 60 * 1000; // 시간을 밀리초로
    const variance = baseTime * (boss.respawnVariance / 100);
    const actualTime = baseTime + (Math.random() - 0.5) * variance;

    const timeout = setTimeout(() => {
      this.spawnBoss(boss.id);
    }, actualTime);

    this.spawnTimers.set(boss.id, timeout);
  }

  private spawnBoss(bossId: string): void {
    const boss = this.bosses.get(bossId);
    if (!boss) return;

    // 보스 스폰 알림
    logger.info(`보스 스폰: ${boss.displayName}`);

    // 다음 리스폰 스케줄링
    this.scheduleRespawn(boss);
  }

  private startRaidManagement(): void {
    // 활성 레이드 관리
    setInterval(() => {
      this.manageActiveRaids();
    }, 5000); // 5초마다

    // 버프/디버프 업데이트
    setInterval(() => {
      this.updatePlayerBuffs();
    }, 1000); // 1초마다
  }

  private manageActiveRaids(): void {
    this.activeRaids.forEach((raid, raidId) => {
      if (raid.status === 'active') {
        // 비활성 플레이어 확인
        const now = Date.now();
        raid.participants.forEach((participant, playerId) => {
          if (now - participant.lastActivity.getTime() > 5 * 60 * 1000) { // 5분
            participant.status = 'offline';
          }
        });

        // 진행 시간 통계 업데이트
        const elapsed = now - raid.startTime.getTime();
        raid.duration = elapsed;
      }
    });
  }

  private updatePlayerBuffs(): void {
    this.activeRaids.forEach(raid => {
      raid.participants.forEach(participant => {
        // 버프 시간 감소
        participant.buffs = participant.buffs.filter(buff => {
          buff.remaining--;
          return buff.remaining > 0;
        });

        participant.debuffs = participant.debuffs.filter(debuff => {
          debuff.remaining--;
          return debuff.remaining > 0;
        });
      });
    });
  }

  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현 필요
    return null;
  }

  private async giveItemToPlayer(playerId: string, itemId: string, quantity: number): Promise<void> {
    // 실제 구현 필요
    logger.debug(`아이템 지급: ${playerId} - ${itemId} x${quantity}`);
  }

  /**
   * 공개 API 메서드들
   */
  getBoss(bossId: string): RaidBoss | null {
    return this.bosses.get(bossId) || null;
  }

  getAllBosses(): RaidBoss[] {
    return Array.from(this.bosses.values());
  }

  getRaid(raidId: string): RaidInstance | null {
    return this.activeRaids.get(raidId) || null;
  }

  getActiveRaids(): RaidInstance[] {
    return Array.from(this.activeRaids.values());
  }

  getRaidHistory(limit: number = 50): RaidInstance[] {
    return this.raidHistory.slice(0, limit);
  }

  getPlayerRaidHistory(playerId: string, limit: number = 20): RaidInstance[] {
    return this.raidHistory
      .filter(raid => raid.participants.has(playerId))
      .slice(0, limit);
  }

  getSystemStats(): {
    totalBosses: number;
    activeRaids: number;
    totalParticipants: number;
    completedRaids: number;
    averageRaidDuration: number;
  } {
    const totalBosses = this.bosses.size;
    const activeRaids = this.activeRaids.size;
    const totalParticipants = Array.from(this.activeRaids.values())
      .reduce((sum, raid) => sum + raid.participants.size, 0);
    
    const completedRaids = this.raidHistory.filter(r => r.status === 'completed').length;
    const totalDuration = this.raidHistory.reduce((sum, raid) => sum + raid.duration, 0);
    const averageRaidDuration = this.raidHistory.length > 0 ? 
      totalDuration / this.raidHistory.length / 1000 / 60 : 0; // 분 단위

    return {
      totalBosses,
      activeRaids,
      totalParticipants,
      completedRaids,
      averageRaidDuration
    };
  }

  // 관리자 기능들
  async createBoss(boss: RaidBoss): Promise<{ success: boolean; error?: string }> {
    if (this.bosses.has(boss.id)) {
      return { success: false, error: '이미 존재하는 보스 ID입니다.' };
    }

    this.bosses.set(boss.id, boss);
    this.scheduleRespawn(boss);

    logger.info(`새 보스 생성: ${boss.displayName} (${boss.id})`);

    return { success: true };
  }

  async forceEndRaid(raidId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const raid = this.activeRaids.get(raidId);
    if (!raid) {
      return { success: false, error: '존재하지 않는 레이드입니다.' };
    }

    await this.endRaid(raidId, 'cancelled', reason);

    return { success: true };
  }

  async forceSpawnBoss(bossId: string): Promise<{ success: boolean; error?: string }> {
    const boss = this.bosses.get(bossId);
    if (!boss) {
      return { success: false, error: '존재하지 않는 보스입니다.' };
    }

    this.spawnBoss(bossId);

    return { success: true };
  }
}

// 전역 보스 레이드 시스템 인스턴스
export const bossRaidSystem = new BossRaidSystem();

// 보스 레이드 관련 유틸리티
export const raidUtils = {
  /**
   * 보스 타입 표시명
   */
  getBossTypeDisplayName(type: BossType): string {
    const names = {
      world: '월드 보스',
      dungeon: '던전 보스',
      raid: '레이드 보스',
      epic: '에픽 보스',
      legendary: '전설 보스',
      event: '이벤트 보스',
      guild: '길드 보스'
    };
    return names[type];
  },

  /**
   * 희귀도 색상
   */
  getRarityColor(rarity: BossRarity): string {
    const colors = {
      common: '#ffffff',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000',
      mythic: '#e6cc80'
    };
    return colors[rarity];
  },

  /**
   * 레이드 상태 표시명
   */
  getRaidStatusDisplayName(status: RaidStatus): string {
    const names = {
      waiting: '대기 중',
      starting: '시작 중',
      active: '진행 중',
      completed: '완료',
      failed: '실패',
      cancelled: '취소'
    };
    return names[status];
  },

  /**
   * 역할 표시명
   */
  getRoleDisplayName(role: PlayerRole): string {
    const names = {
      tank: '탱커',
      dps: 'DPS',
      healer: '힐러',
      support: '서포터',
      any: '자유'
    };
    return names[role];
  },

  /**
   * 데미지 타입 표시명
   */
  getDamageTypeDisplayName(type: DamageType): string {
    const names = {
      physical: '물리',
      magical: '마법',
      fire: '화염',
      ice: '빙결',
      lightning: '번개',
      poison: '독',
      holy: '신성',
      dark: '암흑'
    };
    return names[type];
  },

  /**
   * 시간 포맷팅
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분 ${seconds % 60}초`;
    }
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  }
};
