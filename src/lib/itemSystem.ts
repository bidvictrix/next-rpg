import { Item, DropTable } from '../types/game';
import { Player, Equipment, InventoryItem } from '../types/player';
import { playerManager } from './playerManager';
import { gameDataManager } from './gameDataManager';

export interface ItemUseResult {
  success: boolean;
  message: string;
  effects?: Array<{
    type: 'heal' | 'mana' | 'buff' | 'debuff';
    value: number;
    duration?: number;
  }>;
  consumed: boolean;
}

export interface EquipmentResult {
  success: boolean;
  message: string;
  equipped?: boolean;
  previousItem?: string;
  statChanges?: {
    before: any;
    after: any;
  };
}

export interface CraftingResult {
  success: boolean;
  message: string;
  resultItem?: {
    itemId: string;
    quantity: number;
  };
  materialsConsumed?: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export interface InventoryOperation {
  type: 'add' | 'remove' | 'move' | 'split' | 'merge';
  itemId: string;
  quantity?: number;
  fromSlot?: number;
  toSlot?: number;
}

export class ItemSystem {
  private readonly MAX_STACK_LIMIT = 999;
  private readonly DEFAULT_INVENTORY_SIZE = 20;

  /**
   * 아이템 사용
   */
  async useItem(playerId: string, itemId: string, quantity: number = 1): Promise<ItemUseResult> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.', consumed: false };
      }

      const item = await gameDataManager.getItem(itemId);
      if (!item) {
        return { success: false, message: '존재하지 않는 아이템입니다.', consumed: false };
      }

      if (item.type !== 'consumable') {
        return { success: false, message: '사용할 수 없는 아이템입니다.', consumed: false };
      }

      // 아이템 보유 확인
      const inventoryItem = player.inventory.find(invItem => invItem.itemId === itemId);
      if (!inventoryItem || inventoryItem.quantity < quantity) {
        return { 
          success: false, 
          message: `${item.name}이(가) 부족합니다. (보유: ${inventoryItem?.quantity || 0}, 필요: ${quantity})`,
          consumed: false 
        };
      }

      // 사용 제한 확인 (전투 중인지 등)
      const usageCheck = await this.checkItemUsageRestrictions(player, item);
      if (!usageCheck.canUse) {
        return { success: false, message: usageCheck.reason || '아이템을 사용할 수 없습니다.', consumed: false };
      }

      const results: ItemUseResult = {
        success: true,
        message: `${item.name}을(를) 사용했습니다.`,
        effects: [],
        consumed: true
      };

      // 아이템 효과 적용
      if (item.consumableEffect) {
        const effect = item.consumableEffect;
        
        switch (effect.type) {
          case 'heal':
            const healAmount = this.calculateHealAmount(effect.value, player);
            const actualHeal = Math.min(healAmount, (player.stats.hp || 100) - this.getCurrentHp(player));
            
            // HP 회복 적용 (실제로는 전투 시스템과 연동)
            results.effects!.push({
              type: 'heal',
              value: actualHeal
            });
            results.message += ` ${actualHeal} HP가 회복되었습니다.`;
            break;

          case 'mana':
            const manaAmount = this.calculateManaAmount(effect.value, player);
            const actualMana = Math.min(manaAmount, (player.stats.mp || 50) - this.getCurrentMp(player));
            
            results.effects!.push({
              type: 'mana',
              value: actualMana
            });
            results.message += ` ${actualMana} MP가 회복되었습니다.`;
            break;

          case 'buff':
            if (effect.duration) {
              results.effects!.push({
                type: 'buff',
                value: effect.value,
                duration: effect.duration
              });
              results.message += ` 능력이 향상되었습니다. (${effect.duration}초)`;
            }
            break;

          case 'debuff':
            results.effects!.push({
              type: 'debuff',
              value: effect.value,
              duration: effect.duration || 0
            });
            results.message += ` 디버프 효과가 해제되었습니다.`;
            break;
        }
      }

      // 아이템 소모
      if (results.consumed) {
        const removeResult = await playerManager.removeItem(playerId, itemId, quantity);
        if (!removeResult) {
          return { success: false, message: '아이템 소모 중 오류가 발생했습니다.', consumed: false };
        }
      }

      return results;
    } catch (error) {
      console.error(`아이템 사용 실패: ${playerId}, ${itemId}`, error);
      return { success: false, message: '아이템 사용 중 오류가 발생했습니다.', consumed: false };
    }
  }

  /**
   * 장비 착용/해제
   */
  async toggleEquipment(playerId: string, itemId: string): Promise<EquipmentResult> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      const item = await gameDataManager.getItem(itemId);
      if (!item || !item.equipmentSlot) {
        return { success: false, message: '착용할 수 없는 아이템입니다.' };
      }

      // 착용 조건 확인
      const canEquip = this.checkEquipmentRequirements(item, player);
      if (!canEquip.success) {
        return { success: false, message: canEquip.message };
      }

      const equipmentSlot = item.equipmentSlot;
      const currentEquipped = player.equipment[equipmentSlot];
      let previousItem: string | undefined;

      if (currentEquipped === itemId) {
        // 장비 해제
        player.equipment[equipmentSlot] = null;
        await this.addItemToInventory(player, itemId, 1);
        
        return {
          success: true,
          message: `${item.name}을(를) 해제했습니다.`,
          equipped: false,
          statChanges: await this.calculateStatChanges(player, itemId, null)
        };
      } else {
        // 기존 장비가 있으면 인벤토리로 이동
        if (currentEquipped) {
          await this.addItemToInventory(player, currentEquipped, 1);
          previousItem = currentEquipped;
        }

        // 새 장비 착용
        player.equipment[equipmentSlot] = itemId;
        await playerManager.removeItem(playerId, itemId, 1);

        await playerManager.savePlayer(player);

        return {
          success: true,
          message: `${item.name}을(를) 착용했습니다.`,
          equipped: true,
          previousItem,
          statChanges: await this.calculateStatChanges(player, previousItem || '', itemId)
        };
      }
    } catch (error) {
      console.error(`장비 착용/해제 실패: ${playerId}, ${itemId}`, error);
      return { success: false, message: '장비 처리 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 아이템 제작
   */
  async craftItem(
    playerId: string, 
    recipeId: string,
    quantity: number = 1
  ): Promise<CraftingResult> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      // 제작법 정보 로드 (실제로는 별도 데이터에서 가져와야 함)
      const recipe = await this.getCraftingRecipe(recipeId);
      if (!recipe) {
        return { success: false, message: '존재하지 않는 제작법입니다.' };
      }

      // 제작 조건 확인
      const canCraft = this.checkCraftingRequirements(recipe, player, quantity);
      if (!canCraft.success) {
        return { success: false, message: canCraft.message };
      }

      // 재료 소모
      const materialsConsumed: Array<{ itemId: string; quantity: number; }> = [];
      
      for (const material of recipe.materials) {
        const totalNeeded = material.quantity * quantity;
        const removeResult = await playerManager.removeItem(playerId, material.itemId, totalNeeded);
        
        if (!removeResult) {
          // 실패시 이미 소모된 재료 복구 (트랜잭션 필요)
          for (const consumed of materialsConsumed) {
            await playerManager.addItem(playerId, consumed.itemId, consumed.quantity);
          }
          return { success: false, message: `${material.itemId} 재료 소모 중 오류가 발생했습니다.` };
        }
        
        materialsConsumed.push({ itemId: material.itemId, quantity: totalNeeded });
      }

      // 제작 비용 차감
      if (recipe.cost > 0) {
        if (player.gold < recipe.cost * quantity) {
          return { success: false, message: '골드가 부족합니다.' };
        }
        player.gold -= recipe.cost * quantity;
      }

      // 제작 성공률 확인
      let successfulCrafts = 0;
      for (let i = 0; i < quantity; i++) {
        if (Math.random() * 100 < recipe.successRate) {
          successfulCrafts++;
        }
      }

      if (successfulCrafts === 0) {
        await playerManager.savePlayer(player);
        return {
          success: false,
          message: '제작에 실패했습니다.',
          materialsConsumed
        };
      }

      // 성공한 만큼 아이템 생성
      await playerManager.addItem(playerId, recipe.resultItemId, successfulCrafts);
      await playerManager.savePlayer(player);

      // 제작 스킬 경험치 추가 (스킬 시스템과 연동)
      if (recipe.skillExp > 0) {
        // await skillSystem.addSkillExperience(playerId, recipe.skillId, recipe.skillExp * successfulCrafts);
      }

      const resultItem = await gameDataManager.getItem(recipe.resultItemId);

      return {
        success: true,
        message: `${resultItem?.name || recipe.resultItemId}을(를) ${successfulCrafts}개 제작했습니다!`,
        resultItem: {
          itemId: recipe.resultItemId,
          quantity: successfulCrafts
        },
        materialsConsumed
      };
    } catch (error) {
      console.error(`아이템 제작 실패: ${playerId}, ${recipeId}`, error);
      return { success: false, message: '제작 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 인벤토리 정리
   */
  async organizeInventory(playerId: string): Promise<{
    success: boolean;
    message: string;
    itemsMerged: number;
    slotsFreed: number;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.', itemsMerged: 0, slotsFreed: 0 };
      }

      const originalSlotCount = player.inventory.length;
      const itemGroups = new Map<string, InventoryItem[]>();

      // 아이템을 ID별로 그룹화
      for (const item of player.inventory) {
        if (!itemGroups.has(item.itemId)) {
          itemGroups.set(item.itemId, []);
        }
        itemGroups.get(item.itemId)!.push(item);
      }

      const newInventory: InventoryItem[] = [];
      let itemsMerged = 0;
      let currentSlot = 0;

      for (const [itemId, items] of itemGroups) {
        const itemData = await gameDataManager.getItem(itemId);
        if (!itemData) continue;

        if (itemData.stackable && items.length > 1) {
          // 스택 가능한 아이템들 합치기
          let totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          itemsMerged += items.length - 1;

          // 최대 스택 크기에 맞춰 분할
          while (totalQuantity > 0) {
            const stackSize = Math.min(totalQuantity, itemData.maxStack);
            newInventory.push({
              itemId,
              quantity: stackSize,
              slot: currentSlot++
            });
            totalQuantity -= stackSize;
          }
        } else {
          // 스택 불가능하거나 개수가 1개인 아이템
          for (const item of items) {
            newInventory.push({
              ...item,
              slot: currentSlot++
            });
          }
        }
      }

      player.inventory = newInventory;
      await playerManager.savePlayer(player);

      const slotsFreed = originalSlotCount - newInventory.length;

      return {
        success: true,
        message: `인벤토리를 정리했습니다. ${itemsMerged}개 아이템이 합쳐졌고 ${slotsFreed}개 슬롯이 확보되었습니다.`,
        itemsMerged,
        slotsFreed
      };
    } catch (error) {
      console.error(`인벤토리 정리 실패: ${playerId}`, error);
      return { success: false, message: '인벤토리 정리 중 오류가 발생했습니다.', itemsMerged: 0, slotsFreed: 0 };
    }
  }

  /**
   * 아이템 드롭 계산
   */
  async calculateItemDrops(
    dropTable: DropTable,
    playerLevel: number,
    bonusDropRate: number = 1.0
  ): Promise<Array<{ itemId: string; quantity: number; }>> {
    const drops: Array<{ itemId: string; quantity: number; }> = [];

    for (const dropItem of dropTable.items) {
      let dropChance = dropItem.chance * bonusDropRate;
      
      // 레벨 차이에 따른 드롭률 조정
      // (실제로는 몬스터 레벨과 비교해야 함)
      
      if (Math.random() * 100 < dropChance) {
        const quantity = Math.floor(
          Math.random() * (dropItem.quantity.max - dropItem.quantity.min + 1) + 
          dropItem.quantity.min
        );
        
        drops.push({
          itemId: dropItem.itemId,
          quantity
        });
      }
    }

    return drops;
  }

  /**
   * 인벤토리 확장
   */
  async expandInventory(
    playerId: string, 
    expansionAmount: number,
    cost: number
  ): Promise<{
    success: boolean;
    message: string;
    newSize?: number;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      if (player.gold < cost) {
        return { 
          success: false, 
          message: `골드가 부족합니다. (필요: ${cost}, 보유: ${player.gold})` 
        };
      }

      const maxInventorySize = 200; // 최대 인벤토리 크기
      if (player.inventorySize + expansionAmount > maxInventorySize) {
        return { 
          success: false, 
          message: `인벤토리 크기가 최대 한계를 초과합니다. (최대: ${maxInventorySize})` 
        };
      }

      player.gold -= cost;
      player.inventorySize += expansionAmount;

      await playerManager.savePlayer(player);

      return {
        success: true,
        message: `인벤토리가 ${expansionAmount}칸 확장되었습니다.`,
        newSize: player.inventorySize
      };
    } catch (error) {
      console.error(`인벤토리 확장 실패: ${playerId}`, error);
      return { success: false, message: '인벤토리 확장 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 아이템 분해/해체
   */
  async dismantleItem(
    playerId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<{
    success: boolean;
    message: string;
    materials?: Array<{ itemId: string; quantity: number; }>;
  }> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        return { success: false, message: '플레이어를 찾을 수 없습니다.' };
      }

      const item = await gameDataManager.getItem(itemId);
      if (!item) {
        return { success: false, message: '존재하지 않는 아이템입니다.' };
      }

      // 분해 가능 여부 확인
      if (!this.canDismantleItem(item)) {
        return { success: false, message: '분해할 수 없는 아이템입니다.' };
      }

      // 아이템 보유 확인
      const hasItem = await playerManager.removeItem(playerId, itemId, quantity);
      if (!hasItem) {
        return { success: false, message: '아이템이 부족합니다.' };
      }

      // 분해 결과 계산
      const materials = this.calculateDismantleMaterials(item, quantity);
      
      // 재료 지급
      for (const material of materials) {
        await playerManager.addItem(playerId, material.itemId, material.quantity);
      }

      return {
        success: true,
        message: `${item.name}을(를) ${quantity}개 분해했습니다.`,
        materials
      };
    } catch (error) {
      console.error(`아이템 분해 실패: ${playerId}, ${itemId}`, error);
      return { success: false, message: '아이템 분해 중 오류가 발생했습니다.' };
    }
  }

  // 유틸리티 메서드들
  private async checkItemUsageRestrictions(player: Player, item: Item): Promise<{
    canUse: boolean;
    reason?: string;
  }> {
    // 전투 중 사용 제한
    // const isInBattle = await this.isPlayerInBattle(player.info.id);
    // if (isInBattle && !item.usableInBattle) {
    //   return { canUse: false, reason: '전투 중에는 사용할 수 없습니다.' };
    // }

    // 쿨다운 확인
    // const hasCooldown = await this.checkItemCooldown(player.info.id, item.id);
    // if (hasCooldown) {
    //   return { canUse: false, reason: '아직 사용할 수 없습니다.' };
    // }

    return { canUse: true };
  }

  private checkEquipmentRequirements(item: Item, player: Player): {
    success: boolean;
    message: string;
  } {
    // 레벨 요구사항
    if (item.requirements?.level && player.level.level < item.requirements.level) {
      return { success: false, message: `레벨 ${item.requirements.level} 이상이 필요합니다.` };
    }

    // 스탯 요구사항
    if (item.requirements?.stats) {
      for (const [stat, value] of Object.entries(item.requirements.stats)) {
        if (player.stats[stat as keyof typeof player.stats] < value) {
          return { success: false, message: `${stat.toUpperCase()} ${value} 이상이 필요합니다.` };
        }
      }
    }

    // 클래스 요구사항
    if (item.requirements?.class && !item.requirements.class.includes(player.info.class)) {
      return { success: false, message: '클래스 요구사항을 만족하지 않습니다.' };
    }

    return { success: true, message: '' };
  }

  private async calculateStatChanges(player: Player, oldItemId: string, newItemId: string) {
    const oldItem = oldItemId ? await gameDataManager.getItem(oldItemId) : null;
    const newItem = newItemId ? await gameDataManager.getItem(newItemId) : null;

    const before = { ...player.stats };
    const after = { ...player.stats };

    // 기존 장비 스탯 제거
    if (oldItem?.statBonus) {
      for (const [stat, value] of Object.entries(oldItem.statBonus)) {
        after[stat as keyof typeof after] -= value;
      }
    }

    // 새 장비 스탯 적용
    if (newItem?.statBonus) {
      for (const [stat, value] of Object.entries(newItem.statBonus)) {
        after[stat as keyof typeof after] += value;
      }
    }

    return { before, after };
  }

  private calculateHealAmount(baseAmount: number, player: Player): number {
    // 플레이어의 레벨이나 스탯에 따른 회복량 조정
    return Math.floor(baseAmount * (1 + player.level.level * 0.01));
  }

  private calculateManaAmount(baseAmount: number, player: Player): number {
    return Math.floor(baseAmount * (1 + player.level.level * 0.01));
  }

  private getCurrentHp(player: Player): number {
    // 실제로는 현재 HP를 추적하는 시스템 필요
    return player.stats.hp || 100;
  }

  private getCurrentMp(player: Player): number {
    // 실제로는 현재 MP를 추적하는 시스템 필요
    return player.stats.mp || 50;
  }

  private async addItemToInventory(player: Player, itemId: string, quantity: number): Promise<boolean> {
    // playerManager의 addItem 메서드 사용
    return await playerManager.addItem(player.info.id, itemId, quantity);
  }

  private async getCraftingRecipe(recipeId: string): Promise<any> {
    // 실제로는 제작법 데이터에서 가져와야 함
    return {
      id: recipeId,
      resultItemId: 'iron_sword',
      materials: [
        { itemId: 'iron_ore', quantity: 3 },
        { itemId: 'leather_scrap', quantity: 1 }
      ],
      cost: 100,
      successRate: 90,
      skillId: 'blacksmithing',
      skillLevel: 1,
      skillExp: 50
    };
  }

  private checkCraftingRequirements(recipe: any, player: Player, quantity: number): {
    success: boolean;
    message: string;
  } {
    // 재료 확인
    for (const material of recipe.materials) {
      const needed = material.quantity * quantity;
      const playerItem = player.inventory.find(item => item.itemId === material.itemId);
      
      if (!playerItem || playerItem.quantity < needed) {
        return { 
          success: false, 
          message: `${material.itemId} 재료가 부족합니다. (필요: ${needed}, 보유: ${playerItem?.quantity || 0})` 
        };
      }
    }

    // 골드 확인
    const totalCost = recipe.cost * quantity;
    if (player.gold < totalCost) {
      return { success: false, message: `골드가 부족합니다. (필요: ${totalCost}, 보유: ${player.gold})` };
    }

    // 스킬 레벨 확인
    if (recipe.skillId && recipe.skillLevel) {
      const playerSkill = player.skills.find(skill => skill.skillId === recipe.skillId);
      if (!playerSkill || playerSkill.level < recipe.skillLevel) {
        return { 
          success: false, 
          message: `${recipe.skillId} 스킬 레벨 ${recipe.skillLevel} 이상이 필요합니다.` 
        };
      }
    }

    return { success: true, message: '' };
  }

  private canDismantleItem(item: Item): boolean {
    // 분해 가능한 아이템 타입
    const dismantlableTypes = ['weapon', 'armor', 'accessory'];
    return dismantlableTypes.includes(item.type) && item.rarity !== 'common';
  }

  private calculateDismantleMaterials(item: Item, quantity: number): Array<{ itemId: string; quantity: number; }> {
    const materials: Array<{ itemId: string; quantity: number; }> = [];
    
    // 아이템 레벨과 등급에 따른 재료 계산
    const baseAmount = Math.max(1, Math.floor(item.level / 10));
    
    switch (item.type) {
      case 'weapon':
        materials.push({ itemId: 'metal_scrap', quantity: baseAmount * quantity });
        if (item.rarity === 'rare') {
          materials.push({ itemId: 'rare_crystal', quantity: quantity });
        }
        break;
        
      case 'armor':
        materials.push({ itemId: 'leather_scrap', quantity: baseAmount * quantity });
        materials.push({ itemId: 'metal_scrap', quantity: Math.floor(baseAmount * 0.5) * quantity });
        break;
        
      case 'accessory':
        materials.push({ itemId: 'gem_fragment', quantity: quantity });
        break;
    }

    return materials;
  }
}

// 싱글톤 인스턴스
export const itemSystem = new ItemSystem();