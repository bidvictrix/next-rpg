import { Player } from '@/types/game';
import { logger } from '../logger';

// 플레이어 활동 타입
type ActivityType = 
  | 'login' | 'logout' | 'level_up' | 'skill_learn' | 'item_obtain' 
  | 'monster_kill' | 'quest_complete' | 'trade' | 'chat' | 'zone_change'
  | 'pvp_battle' | 'guild_action' | 'auction_action' | 'death' | 'resurrection';

// 활동 우선순위
type ActivityPriority = 'low' | 'medium' | 'high' | 'critical';

// 플레이어 활동 기록
interface PlayerActivity {
  id: string;
  playerId: string;
  playerName: string;
  type: ActivityType;
  priority: ActivityPriority;
  timestamp: Date;
  data: Record<string, unknown>; // 활동별 상세 데이터
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string; // 게임 내 위치
  metadata: ActivityMetadata;
}

// 활동 메타데이터
interface ActivityMetadata {
  duration?: number; // 활동 지속 시간 (초)
  beforeState?: Record<string, unknown>; // 활동 전 상태
  afterState?: Record<string, unknown>; // 활동 후 상태
  relatedPlayers?: string[]; // 관련된 다른 플레이어들
  gameMode?: string; // 게임 모드
  serverLoad?: number; // 서버 부하 (%)
  responseTime?: number; // 응답 시간 (ms)
}

// 플레이어 세션 정보
interface PlayerSession {
  sessionId: string;
  playerId: string;
  playerName: string;
  level: number;
  class: string;
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
  activities: string[]; // 활동 ID 목록
  totalPlayTime: number; // 총 플레이 시간 (초)
  statistics: SessionStatistics;
  flags: SessionFlag[];
  status: SessionStatus;
}

// 세션 통계
interface SessionStatistics {
  activityCount: number;
  monstersKilled: number;
  experienceGained: number;
  itemsObtained: number;
  questsCompleted: number;
  deathCount: number;
  chatMessages: number;
  tradeCount: number;
  zonesVisited: string[];
  maxLevel: number;
  achievements: string[];
}

// 세션 플래그
interface SessionFlag {
  type: 'suspicious' | 'bot_like' | 'toxic' | 'helper' | 'new_player' | 'returning';
  reason: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  autoDetected: boolean;
}

// 세션 상태
type SessionStatus = 'active' | 'idle' | 'disconnected' | 'banned' | 'maintenance';

// 활동 패턴 분석
interface ActivityPattern {
  type: 'hourly' | 'daily' | 'weekly' | 'behavioral';
  playerId: string;
  pattern: PatternData;
  anomalies: PatternAnomaly[];
  confidence: number; // 신뢰도 (0-100)
  lastUpdated: Date;
}

// 패턴 데이터
interface PatternData {
  averageSessionLength: number;
  preferredPlayTimes: number[]; // 선호 시간대 (0-23)
  commonActivities: Record<ActivityType, number>;
  locationPreferences: Record<string, number>;
  socialBehavior: {
    chatFrequency: number;
    tradeFrequency: number;
    guildParticipation: number;
  };
  progressionRate: {
    leveling: number;
    skillLearning: number;
    questCompletion: number;
  };
}

// 패턴 이상징후
interface PatternAnomaly {
  type: 'unusual_activity' | 'sudden_skill_jump' | 'impossible_progression' | 'bot_behavior';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  evidence: Array<Record<string, unknown>>;
  falsePositiveChance: number; // 오탐 확률 (%)
}

// 실시간 활동 통계
interface RealTimeStats {
  currentPlayers: number;
  peakPlayers: number;
  averageSessionLength: number;
  activitiesPerMinute: number;
  topActivities: Array<{ type: ActivityType; count: number }>;
  serverPerformance: {
    responseTime: number;
    errorRate: number;
    resourceUsage: number;
  };
  hourlyTrends: Record<string, number>;
  geographicDistribution: Record<string, number>;
  newPlayerCount: number;
  returningPlayerCount: number;
}

// 알림 설정
interface MonitorAlert {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  action: AlertAction;
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  cooldown: number; // 초 단위
}

// 알림 조건
interface AlertCondition {
  type: 'player_count' | 'activity_spike' | 'suspicious_behavior' | 'system_performance' | 'error_rate';
  threshold: number;
  timeWindow: number; // 초 단위
  comparison: 'greater_than' | 'less_than' | 'equals' | 'percentage_change';
  additionalFilters?: Record<string, unknown>;
}

// 알림 액션
interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'auto_action';
  target: string;
  message: string;
  autoAction?: 'restart_service' | 'scale_resources' | 'ban_player' | 'send_warning';
}

export class PlayerActivityMonitor {
  private activities: Map<string, PlayerActivity> = new Map();
  private sessions: Map<string, PlayerSession> = new Map();
  private patterns: Map<string, ActivityPattern> = new Map();
  private alerts: Map<string, MonitorAlert> = new Map();
  private realtimeStats: RealTimeStats;
  private maxActivities: number = 100000; // 최대 저장 활동 수
  private maxSessions: number = 10000; // 최대 저장 세션 수

  constructor() {
    this.realtimeStats = this.createEmptyStats();
    this.initializeDefaultAlerts();
    this.startMonitoring();
  }

  /**
   * 플레이어 활동 기록
   */
  logActivity(
    playerId: string,
    type: ActivityType,
    data: Record<string, unknown> = {},
    metadata: Partial<ActivityMetadata> = {}
  ): void {
    const player = this.getPlayerInfo(playerId);
    if (!player) {
      logger.warn(`알 수 없는 플레이어 활동: ${playerId}`);
      return;
    }

    const session = this.getOrCreateSession(playerId, player);
    const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const activity: PlayerActivity = {
      id: activityId,
      playerId,
      playerName: player.name,
      type,
      priority: this.calculateActivityPriority(type, data),
      timestamp: new Date(),
      data,
      sessionId: session.sessionId,
      location: data.location || session.statistics.zonesVisited.slice(-1)[0],
      metadata: {
        serverLoad: this.getCurrentServerLoad(),
        responseTime: this.getCurrentResponseTime(),
        ...metadata
      }
    };

    // 활동 저장
    this.activities.set(activityId, activity);
    session.activities.push(activityId);
    session.lastActivity = new Date();

    // 세션 통계 업데이트
    this.updateSessionStatistics(session, activity);

    // 실시간 통계 업데이트
    this.updateRealtimeStats(activity);

    // 패턴 분석 업데이트
    this.updateActivityPattern(playerId, activity);

    // 이상징후 감지
    this.detectAnomalies(playerId, activity);

    // 알림 확인
    this.checkAlerts(activity);

    // 메모리 관리
    this.cleanupOldData();

    logger.debug(`활동 기록: ${player.name} - ${type}`, data);
  }

  /**
   * 플레이어 세션 시작
   */
  startSession(playerId: string): string {
    const player = this.getPlayerInfo(playerId);
    if (!player) {
      throw new Error('플레이어 정보를 찾을 수 없습니다.');
    }

    const sessionId = `session_${Date.now()}_${playerId}`;
    const session: PlayerSession = {
      sessionId,
      playerId,
      playerName: player.name,
      level: player.level,
      class: player.class || 'unknown',
      startTime: new Date(),
      lastActivity: new Date(),
      activities: [],
      totalPlayTime: 0,
      statistics: this.createEmptySessionStats(),
      flags: [],
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    // 로그인 활동 기록
    this.logActivity(playerId, 'login', {
      level: player.level,
      class: player.class,
      loginTime: new Date()
    });

    // 신규/복귀 플레이어 감지
    this.detectPlayerType(playerId, session);

    logger.info(`세션 시작: ${player.name} (${sessionId})`);

    return sessionId;
  }

  /**
   * 플레이어 세션 종료
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`존재하지 않는 세션: ${sessionId}`);
      return;
    }

    session.endTime = new Date();
    session.status = 'disconnected';
    session.totalPlayTime = session.endTime.getTime() - session.startTime.getTime();

    // 로그아웃 활동 기록
    this.logActivity(session.playerId, 'logout', {
      sessionDuration: session.totalPlayTime,
      activitiesCount: session.activities.length,
      finalLevel: session.statistics.maxLevel
    });

    // 세션 분석 완료
    this.analyzeCompletedSession(session);

    logger.info(`세션 종료: ${session.playerName} (${sessionId}) - ${this.formatDuration(session.totalPlayTime)}`);
  }

  /**
   * 실시간 플레이어 목록 조회
   */
  getActivePlayers(): PlayerSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.status === 'active')
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * 플레이어 활동 히스토리 조회
   */
  getPlayerActivityHistory(
    playerId: string, 
    limit: number = 100,
    activityTypes?: ActivityType[]
  ): PlayerActivity[] {
    return Array.from(this.activities.values())
      .filter(activity => {
        if (activity.playerId !== playerId) return false;
        if (activityTypes && !activityTypes.includes(activity.type)) return false;
        return true;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 실시간 통계 조회
   */
  getRealTimeStats(): RealTimeStats {
    return { ...this.realtimeStats };
  }

  /**
   * 플레이어 패턴 분석 조회
   */
  getPlayerPattern(playerId: string): ActivityPattern | null {
    return this.patterns.get(playerId) || null;
  }

  /**
   * 의심스러운 활동 감지
   */
  getSuspiciousActivities(hours: number = 24): Array<{
    player: PlayerSession;
    activities: PlayerActivity[];
    anomalies: PatternAnomaly[];
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const suspicious: Array<{
      player: PlayerSession;
      activities: PlayerActivity[];
      anomalies: PatternAnomaly[];
    }> = [];

    this.sessions.forEach(session => {
      const hasFlags = session.flags.some(flag => 
        flag.severity === 'high' && flag.timestamp >= since
      );

      if (hasFlags) {
        const activities = this.getPlayerActivityHistory(session.playerId, 50)
          .filter(activity => activity.timestamp >= since);
        
        const pattern = this.patterns.get(session.playerId);
        const anomalies = pattern?.anomalies.filter(anomaly => 
          anomaly.timestamp >= since && anomaly.severity === 'high'
        ) || [];

        if (activities.length > 0 || anomalies.length > 0) {
          suspicious.push({
            player: session,
            activities,
            anomalies
          });
        }
      }
    });

    return suspicious.sort((a, b) => 
      b.anomalies.length - a.anomalies.length
    );
  }

  /**
   * 서버 성능 지표 조회
   */
  getServerMetrics(): {
    performance: {
      averageResponseTime: number;
      errorRate: number;
      throughput: number;
    };
    playerMetrics: {
      totalSessions: number;
      activeSessions: number;
      averageSessionLength: number;
      newPlayers: number;
    };
    activityMetrics: {
      totalActivities: number;
      activitiesPerSecond: number;
      topActivityTypes: Array<{ type: ActivityType; count: number }>;
    };
  } {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const hourAgo = new Date(now - hour);

    const recentActivities = Array.from(this.activities.values())
      .filter(activity => activity.timestamp >= hourAgo);

    const activeSessions = this.getActivePlayers();

    // 활동 타입별 카운트
    const activityCounts = new Map<ActivityType, number>();
    recentActivities.forEach(activity => {
      activityCounts.set(activity.type, (activityCounts.get(activity.type) || 0) + 1);
    });

    const topActivityTypes = Array.from(activityCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      performance: {
        averageResponseTime: this.realtimeStats.serverPerformance.responseTime,
        errorRate: this.realtimeStats.serverPerformance.errorRate,
        throughput: recentActivities.length / 3600 // 시간당 처리량
      },
      playerMetrics: {
        totalSessions: this.sessions.size,
        activeSessions: activeSessions.length,
        averageSessionLength: this.realtimeStats.averageSessionLength,
        newPlayers: this.realtimeStats.newPlayerCount
      },
      activityMetrics: {
        totalActivities: this.activities.size,
        activitiesPerSecond: recentActivities.length / 3600,
        topActivityTypes
      }
    };
  }

  // 헬퍼 함수들
  private getOrCreateSession(playerId: string, player: Player): PlayerSession {
    const existingSession = Array.from(this.sessions.values())
      .find(session => session.playerId === playerId && session.status === 'active');
    
    if (existingSession) {
      return existingSession;
    }

    return {
      sessionId: this.startSession(playerId),
      playerId,
      playerName: player.name,
      level: player.level,
      class: player.class || 'unknown',
      startTime: new Date(),
      lastActivity: new Date(),
      activities: [],
      totalPlayTime: 0,
      statistics: this.createEmptySessionStats(),
      flags: [],
      status: 'active'
    };
  }

  private calculateActivityPriority(type: ActivityType, data: Record<string, unknown>): ActivityPriority {
    const highPriorityTypes: ActivityType[] = ['login', 'logout', 'level_up', 'pvp_battle', 'death'];
    const mediumPriorityTypes: ActivityType[] = ['skill_learn', 'quest_complete', 'trade', 'guild_action'];
    
    if (highPriorityTypes.includes(type)) return 'high';
    if (mediumPriorityTypes.includes(type)) return 'medium';
    
    // 데이터 기반 우선순위 조정
    if (data.value && data.value > 10000) return 'high';
    if (data.rarity && data.rarity === 'legendary') return 'high';
    
    return 'low';
  }

  private updateSessionStatistics(session: PlayerSession, activity: PlayerActivity): void {
    const stats = session.statistics;
    stats.activityCount++;

    switch (activity.type) {
      case 'monster_kill':
        stats.monstersKilled++;
        if (activity.data.experience) {
          stats.experienceGained += activity.data.experience;
        }
        break;
      case 'item_obtain':
        stats.itemsObtained++;
        break;
      case 'quest_complete':
        stats.questsCompleted++;
        break;
      case 'death':
        stats.deathCount++;
        break;
      case 'chat':
        stats.chatMessages++;
        break;
      case 'trade':
        stats.tradeCount++;
        break;
      case 'zone_change':
        if (activity.data.to && !stats.zonesVisited.includes(activity.data.to)) {
          stats.zonesVisited.push(activity.data.to);
        }
        break;
      case 'level_up':
        stats.maxLevel = Math.max(stats.maxLevel, activity.data.newLevel || 0);
        break;
    }
  }

  private updateRealtimeStats(activity: PlayerActivity): void {
    const stats = this.realtimeStats;
    
    // 현재 플레이어 수
    stats.currentPlayers = this.getActivePlayers().length;
    stats.peakPlayers = Math.max(stats.peakPlayers, stats.currentPlayers);

    // 분당 활동 수
    stats.activitiesPerMinute = this.calculateActivitiesPerMinute();

    // 상위 활동 타입
    this.updateTopActivities(activity.type);

    // 시간대별 트렌드
    const hour = activity.timestamp.getHours().toString();
    stats.hourlyTrends[hour] = (stats.hourlyTrends[hour] || 0) + 1;

    // 서버 성능
    if (activity.metadata.responseTime) {
      stats.serverPerformance.responseTime = 
        (stats.serverPerformance.responseTime + activity.metadata.responseTime) / 2;
    }
  }

  private updateActivityPattern(playerId: string, activity: PlayerActivity): void {
    let pattern = this.patterns.get(playerId);
    
    if (!pattern) {
      pattern = {
        type: 'behavioral',
        playerId,
        pattern: this.createEmptyPatternData(),
        anomalies: [],
        confidence: 0,
        lastUpdated: new Date()
      };
      this.patterns.set(playerId, pattern);
    }

    // 패턴 데이터 업데이트
    const patternData = pattern.pattern;
    
    // 일반 활동 카운트
    patternData.commonActivities[activity.type] = 
      (patternData.commonActivities[activity.type] || 0) + 1;

    // 위치 선호도
    if (activity.location) {
      patternData.locationPreferences[activity.location] = 
        (patternData.locationPreferences[activity.location] || 0) + 1;
    }

    // 플레이 시간 패턴
    const hour = activity.timestamp.getHours();
    if (!patternData.preferredPlayTimes.includes(hour)) {
      patternData.preferredPlayTimes.push(hour);
    }

    // 소셜 행동 패턴
    if (activity.type === 'chat') {
      patternData.socialBehavior.chatFrequency++;
    } else if (activity.type === 'trade') {
      patternData.socialBehavior.tradeFrequency++;
    }

    pattern.lastUpdated = new Date();
  }

  private detectAnomalies(playerId: string, activity: PlayerActivity): void {
    const pattern = this.patterns.get(playerId);
    const session = Array.from(this.sessions.values())
      .find(s => s.playerId === playerId && s.status === 'active');
    
    if (!pattern || !session) return;

    // 비정상적인 레벨 상승 감지
    if (activity.type === 'level_up') {
      const levelGain = activity.data.newLevel - activity.data.oldLevel;
      if (levelGain > 5) {
        this.addAnomaly(pattern, {
          type: 'sudden_skill_jump',
          description: `비정상적인 레벨 상승: ${levelGain} 레벨`,
          severity: 'high',
          timestamp: new Date(),
          evidence: [activity],
          falsePositiveChance: 5
        });

        this.addSessionFlag(session, {
          type: 'suspicious',
          reason: 'sudden_level_jump',
          severity: 'high',
          timestamp: new Date(),
          autoDetected: true
        });
      }
    }

    // 봇 같은 행동 패턴 감지
    if (this.detectBotBehavior(playerId, activity)) {
      this.addAnomaly(pattern, {
        type: 'bot_behavior',
        description: '봇과 유사한 행동 패턴 감지',
        severity: 'high',
        timestamp: new Date(),
        evidence: [activity],
        falsePositiveChance: 15
      });

      this.addSessionFlag(session, {
        type: 'bot_like',
        reason: 'repetitive_behavior',
        severity: 'high',
        timestamp: new Date(),
        autoDetected: true
      });
    }

    // 불가능한 진행 속도 감지
    if (this.detectImpossibleProgression(playerId, activity)) {
      this.addAnomaly(pattern, {
        type: 'impossible_progression',
        description: '물리적으로 불가능한 진행 속도',
        severity: 'critical',
        timestamp: new Date(),
        evidence: [activity],
        falsePositiveChance: 1
      });

      this.addSessionFlag(session, {
        type: 'suspicious',
        reason: 'impossible_progression',
        severity: 'high',
        timestamp: new Date(),
        autoDetected: true
      });
    }
  }

  private detectBotBehavior(playerId: string, activity: PlayerActivity): boolean {
    const recentActivities = this.getPlayerActivityHistory(playerId, 20);
    
    // 동일한 패턴 반복 확인
    if (recentActivities.length >= 10) {
      const intervals = [];
      for (let i = 1; i < recentActivities.length; i++) {
        const interval = recentActivities[i-1].timestamp.getTime() - recentActivities[i].timestamp.getTime();
        intervals.push(interval);
      }

      // 간격이 너무 일정한 경우 (편차 < 1초)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 1000 && avgInterval > 0) { // 1초 미만의 편차
        return true;
      }
    }

    return false;
  }

  private detectImpossibleProgression(playerId: string, activity: PlayerActivity): boolean {
    // 예: 짧은 시간에 너무 많은 경험치 획득
    if (activity.type === 'monster_kill' && activity.data.experience) {
      const session = Array.from(this.sessions.values())
        .find(s => s.playerId === playerId && s.status === 'active');
      
      if (session) {
        const sessionMinutes = (Date.now() - session.startTime.getTime()) / (1000 * 60);
        const expPerMinute = session.statistics.experienceGained / sessionMinutes;
        
        // 분당 10000 경험치 이상은 의심스러움
        if (expPerMinute > 10000) {
          return true;
        }
      }
    }

    return false;
  }

  private addAnomaly(pattern: ActivityPattern, anomaly: PatternAnomaly): void {
    pattern.anomalies.push(anomaly);
    
    // 최근 100개만 유지
    if (pattern.anomalies.length > 100) {
      pattern.anomalies = pattern.anomalies.slice(-100);
    }
  }

  private addSessionFlag(session: PlayerSession, flag: SessionFlag): void {
    session.flags.push(flag);
    
    // 최근 50개만 유지
    if (session.flags.length > 50) {
      session.flags = session.flags.slice(-50);
    }
  }

  private checkAlerts(activity: PlayerActivity): void {
    this.alerts.forEach(alert => {
      if (!alert.isActive) return;

      const now = Date.now();
      if (alert.lastTriggered && (now - alert.lastTriggered.getTime()) < alert.cooldown * 1000) {
        return; // 쿨다운 중
      }

      if (this.evaluateAlertCondition(alert.condition, activity)) {
        this.triggerAlert(alert, activity);
      }
    });
  }

  private evaluateAlertCondition(condition: AlertCondition, activity: PlayerActivity): boolean {
    const now = Date.now();
    const windowStart = new Date(now - condition.timeWindow * 1000);

    switch (condition.type) {
      case 'player_count':
        const currentPlayers = this.getActivePlayers().length;
        return this.compareValue(currentPlayers, condition.threshold, condition.comparison);

      case 'activity_spike':
        const recentActivities = Array.from(this.activities.values())
          .filter(act => act.timestamp >= windowStart);
        const activityRate = recentActivities.length / (condition.timeWindow / 60); // 분당
        return this.compareValue(activityRate, condition.threshold, condition.comparison);

      case 'suspicious_behavior':
        const suspiciousCount = Array.from(this.sessions.values())
          .filter(session => session.flags.some(flag => 
            flag.severity === 'high' && flag.timestamp >= windowStart
          )).length;
        return this.compareValue(suspiciousCount, condition.threshold, condition.comparison);

      default:
        return false;
    }
  }

  private compareValue(actual: number, threshold: number, comparison: string): boolean {
    switch (comparison) {
      case 'greater_than': return actual > threshold;
      case 'less_than': return actual < threshold;
      case 'equals': return Math.abs(actual - threshold) < 0.01;
      default: return false;
    }
  }

  private triggerAlert(alert: MonitorAlert, activity: PlayerActivity): void {
    alert.lastTriggered = new Date();
    alert.triggerCount++;

    const message = `알림: ${alert.name} - ${alert.description}`;
    
    switch (alert.action.type) {
      case 'log':
        logger.warn(message);
        break;
      case 'email':
        // 이메일 발송 로직
        logger.info(`이메일 알림: ${alert.action.target} - ${message}`);
        break;
      case 'webhook':
        // 웹훅 발송 로직
        logger.info(`웹훅 알림: ${alert.action.target} - ${message}`);
        break;
      case 'auto_action':
        this.executeAutoAction(alert.action.autoAction!, activity);
        break;
    }

    logger.info(`알림 트리거: ${alert.name} (${alert.triggerCount}회)`);
  }

  private executeAutoAction(action: string, activity: PlayerActivity): void {
    switch (action) {
      case 'send_warning':
        logger.info(`경고 메시지 전송: ${activity.playerName}`);
        break;
      case 'ban_player':
        logger.warn(`플레이어 자동 밴: ${activity.playerName}`);
        break;
      default:
        logger.info(`자동 액션 실행: ${action}`);
    }
  }

  private analyzeCompletedSession(session: PlayerSession): void {
    // 세션 완료 후 최종 분석
    const duration = session.totalPlayTime / (1000 * 60); // 분 단위
    
    // 신규 플레이어 도움 플래그
    if (session.statistics.maxLevel <= 5 && duration > 60) {
      this.addSessionFlag(session, {
        type: 'new_player',
        reason: 'long_session_low_level',
        severity: 'low',
        timestamp: new Date(),
        autoDetected: true
      });
    }

    // 도움이 되는 플레이어 감지
    if (session.statistics.chatMessages > 50 && session.flags.length === 0) {
      this.addSessionFlag(session, {
        type: 'helper',
        reason: 'high_chat_activity',
        severity: 'low',
        timestamp: new Date(),
        autoDetected: true
      });
    }

    logger.debug(`세션 분석 완료: ${session.playerName} - ${this.formatDuration(session.totalPlayTime)}`);
  }

  private detectPlayerType(playerId: string, session: PlayerSession): void {
    // 이전 세션 확인
    const previousSessions = Array.from(this.sessions.values())
      .filter(s => s.playerId === playerId && s.sessionId !== session.sessionId);

    if (previousSessions.length === 0) {
      // 신규 플레이어
      this.addSessionFlag(session, {
        type: 'new_player',
        reason: 'first_session',
        severity: 'low',
        timestamp: new Date(),
        autoDetected: true
      });
      this.realtimeStats.newPlayerCount++;
    } else {
      const lastSession = previousSessions
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
      
      const daysSinceLastSession = (Date.now() - lastSession.startTime.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastSession > 7) {
        // 복귀 플레이어
        this.addSessionFlag(session, {
          type: 'returning',
          reason: `${Math.floor(daysSinceLastSession)}일 만에 복귀`,
          severity: 'low',
          timestamp: new Date(),
          autoDetected: true
        });
        this.realtimeStats.returningPlayerCount++;
      }
    }
  }

  private calculateActivitiesPerMinute(): number {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentActivities = Array.from(this.activities.values())
      .filter(activity => activity.timestamp >= oneMinuteAgo);
    return recentActivities.length;
  }

  private updateTopActivities(type: ActivityType): void {
    const existing = this.realtimeStats.topActivities.find(item => item.type === type);
    if (existing) {
      existing.count++;
    } else {
      this.realtimeStats.topActivities.push({ type, count: 1 });
    }

    // 상위 10개만 유지
    this.realtimeStats.topActivities.sort((a, b) => b.count - a.count);
    this.realtimeStats.topActivities = this.realtimeStats.topActivities.slice(0, 10);
  }

  private cleanupOldData(): void {
    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // 오래된 활동 삭제
    if (this.activities.size > this.maxActivities) {
      const oldActivities = Array.from(this.activities.entries())
        .filter(([_, activity]) => activity.timestamp < dayAgo)
        .slice(0, this.activities.size - this.maxActivities);

      oldActivities.forEach(([id]) => {
        this.activities.delete(id);
      });
    }

    // 오래된 세션 삭제
    if (this.sessions.size > this.maxSessions) {
      const oldSessions = Array.from(this.sessions.entries())
        .filter(([_, session]) => session.endTime && session.endTime < dayAgo)
        .slice(0, this.sessions.size - this.maxSessions);

      oldSessions.forEach(([id]) => {
        this.sessions.delete(id);
      });
    }
  }

  private createEmptyStats(): RealTimeStats {
    return {
      currentPlayers: 0,
      peakPlayers: 0,
      averageSessionLength: 0,
      activitiesPerMinute: 0,
      topActivities: [],
      serverPerformance: {
        responseTime: 0,
        errorRate: 0,
        resourceUsage: 0
      },
      hourlyTrends: {},
      geographicDistribution: {},
      newPlayerCount: 0,
      returningPlayerCount: 0
    };
  }

  private createEmptySessionStats(): SessionStatistics {
    return {
      activityCount: 0,
      monstersKilled: 0,
      experienceGained: 0,
      itemsObtained: 0,
      questsCompleted: 0,
      deathCount: 0,
      chatMessages: 0,
      tradeCount: 0,
      zonesVisited: [],
      maxLevel: 1,
      achievements: []
    };
  }

  private createEmptyPatternData(): PatternData {
    return {
      averageSessionLength: 0,
      preferredPlayTimes: [],
      commonActivities: {} as Record<ActivityType, number>,
      locationPreferences: {},
      socialBehavior: {
        chatFrequency: 0,
        tradeFrequency: 0,
        guildParticipation: 0
      },
      progressionRate: {
        leveling: 0,
        skillLearning: 0,
        questCompletion: 0
      }
    };
  }

  private initializeDefaultAlerts(): void {
    const defaultAlerts: MonitorAlert[] = [
      {
        id: 'high_player_count',
        name: '플레이어 수 급증',
        description: '동시 접속자 수가 임계값을 초과했습니다',
        condition: {
          type: 'player_count',
          threshold: 1000,
          timeWindow: 300,
          comparison: 'greater_than'
        },
        action: {
          type: 'log',
          target: 'admin',
          message: '서버 확장을 고려해야 합니다'
        },
        isActive: true,
        triggerCount: 0,
        cooldown: 300
      },
      {
        id: 'suspicious_activity_spike',
        name: '의심 활동 급증',
        description: '의심스러운 활동이 급증했습니다',
        condition: {
          type: 'suspicious_behavior',
          threshold: 5,
          timeWindow: 600,
          comparison: 'greater_than'
        },
        action: {
          type: 'email',
          target: 'security@game.com',
          message: '보안 검토가 필요합니다'
        },
        isActive: true,
        triggerCount: 0,
        cooldown: 600
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
    });
  }

  private startMonitoring(): void {
    // 실시간 통계 업데이트
    setInterval(() => {
      this.updateGlobalStats();
    }, 60000); // 1분마다

    // 세션 타임아웃 관리
    setInterval(() => {
      this.manageSessionTimeouts();
    }, 30000); // 30초마다

    // 데이터 정리
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60000); // 5분마다
  }

  private updateGlobalStats(): void {
    const activePlayers = this.getActivePlayers();
    this.realtimeStats.currentPlayers = activePlayers.length;

    // 평균 세션 길이 계산
    const totalSessionTime = activePlayers.reduce((sum, session) => {
      return sum + (Date.now() - session.startTime.getTime());
    }, 0);
    
    if (activePlayers.length > 0) {
      this.realtimeStats.averageSessionLength = totalSessionTime / activePlayers.length / 1000 / 60; // 분
    }
  }

  private manageSessionTimeouts(): void {
    const timeoutThreshold = 10 * 60 * 1000; // 10분
    const now = Date.now();

    this.sessions.forEach(session => {
      if (session.status === 'active') {
        const timeSinceActivity = now - session.lastActivity.getTime();
        if (timeSinceActivity > timeoutThreshold) {
          session.status = 'idle';
          logger.debug(`세션 비활성화: ${session.playerName} (${this.formatDuration(timeSinceActivity)} 비활성)`);
        }
      }
    });
  }

  private getCurrentServerLoad(): number {
    // 간단한 서버 부하 계산 (실제로는 더 정교한 측정 필요)
    return Math.min(100, (this.activities.size / this.maxActivities) * 100);
  }

  private getCurrentResponseTime(): number {
    // 간단한 응답 시간 시뮬레이션 (실제로는 실측 필요)
    return Math.random() * 100 + 50; // 50-150ms
  }

  private getPlayerInfo(playerId: string): Player | null {
    // 실제 구현 필요
    return null;
  }

  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    }
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  }

  /**
   * 공개 API 메서드들
   */
  
  // 알림 관리
  createAlert(alert: Omit<MonitorAlert, 'triggerCount'>): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.alerts.set(alertId, { ...alert, triggerCount: 0 });
    return alertId;
  }

  updateAlert(alertId: string, updates: Partial<MonitorAlert>): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;
    
    Object.assign(alert, updates);
    return true;
  }

  deleteAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  getAlerts(): MonitorAlert[] {
    return Array.from(this.alerts.values());
  }

  // 통계 내보내기
  exportActivityData(startDate: Date, endDate: Date): PlayerActivity[] {
    return Array.from(this.activities.values())
      .filter(activity => activity.timestamp >= startDate && activity.timestamp <= endDate)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  exportSessionData(startDate: Date, endDate: Date): PlayerSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.startTime >= startDate && 
        (session.endTime ? session.endTime <= endDate : true))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  // 관리자 기능
  forceEndSession(sessionId: string, reason: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'disconnected';
    session.endTime = new Date();
    
    this.addSessionFlag(session, {
      type: 'suspicious',
      reason: `관리자에 의해 강제 종료: ${reason}`,
      severity: 'medium',
      timestamp: new Date(),
      autoDetected: false
    });

    logger.info(`세션 강제 종료: ${session.playerName} (${reason})`);
    return true;
  }

  getSystemHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: Record<string, number>;
    alerts: number;
  } {
    const metrics = this.getServerMetrics();
    const activeAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.isActive && alert.lastTriggered && 
        Date.now() - alert.lastTriggered.getTime() < 60000).length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (metrics.performance.errorRate > 5 || activeAlerts > 3) {
      status = 'critical';
    } else if (metrics.performance.errorRate > 1 || activeAlerts > 0) {
      status = 'warning';
    }

    return {
      status,
      metrics: {
        activePlayers: metrics.playerMetrics.activeSessions,
        responseTime: metrics.performance.averageResponseTime,
        errorRate: metrics.performance.errorRate,
        throughput: metrics.performance.throughput
      },
      alerts: activeAlerts
    };
  }
}

// 전역 플레이어 활동 모니터 인스턴스
export const playerActivityMonitor = new PlayerActivityMonitor();

// 플레이어 활동 모니터링 관련 유틸리티
export const activityMonitorUtils = {
  /**
   * 활동 타입 표시명
   */
  getActivityTypeDisplayName(type: ActivityType): string {
    const names = {
      login: '로그인',
      logout: '로그아웃',
      level_up: '레벨업',
      skill_learn: '스킬 학습',
      item_obtain: '아이템 획득',
      monster_kill: '몬스터 처치',
      quest_complete: '퀘스트 완료',
      trade: '거래',
      chat: '채팅',
      zone_change: '지역 이동',
      pvp_battle: 'PvP 전투',
      guild_action: '길드 활동',
      auction_action: '경매 활동',
      death: '사망',
      resurrection: '부활'
    };
    return names[type];
  },

  /**
   * 우선순위 색상
   */
  getPriorityColor(priority: ActivityPriority): string {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[priority];
  },

  /**
   * 세션 상태 표시명
   */
  getSessionStatusDisplayName(status: SessionStatus): string {
    const names = {
      active: '활성',
      idle: '비활성',
      disconnected: '연결 해제',
      banned: '차단',
      maintenance: '점검'
    };
    return names[status];
  },

  /**
   * 플래그 타입 표시명
   */
  getFlagTypeDisplayName(type: string): string {
    const names = {
      suspicious: '의심스러운 활동',
      bot_like: '봇 의심',
      toxic: '독성 행동',
      helper: '도움이 되는 플레이어',
      new_player: '신규 플레이어',
      returning: '복귀 플레이어'
    };
    return names[type] || type;
  },

  /**
   * 활동 요약 생성
   */
  summarizeActivity(activity: PlayerActivity): string {
    const displayName = this.getActivityTypeDisplayName(activity.type);
    
    switch (activity.type) {
      case 'level_up':
        return `${displayName}: ${activity.data.oldLevel} → ${activity.data.newLevel}`;
      case 'monster_kill':
        return `${displayName}: ${activity.data.monsterName} (+${activity.data.experience} EXP)`;
      case 'item_obtain':
        return `${displayName}: ${activity.data.itemName} x${activity.data.quantity}`;
      case 'zone_change':
        return `${displayName}: ${activity.data.from} → ${activity.data.to}`;
      default:
        return displayName;
    }
  }
};
