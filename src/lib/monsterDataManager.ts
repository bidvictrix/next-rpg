import fs from 'fs/promises';
import path from 'path';
import { Monster } from '@/types/game';

interface MonsterData {
  monsters: Record<string, Monster>;
  monsterCategories: Record<string, MonsterCategory>;
}

interface MonsterCategory {
  id: string;
  name: string;
  description: string;
  monsters: string[];
}

const MONSTERS_FILE_PATH = path.join(process.cwd(), 'data/game/monsters.json');

/**
 * JSON 파일에서 몬스터 데이터를 로드하는 함수
 */
export async function loadMonstersData(): Promise<MonsterData> {
  try {
    const fileContent = await fs.readFile(MONSTERS_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent) as MonsterData;
    return data;
  } catch (error) {
    console.error('몬스터 데이터 로드 실패:', error);
    throw new Error('몬스터 데이터를 로드할 수 없습니다.');
  }
}

/**
 * JSON 파일에 몬스터 데이터를 저장하는 함수
 */
export async function saveMonstersData(data: MonsterData): Promise<void> {
  try {
    await fs.writeFile(MONSTERS_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('몬스터 데이터 저장 실패:', error);
    throw new Error('몬스터 데이터를 저장할 수 없습니다.');
  }
}

/**
 * 특정 몬스터를 가져오는 함수
 */
export async function getMonster(monsterId: string): Promise<Monster | null> {
  try {
    const data = await loadMonstersData();
    return data.monsters[monsterId] || null;
  } catch (error) {
    console.error(`몬스터 ${monsterId} 조회 실패:`, error);
    return null;
  }
}

/**
 * 모든 몬스터를 배열로 가져오는 함수
 */
export async function getAllMonsters(): Promise<Monster[]> {
  try {
    const data = await loadMonstersData();
    return Object.values(data.monsters);
  } catch (error) {
    console.error('모든 몬스터 조회 실패:', error);
    return [];
  }
}

/**
 * 새로운 몬스터를 추가하는 함수
 */
export async function addMonster(monster: Monster): Promise<void> {
  try {
    const data = await loadMonstersData();
    data.monsters[monster.id] = monster;
    await saveMonstersData(data);
  } catch (error) {
    console.error(`몬스터 ${monster.id} 추가 실패:`, error);
    throw new Error('몬스터를 추가할 수 없습니다.');
  }
}

/**
 * 기존 몬스터를 수정하는 함수
 */
export async function updateMonster(monster: Monster): Promise<void> {
  try {
    const data = await loadMonstersData();
    if (!data.monsters[monster.id]) {
      throw new Error(`몬스터 ${monster.id}가 존재하지 않습니다.`);
    }
    data.monsters[monster.id] = monster;
    await saveMonstersData(data);
  } catch (error) {
    console.error(`몬스터 ${monster.id} 수정 실패:`, error);
    throw new Error('몬스터를 수정할 수 없습니다.');
  }
}

/**
 * 몬스터를 삭제하는 함수
 */
export async function deleteMonster(monsterId: string): Promise<void> {
  try {
    const data = await loadMonstersData();
    if (!data.monsters[monsterId]) {
      throw new Error(`몬스터 ${monsterId}가 존재하지 않습니다.`);
    }
    delete data.monsters[monsterId];
    
    // 카테고리에서도 제거
    Object.values(data.monsterCategories).forEach(category => {
      category.monsters = category.monsters.filter(id => id !== monsterId);
    });
    
    await saveMonstersData(data);
  } catch (error) {
    console.error(`몬스터 ${monsterId} 삭제 실패:`, error);
    throw new Error('몬스터를 삭제할 수 없습니다.');
  }
}

/**
 * 몬스터 카테고리를 가져오는 함수
 */
export async function getMonsterCategories(): Promise<MonsterCategory[]> {
  try {
    const data = await loadMonstersData();
    return Object.values(data.monsterCategories);
  } catch (error) {
    console.error('몬스터 카테고리 조회 실패:', error);
    return [];
  }
}

/**
 * 몬스터 카테고리를 추가/수정하는 함수
 */
export async function updateMonsterCategory(category: MonsterCategory): Promise<void> {
  try {
    const data = await loadMonstersData();
    data.monsterCategories[category.id] = category;
    await saveMonstersData(data);
  } catch (error) {
    console.error(`몬스터 카테고리 ${category.id} 수정 실패:`, error);
    throw new Error('몬스터 카테고리를 수정할 수 없습니다.');
  }
}

/**
 * 레벨별 몬스터 검색 함수
 */
export async function getMonstersByLevel(minLevel: number, maxLevel: number): Promise<Monster[]> {
  try {
    const monsters = await getAllMonsters();
    return monsters.filter(monster => 
      monster.level >= minLevel && monster.level <= maxLevel
    );
  } catch (error) {
    console.error('레벨별 몬스터 검색 실패:', error);
    return [];
  }
}

/**
 * 타입별 몬스터 검색 함수
 */
export async function getMonstersByType(type: Monster['type']): Promise<Monster[]> {
  try {
    const monsters = await getAllMonsters();
    return monsters.filter(monster => monster.type === type);
  } catch (error) {
    console.error('타입별 몬스터 검색 실패:', error);
    return [];
  }
}

/**
 * 지역별 몬스터 검색 함수
 */
export async function getMonstersByArea(areaId: string): Promise<Monster[]> {
  try {
    const monsters = await getAllMonsters();
    return monsters.filter(monster => 
      monster.spawnAreas.includes(areaId)
    );
  } catch (error) {
    console.error('지역별 몬스터 검색 실패:', error);
    return [];
  }
}

/**
 * 몬스터 데이터 검증 함수
 */
export function validateMonster(monster: Partial<Monster>): string[] {
  const errors: string[] = [];
  
  if (!monster.id || monster.id.trim() === '') {
    errors.push('몬스터 ID는 필수입니다.');
  }
  
  if (!monster.name || monster.name.trim() === '') {
    errors.push('몬스터 이름은 필수입니다.');
  }
  
  if (!monster.description || monster.description.trim() === '') {
    errors.push('몬스터 설명은 필수입니다.');
  }
  
  if (!monster.type || !['normal', 'elite', 'boss', 'raid_boss'].includes(monster.type)) {
    errors.push('몬스터 타입은 normal, elite, boss, raid_boss 중 하나여야 합니다.');
  }
  
  if (!monster.level || monster.level < 1) {
    errors.push('몬스터 레벨은 1 이상이어야 합니다.');
  }
  
  if (!monster.stats) {
    errors.push('몬스터 스탯은 필수입니다.');
  } else {
    const requiredStats = ['str', 'dex', 'int', 'vit', 'luk'];
    for (const stat of requiredStats) {
      if (!(stat in monster.stats) || monster.stats[stat as keyof typeof monster.stats] < 1) {
        errors.push(`몬스터 ${stat} 스탯은 1 이상이어야 합니다.`);
      }
    }
  }
  
  if (!monster.ai) {
    errors.push('몬스터 AI 설정은 필수입니다.');
  } else {
    if (!['passive', 'aggressive', 'defensive', 'smart'].includes(monster.ai.type)) {
      errors.push('몬스터 AI 타입은 passive, aggressive, defensive, smart 중 하나여야 합니다.');
    }
    if (monster.ai.attackRange < 1) {
      errors.push('몬스터 공격 범위는 1 이상이어야 합니다.');
    }
    if (monster.ai.detectionRange < 1) {
      errors.push('몬스터 감지 범위는 1 이상이어야 합니다.');
    }
    if (monster.ai.moveSpeed <= 0) {
      errors.push('몬스터 이동 속도는 0보다 커야 합니다.');
    }
  }
  
  if (!monster.dropTable) {
    errors.push('몬스터 드롭 테이블은 필수입니다.');
  } else {
    if (!monster.dropTable.gold || monster.dropTable.gold.min < 0 || monster.dropTable.gold.max < monster.dropTable.gold.min) {
      errors.push('몬스터 골드 드롭 설정이 올바르지 않습니다.');
    }
    if (monster.dropTable.experience < 0) {
      errors.push('몬스터 경험치는 0 이상이어야 합니다.');
    }
  }
  
  if (!monster.spawnAreas || !Array.isArray(monster.spawnAreas)) {
    errors.push('몬스터 스폰 지역은 배열이어야 합니다.');
  }
  
  if (!monster.spawnRate || monster.spawnRate < 0 || monster.spawnRate > 100) {
    errors.push('몬스터 스폰 확률은 0-100 사이여야 합니다.');
  }
  
  if (!monster.spawnLimit || monster.spawnLimit < 1) {
    errors.push('몬스터 스폰 제한은 1 이상이어야 합니다.');
  }
  
  if (!monster.respawnTime || monster.respawnTime < 0) {
    errors.push('몬스터 리스폰 시간은 0 이상이어야 합니다.');
  }
  
  if (!monster.size || !['tiny', 'small', 'medium', 'large', 'huge'].includes(monster.size)) {
    errors.push('몬스터 크기는 tiny, small, medium, large, huge 중 하나여야 합니다.');
  }
  
  if (!monster.appearance || monster.appearance.trim() === '') {
    errors.push('몬스터 외형 설명은 필수입니다.');
  }
  
  return errors;
}

/**
 * 몬스터 데이터 백업 생성 함수
 */
export async function createMonstersBackup(): Promise<string> {
  try {
    const data = await loadMonstersData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), `data/backups/monsters-backup-${timestamp}.json`);
    
    // 백업 디렉토리 생성
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    return backupPath;
  } catch (error) {
    console.error('몬스터 데이터 백업 실패:', error);
    throw new Error('몬스터 데이터 백업을 생성할 수 없습니다.');
  }
}

/**
 * 몬스터 데이터 복원 함수
 */
export async function restoreMonstersFromBackup(backupPath: string): Promise<void> {
  try {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent) as MonsterData;
    
    // 데이터 검증
    if (!backupData.monsters || !backupData.monsterCategories) {
      throw new Error('유효하지 않은 백업 파일입니다.');
    }
    
    await saveMonstersData(backupData);
  } catch (error) {
    console.error('몬스터 데이터 복원 실패:', error);
    throw new Error('몬스터 데이터를 복원할 수 없습니다.');
  }
}

/**
 * 몬스터 통계 정보 가져오기
 */
export async function getMonsterStats(): Promise<{
  total: number;
  byType: Record<string, number>;
  byLevel: Record<string, number>;
  averageLevel: number;
}> {
  try {
    const monsters = await getAllMonsters();
    const total = monsters.length;
    
    const byType: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    let totalLevel = 0;
    
    monsters.forEach(monster => {
      // 타입별 통계
      byType[monster.type] = (byType[monster.type] || 0) + 1;
      
      // 레벨대별 통계 (10레벨 단위)
      const levelRange = `${Math.floor(monster.level / 10) * 10}-${Math.floor(monster.level / 10) * 10 + 9}`;
      byLevel[levelRange] = (byLevel[levelRange] || 0) + 1;
      
      totalLevel += monster.level;
    });
    
    const averageLevel = total > 0 ? Math.round(totalLevel / total) : 0;
    
    return {
      total,
      byType,
      byLevel,
      averageLevel
    };
  } catch (error) {
    console.error('몬스터 통계 조회 실패:', error);
    return {
      total: 0,
      byType: {},
      byLevel: {},
      averageLevel: 0
    };
  }
}

export { MonsterCategory };
