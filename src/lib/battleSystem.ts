import { Player } from '../types/player';
import { Monster } from '../types/game';
import { Skill, SkillEffect, SkillUseResult } from '../types/skill';
import { BattleInstance, MonsterInstance } from './gameEngine';
import { gameDataManager } from './gameDataManager';
import { playerManager } from './playerManager';

export interface BattleAction {
  actorId: string;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  targetId?: string;
  skillId?: string;
  itemId?: string;
  timestamp: number;
}

export interface BattleResult {
  success: boolean;
  damage?: number;
  healing?: number;
  effects: BattleEffect[];
  message: string;
  criticalHit?: boolean;
  missed?: boolean;
  blocked?: boolean;
}

export interface BattleEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff';
  value: number;
  duration?: number;
  description: string;
}

export interface CombatStats {
  attack: number;
  defense: number;
  accuracy: number;
  evasion: number;
  criticalChance: number;
  criticalDamage: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
}

export class BattleSystem {
  private readonly BASE_CRITICAL_CHANCE = 5;
  private readonly BASE_CRITICAL_MULTIPLIER = 1.5;
  private readonly BASE_MISS_CHANCE = 5;
  private readonly FLEE_SUCCESS_BASE = 50;

  /**
   * 기본 공격 처리
   */
  async processBasicAttack(
    attacker: Player | MonsterInstance,
    target: Player | MonsterInstance,
    battle: BattleInstance
  ): Promise<BattleResult> {
    try {
      const attackerStats = this.getCombatStats(attacker);
      const targetStats = this.getCombatStats(target);

      // 명중률 계산
      const hitChance = this.calculateHitChance(attackerStats.accuracy, targetStats.evasion);
      const missed = Math.random() * 100 > hitChance;

      if (missed) {
        return {
          success: true,
          missed: true,
          effects: [],
          message: `${this.getName(attacker)}의 공격이 빗나갔습니다!`
        };
      }

      // 크리티컬 확률 계산
      const critChance = this.calculateCriticalChance(attackerStats.criticalChance);
      const criticalHit = Math.random() * 100 < critChance;

      // 기본 데미지 계산
      let damage = this.calculateBasicDamage(attackerStats.attack, targetStats.defense);

      // 크리티컬 적용
      if (criticalHit) {
        damage = Math.floor(damage * attackerStats.criticalDamage);
      }

      // 데미지 적용
      const actualDamage = this.applyDamage(target, damage, battle);

      return {
        success: true,
        damage: actualDamage,
        criticalHit,
        effects: [{
          type: 'damage',
          value: actualDamage,
          description: `${actualDamage} 데미지`
        }],
        message: `${this.getName(attacker)}이(가) ${this.getName(target)}에게 ${actualDamage} 데미지를 입혔습니다!${criticalHit ? ' (크리티컬!)' : ''}`
      };
    } catch (error) {
      console.error('기본 공격 처리 실패', error);
      return {
        success: false,
        effects: [],
        message: '공격에 실패했습니다.'
      };
    }
  }

  /**
   * 스킬 사용 처리
   */
  async processSkillUse(
    caster: Player | MonsterInstance,
    target: Player | MonsterInstance | null,
    skillId: string,
    battle: BattleInstance
  ): Promise<BattleResult> {
    try {
      const skill = await gameDataManager.getSkill(skillId);
      if (!skill) {
        return {
          success: false,
          effects: [],
          message: '존재하지 않는 스킬입니다.'
        };
      }

      // 마나 소모 확인
      const casterStats = this.getCombatStats(caster);
      const totalManaCost = this.calculateManaCost(skill);

      if (casterStats.currentMp < totalManaCost) {
        return {
          success: false,
          effects: [],
          message: '마나가 부족합니다.'
        };
      }

      // 마나 소모
      this.consumeMana(caster, totalManaCost, battle);

      const results: BattleResult = {
        success: true,
        effects: [],
        message: `${this.getName(caster)}이(가) ${skill.name}을(를) 사용했습니다!`
      };

      // 스킬 효과 적용
      for (const effect of skill.effects) {
        const effectResult = await this.applySkillEffect(caster, target, effect, battle);
        results.effects.push(...effectResult.effects);
        
        if (effectResult.damage) {
          results.damage = (results.damage || 0) + effectResult.damage;
        }
        
        if (effectResult.healing) {
          results.healing = (results.healing || 0) + effectResult.healing;
        }

        if (effectResult.criticalHit) {
          results.criticalHit = true;
        }
      }

      return results;
    } catch (error) {
      console.error('스킬 사용 처리 실패', error);
      return {
        success: false,
        effects: [],
        message: '스킬 사용에 실패했습니다.'
      };
    }
  }

  /**
   * 아이템 사용 처리
   */
  async processItemUse(
    user: Player | MonsterInstance,
    itemId: string,
    battle: BattleInstance
  ): Promise<BattleResult> {
    try {
      const item = await gameDataManager.getItem(itemId);
      if (!item || item.type !== 'consumable') {
        return {
          success: false,
          effects: [],
          message: '사용할 수 없는 아이템입니다.'
        };
      }

      // 플레이어인 경우 아이템 소유 확인
      if ('info' in user) {
        const hasItem = user.inventory.find(invItem => invItem.itemId === itemId);
        if (!hasItem || hasItem.quantity < 1) {
          return {
            success: false,
            effects: [],
            message: '아이템이 부족합니다.'
          };
        }

        // 아이템 소모
        await playerManager.removeItem(user.info.id, itemId, 1);
      }

      const results: BattleResult = {
        success: true,
        effects: [],
        message: `${this.getName(user)}이(가) ${item.name}을(를) 사용했습니다!`
      };

      // 아이템 효과 적용
      if (item.consumableEffect) {
        const effect = item.consumableEffect;
        
        switch (effect.type) {
          case 'heal':
            const healAmount = this.applyHealing(user, effect.value, battle);
            results.healing = healAmount;
            results.effects.push({
              type: 'heal',
              value: healAmount,
              description: `${healAmount} HP 회복`
            });
            break;

          case 'mana':
            const manaAmount = this.applyManaRestore(user, effect.value, battle);
            results.effects.push({
              type: 'heal',
              value: manaAmount,
              description: `${manaAmount} MP 회복`
            });
            break;

          case 'buff':
            if (effect.duration) {
              results.effects.push({
                type: 'buff',
                value: effect.value,
                duration: effect.duration,
                description: `능력치 향상 (${effect.duration}초)`
              });
            }
            break;
        }
      }

      return results;
    } catch (error) {
      console.error('아이템 사용 처리 실패', error);
      return {
        success: false,
        effects: [],
        message: '아이템 사용에 실패했습니다.'
      };
    }
  }

  /**
   * 방어 액션 처리
   */
  processDefend(defender: Player | MonsterInstance): BattleResult {
    return {
      success: true,
      effects: [{
        type: 'buff',
        value: 50,
        duration: 1,
        description: '방어력 50% 증가 (1턴)'
      }],
      message: `${this.getName(defender)}이(가) 방어 자세를 취했습니다!`
    };
  }

  /**
   * 도주 시도 처리
   */
  processFlee(
    fleer: Player | MonsterInstance,
    battle: BattleInstance
  ): BattleResult {
    const fleerStats = this.getCombatStats(fleer);
    
    // 도주 성공률 계산 (민첩성 기반)
    let fleeChance = this.FLEE_SUCCESS_BASE;
    fleeChance += (fleerStats.evasion - 50) * 0.5; // 민첩성이 50 이상이면 보너스
    
    // 레벨 차이 고려 (플레이어만)
    if ('info' in fleer) {
      const enemies = battle.participants.filter(p => p.type === 'monster');
      if (enemies.length > 0) {
        // 적 레벨보다 높으면 도주 확률 증가
        const enemyLevel = 10; // 몬스터 레벨 (실제 구현시 동적으로 가져와야 함)
        const levelDiff = fleer.level.level - enemyLevel;
        fleeChance += levelDiff * 5;
      }
    }

    // 확률 제한
    fleeChance = Math.max(10, Math.min(90, fleeChance));

    const success = Math.random() * 100 < fleeChance;

    return {
      success,
      effects: [],
      message: success 
        ? `${this.getName(fleer)}이(가) 성공적으로 도망쳤습니다!`
        : `${this.getName(fleer)}의 도주 시도가 실패했습니다!`
    };
  }

  /**
   * 전투 턴 처리
   */
  async processBattleTurn(
    battle: BattleInstance,
    action: BattleAction
  ): Promise<BattleResult> {
    try {
      // 행동자 확인
      const actor = battle.participants.find(p => p.id === action.actorId);
      if (!actor || actor.currentHp <= 0) {
        return {
          success: false,
          effects: [],
          message: '행동할 수 없는 상태입니다.'
        };
      }

      let result: BattleResult;

      switch (action.type) {
        case 'attack':
          if (!action.targetId) {
            return {
              success: false,
              effects: [],
              message: '대상을 지정해주세요.'
            };
          }
          
          // 실제 구현에서는 Player/Monster 객체를 가져와야 함
          const attacker = await this.getActorById(action.actorId);
          const target = await this.getActorById(action.targetId);
          
          if (!attacker || !target) {
            return {
              success: false,
              effects: [],
              message: '대상을 찾을 수 없습니다.'
            };
          }
          
          result = await this.processBasicAttack(attacker, target, battle);
          break;

        case 'skill':
          if (!action.skillId) {
            return {
              success: false,
              effects: [],
              message: '스킬을 지정해주세요.'
            };
          }
          
          const skillUser = await this.getActorById(action.actorId);
          const skillTarget = action.targetId ? await this.getActorById(action.targetId) : null;
          
          if (!skillUser) {
            return {
              success: false,
              effects: [],
              message: '사용자를 찾을 수 없습니다.'
            };
          }
          
          result = await this.processSkillUse(skillUser, skillTarget, action.skillId, battle);
          break;

        case 'item':
          if (!action.itemId) {
            return {
              success: false,
              effects: [],
              message: '아이템을 지정해주세요.'
            };
          }
          
          const itemUser = await this.getActorById(action.actorId);
          if (!itemUser) {
            return {
              success: false,
              effects: [],
              message: '사용자를 찾을 수 없습니다.'
            };
          }
          
          result = await this.processItemUse(itemUser, action.itemId, battle);
          break;

        case 'defend':
          const defender = await this.getActorById(action.actorId);
          if (!defender) {
            return {
              success: false,
              effects: [],
              message: '사용자를 찾을 수 없습니다.'
            };
          }
          
          result = this.processDefend(defender);
          break;

        case 'flee':
          const fleer = await this.getActorById(action.actorId);
          if (!fleer) {
            return {
              success: false,
              effects: [],
              message: '사용자를 찾을 수 없습니다.'
            };
          }
          
          result = this.processFlee(fleer, battle);
          break;

        default:
          return {
            success: false,
            effects: [],
            message: '알 수 없는 행동입니다.'
          };
      }

      // 턴 카운터 증가
      battle.currentTurn++;

      return result;
    } catch (error) {
      console.error('전투 턴 처리 실패', error);
      return {
        success: false,
        effects: [],
        message: '전투 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 전투 종료 조건 확인
   */
  checkBattleEnd(battle: BattleInstance): {
    ended: boolean;
    winner?: string;
    reason: string;
  } {
    const alivePlayers = battle.participants.filter(p => p.currentHp > 0);
    
    if (alivePlayers.length <= 1) {
      return {
        ended: true,
        winner: alivePlayers[0]?.id,
        reason: alivePlayers.length === 0 ? 'draw' : 'victory'
      };
    }

    // 시간 제한 확인 (30분)
    if (Date.now() - battle.startTime > 1800000) {
      return {
        ended: true,
        reason: 'timeout'
      };
    }

    return {
      ended: false,
      reason: 'ongoing'
    };
  }

  /**
   * 경험치 및 보상 계산
   */
  async calculateBattleRewards(
    winner: Player,
    defeated: MonsterInstance[],
    battle: BattleInstance
  ): Promise<{
    experience: number;
    gold: number;
    items: Array<{ itemId: string; quantity: number; }>;
  }> {
    let totalExp = 0;
    let totalGold = 0;
    const items: Array<{ itemId: string; quantity: number; }> = [];

    for (const monster of defeated) {
      const monsterData = monster.monster;
      
      // 경험치 계산
      const baseExp = monsterData.dropTable.experience;
      let expGain = baseExp;

      // 레벨 차이에 따른 경험치 보정
      const levelDiff = winner.level.level - monsterData.level;
      if (levelDiff > 5) {
        expGain = Math.max(1, Math.floor(expGain * 0.1)); // 너무 낮은 레벨이면 경험치 감소
      } else if (levelDiff < -5) {
        expGain = Math.floor(expGain * 1.5); // 높은 레벨 몬스터면 경험치 증가
      }

      totalExp += expGain;

      // 골드 계산
      const goldRange = monsterData.dropTable.gold;
      const goldGain = Math.floor(
        Math.random() * (goldRange.max - goldRange.min + 1) + goldRange.min
      );
      totalGold += goldGain;

      // 아이템 드롭 계산
      for (const dropItem of monsterData.dropTable.items) {
        if (Math.random() * 100 < dropItem.chance) {
          const quantity = Math.floor(
            Math.random() * (dropItem.quantity.max - dropItem.quantity.min + 1) + 
            dropItem.quantity.min
          );
          
          const existingItem = items.find(item => item.itemId === dropItem.itemId);
          if (existingItem) {
            existingItem.quantity += quantity;
          } else {
            items.push({ itemId: dropItem.itemId, quantity });
          }
        }
      }
    }

    return {
      experience: totalExp,
      gold: totalGold,
      items
    };
  }

  // 유틸리티 메서드들
  private getCombatStats(actor: Player | MonsterInstance): CombatStats {
    if ('info' in actor) {
      // Player
      const stats = actor.stats;
      return {
        attack: stats.atk || stats.str * 2,
        defense: stats.def || stats.vit * 1.5,
        accuracy: stats.acc || stats.dex * 0.8 + actor.level.level,
        evasion: stats.eva || stats.dex * 0.6 + stats.luk * 0.2,
        criticalChance: stats.crit || stats.dex * 0.3 + stats.luk * 0.7,
        criticalDamage: this.BASE_CRITICAL_MULTIPLIER,
        currentHp: stats.hp || stats.vit * 10 + actor.level.level * 5,
        maxHp: stats.hp || stats.vit * 10 + actor.level.level * 5,
        currentMp: stats.mp || stats.int * 10 + actor.level.level * 3,
        maxMp: stats.mp || stats.int * 10 + actor.level.level * 3
      };
    } else {
      // MonsterInstance
      const stats = actor.monster.stats;
      return {
        attack: stats.atk || stats.str * 2,
        defense: stats.def || stats.vit * 1.5,
        accuracy: stats.acc || stats.dex * 0.8 + actor.monster.level,
        evasion: stats.eva || stats.dex * 0.6 + stats.luk * 0.2,
        criticalChance: stats.crit || stats.dex * 0.3 + stats.luk * 0.7,
        criticalDamage: this.BASE_CRITICAL_MULTIPLIER,
        currentHp: actor.currentHp,
        maxHp: stats.hp || stats.vit * 10 + actor.monster.level * 5,
        currentMp: actor.currentMp,
        maxMp: stats.mp || stats.int * 10 + actor.monster.level * 3
      };
    }
  }

  private getName(actor: Player | MonsterInstance): string {
    return 'info' in actor ? actor.info.characterName : actor.monster.name;
  }

  private calculateHitChance(accuracy: number, evasion: number): number {
    const baseHit = 95 - this.BASE_MISS_CHANCE;
    const hitChance = baseHit + (accuracy - evasion) * 0.5;
    return Math.max(10, Math.min(95, hitChance));
  }

  private calculateCriticalChance(critStat: number): number {
    return Math.min(50, this.BASE_CRITICAL_CHANCE + critStat * 0.1);
  }

  private calculateBasicDamage(attack: number, defense: number): number {
    const baseDamage = Math.max(1, attack - defense * 0.5);
    const variance = baseDamage * 0.2; // ±20% 변동
    return Math.floor(baseDamage + (Math.random() - 0.5) * variance);
  }

  private calculateManaCost(skill: Skill): number {
    const baseCost = skill.effects.reduce((total, effect) => {
      return total + (effect.manaCost || 0);
    }, 0);
    return baseCost;
  }

  private applyDamage(
    target: Player | MonsterInstance,
    damage: number,
    battle: BattleInstance
  ): number {
    const participant = battle.participants.find(p => p.id === 
      ('info' in target ? target.info.id : target.id));
    
    if (participant) {
      const actualDamage = Math.min(damage, participant.currentHp);
      participant.currentHp -= actualDamage;
      return actualDamage;
    }
    
    return 0;
  }

  private applyHealing(
    target: Player | MonsterInstance,
    healing: number,
    battle: BattleInstance
  ): number {
    const participant = battle.participants.find(p => p.id === 
      ('info' in target ? target.info.id : target.id));
    
    if (participant) {
      const stats = this.getCombatStats(target);
      const actualHealing = Math.min(healing, stats.maxHp - participant.currentHp);
      participant.currentHp += actualHealing;
      return actualHealing;
    }
    
    return 0;
  }

  private consumeMana(
    caster: Player | MonsterInstance,
    manaCost: number,
    battle: BattleInstance
  ): void {
    const participant = battle.participants.find(p => p.id === 
      ('info' in caster ? caster.info.id : caster.id));
    
    if (participant) {
      participant.currentMp = Math.max(0, participant.currentMp - manaCost);
    }
  }

  private applyManaRestore(
    target: Player | MonsterInstance,
    manaRestore: number,
    battle: BattleInstance
  ): number {
    const participant = battle.participants.find(p => p.id === 
      ('info' in target ? target.info.id : target.id));
    
    if (participant) {
      const stats = this.getCombatStats(target);
      const actualRestore = Math.min(manaRestore, stats.maxMp - participant.currentMp);
      participant.currentMp += actualRestore;
      return actualRestore;
    }
    
    return 0;
  }

  private async applySkillEffect(
    caster: Player | MonsterInstance,
    target: Player | MonsterInstance | null,
    effect: SkillEffect,
    battle: BattleInstance
  ): Promise<BattleResult> {
    const result: BattleResult = {
      success: true,
      effects: [],
      message: ''
    };

    // 발동 확률 확인
    if (effect.chance && Math.random() * 100 > effect.chance) {
      return {
        success: true,
        effects: [],
        message: '스킬 효과가 발동하지 않았습니다.'
      };
    }

    let effectValue = effect.value;
    
    // 스탯 스케일링 적용
    if (effect.scaling) {
      const casterStats = this.getCombatStats(caster);
      let statValue = 0;
      
      switch (effect.scaling.stat) {
        case 'str':
          statValue = 'info' in caster ? caster.stats.str : caster.monster.stats.str;
          break;
        case 'int':
          statValue = 'info' in caster ? caster.stats.int : caster.monster.stats.int;
          break;
        // ... 다른 스탯들
      }
      
      effectValue += statValue * effect.scaling.ratio;
    }

    switch (effect.type) {
      case 'damage':
        if (target) {
          const damage = this.applyDamage(target, effectValue, battle);
          result.damage = damage;
          result.effects.push({
            type: 'damage',
            value: damage,
            description: `${damage} 마법 데미지`
          });
        }
        break;

      case 'heal':
        const healTarget = target || caster;
        const healing = this.applyHealing(healTarget, effectValue, battle);
        result.healing = healing;
        result.effects.push({
          type: 'heal',
          value: healing,
          description: `${healing} HP 회복`
        });
        break;

      case 'buff':
      case 'debuff':
        result.effects.push({
          type: effect.type,
          value: effectValue,
          duration: effect.duration,
          description: `${effect.type === 'buff' ? '강화' : '약화'} 효과 (${effect.duration}초)`
        });
        break;
    }

    return result;
  }

  private async getActorById(actorId: string): Promise<Player | MonsterInstance | null> {
    // 실제 구현에서는 게임 엔진에서 플레이어나 몬스터 인스턴스를 가져와야 함
    // 여기서는 간단한 구현으로 대체
    const player = await playerManager.loadPlayer(actorId);
    if (player) return player;

    // 몬스터 인스턴스 찾기 로직 (게임 엔진에서 가져와야 함)
    return null;
  }
}

// 싱글톤 인스턴스
export const battleSystem = new BattleSystem();