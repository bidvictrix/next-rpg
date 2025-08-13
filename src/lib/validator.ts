/**
 * 데이터 검증 시스템
 */

import { Player, Stats } from '../types/player';
import { Item, Monster, Quest, Skill } from '../types/game';
import { ValidationUtils } from './utils';

// 검증 규칙 인터페이스
export interface ValidationRule<T = Record<string, unknown>> {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
  message?: string;
}

// 검증 결과
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: unknown;
}

// 검증 옵션
export interface ValidationOptions {
  strict?: boolean; // 엄격 모드 (모든 필드 검증)
  allowUnknown?: boolean; // 알려지지 않은 필드 허용
  warnings?: boolean; // 경고 메시지 포함
}

export class Validator {
  private rules: Map<string, ValidationRule[]> = new Map();

  /**
   * 검증 규칙 등록
   */
  addRules<T>(type: string, rules: ValidationRule<T>[]): void {
    this.rules.set(type, rules);
  }

  /**
   * 단일 값 검증
   */
  validateValue(value: unknown, rule: ValidationRule): ValidationError | null {
    const { field, required, type, min, max, pattern, custom, message } = rule;

    // 필수 값 검증
    if (required && (value === undefined || value === null || value === '')) {
      return {
        field: field as string,
        message: message || `${field}은(는) 필수 항목입니다.`,
        value
      };
    }

    // 값이 없고 필수가 아닌 경우 통과
    if (value === undefined || value === null) {
      return null;
    }

    // 타입 검증
    if (type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== type) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${type} 타입이어야 합니다.`,
          value
        };
      }
    }

    // 최소값/최소길이 검증
    if (min !== undefined) {
      if (typeof value === 'number' && value < min) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${min} 이상이어야 합니다.`,
          value
        };
      }
      if (typeof value === 'string' && value.length < min) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${min}자 이상이어야 합니다.`,
          value
        };
      }
      if (Array.isArray(value) && value.length < min) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${min}개 이상이어야 합니다.`,
          value
        };
      }
    }

    // 최대값/최대길이 검증
    if (max !== undefined) {
      if (typeof value === 'number' && value > max) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${max} 이하여야 합니다.`,
          value
        };
      }
      if (typeof value === 'string' && value.length > max) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${max}자 이하여야 합니다.`,
          value
        };
      }
      if (Array.isArray(value) && value.length > max) {
        return {
          field: field as string,
          message: message || `${field}은(는) ${max}개 이하여야 합니다.`,
          value
        };
      }
    }

    // 패턴 검증
    if (pattern && typeof value === 'string' && !pattern.test(value)) {
      return {
        field: field as string,
        message: message || `${field} 형식이 올바르지 않습니다.`,
        value
      };
    }

    // 커스텀 검증
    if (custom) {
      const customResult = custom(value);
      if (customResult !== true) {
        return {
          field: field as string,
          message: typeof customResult === 'string' ? customResult : (message || `${field} 검증에 실패했습니다.`),
          value
        };
      }
    }

    return null;
  }

  /**
   * 객체 검증
   */
  validate<T extends Record<string, unknown>>(
    type: string, 
    data: T, 
    options: ValidationOptions = {}
  ): ValidationResult {
    const rules = this.rules.get(type);
    if (!rules) {
      return { valid: false, errors: [{ field: 'type', message: `검증 규칙을 찾을 수 없습니다: ${type}` }] };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const { strict = false, allowUnknown = true, warnings: includeWarnings = false } = options;

    // 규칙에 따른 검증
    for (const rule of rules) {
      const fieldName = rule.field as string;
      const value = data[fieldName];
      const error = this.validateValue(value, rule);
      
      if (error) {
        errors.push(error);
      }
    }

    // 알려지지 않은 필드 검증
    if (!allowUnknown) {
      const ruleFields = new Set(rules.map(rule => rule.field as string));
      for (const field of Object.keys(data)) {
        if (!ruleFields.has(field)) {
          errors.push({
            field,
            message: `알 수 없는 필드입니다: ${field}`,
            value: data[field]
          });
        }
      }
    }

    // 경고 생성 (예: 권장하지 않는 값들)
    if (includeWarnings) {
      // 경고 로직은 필요에 따라 구현
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: includeWarnings ? warnings : undefined
    };
  }

  /**
   * 배열 검증
   */
  validateArray<T>(
    type: string, 
    items: T[], 
    options: ValidationOptions = {}
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const result = this.validate(type, items[i], options);
      if (!result.valid) {
        for (const error of result.errors) {
          errors.push({
            ...error,
            field: `[${i}].${error.field}`
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 게임 데이터 검증기
export class GameDataValidator extends Validator {
  constructor() {
    super();
    this.initializeRules();
  }

  private initializeRules(): void {
    // 플레이어 정보 검증 규칙
    this.addRules<Player['info']>('playerInfo', [
      {
        field: 'id',
        required: true,
        type: 'string',
        min: 1,
        max: 50,
        message: 'ID는 1-50자의 문자열이어야 합니다.'
      },
      {
        field: 'username',
        required: true,
        type: 'string',
        min: 3,
        max: 20,
        custom: ValidationUtils.isValidUsername,
        message: '사용자명은 3-20자의 영문, 숫자, 언더바만 허용됩니다.'
      },
      {
        field: 'characterName',
        required: true,
        type: 'string',
        min: 2,
        max: 12,
        custom: ValidationUtils.isValidCharacterName,
        message: '캐릭터명은 2-12자의 한글, 영문, 숫자만 허용됩니다.'
      },
      {
        field: 'email',
        required: true,
        type: 'string',
        custom: ValidationUtils.isValidEmail,
        message: '올바른 이메일 형식이 아닙니다.'
      },
      {
        field: 'class',
        required: true,
        type: 'string',
        custom: (value) => ['warrior', 'mage', 'archer', 'thief'].includes(value),
        message: '올바른 클래스를 선택해주세요.'
      }
    ]);

    // 플레이어 스탯 검증 규칙
    this.addRules<Stats>('playerStats', [
      { field: 'str', required: true, type: 'number', min: 0, max: 999999 },
      { field: 'dex', required: true, type: 'number', min: 0, max: 999999 },
      { field: 'int', required: true, type: 'number', min: 0, max: 999999 },
      { field: 'vit', required: true, type: 'number', min: 0, max: 999999 },
      { field: 'luk', required: true, type: 'number', min: 0, max: 999999 },
      { field: 'hp', required: false, type: 'number', min: 1 },
      { field: 'mp', required: false, type: 'number', min: 0 },
      { field: 'atk', required: false, type: 'number', min: 0 },
      { field: 'def', required: false, type: 'number', min: 0 },
      { field: 'acc', required: false, type: 'number', min: 0 },
      { field: 'eva', required: false, type: 'number', min: 0 },
      { field: 'crit', required: false, type: 'number', min: 0 }
    ]);

    // 플레이어 레벨 검증 규칙
    this.addRules<Player['level']>('playerLevel', [
      { field: 'level', required: true, type: 'number', min: 1, max: 999999 },
      { field: 'experience', required: true, type: 'number', min: 0 },
      { field: 'experienceToNext', required: true, type: 'number', min: 0 },
      { field: 'statPoints', required: true, type: 'number', min: 0 },
      { field: 'skillPoints', required: true, type: 'number', min: 0 }
    ]);

    // 인벤토리 아이템 검증 규칙
    this.addRules<InventoryItem>('inventoryItem', [
      {
        field: 'itemId',
        required: true,
        type: 'string',
        min: 1,
        max: 50
      },
      {
        field: 'quantity',
        required: true,
        type: 'number',
        min: 1,
        max: 999
      },
      {
        field: 'slot',
        required: true,
        type: 'number',
        min: 0
      }
    ]);

    // 아이템 데이터 검증 규칙
    this.addRules<Item>('item', [
      { field: 'id', required: true, type: 'string', min: 1, max: 50 },
      { field: 'name', required: true, type: 'string', min: 1, max: 100 },
      { field: 'description', required: true, type: 'string', max: 500 },
      { field: 'type', required: true, type: 'string' },
      { field: 'rarity', required: true, type: 'string' },
      { field: 'level', required: true, type: 'number', min: 1 },
      { field: 'value', required: true, type: 'number', min: 0 },
      { field: 'stackable', required: true, type: 'boolean' },
      { field: 'maxStack', required: true, type: 'number', min: 1 }
    ]);

    // 몬스터 데이터 검증 규칙
    this.addRules<Monster>('monster', [
      { field: 'id', required: true, type: 'string', min: 1, max: 50 },
      { field: 'name', required: true, type: 'string', min: 1, max: 100 },
      { field: 'description', required: true, type: 'string', max: 500 },
      { field: 'level', required: true, type: 'number', min: 1 },
      { field: 'type', required: true, type: 'string' },
      { field: 'element', required: true, type: 'string' }
    ]);

    // 퀘스트 데이터 검증 규칙
    this.addRules<Quest>('quest', [
      { field: 'id', required: true, type: 'string', min: 1, max: 50 },
      { field: 'name', required: true, type: 'string', min: 1, max: 100 },
      { field: 'description', required: true, type: 'string', max: 1000 },
      { field: 'type', required: true, type: 'string' },
      { field: 'requiredLevel', required: true, type: 'number', min: 1 },
      { field: 'maxLevel', required: false, type: 'number', min: 1 },
      { field: 'repeatable', required: true, type: 'boolean' }
    ]);

    // 스킬 데이터 검증 규칙
    this.addRules<Skill>('skill', [
      { field: 'id', required: true, type: 'string', min: 1, max: 50 },
      { field: 'name', required: true, type: 'string', min: 1, max: 100 },
      { field: 'description', required: true, type: 'string', max: 500 },
      { field: 'type', required: true, type: 'string' },
      { field: 'category', required: true, type: 'string' },
      { field: 'maxLevel', required: true, type: 'number', min: 1, max: 100 },
      { field: 'baseExperience', required: true, type: 'number', min: 1 },
      { field: 'experienceMultiplier', required: true, type: 'number', min: 1 }
    ]);
  }

  /**
   * 플레이어 전체 데이터 검증
   */
  validatePlayer(player: Player): ValidationResult {
    const errors: ValidationError[] = [];

    // 각 섹션별 검증
    const infoResult = this.validate('playerInfo', player.info);
    const statsResult = this.validate('playerStats', player.stats);
    const levelResult = this.validate('playerLevel', player.level);

    // 에러 수집
    errors.push(...infoResult.errors);
    errors.push(...statsResult.errors.map(e => ({ ...e, field: `stats.${e.field}` })));
    errors.push(...levelResult.errors.map(e => ({ ...e, field: `level.${e.field}` })));

    // 인벤토리 검증
    if (player.inventory && player.inventory.length > 0) {
      const inventoryResult = this.validateArray('inventoryItem', player.inventory);
      errors.push(...inventoryResult.errors.map(e => ({ ...e, field: `inventory${e.field}` })));
    }

    // 비즈니스 로직 검증
    const businessErrors = this.validatePlayerBusinessLogic(player);
    errors.push(...businessErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 플레이어 비즈니스 로직 검증
   */
  private validatePlayerBusinessLogic(player: Player): ValidationError[] {
    const errors: ValidationError[] = [];

    // 레벨과 경험치 일관성 검증
    if (player.level.level === 1 && player.level.experience < 0) {
      errors.push({
        field: 'level.experience',
        message: '1레벨에서 경험치는 0 이상이어야 합니다.',
        value: player.level.experience
      });
    }

    // 스탯 포인트 검증 (레벨당 기본 5포인트)
    const expectedTotalStats = player.level.level * 5 + 50; // 기본 스탯 50
    const currentTotalStats = player.stats.str + player.stats.dex + player.stats.int + 
                             player.stats.vit + player.stats.luk;
    const usedStatPoints = currentTotalStats - 50; // 기본 스탯 제외
    
    if (usedStatPoints + player.level.statPoints > player.level.level * 5) {
      errors.push({
        field: 'statPoints',
        message: '할당된 스탯 포인트가 획득 가능한 총량을 초과합니다.',
        value: { used: usedStatPoints, available: player.level.statPoints, total: player.level.level * 5 }
      });
    }

    // 인벤토리 용량 검증
    if (player.inventory.length > player.inventorySize) {
      errors.push({
        field: 'inventory',
        message: '인벤토리 용량을 초과했습니다.',
        value: { current: player.inventory.length, max: player.inventorySize }
      });
    }

    // 슬롯 중복 검증
    const usedSlots = new Set();
    for (const item of player.inventory) {
      if (usedSlots.has(item.slot)) {
        errors.push({
          field: 'inventory',
          message: `슬롯 ${item.slot}이 중복 사용되었습니다.`,
          value: item.slot
        });
      }
      usedSlots.add(item.slot);
    }

    // 골드 검증
    if (player.gold < 0) {
      errors.push({
        field: 'gold',
        message: '골드는 음수일 수 없습니다.',
        value: player.gold
      });
    }

    return errors;
  }

  /**
   * 게임 콘텐츠 검증 (아이템, 몬스터 등)
   */
  validateGameContent(type: string, data: unknown): ValidationResult {
    return this.validate(type, data);
  }

  /**
   * 서버-클라이언트 데이터 동기화 검증
   */
  validateSync(serverData: unknown, clientData: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // 중요한 필드들의 일치성 검증
    const criticalFields = ['level', 'experience', 'gold', 'stats'];
    
    for (const field of criticalFields) {
      if (JSON.stringify(serverData[field]) !== JSON.stringify(clientData[field])) {
        errors.push({
          field,
          message: `서버-클라이언트 데이터 불일치: ${field}`,
          value: { server: serverData[field], client: clientData[field] }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 실시간 검증 (전투, 거래 등)
   */
  validateRealTimeAction(action: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // 액션 타입 검증
    if (!action.type || typeof action.type !== 'string') {
      errors.push({
        field: 'type',
        message: '액션 타입이 필요합니다.',
        value: action.type
      });
    }

    // 타임스탬프 검증 (너무 오래된 액션 방지)
    if (action.timestamp) {
      const timeDiff = Date.now() - action.timestamp;
      if (timeDiff > 30000) { // 30초 이상 된 액션
        errors.push({
          field: 'timestamp',
          message: '액션이 너무 오래되었습니다.',
          value: action.timestamp
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 보안 검증기
export class SecurityValidator {
  /**
   * SQL 인젝션 패턴 검사
   */
  static checkSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\bOR\b.*=|AND.*=)/i,
      /(\bunion\b.*\bselect\b)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * XSS 패턴 검사
   */
  static checkXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe\b/i,
      /<object\b/i,
      /<embed\b/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * 입력값 sanitization
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // HTML 태그 제거
      .replace(/['"]/g, '') // 따옴표 제거
      .replace(/[;]/g, '') // 세미콜론 제거
      .trim();
  }

  /**
   * 안전한 문자열인지 검증
   */
  static isSafeString(input: string): boolean {
    return !SecurityValidator.checkSQLInjection(input) && 
           !SecurityValidator.checkXSS(input);
  }
}

// 싱글톤 인스턴스들
export const gameDataValidator = new GameDataValidator();
export const validator = new Validator();