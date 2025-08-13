import { Player } from '../types/player';
import { Monster } from '../types/game';
import { Skill } from '../types/skill';
import { Item, Quest } from '../types/game';
import { playerManager } from './playerManager';
import { gameDataManager } from './gameDataManager';

export interface GameState {
  activePlayers: Map<string, Player>;
  activeMonsters: Map<string, MonsterInstance>;
  activeBattles: Map<string, BattleInstance>;
  worldEvents: WorldEvent[];
  serverTime: number;
  gameSpeed: number;
}

export interface MonsterInstance {
  id: string;
  monsterId: string;
  monster: Monster;
  currentHp: number;
  currentMp: number;
  position: { x: number; y: number; };
  areaId: string;
  spawnTime: number;
  lastAction: number;
  target?: string; // 타겟 플레이어 ID
  status: 'idle' | 'hunting' | 'fighting' | 'dead';
}

export interface BattleInstance {
  id: string;
  participants: Array<{
    id: string;
    type: 'player' | 'monster';
    currentHp: number;
    currentMp: number;
    position: number; // 배틀 내 위치
  }>;
  areaId: string;
  startTime: number;
  currentTurn: number;
  turnOrder: string[];
  status: 'active' | 'ended';
  winner?: string;
}

export interface WorldEvent {
  id: string;
  type: 'monster_spawn' | 'item_spawn' | 'weather_change' | 'boss_spawn';
  areaId?: string;
  data: any;
  triggerTime: number;
  processed: boolean;
}

export class GameEngine {
  private gameState: GameState;
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly TICK_RATE = 1000; // 1초마다 틱
  private readonly MAX_PLAYERS_PER_AREA = 50;
  private readonly MAX_MONSTERS_PER_AREA = 20;

  constructor() {
    this.gameState = {
      activePlayers: new Map(),
      activeMonsters: new Map(),
      activeBattles: new Map(),
      worldEvents: [],
      serverTime: Date.now(),
      gameSpeed: 1.0
    };
  }

  /**
   * 게임 엔진 시작
   */
  start(): void {
    if (this.tickInterval) {
      console.warn('게임 엔진이 이미 실행 중입니다');
      return;
    }

    console.log('게임 엔진 시작');
    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.TICK_RATE);
  }

  /**
   * 게임 엔진 정지
   */
  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      console.log('게임 엔진 정지');
    }
  }

  /**
   * 메인 게임 루프
   */
  private tick(): void {
    const currentTime = Date.now();
    this.gameState.serverTime = currentTime;

    try {
      // 1. 월드 이벤트 처리
      this.processWorldEvents(currentTime);

      // 2. 몬스터 AI 업데이트
      this.updateMonsterAI(currentTime);

      // 3. 전투 시스템 업데이트
      this.updateBattles(currentTime);

      // 4. 플레이어 상태 업데이트
      this.updatePlayerStates(currentTime);

      // 5. 몬스터 스폰 관리
      this.manageMonsterSpawns(currentTime);

      // 6. 정리 작업
      this.cleanup(currentTime);

    } catch (error) {
      console.error('게임 틱 처리 중 오류:', error);
    }
  }

  /**
   * 플레이어 입장
   */
  async playerJoin(playerId: string): Promise<boolean> {
    try {
      const player = await playerManager.loadPlayer(playerId);
      if (!player) {
        console.error(`플레이어를 찾을 수 없음: ${playerId}`);
        return false;
      }

      // 지역별 최대 플레이어 수 확인
      const playersInArea = Array.from(this.gameState.activePlayers.values())
        .filter(p => p.location.areaId === player.location.areaId);

      if (playersInArea.length >= this.MAX_PLAYERS_PER_AREA) {
        console.error(`지역 ${player.location.areaId}의 플레이어 수가 한계에 도달`);
        return false;
      }

      // 온라인 상태 업데이트
      await playerManager.updateOnlineStatus(playerId, true);
      
      this.gameState.activePlayers.set(playerId, player);
      console.log(`플레이어 ${player.info.characterName} 입장`);
      
      return true;
    } catch (error) {
      console.error(`플레이어 입장 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 플레이어 퇴장
   */
  async playerLeave(playerId: string): Promise<boolean> {
    try {
      const player = this.gameState.activePlayers.get(playerId);
      if (!player) return false;

      // 전투 중이면 전투 종료
      for (const [battleId, battle] of this.gameState.activeBattles) {
        if (battle.participants.some(p => p.id === playerId)) {
          this.endBattle(battleId, 'player_left');
        }
      }

      // 오프라인 상태 업데이트
      await playerManager.updateOnlineStatus(playerId, false);
      
      this.gameState.activePlayers.delete(playerId);
      console.log(`플레이어 ${player.info.characterName} 퇴장`);
      
      return true;
    } catch (error) {
      console.error(`플레이어 퇴장 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 플레이어 이동
   */
  async playerMove(playerId: string, areaId: string, x: number, y: number): Promise<boolean> {
    try {
      const player = this.gameState.activePlayers.get(playerId);
      if (!player) return false;

      // 지역 존재 확인
      const area = await gameDataManager.getArea(areaId);
      if (!area) {
        console.error(`존재하지 않는 지역: ${areaId}`);
        return false;
      }

      // 이동 가능 여부 확인 (전투 중이 아님)
      const isInBattle = Array.from(this.gameState.activeBattles.values())
        .some(battle => battle.participants.some(p => p.id === playerId));

      if (isInBattle) {
        console.error(`전투 중에는 이동할 수 없습니다: ${playerId}`);
        return false;
      }

      // 위치 업데이트
      player.location.areaId = areaId;
      player.location.x = x;
      player.location.y = y;

      await playerManager.updateLocation(playerId, areaId, x, y);
      return true;
    } catch (error) {
      console.error(`플레이어 이동 실패: ${playerId}`, error);
      return false;
    }
  }

  /**
   * 몬스터 스폰
   */
  async spawnMonster(monsterId: string, areaId: string, x: number, y: number): Promise<string | null> {
    try {
      const monster = await gameDataManager.getMonster(monsterId);
      if (!monster) {
        console.error(`존재하지 않는 몬스터: ${monsterId}`);
        return null;
      }

      const area = await gameDataManager.getArea(areaId);
      if (!area) {
        console.error(`존재하지 않는 지역: ${areaId}`);
        return null;
      }

      // 지역별 최대 몬스터 수 확인
      const monstersInArea = Array.from(this.gameState.activeMonsters.values())
        .filter(m => m.areaId === areaId);

      if (monstersInArea.length >= this.MAX_MONSTERS_PER_AREA) {
        return null;
      }

      const instanceId = `${monsterId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const monsterInstance: MonsterInstance = {
        id: instanceId,
        monsterId,
        monster,
        currentHp: monster.stats.hp || monster.stats.vit * 10,
        currentMp: monster.stats.mp || monster.stats.int * 10,
        position: { x, y },
        areaId,
        spawnTime: Date.now(),
        lastAction: Date.now(),
        status: 'idle'
      };

      this.gameState.activeMonsters.set(instanceId, monsterInstance);
      console.log(`몬스터 ${monster.name} 스폰: ${areaId} (${x}, ${y})`);
      
      return instanceId;
    } catch (error) {
      console.error('몬스터 스폰 실패', error);
      return null;
    }
  }

  /**
   * 전투 시작
   */
  async startBattle(playerId: string, monsterInstanceId: string): Promise<string | null> {
    try {
      const player = this.gameState.activePlayers.get(playerId);
      const monsterInstance = this.gameState.activeMonsters.get(monsterInstanceId);

      if (!player || !monsterInstance) {
        console.error('전투 시작 실패: 플레이어 또는 몬스터를 찾을 수 없음');
        return null;
      }

      // 이미 전투 중인지 확인
      const existingBattle = Array.from(this.gameState.activeBattles.values())
        .find(battle => 
          battle.participants.some(p => p.id === playerId || p.id === monsterInstanceId)
        );

      if (existingBattle) {
        console.error('이미 전투 중입니다');
        return null;
      }

      const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const battle: BattleInstance = {
        id: battleId,
        participants: [
          {
            id: playerId,
            type: 'player',
            currentHp: player.stats.hp || 100,
            currentMp: player.stats.mp || 50,
            position: 0
          },
          {
            id: monsterInstanceId,
            type: 'monster',
            currentHp: monsterInstance.currentHp,
            currentMp: monsterInstance.currentMp,
            position: 1
          }
        ],
        areaId: player.location.areaId,
        startTime: Date.now(),
        currentTurn: 0,
        turnOrder: [playerId, monsterInstanceId],
        status: 'active'
      };

      this.gameState.activeBattles.set(battleId, battle);
      monsterInstance.status = 'fighting';
      
      console.log(`전투 시작: ${player.info.characterName} vs ${monsterInstance.monster.name}`);
      return battleId;
    } catch (error) {
      console.error('전투 시작 실패', error);
      return null;
    }
  }

  /**
   * 전투 종료
   */
  private endBattle(battleId: string, reason: string): void {
    const battle = this.gameState.activeBattles.get(battleId);
    if (!battle) return;

    battle.status = 'ended';
    
    // 몬스터 상태 업데이트
    const monsterParticipant = battle.participants.find(p => p.type === 'monster');
    if (monsterParticipant) {
      const monsterInstance = this.gameState.activeMonsters.get(monsterParticipant.id);
      if (monsterInstance) {
        if (monsterParticipant.currentHp <= 0) {
          monsterInstance.status = 'dead';
        } else {
          monsterInstance.status = 'idle';
        }
      }
    }

    console.log(`전투 종료: ${battleId} (${reason})`);
    
    // 전투 인스턴스 제거
    setTimeout(() => {
      this.gameState.activeBattles.delete(battleId);
    }, 5000); // 5초 후 제거
  }

  /**
   * 월드 이벤트 추가
   */
  scheduleWorldEvent(event: Omit<WorldEvent, 'id' | 'processed'>): string {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const worldEvent: WorldEvent = {
      id: eventId,
      ...event,
      processed: false
    };

    this.gameState.worldEvents.push(worldEvent);
    return eventId;
  }

  /**
   * 게임 상태 조회
   */
  getGameState(): Readonly<GameState> {
    return this.gameState;
  }

  /**
   * 지역별 플레이어 목록
   */
  getPlayersInArea(areaId: string): Player[] {
    return Array.from(this.gameState.activePlayers.values())
      .filter(player => player.location.areaId === areaId);
  }

  /**
   * 지역별 몬스터 목록
   */
  getMonstersInArea(areaId: string): MonsterInstance[] {
    return Array.from(this.gameState.activeMonsters.values())
      .filter(monster => monster.areaId === areaId);
  }

  // 내부 업데이트 메서드들
  private processWorldEvents(currentTime: number): void {
    for (const event of this.gameState.worldEvents) {
      if (!event.processed && currentTime >= event.triggerTime) {
        try {
          this.handleWorldEvent(event);
          event.processed = true;
        } catch (error) {
          console.error(`월드 이벤트 처리 실패: ${event.id}`, error);
        }
      }
    }

    // 처리된 이벤트 정리 (1시간 후)
    this.gameState.worldEvents = this.gameState.worldEvents
      .filter(event => !event.processed || currentTime - event.triggerTime < 3600000);
  }

  private handleWorldEvent(event: WorldEvent): void {
    switch (event.type) {
      case 'monster_spawn':
        if (event.areaId && event.data.monsterId) {
          this.spawnMonster(
            event.data.monsterId,
            event.areaId,
            event.data.x || 0,
            event.data.y || 0
          );
        }
        break;
      
      case 'boss_spawn':
        console.log(`보스 몬스터 스폰 이벤트: ${event.data.bossId}`);
        break;
      
      default:
        console.log(`알 수 없는 월드 이벤트: ${event.type}`);
    }
  }

  private updateMonsterAI(currentTime: number): void {
    for (const [instanceId, monster] of this.gameState.activeMonsters) {
      if (monster.status === 'dead') {
        continue;
      }

      // AI 업데이트 주기 확인 (1초마다)
      if (currentTime - monster.lastAction < 1000) {
        continue;
      }

      try {
        this.processMonsterAI(monster, currentTime);
        monster.lastAction = currentTime;
      } catch (error) {
        console.error(`몬스터 AI 처리 실패: ${instanceId}`, error);
      }
    }
  }

  private processMonsterAI(monster: MonsterInstance, currentTime: number): void {
    if (monster.status === 'fighting') {
      return; // 전투 중이면 전투 시스템에서 처리
    }

    // 근처 플레이어 탐지
    const nearbyPlayers = this.getPlayersInArea(monster.areaId)
      .filter(player => {
        const distance = Math.sqrt(
          Math.pow(player.location.x - monster.position.x, 2) +
          Math.pow(player.location.y - monster.position.y, 2)
        );
        return distance <= monster.monster.ai.detectionRange;
      });

    if (nearbyPlayers.length > 0 && monster.monster.ai.type === 'aggressive') {
      // 가장 가까운 플레이어를 타겟으로 설정
      const closestPlayer = nearbyPlayers[0];
      monster.target = closestPlayer.info.id;
      monster.status = 'hunting';
    }
  }

  private updateBattles(currentTime: number): void {
    for (const [battleId, battle] of this.gameState.activeBattles) {
      if (battle.status !== 'active') continue;

      try {
        // 전투 시간 제한 (30분)
        if (currentTime - battle.startTime > 1800000) {
          this.endBattle(battleId, 'timeout');
          continue;
        }

        // 참가자 중 HP가 0인지 확인
        const deadParticipants = battle.participants.filter(p => p.currentHp <= 0);
        if (deadParticipants.length > 0) {
          const winner = battle.participants.find(p => p.currentHp > 0);
          battle.winner = winner?.id;
          this.endBattle(battleId, 'victory');
        }
      } catch (error) {
        console.error(`전투 업데이트 실패: ${battleId}`, error);
      }
    }
  }

  private updatePlayerStates(currentTime: number): void {
    for (const [playerId, player] of this.gameState.activePlayers) {
      try {
        // 플레이 시간 업데이트 (매분)
        const lastUpdate = player.info.lastLoginAt;
        const minutesPassed = Math.floor((currentTime - new Date(lastUpdate).getTime()) / 60000);
        
        if (minutesPassed > 0) {
          playerManager.updatePlaytime(playerId, minutesPassed);
        }
      } catch (error) {
        console.error(`플레이어 상태 업데이트 실패: ${playerId}`, error);
      }
    }
  }

  private async manageMonsterSpawns(currentTime: number): Promise<void> {
    try {
      // 30초마다 몬스터 스폰 확인
      if (currentTime % 30000 < this.TICK_RATE) {
        const areas = await gameDataManager.loadAllAreas();
        
        for (const [areaId, area] of areas) {
          for (const spawnInfo of area.monsterSpawns) {
            const existingMonsters = this.getMonstersInArea(areaId)
              .filter(m => m.monsterId === spawnInfo.monsterId);
            
            if (existingMonsters.length < spawnInfo.maxCount) {
              // 스폰 확률 확인
              if (Math.random() * 100 < 20) { // 20% 확률로 스폰
                const spawnPoint = spawnInfo.spawnPoints[
                  Math.floor(Math.random() * spawnInfo.spawnPoints.length)
                ];
                
                await this.spawnMonster(
                  spawnInfo.monsterId,
                  areaId,
                  spawnPoint.x,
                  spawnPoint.y
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('몬스터 스폰 관리 실패', error);
    }
  }

  private cleanup(currentTime: number): void {
    // 죽은 몬스터 제거 (5분 후)
    for (const [instanceId, monster] of this.gameState.activeMonsters) {
      if (monster.status === 'dead' && 
          currentTime - monster.lastAction > 300000) {
        this.gameState.activeMonsters.delete(instanceId);
      }
    }

    // 종료된 전투 제거
    for (const [battleId, battle] of this.gameState.activeBattles) {
      if (battle.status === 'ended' && 
          currentTime - battle.startTime > 300000) {
        this.gameState.activeBattles.delete(battleId);
      }
    }
  }
}

// 싱글톤 인스턴스
export const gameEngine = new GameEngine();