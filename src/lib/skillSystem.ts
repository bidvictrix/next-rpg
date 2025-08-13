import { 
  Skill, 
  SkillTree, 
  SkillTreeNode, 
  SkillTreeCategory, 
  PlayerSkill,
  SkillRequirement,
  SkillLevelUpResult,
  SkillEvolution,
  SkillCombination
} from '../types/skill';
import { Player } from '../types/player';
import { gameDataManager } from './gameDataManager';
import { playerManager } from './playerManager';

export class SkillSystem {
  private skillTreeCache: Map<string, SkillTree> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 플레이어의 스킬 트리 로드
   */
  async loadPlayerSkillTree(playerId: string): Promise<SkillTree | null> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) return null;

      const cacheKey = `player_${playerId}`;
      
      // 캐시 확인
      if (this.skillTreeCache.has(cacheKey) && 
          Date.now() - this.lastCacheUpdate < this.CACHE_DURATION) {
        return this.skillTreeCache.get(cacheKey)!;
      }

      // 전체 스킬 데이터 로드
      const allSkills = await gameDataManager.loadAllSkills();
      const playerSkills = new Map<string, PlayerSkill>();
      
      // 플레이어 스킬을 맵으로 변환
      player.skills.forEach(skill => {
        playerSkills.set(skill.skillId, skill);
      });

      // 스킬 트리 구성
      const skillTree = await this.buildSkillTree(allSkills, playerSkills, player);
      
      // 캐시 저장
      this.skillTreeCache.set(cacheKey, skillTree);
      this.lastCacheUpdate = Date.now();
      
      return skillTree;
    } catch (error) {
      console.error(`플레이어 스킬 트리 로드 실패: ${playerId}`, error);
      return null;
    }
  }

  /**
   * 스킬 학습
   */
  async learnSkill(playerId: string, skillId: string): Promise<{
    success: boolean;
    message: string;
    newSkillLevel?: number;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      const skill = await gameDataManager.getSkill(skillId);
      if (!skill) {
        return { success: false, message: '존재하지 않는 스킬입니다.' };
      }

      // 이미 학습한 스킬인지 확인
      const existingSkill = player.skills.find(s => s.skillId === skillId);
      if (existingSkill) {
        return { success: false, message: '이미 학습한 스킬입니다.' };
      }

      // 학습 조건 확인
      const canLearn = await this.checkSkillRequirements(skill, player);
      if (!canLearn.success) {
        return { success: false, message: canLearn.message };
      }

      // 스킬 포인트 확인
      if (player.level.skillPoints < skill.learnCost.skillPoints) {
        return { 
          success: false, 
          message: `스킬 포인트가 부족합니다. (필요: ${skill.learnCost.skillPoints}, 보유: ${player.level.skillPoints})` 
        };
      }

      // 골드 확인
      if (skill.learnCost.gold && player.gold < skill.learnCost.gold) {
        return { 
          success: false, 
          message: `골드가 부족합니다. (필요: ${skill.learnCost.gold}, 보유: ${player.gold})` 
        };
      }

      // 필요 아이템 확인
      if (skill.learnCost.items) {
        for (const requiredItem of skill.learnCost.items) {
          const playerItem = player.inventory.find(item => item.itemId === requiredItem.itemId);
          if (!playerItem || playerItem.quantity < requiredItem.quantity) {
            return { 
              success: false, 
              message: `아이템이 부족합니다: ${requiredItem.itemId} (필요: ${requiredItem.quantity})` 
            };
          }
        }
      }

      // 비용 지불
      player.level.skillPoints -= skill.learnCost.skillPoints;
      if (skill.learnCost.gold) {
        player.gold -= skill.learnCost.gold;
      }

      // 필요 아이템 소모
      if (skill.learnCost.items) {
        for (const requiredItem of skill.learnCost.items) {
          await playerManager.removeItem(playerId, requiredItem.itemId, requiredItem.quantity);
        }
      }

      // 스킬 추가
      const newPlayerSkill: PlayerSkill = {
        skillId,
        level: 1,
        experience: 0,
        equipped: false
      };

      player.skills.push(newPlayerSkill);
      await playerManager.savePlayer(player);

      // 캐시 무효화
      this.skillTreeCache.delete(`player_${playerId}`);

      return { 
        success: true, 
        message: `${skill.name} 스킬을 학습했습니다!`,
        newSkillLevel: 1
      };
    } catch (error) {
      console.error(`스킬 학습 실패: ${playerId}, ${skillId}`, error);
      return { success: false, message: '스킬 학습 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 스킬 레벨업
   */
  async levelUpSkill(playerId: string, skillId: string): Promise<SkillLevelUpResult> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { 
          success: false, 
          newLevel: 0, 
          newEffects: [], 
          message: '플레이어를 찾을 수 없습니다.' 
        };
      }

      const skill = await gameDataManager.getSkill(skillId);
      if (!skill) {
        return { 
          success: false, 
          newLevel: 0, 
          newEffects: [], 
          message: '존재하지 않는 스킬입니다.' 
        };
      }

      const playerSkill = player.skills.find(s => s.skillId === skillId);
      if (!playerSkill) {
        return { 
          success: false, 
          newLevel: 0, 
          newEffects: [], 
          message: '학습하지 않은 스킬입니다.' 
        };
      }

      // 최대 레벨 확인
      if (skill.maxLevel > 0 && playerSkill.level >= skill.maxLevel) {
        return { 
          success: false, 
          newLevel: playerSkill.level, 
          newEffects: [], 
          message: '이미 최대 레벨입니다.' 
        };
      }

      // 필요 경험치 계산
      const requiredExp = this.calculateRequiredExperience(skill, playerSkill.level);
      if (playerSkill.experience < requiredExp) {
        return { 
          success: false, 
          newLevel: playerSkill.level, 
          newEffects: [], 
          message: `경험치가 부족합니다. (${playerSkill.experience}/${requiredExp})` 
        };
      }

      // 레벨업 처리
      playerSkill.experience -= requiredExp;
      playerSkill.level++;

      // 새로운 효과 계산
      const newEffects = this.calculateSkillEffectsAtLevel(skill, playerSkill.level);
      
      // 해금되는 스킬 확인
      const unlockedSkills = await this.checkUnlockedSkills(player, skillId, playerSkill.level);

      await playerManager.savePlayer(player);

      // 캐시 무효화
      this.skillTreeCache.delete(`player_${playerId}`);

      return {
        success: true,
        newLevel: playerSkill.level,
        newEffects,
        unlockedSkills: unlockedSkills.length > 0 ? unlockedSkills : undefined,
        message: `${skill.name}이(가) ${playerSkill.level}레벨이 되었습니다!`
      };
    } catch (error) {
      console.error(`스킬 레벨업 실패: ${playerId}, ${skillId}`, error);
      return { 
        success: false, 
        newLevel: 0, 
        newEffects: [], 
        message: '스킬 레벨업 중 오류가 발생했습니다.' 
      };
    }
  }

  /**
   * 스킬 경험치 추가
   */
  async addSkillExperience(playerId: string, skillId: string, experience: number): Promise<boolean> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) return false;

      const playerSkill = player.skills.find(s => s.skillId === skillId);
      if (!playerSkill) return false;

      playerSkill.experience += experience;
      await playerManager.savePlayer(player);

      return true;
    } catch (error) {
      console.error(`스킬 경험치 추가 실패: ${playerId}, ${skillId}`, error);
      return false;
    }
  }

  /**
   * 스킬 장착/해제
   */
  async toggleSkillEquip(playerId: string, skillId: string): Promise<{
    success: boolean;
    equipped: boolean;
    message: string;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, equipped: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      const playerSkill = player.skills.find(s => s.skillId === skillId);
      if (!playerSkill) {
        return { success: false, equipped: false, message: '학습하지 않은 스킬입니다.' };
      }

      const skill = await gameDataManager.getSkill(skillId);
      if (!skill) {
        return { success: false, equipped: false, message: '존재하지 않는 스킬입니다.' };
      }

      // 액티브 스킬 개수 제한 확인 (예: 최대 8개)
      const MAX_ACTIVE_SKILLS = 8;
      const activeSkills = player.skills.filter(s => s.equipped).length;

      if (!playerSkill.equipped && activeSkills >= MAX_ACTIVE_SKILLS) {
        return { 
          success: false, 
          equipped: false, 
          message: `최대 ${MAX_ACTIVE_SKILLS}개의 스킬만 장착할 수 있습니다.` 
        };
      }

      // 장착 상태 토글
      playerSkill.equipped = !playerSkill.equipped;
      await playerManager.savePlayer(player);

      return {
        success: true,
        equipped: playerSkill.equipped,
        message: `${skill.name}을(를) ${playerSkill.equipped ? '장착' : '해제'}했습니다.`
      };
    } catch (error) {
      console.error(`스킬 장착 토글 실패: ${playerId}, ${skillId}`, error);
      return { success: false, equipped: false, message: '스킬 장착 처리 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 스킬 진화
   */
  async evolveSkill(playerId: string, evolution: SkillEvolution): Promise<{
    success: boolean;
    message: string;
    newSkillId?: string;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      // 기존 스킬 확인
      const fromSkill = player.skills.find(s => s.skillId === evolution.fromSkillId);
      if (!fromSkill) {
        return { success: false, message: '진화 대상 스킬을 보유하지 않았습니다.' };
      }

      // 진화 조건 확인
      const canEvolve = await this.checkEvolutionRequirements(evolution, player);
      if (!canEvolve.success) {
        return { success: false, message: canEvolve.message };
      }

      // 비용 지불
      if (player.gold < evolution.cost.gold) {
        return { success: false, message: '골드가 부족합니다.' };
      }

      if (player.level.skillPoints < evolution.cost.skillPoints) {
        return { success: false, message: '스킬 포인트가 부족합니다.' };
      }

      // 재료 소모
      if (evolution.materials) {
        for (const material of evolution.materials) {
          await playerManager.removeItem(playerId, material.itemId, material.quantity);
        }
      }

      // 비용 차감
      player.gold -= evolution.cost.gold;
      player.level.skillPoints -= evolution.cost.skillPoints;

      // 기존 스킬 제거
      const skillIndex = player.skills.findIndex(s => s.skillId === evolution.fromSkillId);
      if (skillIndex !== -1) {
        player.skills.splice(skillIndex, 1);
      }

      // 새로운 스킬 추가
      const newPlayerSkill: PlayerSkill = {
        skillId: evolution.toSkillId,
        level: 1,
        experience: 0,
        equipped: fromSkill.equipped // 이전 장착 상태 유지
      };

      player.skills.push(newPlayerSkill);
      await playerManager.savePlayer(player);

      // 캐시 무효화
      this.skillTreeCache.delete(`player_${playerId}`);

      const newSkill = await gameDataManager.getSkill(evolution.toSkillId);
      return {
        success: true,
        message: `스킬이 ${newSkill?.name || evolution.toSkillId}(으)로 진화했습니다!`,
        newSkillId: evolution.toSkillId
      };
    } catch (error) {
      console.error(`스킬 진화 실패: ${playerId}`, error);
      return { success: false, message: '스킬 진화 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 스킬 조합
   */
  async combineSkills(playerId: string, combination: SkillCombination): Promise<{
    success: boolean;
    message: string;
    newSkillId?: string;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      // 필요 스킬 확인
      for (const reqSkill of combination.requiredSkills) {
        const playerSkill = player.skills.find(s => s.skillId === reqSkill.skillId);
        if (!playerSkill || playerSkill.level < reqSkill.minLevel) {
          return { 
            success: false, 
            message: `${reqSkill.skillId} 스킬의 레벨이 부족합니다. (필요: ${reqSkill.minLevel})` 
          };
        }
      }

      // 재료 확인
      if (combination.materials) {
        for (const material of combination.materials) {
          const playerItem = player.inventory.find(item => item.itemId === material.itemId);
          if (!playerItem || playerItem.quantity < material.quantity) {
            return { 
              success: false, 
              message: `${material.itemId} 아이템이 부족합니다. (필요: ${material.quantity})` 
            };
          }
        }
      }

      // 성공률 확인
      const success = Math.random() * 100 < combination.successRate;
      if (!success) {
        // 실패시에도 재료 소모
        if (combination.materials) {
          for (const material of combination.materials) {
            await playerManager.removeItem(playerId, material.itemId, material.quantity);
          }
        }
        
        return { success: false, message: '스킬 조합에 실패했습니다.' };
      }

      // 재료 소모
      if (combination.materials) {
        for (const material of combination.materials) {
          await playerManager.removeItem(playerId, material.itemId, material.quantity);
        }
      }

      // 새로운 스킬 추가
      const newPlayerSkill: PlayerSkill = {
        skillId: combination.resultSkill,
        level: 1,
        experience: 0,
        equipped: false
      };

      player.skills.push(newPlayerSkill);
      await playerManager.savePlayer(player);

      // 캐시 무효화
      this.skillTreeCache.delete(`player_${playerId}`);

      const newSkill = await gameDataManager.getSkill(combination.resultSkill);
      return {
        success: true,
        message: `${newSkill?.name || combination.resultSkill} 스킬을 조합으로 획득했습니다!`,
        newSkillId: combination.resultSkill
      };
    } catch (error) {
      console.error(`스킬 조합 실패: ${playerId}`, error);
      return { success: false, message: '스킬 조합 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 스킬 리셋
   */
  async resetSkill(playerId: string, skillId: string): Promise<{
    success: boolean;
    message: string;
    refundedPoints?: number;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      const playerSkill = player.skills.find(s => s.skillId === skillId);
      if (!playerSkill) {
        return { success: false, message: '보유하지 않은 스킬입니다.' };
      }

      const skill = await gameDataManager.getSkill(skillId);
      if (!skill) {
        return { success: false, message: '존재하지 않는 스킬입니다.' };
      }

      // 투자한 스킬 포인트 계산
      let totalInvestedPoints = skill.learnCost.skillPoints;
      for (let level = 2; level <= playerSkill.level; level++) {
        totalInvestedPoints += Math.ceil(level * 0.5); // 레벨업마다 추가 포인트 (임시 공식)
      }

      // 스킬 제거
      const skillIndex = player.skills.findIndex(s => s.skillId === skillId);
      if (skillIndex !== -1) {
        player.skills.splice(skillIndex, 1);
      }

      // 스킬 포인트 환불 (50% 환불)
      const refundedPoints = Math.floor(totalInvestedPoints * 0.5);
      player.level.skillPoints += refundedPoints;

      await playerManager.savePlayer(player);

      // 캐시 무효화
      this.skillTreeCache.delete(`player_${playerId}`);

      return {
        success: true,
        message: `${skill.name} 스킬을 리셋했습니다. ${refundedPoints} 스킬 포인트가 환불되었습니다.`,
        refundedPoints
      };
    } catch (error) {
      console.error(`스킬 리셋 실패: ${playerId}, ${skillId}`, error);
      return { success: false, message: '스킬 리셋 중 오류가 발생했습니다.' };
    }
  }

  // 유틸리티 메서드들
  private async buildSkillTree(
    allSkills: Map<string, Skill>,
    playerSkills: Map<string, PlayerSkill>,
    player: Player
  ): Promise<SkillTree> {
    const categories: Record<string, SkillTreeCategory> = {};

    // 스킬을 카테고리별로 분류
    for (const [skillId, skill] of allSkills) {
      const categoryId = skill.category;
      
      if (!categories[categoryId]) {
        categories[categoryId] = {
          id: categoryId,
          name: this.getCategoryName(categoryId),
          description: this.getCategoryDescription(categoryId),
          color: this.getCategoryColor(categoryId),
          skills: {}
        };
      }

      const playerSkill = playerSkills.get(skillId);
      const isAvailable = await this.isSkillAvailable(skill, player);

      const node: SkillTreeNode = {
        skill,
        isLearned: !!playerSkill,
        currentLevel: playerSkill?.level || 0,
        currentExperience: playerSkill?.experience || 0,
        isAvailable,
        connections: {
          parents: skill.parentSkills || [],
          children: skill.childSkills || []
        }
      };

      categories[categoryId].skills[skillId] = node;
    }

    const totalSkillPoints = player.level.skillPoints + 
      player.skills.reduce((total, skill) => total + skill.level, 0);

    return {
      categories,
      totalSkillPoints,
      usedSkillPoints: player.skills.reduce((total, skill) => total + skill.level, 0),
      availableSkillPoints: player.level.skillPoints
    };
  }

  private async checkSkillRequirements(skill: Skill, player: Player): Promise<{
    success: boolean;
    message: string;
  }> {
    for (const requirement of skill.requirements) {
      switch (requirement.type) {
        case 'level':
          if (player.level.level < (requirement.value as number)) {
            return { 
              success: false, 
              message: `레벨 ${requirement.value} 이상이 필요합니다.` 
            };
          }
          break;

        case 'skill':
          const reqSkillId = requirement.value as string;
          const reqLevel = requirement.amount || 1;
          const playerSkill = player.skills.find(s => s.skillId === reqSkillId);
          
          if (!playerSkill || playerSkill.level < reqLevel) {
            const reqSkill = await gameDataManager.getSkill(reqSkillId);
            return { 
              success: false, 
              message: `${reqSkill?.name || reqSkillId} 스킬 레벨 ${reqLevel} 이상이 필요합니다.` 
            };
          }
          break;

        case 'stat':
          const statName = requirement.value as keyof typeof player.stats;
          const requiredValue = requirement.amount || 0;
          
          if (player.stats[statName] < requiredValue) {
            return { 
              success: false, 
              message: `${statName.toUpperCase()} ${requiredValue} 이상이 필요합니다.` 
            };
          }
          break;

        case 'item':
          const itemId = requirement.value as string;
          const requiredQuantity = requirement.amount || 1;
          const playerItem = player.inventory.find(item => item.itemId === itemId);
          
          if (!playerItem || playerItem.quantity < requiredQuantity) {
            return { 
              success: false, 
              message: `${itemId} 아이템 ${requiredQuantity}개가 필요합니다.` 
            };
          }
          break;

        case 'class':
          if (player.info.class !== requirement.value) {
            return { 
              success: false, 
              message: `${requirement.value} 클래스만 학습할 수 있습니다.` 
            };
          }
          break;
      }
    }

    return { success: true, message: '' };
  }

  private async isSkillAvailable(skill: Skill, player: Player): Promise<boolean> {
    const requirementCheck = await this.checkSkillRequirements(skill, player);
    return requirementCheck.success;
  }

  private calculateRequiredExperience(skill: Skill, currentLevel: number): number {
    return Math.floor(skill.baseExperience * Math.pow(skill.experienceMultiplier, currentLevel - 1));
  }

  private calculateSkillEffectsAtLevel(skill: Skill, level: number) {
    // 레벨에 따른 스킬 효과 계산
    return skill.effects.map(effect => ({
      ...effect,
      value: effect.value * (1 + (level - 1) * 0.1) // 레벨당 10% 증가
    }));
  }

  private async checkUnlockedSkills(player: Player, parentSkillId: string, newLevel: number): Promise<string[]> {
    const unlockedSkills: string[] = [];
    const allSkills = await gameDataManager.loadAllSkills();

    for (const [skillId, skill] of allSkills) {
      if (skill.parentSkills?.includes(parentSkillId)) {
        const isAvailable = await this.isSkillAvailable(skill, player);
        if (isAvailable) {
          unlockedSkills.push(skillId);
        }
      }
    }

    return unlockedSkills;
  }

  private async checkEvolutionRequirements(evolution: SkillEvolution, player: Player): Promise<{
    success: boolean;
    message: string;
  }> {
    for (const requirement of evolution.requirements) {
      const check = await this.checkSkillRequirements({ requirements: [requirement] } as Skill, player);
      if (!check.success) {
        return check;
      }
    }

    // 재료 확인
    if (evolution.materials) {
      for (const material of evolution.materials) {
        const playerItem = player.inventory.find(item => item.itemId === material.itemId);
        if (!playerItem || playerItem.quantity < material.quantity) {
          return { 
            success: false, 
            message: `${material.itemId} 아이템이 부족합니다. (필요: ${material.quantity})` 
          };
        }
      }
    }

    return { success: true, message: '' };
  }

  private getCategoryName(categoryId: string): string {
    const names: Record<string, string> = {
      combat: '전투',
      magic: '마법',
      utility: '유틸리티',
      crafting: '제작',
      movement: '이동'
    };
    return names[categoryId] || categoryId;
  }

  private getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      combat: '근접 전투 관련 스킬',
      magic: '마법 공격 관련 스킬',
      utility: '보조 및 지원 스킬',
      crafting: '아이템 제작 스킬',
      movement: '이동 및 탐험 스킬'
    };
    return descriptions[categoryId] || '';
  }

  private getCategoryColor(categoryId: string): string {
    const colors: Record<string, string> = {
      combat: '#ff4444',
      magic: '#4444ff',
      utility: '#44ff44',
      crafting: '#ffaa44',
      movement: '#44ffff'
    };
    return colors[categoryId] || '#888888';
  }
}

// 싱글톤 인스턴스
export const skillSystem = new SkillSystem();