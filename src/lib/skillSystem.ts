import { Player, Skill, SkillEffect, SkillRequirement, Stats } from '@/types/game';
import { logger } from './logger';

// 스킬 트리 노드 인터페이스
interface SkillTreeNode {
  skillId: string;
  level: number;
  maxLevel: number;
  children: SkillTreeNode[];
  parents: string[]; // 전제조건 스킬들
  position: { x: number; y: number }; // UI에서의 위치
  unlocked: boolean;
  experience: number;
  requiredExperience: number;
}

// 스킬 진화 인터페이스
interface SkillEvolution {
  baseSkillId: string;
  evolvedSkillId: string;
  requirements: {
    level: number;
    otherSkills?: { skillId: string; level: number }[];
    stats?: Partial<Stats>;
    questCompleted?: string;
    itemRequired?: string;
  };
}

// 스킬 조합 인터페이스
interface SkillCombination {
  id: string;
  name: string;
  description: string;
  requiredSkills: { skillId: string; level: number }[];
  resultSkill: string;
  combinationType: 'merge' | 'evolve' | 'transcend';
}

// 스킬 점수 시스템
interface SkillPointSystem {
  totalPoints: number;
  usedPoints: number;
  availablePoints: number;
  pointsPerLevel: number;
  bonusPointSources: string[]; // 퀘스트, 업적 등으로 얻은 추가 포인트
}

// 스킬 효과 스택 시스템
interface SkillEffectStack {
  skillId: string;
  effectType: string;
  stacks: number;
  maxStacks: number;
  duration: number;
  stackDecayTime: number;
  bonusPerStack: number;
}

export class SkillTreeSystem {
  private skillTrees: Map<string, SkillTreeNode[]> = new Map();
  private skillEvolutions: SkillEvolution[] = [];
  private skillCombinations: SkillCombination[] = [];
  private playerSkillStacks: Map<string, SkillEffectStack[]> = new Map();

  constructor() {
    this.initializeDefaultSkillTrees();
    this.initializeSkillEvolutions();
    this.initializeSkillCombinations();
  }

  /**
   * 무한 확장 스킬 트리 초기화
   */
  private initializeDefaultSkillTrees(): void {
    // 전투 스킬 트리
    const combatTree: SkillTreeNode[] = [
      {
        skillId: 'basic_attack',
        level: 0,
        maxLevel: 100,
        children: [],
        parents: [],
        position: { x: 0, y: 0 },
        unlocked: true,
        experience: 0,
        requiredExperience: 100
      },
      {
        skillId: 'power_strike',
        level: 0,
        maxLevel: 50,
        children: [],
        parents: ['basic_attack'],
        position: { x: 1, y: 0 },
        unlocked: false,
        experience: 0,
        requiredExperience: 250
      },
      {
        skillId: 'combo_mastery',
        level: 0,
        maxLevel: 25,
        children: [],
        parents: ['power_strike'],
        position: { x: 2, y: 0 },
        unlocked: false,
        experience: 0,
        requiredExperience: 500
      }
    ];

    // 마법 스킬 트리
    const magicTree: SkillTreeNode[] = [
      {
        skillId: 'magic_missile',
        level: 0,
        maxLevel: 100,
        children: [],
        parents: [],
        position: { x: 0, y: 1 },
        unlocked: true,
        experience: 0,
        requiredExperience: 100
      },
      {
        skillId: 'fireball',
        level: 0,
        maxLevel: 50,
        children: [],
        parents: ['magic_missile'],
        position: { x: 1, y: 1 },
        unlocked: false,
        experience: 0,
        requiredExperience: 300
      },
      {
        skillId: 'meteor',
        level: 0,
        maxLevel: 25,
        children: [],
        parents: ['fireball'],
        position: { x: 2, y: 1 },
        unlocked: false,
        experience: 0,
        requiredExperience: 1000
      }
    ];

    this.skillTrees.set('combat', combatTree);
    this.skillTrees.set('magic', magicTree);
    this.skillTrees.set('support', []);
    this.skillTrees.set('passive', []);
    this.skillTrees.set('transcendent', []); // 초월 스킬 트리
  }

  /**
   * 스킬 진화 시스템 초기화
   */
  private initializeSkillEvolutions(): void {
    this.skillEvolutions = [
      {
        baseSkillId: 'basic_attack',
        evolvedSkillId: 'perfected_strike',
        requirements: {
          level: 100,
          otherSkills: [
            { skillId: 'power_strike', level: 50 },
            { skillId: 'combo_mastery', level: 25 }
          ],
          stats: { str: 500, dex: 300 }
        }
      },
      {
        baseSkillId: 'fireball',
        evolvedSkillId: 'inferno_orb',
        requirements: {
          level: 50,
          otherSkills: [{ skillId: 'magic_missile', level: 75 }],
          stats: { int: 400 }
        }
      }
    ];
  }

  /**
   * 스킬 조합 시스템 초기화
   */
  private initializeSkillCombinations(): void {
    this.skillCombinations = [
      {
        id: 'flame_sword',
        name: '화염검',
        description: '검술과 화염 마법의 조합으로 만들어진 하이브리드 스킬',
        requiredSkills: [
          { skillId: 'power_strike', level: 25 },
          { skillId: 'fireball', level: 25 }
        ],
        resultSkill: 'flame_blade',
        combinationType: 'merge'
      },
      {
        id: 'elemental_mastery',
        name: '원소 숙련',
        description: '모든 원소 마법을 마스터한 자만이 얻을 수 있는 초월 스킬',
        requiredSkills: [
          { skillId: 'fireball', level: 50 },
          { skillId: 'ice_shard', level: 50 },
          { skillId: 'lightning_bolt', level: 50 },
          { skillId: 'earth_spike', level: 50 }
        ],
        resultSkill: 'elemental_transcendence',
        combinationType: 'transcend'
      }
    ];
  }

  /**
   * 스킬 포인트 시스템 관리
   */
  getSkillPointSystem(player: Player): SkillPointSystem {
    const pointsPerLevel = 3; // 레벨당 3 스킬 포인트
    const totalPoints = (player.level || 0) * pointsPerLevel;
    
    // 사용된 포인트 계산
    let usedPoints = 0;
    Object.values(player.skills ?? {}).forEach(skill => {
      usedPoints += this.calculateSkillPointCost(skill.id, skill.level);
    });

    // 보너스 포인트 (퀘스트, 업적 등)
    const bonusPoints = this.calculateBonusSkillPoints(player);
    
    return {
      totalPoints: totalPoints + bonusPoints,
      usedPoints,
      availablePoints: (totalPoints + bonusPoints) - usedPoints,
      pointsPerLevel,
      bonusPointSources: []
    };
  }

  /**
   * 스킬 레벨업에 필요한 포인트 계산 (레벨이 높을수록 더 많은 포인트 필요)
   */
  private calculateSkillPointCost(skillId: string, targetLevel: number): number {
    let totalCost = 0;
    for (let level = 1; level <= targetLevel; level++) {
      // 기본 공식: 레벨^1.2
      let levelCost = Math.floor(Math.pow(level, 1.2));
      
      // 고급 스킬일수록 더 비싼 비용
      const skillRarity = this.getSkillRarity(skillId);
      const rarityMultiplier = {
        common: 1,
        uncommon: 1.5,
        rare: 2,
        epic: 3,
        legendary: 5,
        transcendent: 10
      };
      
      levelCost *= (rarityMultiplier[skillRarity] || 1);
      totalCost += levelCost;
    }
    return totalCost;
  }

  /**
   * 보너스 스킬 포인트 계산
   */
  private calculateBonusSkillPoints(player: Player): number {
    let bonusPoints = 0;
    
    // 업적 기반 보너스
    bonusPoints += Math.floor(player.level / 100) * 10; // 100레벨마다 10포인트
    
    // 퀘스트 완료 보너스 (예시)
    // bonusPoints += completedQuests.filter(q => q.rewardType === 'skill_points').length;
    
    return bonusPoints;
  }

  /**
   * 스킬 레벨업 처리
   */
  levelUpSkill(player: Player, skillId: string): {
    success: boolean;
    newLevel: number;
    effectsGained: SkillEffect[];
    evolutionAvailable?: SkillEvolution;
    error?: string;
  } {
    const skillsMap = player.skills ?? {} as Record<string, any>;
    const skill = skillsMap[skillId];
    if (!skill) {
      return {
        success: false,
        newLevel: 0,
        effectsGained: [],
        error: '스킬을 찾을 수 없습니다.'
      };
    }

    // 최대 레벨 확인
    const maxLevel = this.getSkillMaxLevel(skillId);
    if (skill.level >= maxLevel) {
      return {
        success: false,
        newLevel: skill.level,
        effectsGained: [],
        error: '이미 최대 레벨입니다.'
      };
    }

    // 스킬 포인트 확인
    const pointSystem = this.getSkillPointSystem(player);
    const requiredPoints = this.calculateSkillPointCost(skillId, skill.level + 1) - 
                          this.calculateSkillPointCost(skillId, skill.level);
    
    if (pointSystem.availablePoints < requiredPoints) {
      return {
        success: false,
        newLevel: skill.level,
        effectsGained: [],
        error: '스킬 포인트가 부족합니다.'
      };
    }

    // 전제조건 확인
    const prerequisites = this.checkSkillPrerequisites(player, skillId, skill.level + 1);
    if (!prerequisites.met) {
      return {
        success: false,
        newLevel: skill.level,
        effectsGained: [],
        error: `전제조건 미충족: ${prerequisites.missing.join(', ')}`
      };
    }

    // 레벨업 실행
    skill.level += 1;
    skill.experience = 0;
    skill.requiredExperience = this.calculateRequiredExperience(skillId, skill.level + 1);

    // 새로운 효과 계산
    const effectsGained = this.getSkillEffectsAtLevel(skillId, skill.level);
    
    // 진화 가능 여부 확인
    const evolutionAvailable = this.checkSkillEvolution(player, skillId);

    logger.info(`스킬 레벨업: ${skillId} → 레벨 ${skill.level}`);

    return {
      success: true,
      newLevel: skill.level,
      effectsGained,
      evolutionAvailable
    };
  }

  /**
   * 스킬 경험치 추가 및 자동 레벨업
   */
  addSkillExperience(player: Player, skillId: string, experience: number): {
    levelsGained: number;
    newLevel: number;
    effectsGained: SkillEffect[];
  } {
    const skill = (player.skills ?? {})[skillId];
    if (!skill) {
      return { levelsGained: 0, newLevel: 0, effectsGained: [] };
    }

    skill.experience += experience;
    let levelsGained = 0;
    const effectsGained: SkillEffect[] = [];

    // 자동 레벨업 처리
    while (skill.experience >= skill.requiredExperience && 
           skill.level < this.getSkillMaxLevel(skillId)) {
      
      // 스킬 포인트가 있는 경우에만 자동 레벨업
      const pointSystem = this.getSkillPointSystem(player);
      const requiredPoints = this.calculateSkillPointCost(skillId, skill.level + 1) - 
                            this.calculateSkillPointCost(skillId, skill.level);
      
      if (pointSystem.availablePoints >= requiredPoints) {
        skill.experience -= skill.requiredExperience;
        skill.level += 1;
        levelsGained += 1;
        
        const newEffects = this.getSkillEffectsAtLevel(skillId, skill.level);
        effectsGained.push(...newEffects);
        
        skill.requiredExperience = this.calculateRequiredExperience(skillId, skill.level + 1);
      } else {
        break; // 포인트 부족시 경험치만 누적
      }
    }

    return {
      levelsGained,
      newLevel: skill.level,
      effectsGained
    };
  }

  /**
   * 스킬 진화 처리
   */
  evolveSkill(player: Player, evolution: SkillEvolution): {
    success: boolean;
    evolvedSkill: string;
    error?: string;
  } {
    const skillsMap = player.skills ?? {} as Record<string, any>;
    const baseSkill = skillsMap[evolution.baseSkillId];
    if (!baseSkill || baseSkill.level < evolution.requirements.level) {
      return {
        success: false,
        evolvedSkill: '',
        error: '기본 스킬 레벨이 부족합니다.'
      };
    }

    // 다른 스킬 요구사항 확인
    if (evolution.requirements.otherSkills) {
      for (const req of evolution.requirements.otherSkills) {
        const requiredSkill = skillsMap[req.skillId];
        if (!requiredSkill || requiredSkill.level < req.level) {
          return {
            success: false,
            evolvedSkill: '',
            error: `필요 스킬 미충족: ${req.skillId} 레벨 ${req.level}`
          };
        }
      }
    }

    // 스탯 요구사항 확인
    if (evolution.requirements.stats) {
      for (const [stat, required] of Object.entries(evolution.requirements.stats)) {
        if ((player.stats as any)[stat] < required) {
          return {
            success: false,
            evolvedSkill: '',
            error: `스탯 부족: ${stat} ${required} 필요`
          };
        }
      }
    }

    // 진화 실행
    player.skills = player.skills ?? {} as any;
    delete (player.skills as any)[evolution.baseSkillId];
    (player.skills as any)[evolution.evolvedSkillId] = {
      id: evolution.evolvedSkillId,
      level: 1,
      experience: 0,
      requiredExperience: this.calculateRequiredExperience(evolution.evolvedSkillId, 2),
      effects: this.getSkillEffectsAtLevel(evolution.evolvedSkillId, 1)
    };

    logger.info(`스킬 진화: ${evolution.baseSkillId} → ${evolution.evolvedSkillId}`);

    return {
      success: true,
      evolvedSkill: evolution.evolvedSkillId
    };
  }

  /**
   * 스킬 조합 처리
   */
  combineSkills(player: Player, combination: SkillCombination): {
    success: boolean;
    newSkill: string;
    error?: string;
  } {
    // 필요 스킬 확인
    for (const req of combination.requiredSkills) {
      const skillsMap = player.skills ?? {} as Record<string, any>;
      const skill = skillsMap[req.skillId];
      if (!skill || skill.level < req.level) {
        return {
          success: false,
          newSkill: '',
          error: `필요 스킬 미충족: ${req.skillId} 레벨 ${req.level}`
        };
      }
    }

    // 조합 타입에 따른 처리
    switch (combination.combinationType) {
      case 'merge':
        // 원본 스킬들은 유지하고 새 스킬 추가
        break;
      case 'evolve':
        // 일부 스킬을 소모하고 새 스킬 생성
        combination.requiredSkills.forEach(req => {
          const skillsMap = player.skills ?? {} as Record<string, any>;
          if (skillsMap[req.skillId]) {
            skillsMap[req.skillId].level = Math.max(0, 
              skillsMap[req.skillId].level - Math.floor(req.level / 2)
            );
          }
        });
        break;
      case 'transcend':
        // 모든 관련 스킬을 최대 레벨로 만들고 초월 스킬 생성
        combination.requiredSkills.forEach(req => {
          const skillsMap = player.skills ?? {} as Record<string, any>;
          if (skillsMap[req.skillId]) {
            delete skillsMap[req.skillId];
          }
        });
        break;
    }

    // 새 스킬 생성
    player.skills = player.skills ?? {} as any;
    (player.skills as any)[combination.resultSkill] = {
      id: combination.resultSkill,
      level: 1,
      experience: 0,
      requiredExperience: this.calculateRequiredExperience(combination.resultSkill, 2),
      effects: this.getSkillEffectsAtLevel(combination.resultSkill, 1)
    };

    logger.info(`스킬 조합: ${combination.name} → ${combination.resultSkill}`);

    return {
      success: true,
      newSkill: combination.resultSkill
    };
  }

  /**
   * 스킬 효과 스택 시스템
   */
  addSkillEffectStack(playerId: string, skillId: string, effectType: string): void {
    if (!this.playerSkillStacks.has(playerId)) {
      this.playerSkillStacks.set(playerId, []);
    }

    const stacks = this.playerSkillStacks.get(playerId)!;
    let existingStack = stacks.find(s => s.skillId === skillId && s.effectType === effectType);

    if (existingStack) {
      // 기존 스택 증가
      existingStack.stacks = Math.min(existingStack.maxStacks, existingStack.stacks + 1);
      existingStack.duration = existingStack.stackDecayTime; // 지속시간 리셋
    } else {
      // 새 스택 생성
      const newStack: SkillEffectStack = {
        skillId,
        effectType,
        stacks: 1,
        maxStacks: this.getMaxStacksForEffect(skillId, effectType),
        duration: this.getStackDuration(skillId, effectType),
        stackDecayTime: this.getStackDuration(skillId, effectType),
        bonusPerStack: this.getBonusPerStack(skillId, effectType)
      };
      stacks.push(newStack);
    }
  }

  /**
   * 스킬 효과 스택 업데이트 (시간 경과)
   */
  updateSkillEffectStacks(playerId: string, deltaTime: number): void {
    const stacks = this.playerSkillStacks.get(playerId);
    if (!stacks) return;

    for (let i = stacks.length - 1; i >= 0; i--) {
      const stack = stacks[i];
      stack.duration -= deltaTime;

      if (stack.duration <= 0) {
        stack.stacks -= 1;
        if (stack.stacks <= 0) {
          stacks.splice(i, 1); // 스택 제거
        } else {
          stack.duration = stack.stackDecayTime; // 다음 스택 감소 시간 설정
        }
      }
    }
  }

  /**
   * 동적 스킬 트리 확장
   */
  expandSkillTree(treeType: string, newSkills: SkillTreeNode[]): void {
    const tree = this.skillTrees.get(treeType) || [];
    tree.push(...newSkills);
    this.skillTrees.set(treeType, tree);
    
    logger.info(`스킬 트리 확장: ${treeType}에 ${newSkills.length}개 스킬 추가`);
  }

  /**
   * 무한 스킬 트리 생성 (절차적 생성)
   */
  generateProceduralSkillBranch(baseSkillId: string, depth: number = 5): SkillTreeNode[] {
    const newBranch: SkillTreeNode[] = [];
    
    for (let i = 0; i < depth; i++) {
      const newSkill: SkillTreeNode = {
        skillId: `${baseSkillId}_evolved_${i + 1}`,
        level: 0,
        maxLevel: Math.max(10, 50 - (i * 10)), // 진화할수록 최대 레벨 감소
        children: [],
        parents: i === 0 ? [baseSkillId] : [`${baseSkillId}_evolved_${i}`],
        position: { x: i + 1, y: Math.floor(Math.random() * 3) },
        unlocked: false,
        experience: 0,
        requiredExperience: 100 * Math.pow(2, i)
      };
      newBranch.push(newSkill);
    }

    return newBranch;
  }

  // 헬퍼 함수들
  private getSkillRarity(skillId: string): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'transcendent' {
    // 스킬 ID 기반으로 희소성 결정 (실제로는 데이터에서 가져와야 함)
    if (skillId.includes('transcendent') || skillId.includes('divine')) return 'transcendent';
    if (skillId.includes('legendary') || skillId.includes('ultimate')) return 'legendary';
    if (skillId.includes('epic') || skillId.includes('master')) return 'epic';
    if (skillId.includes('rare') || skillId.includes('advanced')) return 'rare';
    if (skillId.includes('uncommon') || skillId.includes('improved')) return 'uncommon';
    return 'common';
  }

  private getSkillMaxLevel(skillId: string): number {
    // 스킬별 최대 레벨 (기본값은 100, 특별한 스킬은 더 낮을 수 있음)
    const rarity = this.getSkillRarity(skillId);
    const baseLevels = {
      common: 100,
      uncommon: 75,
      rare: 50,
      epic: 25,
      legendary: 10,
      transcendent: 5
    };
    return baseLevels[rarity];
  }

  private calculateRequiredExperience(skillId: string, level: number): number {
    const baseExp = 100;
    const rarity = this.getSkillRarity(skillId);
    const rarityMultiplier = {
      common: 1,
      uncommon: 1.5,
      rare: 2.5,
      epic: 4,
      legendary: 7,
      transcendent: 12
    };
    
    return Math.floor(baseExp * Math.pow(level, 1.3) * (rarityMultiplier[rarity] || 1));
  }

  private checkSkillPrerequisites(player: Player, skillId: string, targetLevel: number): {
    met: boolean;
    missing: string[];
  } {
    // 기본적인 전제조건 체크 (실제로는 더 복잡한 로직)
    return { met: true, missing: [] };
  }

  private getSkillEffectsAtLevel(skillId: string, level: number): SkillEffect[] {
    // 레벨별 스킬 효과 반환 (실제로는 데이터에서 가져와야 함)
    return [];
  }

  private checkSkillEvolution(player: Player, skillId: string): SkillEvolution | undefined {
    return this.skillEvolutions.find(evo => 
      evo.baseSkillId === skillId && 
      player.skills[skillId]?.level >= evo.requirements.level
    );
  }

  private getMaxStacksForEffect(skillId: string, effectType: string): number {
    return 10; // 기본값
  }

  private getStackDuration(skillId: string, effectType: string): number {
    return 30000; // 30초
  }

  private getBonusPerStack(skillId: string, effectType: string): number {
    return 1; // 스택당 1% 보너스
  }

  /**
   * 스킬 트리 전체 상태 반환
   */
  getSkillTreeState(player: Player, treeType: string): {
    nodes: SkillTreeNode[];
    availableEvolutions: SkillEvolution[];
    availableCombinations: SkillCombination[];
    pointSystem: SkillPointSystem;
  } {
    const nodes = this.skillTrees.get(treeType) || [];
    const availableEvolutions = this.skillEvolutions.filter(evo => 
      player.skills[evo.baseSkillId] && 
      player.skills[evo.baseSkillId].level >= evo.requirements.level
    );
    
    const availableCombinations = this.skillCombinations.filter(combo =>
      combo.requiredSkills.every(req => 
        player.skills[req.skillId] && 
        player.skills[req.skillId].level >= req.level
      )
    );

    return {
      nodes,
      availableEvolutions,
      availableCombinations,
      pointSystem: this.getSkillPointSystem(player)
    };
  }
}

// 전역 스킬 트리 시스템 인스턴스
export const skillTreeSystem = new SkillTreeSystem();

// 스킬 관련 유틸리티 함수들
export const skillUtils = {
  /**
   * 스킬 효과 계산
   */
  calculateSkillDamage(skill: any, playerStats: Stats): number {
    // 기본 스킬 데미지 계산 로직
    let baseDamage = skill.baseDamage || 0;
    let scalingStats = skill.scaling || {};
    
    Object.entries(scalingStats).forEach(([stat, ratio]: [string, any]) => {
      baseDamage += (playerStats as any)[stat] * ratio;
    });

    return Math.floor(baseDamage * (1 + skill.level * 0.1)); // 레벨당 10% 증가
  },

  /**
   * 스킬 쿨다운 계산
   */
  calculateCooldown(skill: any, playerStats: Stats): number {
    let baseCooldown = skill.cooldown || 0;
    let cooldownReduction = 0;

    // CDR 계산 (예: 민첩성 기반)
    cooldownReduction = playerStats.dex * 0.001; // DEX 1000당 100% CDR

    return Math.max(0.1, baseCooldown * (1 - cooldownReduction));
  },

  /**
   * 스킬 시너지 계산
   */
  calculateSkillSynergy(playerSkills: Record<string, any>): number {
    let synergyBonus = 0;
    const skillIds = Object.keys(playerSkills);

    // 관련 스킬들 간의 시너지 보너스
    if (skillIds.includes('fireball') && skillIds.includes('ice_shard')) {
      synergyBonus += 0.25; // 25% 원소 시너지
    }

    return synergyBonus;
  }
};
