/**
 * 메모리 기반 캐시 시스템
 * JSON 데이터의 빠른 접근을 위한 메모리 캐싱
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live (ms)
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
}

interface CacheOptions {
  maxSize?: number; // 최대 캐시 크기 (바이트)
  maxEntries?: number; // 최대 엔트리 수
  defaultTTL?: number; // 기본 TTL (ms)
  cleanupInterval?: number; // 정리 간격 (ms)
}

export class DataCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0
  };
  
  private maxSize: number;
  private maxEntries: number;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB
    this.maxEntries = options.maxEntries || 10000;
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 30분
    
    // 자동 정리 시작
    if (options.cleanupInterval !== 0) {
      this.startCleanup(options.cleanupInterval || 60000); // 1분
    }
  }
  
  /**
   * 캐시에서 데이터 조회
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // 접근 통계 업데이트
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    
    return entry.data as T;
  }
  
  /**
   * 캐시에 데이터 저장
   */
  set<T = any>(key: string, data: T, ttl?: number): boolean {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;
    const dataSize = this.calculateSize(data);
    
    // 기존 엔트리가 있으면 크기에서 제거
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.size;
      this.stats.entryCount--;
    }
    
    // 용량 확인 및 정리
    if (!this.hasSpace(dataSize)) {
      this.evictLRU();
    }
    
    // 새 엔트리 생성
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
      size: dataSize
    };
    
    this.cache.set(key, entry);
    this.stats.totalSize += dataSize;
    this.stats.entryCount++;
    this.stats.sets++;
    
    return true;
  }
  
  /**
   * 캐시에서 데이터 삭제
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.stats.entryCount--;
    this.stats.deletes++;
    
    return true;
  }
  
  /**
   * 키 존재 확인
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * 캐시 완전 정리
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
  }
  
  /**
   * 만료된 엔트리 정리
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  /**
   * LRU 방식으로 엔트리 제거
   */
  private evictLRU(): void {
    if (this.cache.size === 0) return;
    
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  /**
   * 데이터 크기 계산
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch (error) {
      // Blob을 사용할 수 없는 환경에서는 문자열 길이로 추정
      return JSON.stringify(data).length * 2; // UTF-16 추정
    }
  }
  
  /**
   * 저장 공간 확인
   */
  private hasSpace(newEntrySize: number): boolean {
    return (
      this.stats.totalSize + newEntrySize <= this.maxSize &&
      this.stats.entryCount < this.maxEntries
    );
  }
  
  /**
   * 자동 정리 시작
   */
  private startCleanup(interval: number): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);
  }
  
  /**
   * 자동 정리 중지
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats & {
    hitRate: number;
    averageEntrySize: number;
    memoryUsage: string;
  } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const averageEntrySize = this.stats.entryCount > 0 ? this.stats.totalSize / this.stats.entryCount : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      averageEntrySize: Math.round(averageEntrySize),
      memoryUsage: this.formatBytes(this.stats.totalSize)
    };
  }
  
  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * 캐시 상태 리포트
   */
  getReport(): {
    summary: string;
    performance: string;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];
    
    // 성능 분석 및 권장사항
    if (stats.hitRate < 50) {
      recommendations.push('캐시 적중률이 낮습니다. TTL을 늘리거나 캐시 크기를 확대하세요.');
    }
    
    if (stats.evictions > stats.sets * 0.1) {
      recommendations.push('제거된 엔트리가 많습니다. 캐시 크기를 늘리거나 TTL을 줄이세요.');
    }
    
    if (stats.totalSize > this.maxSize * 0.9) {
      recommendations.push('캐시 사용량이 높습니다. 정리 주기를 단축하거나 크기를 늘리세요.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('캐시가 효율적으로 작동하고 있습니다.');
    }
    
    return {
      summary: `캐시 엔트리: ${stats.entryCount}개, 메모리 사용량: ${stats.memoryUsage}, 적중률: ${stats.hitRate}%`,
      performance: `요청 ${stats.hits + stats.misses}회 중 ${stats.hits}회 적중 (${stats.misses}회 실패)`,
      recommendations
    };
  }
}

/**
 * 게임 데이터 전용 캐시 매니저
 */
export class GameDataCache {
  private skillsCache = new DataCache({ defaultTTL: 10 * 60 * 1000 }); // 10분
  private monstersCache = new DataCache({ defaultTTL: 15 * 60 * 1000 }); // 15분
  private itemsCache = new DataCache({ defaultTTL: 20 * 60 * 1000 }); // 20분
  private eventsCache = new DataCache({ defaultTTL: 5 * 60 * 1000 }); // 5분
  private playersCache = new DataCache({ defaultTTL: 2 * 60 * 1000 }); // 2분
  
  /**
   * 스킬 데이터 캐싱
   */
  getSkills(key: string = 'all'): any {
    return this.skillsCache.get(key);
  }
  
  setSkills(data: any, key: string = 'all'): void {
    this.skillsCache.set(key, data);
  }
  
  /**
   * 몬스터 데이터 캐싱
   */
  getMonsters(key: string = 'all'): any {
    return this.monstersCache.get(key);
  }
  
  setMonsters(data: any, key: string = 'all'): void {
    this.monstersCache.set(key, data);
  }
  
  /**
   * 아이템 데이터 캐싱
   */
  getItems(key: string = 'all'): any {
    return this.itemsCache.get(key);
  }
  
  setItems(data: any, key: string = 'all'): void {
    this.itemsCache.set(key, data);
  }
  
  /**
   * 이벤트 데이터 캐싱
   */
  getEvents(key: string = 'all'): any {
    return this.eventsCache.get(key);
  }
  
  setEvents(data: any, key: string = 'all'): void {
    this.eventsCache.set(key, data);
  }
  
  /**
   * 플레이어 데이터 캐싱
   */
  getPlayer(playerId: string): any {
    return this.playersCache.get(playerId);
  }
  
  setPlayer(playerId: string, data: any): void {
    this.playersCache.set(playerId, data);
  }
  
  /**
   * 데이터 무효화
   */
  invalidateSkills(): void {
    this.skillsCache.clear();
  }
  
  invalidateMonsters(): void {
    this.monstersCache.clear();
  }
  
  invalidateItems(): void {
    this.itemsCache.clear();
  }
  
  invalidateEvents(): void {
    this.eventsCache.clear();
  }
  
  invalidatePlayer(playerId: string): void {
    this.playersCache.delete(playerId);
  }
  
  /**
   * 전체 캐시 정리
   */
  clearAll(): void {
    this.skillsCache.clear();
    this.monstersCache.clear();
    this.itemsCache.clear();
    this.eventsCache.clear();
    this.playersCache.clear();
  }
  
  /**
   * 통합 통계
   */
  getOverallStats(): {
    skills: ReturnType<DataCache['getStats']>;
    monsters: ReturnType<DataCache['getStats']>;
    items: ReturnType<DataCache['getStats']>;
    events: ReturnType<DataCache['getStats']>;
    players: ReturnType<DataCache['getStats']>;
    total: {
      memoryUsage: string;
      totalHits: number;
      totalMisses: number;
      overallHitRate: number;
    };
  } {
    const skillsStats = this.skillsCache.getStats();
    const monstersStats = this.monstersCache.getStats();
    const itemsStats = this.itemsCache.getStats();
    const eventsStats = this.eventsCache.getStats();
    const playersStats = this.playersCache.getStats();
    
    const totalHits = skillsStats.hits + monstersStats.hits + itemsStats.hits + eventsStats.hits + playersStats.hits;
    const totalMisses = skillsStats.misses + monstersStats.misses + itemsStats.misses + eventsStats.misses + playersStats.misses;
    const totalSize = skillsStats.totalSize + monstersStats.totalSize + itemsStats.totalSize + eventsStats.totalSize + playersStats.totalSize;
    
    const overallHitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;
    
    return {
      skills: skillsStats,
      monsters: monstersStats,
      items: itemsStats,
      events: eventsStats,
      players: playersStats,
      total: {
        memoryUsage: this.formatBytes(totalSize),
        totalHits,
        totalMisses,
        overallHitRate: Math.round(overallHitRate * 100) / 100
      }
    };
  }
  
  /**
   * 바이트를 읽기 쉬운 형태로 변환
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
  
  /**
   * 캐시 정리 모든 타입
   */
  cleanup(): {
    skillsCleaned: number;
    monstersCleaned: number;
    itemsCleaned: number;
    eventsCleaned: number;
    playersCleaned: number;
  } {
    return {
      skillsCleaned: this.skillsCache.cleanup(),
      monstersCleaned: this.monstersCache.cleanup(),
      itemsCleaned: this.itemsCache.cleanup(),
      eventsCleaned: this.eventsCache.cleanup(),
      playersCleaned: this.playersCache.cleanup()
    };
  }
}

// 싱글톤 캐시 인스턴스
export const gameDataCache = new GameDataCache();

export { CacheEntry, CacheStats, CacheOptions };
