import { Skill, SkillTree } from '../types/skill';
import { Monster } from '../types/game';
import { Item } from '../types/game';
import { Area } from '../types/game';
import { Quest } from '../types/game';
import { dataManager } from './dataManager';

export class GameDataManager {
  private skillsCache: Map<string, Skill> = new Map();
  private monstersCache: Map<string, Monster> = new Map();
  private itemsCache: Map<string, Item> = new Map();
  private areasCache: Map<string, Area> = new Map();
  private questsCache: Map<string, Quest> = new Map();
  
  private lastLoadTime: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10분

  /**
   * 스킬 데이터 관리
   */
  async loadAllSkills(): Promise<Map<string, Skill>> {
    try {
      if (this.shouldRefreshCache('skills')) {
        const skillsData = await dataManager.readFile<{ skills: Record<string, Skill> }>('game/skills.json');
        
        if (skillsData?.skills) {
          this.skillsCache.clear();
          Object.values(skillsData.skills).forEach(skill => {
            this.skillsCache.set(skill.id, skill);
          });
          this.lastLoadTime.set('skills', Date.now());
        }
      }
      
      return new Map(this.skillsCache);
    } catch (error) {
      console.error('스킬 데이터 로드 실패', error);
      return new Map();
    }
  }

  async getSkill(skillId: string): Promise<Skill | null> {
    await this.loadAllSkills();
    return this.skillsCache.get(skillId) || null;
  }

  async addSkill(skill: Skill): Promise<boolean> {
    try {
      await this.loadAllSkills();
      
      const skillsData = await dataManager.readFile<{ skills: Record<string, Skill> }>('game/skills.json') || 
                        { skills: {} };
      
      skillsData.skills[skill.id] = skill;
      await dataManager.writeFile('game/skills.json', skillsData);
      
      // 캐시 업데이트
      this.skillsCache.set(skill.id, skill);
      
      return true;
    } catch (error) {
      console.error('스킬 추가 실패', error);
      return false;
    }
  }

  async updateSkill(skill: Skill): Promise<boolean> {
    return await this.addSkill(skill); // 동일한 로직
  }

  async deleteSkill(skillId: string): Promise<boolean> {
    try {
      const skillsData = await dataManager.readFile<{ skills: Record<string, Skill> }>('game/skills.json');
      
      if (skillsData?.skills && skillsData.skills[skillId]) {
        delete skillsData.skills[skillId];
        await dataManager.writeFile('game/skills.json', skillsData);
        
        // 캐시에서 제거
        this.skillsCache.delete(skillId);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('스킬 삭제 실패', error);
      return false;
    }
  }

  /**
   * 몬스터 데이터 관리
   */
  async loadAllMonsters(): Promise<Map<string, Monster>> {
    try {
      if (this.shouldRefreshCache('monsters')) {
        const monstersData = await dataManager.readFile<{ monsters: Record<string, Monster> }>('game/monsters.json');
        
        if (monstersData?.monsters) {
          this.monstersCache.clear();
          Object.values(monstersData.monsters).forEach(monster => {
            this.monstersCache.set(monster.id, monster);
          });
          this.lastLoadTime.set('monsters', Date.now());
        }
      }
      
      return new Map(this.monstersCache);
    } catch (error) {
      console.error('몬스터 데이터 로드 실패', error);
      return new Map();
    }
  }

  async getMonster(monsterId: string): Promise<Monster | null> {
    await this.loadAllMonsters();
    return this.monstersCache.get(monsterId) || null;
  }

  async getMonstersByArea(areaId: string): Promise<Monster[]> {
    await this.loadAllMonsters();
    return Array.from(this.monstersCache.values())
      .filter(monster => monster.spawnAreas.includes(areaId));
  }

  async getMonstersByLevel(minLevel: number, maxLevel: number): Promise<Monster[]> {
    await this.loadAllMonsters();
    return Array.from(this.monstersCache.values())
      .filter(monster => monster.level >= minLevel && monster.level <= maxLevel);
  }

  async addMonster(monster: Monster): Promise<boolean> {
    try {
      await this.loadAllMonsters();
      
      const monstersData = await dataManager.readFile<{ monsters: Record<string, Monster> }>('game/monsters.json') || 
                          { monsters: {} };
      
      monstersData.monsters[monster.id] = monster;
      await dataManager.writeFile('game/monsters.json', monstersData);
      
      // 캐시 업데이트
      this.monstersCache.set(monster.id, monster);
      
      return true;
    } catch (error) {
      console.error('몬스터 추가 실패', error);
      return false;
    }
  }

  /**
   * 아이템 데이터 관리
   */
  async loadAllItems(): Promise<Map<string, Item>> {
    try {
      if (this.shouldRefreshCache('items')) {
        const itemsData = await dataManager.readFile<{ items: Record<string, Item> }>('game/items.json');
        
        if (itemsData?.items) {
          this.itemsCache.clear();
          Object.values(itemsData.items).forEach(item => {
            this.itemsCache.set(item.id, item);
          });
          this.lastLoadTime.set('items', Date.now());
        }
      }
      
      return new Map(this.itemsCache);
    } catch (error) {
      console.error('아이템 데이터 로드 실패', error);
      return new Map();
    }
  }

  async getItem(itemId: string): Promise<Item | null> {
    await this.loadAllItems();
    return this.itemsCache.get(itemId) || null;
  }

  async getItemsByType(type: Item['type']): Promise<Item[]> {
    await this.loadAllItems();
    return Array.from(this.itemsCache.values())
      .filter(item => item.type === type);
  }

  async getItemsByRarity(rarity: Item['rarity']): Promise<Item[]> {
    await this.loadAllItems();
    return Array.from(this.itemsCache.values())
      .filter(item => item.rarity === rarity);
  }

  async searchItems(query: string): Promise<Item[]> {
    await this.loadAllItems();
    const searchTerm = query.toLowerCase();
    
    return Array.from(this.itemsCache.values())
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      );
  }

  async addItem(item: Item): Promise<boolean> {
    try {
      await this.loadAllItems();
      
      const itemsData = await dataManager.readFile<{ items: Record<string, Item> }>('game/items.json') || 
                       { items: {} };
      
      itemsData.items[item.id] = item;
      await dataManager.writeFile('game/items.json', itemsData);
      
      // 캐시 업데이트
      this.itemsCache.set(item.id, item);
      
      return true;
    } catch (error) {
      console.error('아이템 추가 실패', error);
      return false;
    }
  }

  /**
   * 지역 데이터 관리
   */
  async loadAllAreas(): Promise<Map<string, Area>> {
    try {
      if (this.shouldRefreshCache('areas')) {
        const areasData = await dataManager.readFile<{ areas: Record<string, Area> }>('game/areas.json');
        
        if (areasData?.areas) {
          this.areasCache.clear();
          Object.values(areasData.areas).forEach(area => {
            this.areasCache.set(area.id, area);
          });
          this.lastLoadTime.set('areas', Date.now());
        }
      }
      
      return new Map(this.areasCache);
    } catch (error) {
      console.error('지역 데이터 로드 실패', error);
      return new Map();
    }
  }

  async getArea(areaId: string): Promise<Area | null> {
    await this.loadAllAreas();
    return this.areasCache.get(areaId) || null;
  }

  async getAreasByType(type: Area['type']): Promise<Area[]> {
    await this.loadAllAreas();
    return Array.from(this.areasCache.values())
      .filter(area => area.type === type);
  }

  async getConnectedAreas(areaId: string): Promise<Area[]> {
    const currentArea = await this.getArea(areaId);
    if (!currentArea) return [];

    await this.loadAllAreas();
    const connectedAreaIds = currentArea.connections.map(conn => conn.areaId);
    
    return Array.from(this.areasCache.values())
      .filter(area => connectedAreaIds.includes(area.id));
  }

  async addArea(area: Area): Promise<boolean> {
    try {
      await this.loadAllAreas();
      
      const areasData = await dataManager.readFile<{ areas: Record<string, Area> }>('game/areas.json') || 
                       { areas: {} };
      
      areasData.areas[area.id] = area;
      await dataManager.writeFile('game/areas.json', areasData);
      
      // 캐시 업데이트
      this.areasCache.set(area.id, area);
      
      return true;
    } catch (error) {
      console.error('지역 추가 실패', error);
      return false;
    }
  }

  /**
   * 퀘스트 데이터 관리
   */
  async loadAllQuests(): Promise<Map<string, Quest>> {
    try {
      if (this.shouldRefreshCache('quests')) {
        const questsData = await dataManager.readFile<{ quests: Record<string, Quest> }>('game/quests.json');
        
        if (questsData?.quests) {
          this.questsCache.clear();
          Object.values(questsData.quests).forEach(quest => {
            this.questsCache.set(quest.id, quest);
          });
          this.lastLoadTime.set('quests', Date.now());
        }
      }
      
      return new Map(this.questsCache);
    } catch (error) {
      console.error('퀘스트 데이터 로드 실패', error);
      return new Map();
    }
  }

  async getQuest(questId: string): Promise<Quest | null> {
    await this.loadAllQuests();
    return this.questsCache.get(questId) || null;
  }

  async getQuestsByType(type: Quest['type']): Promise<Quest[]> {
    await this.loadAllQuests();
    return Array.from(this.questsCache.values())
      .filter(quest => quest.type === type);
  }

  async getQuestsByGiver(giverId: string): Promise<Quest[]> {
    await this.loadAllQuests();
    return Array.from(this.questsCache.values())
      .filter(quest => quest.giver === giverId);
  }

  async getAvailableQuests(playerLevel: number, completedQuests: string[]): Promise<Quest[]> {
    await this.loadAllQuests();
    
    return Array.from(this.questsCache.values())
      .filter(quest => {
        // 레벨 요구사항 확인
        if (quest.requirements.level && playerLevel < quest.requirements.level) {
          return false;
        }
        
        // 전제 퀘스트 확인
        if (quest.requirements.completedQuests) {
          const hasAllPrerequisites = quest.requirements.completedQuests
            .every(reqQuest => completedQuests.includes(reqQuest));
          if (!hasAllPrerequisites) {
            return false;
          }
        }
        
        // 이미 완료된 퀘스트 제외 (반복 불가능한 경우)
        if (!quest.repeatable && completedQuests.includes(quest.id)) {
          return false;
        }
        
        return true;
      });
  }

  async addQuest(quest: Quest): Promise<boolean> {
    try {
      await this.loadAllQuests();
      
      const questsData = await dataManager.readFile<{ quests: Record<string, Quest> }>('game/quests.json') || 
                        { quests: {} };
      
      questsData.quests[quest.id] = quest;
      await dataManager.writeFile('game/quests.json', questsData);
      
      // 캐시 업데이트
      this.questsCache.set(quest.id, quest);
      
      return true;
    } catch (error) {
      console.error('퀘스트 추가 실패', error);
      return false;
    }
  }

  /**
   * 배치 작업
   */
  async batchUpdateGameData(updates: {
    skills?: Skill[];
    monsters?: Monster[];
    items?: Item[];
    areas?: Area[];
    quests?: Quest[];
  }): Promise<boolean> {
    try {
      const operations = [];

      if (updates.skills) {
        for (const skill of updates.skills) {
          operations.push(this.addSkill(skill));
        }
      }

      if (updates.monsters) {
        for (const monster of updates.monsters) {
          operations.push(this.addMonster(monster));
        }
      }

      if (updates.items) {
        for (const item of updates.items) {
          operations.push(this.addItem(item));
        }
      }

      if (updates.areas) {
        for (const area of updates.areas) {
          operations.push(this.addArea(area));
        }
      }

      if (updates.quests) {
        for (const quest of updates.quests) {
          operations.push(this.addQuest(quest));
        }
      }

      const results = await Promise.all(operations);
      return results.every(result => result === true);
    } catch (error) {
      console.error('배치 업데이트 실패', error);
      return false;
    }
  }

  /**
   * 캐시 관리
   */
  clearCache(): void {
    this.skillsCache.clear();
    this.monstersCache.clear();
    this.itemsCache.clear();
    this.areasCache.clear();
    this.questsCache.clear();
    this.lastLoadTime.clear();
  }

  clearCacheByType(type: 'skills' | 'monsters' | 'items' | 'areas' | 'quests'): void {
    switch (type) {
      case 'skills':
        this.skillsCache.clear();
        break;
      case 'monsters':
        this.monstersCache.clear();
        break;
      case 'items':
        this.itemsCache.clear();
        break;
      case 'areas':
        this.areasCache.clear();
        break;
      case 'quests':
        this.questsCache.clear();
        break;
    }
    this.lastLoadTime.delete(type);
  }

  /**
   * 게임 데이터 검증
   */
  async validateGameData(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // 스킬 검증
      const skills = await this.loadAllSkills();
      for (const [id, skill] of skills) {
        if (!skill.name || !skill.description) {
          errors.push(`스킬 ${id}: 이름 또는 설명이 없습니다`);
        }
        
        // 부모-자식 스킬 관계 검증
        if (skill.parentSkills) {
          for (const parentId of skill.parentSkills) {
            if (!skills.has(parentId)) {
              errors.push(`스킬 ${id}: 부모 스킬 ${parentId}이 존재하지 않습니다`);
            }
          }
        }
      }

      // 몬스터 검증
      const monsters = await this.loadAllMonsters();
      for (const [id, monster] of monsters) {
        if (monster.level <= 0) {
          errors.push(`몬스터 ${id}: 레벨이 유효하지 않습니다`);
        }
        
        if (!monster.stats) {
          errors.push(`몬스터 ${id}: 스탯 정보가 없습니다`);
        }
      }

      // 아이템 검증
      const items = await this.loadAllItems();
      for (const [id, item] of items) {
        if (item.value < 0) {
          errors.push(`아이템 ${id}: 가치가 음수입니다`);
        }
        
        if (item.maxStack <= 0) {
          errors.push(`아이템 ${id}: 최대 스택이 유효하지 않습니다`);
        }
      }

      // 지역 검증
      const areas = await this.loadAllAreas();
      for (const [id, area] of areas) {
        // 연결된 지역 존재 확인
        for (const connection of area.connections) {
          if (!areas.has(connection.areaId)) {
            errors.push(`지역 ${id}: 연결된 지역 ${connection.areaId}이 존재하지 않습니다`);
          }
        }
      }

      // 퀘스트 검증
      const quests = await this.loadAllQuests();
      for (const [id, quest] of quests) {
        if (quest.requirements.completedQuests) {
          for (const reqQuest of quest.requirements.completedQuests) {
            if (!quests.has(reqQuest)) {
              errors.push(`퀘스트 ${id}: 전제 퀘스트 ${reqQuest}이 존재하지 않습니다`);
            }
          }
        }
      }

    } catch (error) {
      errors.push(`데이터 검증 중 오류 발생: ${(error as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 유틸리티 메서드
  private shouldRefreshCache(type: string): boolean {
    const lastTime = this.lastLoadTime.get(type);
    if (!lastTime) return true;
    
    return Date.now() - lastTime > this.CACHE_DURATION;
  }
}

// 싱글톤 인스턴스
export const gameDataManager = new GameDataManager();