/**
 * 게임 로그 시스템
 */

import { TimeUtils } from './utils';

// 로그 레벨
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// 로그 카테고리
export enum LogCategory {
  SYSTEM = 'system',
  PLAYER = 'player',
  BATTLE = 'battle',
  QUEST = 'quest',
  ITEM = 'item',
  SKILL = 'skill',
  TRADE = 'trade',
  GUILD = 'guild',
  ADMIN = 'admin',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  API = 'api'
}

// 로그 엔트리 인터페이스
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  userId?: string;
  sessionId?: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

// 로그 필터 옵션
export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  userId?: string;
  startTime?: string;
  endTime?: string;
  keyword?: string;
}

// 로그 출력 설정
export interface LogOutput {
  console?: boolean;
  file?: boolean;
  database?: boolean;
  webhook?: boolean;
}

// 로그 설정
export interface LogConfig {
  level: LogLevel;
  outputs: LogOutput;
  maxFileSize?: number; // MB
  maxLogFiles?: number;
  enableStackTrace?: boolean;
  enableMetadata?: boolean;
  bufferSize?: number; // 버퍼링할 로그 개수
  flushInterval?: number; // 버퍼 플러시 간격 (ms)
}

// 게임 이벤트 로그
export interface GameEventLog {
  eventType: string;
  playerId: string;
  playerName: string;
  timestamp: string;
  data: unknown;
  result?: unknown;
  duration?: number;
}

// 시스템 메트릭 로그
export interface SystemMetricsLog {
  timestamp: string;
  cpu: number;
  memory: number;
  activeUsers: number;
  activeGames: number;
  databaseConnections: number;
  responseTime: number;
}

export class Logger {
  private config: LogConfig;
  private buffer: LogEntry[] = [];
  private lastFlush: number = Date.now();
  private logCounter: number = 0;

  constructor(config: LogConfig) {
    this.config = config;
    this.startPeriodicFlush();
  }

  /**
   * 로그 기록
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    userId?: string,
    sessionId?: string
  ): void {
    // 로그 레벨 필터링
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: TimeUtils.now(),
      level,
      category,
      message,
      data,
      userId,
      sessionId,
      metadata: this.config.enableMetadata ? this.collectMetadata() : undefined,
      stackTrace: this.config.enableStackTrace && level >= LogLevel.ERROR ? 
        this.getStackTrace() : undefined
    };

    // 버퍼에 추가
    this.buffer.push(entry);

    // 즉시 출력이 필요한 경우 (에러, 크리티컬)
    if (level >= LogLevel.ERROR || this.buffer.length >= (this.config.bufferSize || 100)) {
      this.flush();
    }
  }

  /**
   * 디버그 로그
   */
  debug(category: LogCategory, message: string, data?: unknown, userId?: string): void;
  debug(message: string, data?: unknown): void;
  debug(arg1: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      // 카테고리 생략 호출 지원
      this.log(LogLevel.DEBUG, LogCategory.SYSTEM, arg1, arg2);
    } else {
      this.log(LogLevel.DEBUG, arg1 as LogCategory, arg2 as string, arg3, arg4);
    }
  }

  /**
   * 정보 로그
   */
  info(category: LogCategory, message: string, data?: unknown, userId?: string): void;
  info(message: string, data?: unknown): void;
  info(arg1: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      this.log(LogLevel.INFO, LogCategory.SYSTEM, arg1, arg2);
    } else {
      this.log(LogLevel.INFO, arg1 as LogCategory, arg2 as string, arg3, arg4);
    }
  }

  /**
   * 경고 로그
   */
  warn(category: LogCategory, message: string, data?: unknown, userId?: string): void;
  warn(message: string, data?: unknown): void;
  warn(arg1: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      this.log(LogLevel.WARN, LogCategory.SYSTEM, arg1, arg2);
    } else {
      this.log(LogLevel.WARN, arg1 as LogCategory, arg2 as string, arg3, arg4);
    }
  }

  /**
   * 에러 로그
   */
  error(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>, userId?: string): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  error(arg1: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown, arg5?: unknown): void {
    if (typeof arg1 === 'string') {
      const message = arg1 as string;
      const error = arg2 as Error | undefined;
      const data = arg3 as Record<string, unknown> | undefined;
      const logData: Record<string, unknown> = {
        ...(data || {}),
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };
      this.log(LogLevel.ERROR, LogCategory.SYSTEM, message, logData);
    } else {
      const category = arg1 as LogCategory;
      const message = arg2 as string;
      const error = arg3 as Error | undefined;
      const data = arg4 as Record<string, unknown> | undefined;
      const userId = arg5 as string | undefined;
      const logData: Record<string, unknown> = {
        ...(data || {}),
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };
      this.log(LogLevel.ERROR, category, message, logData, userId);
    }
  }

  /**
   * 크리티컬 로그
   */
  critical(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>, userId?: string): void;
  critical(message: string, error?: Error, data?: Record<string, unknown>): void;
  critical(arg1: unknown, arg2?: unknown, arg3?: unknown, arg4?: unknown, arg5?: unknown): void {
    if (typeof arg1 === 'string') {
      const message = arg1 as string;
      const error = arg2 as Error | undefined;
      const data = arg3 as Record<string, unknown> | undefined;
      const logData: Record<string, unknown> = {
        ...(data || {}),
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };
      this.log(LogLevel.CRITICAL, LogCategory.SYSTEM, message, logData);
    } else {
      const category = arg1 as LogCategory;
      const message = arg2 as string;
      const error = arg3 as Error | undefined;
      const data = arg4 as Record<string, unknown> | undefined;
      const userId = arg5 as string | undefined;
      const logData: Record<string, unknown> = {
        ...(data || {}),
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      };
      this.log(LogLevel.CRITICAL, category, message, logData, userId);
    }
  }

  /**
   * 게임 이벤트 로그
   */
  logGameEvent(eventType: string, playerId: string, playerName: string, data: unknown, result?: unknown): void {
    const eventLog: GameEventLog = {
      eventType,
      playerId,
      playerName,
      timestamp: TimeUtils.now(),
      data,
      result
    };

    this.info(LogCategory.PLAYER, `게임 이벤트: ${eventType}`, eventLog, playerId);
  }

  /**
   * 시스템 메트릭 로그
   */
  logSystemMetrics(metrics: Omit<SystemMetricsLog, 'timestamp'>): void {
    const metricsLog: SystemMetricsLog = {
      ...metrics,
      timestamp: TimeUtils.now()
    };

    this.info(LogCategory.SYSTEM, '시스템 메트릭', metricsLog);
  }

  /**
   * 성능 측정 로그
   */
  logPerformance(operation: string, duration: number, details?: unknown): void {
    this.info(LogCategory.PERFORMANCE, `성능 측정: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      details
    });
  }

  /**
   * API 호출 로그
   */
  logApiCall(
    method: string, 
    url: string, 
    statusCode: number, 
    duration: number, 
    userId?: string
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, LogCategory.API, `API 호출: ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration: `${duration}ms`
    }, userId);
  }

  /**
   * 보안 이벤트 로그
   */
  logSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high', details: Record<string, unknown>, userId?: string): void {
    const level = severity === 'high' ? LogLevel.ERROR : 
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, LogCategory.SECURITY, `보안 이벤트: ${eventType}`, {
      eventType,
      severity,
      ...details
    }, userId);
  }

  /**
   * 버퍼 플러시
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // 콘솔 출력
      if (this.config.outputs.console) {
        this.outputToConsole(entries);
      }

      // 파일 출력
      if (this.config.outputs.file) {
        await this.outputToFile(entries);
      }

      // 데이터베이스 출력
      if (this.config.outputs.database) {
        await this.outputToDatabase(entries);
      }

      // 웹훅 출력
      if (this.config.outputs.webhook) {
        await this.outputToWebhook(entries);
      }

      this.lastFlush = Date.now();
    } catch (error) {
      console.error('로그 플러시 실패:', error);
      // 실패한 로그들을 다시 버퍼에 추가
      this.buffer.unshift(...entries);
    }
  }

  /**
   * 콘솔 출력
   */
  private outputToConsole(entries: LogEntry[]): void {
    for (const entry of entries) {
      const timestamp = TimeUtils.formatTimestamp(entry.timestamp);
      const levelName = LogLevel[entry.level];
      const prefix = `[${timestamp}] [${levelName}] [${entry.category}]`;
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(`${prefix} ${entry.message}`, entry.data ?? '');
          break;
        case LogLevel.INFO:
          console.info(`${prefix} ${entry.message}`, entry.data ?? '');
          break;
        case LogLevel.WARN:
          console.warn(`${prefix} ${entry.message}`, entry.data ?? '');
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(`${prefix} ${entry.message}`, entry.data ?? '');
          if (entry.stackTrace) {
            console.error(entry.stackTrace);
          }
          break;
      }
    }
  }

  /**
   * 파일 출력 (실제 파일 시스템 구현 필요)
   */
  private async outputToFile(entries: LogEntry[]): Promise<void> {
    // 실제 구현에서는 Node.js fs 모듈 사용
    try {
      const logContent = entries.map(entry => {
        return JSON.stringify({
          ...entry,
          timestamp: entry.timestamp,
          level: LogLevel[entry.level]
        });
      }).join('\n');

      // 파일 저장 로직 (예시)
      console.log('로그 파일 저장:', logContent);
    } catch (error) {
      console.error('파일 로그 저장 실패:', error);
    }
  }

  /**
   * 데이터베이스 출력
   */
  private async outputToDatabase(entries: LogEntry[]): Promise<void> {
    try {
      // 실제 구현에서는 데이터베이스 연결 및 저장
      console.log('데이터베이스에 로그 저장:', entries.length);
    } catch (error) {
      console.error('데이터베이스 로그 저장 실패:', error);
    }
  }

  /**
   * 웹훅 출력
   */
  private async outputToWebhook(entries: LogEntry[]): Promise<void> {
    try {
      // 중요한 로그만 웹훅으로 전송
      const importantLogs = entries.filter(entry => entry.level >= LogLevel.WARN);
      
      if (importantLogs.length > 0) {
        // 실제 구현에서는 HTTP 요청 전송
        console.log('웹훅으로 중요 로그 전송:', importantLogs.length);
      }
    } catch (error) {
      console.error('웹훅 로그 전송 실패:', error);
    }
  }

  /**
   * 주기적 플러시
   */
  private startPeriodicFlush(): void {
    const interval = this.config.flushInterval || 30000; // 기본 30초
    
    setInterval(() => {
      if (this.buffer.length > 0 && Date.now() - this.lastFlush > interval) {
        this.flush();
      }
    }, interval);
  }

  /**
   * 로그 검색
   */
  async searchLogs(filter: LogFilter, limit: number = 100): Promise<LogEntry[]> {
    // 실제 구현에서는 데이터베이스 검색
    // 여기서는 간단한 예시만 제공
    console.log('로그 검색:', filter);
    return [];
  }

  /**
   * 로그 통계
   */
  async getLogStats(startTime: string, endTime: string): Promise<{
    totalLogs: number;
    levelCounts: Record<string, number>;
    categoryCounts: Record<string, number>;
    userCounts: Record<string, number>;
  }> {
    // 실제 구현에서는 데이터베이스 집계
    return {
      totalLogs: 0,
      levelCounts: {},
      categoryCounts: {},
      userCounts: {}
    };
  }

  /**
   * 로그 정리 (오래된 로그 삭제)
   */
  async cleanupLogs(olderThanDays: number): Promise<number> {
    // 실제 구현에서는 데이터베이스에서 삭제
    console.log(`${olderThanDays}일 이전 로그 정리`);
    return 0;
  }

  // 유틸리티 메서드들
  private generateLogId(): string {
    return `log_${Date.now()}_${++this.logCounter}`;
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3).join('\n') : '';
  }

  private collectMetadata(): Record<string, unknown> {
    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      timestamp: Date.now(),
      random: Math.random()
    };
  }
}

// 게임 특화 로거
export class GameLogger extends Logger {
  constructor(config: LogConfig) {
    super(config);
  }

  /**
   * 플레이어 로그인
   */
  logPlayerLogin(playerId: string, playerName: string, ipAddress?: string): void {
    this.info(LogCategory.PLAYER, '플레이어 로그인', {
      action: 'login',
      playerId,
      playerName,
      ipAddress
    }, playerId);
  }

  /**
   * 플레이어 로그아웃
   */
  logPlayerLogout(playerId: string, playerName: string, sessionDuration?: number): void {
    this.info(LogCategory.PLAYER, '플레이어 로그아웃', {
      action: 'logout',
      playerId,
      playerName,
      sessionDuration: sessionDuration ? `${sessionDuration}ms` : undefined
    }, playerId);
  }

  /**
   * 레벨업 로그
   */
  logLevelUp(playerId: string, playerName: string, oldLevel: number, newLevel: number): void {
    this.info(LogCategory.PLAYER, '레벨업', {
      action: 'levelup',
      playerId,
      playerName,
      oldLevel,
      newLevel,
      levelGain: newLevel - oldLevel
    }, playerId);
  }

  /**
   * 아이템 획득 로그
   */
  logItemObtain(
    playerId: string, 
    playerName: string, 
    itemId: string, 
    itemName: string, 
    quantity: number,
    source: string
  ): void {
    this.info(LogCategory.ITEM, '아이템 획득', {
      action: 'item_obtain',
      playerId,
      playerName,
      itemId,
      itemName,
      quantity,
      source
    }, playerId);
  }

  /**
   * 아이템 사용 로그
   */
  logItemUse(
    playerId: string, 
    playerName: string, 
    itemId: string, 
    itemName: string, 
    quantity: number
  ): void {
    this.info(LogCategory.ITEM, '아이템 사용', {
      action: 'item_use',
      playerId,
      playerName,
      itemId,
      itemName,
      quantity
    }, playerId);
  }

  /**
   * 전투 시작 로그
   */
  logBattleStart(
    playerId: string, 
    playerName: string, 
    enemyType: string, 
    battleId: string
  ): void {
    this.info(LogCategory.BATTLE, '전투 시작', {
      action: 'battle_start',
      playerId,
      playerName,
      enemyType,
      battleId
    }, playerId);
  }

  /**
   * 전투 종료 로그
   */
  logBattleEnd(
    playerId: string, 
    playerName: string, 
    battleId: string,
    result: 'victory' | 'defeat' | 'flee',
    duration: number,
    rewards?: Record<string, unknown>
  ): void {
    this.info(LogCategory.BATTLE, '전투 종료', {
      action: 'battle_end',
      playerId,
      playerName,
      battleId,
      result,
      duration: `${duration}ms`,
      rewards
    }, playerId);
  }

  /**
   * 퀘스트 완료 로그
   */
  logQuestComplete(
    playerId: string, 
    playerName: string, 
    questId: string, 
    questName: string,
    rewards: Record<string, unknown>
  ): void {
    this.info(LogCategory.QUEST, '퀘스트 완료', {
      action: 'quest_complete',
      playerId,
      playerName,
      questId,
      questName,
      rewards
    }, playerId);
  }

  /**
   * 거래 로그
   */
  logTrade(
    sellerId: string,
    sellerName: string,
    buyerId: string,
    buyerName: string,
    itemId: string,
    itemName: string,
    quantity: number,
    price: number
  ): void {
    this.info(LogCategory.TRADE, '아이템 거래', {
      action: 'trade',
      sellerId,
      sellerName,
      buyerId,
      buyerName,
      itemId,
      itemName,
      quantity,
      price
    }, sellerId);
  }

  /**
   * 치팅 의심 로그
   */
  logSuspiciousActivity(
    playerId: string,
    playerName: string,
    activityType: string,
    details: Record<string, unknown>,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    this.logSecurityEvent('suspicious_activity', severity, {
      playerId,
      playerName,
      activityType,
      details
    }, playerId);
  }
}

// 기본 로그 설정
export const defaultLogConfig: LogConfig = {
  level: LogLevel.INFO,
  outputs: {
    console: true,
    file: true,
    database: false,
    webhook: false
  },
  maxFileSize: 10, // 10MB
  maxLogFiles: 5,
  enableStackTrace: true,
  enableMetadata: false,
  bufferSize: 100,
  flushInterval: 30000 // 30초
};

// 싱글톤 인스턴스들
export const logger = new Logger(defaultLogConfig);
export const gameLogger = new GameLogger(defaultLogConfig);

// 개발/프로덕션 환경별 로거
export const devLogger = new GameLogger({
  ...defaultLogConfig,
  level: LogLevel.DEBUG,
  outputs: {
    console: true,
    file: false,
    database: false,
    webhook: false
  }
});

export const prodLogger = new GameLogger({
  ...defaultLogConfig,
  level: LogLevel.INFO,
  outputs: {
    console: false,
    file: true,
    database: true,
    webhook: true
  }
});