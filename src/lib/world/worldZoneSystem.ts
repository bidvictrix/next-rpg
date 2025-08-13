import { Player } from '@/types/game';
import { logger } from '../logger';

// 월드 좌표
interface WorldPosition {
  x: number;
  y: number;
  z?: number;
  direction?: number; // 바라보는 방향 (0-360도)
}

// 지역 정의
interface WorldZone {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: ZoneType;
  level: { min: number; max: number };
  capacity: number; // 최대 플레이어 수
  size: { width: number; height: number };
  spawnPoints: WorldPosition[];
  safeZones: SafeZone[];
  environment: ZoneEnvironment;
  resources: ZoneResource[];
  restrictions: ZoneRestriction[];
  events: ZoneEvent[];
  isActive: boolean;
  instanceType: InstanceType;
  parentZone?: string; // 상위 지역 (던전의 경우)
  subZones: string[]; // 하위 지역들
  connections: ZoneConnection[];
  weather: WeatherCondition;
  dayNightCycle: boolean;
  music?: string;
  backgroundImage?: string;
  miniMapImage?: string;
}

// 지역 타입
type ZoneType = 'town' | 'field' | 'dungeon' | 'raid' | 'pvp' | 'special' | 'guild_hall' | 'personal';

// 인스턴스 타입
type InstanceType = 'shared' | 'instanced' | 'guild_only' | 'party_only' | 'solo_only';

// 안전지대
interface SafeZone {
  id: string;
  name: string;
  area: { x: number; y: number; width: number; height: number };
  effects: string[]; // 'no_pvp', 'fast_heal', 'no_logout_penalty' 등
}

// 지역 환경
interface ZoneEnvironment {
  theme: string; // 'forest', 'desert', 'snow', 'volcano', 'underwater' 등
  lighting: 'bright' | 'normal' | 'dim' | 'dark';
  temperature: 'hot' | 'warm' | 'normal' | 'cold' | 'freezing';
  hazards: EnvironmentHazard[];
  buffs: EnvironmentBuff[];
  ambientSounds: string[];
}

// 환경 위험요소
interface EnvironmentHazard {
  type: 'poison' | 'fire' | 'cold' | 'radiation' | 'curse';
  damage: number;
  interval: number; // 초 단위
  areas: Array<{ x: number; y: number; radius: number }>;
  immunity?: string[]; // 면역 조건
}

// 환경 버프
interface EnvironmentBuff {
  type: 'exp_boost' | 'health_regen' | 'mana_regen' | 'speed_boost';
  value: number;
  areas: Array<{ x: number; y: number; radius: number }>;
  condition?: string; // 적용 조건
}

// 지역 리소스
interface ZoneResource {
  type: 'monster' | 'npc' | 'object' | 'gathering_node';
  id: string;
  position: WorldPosition;
  respawnTime: number; // 초 단위
  respawnVariance: number; // 리스폰 시간 편차 (%)
  level?: number;
  isActive: boolean;
  lastRespawn: Date;
  instanceData?: Record<string, unknown>;
}

// 지역 제한
interface ZoneRestriction {
  type: 'level' | 'class' | 'guild' | 'party' | 'item' | 'quest' | 'time';
  condition: string;
  message: string;
  isRequired: boolean;
}

// 지역 이벤트
interface ZoneEvent {
  id: string;
  name: string;
  type: 'spawn' | 'weather' | 'boss' | 'treasure' | 'quest';
  trigger: EventTrigger;
  effect: EventEffect;
  isActive: boolean;
  cooldown: number; // 초 단위
  lastTriggered?: Date;
}

// 이벤트 트리거
interface EventTrigger {
  type: 'time' | 'player_count' | 'monster_death' | 'item_use' | 'random';
  condition: Record<string, unknown>;
  chance?: number; // 확률 (%)
}

// 이벤트 효과
interface EventEffect {
  type: 'spawn_monster' | 'change_weather' | 'buff_players' | 'spawn_treasure';
  data: Record<string, unknown>;
  duration?: number; // 초 단위
}

// 지역 연결
interface ZoneConnection {
  targetZoneId: string;
  type: 'portal' | 'door' | 'teleport' | 'ladder' | 'natural';
  position: WorldPosition;
  targetPosition: WorldPosition;
  requirements?: ZoneRestriction[];
  cost?: { currencyId: string; amount: number };
  cooldown?: number;
  isActive: boolean;
}

// 날씨 조건
interface WeatherCondition {
  current: WeatherType;
  forecast: Array<{ weather: WeatherType; duration: number; startTime: Date }>;
  effects: WeatherEffect[];
}

// 날씨 타입
type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog' | 'sandstorm';

// 날씨 효과
interface WeatherEffect {
  weatherType: WeatherType;
  effects: {
    visibility?: number; // 시야 범위 (%)
    movement?: number; // 이동속도 (%)
    damage?: number; // 데미지 (%)
    experience?: number; // 경험치 (%)
  };
}

// 지역 인스턴스
interface ZoneInstance {
  id: string;
  zoneId: string;
  zoneName: string;
  channel: number;
  players: Map<string, PlayerInZone>;
  resources: Map<string, ZoneResource>;
  activeEvents: Map<string, ActiveZoneEvent>;
  createdAt: Date;
  lastActivity: Date;
  status: InstanceStatus;
  capacity: number;
  settings: InstanceSettings;
  chat: ZoneChatMessage[];
  statistics: ZoneStatistics;
}

// 인스턴스 상태
type InstanceStatus = 'active' | 'idle' | 'full' | 'closing' | 'maintenance';

// 지역의 플레이어
interface PlayerInZone {
  playerId: string;
  playerName: string;
  level: number;
  position: WorldPosition;
  joinedAt: Date;
  lastActivity: Date;
  status: PlayerZoneStatus;
  visibility: PlayerVisibility;
  partyId?: string;
  guildId?: string;
  isAfk: boolean;
  afkTime?: Date;
}

// 플레이어 지역 상태
type PlayerZoneStatus = 'active' | 'idle' | 'combat' | 'dead' | 'trading' | 'afk';

// 플레이어 가시성
type PlayerVisibility = 'visible' | 'hidden' | 'stealth' | 'ghost';

// 인스턴스 설정
interface InstanceSettings {
  maxIdleTime: number; // 비활성 해제 시간 (분)
  autoClose: boolean;
  pvpEnabled: boolean;
  chatEnabled: boolean;
  tradingEnabled: boolean;
  respawnEnabled: boolean;
  eventEnabled: boolean;
  weatherEnabled: boolean;
}

// 활성 지역 이벤트
interface ActiveZoneEvent {
  event: ZoneEvent;
  startedAt: Date;
  endsAt?: Date;
  participants: string[];
  data: Record<string, unknown>;
}

// 지역 채팅 메시지
interface ZoneChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  type: 'normal' | 'shout' | 'whisper' | 'system';
  timestamp: Date;
  position?: WorldPosition;
}

// 지역 통계
interface ZoneStatistics {
  totalPlayers: number;
  peakPlayers: number;
  averagePlayers: number;
  totalPlayTime: number;
  monstersKilled: number;
  itemsDropped: number;
  eventsTriggered: number;
  deathCount: number;
  lastReset: Date;
}

export class WorldZoneSystem {
  private zones: Map<string, WorldZone> = new Map();
  private instances: Map<string, ZoneInstance> = new Map();
  private playerLocations: Map<string, string> = new Map(); // playerId -> instanceId
  private channelSystem: Map<string, string[]> = new Map(); // zoneId -> instanceIds
  private maxChannelsPerZone: number = 10;
  private playerCapacityPerChannel: number = 100;
  private instanceCleanupInterval: number = 30 * 60 * 1000; // 30분

  constructor() {
    this.initializeDefaultZones();
    this.startMaintenanceTasks();
  }

  /**
   * 기본 지역들 초기화
   */
  private initializeDefaultZones(): void {
    const defaultZones: WorldZone[] = [
      {
        id: 'starter_town',
        name: 'starter_town',
        displayName: '시작 마을',
        description: '모험가들이 모이는 평화로운 시작 마을입니다.',
        type: 'town',
        level: { min: 1, max: 999 },
        capacity: 200,
        size: { width: 1000, height: 1000 },
        spawnPoints: [
          { x: 500, y: 500, direction: 0 }
        ],
        safeZones: [
          {
            id: 'town_center',
            name: '마을 중앙',
            area: { x: 400, y: 400, width: 200, height: 200 },
            effects: ['no_pvp', 'fast_heal']
          }
        ],
        environment: {
          theme: 'peaceful_town',
          lighting: 'bright',
          temperature: 'normal',
          hazards: [],
          buffs: [
            {
              type: 'health_regen',
              value: 5,
              areas: [{ x: 500, y: 500, radius: 300 }]
            }
          ],
          ambientSounds: ['birds', 'wind', 'people_chatter']
        },
        resources: [
          {
            type: 'npc',
            id: 'merchant_01',
            position: { x: 450, y: 500 },
            respawnTime: 0,
            respawnVariance: 0,
            isActive: true,
            lastRespawn: new Date()
          },
          {
            type: 'npc',
            id: 'quest_giver_01',
            position: { x: 550, y: 500 },
            respawnTime: 0,
            respawnVariance: 0,
            isActive: true,
            lastRespawn: new Date()
          }
        ],
        restrictions: [],
        events: [],
        isActive: true,
        instanceType: 'shared',
        subZones: [],
        connections: [
          {
            targetZoneId: 'training_field',
            type: 'natural',
            position: { x: 500, y: 100 },
            targetPosition: { x: 500, y: 900 },
            isActive: true
          }
        ],
        weather: {
          current: 'clear',
          forecast: [],
          effects: []
        },
        dayNightCycle: true,
        music: 'peaceful_town.mp3'
      },
      {
        id: 'training_field',
        name: 'training_field',
        displayName: '훈련장',
        description: '초보 모험가들을 위한 훈련 지역입니다.',
        type: 'field',
        level: { min: 1, max: 10 },
        capacity: 50,
        size: { width: 2000, height: 2000 },
        spawnPoints: [
          { x: 500, y: 900, direction: 0 }
        ],
        safeZones: [],
        environment: {
          theme: 'grassland',
          lighting: 'normal',
          temperature: 'normal',
          hazards: [],
          buffs: [
            {
              type: 'exp_boost',
              value: 10,
              areas: [{ x: 1000, y: 1000, radius: 1000 }],
              condition: 'level <= 10'
            }
          ],
          ambientSounds: ['wind', 'grass_rustle']
        },
        resources: [
          {
            type: 'monster',
            id: 'training_dummy',
            position: { x: 1000, y: 1000 },
            respawnTime: 60,
            respawnVariance: 20,
            level: 1,
            isActive: true,
            lastRespawn: new Date()
          },
          {
            type: 'gathering_node',
            id: 'herb_01',
            position: { x: 1200, y: 800 },
            respawnTime: 300,
            respawnVariance: 30,
            isActive: true,
            lastRespawn: new Date()
          }
        ],
        restrictions: [],
        events: [
          {
            id: 'beginner_bonus',
            name: '초보자 보너스',
            type: 'spawn',
            trigger: {
              type: 'player_count',
              condition: { min: 5 }
            },
            effect: {
              type: 'buff_players',
              data: { buff: 'exp_boost', value: 20, duration: 300 }
            },
            isActive: true,
            cooldown: 1800
          }
        ],
        isActive: true,
        instanceType: 'shared',
        subZones: [],
        connections: [
          {
            targetZoneId: 'starter_town',
            type: 'natural',
            position: { x: 500, y: 100 },
            targetPosition: { x: 500, y: 900 },
            isActive: true
          }
        ],
        weather: {
          current: 'clear',
          forecast: [],
          effects: [
            {
              weatherType: 'rain',
              effects: { experience: 5 }
            }
          ]
        },
        dayNightCycle: true,
        music: 'field_adventure.mp3'
      }
    ];

    defaultZones.forEach(zone => {
      this.zones.set(zone.id, zone);
      this.channelSystem.set(zone.id, []);
    });
  }

  /**
   * 플레이어 지역 입장
   */
  async enterZone(
    playerId: string,
    zoneId: string,
    targetPosition?: WorldPosition,
    preferredChannel?: number
  ): Promise<{ success: boolean; instanceId?: string; position?: WorldPosition; error?: string }> {
    
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return { success: false, error: '존재하지 않는 지역입니다.' };
    }

    if (!zone.isActive) {
      return { success: false, error: '현재 이용할 수 없는 지역입니다.' };
    }

    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 지역 입장 조건 확인
    const restrictionCheck = this.checkZoneRestrictions(zone, player);
    if (!restrictionCheck.allowed) {
      return { success: false, error: restrictionCheck.reason };
    }

    // 기존 지역에서 퇴장
    const currentInstanceId = this.playerLocations.get(playerId);
    if (currentInstanceId) {
      await this.leaveZone(playerId);
    }

    // 적절한 인스턴스 찾기 또는 생성
    const instance = await this.findOrCreateInstance(zoneId, preferredChannel);
    if (!instance) {
      return { success: false, error: '입장 가능한 채널이 없습니다.' };
    }

    // 스폰 위치 결정
    const spawnPosition = targetPosition || this.getSpawnPosition(zone, instance);

    // 플레이어를 인스턴스에 추가
    const playerInZone: PlayerInZone = {
      playerId,
      playerName: player.name,
      level: player.level,
      position: spawnPosition,
      joinedAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      visibility: 'visible',
      partyId: player.partyId || undefined,
      guildId: player.guildId || undefined,
      isAfk: false
    };

    instance.players.set(playerId, playerInZone);
    instance.lastActivity = new Date();
    instance.statistics.totalPlayers++;
    instance.statistics.peakPlayers = Math.max(instance.statistics.peakPlayers, instance.players.size);

    this.playerLocations.set(playerId, instance.id);

    // 다른 플레이어들에게 알림
    this.broadcastToZone(instance, {
      type: 'player_enter',
      playerId,
      playerName: player.name,
      position: spawnPosition
    }, playerId);

    // 환경 효과 적용
    await this.applyEnvironmentEffects(instance, playerId);

    logger.info(`플레이어 지역 입장: ${player.name} → ${zone.displayName} (${instance.id})`);

    return {
      success: true,
      instanceId: instance.id,
      position: spawnPosition
    };
  }

  /**
   * 플레이어 지역 퇴장
   */
  async leaveZone(playerId: string): Promise<{ success: boolean; error?: string }> {
    const instanceId = this.playerLocations.get(playerId);
    if (!instanceId) {
      return { success: false, error: '현재 지역에 있지 않습니다.' };
    }

    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: '인스턴스를 찾을 수 없습니다.' };
    }

    const playerInZone = instance.players.get(playerId);
    if (!playerInZone) {
      return { success: false, error: '지역에서 플레이어를 찾을 수 없습니다.' };
    }

    // 플레이어 제거
    instance.players.delete(playerId);
    this.playerLocations.delete(playerId);

    // 플레이 시간 통계 업데이트
    const playTime = Date.now() - playerInZone.joinedAt.getTime();
    instance.statistics.totalPlayTime += playTime;

    // 다른 플레이어들에게 알림
    this.broadcastToZone(instance, {
      type: 'player_leave',
      playerId,
      playerName: playerInZone.playerName
    });

    // 인스턴스가 비어있으면 정리 고려
    if (instance.players.size === 0) {
      instance.status = 'idle';
      instance.lastActivity = new Date();
    }

    logger.info(`플레이어 지역 퇴장: ${playerInZone.playerName} from ${instance.zoneName}`);

    return { success: true };
  }

  /**
   * 플레이어 위치 업데이트
   */
  async updatePlayerPosition(
    playerId: string,
    newPosition: WorldPosition
  ): Promise<{ success: boolean; error?: string }> {
    
    const instanceId = this.playerLocations.get(playerId);
    if (!instanceId) {
      return { success: false, error: '현재 지역에 있지 않습니다.' };
    }

    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: '인스턴스를 찾을 수 없습니다.' };
    }

    const playerInZone = instance.players.get(playerId);
    if (!playerInZone) {
      return { success: false, error: '플레이어를 찾을 수 없습니다.' };
    }

    const oldPosition = playerInZone.position;
    playerInZone.position = newPosition;
    playerInZone.lastActivity = new Date();
    playerInZone.isAfk = false;
    playerInZone.afkTime = undefined;

    // 지역 경계 확인
    const zone = this.zones.get(instance.zoneId);
    if (zone && !this.isPositionInZone(newPosition, zone)) {
      // 지역 밖으로 나간 경우 경계로 이동
      playerInZone.position = this.clampPositionToZone(newPosition, zone);
    }

    // 환경 효과 확인 및 적용
    await this.checkEnvironmentEffects(instance, playerId, newPosition);

    // 주변 플레이어들에게 위치 업데이트 브로드캐스트
    this.broadcastToNearbyPlayers(instance, playerId, {
      type: 'player_move',
      playerId,
      oldPosition,
      newPosition: playerInZone.position
    }, 500); // 500 유닛 반경

    return { success: true };
  }

  /**
   * 지역 채팅
   */
  async sendZoneMessage(
    playerId: string,
    content: string,
    type: 'normal' | 'shout' | 'whisper' = 'normal'
  ): Promise<{ success: boolean; error?: string }> {
    
    const instanceId = this.playerLocations.get(playerId);
    if (!instanceId) {
      return { success: false, error: '현재 지역에 있지 않습니다.' };
    }

    const instance = this.instances.get(instanceId);
    if (!instance || !instance.settings.chatEnabled) {
      return { success: false, error: '채팅을 사용할 수 없습니다.' };
    }

    const playerInZone = instance.players.get(playerId);
    if (!playerInZone) {
      return { success: false, error: '플레이어를 찾을 수 없습니다.' };
    }

    const message: ZoneChatMessage = {
      id: `zmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName: playerInZone.playerName,
      content,
      type,
      timestamp: new Date(),
      position: playerInZone.position
    };

    instance.chat.push(message);

    // 채팅 메시지 수 제한
    if (instance.chat.length > 100) {
      instance.chat = instance.chat.slice(-100);
    }

    // 타입에 따라 브로드캐스트 범위 결정
    let range = 0;
    switch (type) {
      case 'whisper':
        range = 100;
        break;
      case 'normal':
        range = 300;
        break;
      case 'shout':
        range = 1000;
        break;
    }

    this.broadcastToNearbyPlayers(instance, playerId, {
      type: 'zone_chat',
      message
    }, range);

    return { success: true };
  }

  /**
   * 지역 이벤트 트리거
   */
  async triggerZoneEvent(
    instanceId: string,
    eventId: string,
    triggerData?: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    
    const instance = this.instances.get(instanceId);
    if (!instance) {
      return { success: false, error: '인스턴스를 찾을 수 없습니다.' };
    }

    const zone = this.zones.get(instance.zoneId);
    if (!zone) {
      return { success: false, error: '지역 정보를 찾을 수 없습니다.' };
    }

    const event = zone.events.find(e => e.id === eventId);
    if (!event || !event.isActive) {
      return { success: false, error: '이벤트를 찾을 수 없거나 비활성 상태입니다.' };
    }

    // 쿨다운 확인
    if (event.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - event.lastTriggered.getTime();
      if (timeSinceLastTrigger < event.cooldown * 1000) {
        return { success: false, error: '이벤트가 쿨다운 중입니다.' };
      }
    }

    // 이벤트 실행
    const activeEvent: ActiveZoneEvent = {
      event,
      startedAt: new Date(),
      endsAt: event.effect.duration ? new Date(Date.now() + event.effect.duration * 1000) : undefined,
      participants: Array.from(instance.players.keys()),
      data: triggerData || {}
    };

    instance.activeEvents.set(eventId, activeEvent);
    event.lastTriggered = new Date();
    instance.statistics.eventsTriggered++;

    // 이벤트 효과 적용
    await this.applyEventEffect(instance, activeEvent);

    // 플레이어들에게 알림
    this.broadcastToZone(instance, {
      type: 'zone_event',
      event: {
        id: event.id,
        name: event.name,
        type: event.type,
        duration: event.effect.duration
      }
    });

    logger.info(`지역 이벤트 트리거: ${event.name} in ${zone.displayName}`);

    return { success: true };
  }

  // 헬퍼 함수들
  private async findOrCreateInstance(zoneId: string, preferredChannel?: number): Promise<ZoneInstance | null> {
    const channels = this.channelSystem.get(zoneId) || [];
    
    // 선호 채널이 있고 사용 가능하면 사용
    if (preferredChannel !== undefined) {
      const preferredInstanceId = `${zoneId}_ch${preferredChannel}`;
      let instance = this.instances.get(preferredInstanceId);
      
      if (instance && instance.players.size < instance.capacity) {
        return instance;
      }
    }

    // 기존 인스턴스 중 여유가 있는 것 찾기
    for (const instanceId of channels) {
      const instance = this.instances.get(instanceId);
      if (instance && instance.status === 'active' && instance.players.size < instance.capacity) {
        return instance;
      }
    }

    // 새 인스턴스 생성
    if (channels.length < this.maxChannelsPerZone) {
      return this.createNewInstance(zoneId, channels.length + 1);
    }

    return null; // 생성 불가
  }

  private createNewInstance(zoneId: string, channel: number): ZoneInstance {
    const zone = this.zones.get(zoneId)!;
    const instanceId = `${zoneId}_ch${channel}`;
    
    const instance: ZoneInstance = {
      id: instanceId,
      zoneId,
      zoneName: zone.displayName,
      channel,
      players: new Map(),
      resources: new Map(),
      activeEvents: new Map(),
      createdAt: new Date(),
      lastActivity: new Date(),
      status: 'active',
      capacity: Math.min(zone.capacity, this.playerCapacityPerChannel),
      settings: {
        maxIdleTime: 30,
        autoClose: true,
        pvpEnabled: zone.type === 'pvp',
        chatEnabled: true,
        tradingEnabled: zone.type !== 'dungeon',
        respawnEnabled: true,
        eventEnabled: true,
        weatherEnabled: zone.dayNightCycle
      },
      chat: [],
      statistics: {
        totalPlayers: 0,
        peakPlayers: 0,
        averagePlayers: 0,
        totalPlayTime: 0,
        monstersKilled: 0,
        itemsDropped: 0,
        eventsTriggered: 0,
        deathCount: 0,
        lastReset: new Date()
      }
    };

    // 지역 리소스 복사
    zone.resources.forEach(resource => {
      instance.resources.set(resource.id, { ...resource });
    });

    this.instances.set(instanceId, instance);
    
    const channels = this.channelSystem.get(zoneId) || [];
    channels.push(instanceId);
    this.channelSystem.set(zoneId, channels);

    logger.info(`새 인스턴스 생성: ${instanceId}`);

    return instance;
  }

  private getSpawnPosition(zone: WorldZone, instance: ZoneInstance): WorldPosition {
    if (zone.spawnPoints.length === 0) {
      return { x: zone.size.width / 2, y: zone.size.height / 2, direction: 0 };
    }

    // 가장 사람이 적은 스폰 포인트 선택
    let bestSpawn = zone.spawnPoints[0];
    let minDistance = Infinity;

    for (const spawn of zone.spawnPoints) {
      let totalDistance = 0;
      let playerCount = 0;

      instance.players.forEach(player => {
        const distance = this.calculateDistance(spawn, player.position);
        if (distance < 200) { // 200 유닛 반경 내의 플레이어 수 고려
          totalDistance += distance;
          playerCount++;
        }
      });

      const avgDistance = playerCount > 0 ? totalDistance / playerCount : 1000;
      if (avgDistance > minDistance) {
        minDistance = avgDistance;
        bestSpawn = spawn;
      }
    }

    return { ...bestSpawn };
  }

  private checkZoneRestrictions(zone: WorldZone, player: Player): { allowed: boolean; reason?: string } {
    for (const restriction of zone.restrictions) {
      if (!restriction.isRequired) continue;

      switch (restriction.type) {
        case 'level':
          const levelRange = restriction.condition.split('-').map(Number);
          if (player.level < levelRange[0] || player.level > levelRange[1]) {
            return { allowed: false, reason: restriction.message };
          }
          break;
        case 'class':
          const allowedClasses = restriction.condition.split(',');
          if (!allowedClasses.includes(player.class || '')) {
            return { allowed: false, reason: restriction.message };
          }
          break;
        // 추가 제한 조건들...
      }
    }

    return { allowed: true };
  }

  private isPositionInZone(position: WorldPosition, zone: WorldZone): boolean {
    return position.x >= 0 && position.x <= zone.size.width &&
           position.y >= 0 && position.y <= zone.size.height;
  }

  private clampPositionToZone(position: WorldPosition, zone: WorldZone): WorldPosition {
    return {
      x: Math.max(0, Math.min(position.x, zone.size.width)),
      y: Math.max(0, Math.min(position.y, zone.size.height)),
      z: position.z,
      direction: position.direction
    };
  }

  private calculateDistance(pos1: WorldPosition, pos2: WorldPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private broadcastToZone(instance: ZoneInstance, message: Record<string, unknown>, excludePlayerId?: string): void {
    instance.players.forEach((player, playerId) => {
      if (playerId !== excludePlayerId) {
        this.sendMessageToPlayer(playerId, message);
      }
    });
  }

  private broadcastToNearbyPlayers(
    instance: ZoneInstance, 
    centerPlayerId: string, 
    message: Record<string, unknown>, 
    range: number
  ): void {
    const centerPlayer = instance.players.get(centerPlayerId);
    if (!centerPlayer) return;

    instance.players.forEach((player, playerId) => {
      if (playerId === centerPlayerId) return;

      const distance = this.calculateDistance(centerPlayer.position, player.position);
      if (distance <= range) {
        this.sendMessageToPlayer(playerId, message);
      }
    });
  }

  private async sendMessageToPlayer(playerId: string, message: Record<string, unknown>): Promise<void> {
    // 실제로는 웹소켓이나 다른 실시간 통신으로 구현
    logger.debug(`메시지 전송 to ${playerId}:`, message);
  }

  private async applyEnvironmentEffects(instance: ZoneInstance, playerId: string): Promise<void> {
    const zone = this.zones.get(instance.zoneId);
    if (!zone) return;

    const player = instance.players.get(playerId);
    if (!player) return;

    // 환경 버프 적용
    for (const buff of zone.environment.buffs) {
      for (const area of buff.areas) {
        const distance = this.calculateDistance(player.position, area);
        if (distance <= area.radius) {
          // 실제로는 플레이어에게 버프 적용
          logger.debug(`환경 버프 적용: ${buff.type} to ${player.playerName}`);
        }
      }
    }
  }

  private async checkEnvironmentEffects(
    instance: ZoneInstance, 
    playerId: string, 
    position: WorldPosition
  ): Promise<void> {
    const zone = this.zones.get(instance.zoneId);
    if (!zone) return;

    // 환경 위험요소 확인
    for (const hazard of zone.environment.hazards) {
      for (const area of hazard.areas) {
        const distance = this.calculateDistance(position, area);
        if (distance <= area.radius) {
          // 실제로는 데미지 적용
          logger.debug(`환경 위험 적용: ${hazard.type} to ${playerId}`);
        }
      }
    }
  }

  private async applyEventEffect(instance: ZoneInstance, activeEvent: ActiveZoneEvent): Promise<void> {
    const effect = activeEvent.event.effect;
    
    switch (effect.type) {
      case 'buff_players':
        instance.players.forEach((player, playerId) => {
          // 실제로는 플레이어에게 버프 적용
          logger.debug(`이벤트 버프 적용: ${effect.data.buff} to ${player.playerName}`);
        });
        break;
      case 'spawn_monster':
        // 몬스터 스폰 로직
        break;
      // 추가 이벤트 효과들...
    }
  }

  private startMaintenanceTasks(): void {
    // 비활성 인스턴스 정리
    setInterval(() => {
      this.cleanupIdleInstances();
    }, this.instanceCleanupInterval);

    // 리소스 리스폰 관리
    setInterval(() => {
      this.manageResourceRespawn();
    }, 60000); // 1분마다

    // 날씨 시스템 업데이트
    setInterval(() => {
      this.updateWeatherSystem();
    }, 5 * 60000); // 5분마다

    // AFK 플레이어 처리
    setInterval(() => {
      this.handleAfkPlayers();
    }, 2 * 60000); // 2분마다
  }

  private cleanupIdleInstances(): void {
    this.instances.forEach((instance, instanceId) => {
      if (instance.status === 'idle' && instance.players.size === 0) {
        const idleTime = Date.now() - instance.lastActivity.getTime();
        if (idleTime > instance.settings.maxIdleTime * 60 * 1000) {
          this.destroyInstance(instanceId);
        }
      }
    });
  }

  private destroyInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    // 채널 목록에서 제거
    const channels = this.channelSystem.get(instance.zoneId) || [];
    const index = channels.indexOf(instanceId);
    if (index > -1) {
      channels.splice(index, 1);
      this.channelSystem.set(instance.zoneId, channels);
    }

    this.instances.delete(instanceId);
    logger.info(`인스턴스 제거: ${instanceId}`);
  }

  private manageResourceRespawn(): void {
    this.instances.forEach(instance => {
      if (!instance.settings.respawnEnabled) return;

      instance.resources.forEach(resource => {
        if (!resource.isActive) {
          const timeSinceRespawn = Date.now() - resource.lastRespawn.getTime();
          const respawnTime = resource.respawnTime * 1000;
          const variance = respawnTime * (resource.respawnVariance / 100);
          const actualRespawnTime = respawnTime + (Math.random() - 0.5) * variance;

          if (timeSinceRespawn >= actualRespawnTime) {
            resource.isActive = true;
            resource.lastRespawn = new Date();

            this.broadcastToZone(instance, {
              type: 'resource_respawn',
              resourceId: resource.id,
              type: resource.type,
              position: resource.position
            });
          }
        }
      });
    });
  }

  private updateWeatherSystem(): void {
    this.instances.forEach(instance => {
      if (!instance.settings.weatherEnabled) return;

      const zone = this.zones.get(instance.zoneId);
      if (!zone) return;

      // 간단한 날씨 변화 로직
      const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm'];
      const currentWeather = zone.weather.current;
      const changeChance = 20; // 20% 확률로 날씨 변화

      if (Math.random() * 100 < changeChance) {
        const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        if (newWeather !== currentWeather) {
          zone.weather.current = newWeather;

          this.broadcastToZone(instance, {
            type: 'weather_change',
            oldWeather: currentWeather,
            newWeather,
            effects: zone.weather.effects.find(e => e.weatherType === newWeather)?.effects
          });
        }
      }
    });
  }

  private handleAfkPlayers(): void {
    const afkThreshold = 10 * 60 * 1000; // 10분

    this.instances.forEach(instance => {
      instance.players.forEach((player, playerId) => {
        const timeSinceActivity = Date.now() - player.lastActivity.getTime();
        
        if (timeSinceActivity > afkThreshold && !player.isAfk) {
          player.isAfk = true;
          player.afkTime = new Date();
          player.status = 'afk';

          this.broadcastToZone(instance, {
            type: 'player_status_change',
            playerId,
            status: 'afk'
          }, playerId);
        }
      });
    });
  }

  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현 필요
    return null;
  }

  /**
   * 공개 API 메서드들
   */
  getZone(zoneId: string): WorldZone | null {
    return this.zones.get(zoneId) || null;
  }

  getAllZones(): WorldZone[] {
    return Array.from(this.zones.values()).filter(zone => zone.isActive);
  }

  getPlayerLocation(playerId: string): { zoneId?: string; instanceId?: string; position?: WorldPosition } {
    const instanceId = this.playerLocations.get(playerId);
    if (!instanceId) return {};

    const instance = this.instances.get(instanceId);
    if (!instance) return {};

    const player = instance.players.get(playerId);
    return {
      zoneId: instance.zoneId,
      instanceId,
      position: player?.position
    };
  }

  getZoneInstances(zoneId: string): ZoneInstance[] {
    const channels = this.channelSystem.get(zoneId) || [];
    return channels.map(id => this.instances.get(id)).filter(Boolean) as ZoneInstance[];
  }

  getInstancePlayers(instanceId: string): PlayerInZone[] {
    const instance = this.instances.get(instanceId);
    return instance ? Array.from(instance.players.values()) : [];
  }

  getZoneStatistics(zoneId: string): ZoneStatistics | null {
    const instances = this.getZoneInstances(zoneId);
    if (instances.length === 0) return null;

    // 모든 인스턴스의 통계 합계
    const combined: ZoneStatistics = {
      totalPlayers: 0,
      peakPlayers: 0,
      averagePlayers: 0,
      totalPlayTime: 0,
      monstersKilled: 0,
      itemsDropped: 0,
      eventsTriggered: 0,
      deathCount: 0,
      lastReset: new Date()
    };

    instances.forEach(instance => {
      const stats = instance.statistics;
      combined.totalPlayers += stats.totalPlayers;
      combined.peakPlayers = Math.max(combined.peakPlayers, stats.peakPlayers);
      combined.totalPlayTime += stats.totalPlayTime;
      combined.monstersKilled += stats.monstersKilled;
      combined.itemsDropped += stats.itemsDropped;
      combined.eventsTriggered += stats.eventsTriggered;
      combined.deathCount += stats.deathCount;
    });

    combined.averagePlayers = instances.reduce((sum, inst) => sum + inst.players.size, 0) / instances.length;

    return combined;
  }

  // 관리자 기능
  async createZone(zone: WorldZone): Promise<{ success: boolean; error?: string }> {
    if (this.zones.has(zone.id)) {
      return { success: false, error: '이미 존재하는 지역 ID입니다.' };
    }

    this.zones.set(zone.id, zone);
    this.channelSystem.set(zone.id, []);

    logger.info(`새 지역 생성: ${zone.displayName} (${zone.id})`);

    return { success: true };
  }

  async updateZone(zoneId: string, updates: Partial<WorldZone>): Promise<{ success: boolean; error?: string }> {
    const zone = this.zones.get(zoneId);
    if (!zone) {
      return { success: false, error: '존재하지 않는 지역입니다.' };
    }

    Object.assign(zone, updates);

    logger.info(`지역 업데이트: ${zone.displayName}`);

    return { success: true };
  }

  async forcePlayerMove(
    playerId: string, 
    targetZoneId: string, 
    position?: WorldPosition
  ): Promise<{ success: boolean; error?: string }> {
    await this.leaveZone(playerId);
    return await this.enterZone(playerId, targetZoneId, position);
  }

  getSystemStats(): {
    totalZones: number;
    activeZones: number;
    totalInstances: number;
    totalPlayers: number;
    averagePlayersPerZone: number;
  } {
    const totalZones = this.zones.size;
    const activeZones = Array.from(this.zones.values()).filter(z => z.isActive).length;
    const totalInstances = this.instances.size;
    const totalPlayers = Array.from(this.instances.values())
      .reduce((sum, instance) => sum + instance.players.size, 0);

    return {
      totalZones,
      activeZones,
      totalInstances,
      totalPlayers,
      averagePlayersPerZone: activeZones > 0 ? totalPlayers / activeZones : 0
    };
  }
}

// 전역 월드 지역 시스템 인스턴스
export const worldZoneSystem = new WorldZoneSystem();

// 월드 관련 유틸리티
export const worldUtils = {
  /**
   * 거리 계산
   */
  calculateDistance(pos1: WorldPosition, pos2: WorldPosition): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = (pos1.z || 0) - (pos2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * 방향 계산 (라디안)
   */
  calculateDirection(from: WorldPosition, to: WorldPosition): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
  },

  /**
   * 지역 타입 표시명
   */
  getZoneTypeDisplayName(type: ZoneType): string {
    const names = {
      town: '마을',
      field: '필드',
      dungeon: '던전',
      raid: '레이드',
      pvp: 'PvP',
      special: '특수',
      guild_hall: '길드홀',
      personal: '개인'
    };
    return names[type];
  },

  /**
   * 날씨 타입 표시명
   */
  getWeatherDisplayName(weather: WeatherType): string {
    const names = {
      clear: '맑음',
      cloudy: '흐림',
      rain: '비',
      storm: '폭풍',
      snow: '눈',
      fog: '안개',
      sandstorm: '모래폭풍'
    };
    return names[weather];
  },

  /**
   * 플레이어 상태 표시명
   */
  getPlayerStatusDisplayName(status: PlayerZoneStatus): string {
    const names = {
      active: '활동 중',
      idle: '대기 중',
      combat: '전투 중',
      dead: '사망',
      trading: '거래 중',
      afk: '자리비움'
    };
    return names[status];
  },

  /**
   * 위치 포맷팅
   */
  formatPosition(position: WorldPosition): string {
    return `(${Math.round(position.x)}, ${Math.round(position.y)}${position.z ? ', ' + Math.round(position.z) : ''})`;
  }
};
