import { Player, createDefaultPlayer, Stats, LevelSystem, PlayerSkill, InventoryItem } from '../types/player';
import { dataManager } from './dataManager';
import { v4 as uuidv4 } from 'uuid';

export class PlayerManager {
  private cache: Map<string, Player> = new Map();
  private cacheTimeout: Map<string, NodeJS.Timeout> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분

  /**
   * 플레이어 생성
   */
  async createPlayer(username: string, email: string, characterName: string): Promise<Player> {
    const playerId = uuidv4();
    const player = createDefaultPlayer(playerId, username, email, characterName);
    
    await this.savePlayer(player);
    return player;
  }

  /**
   * 플레이어 데이터 로드
   */
  async loadPlayer(playerId: string): Promise<Player | null> {
    // 캐시에서 먼저 확인
    if (this.cache.has(playerId)) {
      this.refreshCacheTimeout(playerId);
      return this.cache.get(playerId)!;
    }

    try {
      const playerData = await dataManager.readFile<Player>(`players/${playerId}.json`);
      
      if (playerData) {
        this.setCacheWithTimeout(playerId, playerData);
        return playerData;
      }
      
      return null;
    } catch (error) {
      console.error(`플레이어 로드 실패: ${playerId}`, error);
      return null;
    }
  }

  /**
   * 플레이어 데이터 저장
   */
  async savePlayer(player: Player): Promise<boolean> {
    try {
      // 저장 전 데이터 검증
      if (!this.validatePlayer(player)) {
        throw new Error('플레이어 데이터가 유효하지 않습니다');
      }

      // 마지막 로그인 시간 업데이트
      player.info.lastLoginAt = new Date().toISOString();
      
      await dataManager.atomicWrite(`players/${player.info.id}.json`, player);
      
      // 캐시 업데이트
      this.setCacheWithTimeout(player.info.id, player);
      
      return true;
    } catch (error) {
      console.error(`플레이어 저장 실패: ${player.info.id}`, error);
      return false;
    }
  }

  /**
   * 플레이어 삭제
   */
  async deletePlayer(playerId: string): Promise<boolean> {
    try {
      const success = await dataManager.deleteFile(`players/${playerId}.json`);
      
      if (success) {
        this.removeFromCache(playerId);
      }
      
      return success;
    } catch (error) {
      console.error(`플레이어 삭제 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 모든 플레이어 목록 조회
   */
  async getAllPlayers(): Promise<Player[]> {
    try {
      const files = await dataManager.listFiles('players');
      const players: Player[] = [];

      for (const file of files) {
        const playerId = file.replace('.json', '');
        const player = await this.loadPlayer(playerId);
        
        if (player) {
          players.push(player);
        }
      }

      return players;
    } catch (error) {
      console.error('모든 플레이어 조회 실패', error);
      return [];
    }
  }

  /**
   * 플레이어 검색
   */
  async searchPlayers(query: string): Promise<Player[]> {
    try {
      const allPlayers = await this.getAllPlayers();
      
      return allPlayers.filter(player => 
        player.info.username.toLowerCase().includes(query.toLowerCase()) ||
        player.info.characterName.toLowerCase().includes(query.toLowerCase()) ||
        player.info.email.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('플레이어 검색 실패', error);
      return [];
    }
  }

  /**
   * 플레이어 레벨업
   */
  async levelUpPlayer(playerId: string, experienceGained: number): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      let levelsGained = 0;
      player.level.experience += experienceGained;

      // 레벨업 계산
      while (player.level.experience >= player.level.experienceToNext) {
        player.level.experience -= player.level.experienceToNext;
        player.level.level++;
        levelsGained++;

        // 스탯 포인트와 스킬 포인트 지급
        player.level.statPoints += 5;
        player.level.skillPoints += 1;

        // 다음 레벨 경험치 계산 (지수적 증가)
        player.level.experienceToNext = Math.floor(100 * Math.pow(1.2, player.level.level - 1));
      }

      if (levelsGained > 0) {
        await this.savePlayer(player);
        console.log(`플레이어 ${player.info.characterName}이 ${levelsGained}레벨 상승했습니다!`);
      }

      return true;
    } catch (error) {
      console.error(`레벨업 처리 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 플레이어 스탯 할당
   */
  async allocateStats(playerId: string, statAllocations: Partial<Stats>): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      const totalPoints = Object.values(statAllocations).reduce((sum, points) => sum + (points || 0), 0);
      
      if (totalPoints > player.level.statPoints) {
        throw new Error('할당할 수 있는 스탯 포인트를 초과했습니다');
      }

      // 스탯 적용
      if (statAllocations.str) player.stats.str += statAllocations.str;
      if (statAllocations.dex) player.stats.dex += statAllocations.dex;
      if (statAllocations.int) player.stats.int += statAllocations.int;
      if (statAllocations.vit) player.stats.vit += statAllocations.vit;
      if (statAllocations.luk) player.stats.luk += statAllocations.luk;

      // 스탯 포인트 차감
      player.level.statPoints -= totalPoints;

      // 파생 스탯 재계산
      this.recalculateStats(player);

      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`스탯 할당 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 아이템 추가
   */
  async addItem(playerId: string, itemId: string, quantity: number): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      // 기존 아이템이 있는지 확인
      const existingItem = player.inventory.find(item => item.itemId === itemId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        // 빈 슬롯 찾기
        const emptySlot = this.findEmptySlot(player.inventory, player.inventorySize);
        if (emptySlot === -1) {
          throw new Error('인벤토리가 가득 찼습니다');
        }

        player.inventory.push({
          itemId,
          quantity,
          slot: emptySlot
        });
      }

      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`아이템 추가 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 아이템 제거
   */
  async removeItem(playerId: string, itemId: string, quantity: number): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      const item = player.inventory.find(item => item.itemId === itemId);
      if (!item || item.quantity < quantity) {
        throw new Error('충분한 아이템이 없습니다');
      }

      item.quantity -= quantity;
      
      // 수량이 0이 되면 인벤토리에서 제거
      if (item.quantity <= 0) {
        const index = player.inventory.findIndex(i => i.itemId === itemId);
        if (index !== -1) {
          player.inventory.splice(index, 1);
        }
      }

      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`아이템 제거 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 골드 추가/제거
   */
  async updateGold(playerId: string, amount: number): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      if (player.gold + amount < 0) {
        throw new Error('골드가 부족합니다');
      }

      player.gold += amount;
      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`골드 업데이트 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 플레이어 위치 업데이트
   */
  async updateLocation(playerId: string, areaId: string, x: number, y: number): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      player.location.areaId = areaId;
      player.location.x = x;
      player.location.y = y;

      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`위치 업데이트 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 플레이어 온라인 상태 업데이트
   */
  async updateOnlineStatus(playerId: string, isOnline: boolean): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      player.info.isOnline = isOnline;
      player.info.lastLoginAt = new Date().toISOString();

      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`온라인 상태 업데이트 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 플레이 시간 업데이트
   */
  async updatePlaytime(playerId: string, minutes: number): Promise<boolean> {
    try {
      const player = await this.loadPlayer(playerId);
      if (!player) return false;

      player.playtime += minutes;
      await this.savePlayer(player);
      return true;
    } catch (error) {
      console.error(`플레이 시간 업데이트 실패: ${playerId}`, error);
      return false;
    }
  }

  // 캐시 관리 메서드들
  private setCacheWithTimeout(playerId: string, player: Player): void {
    this.cache.set(playerId, player);
    this.refreshCacheTimeout(playerId);
  }

  private refreshCacheTimeout(playerId: string): void {
    // 기존 타임아웃 제거
    const existingTimeout = this.cacheTimeout.get(playerId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 새 타임아웃 설정
    const timeout = setTimeout(() => {
      this.cache.delete(playerId);
      this.cacheTimeout.delete(playerId);
    }, this.CACHE_DURATION);

    this.cacheTimeout.set(playerId, timeout);
  }

  private removeFromCache(playerId: string): void {
    this.cache.delete(playerId);
    const timeout = this.cacheTimeout.get(playerId);
    if (timeout) {
      clearTimeout(timeout);
      this.cacheTimeout.delete(playerId);
    }
  }

  // 유틸리티 메서드들
  private validatePlayer(player: Player): boolean {
    return !!(
      player.info?.id &&
      player.info?.username &&
      player.info?.characterName &&
      player.level?.level >= 1 &&
      player.stats?.str >= 0 &&
      player.stats?.dex >= 0 &&
      player.stats?.int >= 0 &&
      player.stats?.vit >= 0 &&
      player.stats?.luk >= 0
    );
  }

  private recalculateStats(player: Player): void {
    const level = player.level.level;
    const stats = player.stats;

    // 파생 스탯 계산
    const calcHp = stats.vit * 10 + level * 5;
    const calcMp = stats.int * 10 + level * 3;
    stats.hp = calcHp;
    stats.maxHp = calcHp;
    stats.mp = calcMp;
    stats.maxMp = calcMp;
    stats.atk = stats.str * 2; // 장비 공격력은 별도 계산
    stats.def = stats.vit * 1.5; // 장비 방어력은 별도 계산
    stats.acc = stats.dex * 0.8 + level;
    stats.eva = stats.dex * 0.6 + stats.luk * 0.2;
    stats.crit = stats.dex * 0.3 + stats.luk * 0.7;
  }

  private findEmptySlot(inventory: InventoryItem[], maxSize: number): number {
    const usedSlots = new Set(inventory.map(item => item.slot));
    
    for (let i = 0; i < maxSize; i++) {
      if (!usedSlots.has(i)) {
        return i;
      }
    }
    
    return -1; // 빈 슬롯이 없음
  }
}

// 싱글톤 인스턴스
export const playerManager = new PlayerManager();