import fs from 'fs/promises';
import path from 'path';
import { Item } from '@/types/game';

interface ItemData {
  items: Record<string, Item>;
  itemCategories: Record<string, ItemCategory>;
  craftingRecipes: Record<string, CraftingRecipe>;
}

interface ItemCategory {
  id: string;
  name: string;
  description: string;
  items: string[];
}

interface CraftingRecipe {
  id: string;
  resultItem: string;
  materials: Array<{
    itemId: string;
    quantity: number;
  }>;
  requiredSkill?: string;
  requiredLevel?: number;
  cost: number;
}

const ITEMS_FILE_PATH = path.join(process.cwd(), 'data/game/items.json');

/**
 * JSON 파일에서 아이템 데이터를 로드하는 함수
 */
export async function loadItemsData(): Promise<ItemData> {
  try {
    const fileContent = await fs.readFile(ITEMS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent) as ItemData;
    return data;
  } catch (error) {
    console.error('아이템 데이터 로드 실패:', error);
    throw new Error('아이템 데이터를 로드할 수 없습니다.');
  }
}

/**
 * JSON 파일에 아이템 데이터를 저장하는 함수
 */
export async function saveItemsData(data: ItemData): Promise<void> {
  try {
    await fs.writeFile(ITEMS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('아이템 데이터 저장 실패:', error);
    throw new Error('아이템 데이터를 저장할 수 없습니다.');
  }
}

/**
 * 특정 아이템을 가져오는 함수
 */
export async function getItem(itemId: string): Promise<Item | null> {
  try {
    const data = await loadItemsData();
    return data.items[itemId] || null;
  } catch (error) {
    console.error(`아이템 ${itemId} 조회 실패:`, error);
    return null;
  }
}

/**
 * 모든 아이템을 배열로 가져오는 함수
 */
export async function getAllItems(): Promise<Item[]> {
  try {
    const data = await loadItemsData();
    return Object.values(data.items);
  } catch (error) {
    console.error('모든 아이템 조회 실패:', error);
    return [];
  }
}

/**
 * 새로운 아이템을 추가하는 함수
 */
export async function addItem(item: Item): Promise<void> {
  try {
    const data = await loadItemsData();
    data.items[item.id] = item;
    await saveItemsData(data);
  } catch (error) {
    console.error(`아이템 ${item.id} 추가 실패:`, error);
    throw new Error('아이템을 추가할 수 없습니다.');
  }
}

/**
 * 기존 아이템을 수정하는 함수
 */
export async function updateItem(item: Item): Promise<void> {
  try {
    const data = await loadItemsData();
    if (!data.items[item.id]) {
      throw new Error(`아이템 ${item.id}가 존재하지 않습니다.`);
    }
    data.items[item.id] = item;
    await saveItemsData(data);
  } catch (error) {
    console.error(`아이템 ${item.id} 수정 실패:`, error);
    throw new Error('아이템을 수정할 수 없습니다.');
  }
}

/**
 * 아이템을 삭제하는 함수
 */
export async function deleteItem(itemId: string): Promise<void> {
  try {
    const data = await loadItemsData();
    if (!data.items[itemId]) {
      throw new Error(`아이템 ${itemId}가 존재하지 않습니다.`);
    }
    delete data.items[itemId];
    
    // 카테고리에서도 제거
    Object.values(data.itemCategories).forEach(category => {
      category.items = category.items.filter(id => id !== itemId);
    });
    
    await saveItemsData(data);
  } catch (error) {
    console.error(`아이템 ${itemId} 삭제 실패:`, error);
    throw new Error('아이템을 삭제할 수 없습니다.');
  }
}

/**
 * 아이템 카테고리를 가져오는 함수
 */
export async function getItemCategories(): Promise<ItemCategory[]> {
  try {
    const data = await loadItemsData();
    return Object.values(data.itemCategories);
  } catch (error) {
    console.error('아이템 카테고리 조회 실패:', error);
    return [];
  }
}

/**
 * 아이템 카테고리를 추가/수정하는 함수
 */
export async function updateItemCategory(category: ItemCategory): Promise<void> {
  try {
    const data = await loadItemsData();
    data.itemCategories[category.id] = category;
    await saveItemsData(data);
  } catch (error) {
    console.error(`아이템 카테고리 ${category.id} 수정 실패:`, error);
    throw new Error('아이템 카테고리를 수정할 수 없습니다.');
  }
}

/**
 * 타입별 아이템 검색 함수
 */
export async function getItemsByType(type: Item['type']): Promise<Item[]> {
  try {
    const items = await getAllItems();
    return items.filter(item => item.type === type);
  } catch (error) {
    console.error('타입별 아이템 검색 실패:', error);
    return [];
  }
}

/**
 * 희소성별 아이템 검색 함수
 */
export async function getItemsByRarity(rarity: Item['rarity']): Promise<Item[]> {
  try {
    const items = await getAllItems();
    return items.filter(item => item.rarity === rarity);
  } catch (error) {
    console.error('희소성별 아이템 검색 실패:', error);
    return [];
  }
}

/**
 * 레벨별 아이템 검색 함수
 */
export async function getItemsByLevel(minLevel: number, maxLevel: number): Promise<Item[]> {
  try {
    const items = await getAllItems();
    return items.filter(item => 
      item.level >= minLevel && item.level <= maxLevel
    );
  } catch (error) {
    console.error('레벨별 아이템 검색 실패:', error);
    return [];
  }
}

/**
 * 장비 슬롯별 아이템 검색 함수
 */
export async function getItemsByEquipmentSlot(slot: string): Promise<Item[]> {
  try {
    const items = await getAllItems();
    return items.filter(item => item.equipmentSlot === slot);
  } catch (error) {
    console.error('장비 슬롯별 아이템 검색 실패:', error);
    return [];
  }
}

/**
 * 제작 가능한 아이템 검색 함수
 */
export async function getCraftableItems(): Promise<Item[]> {
  try {
    const items = await getAllItems();
    return items.filter(item => item.craftable === true);
  } catch (error) {
    console.error('제작 가능한 아이템 검색 실패:', error);
    return [];
  }
}

/**
 * 제작 레시피 조회 함수
 */
export async function getCraftingRecipes(): Promise<CraftingRecipe[]> {
  try {
    const data = await loadItemsData();
    return Object.values(data.craftingRecipes || {});
  } catch (error) {
    console.error('제작 레시피 조회 실패:', error);
    return [];
  }
}

/**
 * 제작 레시피 추가/수정 함수
 */
export async function updateCraftingRecipe(recipe: CraftingRecipe): Promise<void> {
  try {
    const data = await loadItemsData();
    if (!data.craftingRecipes) {
      data.craftingRecipes = {};
    }
    data.craftingRecipes[recipe.id] = recipe;
    await saveItemsData(data);
  } catch (error) {
    console.error(`제작 레시피 ${recipe.id} 수정 실패:`, error);
    throw new Error('제작 레시피를 수정할 수 없습니다.');
  }
}

/**
 * 아이템 데이터 검증 함수
 */
export function validateItem(item: Partial<Item>): string[] {
  const errors: string[] = [];
  
  if (!item.id || item.id.trim() === '') {
    errors.push('아이템 ID는 필수입니다.');
  }
  
  if (!item.name || item.name.trim() === '') {
    errors.push('아이템 이름은 필수입니다.');
  }
  
  if (!item.description || item.description.trim() === '') {
    errors.push('아이템 설명은 필수입니다.');
  }
  
  if (!item.type || !['weapon', 'armor', 'accessory', 'consumable', 'material', 'quest', 'misc'].includes(item.type)) {
    errors.push('아이템 타입은 weapon, armor, accessory, consumable, material, quest, misc 중 하나여야 합니다.');
  }
  
  if (!item.rarity || !['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'].includes(item.rarity)) {
    errors.push('아이템 희소성은 common, uncommon, rare, epic, legendary, mythic 중 하나여야 합니다.');
  }
  
  if (!item.level || item.level < 1) {
    errors.push('아이템 레벨은 1 이상이어야 합니다.');
  }
  
  if (item.stackable === undefined) {
    errors.push('스택 가능 여부는 필수입니다.');
  }
  
  if (!item.maxStack || item.maxStack < 1) {
    errors.push('최대 스택 수는 1 이상이어야 합니다.');
  }
  
  if (item.value === undefined || item.value < 0) {
    errors.push('아이템 가치는 0 이상이어야 합니다.');
  }
  
  // 장비 아이템 검증
  if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
    if (!item.equipmentSlot) {
      errors.push('장비 아이템은 장착 슬롯이 필요합니다.');
    }
    
    if (item.durability && (item.durability.current < 0 || item.durability.max < 1)) {
      errors.push('내구도 설정이 올바르지 않습니다.');
    }
  }
  
  // 소모품 검증
  if (item.type === 'consumable' && item.consumableEffect) {
    if (!['heal', 'mana', 'buff', 'debuff'].includes(item.consumableEffect.type)) {
      errors.push('소모품 효과 타입이 올바르지 않습니다.');
    }
    
    if (item.consumableEffect.value < 0) {
      errors.push('소모품 효과 수치는 0 이상이어야 합니다.');
    }
    
    if (item.consumableEffect.duration !== undefined && item.consumableEffect.duration < 0) {
      errors.push('소모품 지속 시간은 0 이상이어야 합니다.');
    }
  }
  
  return errors;
}

/**
 * 아이템 데이터 백업 생성 함수
 */
export async function createItemsBackup(): Promise<string> {
  try {
    const data = await loadItemsData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), `data/backups/items-backup-${timestamp}.json`);
    
    // 백업 디렉토리 생성
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    return backupPath;
  } catch (error) {
    console.error('아이템 데이터 백업 실패:', error);
    throw new Error('아이템 데이터 백업을 생성할 수 없습니다.');
  }
}

/**
 * 아이템 데이터 복원 함수
 */
export async function restoreItemsFromBackup(backupPath: string): Promise<void> {
  try {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent) as ItemData;
    
    // 데이터 검증
    if (!backupData.items || !backupData.itemCategories) {
      throw new Error('유효하지 않은 백업 파일입니다.');
    }
    
    await saveItemsData(backupData);
  } catch (error) {
    console.error('아이템 데이터 복원 실패:', error);
    throw new Error('아이템 데이터를 복원할 수 없습니다.');
  }
}

/**
 * 아이템 통계 정보 가져오기
 */
export async function getItemStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byRarity: Record<string, number>;
  byLevel: Record<string, number>;
  averageLevel: number;
  totalValue: number;
}> {
  try {
    const items = await getAllItems();
    const total = items.length;
    
    const byType: Record<string, number> = {};
    const byRarity: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    let totalLevel = 0;
    let totalValue = 0;
    
    items.forEach(item => {
      // 타입별 통계
      byType[item.type] = (byType[item.type] || 0) + 1;
      
      // 희소성별 통계
      byRarity[item.rarity] = (byRarity[item.rarity] || 0) + 1;
      
      // 레벨대별 통계 (10레벨 단위)
      const levelRange = `${Math.floor(item.level / 10) * 10}-${Math.floor(item.level / 10) * 10 + 9}`;
      byLevel[levelRange] = (byLevel[levelRange] || 0) + 1;
      
      totalLevel += item.level;
      totalValue += item.value;
    });
    
    const averageLevel = total > 0 ? Math.round(totalLevel / total) : 0;
    
    return {
      total,
      byType,
      byRarity,
      byLevel,
      averageLevel,
      totalValue
    };
  } catch (error) {
    console.error('아이템 통계 조회 실패:', error);
    return {
      total: 0,
      byType: {},
      byRarity: {},
      byLevel: {},
      averageLevel: 0,
      totalValue: 0
    };
  }
}

/**
 * 아이템 가격 조정 함수
 */
export async function adjustItemPrice(itemId: string, newPrice: number): Promise<void> {
  try {
    const data = await loadItemsData();
    if (!data.items[itemId]) {
      throw new Error(`아이템 ${itemId}가 존재하지 않습니다.`);
    }
    
    data.items[itemId].value = newPrice;
    await saveItemsData(data);
  } catch (error) {
    console.error(`아이템 ${itemId} 가격 조정 실패:`, error);
    throw new Error('아이템 가격을 조정할 수 없습니다.');
  }
}

/**
 * 아이템 일괄 가격 조정 함수 (경제 밸런스용)
 */
export async function adjustItemPricesByType(type: Item['type'], multiplier: number): Promise<void> {
  try {
    const data = await loadItemsData();
    
    Object.values(data.items).forEach(item => {
      if (item.type === type) {
        item.value = Math.round(item.value * multiplier);
      }
    });
    
    await saveItemsData(data);
  } catch (error) {
    console.error(`${type} 타입 아이템 가격 일괄 조정 실패:`, error);
    throw new Error('아이템 가격을 일괄 조정할 수 없습니다.');
  }
}

export { ItemCategory, CraftingRecipe };
