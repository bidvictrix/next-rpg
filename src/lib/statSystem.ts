import { Player } from '@/types/player';
import { Stats } from '@/types/game';
import { LogCategory } from './logger';
import { logger } from './logger';

// 스탯 포인트 시스템
interface StatPointSystem {
  totalPoints: number;
  usedPoints: number;
  availablePoints: number;
  pointsPerLevel: number;
  bonusPoints: number;
  pointSources: StatPointSource[];
}

interface StatPointSource {
  id: string;
  name: string;
  points: number;
  type: 'level' | 'quest' | 'achievement' | 'item' | 'event';
}

// 파생 스탯 정의
interface DerivedStats {
  // 전투 관련
  physicalDamage: number;
  magicalDamage: number;
  physicalDefense: number;
  magicalDefense: number;
  criticalRate: number;
  criticalDamage: number;
  attackSpeed: number;
  movementSpeed: number;
  
  // 생존 관련
  healthRegen: number;
  manaRegen: number;
  lifeSteal: number;
  manaSteal: number;
  
  // 유틸리티
  carryCapacity: number;
  experienceGain: number;
  goldFind: number;
  itemFind: number;
  
  // 저항
  fireResistance: number;
  waterResistance: number;
  earthResistance: number;
  airResistance: number;
  lightResistance: number;
  darkResistance: number;
}

// 스탯 시너지 시스템
interface StatSynergy {
  stats: (keyof Stats)[];
  bonusType: 'multiplicative' | 'additive';
  threshold: number;
  bonus: number;
  description: string;
}

// 스탯 특화 빌드
interface StatBuild {
  id: string;
  name: string;
  description: string;
  primaryStats: (keyof Stats)[];
  secondaryStats: (keyof Stats)[];
  statDistribution: Partial<Stats>;
  recommendedLevel: number;
  synergies: string[];
}

// 스탯 상한선 시스템
interface StatCap {
  stat: keyof Stats;
  softCap: number;
  hardCap: number;
  diminishingReturn: number; // 소프트 캡 이후 효율성 감소율
}

export class StatSystem {
  private statCaps: StatCap[] = [];
  private statSynergies: StatSynergy[] = [];
  private statBuilds: StatBuild[] = [];
  private statPointsPerLevel: number = 5;
  // 안전한 스탯 갱신용 유틸(동적 키 할당 시 TS 인덱싱 경고 방지)
  private setStatValue(target: Stats, key: keyof Stats, value: number): void {
    (target as unknown as Record<string, number>)[key as string] = value;
  }

  constructor() {
    this.initializeStatCaps();
    this.initializeStatSynergies();
    this.initializeStatBuilds();
  }

  /**
   * 스탯 상한선 초기화 (무한 성장을 위한 소프트 캡)
   */
  private initializeStatCaps(): void {
    this.statCaps = [
      { stat: 'str', softCap: 999, hardCap: Infinity, diminishingReturn: 0.5 },
      { stat: 'dex', softCap: 999, hardCap: Infinity, diminishingReturn: 0.5 },
      { stat: 'int', softCap: 999, hardCap: Infinity, diminishingReturn: 0.5 },
      { stat: 'vit', softCap: 999, hardCap: Infinity, diminishingReturn: 0.5 },
      { stat: 'luk', softCap: 999, hardCap: Infinity, diminishingReturn: 0.5 },
      { stat: 'hp', softCap: 99999, hardCap: Infinity, diminishingReturn: 0.3 },
      { stat: 'mp', softCap: 99999, hardCap: Infinity, diminishingReturn: 0.3 }
    ];
  }

  /**
   * 스탯 시너지 초기화
   */
  private initializeStatSynergies(): void {
    this.statSynergies = [
      {
        stats: ['str', 'dex'],
        bonusType: 'multiplicative',
        threshold: 500,
        bonus: 0.25,
        description: '힘과 민첩성이 500 이상일 때 물리 데미지 25% 증가'
      },
      {
        stats: ['int', 'vit'],
        bonusType: 'multiplicative',
        threshold: 500,
        bonus: 0.3,
        description: '지능과 체력이 500 이상일 때 마나 회복력 30% 증가'
      },
      {
        stats: ['str', 'int', 'dex'],
        bonusType: 'additive',
        threshold: 1000,
        bonus: 100,
        description: '힘, 지능, 민첩성이 모두 1000 이상일 때 모든 스탯 +100'
      },
      {
        stats: ['luk'],
        bonusType: 'multiplicative',
        threshold: 777,
        bonus: 0.777,
        description: '행운이 777 이상일 때 모든 확률 효과 77.7% 증가'
      }
    ];
  }

  /**
   * 추천 스탯 빌드 초기화
   */
  private initializeStatBuilds(): void {
    this.statBuilds = [
      {
        id: 'pure_warrior',
        name: '순수 전사',
        description: '물리 공격력에 특화된 빌드',
        primaryStats: ['str', 'vit'],
        secondaryStats: ['dex', 'hp'],
        statDistribution: { str: 0.5, vit: 0.3, dex: 0.15, int: 0.03, luk: 0.02 },
        recommendedLevel: 1,
        synergies: ['str_dex_synergy']
      },
      {
        id: 'pure_mage',
        name: '순수 마법사',
        description: '마법 공격력에 특화된 빌드',
        primaryStats: ['int', 'mp'],
        secondaryStats: ['vit', 'dex'],
        statDistribution: { int: 0.5, vit: 0.25, mp: 0.15, dex: 0.08, luk: 0.02 },
        recommendedLevel: 1,
        synergies: ['int_vit_synergy']
      },
      {
        id: 'hybrid_warrior',
        name: '하이브리드 전사',
        description: '물리와 마법을 병행하는 빌드',
        primaryStats: ['str', 'int'],
        secondaryStats: ['vit', 'dex'],
        statDistribution: { str: 0.35, int: 0.35, vit: 0.2, dex: 0.08, luk: 0.02 },
        recommendedLevel: 50,
        synergies: ['tri_stat_synergy']
      },
      {
        id: 'luck_master',
        name: '행운의 주인',
        description: '행운에 올인하는 극한 빌드',
        primaryStats: ['luk'],
        secondaryStats: ['vit', 'dex'],
        statDistribution: { luk: 0.6, vit: 0.2, dex: 0.1, str: 0.05, int: 0.05 },
        recommendedLevel: 100,
        synergies: ['luck_synergy']
      },
      {
        id: 'transcendent',
        name: '초월자',
        description: '모든 스탯을 균등하게 발전시키는 후반 빌드',
        primaryStats: ['str', 'dex', 'int', 'vit', 'luk'],
        secondaryStats: ['hp', 'mp'],
        statDistribution: { str: 0.2, dex: 0.2, int: 0.2, vit: 0.2, luk: 0.2 },
        recommendedLevel: 500,
        synergies: ['all_synergies']
      }
    ];
  }

  /**
   * 스탯 포인트 시스템 관리
   */
  getStatPointSystem(player: Player): StatPointSystem {
    const pointsFromLevel = player.level.level * this.statPointsPerLevel;
    const bonusPoints = this.calculateBonusStatPoints(player);
    const usedPoints = this.calculateUsedStatPoints(player);
    
    const pointSources: StatPointSource[] = [
      {
        id: 'level',
        name: '레벨업',
        points: pointsFromLevel,
        type: 'level'
      },
      {
        id: 'bonus',
        name: '보너스',
        points: bonusPoints,
        type: 'achievement'
      }
    ];

    return {
      totalPoints: pointsFromLevel + bonusPoints,
      usedPoints,
      availablePoints: (pointsFromLevel + bonusPoints) - usedPoints,
      pointsPerLevel: this.statPointsPerLevel,
      bonusPoints,
      pointSources
    };
  }

  /**
   * 스탯 포인트 분배
   */
  allocateStatPoints(player: Player, allocation: Partial<Stats>): {
    success: boolean;
    newStats: Stats;
    error?: string;
  } {
    const pointSystem = this.getStatPointSystem(player);
    const pointsToSpend = Object.values(allocation).reduce<number>((sum, points) => {
      return sum + (Number(points) || 0);
    }, 0);

    if (pointsToSpend > pointSystem.availablePoints) {
      return {
        success: false,
        newStats: player.stats,
        error: '사용 가능한 포인트가 부족합니다.'
      };
    }

    // 스탯 적용
    const newStats: Stats = { ...player.stats } as Stats;
    Object.entries(allocation).forEach(([stat, points]) => {
      const key = stat as keyof Stats;
      const value = Number(points) || 0;
      if (value > 0) {
        const current = (newStats[key] as number | undefined) ?? 0;
        this.setStatValue(newStats, key, current + value);
      }
    });

    // 소프트 캡 적용
    const cappedStats = this.applySoftCaps(newStats);
    
    // 파생 스탯 계산
    const derivedStats = this.calculateDerivedStats(cappedStats);
    
    player.stats = cappedStats;
    
    logger.info(LogCategory.PLAYER, '스탯 포인트 분배', { allocation });
    
    return {
      success: true,
      newStats: cappedStats
    };
  }

  /**
   * 소프트 캡 적용 (무한 성장을 위한 효율성 감소)
   */
  applySoftCaps(stats: Stats): Stats {
    const cappedStats: Stats = { ...stats } as Stats;
    
    this.statCaps.forEach(cap => {
      const key = cap.stat as keyof Stats;
      const currentValue = (stats[key] as number | undefined) ?? 0;
      
      if (currentValue > cap.softCap) {
        const excess = currentValue - cap.softCap;
        const diminishedExcess = excess * cap.diminishingReturn;
        this.setStatValue(cappedStats, key, cap.softCap + diminishedExcess);
      }
      
      // 하드 캡 적용 (무한대가 아닌 경우)
      if (cap.hardCap !== Infinity && currentValue > cap.hardCap) {
        this.setStatValue(cappedStats, key, cap.hardCap);
      }
    });

    return cappedStats;
  }

  /**
   * 파생 스탯 계산
   */
  calculateDerivedStats(stats: Stats): DerivedStats {
    return {
      // 전투 관련
      physicalDamage: Math.floor(stats.str * 1.5 + stats.dex * 0.5),
      magicalDamage: Math.floor(stats.int * 1.8 + stats.luk * 0.2),
      physicalDefense: Math.floor(stats.vit * 1.2 + stats.str * 0.3),
      magicalDefense: Math.floor(stats.int * 1.0 + stats.vit * 0.5),
      criticalRate: Math.floor((stats.dex + stats.luk) * 0.1),
      criticalDamage: Math.floor(150 + stats.luk * 0.5), // 기본 150%
      attackSpeed: Math.floor(100 + stats.dex * 0.2), // 기본 100%
      movementSpeed: Math.floor(100 + stats.dex * 0.15),
      
      // 생존 관련
      healthRegen: Math.floor(stats.vit * 0.5 + ((stats.hp ?? 0) * 0.01)),
      manaRegen: Math.floor(stats.int * 0.8 + ((stats.mp ?? 0) * 0.02)),
      lifeSteal: Math.floor(stats.luk * 0.05),
      manaSteal: Math.floor(stats.int * 0.03),
      
      // 유틸리티
      carryCapacity: Math.floor(100 + stats.str * 2 + stats.vit * 1),
      experienceGain: Math.floor(100 + stats.luk * 0.1),
      goldFind: Math.floor(100 + stats.luk * 0.3),
      itemFind: Math.floor(100 + stats.luk * 0.2),
      
      // 저항 (초기값은 낮지만 스탯에 따라 증가)
      fireResistance: Math.floor(stats.int * 0.1),
      waterResistance: Math.floor(stats.int * 0.1),
      earthResistance: Math.floor(stats.vit * 0.1),
      airResistance: Math.floor(stats.dex * 0.1),
      lightResistance: Math.floor(stats.luk * 0.1),
      darkResistance: Math.floor(stats.str * 0.1)
    };
  }

  /**
   * 스탯 시너지 효과 적용
   */
  applyStatSynergies(player: Player): {
    bonuses: { [key: string]: number };
    activesynergies: StatSynergy[];
  } {
    const bonuses: { [key: string]: number } = {};
    const activeSynergies: StatSynergy[] = [];

    this.statSynergies.forEach(synergy => {
      const meetsThreshold = synergy.stats.every(statKey => {
        const value = (player.stats[statKey] as number | undefined) ?? 0;
        return value >= synergy.threshold;
      });

      if (meetsThreshold) {
        activeSynergies.push(synergy);
        
        if (synergy.bonusType === 'additive') {
          synergy.stats.forEach(statKey => {
            const k = String(statKey);
            bonuses[k] = (bonuses[k] || 0) + synergy.bonus;
          });
        } else {
          // multiplicative 보너스는 별도 처리
          bonuses[`${synergy.stats.join('_')}_multiplier`] = synergy.bonus;
        }
      }
    });

    return { bonuses, activesynergies: activeSynergies };
  }

  /**
   * 스탯 재분배 시스템
   */
  resetStats(player: Player, resetType: 'partial' | 'full' | 'free'): {
    success: boolean;
    cost: number;
    error?: string;
  } {
    let cost = 0;
    
    switch (resetType) {
      case 'free':
        cost = 0;
        break;
      case 'partial':
        cost = Math.floor(player.level.level * 100); // 레벨당 100골드
        break;
      case 'full':
        cost = Math.floor(player.level.level * 500); // 레벨당 500골드
        break;
    }

    // 골드 확인 (실제로는 player.gold가 있어야 함)
    // if (player.gold < cost) {
    //   return { success: false, cost, error: '골드가 부족합니다.' };
    // }

    // 스탯 초기화
    const baseStats = this.getBaseStatsForLevel(player.level.level);
    player.stats = baseStats;

    logger.info(LogCategory.PLAYER, '스탯 리셋', { resetType, cost });

    return { success: true, cost };
  }

  /**
   * 추천 스탯 분배 제안
   */
  getRecommendedStatAllocation(player: Player, buildId?: string): {
    recommendation: Partial<Stats>;
    explanation: string;
    build: StatBuild | null;
  } {
    let build: StatBuild | null = null;
    
    if (buildId) {
      build = this.statBuilds.find(b => b.id === buildId) || null;
    } else {
      // 현재 스탯 분포를 기반으로 적합한 빌드 추천
      build = this.suggestBuildBasedOnCurrentStats(player);
    }

    if (!build) {
      return {
        recommendation: { str: 1, dex: 1, int: 1, vit: 1, luk: 1 },
        explanation: '균등 분배를 추천합니다.',
        build: null
      };
    }

    const pointSystem = this.getStatPointSystem(player);
    const recommendation: Partial<Stats> = {};
    
    Object.entries(build.statDistribution).forEach(([stat, ratio]) => {
      if (ratio) {
        const value = Math.floor(pointSystem.availablePoints * Number(ratio));
        recommendation[stat as keyof Stats] = value;
      }
    });

    return {
      recommendation,
      explanation: build.description,
      build
    };
  }

  /**
   * 스탯 효율성 분석
   */
  analyzeStatEfficiency(player: Player): {
    efficiency: { [stat: string]: number };
    recommendations: string[];
    bottlenecks: string[];
  } {
    const stats = player.stats;
    const efficiency: { [stat: string]: number } = {};
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];

    // 각 스탯의 효율성 계산 (소프트 캡 대비)
    this.statCaps.forEach(cap => {
      const key = cap.stat as keyof Stats;
      const currentValue = (stats[key] as number | undefined) ?? 0;
      const efficiencyRate = currentValue <= cap.softCap ? 1.0 : cap.diminishingReturn;
      efficiency[String(cap.stat)] = efficiencyRate;

      if (efficiencyRate < 0.7) {
        bottlenecks.push(`${String(cap.stat)}가 소프트 캡을 크게 초과했습니다.`);
      }
    });

    // 스탯 밸런스 분석
    const primaryStats = [stats.str, stats.dex, stats.int, stats.vit, stats.luk];
    const maxStat = Math.max(...primaryStats);
    const minStat = Math.min(...primaryStats);
    const imbalanceRatio = maxStat / (minStat || 1);

    if (imbalanceRatio > 5) {
      recommendations.push('스탯이 불균형합니다. 낮은 스탯을 보완하는 것을 고려해보세요.');
    }

    // 시너지 분석
    const { activesynergies } = this.applyStatSynergies(player);
    if (activesynergies.length === 0) {
      recommendations.push('스탯 시너지를 활용할 수 있도록 특정 스탯을 집중 투자해보세요.');
    }

    return {
      efficiency,
      recommendations,
      bottlenecks
    };
  }

  /**
   * 스탯 시뮬레이션
   */
  simulateStatAllocation(player: Player, allocation: Partial<Stats>, levels: number = 1): {
    projectedStats: Stats;
    projectedDerived: DerivedStats;
    efficiency: number;
    warnings: string[];
  } {
    // 임시 플레이어 객체 생성
    const tempPlayer: Player = {
      ...player,
      level: { ...player.level, level: player.level.level + levels },
      stats: { ...player.stats }
    } as Player;

    // 추가 레벨의 스탯 포인트 계산
    const additionalPoints = levels * this.statPointsPerLevel;
    const totalAllocation = { ...allocation };
    
    // 현재 분배와 미래 분배 결합
    Object.entries(allocation).forEach(([stat, points]) => {
      if (points) {
        const key = stat as keyof Stats;
        const current = (tempPlayer.stats[key] as number | undefined) ?? 0;
        this.setStatValue(tempPlayer.stats, key, current + (Number(points) || 0));
      }
    });

    const projectedStats = this.applySoftCaps(tempPlayer.stats);
    const projectedDerived = this.calculateDerivedStats(projectedStats);
    
    // 효율성 계산
    let totalEfficiency = 0;
    let statCount = 0;
    
    this.statCaps.forEach(cap => {
      const key = cap.stat as keyof Stats;
      const value = (projectedStats[key] as number | undefined) ?? 0;
      const efficiency = value <= cap.softCap ? 1.0 : cap.diminishingReturn;
      totalEfficiency += efficiency;
      statCount++;
    });

    const averageEfficiency = totalEfficiency / statCount;
    
    // 경고 생성
    const warnings: string[] = [];
    if (averageEfficiency < 0.7) {
      warnings.push('스탯 효율성이 낮습니다. 소프트 캡을 고려해보세요.');
    }

    return {
      projectedStats,
      projectedDerived,
      efficiency: averageEfficiency,
      warnings
    };
  }

  // 헬퍼 함수들
  private calculateBonusStatPoints(player: Player): number {
    let bonus = 0;
    
    // 업적 기반 보너스
    bonus += Math.floor(player.level.level / 50) * 5; // 50레벨마다 5포인트
    
    // 퀘스트 완료 보너스 등 추가 가능
    
    return bonus;
  }

  private calculateUsedStatPoints(player: Player): number {
    const baseStats = this.getBaseStatsForLevel(1);
    let usedPoints = 0;
    
    Object.entries(player.stats).forEach(([stat, value]) => {
      const key = stat as keyof Stats;
      const baseValue = (baseStats[key] as number | undefined) ?? 0;
      const allocated = (Number(value) || 0) - baseValue;
      if (allocated > 0) {
        usedPoints += allocated;
      }
    });

    return usedPoints;
  }

  private getBaseStatsForLevel(level: number): Stats {
    const basePrimary = { str: 10, dex: 10, int: 10, vit: 10, luk: 10 };
    const hp = 100 + (level - 1) * 10;
    const mp = 50 + (level - 1) * 5;
    const def = Math.round(basePrimary.vit * 1.5 + (level - 1) * 1.5);
    return {
      ...basePrimary,
      hp,
      mp,
      def
    };
  }

  private suggestBuildBasedOnCurrentStats(player: Player): StatBuild | null {
    const stats = player.stats;
    const total = stats.str + stats.dex + stats.int + stats.vit + stats.luk;
    
    if (total === 0) return this.statBuilds[0]; // 기본 빌드
    
    // 가장 높은 스탯 기반으로 빌드 추천
    const highestStat = Object.entries({
      str: stats.str,
      dex: stats.dex,
      int: stats.int,
      vit: stats.vit,
      luk: stats.luk
    }).reduce((a, b) => a[1] > b[1] ? a : b)[0] as keyof Stats;

    switch (highestStat) {
      case 'str':
        return this.statBuilds.find(b => b.id === 'pure_warrior') || null;
      case 'int':
        return this.statBuilds.find(b => b.id === 'pure_mage') || null;
      case 'luk':
        return this.statBuilds.find(b => b.id === 'luck_master') || null;
      default:
        return this.statBuilds.find(b => b.id === 'transcendent') || null;
    }
  }

  /**
   * 전체 스탯 시스템 상태 반환
   */
  getStatSystemState(player: Player): {
    stats: Stats;
    derivedStats: DerivedStats;
    pointSystem: StatPointSystem;
    synergies: { bonuses: { [key: string]: number }; activesynergies: StatSynergy[] };
    efficiency: { efficiency: { [stat: string]: number }; recommendations: string[]; bottlenecks: string[] };
    availableBuilds: StatBuild[];
  } {
    return {
      stats: player.stats,
      derivedStats: this.calculateDerivedStats(player.stats),
      pointSystem: this.getStatPointSystem(player),
      synergies: this.applyStatSynergies(player),
      efficiency: this.analyzeStatEfficiency(player),
      availableBuilds: this.statBuilds.filter(build => player.level.level >= build.recommendedLevel)
    };
  }
}

// 전역 스탯 시스템 인스턴스
export const statSystem = new StatSystem();

// 스탯 관련 유틸리티 함수들
export const statUtils = {
  /**
   * 스탯 값 포맷팅
   */
  formatStatValue(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },

  /**
   * 스탯 비교
   */
  compareStats(stats1: Stats, stats2: Stats): Partial<Stats> {
    const difference: Partial<Stats> = {};
    
    Object.keys(stats1).forEach(key => {
      const stat = key as keyof Stats;
      const v2 = (stats2[stat] as number | undefined) ?? 0;
      const v1 = (stats1[stat] as number | undefined) ?? 0;
      difference[stat] = v2 - v1;
    });

    return difference;
  },

  /**
   * 스탯 총합 계산
   */
  getTotalStatPoints(stats: Stats): number {
    return stats.str + stats.dex + stats.int + stats.vit + stats.luk;
  },

  /**
   * 가장 높은/낮은 스탯 찾기
   */
  getHighestStat(stats: Stats): { stat: keyof Stats; value: number } {
    const primaryStats = {
      str: stats.str,
      dex: stats.dex,
      int: stats.int,
      vit: stats.vit,
      luk: stats.luk
    };

    const highest = Object.entries(primaryStats).reduce((a, b) => a[1] > b[1] ? a : b);
    return { stat: highest[0] as keyof Stats, value: highest[1] };
  },

  getLowestStat(stats: Stats): { stat: keyof Stats; value: number } {
    const primaryStats = {
      str: stats.str,
      dex: stats.dex,
      int: stats.int,
      vit: stats.vit,
      luk: stats.luk
    };

    const lowest = Object.entries(primaryStats).reduce((a, b) => a[1] < b[1] ? a : b);
    return { stat: lowest[0] as keyof Stats, value: lowest[1] };
  }
};
