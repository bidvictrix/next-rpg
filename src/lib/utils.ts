/**
 * 공통 유틸리티 함수들
 */

// 시간 관련 유틸리티
export class TimeUtils {
  /**
   * 현재 타임스탬프 (ISO 문자열)
   */
  static now(): string {
    return new Date().toISOString();
  }

  /**
   * 타임스탬프를 읽기 쉬운 형태로 변환
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * 두 시간 사이의 차이 (밀리초)
   */
  static timeDiff(start: string, end: string = TimeUtils.now()): number {
    return new Date(end).getTime() - new Date(start).getTime();
  }

  /**
   * 시간 차이를 읽기 쉬운 형태로 변환
   */
  static formatTimeDiff(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일`;
    if (hours > 0) return `${hours}시간`;
    if (minutes > 0) return `${minutes}분`;
    return `${seconds}초`;
  }

  /**
   * 쿨다운 시간 계산
   */
  static calculateCooldownRemaining(lastUsed: string, cooldownSeconds: number): number {
    const timePassed = TimeUtils.timeDiff(lastUsed) / 1000;
    return Math.max(0, cooldownSeconds - timePassed);
  }

  /**
   * 시간 기반 시드 생성
   */
  static generateTimeSeed(): number {
    return Date.now() % 1000000;
  }
}

// 수학 관련 유틸리티
export class MathUtils {
  /**
   * 범위 내 랜덤 정수
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 범위 내 랜덤 실수
   */
  static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * 확률 체크 (0-100%)
   */
  static chance(percentage: number): boolean {
    return Math.random() * 100 < percentage;
  }

  /**
   * 가중치 기반 랜덤 선택
   */
  static weightedRandom<T>(items: Array<{ item: T; weight: number }>): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    for (const { item, weight } of items) {
      if (randomWeight < weight) {
        return item;
      }
      randomWeight -= weight;
    }

    return items[items.length - 1].item;
  }

  /**
   * 값을 범위 내로 제한
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 선형 보간
   */
  static lerp(start: number, end: number, factor: number): number {
    return start + (end - start) * factor;
  }

  /**
   * 퍼센트 계산
   */
  static percentage(value: number, total: number): number {
    return total === 0 ? 0 : (value / total) * 100;
  }

  /**
   * 두 점 사이의 거리
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * 숫자를 천 단위로 구분하여 포맷
   */
  static formatNumber(num: number): string {
    return new Intl.NumberFormat('ko-KR').format(num);
  }

  /**
   * 큰 숫자를 축약형으로 변환 (K, M, B 등)
   */
  static abbreviateNumber(num: number): string {
    const abbreviations = [
      { value: 1e12, symbol: 'T' },
      { value: 1e9, symbol: 'B' },
      { value: 1e6, symbol: 'M' },
      { value: 1e3, symbol: 'K' }
    ];

    for (const { value, symbol } of abbreviations) {
      if (num >= value) {
        return (num / value).toFixed(1) + symbol;
      }
    }

    return num.toString();
  }
}

// 문자열 관련 유틸리티
export class StringUtils {
  /**
   * UUID 생성
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 랜덤 문자열 생성
   */
  static randomString(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * 문자열 해시 생성 (단순한 해시)
   */
  static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash);
  }

  /**
   * 문자열 자르기 (말줄임)
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 카멜케이스를 스네이크케이스로 변환
   */
  static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * 스네이크케이스를 카멜케이스로 변환
   */
  static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 이름 마스킹 (개인정보 보호)
   */
  static maskName(name: string): string {
    if (name.length <= 2) return name;
    const first = name.charAt(0);
    const last = name.charAt(name.length - 1);
    const middle = '*'.repeat(name.length - 2);
    return first + middle + last;
  }

  /**
   * 이메일 마스킹
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1)
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  }
}

// 배열 관련 유틸리티
export class ArrayUtils {
  /**
   * 배열 셔플
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 배열에서 랜덤 요소 선택
   */
  static randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 배열에서 중복 제거
   */
  static unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  /**
   * 배열을 청크로 분할
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 배열의 교집합
   */
  static intersection<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => array2.includes(item));
  }

  /**
   * 배열의 차집합
   */
  static difference<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => !array2.includes(item));
  }

  /**
   * 배열을 그룹화
   */
  static groupBy<T, K extends keyof any>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  /**
   * 배열의 최대값과 최소값
   */
  static minMax(array: number[]): { min: number; max: number } {
    return {
      min: Math.min(...array),
      max: Math.max(...array)
    };
  }

  /**
   * 배열의 합계
   */
  static sum(array: number[]): number {
    return array.reduce((sum, num) => sum + num, 0);
  }

  /**
   * 배열의 평균
   */
  static average(array: number[]): number {
    return array.length === 0 ? 0 : ArrayUtils.sum(array) / array.length;
  }
}

// 객체 관련 유틸리티
export class ObjectUtils {
  /**
   * 깊은 복사
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => ObjectUtils.deepClone(item)) as any;
    if (typeof obj === 'object') {
      const cloned = {} as { [key: string]: any };
      Object.keys(obj).forEach(key => {
        cloned[key] = ObjectUtils.deepClone((obj as any)[key]);
      });
      return cloned as T;
    }
    return obj;
  }

  /**
   * 중첩 객체에서 값 가져오기
   */
  static get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }

  /**
   * 중첩 객체에 값 설정
   */
  static set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * 객체 평탄화
   */
  static flatten(obj: any, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, ObjectUtils.flatten(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }

  /**
   * 객체 키-값 바꾸기
   */
  static invert(obj: Record<string, string>): Record<string, string> {
    const inverted: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      inverted[value] = key;
    }
    return inverted;
  }

  /**
   * 객체에서 특정 키들만 선택
   */
  static pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * 객체에서 특정 키들 제외
   */
  static omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
}

// 색상 관련 유틸리티
export class ColorUtils {
  /**
   * 희소성에 따른 색상 반환
   */
  static getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      common: '#ffffff',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000',
      mythic: '#e6cc80'
    };
    return colors[rarity] || colors.common;
  }

  /**
   * 랜덤 색상 생성
   */
  static randomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  }

  /**
   * 색상을 밝게/어둡게 조정
   */
  static adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
}

// 게임 관련 유틸리티
export class GameUtils {
  /**
   * 레벨에 따른 색상 그라데이션
   */
  static getLevelColor(level: number): string {
    if (level < 10) return '#cccccc';
    if (level < 25) return '#00ff00';
    if (level < 50) return '#0080ff';
    if (level < 100) return '#8000ff';
    if (level < 200) return '#ff8000';
    return '#ff0080';
  }

  /**
   * 경험치 바 퍼센트 계산
   */
  static calculateExpBarPercent(currentExp: number, totalExp: number): number {
    return MathUtils.clamp(MathUtils.percentage(currentExp, totalExp), 0, 100);
  }

  /**
   * 플레이어 레벨 추천 콘텐츠
   */
  static getRecommendedContent(playerLevel: number): string[] {
    const content: string[] = [];
    
    if (playerLevel >= 1) content.push('초보자 퀘스트');
    if (playerLevel >= 5) content.push('슬라임 사냥');
    if (playerLevel >= 10) content.push('고블린 던전');
    if (playerLevel >= 20) content.push('PvP 전투');
    if (playerLevel >= 30) content.push('길드 가입');
    if (playerLevel >= 50) content.push('레이드 던전');
    
    return content;
  }

  /**
   * 아이템 등급 정렬 순서
   */
  static getRarityOrder(rarity: string): number {
    const order: Record<string, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
      mythic: 6
    };
    return order[rarity] || 0;
  }

  /**
   * 데미지 텍스트 색상
   */
  static getDamageColor(damageType: string): string {
    const colors: Record<string, string> = {
      physical: '#ffffff',
      fire: '#ff4444',
      ice: '#44aaff',
      lightning: '#ffff44',
      poison: '#44ff44',
      heal: '#44ff44',
      critical: '#ff8800'
    };
    return colors[damageType] || colors.physical;
  }

  /**
   * 스탯 아이콘 이모지
   */
  static getStatIcon(stat: string): string {
    const icons: Record<string, string> = {
      str: '💪',
      dex: '🏃',
      int: '🧠',
      vit: '❤️',
      luk: '🍀',
      hp: '💙',
      mp: '💜',
      atk: '⚔️',
      def: '🛡️'
    };
    return icons[stat] || '📊';
  }
}

// 검증 관련 유틸리티
export class ValidationUtils {
  /**
   * 이메일 형식 검증
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 사용자명 검증 (영문, 숫자, 언더바만 허용, 3-20자)
   */
  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * 캐릭터명 검증 (한글, 영문, 숫자 허용, 2-12자)
   */
  static isValidCharacterName(name: string): boolean {
    const nameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
    return nameRegex.test(name);
  }

  /**
   * 숫자 범위 검증
   */
  static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * 배열이 비어있지 않은지 검증
   */
  static isNonEmptyArray<T>(arr: T[]): boolean {
    return Array.isArray(arr) && arr.length > 0;
  }

  /**
   * 객체가 비어있지 않은지 검증
   */
  static isNonEmptyObject(obj: any): boolean {
    return typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0;
  }

  /**
   * 문자열이 유효한지 검증
   */
  static isValidString(str: string, minLength: number = 1, maxLength: number = 1000): boolean {
    return typeof str === 'string' && str.trim().length >= minLength && str.length <= maxLength;
  }
}

// 디버그 관련 유틸리티
export class DebugUtils {
  /**
   * 객체를 보기 좋게 출력
   */
  static prettyPrint(obj: any): void {
    console.log(JSON.stringify(obj, null, 2));
  }

  /**
   * 실행 시간 측정
   */
  static measureTime<T>(fn: () => T, label: string = 'Operation'): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    console.log(`${label} took ${endTime - startTime} milliseconds`);
    return result;
  }

  /**
   * 조건부 로그
   */
  static conditionalLog(condition: boolean, message: string, ...args: any[]): void {
    if (condition) {
      console.log(message, ...args);
    }
  }

  /**
   * 스택 트레이스 출력
   */
  static printStackTrace(): void {
    console.trace();
  }
}

// 성능 관련 유틸리티
export class PerformanceUtils {
  private static timers: Map<string, number> = new Map();

  /**
   * 타이머 시작
   */
  static startTimer(name: string): void {
    PerformanceUtils.timers.set(name, performance.now());
  }

  /**
   * 타이머 종료 및 경과 시간 반환
   */
  static endTimer(name: string): number | null {
    const startTime = PerformanceUtils.timers.get(name);
    if (startTime === undefined) return null;
    
    const elapsed = performance.now() - startTime;
    PerformanceUtils.timers.delete(name);
    return elapsed;
  }

  /**
   * 메모리 사용량 정보 (Node.js 환경에서만)
   */
  static getMemoryUsage(): any {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }

  /**
   * 함수 debounce
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * 함수 throttle
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }
}

// CSS 클래스 합치기 유틸리티 (tailwind-merge와 유사)
export class ClassUtils {
  /**
   * 클래스명을 합치고 중복 제거
   */
  static cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 조건부 클래스 추가
   */
  static conditionalClass(condition: boolean, trueClass: string, falseClass?: string): string {
    return condition ? trueClass : (falseClass || '');
  }

  /**
   * 클래스 토글
   */
  static toggleClass(baseClasses: string, toggleClass: string, condition: boolean): string {
    const classes = baseClasses.split(' ').filter(Boolean);
    const toggleClasses = toggleClass.split(' ').filter(Boolean);
    
    if (condition) {
      // 추가
      toggleClasses.forEach(cls => {
        if (!classes.includes(cls)) {
          classes.push(cls);
        }
      });
    } else {
      // 제거
      toggleClasses.forEach(cls => {
        const index = classes.indexOf(cls);
        if (index > -1) {
          classes.splice(index, 1);
        }
      });
    }
    
    return classes.join(' ');
  }
}

// 편의를 위한 단축 함수
export const cn = ClassUtils.cn;

// 전체 유틸리티 모음 (편의용)
export const Utils = {
  Time: TimeUtils,
  Math: MathUtils,
  String: StringUtils,
  Array: ArrayUtils,
  Object: ObjectUtils,
  Color: ColorUtils,
  Game: GameUtils,
  Validation: ValidationUtils,
  Debug: DebugUtils,
  Performance: PerformanceUtils
};