import { Player, Stats } from '@/types/game';
import { logger } from './logger';

// 무한 레벨업 공식 설정
interface LevelConfig {
  baseExperience: number; // 레벨 1에서 2로 가는 기본 경험치
  exponentialBase: number; // 지수 증가율
  linearMultiplier: number; // 선형 증가율
  scalingFactor: number; // 후반 스케일링 팩터
}

const DEFAULT_LEVEL_CONFIG: LevelConfig = {
  baseExperience: 100,
  exponentialBase: 1.15, // 15% 지수 증가
  linearMultiplier: 50,   // 레벨당 50 추가 경험치
  scalingFactor: 1.02     // 레벨 100 이후 추가 스케일링
};

// 레벨별 스탯 증가 설정
interface StatGrowthConfig {
  baseStatPerLevel: number; // 레벨당 기본 스탯 증가
  statChoiceBonus: number;  // 선택한 스탯에 대한 추가 보너스
  milestoneBonus: number;   // 마일스톤 레벨에서의 보너스
  milestoneInterval: number; // 마일스톤 간격 (예: 10레벨마다)
}

const DEFAULT_STAT_GROWTH: StatGrowthConfig = {
  baseStatPerLevel: 2,    // 레벨당 모든 스탯 +2
  statChoiceBonus: 3,     // 선택한 스탯 추가 +3
  milestoneBonus: 5,      // 마일스톤에서 모든 스탯 +5
  milestoneInterval: 10
};

export class LevelSystem {
  private config: LevelConfig;
  private statGrowth: StatGrowthConfig;

  constructor(config?: Partial<LevelConfig>, statGrowth?: Partial<StatGrowthConfig>) {
    this.config = { ...DEFAULT_LEVEL_CONFIG, ...config };
    this.statGrowth = { ...DEFAULT_STAT_GROWTH, ...statGrowth };
  }

  /**
   * 특정 레벨에 도달하기 위해 필요한 총 경험치 계산 (무한 레벨 지원)
   */
  getRequiredExperience(level: number): number {
    if (level <= 1) return 0;

    let totalExp = 0;
    
    for (let l = 1; l < level; l++) {
      // 기본 지수 증가
      let expForLevel = this.config.baseExperience * Math.pow(this.config.exponentialBase, l - 1);
      
      // 선형 증가 요소 추가
      expForLevel += this.config.linearMultiplier * l;
      
      // 고레벨 스케일링 (레벨 100 이후)
      if (l >= 100) {
        const extraLevels = l - 100;
        expForLevel *= Math.pow(this.config.scalingFactor, extraLevels);
      }
      
      // 매우 고레벨에서의 추가 스케일링 (레벨 1000 이후)
      if (l >= 1000) {
        const megaLevels = l - 1000;
        expForLevel *= Math.pow(1.01, megaLevels);
      }
      
      totalExp += Math.floor(expForLevel);
    }

    return totalExp;
  }

  /**
   * 현재 레벨에서 다음 레벨까지 필요한 경험치 계산
   */
  getExperienceForNextLevel(currentLevel: number): number {
    return this.getRequiredExperience(currentLevel + 1) - this.getRequiredExperience(currentLevel);
  }

  /**
   * 경험치로부터 레벨 계산 (이진 탐색 사용)
   */
  getLevelFromExperience(experience: number): number {
    if (experience < this.config.baseExperience) return 1;

    // 이진 탐색으로 효율적인 레벨 계산
    let low = 1;
    let high = Math.max(100, Math.floor(experience / this.config.baseExperience));
    
    // 매우 높은 경험치의 경우 상한선 확장
    while (this.getRequiredExperience(high) < experience) {
      high *= 2;
    }

    while (low < high) {
      const mid = Math.floor((low + high + 1) / 2);
      if (this.getRequiredExperience(mid) <= experience) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return low;
  }

  /**
   * 레벨업 처리 및 스탯 증가 계산
   */
  processLevelUp(player: Player, gainedExperience: number, selectedStat?: keyof Stats): {
    leveledUp: boolean;
    levelsGained: number;
    statGains: Partial<Stats>;
    milestoneReached: boolean;
  } {
    const oldLevel = player.level;
    const newExperience = player.experience + gainedExperience;
    const newLevel = this.getLevelFromExperience(newExperience);
    const levelsGained = newLevel - oldLevel;
    
    if (levelsGained <= 0) {
      return {
        leveledUp: false,
        levelsGained: 0,
        statGains: {},
        milestoneReached: false
      };
    }

    // 레벨업마다 스탯 증가 계산
    const statGains = this.calculateStatGains(oldLevel, newLevel, selectedStat);
    
    // 마일스톤 도달 확인
    const milestoneReached = this.checkMilestoneReached(oldLevel, newLevel);

    logger.info(`플레이어 레벨업: ${oldLevel} → ${newLevel} (+${levelsGained} 레벨)`);
    logger.info(`스탯 증가:`, statGains);
    
    if (milestoneReached) {
      logger.info(`마일스톤 달성! 레벨 ${newLevel}`);
    }

    return {
      leveledUp: true,
      levelsGained,
      statGains,
      milestoneReached
    };
  }

  /**
   * 레벨 범위에 따른 스탯 증가 계산
   */
  private calculateStatGains(oldLevel: number, newLevel: number, selectedStat?: keyof Stats): Partial<Stats> {
    const statGains: Partial<Stats> = {
      hp: 0,
      mp: 0,
      str: 0,
      dex: 0,
      int: 0,
      vit: 0,
      luk: 0
    };

    for (let level = oldLevel + 1; level <= newLevel; level++) {
      // 기본 스탯 증가 (모든 스탯에 적용)
      statGains.str! += this.statGrowth.baseStatPerLevel;
      statGains.dex! += this.statGrowth.baseStatPerLevel;
      statGains.int! += this.statGrowth.baseStatPerLevel;
      statGains.vit! += this.statGrowth.baseStatPerLevel;
      statGains.luk! += this.statGrowth.baseStatPerLevel;

      // 선택한 스탯에 추가 보너스
      if (selectedStat && selectedStat !== 'hp' && selectedStat !== 'mp') {
        statGains[selectedStat]! += this.statGrowth.statChoiceBonus;
      }

      // 마일스톤 보너스
      if (level % this.statGrowth.milestoneInterval === 0) {
        statGains.str! += this.statGrowth.milestoneBonus;
        statGains.dex! += this.statGrowth.milestoneBonus;
        statGains.int! += this.statGrowth.milestoneBonus;
        statGains.vit! += this.statGrowth.milestoneBonus;
        statGains.luk! += this.statGrowth.milestoneBonus;
      }

      // HP/MP 계산 (VIT/INT 기반)
      const hpGain = Math.floor((statGains.vit! / 5) * 10); // VIT 5당 HP 10 증가
      const mpGain = Math.floor((statGains.int! / 3) * 5);  // INT 3당 MP 5 증가
      
      statGains.hp! += hpGain;
      statGains.mp! += mpGain;
    }

    return statGains;
  }

  /**
   * 마일스톤 도달 확인
   */
  private checkMilestoneReached(oldLevel: number, newLevel: number): boolean {
    const oldMilestone = Math.floor(oldLevel / this.statGrowth.milestoneInterval);
    const newMilestone = Math.floor(newLevel / this.statGrowth.milestoneInterval);
    return newMilestone > oldMilestone;
  }

  /**
   * 레벨에 따른 추천 스탯 분배 제안
   */
  getRecommendedStatDistribution(level: number, playerClass?: string): Partial<Stats> {
    const recommendations: Record<string, Partial<Stats>> = {
      warrior: { str: 0.4, vit: 0.3, dex: 0.2, int: 0.05, luk: 0.05 },
      mage: { int: 0.4, mp: 0.3, dex: 0.15, vit: 0.1, luk: 0.05 },
      archer: { dex: 0.4, str: 0.25, vit: 0.2, int: 0.1, luk: 0.05 },
      thief: { dex: 0.35, luk: 0.3, str: 0.2, vit: 0.1, int: 0.05 },
      priest: { int: 0.35, vit: 0.25, mp: 0.2, dex: 0.15, luk: 0.05 },
      balanced: { str: 0.2, dex: 0.2, int: 0.2, vit: 0.2, luk: 0.2 }
    };

    const classType = playerClass?.toLowerCase() || 'balanced';
    const distribution = recommendations[classType] || recommendations.balanced;
    
    const totalStats = level * this.statGrowth.baseStatPerLevel;
    const result: Partial<Stats> = {};
    
    Object.entries(distribution).forEach(([stat, ratio]) => {
      if (stat !== 'hp' && stat !== 'mp') {
        result[stat as keyof Stats] = Math.floor(totalStats * ratio);
      }
    });

    return result;
  }

  /**
   * 레벨 페널티 없는 시스템 - 모든 콘텐츠는 플레이어 레벨에 맞춰 스케일링
   */
  getScaledContentDifficulty(baseLevel: number, playerLevel: number): {
    scaledLevel: number;
    experienceMultiplier: number;
    rewardMultiplier: number;
  } {
    // 플레이어보다 낮은 레벨의 콘텐츠도 적절한 난이도와 보상 제공
    const levelDifference = playerLevel - baseLevel;
    
    let scaledLevel = baseLevel;
    let experienceMultiplier = 1.0;
    let rewardMultiplier = 1.0;

    if (levelDifference > 0) {
      // 플레이어가 높은 레벨일 때 - 콘텐츠를 일부 스케일링
      const scalingRatio = Math.min(0.8, levelDifference / 100); // 최대 80%까지 스케일링
      scaledLevel = Math.floor(baseLevel + (levelDifference * scalingRatio));
      
      // 경험치는 줄어들지만 0이 되지는 않음
      experienceMultiplier = Math.max(0.1, 1 - (levelDifference * 0.01));
      
      // 보상은 유지하되 약간 조정
      rewardMultiplier = Math.max(0.5, 1 - (levelDifference * 0.005));
    } else if (levelDifference < 0) {
      // 플레이어가 낮은 레벨일 때 - 추가 보상 제공
      const difficultyBonus = Math.abs(levelDifference);
      experienceMultiplier = 1 + (difficultyBonus * 0.05); // 레벨차 1당 5% 추가 경험치
      rewardMultiplier = 1 + (difficultyBonus * 0.03);     // 레벨차 1당 3% 추가 보상
    }

    return {
      scaledLevel: Math.max(1, scaledLevel),
      experienceMultiplier: Math.max(0.1, experienceMultiplier),
      rewardMultiplier: Math.max(0.5, rewardMultiplier)
    };
  }

  /**
   * 레벨 구간별 특별 보상 계산
   */
  getLevelTierRewards(level: number): {
    tier: string;
    bonusStatPoints: number;
    specialRewards: string[];
  } {
    const tiers = [
      { min: 1, max: 99, name: 'Novice', bonusPoints: 0, rewards: [] },
      { min: 100, max: 199, name: 'Advanced', bonusPoints: 10, rewards: ['스탯 재분배권'] },
      { min: 200, max: 499, name: 'Expert', bonusPoints: 25, rewards: ['스탯 재분배권', '스킬 리셋권'] },
      { min: 500, max: 999, name: 'Master', bonusPoints: 50, rewards: ['스탯 재분배권', '스킬 리셋권', '특별 타이틀'] },
      { min: 1000, max: 1999, name: 'Grandmaster', bonusPoints: 100, rewards: ['전체 리셋권', '레전더리 타이틀'] },
      { min: 2000, max: 4999, name: 'Legend', bonusPoints: 200, rewards: ['전체 리셋권', '미스틱 타이틀', '특별 스킬'] },
      { min: 5000, max: 9999, name: 'Mythic', bonusPoints: 500, rewards: ['전체 리셋권', '디바인 타이틀', '고유 스킬'] },
      { min: 10000, max: Infinity, name: 'Transcendent', bonusPoints: 1000, rewards: ['무한 리셋권', '초월자 타이틀', '창조 스킬'] }
    ];

    const tier = tiers.find(t => level >= t.min && level <= t.max) || tiers[0];
    
    return {
      tier: tier.name,
      bonusStatPoints: tier.bonusPoints,
      specialRewards: tier.rewards
    };
  }

  /**
   * 무한 성장을 위한 스탯 상한선 제거 및 소프트 캡 적용
   */
  applySoftCaps(stats: Stats): Stats {
    const softCapped = { ...stats };
    
    // 소프트 캡 적용 (효율성은 떨어지지만 무한 성장 가능)
    const applySoftCap = (value: number, softCap: number): number => {
      if (value <= softCap) return value;
      
      const excess = value - softCap;
      const softCapReduction = Math.log(excess + 1) * (softCap * 0.1);
      return softCap + softCapReduction;
    };

    // 각 스탯별 소프트 캡 적용
    softCapped.str = applySoftCap(stats.str, 999);
    softCapped.dex = applySoftCap(stats.dex, 999);
    softCapped.int = applySoftCap(stats.int, 999);
    softCapped.vit = applySoftCap(stats.vit, 999);
    softCapped.luk = applySoftCap(stats.luk, 999);
    
    // HP/MP는 더 높은 소프트 캡
    softCapped.hp = applySoftCap(stats.hp, 99999);
    softCapped.mp = applySoftCap(stats.mp, 99999);

    return softCapped;
  }
}

// 전역 레벨 시스템 인스턴스
export const levelSystem = new LevelSystem();

// 레벨 관련 유틸리티 함수들
export const levelUtils = {
  /**
   * 경험치 표시를 위한 포맷팅
   */
  formatExperience(exp: number): string {
    if (exp >= 1000000000) {
      return `${(exp / 1000000000).toFixed(1)}B`;
    } else if (exp >= 1000000) {
      return `${(exp / 1000000).toFixed(1)}M`;
    } else if (exp >= 1000) {
      return `${(exp / 1000).toFixed(1)}K`;
    }
    return exp.toString();
  },

  /**
   * 레벨업 진행률 계산
   */
  getLevelProgress(player: Player): number {
    const currentLevelExp = levelSystem.getRequiredExperience(player.level);
    const nextLevelExp = levelSystem.getRequiredExperience(player.level + 1);
    const expInCurrentLevel = player.experience - currentLevelExp;
    const expNeededForNext = nextLevelExp - currentLevelExp;
    
    return Math.min(100, Math.max(0, (expInCurrentLevel / expNeededForNext) * 100));
  },

  /**
   * 다음 레벨까지 남은 경험치
   */
  getExperienceToNextLevel(player: Player): number {
    const nextLevelExp = levelSystem.getRequiredExperience(player.level + 1);
    return Math.max(0, nextLevelExp - player.experience);
  }
};
