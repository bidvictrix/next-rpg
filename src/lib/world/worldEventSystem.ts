import { Player } from '@/types/game';
import { logger } from '../logger';
import { worldZoneSystem } from './worldZoneSystem';

// 월드 이벤트 타입
type WorldEventType = 
  | 'seasonal' | 'holiday' | 'server_wide' | 'competition' 
  | 'invasion' | 'boss_appearance' | 'treasure_hunt' | 'double_exp' 
  | 'festival' | 'maintenance' | 'special_quest';

// 이벤트 상태
type EventStatus = 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';

// 이벤트 참여 조건
interface LevelRequirement { min?: number; max?: number }
interface ClassRequirement { classes: string[] }
interface GuildRequirement { guildId: string }
interface AchievementRequirement { ids: string[] }
interface ItemRequirement { id: string; amount?: number }
interface QuestCompletionRequirement { questId: string }
interface LocationRequirement { zoneId: string }

type EventRequirement =
  | LevelRequirement
  | ClassRequirement
  | GuildRequirement
  | AchievementRequirement
  | ItemRequirement
  | QuestCompletionRequirement
  | LocationRequirement;

interface EventParticipationCondition {
  type: 'level' | 'class' | 'guild' | 'achievement' | 'item' | 'quest_completion' | 'location';
  requirement: EventRequirement;
  message: string;
}

// 월드 이벤트 정의
interface WorldEvent {
  id: string;
  name: string;
  description: string;
  type: WorldEventType;
  priority: EventPriority;
  status: EventStatus;
  
  // 시간 관련
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  duration: number; // 분 단위
  preparation: number; // 준비 시간 (분)
  
  // 참여 조건
  participationConditions: EventParticipationCondition[];
  maxParticipants?: number;
  minParticipants?: number;
  
  // 지역 관련
  affectedZones: string[]; // 영향받는 지역들
  exclusiveZones?: string[]; // 이벤트 전용 지역들
  
  // 보상 및 목표
  objectives: EventObjective[];
  rewards: EventReward[];
  progressTracking: EventProgress;
  
  // 설정
  configuration: EventConfiguration;
  announcement: EventAnnouncement;
  
  // 메타데이터
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  version: number;
  tags: string[];
}

// 이벤트 우선순위
type EventPriority = 'low' | 'normal' | 'high' | 'critical';

// 이벤트 목표
interface EventObjective {
  id: string;
  title: string;
  description: string;
  type: 'kill_monsters' | 'collect_items' | 'reach_location' | 'survive_time' | 'score_points' | 'team_objective';
  target: Record<string, unknown>; // 목표 데이터
  current: number;
  required: number;
  isCompleted: boolean;
  participants: string[]; // 기여한 플레이어들
  isGlobal: boolean; // 전체 플레이어 목표 vs 개인 목표
  rewards?: EventReward[];
}

// 이벤트 보상
interface EventReward {
  id: string;
  type: 'experience' | 'gold' | 'item' | 'title' | 'achievement' | 'currency' | 'skill_points';
  value: number;
  itemId?: string;
  titleId?: string;
  achievementId?: string;
  currencyId?: string;
  conditions?: string[]; // 보상 조건
  tier?: 'participation' | 'bronze' | 'silver' | 'gold' | 'platinum'; // 등급별 보상
}

// 이벤트 진행도
interface EventProgress {
  globalProgress: Record<string, number>; // 전체 진행도
  playerProgress: Map<string, Record<string, number>>; // 플레이어별 진행도
  leaderboard: EventLeaderboard[];
  milestones: EventMilestone[];
  statistics: EventStatistics;
}

// 이벤트 순위표
interface EventLeaderboard {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  achievements: string[];
  lastUpdate: Date;
}

// 이벤트 마일스톤
interface EventMilestone {
  id: string;
  name: string;
  description: string;
  threshold: number;
  isAchieved: boolean;
  achievedAt?: Date;
  rewards: EventReward[];
  globalEffect?: string; // 전체 서버에 미치는 효과
}

// 이벤트 통계
interface EventStatistics {
  totalParticipants: number;
  activeParticipants: number;
  completionRate: number;
  averageScore: number;
  peakParticipants: number;
  totalRewardsGiven: number;
  popularZones: Record<string, number>;
  hourlyActivity: Record<string, number>;
}

// 이벤트 설정
interface EventConfiguration {
  allowLateJoin: boolean;
  allowEarlyLeave: boolean;
  respawnEnabled: boolean;
  pvpEnabled: boolean;
  guildBonuses: boolean;
  partyBonuses: boolean;
  scalingDifficulty: boolean;
  weatherEffects: boolean;
  specialRules: EventRule[];
  buffEffects: EventBuff[];
  debuffEffects: EventBuff[];
}

// 이벤트 규칙
interface EventRule {
  id: string;
  description: string;
  condition: string;
  effect: string;
  isActive: boolean;
}

// 이벤트 버프/디버프
interface EventBuff {
  id: string;
  name: string;
  description: string;
  type: 'buff' | 'debuff';
  stat: string;
  value: number;
  duration?: number; // 초 단위, undefined면 영구
  stackable: boolean;
  condition?: string;
}

// 이벤트 공지
interface EventAnnouncement {
  preparation: string; // 준비 공지
  start: string; // 시작 공지
  progress: string[]; // 진행 중 공지들
  end: string; // 종료 공지
  channels: AnnouncementChannel[];
}

// 공지 채널
type AnnouncementChannel = 'global' | 'zone' | 'guild' | 'party' | 'system' | 'email';

// 이벤트 참가자
interface EventParticipant {
  playerId: string;
  playerName: string;
  joinedAt: Date;
  lastActivity: Date;
  score: number;
  objectives: Record<string, number>; // 목표별 진행도
  rewards: EventReward[]; // 받은 보상들
  achievements: string[];
  status: ParticipantStatus;
  contributions: EventContribution[];
}

// 참가자 상태
type ParticipantStatus = 'active' | 'inactive' | 'completed' | 'disqualified';

// 이벤트 기여도
interface EventContribution {
  type: string;
  value: number;
  timestamp: Date;
  description: string;
}

// 이벤트 알림
interface EventNotification {
  id: string;
  eventId: string;
  type: 'reminder' | 'start' | 'milestone' | 'end' | 'reward';
  title: string;
  message: string;
  recipients: string[]; // 플레이어 ID들
  scheduledTime: Date;
  sentAt?: Date;
  channels: AnnouncementChannel[];
}

export class WorldEventSystem {
  private events: Map<string, WorldEvent> = new Map();
  private activeEvents: Map<string, WorldEvent> = new Map();
  private participants: Map<string, Map<string, EventParticipant>> = new Map(); // eventId -> participants
  private notifications: Map<string, EventNotification> = new Map();
  private eventHistory: WorldEvent[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    this.initializeDefaultEvents();
    this.startEventManagement();
  }

  /**
   * 기본 이벤트들 초기화
   */
  private initializeDefaultEvents(): void {
    const defaultEvents: WorldEvent[] = [
      {
        id: 'double_exp_weekend',
        name: '더블 경험치 주말',
        description: '주말 동안 모든 경험치를 2배로 획득할 수 있습니다!',
        type: 'double_exp',
        priority: 'normal',
        status: 'scheduled',
        scheduledStart: this.getNextWeekend(),
        scheduledEnd: this.getNextWeekendEnd(),
        duration: 48 * 60, // 48시간
        preparation: 30, // 30분 전 알림
        participationConditions: [
          {
            type: 'level',
            requirement: { min: 1 },
            message: '모든 레벨에서 참여 가능합니다.'
          }
        ],
        affectedZones: [], // 모든 지역
        objectives: [
          {
            id: 'gain_exp',
            title: '경험치 획득',
            description: '이벤트 기간 중 경험치를 획득하세요',
            type: 'score_points',
            target: { type: 'experience' },
            current: 0,
            required: 1000000, // 전체 목표
            isCompleted: false,
            participants: [],
            isGlobal: true
          }
        ],
        rewards: [
          {
            id: 'participation_reward',
            type: 'title',
            value: 1,
            titleId: 'weekend_warrior',
            tier: 'participation'
          }
        ],
        progressTracking: {
          globalProgress: {},
          playerProgress: new Map(),
          leaderboard: [],
          milestones: [
            {
              id: 'milestone_1',
              name: '경험치 마일스톤 1',
              description: '전체 경험치 50만 달성',
              threshold: 500000,
              isAchieved: false,
              rewards: [
                {
                  id: 'milestone_1_reward',
                  type: 'experience',
                  value: 1000,
                  tier: 'participation'
                }
              ],
              globalEffect: '모든 플레이어에게 축복 버프 적용'
            }
          ],
          statistics: {
            totalParticipants: 0,
            activeParticipants: 0,
            completionRate: 0,
            averageScore: 0,
            peakParticipants: 0,
            totalRewardsGiven: 0,
            popularZones: {},
            hourlyActivity: {}
          }
        },
        configuration: {
          allowLateJoin: true,
          allowEarlyLeave: true,
          respawnEnabled: true,
          pvpEnabled: false,
          guildBonuses: true,
          partyBonuses: true,
          scalingDifficulty: false,
          weatherEffects: false,
          specialRules: [],
          buffEffects: [
            {
              id: 'double_exp_buff',
              name: '더블 경험치',
              description: '경험치 획득량이 2배가 됩니다',
              type: 'buff',
              stat: 'experience_rate',
              value: 200,
              stackable: false
            }
          ],
          debuffEffects: []
        },
        announcement: {
          preparation: '잠시 후 더블 경험치 이벤트가 시작됩니다!',
          start: '더블 경험치 이벤트가 시작되었습니다! 주말을 즐기세요!',
          progress: [
            '더블 경험치 이벤트 진행 중입니다. 레벨업하기 좋은 기회입니다!',
            '이벤트 마일스톤에 도달했습니다! 모든 플레이어에게 추가 혜택이 주어집니다!'
          ],
          end: '더블 경험치 이벤트가 종료되었습니다. 참여해주셔서 감사합니다!',
          channels: ['global', 'system']
        },
        createdBy: 'system',
        createdAt: new Date(),
        lastModified: new Date(),
        version: 1,
        tags: ['weekend', 'experience', 'global']
      },
      {
        id: 'monster_invasion',
        name: '몬스터 침공',
        description: '강력한 몬스터들이 각 지역을 침공합니다. 함께 맞서 싸우세요!',
        type: 'invasion',
        priority: 'high',
        status: 'scheduled',
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
        scheduledEnd: new Date(Date.now() + 26 * 60 * 60 * 1000), // 26시간 후
        duration: 120, // 2시간
        preparation: 60, // 1시간 전 알림
        participationConditions: [
          {
            type: 'level',
            requirement: { min: 20 },
            message: '레벨 20 이상만 참여할 수 있습니다.'
          }
        ],
        affectedZones: ['training_field', 'forest_zone', 'mountain_zone'],
        objectives: [
          {
            id: 'defeat_invaders',
            title: '침공 몬스터 처치',
            description: '침공한 몬스터들을 처치하세요',
            type: 'kill_monsters',
            target: { monsterTypes: ['invasion_orc', 'invasion_goblin', 'invasion_boss'] },
            current: 0,
            required: 1000,
            isCompleted: false,
            participants: [],
            isGlobal: true
          },
          {
            id: 'defend_zones',
            title: '지역 방어',
            description: '모든 지역을 성공적으로 방어하세요',
            type: 'team_objective',
            target: { zones: ['training_field', 'forest_zone', 'mountain_zone'] },
            current: 0,
            required: 3,
            isCompleted: false,
            participants: [],
            isGlobal: true
          }
        ],
        rewards: [
          {
            id: 'invasion_participation',
            type: 'experience',
            value: 5000,
            tier: 'participation'
          },
          {
            id: 'invasion_silver',
            type: 'item',
            value: 1,
            itemId: 'invasion_medal_silver',
            tier: 'silver'
          },
          {
            id: 'invasion_gold',
            type: 'item',
            value: 1,
            itemId: 'invasion_medal_gold',
            tier: 'gold'
          }
        ],
        progressTracking: {
          globalProgress: {},
          playerProgress: new Map(),
          leaderboard: [],
          milestones: [
            {
              id: 'invasion_milestone_1',
              name: '첫 번째 방어선',
              description: '침공 몬스터 100마리 처치',
              threshold: 100,
              isAchieved: false,
              rewards: [
                {
                  id: 'defense_bonus',
                  type: 'gold',
                  value: 1000,
                  tier: 'participation'
                }
              ]
            }
          ],
          statistics: {
            totalParticipants: 0,
            activeParticipants: 0,
            completionRate: 0,
            averageScore: 0,
            peakParticipants: 0,
            totalRewardsGiven: 0,
            popularZones: {},
            hourlyActivity: {}
          }
        },
        configuration: {
          allowLateJoin: true,
          allowEarlyLeave: false,
          respawnEnabled: true,
          pvpEnabled: false,
          guildBonuses: true,
          partyBonuses: true,
          scalingDifficulty: true,
          weatherEffects: true,
          specialRules: [
            {
              id: 'invasion_rule_1',
              description: '침공 몬스터는 일반 몬스터보다 강합니다',
              condition: 'monster_type == invasion',
              effect: 'stats_multiplier * 1.5',
              isActive: true
            }
          ],
          buffEffects: [
            {
              id: 'battle_spirit',
              name: '전투 의지',
              description: '공격력이 증가합니다',
              type: 'buff',
              stat: 'attack_power',
              value: 120,
              duration: 7200, // 2시간
              stackable: false
            }
          ],
          debuffEffects: []
        },
        announcement: {
          preparation: '몬스터 침공이 임박했습니다! 전투 준비를 하세요!',
          start: '몬스터 침공이 시작되었습니다! 모든 용사들이 필요합니다!',
          progress: [
            '침공이 계속되고 있습니다. 함께 싸웁시다!',
            '방어에 성공하고 있습니다! 계속 노력하세요!'
          ],
          end: '몬스터 침공을 성공적으로 막아냈습니다! 모든 용사들에게 감사드립니다!',
          channels: ['global', 'zone', 'guild']
        },
        createdBy: 'system',
        createdAt: new Date(),
        lastModified: new Date(),
        version: 1,
        tags: ['invasion', 'combat', 'cooperative']
      }
    ];

    defaultEvents.forEach(event => {
      this.events.set(event.id, event);
    });
  }

  /**
   * 이벤트 생성
   */
  async createEvent(eventData: Omit<WorldEvent, 'createdAt' | 'lastModified' | 'version'>): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (this.events.has(eventData.id)) {
      return { success: false, error: '이미 존재하는 이벤트 ID입니다.' };
    }

    // 시간 유효성 검사
    if (eventData.scheduledStart >= eventData.scheduledEnd) {
      return { success: false, error: '시작 시간이 종료 시간보다 늦을 수 없습니다.' };
    }

    const event: WorldEvent = {
      ...eventData,
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1
    };

    this.events.set(event.id, event);
    this.participants.set(event.id, new Map());

    // 알림 스케줄링
    await this.scheduleEventNotifications(event);

    logger.info(`월드 이벤트 생성: ${event.name} (${event.id})`);

    return { success: true, eventId: event.id };
  }

  /**
   * 이벤트 참가
   */
  async joinEvent(eventId: string, playerId: string): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: '존재하지 않는 이벤트입니다.' };
    }

    if (event.status !== 'scheduled' && event.status !== 'active') {
      return { success: false, error: '참가할 수 없는 이벤트 상태입니다.' };
    }

    if (event.status === 'active' && !event.configuration.allowLateJoin) {
      return { success: false, error: '이미 시작된 이벤트에는 참가할 수 없습니다.' };
    }

    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 참가 조건 확인
    const conditionCheck = this.checkParticipationConditions(event, player);
    if (!conditionCheck.allowed) {
      return { success: false, error: conditionCheck.reason };
    }

    const eventParticipants = this.participants.get(eventId)!;
    
    // 이미 참가했는지 확인
    if (eventParticipants.has(playerId)) {
      return { success: false, error: '이미 참가한 이벤트입니다.' };
    }

    // 최대 참가자 수 확인
    if (event.maxParticipants && eventParticipants.size >= event.maxParticipants) {
      return { success: false, error: '이벤트 참가자가 가득 찼습니다.' };
    }

    const participant: EventParticipant = {
      playerId,
      playerName: player.name,
      joinedAt: new Date(),
      lastActivity: new Date(),
      score: 0,
      objectives: {},
      rewards: [],
      achievements: [],
      status: 'active',
      contributions: []
    };

    eventParticipants.set(playerId, participant);
    event.progressTracking.statistics.totalParticipants++;

    // 이벤트가 활성 상태면 즉시 효과 적용
    if (event.status === 'active') {
      await this.applyEventEffects(event, playerId);
    }

    logger.info(`이벤트 참가: ${player.name} → ${event.name}`);

    return { success: true };
  }

  /**
   * 이벤트 시작
   */
  async startEvent(eventId: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: '존재하지 않는 이벤트입니다.' };
    }

    if (event.status !== 'scheduled' && !force) {
      return { success: false, error: '시작할 수 없는 이벤트 상태입니다.' };
    }

    const eventParticipants = this.participants.get(eventId)!;
    
    // 최소 참가자 수 확인
    if (event.minParticipants && eventParticipants.size < event.minParticipants) {
      return { success: false, error: `최소 참가자 ${event.minParticipants}명이 필요합니다.` };
    }

    event.status = 'active';
    event.actualStart = new Date();
    event.lastModified = new Date();
    
    this.activeEvents.set(eventId, event);

    // 모든 참가자에게 이벤트 효과 적용
    for (const playerId of eventParticipants.keys()) {
      await this.applyEventEffects(event, playerId);
    }

    // 영향받는 지역에 이벤트 적용
    for (const zoneId of event.affectedZones) {
      await this.applyZoneEventEffects(event, zoneId);
    }

    // 시작 공지
    await this.announceToParticipants(event, event.announcement.start, event.announcement.channels);

    // 이벤트 종료 타이머 설정
    setTimeout(() => {
      this.endEvent(eventId);
    }, event.duration * 60 * 1000);

    logger.info(`월드 이벤트 시작: ${event.name}`);

    return { success: true };
  }

  /**
   * 이벤트 종료
   */
  async endEvent(eventId: string, force: boolean = false): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: '존재하지 않는 이벤트입니다.' };
    }

    if (event.status !== 'active' && !force) {
      return { success: false, error: '종료할 수 없는 이벤트 상태입니다.' };
    }

    event.status = 'completed';
    event.actualEnd = new Date();
    event.lastModified = new Date();

    this.activeEvents.delete(eventId);

    // 최종 보상 지급
    await this.distributeEventRewards(event);

    // 이벤트 효과 제거
    const eventParticipants = this.participants.get(eventId)!;
    for (const playerId of eventParticipants.keys()) {
      await this.removeEventEffects(event, playerId);
    }

    // 영향받는 지역에서 이벤트 효과 제거
    for (const zoneId of event.affectedZones) {
      await this.removeZoneEventEffects(event, zoneId);
    }

    // 종료 공지
    await this.announceToParticipants(event, event.announcement.end, event.announcement.channels);

    // 통계 최종 계산
    this.calculateFinalStatistics(event);

    // 히스토리에 추가
    this.addToHistory(event);

    logger.info(`월드 이벤트 종료: ${event.name}`);

    return { success: true };
  }

  /**
   * 이벤트 진행도 업데이트
   */
  async updateEventProgress(
    eventId: string,
    playerId: string,
    objectiveId: string,
    progress: number
  ): Promise<{ success: boolean; error?: string }> {
    
    const event = this.events.get(eventId);
    if (!event || event.status !== 'active') {
      return { success: false, error: '활성 상태가 아닌 이벤트입니다.' };
    }

    const eventParticipants = this.participants.get(eventId)!;
    const participant = eventParticipants.get(playerId);
    if (!participant) {
      return { success: false, error: '이벤트 참가자가 아닙니다.' };
    }

    const objective = event.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      return { success: false, error: '존재하지 않는 목표입니다.' };
    }

    // 개인 진행도 업데이트
    const currentProgress = participant.objectives[objectiveId] || 0;
    participant.objectives[objectiveId] = currentProgress + progress;
    participant.score += progress;
    participant.lastActivity = new Date();

    // 기여도 기록
    participant.contributions.push({
      type: objectiveId,
      value: progress,
      timestamp: new Date(),
      description: objective.title
    });

    // 전체 진행도 업데이트 (글로벌 목표인 경우)
    if (objective.isGlobal) {
      objective.current += progress;
      
      // 목표 달성 확인
      if (objective.current >= objective.required && !objective.isCompleted) {
        objective.isCompleted = true;
        await this.handleObjectiveCompletion(event, objective);
      }
    }

    // 리더보드 업데이트
    this.updateLeaderboard(event, participant);

    // 마일스톤 확인
    await this.checkMilestones(event);

    return { success: true };
  }

  /**
   * 이벤트 일시정지
   */
  async pauseEvent(eventId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event || event.status !== 'active') {
      return { success: false, error: '일시정지할 수 없는 이벤트 상태입니다.' };
    }

    event.status = 'paused';
    event.lastModified = new Date();

    // 참가자들에게 알림
    await this.announceToParticipants(event, 
      `이벤트가 일시정지되었습니다.${reason ? ` (사유: ${reason})` : ''}`,
      ['global', 'system']
    );

    logger.info(`월드 이벤트 일시정지: ${event.name}${reason ? ` (${reason})` : ''}`);

    return { success: true };
  }

  /**
   * 이벤트 재개
   */
  async resumeEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event || event.status !== 'paused') {
      return { success: false, error: '재개할 수 없는 이벤트 상태입니다.' };
    }

    event.status = 'active';
    event.lastModified = new Date();

    this.activeEvents.set(eventId, event);

    // 참가자들에게 알림
    await this.announceToParticipants(event, '이벤트가 재개되었습니다!', ['global', 'system']);

    logger.info(`월드 이벤트 재개: ${event.name}`);

    return { success: true };
  }

  // 헬퍼 함수들
  private checkParticipationConditions(event: WorldEvent, player: Player): { allowed: boolean; reason?: string } {
    for (const condition of event.participationConditions) {
      switch (condition.type) {
        case 'level':
          const levelReq = condition.requirement as LevelRequirement;
          if (levelReq.min && player.level < levelReq.min) {
            return { allowed: false, reason: condition.message };
          }
          if (levelReq.max && player.level > levelReq.max) {
            return { allowed: false, reason: condition.message };
          }
          break;
        case 'class':
          const allowedClasses = (condition.requirement as ClassRequirement).classes || [];
          if (allowedClasses.length > 0 && !allowedClasses.includes(player.class)) {
            return { allowed: false, reason: condition.message };
          }
          break;
        // 추가 조건들...
      }
    }
    return { allowed: true };
  }

  private async applyEventEffects(event: WorldEvent, playerId: string): Promise<void> {
    // 이벤트 버프 적용
    for (const buff of event.configuration.buffEffects) {
      // 실제로는 플레이어에게 버프 적용
      logger.debug(`이벤트 버프 적용: ${buff.name} to ${playerId}`);
    }

    // 이벤트 디버프 적용
    for (const debuff of event.configuration.debuffEffects) {
      // 실제로는 플레이어에게 디버프 적용
      logger.debug(`이벤트 디버프 적용: ${debuff.name} to ${playerId}`);
    }
  }

  private async removeEventEffects(event: WorldEvent, playerId: string): Promise<void> {
    // 이벤트 효과 제거
    logger.debug(`이벤트 효과 제거: ${playerId} from ${event.name}`);
  }

  private async applyZoneEventEffects(event: WorldEvent, zoneId: string): Promise<void> {
    // 지역에 이벤트 효과 적용
    logger.debug(`지역 이벤트 효과 적용: ${event.name} to ${zoneId}`);
  }

  private async removeZoneEventEffects(event: WorldEvent, zoneId: string): Promise<void> {
    // 지역에서 이벤트 효과 제거
    logger.debug(`지역 이벤트 효과 제거: ${event.name} from ${zoneId}`);
  }

  private async announceToParticipants(
    event: WorldEvent, 
    message: string, 
    channels: AnnouncementChannel[]
  ): Promise<void> {
    const eventParticipants = this.participants.get(event.id)!;
    
    for (const channel of channels) {
      switch (channel) {
        case 'global':
          // 전체 공지
          logger.info(`[전체 공지] ${message}`);
          break;
        case 'system':
          // 시스템 메시지
          eventParticipants.forEach((participant, playerId) => {
            logger.debug(`[시스템] ${participant.playerName}: ${message}`);
          });
          break;
        // 추가 채널들...
      }
    }
  }

  private updateLeaderboard(event: WorldEvent, participant: EventParticipant): void {
    const leaderboard = event.progressTracking.leaderboard;
    
    // 기존 엔트리 찾기
    let entry = leaderboard.find(entry => entry.playerId === participant.playerId);
    
    if (entry) {
      entry.score = participant.score;
      entry.lastUpdate = new Date();
    } else {
      entry = {
        rank: 0,
        playerId: participant.playerId,
        playerName: participant.playerName,
        score: participant.score,
        achievements: participant.achievements,
        lastUpdate: new Date()
      };
      leaderboard.push(entry);
    }

    // 점수순으로 정렬하고 순위 업데이트
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // 상위 100명만 유지
    if (leaderboard.length > 100) {
      event.progressTracking.leaderboard = leaderboard.slice(0, 100);
    }
  }

  private async checkMilestones(event: WorldEvent): Promise<void> {
    for (const milestone of event.progressTracking.milestones) {
      if (milestone.isAchieved) continue;

      // 목표별 진행도 확인
      let totalProgress = 0;
      for (const objective of event.objectives) {
        if (objective.isGlobal) {
          totalProgress += objective.current;
        }
      }

      if (totalProgress >= milestone.threshold) {
        milestone.isAchieved = true;
        milestone.achievedAt = new Date();

        // 마일스톤 보상 지급
        await this.distributeMilestoneRewards(event, milestone);

        // 마일스톤 달성 공지
        await this.announceToParticipants(event,
          `마일스톤 "${milestone.name}"에 도달했습니다! ${milestone.description}`,
          ['global', 'system']
        );

        // 전체 효과 적용
        if (milestone.globalEffect) {
          await this.applyGlobalEffect(event, milestone.globalEffect);
        }
      }
    }
  }

  private async handleObjectiveCompletion(event: WorldEvent, objective: EventObjective): Promise<void> {
    // 목표 완료 처리
    logger.info(`이벤트 목표 완료: ${objective.title} in ${event.name}`);

    // 목표별 보상이 있으면 지급
    if (objective.rewards) {
      const eventParticipants = this.participants.get(event.id)!;
      for (const playerId of objective.participants) {
        const participant = eventParticipants.get(playerId);
        if (participant) {
          participant.rewards.push(...objective.rewards);
        }
      }
    }

    // 목표 완료 공지
    await this.announceToParticipants(event,
      `목표 "${objective.title}"이(가) 완료되었습니다!`,
      ['global', 'system']
    );
  }

  private async distributeEventRewards(event: WorldEvent): Promise<void> {
    const eventParticipants = this.participants.get(event.id)!;
    
    eventParticipants.forEach(async (participant, playerId) => {
      // 참여 보상
      const participationRewards = event.rewards.filter(r => r.tier === 'participation');
      participant.rewards.push(...participationRewards);

      // 성과별 보상
      const rank = event.progressTracking.leaderboard.find(entry => entry.playerId === playerId)?.rank || 0;
      
      if (rank === 1) {
        const goldRewards = event.rewards.filter(r => r.tier === 'gold');
        participant.rewards.push(...goldRewards);
      } else if (rank <= 3) {
        const silverRewards = event.rewards.filter(r => r.tier === 'silver');
        participant.rewards.push(...silverRewards);
      } else if (rank <= 10) {
        const bronzeRewards = event.rewards.filter(r => r.tier === 'bronze');
        participant.rewards.push(...bronzeRewards);
      }

      // 실제 보상 지급 (실제로는 플레이어 시스템과 연동)
      await this.giveRewardsToPlayer(playerId, participant.rewards);
      
      event.progressTracking.statistics.totalRewardsGiven += participant.rewards.length;
    });
  }

  private async distributeMilestoneRewards(event: WorldEvent, milestone: EventMilestone): Promise<void> {
    const eventParticipants = this.participants.get(event.id)!;
    
    eventParticipants.forEach(async (participant, playerId) => {
      participant.rewards.push(...milestone.rewards);
      await this.giveRewardsToPlayer(playerId, milestone.rewards);
    });
  }

  private async applyGlobalEffect(event: WorldEvent, effect: string): Promise<void> {
    // 전체 서버에 영향을 주는 효과 적용
    logger.info(`전체 효과 적용: ${effect} in ${event.name}`);
  }

  private calculateFinalStatistics(event: WorldEvent): void {
    const stats = event.progressTracking.statistics;
    const eventParticipants = this.participants.get(event.id)!;
    
    stats.activeParticipants = eventParticipants.size;
    
    if (stats.totalParticipants > 0) {
      stats.completionRate = (eventParticipants.size / stats.totalParticipants) * 100;
    }

    const totalScore = Array.from(eventParticipants.values())
      .reduce((sum, participant) => sum + participant.score, 0);
    
    if (eventParticipants.size > 0) {
      stats.averageScore = totalScore / eventParticipants.size;
    }
  }

  private addToHistory(event: WorldEvent): void {
    this.eventHistory.unshift({ ...event });
    
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }

  private async scheduleEventNotifications(event: WorldEvent): Promise<void> {
    // 준비 알림
    const preparationTime = new Date(event.scheduledStart.getTime() - event.preparation * 60 * 1000);
    
    const preparationNotification: EventNotification = {
      id: `${event.id}_preparation`,
      eventId: event.id,
      type: 'reminder',
      title: `${event.name} 준비 알림`,
      message: event.announcement.preparation,
      recipients: [], // 실제로는 참가자 목록
      scheduledTime: preparationTime,
      channels: event.announcement.channels
    };

    this.notifications.set(preparationNotification.id, preparationNotification);

    // 시작 알림
    const startNotification: EventNotification = {
      id: `${event.id}_start`,
      eventId: event.id,
      type: 'start',
      title: `${event.name} 시작`,
      message: event.announcement.start,
      recipients: [],
      scheduledTime: event.scheduledStart,
      channels: event.announcement.channels
    };

    this.notifications.set(startNotification.id, startNotification);
  }

  private startEventManagement(): void {
    // 이벤트 스케줄 확인
    setInterval(() => {
      this.checkScheduledEvents();
    }, 60000); // 1분마다

    // 알림 처리
    setInterval(() => {
      this.processNotifications();
    }, 30000); // 30초마다

    // 활성 이벤트 관리
    setInterval(() => {
      this.manageActiveEvents();
    }, 5 * 60000); // 5분마다
  }

  private checkScheduledEvents(): void {
    const now = new Date();
    
    this.events.forEach(async (event, eventId) => {
      if (event.status === 'scheduled' && now >= event.scheduledStart) {
        await this.startEvent(eventId);
      }
    });
  }

  private processNotifications(): void {
    const now = new Date();
    
    this.notifications.forEach(async (notification, notificationId) => {
      if (!notification.sentAt && now >= notification.scheduledTime) {
        await this.sendNotification(notification);
        notification.sentAt = now;
      }
    });
  }

  private manageActiveEvents(): void {
    const now = new Date();
    
    this.activeEvents.forEach(async (event, eventId) => {
      // 자동 종료 시간 확인
      if (event.actualStart) {
        const elapsed = now.getTime() - event.actualStart.getTime();
        const duration = event.duration * 60 * 1000;
        
        if (elapsed >= duration) {
          await this.endEvent(eventId);
        }
      }

      // 통계 업데이트
      this.updateEventStatistics(event);
    });
  }

  private updateEventStatistics(event: WorldEvent): void {
    const eventParticipants = this.participants.get(event.id)!;
    const stats = event.progressTracking.statistics;
    
    const activeCount = Array.from(eventParticipants.values())
      .filter(p => p.status === 'active').length;
    
    stats.activeParticipants = activeCount;
    stats.peakParticipants = Math.max(stats.peakParticipants, activeCount);
    
    // 시간별 활동 통계
    const hour = new Date().getHours().toString();
    stats.hourlyActivity[hour] = (stats.hourlyActivity[hour] || 0) + activeCount;
  }

  private async sendNotification(notification: EventNotification): Promise<void> {
    logger.info(`이벤트 알림 전송: ${notification.title} - ${notification.message}`);
  }

  private getNextWeekend(): Date {
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);
    return saturday;
  }

  private getNextWeekendEnd(): Date {
    const weekend = this.getNextWeekend();
    const sunday = new Date(weekend);
    sunday.setDate(weekend.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
  }

  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현 필요
    return null;
  }

  private async giveRewardsToPlayer(playerId: string, rewards: EventReward[]): Promise<void> {
    // 실제 구현 필요
    logger.debug(`보상 지급: ${playerId} - ${rewards.length}개 보상`);
  }

  /**
   * 공개 API 메서드들
   */
  getEvent(eventId: string): WorldEvent | null {
    return this.events.get(eventId) || null;
  }

  getActiveEvents(): WorldEvent[] {
    return Array.from(this.activeEvents.values());
  }

  getScheduledEvents(): WorldEvent[] {
    return Array.from(this.events.values())
      .filter(event => event.status === 'scheduled')
      .sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());
  }

  getEventHistory(limit: number = 20): WorldEvent[] {
    return this.eventHistory.slice(0, limit);
  }

  getEventParticipants(eventId: string): EventParticipant[] {
    const eventParticipants = this.participants.get(eventId);
    return eventParticipants ? Array.from(eventParticipants.values()) : [];
  }

  getPlayerEventHistory(playerId: string): Array<{ event: WorldEvent; participant: EventParticipant }> {
    const history: Array<{ event: WorldEvent; participant: EventParticipant }> = [];
    
    this.participants.forEach((eventParticipants, eventId) => {
      const participant = eventParticipants.get(playerId);
      if (participant) {
        const event = this.events.get(eventId);
        if (event) {
          history.push({ event, participant });
        }
      }
    });

    return history.sort((a, b) => b.event.createdAt.getTime() - a.event.createdAt.getTime());
  }

  getSystemStats(): {
    totalEvents: number;
    activeEvents: number;
    scheduledEvents: number;
    totalParticipants: number;
    averageParticipants: number;
  } {
    const totalEvents = this.events.size;
    const activeEvents = this.activeEvents.size;
    const scheduledEvents = Array.from(this.events.values())
      .filter(e => e.status === 'scheduled').length;
    
    let totalParticipants = 0;
    this.participants.forEach(eventParticipants => {
      totalParticipants += eventParticipants.size;
    });

    const averageParticipants = totalEvents > 0 ? totalParticipants / totalEvents : 0;

    return {
      totalEvents,
      activeEvents,
      scheduledEvents,
      totalParticipants,
      averageParticipants
    };
  }

  // 관리자 기능들
  async forceStartEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    return await this.startEvent(eventId, true);
  }

  async forceEndEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    return await this.endEvent(eventId, true);
  }

  async updateEvent(eventId: string, updates: Partial<WorldEvent>): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: '존재하지 않는 이벤트입니다.' };
    }

    Object.assign(event, updates);
    event.lastModified = new Date();
    event.version++;

    logger.info(`이벤트 업데이트: ${event.name}`);

    return { success: true };
  }

  async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: '존재하지 않는 이벤트입니다.' };
    }

    if (event.status === 'active') {
      await this.endEvent(eventId, true);
    }

    this.events.delete(eventId);
    this.participants.delete(eventId);
    this.activeEvents.delete(eventId);

    logger.info(`이벤트 삭제: ${event.name}`);

    return { success: true };
  }
}

// 전역 월드 이벤트 시스템 인스턴스
export const worldEventSystem = new WorldEventSystem();

// 월드 이벤트 관련 유틸리티
export const worldEventUtils = {
  /**
   * 이벤트 타입 표시명
   */
  getEventTypeDisplayName(type: WorldEventType): string {
    const names = {
      seasonal: '시즌 이벤트',
      holiday: '홀리데이 이벤트',
      server_wide: '서버 이벤트',
      competition: '경쟁 이벤트',
      invasion: '침공 이벤트',
      boss_appearance: '보스 출현',
      treasure_hunt: '보물 찾기',
      double_exp: '더블 경험치',
      festival: '축제',
      maintenance: '점검',
      special_quest: '특별 퀘스트'
    };
    return names[type];
  },

  /**
   * 이벤트 상태 표시명
   */
  getEventStatusDisplayName(status: EventStatus): string {
    const names = {
      scheduled: '예정',
      active: '진행 중',
      paused: '일시정지',
      completed: '완료',
      cancelled: '취소',
      failed: '실패'
    };
    return names[status];
  },

  /**
   * 이벤트 우선순위 색상
   */
  getPriorityColor(priority: EventPriority): string {
    const colors = {
      low: '#808080',
      normal: '#0066cc',
      high: '#ff6600',
      critical: '#cc0000'
    };
    return colors[priority];
  },

  /**
   * 남은 시간 포맷팅
   */
  formatTimeRemaining(endTime: Date): string {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return '종료됨';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  },

  /**
   * 보상 타입 표시명
   */
  getRewardTypeDisplayName(type: string): string {
    const names = {
      experience: '경험치',
      gold: '골드',
      item: '아이템',
      title: '칭호',
      achievement: '업적',
      currency: '화폐',
      skill_points: '스킬 포인트'
    };
    return names[type] || type;
  }
};
