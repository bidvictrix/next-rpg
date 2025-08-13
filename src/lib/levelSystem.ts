import { Player, LevelSystem, Stats } from '../types/player';
import { playerManager } from './playerManager';
import { gameDataManager } from './gameDataManager';

export interface ExperienceGain {
  source: 'combat' | 'quest' | 'skill' | 'craft' | 'exploration' | 'event';
  baseAmount: number;
  multiplier: number;
  bonus: number;
  finalAmount: number;
  description: string;
}

export interface LevelUpReward {
  statPoints: number;
  skillPoints: number;
  bonusRewards?: {
    gold?: number;
    items?: Array<{ itemId: string; quantity: number; }>;
    unlockFeatures?: string[];
  };
}

export interface StatAllocation {
  str?: number;
  dex?: number;
  int?: number;
  vit?: number;
  luk?: number;
}

export class LevelSystem {
  private readonly BASE_EXP_REQUIREMENT = 100;
  private readonly EXP_GROWTH_RATE = 1.2;
  private readonly MAX_LEVEL = 999999; // 무한 레벨 (실질적 한계)
  
  // 레벨별 보상 설정
  private readonly STAT_POINTS_PER_LEVEL = 5;
  private readonly SKILL_POINTS_PER_LEVEL = 1;
  
  // 경험치 멀티플라이어
  private readonly EXP_MULTIPLIERS = {
    combat: 1.0,
    quest: 1.5,
    skill: 0.8,
    craft: 0.6,
    exploration: 0.4,
    event: 2.0
  };

  /**
   * 플레이어에게 경험치 추가
   */
  async addExperience(
    playerId: string, 
    baseAmount: number, 
    source: ExperienceGain['source'],
    description: string = '',
    additionalMultiplier: number = 1.0
  ): Promise<{
    success: boolean;
    experienceGain: ExperienceGain;
    levelsGained: number;
    newLevel: number;
    rewards?: LevelUpReward[];
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return {
          success: false,
          experienceGain: this.createEmptyExpGain(),
          levelsGained: 0,
          newLevel: 0
        };
      }

      // 경험치 계산
      const expGain = this.calculateExperienceGain(
        baseAmount, 
        source, 
        player, 
        additionalMultiplier, 
        description
      );

      const initialLevel = player.level.level;
      let currentExp = player.level.experience + expGain.finalAmount;
      let currentLevel = player.level.level;
      let requiredExp = player.level.experienceToNext;

      const rewards: LevelUpReward[] = [];
      let levelsGained = 0;

      // 레벨업 처리
      while (currentExp >= requiredExp && currentLevel < this.MAX_LEVEL) {
        currentExp -= requiredExp;
        currentLevel++;
        levelsGained++;

        // 레벨업 보상 계산
        const reward = this.calculateLevelUpReward(currentLevel, player);
        rewards.push(reward);

        // 스탯 포인트 및 스킬 포인트 지급
        player.level.statPoints += reward.statPoints;
        player.level.skillPoints += reward.skillPoints;

        // 보너스 보상 적용
        if (reward.bonusRewards?.gold) {
          player.gold += reward.bonusRewards.gold;
        }

        if (reward.bonusRewards?.items) {
          for (const item of reward.bonusRewards.items) {
            await playerManager.addItem(playerId, item.itemId, item.quantity);
          }
        }

        // 다음 레벨 경험치 요구량 계산
        requiredExp = this.calculateRequiredExperience(currentLevel);
      }

      // 플레이어 데이터 업데이트
      player.level.level = currentLevel;
      player.level.experience = currentExp;
      player.level.experienceToNext = requiredExp;

      // 파생 스탯 재계산 (레벨업으로 인한)
      this.recalculateDerivedStats(player);

      await playerManager.savePlayer(player);

      // 레벨업 알림
      if (levelsGained > 0) {
        console.log(`플레이어 ${player.info.characterName}이(가) ${levelsGained}레벨 상승! (${initialLevel} → ${currentLevel})`);
      }

      return {
        success: true,
        experienceGain: expGain,
        levelsGained,
        newLevel: currentLevel,
        rewards: rewards.length > 0 ? rewards : undefined
      };
    } catch (error) {
      console.error(`경험치 추가 실패: ${playerId}`, error);
      return {
        success: false,
        experienceGain: this.createEmptyExpGain(),
        levelsGained: 0,
        newLevel: 0
      };
    }
  }

  /**
   * 스탯 포인트 할당
   */
  async allocateStatPoints(
    playerId: string, 
    allocation: StatAllocation
  ): Promise<{
    success: boolean;
    message: string;
    newStats?: Stats;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      // 할당할 포인트 계산
      const totalPoints = Object.values(allocation).reduce((sum, points) => sum + (points || 0), 0);
      
      if (totalPoints <= 0) {
        return { success: false, message: '할당할 스탯 포인트를 선택해주세요.' };
      }

      if (totalPoints > player.level.statPoints) {
        return { 
          success: false, 
          message: `스탯 포인트가 부족합니다. (보유: ${player.level.statPoints}, 필요: ${totalPoints})` 
        };
      }

      // 각 스탯의 최대값 확인 (레벨 * 10이 상한)
      const maxStatValue = player.level.level * 10;
      
      const newStats = { ...player.stats };
      
      if (allocation.str && newStats.str + allocation.str > maxStatValue) {
        return { success: false, message: `힘 스탯이 상한을 초과합니다. (최대: ${maxStatValue})` };
      }
      if (allocation.dex && newStats.dex + allocation.dex > maxStatValue) {
        return { success: false, message: `민첩 스탯이 상한을 초과합니다. (최대: ${maxStatValue})` };
      }
      if (allocation.int && newStats.int + allocation.int > maxStatValue) {
        return { success: false, message: `지능 스탯이 상한을 초과합니다. (최대: ${maxStatValue})` };
      }
      if (allocation.vit && newStats.vit + allocation.vit > maxStatValue) {
        return { success: false, message: `체력 스탯이 상한을 초과합니다. (최대: ${maxStatValue})` };
      }
      if (allocation.luk && newStats.luk + allocation.luk > maxStatValue) {
        return { success: false, message: `운 스탯이 상한을 초과합니다. (최대: ${maxStatValue})` };
      }

      // 스탯 적용
      if (allocation.str) newStats.str += allocation.str;
      if (allocation.dex) newStats.dex += allocation.dex;
      if (allocation.int) newStats.int += allocation.int;
      if (allocation.vit) newStats.vit += allocation.vit;
      if (allocation.luk) newStats.luk += allocation.luk;

      // 플레이어 데이터 업데이트
      player.stats = newStats;
      player.level.statPoints -= totalPoints;

      // 파생 스탯 재계산
      this.recalculateDerivedStats(player);

      await playerManager.savePlayer(player);

      return {
        success: true,
        message: `스탯 포인트 ${totalPoints}개를 할당했습니다.`,
        newStats: player.stats
      };
    } catch (error) {
      console.error(`스탯 포인트 할당 실패: ${playerId}`, error);
      return { success: false, message: '스탯 포인트 할당 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 스탯 리셋 (유료)
   */
  async resetStats(playerId: string, resetCost: number = 10000): Promise<{
    success: boolean;
    message: string;
    refundedPoints?: number;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      if (player.gold < resetCost) {
        return { 
          success: false, 
          message: `골드가 부족합니다. (필요: ${resetCost}, 보유: ${player.gold})` 
        };
      }

      // 기본 스탯 (레벨 1일 때의 기본 스탯: 각각 10)
      const baseStats = 10;
      
      // 현재 할당된 스탯 포인트 계산
      const allocatedStr = Math.max(0, player.stats.str - baseStats);
      const allocatedDex = Math.max(0, player.stats.dex - baseStats);
      const allocatedInt = Math.max(0, player.stats.int - baseStats);
      const allocatedVit = Math.max(0, player.stats.vit - baseStats);
      const allocatedLuk = Math.max(0, player.stats.luk - baseStats);

      const totalAllocatedPoints = allocatedStr + allocatedDex + allocatedInt + allocatedVit + allocatedLuk;

      // 스탯을 기본값으로 리셋
      player.stats.str = baseStats;
      player.stats.dex = baseStats;
      player.stats.int = baseStats;
      player.stats.vit = baseStats;
      player.stats.luk = baseStats;

      // 스탯 포인트 환불
      player.level.statPoints += totalAllocatedPoints;

      // 비용 차감
      player.gold -= resetCost;

      // 파생 스탯 재계산
      this.recalculateDerivedStats(player);

      await playerManager.savePlayer(player);

      return {
        success: true,
        message: `스탯이 리셋되었습니다. ${totalAllocatedPoints}개의 스탯 포인트가 환불되었습니다.`,
        refundedPoints: totalAllocatedPoints
      };
    } catch (error) {
      console.error(`스탯 리셋 실패: ${playerId}`, error);
      return { success: false, message: '스탯 리셋 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 특정 레벨에 필요한 총 경험치 계산
   */
  calculateTotalExperienceForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.calculateRequiredExperience(i);
    }
    return total;
  }

  /**
   * 두 레벨 사이의 경험치 차이 계산
   */
  calculateExperienceBetweenLevels(fromLevel: number, toLevel: number): number {
    return this.calculateTotalExperienceForLevel(toLevel) - 
           this.calculateTotalExperienceForLevel(fromLevel);
  }

  /**
   * 현재 경험치로 도달 가능한 최대 레벨 계산
   */
  calculateMaxLevelFromExperience(totalExperience: number): number {
    let level = 1;
    let accumulatedExp = 0;
    
    while (level < this.MAX_LEVEL) {
      const requiredExp = this.calculateRequiredExperience(level);
      if (accumulatedExp + requiredExp > totalExperience) {
        break;
      }
      accumulatedExp += requiredExp;
      level++;
    }
    
    return level;
  }

  /**
   * 레벨 순위 계산
   */
  async calculateLevelRanking(playerId: string): Promise<{
    rank: number;
    totalPlayers: number;
    percentile: number;
  }> {
    try {
      const allPlayers = await playerManager.getAllPlayers();
      const targetPlayer = allPlayers.find(p => p.info.id === playerId);
      
      if (!targetPlayer) {
        return { rank: 0, totalPlayers: 0, percentile: 0 };
      }

      // 레벨 순으로 정렬 (같은 레벨이면 경험치 순)
      allPlayers.sort((a, b) => {
        if (a.level.level !== b.level.level) {
          return b.level.level - a.level.level;
        }
        return b.level.experience - a.level.experience;
      });

      const rank = allPlayers.findIndex(p => p.info.id === playerId) + 1;
      const percentile = (rank / allPlayers.length) * 100;

      return {
        rank,
        totalPlayers: allPlayers.length,
        percentile: Math.round(percentile * 100) / 100
      };
    } catch (error) {
      console.error(`레벨 순위 계산 실패: ${playerId}`, error);
      return { rank: 0, totalPlayers: 0, percentile: 0 };
    }
  }

  /**
   * 파티 경험치 분배 계산
   */
  calculatePartyExperienceShare(
    totalExperience: number,
    partyMembers: Array<{ level: number; contribution: number; }>
  ): Array<{ memberId: number; experience: number; }> {
    const totalContribution = partyMembers.reduce((sum, member) => sum + member.contribution, 0);
    const averageLevel = partyMembers.reduce((sum, member) => sum + member.level, 0) / partyMembers.length;

    return partyMembers.map((member, index) => {
      // 기본 분배 (기여도 기반)
      let share = (member.contribution / totalContribution) * totalExperience;

      // 레벨 차이 보정
      const levelDiff = member.level - averageLevel;
      const levelMultiplier = 1 + (levelDiff * 0.05); // 레벨 차이 1당 5% 보정
      share *= Math.max(0.5, Math.min(1.5, levelMultiplier)); // 50%~150% 범위

      // 파티 보너스 (20%)
      share *= 1.2;

      return {
        memberId: index,
        experience: Math.floor(share)
      };
    });
  }

  /**
   * 경험치 부스트 이벤트 적용
   */
  async applyExperienceBoost(
    playerId: string,
    boostMultiplier: number,
    duration: number // 밀리초
  ): Promise<boolean> {
    try {
      // 실제 구현에서는 플레이어의 임시 효과 목록에 추가
      // 여기서는 간단히 로그만 출력
      console.log(`플레이어 ${playerId}에게 ${boostMultiplier}x 경험치 부스트 적용 (${duration}ms)`);
      return true;
    } catch (error) {
      console.error(`경험치 부스트 적용 실패: ${playerId}`, error);
      return false;
    }
  }

  // 내부 계산 메서드들
  private calculateRequiredExperience(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(this.BASE_EXP_REQUIREMENT * Math.pow(this.EXP_GROWTH_RATE, level - 2));
  }

  private calculateExperienceGain(
    baseAmount: number,
    source: ExperienceGain['source'],
    player: Player,
    additionalMultiplier: number,
    description: string
  ): ExperienceGain {
    const sourceMultiplier = this.EXP_MULTIPLIERS[source] || 1.0;
    let totalMultiplier = sourceMultiplier * additionalMultiplier;

    // 레벨 기반 보너스 (고레벨일수록 경험치 획득량 증가)
    if (player.level.level >= 100) {
      totalMultiplier *= 1.1;
    }
    if (player.level.level >= 500) {
      totalMultiplier *= 1.1;
    }
    if (player.level.level >= 1000) {
      totalMultiplier *= 1.2;
    }

    // 장비나 버프로 인한 경험치 보너스 (추후 구현)
    let equipmentBonus = 0;
    
    const finalAmount = Math.floor(baseAmount * totalMultiplier + equipmentBonus);

    return {
      source,
      baseAmount,
      multiplier: totalMultiplier,
      bonus: equipmentBonus,
      finalAmount,
      description: description || `${source}로부터 경험치 획득`
    };
  }

  private calculateLevelUpReward(level: number, player: Player): LevelUpReward {
    const baseReward: LevelUpReward = {
      statPoints: this.STAT_POINTS_PER_LEVEL,
      skillPoints: this.SKILL_POINTS_PER_LEVEL
    };

    // 특정 레벨에서 보너스 보상
    if (level % 10 === 0) { // 10, 20, 30, ... 레벨마다
      baseReward.bonusRewards = {
        gold: level * 100,
        items: []
      };
    }

    if (level % 50 === 0) { // 50, 100, 150, ... 레벨마다
      baseReward.skillPoints += 1; // 추가 스킬 포인트
      if (!baseReward.bonusRewards) baseReward.bonusRewards = { items: [] };
      baseReward.bonusRewards.gold = (baseReward.bonusRewards.gold || 0) + level * 200;
    }

    if (level % 100 === 0) { // 100, 200, 300, ... 레벨마다
      baseReward.statPoints += 5; // 추가 스탯 포인트
      if (!baseReward.bonusRewards) baseReward.bonusRewards = { items: [] };
      baseReward.bonusRewards.items!.push({
        itemId: 'level_milestone_box',
        quantity: 1
      });
    }

    return baseReward;
  }

  private recalculateDerivedStats(player: Player): void {
    const stats = player.stats;
    const level = player.level.level;

    // 파생 스탯 재계산
    stats.hp = stats.vit * 10 + level * 5;
    stats.mp = stats.int * 10 + level * 3;
    
    // 장비 보정 없는 기본 공격력/방어력
    stats.atk = stats.str * 2;
    stats.def = stats.vit * 1.5;
    
    // 기타 스탯
    stats.acc = stats.dex * 0.8 + level;
    stats.eva = stats.dex * 0.6 + stats.luk * 0.2;
    stats.crit = stats.dex * 0.3 + stats.luk * 0.7;
  }

  private createEmptyExpGain(): ExperienceGain {
    return {
      source: 'combat',
      baseAmount: 0,
      multiplier: 0,
      bonus: 0,
      finalAmount: 0,
      description: ''
    };
  }
}

// 싱글톤 인스턴스
export const levelSystem = new LevelSystem();