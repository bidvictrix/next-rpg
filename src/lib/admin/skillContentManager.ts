import { Skill, SkillTree, SkillEffect, SkillRequirement } from '@/types/game';
import { logger } from '../logger';
import { dataManager } from '../dataManager';

// 스킬 템플릿
interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  type: SkillType;
  element: ElementType;
  targetType: TargetType;
  baseEffects: SkillEffect[];
  scalingFactors: ScalingFactor[];
  requirements: SkillRequirement[];
  metadata: SkillMetadata;
}

// 스킬 카테고리
type SkillCategory = 'combat' | 'magic' | 'passive' | 'crafting' | 'social' | 'movement' | 'utility';

// 스킬 타입
type SkillType = 'active' | 'passive' | 'toggle' | 'channeled' | 'instant' | 'charged';

// 원소 타입
type ElementType = 'none' | 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark' | 'physical' | 'arcane';

// 대상 타입
type TargetType = 'self' | 'ally' | 'enemy' | 'area' | 'all_enemies' | 'all_allies' | 'random';

// 스케일링 팩터
interface ScalingFactor {
  stat: string; // 스탯 이름 (str, int, dex 등)
  factor: number; // 배율
  type: 'linear' | 'quadratic' | 'logarithmic' | 'exponential';
}

// 스킬 메타데이터
interface SkillMetadata {
  version: string;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  modifiedBy: string;
  tags: string[];
  isActive: boolean;
  isPremium: boolean;
  unlockConditions: string[];
}

// 스킬 검증 결과
interface SkillValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// 검증 에러
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// 검증 경고
interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// 스킬 변경 로그
interface SkillChangeLog {
  id: string;
  skillId: string;
  changeType: ChangeType;
  timestamp: Date;
  author: string;
  changes: SkillChange[];
  reason: string;
  impact: ChangeImpact;
  approved: boolean;
  approver?: string;
  rollbackId?: string;
}

// 변경 타입
type ChangeType = 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'rollback';

// 스킬 변경사항
interface SkillChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeReason: string;
}

// 변경 영향도
interface ChangeImpact {
  affectedPlayers: number;
  balanceImpact: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  compatibilityIssues: string[];
  recommendedActions: string[];
}

// 스킬 승인 워크플로우
interface SkillApprovalWorkflow {
  id: string;
  skillId: string;
  changeLogId: string;
  status: ApprovalStatus;
  requiredApprovers: string[];
  currentApprovers: string[];
  rejectionReason?: string;
  createdAt: Date;
  deadline?: Date;
  priority: ApprovalPriority;
}

// 승인 상태
type ApprovalStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'cancelled';

// 승인 우선순위
type ApprovalPriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';

// 스킬 테스트 결과
interface SkillTestResult {
  skillId: string;
  testId: string;
  testType: TestType;
  status: TestStatus;
  results: TestResult[];
  executedAt: Date;
  duration: number;
  environment: TestEnvironment;
}

// 테스트 타입
type TestType = 'damage_calculation' | 'balance_check' | 'performance_test' | 'integration_test';

// 테스트 상태
type TestStatus = 'running' | 'passed' | 'failed' | 'skipped' | 'error';

// 테스트 결과
interface TestResult {
  testCase: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  errorMessage?: string;
}

// 테스트 환경
interface TestEnvironment {
  environment: 'sandbox' | 'staging' | 'production';
  playerLevel: number;
  playerStats: Record<string, number>;
  targetLevel?: number;
  conditions: string[];
}

export class SkillContentManager {
  private skills: Map<string, Skill> = new Map();
  private skillTemplates: Map<string, SkillTemplate> = new Map();
  private changeLogs: Map<string, SkillChangeLog> = new Map();
  private approvalWorkflows: Map<string, SkillApprovalWorkflow> = new Map();
  private testResults: Map<string, SkillTestResult> = new Map();
  private maxChangeHistory: number = 1000;

  constructor() {
    this.initializeSkillTemplates();
    this.loadExistingSkills();
  }

  /**
   * 기본 스킬 템플릿 초기화
   */
  private initializeSkillTemplates(): void {
    const defaultTemplates: SkillTemplate[] = [
      {
        id: 'basic_attack_template',
        name: '기본 공격 템플릿',
        description: '기본적인 물리 공격 스킬 템플릿',
        category: 'combat',
        type: 'active',
        element: 'physical',
        targetType: 'enemy',
        baseEffects: [
          {
            type: 'damage',
            value: 100,
            target: 'enemy',
            duration: 0,
            isPercentage: false
          }
        ],
        scalingFactors: [
          {
            stat: 'str',
            factor: 1.2,
            type: 'linear'
          }
        ],
        requirements: [
          {
            type: 'level',
            value: 1,
            description: '레벨 1 이상'
          }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          modifiedBy: 'system',
          tags: ['basic', 'physical', 'combat'],
          isActive: true,
          isPremium: false,
          unlockConditions: []
        }
      },
      {
        id: 'magic_spell_template',
        name: '마법 주문 템플릿',
        description: '기본적인 마법 공격 스킬 템플릿',
        category: 'magic',
        type: 'active',
        element: 'arcane',
        targetType: 'enemy',
        baseEffects: [
          {
            type: 'damage',
            value: 80,
            target: 'enemy',
            duration: 0,
            isPercentage: false
          }
        ],
        scalingFactors: [
          {
            stat: 'int',
            factor: 1.5,
            type: 'linear'
          }
        ],
        requirements: [
          {
            type: 'level',
            value: 5,
            description: '레벨 5 이상'
          },
          {
            type: 'stat',
            value: 10,
            stat: 'int',
            description: '지능 10 이상'
          }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          modifiedBy: 'system',
          tags: ['magic', 'spell', 'arcane'],
          isActive: true,
          isPremium: false,
          unlockConditions: ['learn_magic_basics']
        }
      },
      {
        id: 'passive_buff_template',
        name: '패시브 버프 템플릿',
        description: '지속적인 능력치 증가 패시브 스킬 템플릿',
        category: 'passive',
        type: 'passive',
        element: 'none',
        targetType: 'self',
        baseEffects: [
          {
            type: 'stat_bonus',
            value: 5,
            target: 'self',
            duration: -1,
            isPercentage: false,
            stat: 'str'
          }
        ],
        scalingFactors: [
          {
            stat: 'level',
            factor: 0.5,
            type: 'linear'
          }
        ],
        requirements: [
          {
            type: 'level',
            value: 10,
            description: '레벨 10 이상'
          }
        ],
        metadata: {
          version: '1.0',
          createdBy: 'system',
          createdAt: new Date(),
          lastModified: new Date(),
          modifiedBy: 'system',
          tags: ['passive', 'buff', 'permanent'],
          isActive: true,
          isPremium: false,
          unlockConditions: []
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.skillTemplates.set(template.id, template);
    });
  }

  /**
   * 기존 스킬 로드
   */
  private async loadExistingSkills(): Promise<void> {
    try {
      const skillsData = await dataManager.loadGameData('skills');
      if (skillsData && skillsData.skills) {
        skillsData.skills.forEach((skill: Skill) => {
          this.skills.set(skill.id, skill);
        });
      }
      logger.info(`스킬 ${this.skills.size}개 로드 완료`);
    } catch (error) {
      logger.error('스킬 로드 실패:', error);
    }
  }

  /**
   * 새 스킬 생성
   */
  async createSkill(
    skillData: Partial<Skill>,
    templateId?: string,
    author: string = 'admin'
  ): Promise<{ success: boolean; skillId?: string; errors?: ValidationError[] }> {
    
    let baseSkill: Partial<Skill> = {};

    // 템플릿 사용
    if (templateId) {
      const template = this.skillTemplates.get(templateId);
      if (!template) {
        return { success: false, errors: [{ field: 'template', message: '존재하지 않는 템플릿입니다.', severity: 'error' }] };
      }
      baseSkill = this.convertTemplateToSkill(template);
    }

    // 스킬 데이터 병합
    const skill: Skill = {
      id: skillData.id || `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: skillData.name || baseSkill.name || '새 스킬',
      description: skillData.description || baseSkill.description || '',
      type: skillData.type || baseSkill.type || 'active',
      element: skillData.element || baseSkill.element || 'none',
      targetType: skillData.targetType || baseSkill.targetType || 'enemy',
      level: skillData.level || 1,
      maxLevel: skillData.maxLevel || 10,
      cost: skillData.cost || { mp: 10 },
      cooldown: skillData.cooldown || 0,
      castTime: skillData.castTime || 0,
      range: skillData.range || 1,
      effects: skillData.effects || baseSkill.effects || [],
      requirements: skillData.requirements || baseSkill.requirements || [],
      tree: skillData.tree || 'general',
      category: skillData.category || 'combat',
      isActive: skillData.isActive !== undefined ? skillData.isActive : true,
      ...baseSkill,
      ...skillData
    };

    // 스킬 검증
    const validation = this.validateSkill(skill);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // 스킬 저장
    this.skills.set(skill.id, skill);

    // 변경 로그 기록
    await this.logSkillChange({
      skillId: skill.id,
      changeType: 'create',
      author,
      changes: [
        {
          field: 'entire_skill',
          oldValue: null,
          newValue: skill,
          changeReason: '새 스킬 생성'
        }
      ],
      reason: '새 스킬 생성',
      impact: await this.calculateChangeImpact('create', skill)
    });

    // 데이터 저장
    await this.saveSkillsData();

    logger.info(`새 스킬 생성: ${skill.name} (${skill.id}) by ${author}`);

    return { success: true, skillId: skill.id };
  }

  /**
   * 스킬 수정
   */
  async updateSkill(
    skillId: string,
    updates: Partial<Skill>,
    author: string = 'admin',
    reason: string = '스킬 수정'
  ): Promise<{ success: boolean; errors?: ValidationError[] }> {
    
    const existingSkill = this.skills.get(skillId);
    if (!existingSkill) {
      return { success: false, errors: [{ field: 'skillId', message: '존재하지 않는 스킬입니다.', severity: 'error' }] };
    }

    // 변경사항 추적
    const changes: SkillChange[] = [];
    Object.keys(updates).forEach(key => {
      const oldValue = (existingSkill as unknown as Record<string, unknown>)[key];
      const newValue = (updates as Record<string, unknown>)[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue,
          newValue,
          changeReason: reason
        });
      }
    });

    if (changes.length === 0) {
      return { success: false, errors: [{ field: 'updates', message: '변경사항이 없습니다.', severity: 'error' }] };
    }

    // 업데이트된 스킬 생성
    const updatedSkill: Skill = { ...existingSkill, ...updates };

    // 스킬 검증
    const validation = this.validateSkill(updatedSkill);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // 변경 영향도 계산
    const impact = await this.calculateChangeImpact('update', updatedSkill, existingSkill);

    // 중요한 변경사항인 경우 승인 워크플로우 시작
    if (impact.balanceImpact === 'major' || impact.balanceImpact === 'critical') {
      const workflowId = await this.createApprovalWorkflow(skillId, {
        changeType: 'update',
        author,
        changes,
        reason,
        impact
      });
      
      logger.info(`스킬 변경 승인 요청: ${skillId} (워크플로우: ${workflowId})`);
      return { success: true };
    }

    // 즉시 적용
    this.skills.set(skillId, updatedSkill);

    // 변경 로그 기록
    await this.logSkillChange({
      skillId,
      changeType: 'update',
      author,
      changes,
      reason,
      impact
    });

    // 데이터 저장
    await this.saveSkillsData();

    // 실시간 업데이트 브로드캐스트
    await this.broadcastSkillUpdate(skillId, updatedSkill);

    logger.info(`스킬 수정: ${updatedSkill.name} (${skillId}) by ${author}`);

    return { success: true };
  }

  /**
   * 스킬 삭제 (비활성화)
   */
  async deleteSkill(
    skillId: string,
    author: string = 'admin',
    reason: string = '스킬 삭제'
  ): Promise<{ success: boolean; errors?: ValidationError[] }> {
    
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { success: false, errors: [{ field: 'skillId', message: '존재하지 않는 스킬입니다.', severity: 'error' }] };
    }

    // 의존성 확인 (다른 스킬이 이 스킬을 필요로 하는지)
    const dependencies = this.checkSkillDependencies(skillId);
    if (dependencies.length > 0) {
      return { 
        success: false, 
        errors: [{ 
          field: 'dependencies', 
          message: `다른 스킬들이 이 스킬에 의존하고 있습니다: ${dependencies.join(', ')}`, 
          severity: 'error' 
        }] 
      };
    }

    // 사용 중인 플레이어 확인
    const usageCount = await this.getSkillUsageCount(skillId);
    const impact = await this.calculateChangeImpact('delete', skill);

    // 영향도가 큰 경우 승인 워크플로우
    if (usageCount > 10 || impact.balanceImpact === 'major') {
      const workflowId = await this.createApprovalWorkflow(skillId, {
        changeType: 'delete',
        author,
        changes: [
          {
            field: 'isActive',
            oldValue: skill.isActive,
            newValue: false,
            changeReason: reason
          }
        ],
        reason,
        impact
      });
      
      logger.info(`스킬 삭제 승인 요청: ${skillId} (워크플로우: ${workflowId})`);
      return { success: true };
    }

    // 즉시 비활성화
    const updatedSkill = { ...skill, isActive: false };
    this.skills.set(skillId, updatedSkill);

    // 변경 로그 기록
    await this.logSkillChange({
      skillId,
      changeType: 'delete',
      author,
      changes: [
        {
          field: 'isActive',
          oldValue: skill.isActive,
          newValue: false,
          changeReason: reason
        }
      ],
      reason,
      impact
    });

    // 데이터 저장
    await this.saveSkillsData();

    // 실시간 업데이트 브로드캐스트
    await this.broadcastSkillUpdate(skillId, updatedSkill);

    logger.info(`스킬 삭제: ${skill.name} (${skillId}) by ${author}`);

    return { success: true };
  }

  /**
   * 스킬 검증
   */
  private validateSkill(skill: Skill): SkillValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 필수 필드 검증
    if (!skill.id) {
      errors.push({ field: 'id', message: '스킬 ID는 필수입니다.', severity: 'error' });
    }

    if (!skill.name) {
      errors.push({ field: 'name', message: '스킬 이름은 필수입니다.', severity: 'error' });
    }

    if (!skill.description) {
      warnings.push({ 
        field: 'description', 
        message: '스킬 설명이 없습니다.', 
        suggestion: '플레이어가 이해할 수 있는 설명을 추가하세요.' 
      });
    }

    // 효과 검증
    if (!skill.effects || skill.effects.length === 0) {
      warnings.push({ 
        field: 'effects', 
        message: '스킬 효과가 없습니다.', 
        suggestion: '최소 하나의 효과를 추가하세요.' 
      });
    }

    skill.effects?.forEach((effect, index) => {
      if (effect.value <= 0) {
        warnings.push({ 
          field: `effects[${index}].value`, 
          message: '효과 수치가 0 이하입니다.', 
          suggestion: '양수 값을 사용하세요.' 
        });
      }
    });

    // 레벨 검증
    if (skill.level < 1) {
      errors.push({ field: 'level', message: '스킬 레벨은 1 이상이어야 합니다.', severity: 'error' });
    }

    if (skill.maxLevel < skill.level) {
      errors.push({ field: 'maxLevel', message: '최대 레벨은 현재 레벨보다 크거나 같아야 합니다.', severity: 'error' });
    }

    // 비용 검증
    if (skill.cost) {
      if (skill.cost.mp && skill.cost.mp < 0) {
        errors.push({ field: 'cost.mp', message: 'MP 비용은 음수일 수 없습니다.', severity: 'error' });
      }
      if (skill.cost.hp && skill.cost.hp < 0) {
        errors.push({ field: 'cost.hp', message: 'HP 비용은 음수일 수 없습니다.', severity: 'error' });
      }
    }

    // 쿨다운 검증
    if (skill.cooldown < 0) {
      errors.push({ field: 'cooldown', message: '쿨다운은 음수일 수 없습니다.', severity: 'error' });
    }

    // 중복 ID 검증
    if (skill.id && skill.id !== skill.id) { // 새 스킬인 경우
      const existingSkill = this.skills.get(skill.id);
      if (existingSkill) {
        errors.push({ field: 'id', message: '이미 존재하는 스킬 ID입니다.', severity: 'error' });
      }
    }

    // 밸런스 검증
    const balanceIssues = this.checkSkillBalance(skill);
    warnings.push(...balanceIssues);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 스킬 밸런스 확인
   */
  private checkSkillBalance(skill: Skill): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    if (!skill.effects) return warnings;

    // 데미지 밸런스 확인
    const damageEffects = skill.effects.filter(effect => effect.type === 'damage');
    damageEffects.forEach(effect => {
      const dps = effect.value / Math.max(skill.cooldown, 1);
      
      if (dps > 100) {
        warnings.push({
          field: 'effects.damage',
          message: 'DPS가 너무 높을 수 있습니다.',
          suggestion: '데미지를 줄이거나 쿨다운을 늘리는 것을 고려하세요.'
        });
      }
    });

    // 치유 밸런스 확인
    const healEffects = skill.effects.filter(effect => effect.type === 'heal');
    healEffects.forEach(effect => {
      const hps = effect.value / Math.max(skill.cooldown, 1);
      
      if (hps > 80) {
        warnings.push({
          field: 'effects.heal',
          message: 'HPS가 너무 높을 수 있습니다.',
          suggestion: '치유량을 줄이거나 쿨다운을 늘리는 것을 고려하세요.'
        });
      }
    });

    // 버프 지속시간 확인
    const buffEffects = skill.effects.filter(effect => 
      effect.type === 'buff' || effect.type === 'stat_bonus'
    );
    buffEffects.forEach(effect => {
      if (effect.duration > 300) { // 5분 이상
        warnings.push({
          field: 'effects.duration',
          message: '버프 지속시간이 너무 길 수 있습니다.',
          suggestion: '지속시간을 줄이거나 효과를 약화시키는 것을 고려하세요.'
        });
      }
    });

    return warnings;
  }

  /**
   * 변경 영향도 계산
   */
  private async calculateChangeImpact(
    changeType: ChangeType, 
    skill: Skill, 
    oldSkill?: Skill
  ): Promise<ChangeImpact> {
    const affectedPlayers = await this.getSkillUsageCount(skill.id);
    
    let balanceImpact: ChangeImpact['balanceImpact'] = 'none';
    const compatibilityIssues: string[] = [];
    const recommendedActions: string[] = [];

    if (changeType === 'create') {
      balanceImpact = 'minor';
      recommendedActions.push('새 스킬 테스트 실행');
    } else if (changeType === 'delete') {
      balanceImpact = affectedPlayers > 50 ? 'major' : 'moderate';
      if (affectedPlayers > 0) {
        compatibilityIssues.push(`${affectedPlayers}명의 플레이어가 이 스킬을 보유하고 있습니다.`);
        recommendedActions.push('플레이어들에게 보상 지급 고려');
      }
    } else if (changeType === 'update' && oldSkill) {
      // 데미지 변화 분석
      const oldDamage = this.calculateTotalDamage(oldSkill);
      const newDamage = this.calculateTotalDamage(skill);
      const damageChange = Math.abs(newDamage - oldDamage) / oldDamage;

      if (damageChange > 0.5) {
        balanceImpact = 'critical';
        compatibilityIssues.push('데미지가 50% 이상 변경되었습니다.');
      } else if (damageChange > 0.2) {
        balanceImpact = 'major';
        compatibilityIssues.push('데미지가 20% 이상 변경되었습니다.');
      } else if (damageChange > 0.1) {
        balanceImpact = 'moderate';
      } else {
        balanceImpact = 'minor';
      }

      // 비용 변화 분석
      if (oldSkill.cost?.mp !== skill.cost?.mp) {
        const costChange = Math.abs((skill.cost?.mp || 0) - (oldSkill.cost?.mp || 0));
        if (costChange > 10) {
          recommendedActions.push('MP 비용 변화에 대한 밸런스 테스트 필요');
        }
      }

      // 쿨다운 변화 분석
      if (oldSkill.cooldown !== skill.cooldown) {
        const cooldownChange = Math.abs(skill.cooldown - oldSkill.cooldown) / oldSkill.cooldown;
        if (cooldownChange > 0.3) {
          recommendedActions.push('쿨다운 변화에 대한 밸런스 테스트 필요');
        }
      }
    }

    if (affectedPlayers > 100) {
      recommendedActions.push('대규모 플레이어 영향으로 인한 공지 필요');
    }

    return {
      affectedPlayers,
      balanceImpact,
      compatibilityIssues,
      recommendedActions
    };
  }

  /**
   * 총 데미지 계산
   */
  private calculateTotalDamage(skill: Skill): number {
    if (!skill.effects) return 0;
    
    return skill.effects
      .filter(effect => effect.type === 'damage')
      .reduce((total, effect) => total + effect.value, 0);
  }

  /**
   * 스킬 의존성 확인
   */
  private checkSkillDependencies(skillId: string): string[] {
    const dependencies: string[] = [];
    
    this.skills.forEach(skill => {
      if (skill.requirements) {
        const hasRequirement = skill.requirements.some(req => 
          req.type === 'skill' && req.skillId === skillId
        );
        
        if (hasRequirement) {
          dependencies.push(skill.id);
        }
      }
    });

    return dependencies;
  }

  /**
   * 스킬 사용량 조회
   */
  private async getSkillUsageCount(skillId: string): Promise<number> {
    // 실제 구현에서는 플레이어 데이터베이스 조회
    // 시뮬레이션된 값 반환
    return Math.floor(Math.random() * 100);
  }

  /**
   * 변경 로그 기록
   */
  private async logSkillChange(changeData: Omit<SkillChangeLog, 'id' | 'timestamp' | 'approved' | 'approver'>): Promise<string> {
    const logId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const changeLog: SkillChangeLog = {
      id: logId,
      timestamp: new Date(),
      approved: changeData.impact.balanceImpact === 'minor' || changeData.impact.balanceImpact === 'none',
      ...changeData
    };

    this.changeLogs.set(logId, changeLog);

    // 변경 로그 크기 제한
    if (this.changeLogs.size > this.maxChangeHistory) {
      const oldestLog = Array.from(this.changeLogs.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      this.changeLogs.delete(oldestLog[0]);
    }

    return logId;
  }

  /**
   * 승인 워크플로우 생성
   */
  private async createApprovalWorkflow(
    skillId: string, 
    changeData: Omit<SkillChangeLog, 'id' | 'timestamp' | 'approved' | 'approver'>
  ): Promise<string> {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const changeLogId = await this.logSkillChange(changeData);

    const workflow: SkillApprovalWorkflow = {
      id: workflowId,
      skillId,
      changeLogId,
      status: 'pending',
      requiredApprovers: this.getRequiredApprovers(changeData.impact.balanceImpact),
      currentApprovers: [],
      createdAt: new Date(),
      priority: this.calculateApprovalPriority(changeData.impact)
    };

    this.approvalWorkflows.set(workflowId, workflow);

    // 승인자들에게 알림
    await this.notifyApprovers(workflow);

    return workflowId;
  }

  /**
   * 필요한 승인자 목록 조회
   */
  private getRequiredApprovers(balanceImpact: string): string[] {
    switch (balanceImpact) {
      case 'critical':
        return ['lead_designer', 'game_director', 'balance_team'];
      case 'major':
        return ['lead_designer', 'balance_team'];
      case 'moderate':
        return ['balance_team'];
      default:
        return ['designer'];
    }
  }

  /**
   * 승인 우선순위 계산
   */
  private calculateApprovalPriority(impact: ChangeImpact): ApprovalPriority {
    if (impact.balanceImpact === 'critical') return 'emergency';
    if (impact.balanceImpact === 'major') return 'urgent';
    if (impact.balanceImpact === 'moderate') return 'high';
    return 'normal';
  }

  /**
   * 템플릿을 스킬로 변환
   */
  private convertTemplateToSkill(template: SkillTemplate): Partial<Skill> {
    return {
      name: template.name,
      description: template.description,
      type: template.type,
      element: template.element,
      targetType: template.targetType,
      effects: template.baseEffects,
      requirements: template.requirements,
      category: template.category,
      level: 1,
      maxLevel: 10,
      cost: { mp: 10 },
      cooldown: 0,
      castTime: 0,
      range: 1,
      tree: 'general',
      isActive: template.metadata.isActive
    };
  }

  /**
   * 데이터 저장
   */
  private async saveSkillsData(): Promise<void> {
    try {
      const skillsArray = Array.from(this.skills.values());
      await dataManager.saveGameData('skills', { skills: skillsArray });
    } catch (error) {
      logger.error('스킬 데이터 저장 실패:', error);
    }
  }

  /**
   * 실시간 업데이트 브로드캐스트
   */
  private async broadcastSkillUpdate(skillId: string, skill: Skill): Promise<void> {
    // 실제로는 웹소켓을 통해 클라이언트들에게 브로드캐스트
    logger.info(`스킬 업데이트 브로드캐스트: ${skillId}`);
    
    // 게임 서버에 알림
    await this.notifyGameServers(skillId, skill);
  }

  /**
   * 게임 서버에 알림
   */
  private async notifyGameServers(skillId: string, skill: Skill): Promise<void> {
    // 실제로는 게임 서버 API 호출
    logger.debug(`게임 서버 알림: 스킬 ${skillId} 업데이트`);
  }

  /**
   * 승인자들에게 알림
   */
  private async notifyApprovers(workflow: SkillApprovalWorkflow): Promise<void> {
    // 실제로는 이메일, Slack 등으로 알림
    logger.info(`승인 요청 알림: ${workflow.requiredApprovers.join(', ')}`);
  }

  /**
   * 공개 API 메서드들
   */

  /**
   * 스킬 조회
   */
  getSkill(skillId: string): Skill | null {
    return this.skills.get(skillId) || null;
  }

  /**
   * 모든 스킬 조회
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * 활성 스킬만 조회
   */
  getActiveSkills(): Skill[] {
    return Array.from(this.skills.values()).filter(skill => skill.isActive);
  }

  /**
   * 카테고리별 스킬 조회
   */
  getSkillsByCategory(category: string): Skill[] {
    return Array.from(this.skills.values()).filter(skill => skill.category === category);
  }

  /**
   * 스킬 트리별 스킬 조회
   */
  getSkillsByTree(tree: string): Skill[] {
    return Array.from(this.skills.values()).filter(skill => skill.tree === tree);
  }

  /**
   * 스킬 템플릿 조회
   */
  getSkillTemplate(templateId: string): SkillTemplate | null {
    return this.skillTemplates.get(templateId) || null;
  }

  /**
   * 모든 스킬 템플릿 조회
   */
  getAllSkillTemplates(): SkillTemplate[] {
    return Array.from(this.skillTemplates.values());
  }

  /**
   * 변경 로그 조회
   */
  getSkillChangeLogs(skillId?: string, limit: number = 50): SkillChangeLog[] {
    let logs = Array.from(this.changeLogs.values());
    
    if (skillId) {
      logs = logs.filter(log => log.skillId === skillId);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 승인 워크플로우 조회
   */
  getApprovalWorkflows(status?: ApprovalStatus): SkillApprovalWorkflow[] {
    let workflows = Array.from(this.approvalWorkflows.values());
    
    if (status) {
      workflows = workflows.filter(workflow => workflow.status === status);
    }
    
    return workflows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 워크플로우 승인
   */
  async approveWorkflow(
    workflowId: string, 
    approverId: string, 
    comments?: string
  ): Promise<{ success: boolean; error?: string }> {
    const workflow = this.approvalWorkflows.get(workflowId);
    if (!workflow) {
      return { success: false, error: '존재하지 않는 워크플로우입니다.' };
    }

    if (workflow.status !== 'pending' && workflow.status !== 'reviewing') {
      return { success: false, error: '승인할 수 없는 상태입니다.' };
    }

    if (!workflow.requiredApprovers.includes(approverId)) {
      return { success: false, error: '승인 권한이 없습니다.' };
    }

    if (workflow.currentApprovers.includes(approverId)) {
      return { success: false, error: '이미 승인하셨습니다.' };
    }

    // 승인자 추가
    workflow.currentApprovers.push(approverId);

    // 모든 승인이 완료되었는지 확인
    const allApproved = workflow.requiredApprovers.every(approver => 
      workflow.currentApprovers.includes(approver)
    );

    if (allApproved) {
      workflow.status = 'approved';
      
      // 변경사항 적용
      const changeLog = this.changeLogs.get(workflow.changeLogId);
      if (changeLog) {
        await this.applyApprovedChanges(changeLog);
        changeLog.approved = true;
        changeLog.approver = approverId;
      }
    } else {
      workflow.status = 'reviewing';
    }

    logger.info(`워크플로우 승인: ${workflowId} by ${approverId}`);

    return { success: true };
  }

  /**
   * 워크플로우 거부
   */
  async rejectWorkflow(
    workflowId: string, 
    approverId: string, 
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    const workflow = this.approvalWorkflows.get(workflowId);
    if (!workflow) {
      return { success: false, error: '존재하지 않는 워크플로우입니다.' };
    }

    if (!workflow.requiredApprovers.includes(approverId)) {
      return { success: false, error: '거부 권한이 없습니다.' };
    }

    workflow.status = 'rejected';
    workflow.rejectionReason = reason;

    logger.info(`워크플로우 거부: ${workflowId} by ${approverId} - ${reason}`);

    return { success: true };
  }

  /**
   * 승인된 변경사항 적용
   */
  private async applyApprovedChanges(changeLog: SkillChangeLog): Promise<void> {
    const skill = this.skills.get(changeLog.skillId);
    if (!skill) return;

    switch (changeLog.changeType) {
      case 'update':
        // 변경사항 적용
        changeLog.changes.forEach(change => {
          (skill as unknown as Record<string, unknown>)[change.field] = change.newValue;
        });
        this.skills.set(skill.id, skill);
        break;
      
      case 'delete':
        skill.isActive = false;
        this.skills.set(skill.id, skill);
        break;
    }

    // 데이터 저장
    await this.saveSkillsData();

    // 실시간 업데이트 브로드캐스트
    await this.broadcastSkillUpdate(skill.id, skill);
  }

  /**
   * 스킬 롤백
   */
  async rollbackSkill(
    skillId: string, 
    changeLogId: string, 
    author: string = 'admin'
  ): Promise<{ success: boolean; error?: string }> {
    const changeLog = this.changeLogs.get(changeLogId);
    if (!changeLog) {
      return { success: false, error: '존재하지 않는 변경 로그입니다.' };
    }

    const skill = this.skills.get(skillId);
    if (!skill) {
      return { success: false, error: '존재하지 않는 스킬입니다.' };
    }

    // 롤백 변경사항 생성
    const rollbackChanges: SkillChange[] = changeLog.changes.map(change => ({
      field: change.field,
      oldValue: change.newValue,
      newValue: change.oldValue,
      changeReason: `롤백: ${change.changeReason}`
    }));

    // 롤백 적용
    rollbackChanges.forEach(change => {
      (skill as unknown as Record<string, unknown>)[change.field] = change.newValue;
    });

    this.skills.set(skillId, skill);

    // 롤백 로그 기록
    await this.logSkillChange({
      skillId,
      changeType: 'rollback',
      author,
      changes: rollbackChanges,
      reason: `변경 로그 ${changeLogId} 롤백`,
      impact: await this.calculateChangeImpact('rollback', skill),
      rollbackId: changeLogId
    });

    // 데이터 저장
    await this.saveSkillsData();

    // 실시간 업데이트 브로드캐스트
    await this.broadcastSkillUpdate(skillId, skill);

    logger.info(`스킬 롤백: ${skillId} (로그: ${changeLogId}) by ${author}`);

    return { success: true };
  }

  /**
   * 스킬 테스트 실행
   */
  async testSkill(
    skillId: string, 
    testEnvironment: TestEnvironment
  ): Promise<SkillTestResult> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error('존재하지 않는 스킬입니다.');
    }

    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const testResult: SkillTestResult = {
      skillId,
      testId,
      testType: 'damage_calculation',
      status: 'running',
      results: [],
      executedAt: new Date(),
      duration: 0,
      environment: testEnvironment
    };

    try {
      // 데미지 계산 테스트
      const damageTests = await this.runDamageCalculationTests(skill, testEnvironment);
      testResult.results.push(...damageTests);

      // 밸런스 체크 테스트
      const balanceTests = await this.runBalanceCheckTests(skill);
      testResult.results.push(...balanceTests);

      // 모든 테스트 통과 여부 확인
      const allPassed = testResult.results.every(result => result.passed);
      testResult.status = allPassed ? 'passed' : 'failed';

    } catch (error) {
      testResult.status = 'error';
      testResult.results.push({
        testCase: 'execution_error',
        expected: 'no_error',
        actual: error.message,
        passed: false,
        errorMessage: error.message
      });
    }

    testResult.duration = Date.now() - startTime;
    this.testResults.set(testId, testResult);

    logger.info(`스킬 테스트 완료: ${skillId} (${testResult.status})`);

    return testResult;
  }

  /**
   * 데미지 계산 테스트 실행
   */
  private async runDamageCalculationTests(
    skill: Skill, 
    environment: TestEnvironment
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    if (!skill.effects) return results;

    skill.effects.forEach(effect => {
      if (effect.type === 'damage') {
        // 기본 데미지 테스트
        const baseDamage = effect.value;
        const calculatedDamage = this.calculateSkillDamage(skill, environment.playerStats);
        
        results.push({
          testCase: `damage_calculation_${effect.type}`,
          expected: baseDamage,
          actual: calculatedDamage,
          passed: Math.abs(calculatedDamage - baseDamage) <= baseDamage * 0.1, // 10% 오차 허용
        });

        // 레벨 스케일링 테스트
        const scaledStats = { ...environment.playerStats, level: environment.playerLevel * 2 };
        const scaledDamage = this.calculateSkillDamage(skill, scaledStats);
        
        results.push({
          testCase: `damage_scaling_test`,
          expected: calculatedDamage * 1.5, // 예상 스케일링
          actual: scaledDamage,
          passed: scaledDamage > calculatedDamage,
        });
      }
    });

    return results;
  }

  /**
   * 밸런스 체크 테스트 실행
   */
  private async runBalanceCheckTests(skill: Skill): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // DPS 테스트
    const totalDamage = this.calculateTotalDamage(skill);
    const dps = totalDamage / Math.max(skill.cooldown, 1);
    
    results.push({
      testCase: 'dps_balance_check',
      expected: 100, // 최대 허용 DPS
      actual: dps,
      passed: dps <= 100,
    });

    // MP 효율성 테스트
    if (skill.cost?.mp) {
      const damagePerMp = totalDamage / skill.cost.mp;
      
      results.push({
        testCase: 'mp_efficiency_check',
        expected: 10, // 최대 허용 데미지/MP 비율
        actual: damagePerMp,
        passed: damagePerMp <= 10,
      });
    }

    return results;
  }

  /**
   * 스킬 데미지 계산
   */
  private calculateSkillDamage(skill: Skill, playerStats: Record<string, number>): number {
    if (!skill.effects) return 0;

    return skill.effects
      .filter(effect => effect.type === 'damage')
      .reduce((total, effect) => {
        let damage = effect.value;
        
        // 스탯 스케일링 적용
        if (skill.element === 'physical' && playerStats.str) {
          damage += playerStats.str * 0.5;
        } else if (skill.element === 'arcane' && playerStats.int) {
          damage += playerStats.int * 0.7;
        }

        return total + damage;
      }, 0);
  }

  /**
   * 시스템 상태 조회
   */
  getSystemStatus(): {
    totalSkills: number;
    activeSkills: number;
    pendingApprovals: number;
    recentChanges: number;
  } {
    const pendingApprovals = Array.from(this.approvalWorkflows.values())
      .filter(workflow => workflow.status === 'pending' || workflow.status === 'reviewing').length;

    const recentChanges = Array.from(this.changeLogs.values())
      .filter(log => Date.now() - log.timestamp.getTime() < 24 * 60 * 60 * 1000).length;

    return {
      totalSkills: this.skills.size,
      activeSkills: this.getActiveSkills().length,
      pendingApprovals,
      recentChanges
    };
  }
}

// 전역 스킬 콘텐츠 관리자 인스턴스
export const skillContentManager = new SkillContentManager();

// 스킬 콘텐츠 관리 관련 유틸리티
export const skillContentUtils = {
  /**
   * 스킬 카테고리 표시명
   */
  getCategoryDisplayName(category: SkillCategory): string {
    const names = {
      combat: '전투',
      magic: '마법',
      passive: '패시브',
      crafting: '제작',
      social: '사회',
      movement: '이동',
      utility: '유틸리티'
    };
    return names[category];
  },

  /**
   * 스킬 타입 표시명
   */
  getTypeDisplayName(type: SkillType): string {
    const names = {
      active: '액티브',
      passive: '패시브',
      toggle: '토글',
      channeled: '채널링',
      instant: '즉시',
      charged: '차지'
    };
    return names[type];
  },

  /**
   * 원소 타입 표시명
   */
  getElementDisplayName(element: ElementType): string {
    const names = {
      none: '무속성',
      fire: '화염',
      water: '물',
      earth: '대지',
      air: '바람',
      light: '빛',
      dark: '어둠',
      physical: '물리',
      arcane: '비전'
    };
    return names[element];
  },

  /**
   * 밸런스 영향도 색상
   */
  getBalanceImpactColor(impact: string): string {
    const colors = {
      none: '#28a745',
      minor: '#28a745',
      moderate: '#ffc107',
      major: '#fd7e14',
      critical: '#dc3545'
    };
    return colors[impact] || '#6c757d';
  },

  /**
   * 승인 상태 색상
   */
  getApprovalStatusColor(status: ApprovalStatus): string {
    const colors = {
      pending: '#ffc107',
      reviewing: '#17a2b8',
      approved: '#28a745',
      rejected: '#dc3545',
      cancelled: '#6c757d'
    };
    return colors[status];
  }
};
