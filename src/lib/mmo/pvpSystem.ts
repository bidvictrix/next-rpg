import { Player, Stats } from '@/types/game';
import { logger } from '../logger';

// PvP 매치 타입
type PvPMatchType = 'duel' | 'arena_1v1' | 'arena_2v2' | 'arena_3v3' | 'battleground' | 'guild_war' | 'tournament';

// PvP 상태
type PvPStatus = 'waiting' | 'matched' | 'in_progress' | 'completed' | 'cancelled' | 'abandoned';

// PvP 매치 결과
type PvPResult = 'victory' | 'defeat' | 'draw' | 'forfeit';

// PvP 매치 인터페이스
interface PvPMatch {
  id: string;
  type: PvPMatchType;
  participants: PvPParticipant[];
  teams: PvPTeam[];
  status: PvPStatus;
  result?: PvPMatchResult;
  winner?: string; // 팀 ID 또는 플레이어 ID
  battleLog: PvPBattleEvent[];
  settings: PvPMatchSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  rewards: PvPReward[];
}

// PvP 참가자
interface PvPParticipant {
  playerId: string;
  playerName: string;
  level: number;
  class: string;
  teamId: string;
  rating: number;
  stats: Stats;
  equipment: any[]; // 장비 정보
  skills: any[]; // 사용 가능한 스킬
  buffs: PvPBuff[];
  debuffs: PvPDebuff[];
  currentHP: number;
  currentMP: number;
  isAlive: boolean;
  actions: PvPAction[];
}

// PvP 팀
interface PvPTeam {
  id: string;
  name: string;
  members: string[]; // 플레이어 ID 배열
  score: number;
  isWinner: boolean;
}

// PvP 매치 설정
interface PvPMatchSettings {
  timeLimit: number; // 초 단위
  maxRounds: number;
  allowItems: boolean;
  allowSkills: boolean;
  levelRestriction?: { min: number; max: number };
  classRestrictions?: string[];
  mapId: string;
  weatherCondition?: string;
  specialRules?: string[];
}

// PvP 전투 이벤트
interface PvPBattleEvent {
  id: string;
  timestamp: Date;
  round: number;
  type: 'action' | 'damage' | 'heal' | 'buff' | 'debuff' | 'death' | 'system';
  actorId: string;
  targetId?: string;
  actionType: string;
  value?: number;
  description: string;
  metadata?: any;
}

// PvP 액션
interface PvPAction {
  id: string;
  type: 'attack' | 'skill' | 'item' | 'move' | 'defend' | 'forfeit';
  targetId?: string;
  skillId?: string;
  itemId?: string;
  position?: { x: number; y: number };
  plannedAt: Date;
  executedAt?: Date;
  result?: any;
}

// PvP 버프/디버프
interface PvPBuff {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  effect: string;
  value: number;
  duration: number;
  source: string; // 스킬 또는 아이템 ID
  stackable: boolean;
  stacks: number;
}

interface PvPDebuff extends PvPBuff {
  type: 'debuff';
}

// PvP 보상
interface PvPReward {
  playerId: string;
  type: 'rating' | 'experience' | 'gold' | 'item' | 'title';
  value: number;
  itemId?: string;
  description: string;
}

// PvP 랭킹 시스템
interface PvPRanking {
  playerId: string;
  playerName: string;
  rating: number;
  rank: number;
  tier: PvPTier;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  seasonStats: SeasonStats;
}

// PvP 티어
interface PvPTier {
  id: string;
  name: string;
  minRating: number;
  maxRating: number;
  color: string;
  icon: string;
  rewards: any[];
}

// 시즌 통계
interface SeasonStats {
  seasonId: string;
  seasonName: string;
  startDate: Date;
  endDate: Date;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  peakRating: number;
  endRating: number;
  achievements: string[];
}

// PvP 대기열
interface PvPQueue {
  type: PvPMatchType;
  players: QueuedPlayer[];
  averageWaitTime: number;
  maxWaitTime: number;
}

// 대기열의 플레이어
interface QueuedPlayer {
  playerId: string;
  playerName: string;
  level: number;
  rating: number;
  queuedAt: Date;
  preferences: PvPPreferences;
}

// PvP 환경설정
interface PvPPreferences {
  allowCrossRealm: boolean;
  preferredMapTypes: string[];
  blockedPlayers: string[];
  autoAcceptDuels: boolean;
  showRealNames: boolean;
}

export class PvPSystem {
  private matches: Map<string, PvPMatch> = new Map();
  private rankings: Map<string, PvPRanking> = new Map();
  private queues: Map<PvPMatchType, PvPQueue> = new Map();
  private tiers: PvPTier[] = [];
  private currentSeason: SeasonStats | null = null;
  private matchmakingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeTiers();
    this.initializeQueues();
    this.startMatchmaking();
  }

  /**
   * PvP 티어 시스템 초기화
   */
  private initializeTiers(): void {
    this.tiers = [
      { id: 'bronze', name: '브론즈', minRating: 0, maxRating: 1199, color: '#CD7F32', icon: '🥉', rewards: [] },
      { id: 'silver', name: '실버', minRating: 1200, maxRating: 1499, color: '#C0C0C0', icon: '🥈', rewards: [] },
      { id: 'gold', name: '골드', minRating: 1500, maxRating: 1799, color: '#FFD700', icon: '🥇', rewards: [] },
      { id: 'platinum', name: '플래티넘', minRating: 1800, maxRating: 2099, color: '#E5E4E2', icon: '💎', rewards: [] },
      { id: 'diamond', name: '다이아몬드', minRating: 2100, maxRating: 2399, color: '#B9F2FF', icon: '💠', rewards: [] },
      { id: 'master', name: '마스터', minRating: 2400, maxRating: 2699, color: '#FF6347', icon: '👑', rewards: [] },
      { id: 'grandmaster', name: '그랜드마스터', minRating: 2700, maxRating: 2999, color: '#FF1493', icon: '⭐', rewards: [] },
      { id: 'legend', name: '레전드', minRating: 3000, maxRating: Infinity, color: '#8A2BE2', icon: '🌟', rewards: [] }
    ];
  }

  /**
   * PvP 대기열 초기화
   */
  private initializeQueues(): void {
    const queueTypes: PvPMatchType[] = ['duel', 'arena_1v1', 'arena_2v2', 'arena_3v3', 'battleground'];
    queueTypes.forEach(type => {
      this.queues.set(type, {
        type,
        players: [],
        averageWaitTime: 0,
        maxWaitTime: 300 // 5분
      });
    });
  }

  /**
   * PvP 대기열 참가
   */
  async joinQueue(
    playerId: string,
    matchType: PvPMatchType,
    preferences?: Partial<PvPPreferences>
  ): Promise<{ success: boolean; error?: string; estimatedWaitTime?: number }> {
    
    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 이미 대기열에 있는지 확인
    const isInQueue = Array.from(this.queues.values())
      .some(queue => queue.players.some(p => p.playerId === playerId));
    
    if (isInQueue) {
      return { success: false, error: '이미 대기열에 참가하고 있습니다.' };
    }

    // 진행 중인 매치가 있는지 확인
    const activeMatch = Array.from(this.matches.values())
      .find(match => 
        match.participants.some(p => p.playerId === playerId) && 
        (match.status === 'in_progress' || match.status === 'matched')
      );
    
    if (activeMatch) {
      return { success: false, error: '진행 중인 매치가 있습니다.' };
    }

    const queue = this.queues.get(matchType);
    if (!queue) {
      return { success: false, error: '존재하지 않는 매치 타입입니다.' };
    }

    const ranking = this.rankings.get(playerId) || this.createDefaultRanking(player);
    
    const queuedPlayer: QueuedPlayer = {
      playerId,
      playerName: player.name,
      level: player.level,
      rating: ranking.rating,
      queuedAt: new Date(),
      preferences: {
        allowCrossRealm: true,
        preferredMapTypes: [],
        blockedPlayers: [],
        autoAcceptDuels: false,
        showRealNames: true,
        ...preferences
      }
    };

    queue.players.push(queuedPlayer);
    queue.averageWaitTime = this.calculateAverageWaitTime(queue);

    logger.info(`PvP 대기열 참가: ${player.name} → ${matchType}`);

    return { 
      success: true, 
      estimatedWaitTime: queue.averageWaitTime 
    };
  }

  /**
   * PvP 대기열 탈퇴
   */
  async leaveQueue(playerId: string): Promise<{ success: boolean; error?: string }> {
    let found = false;
    
    this.queues.forEach(queue => {
      const index = queue.players.findIndex(p => p.playerId === playerId);
      if (index !== -1) {
        queue.players.splice(index, 1);
        found = true;
      }
    });

    if (!found) {
      return { success: false, error: '대기열에 참가하고 있지 않습니다.' };
    }

    logger.info(`PvP 대기열 탈퇴: ${playerId}`);
    return { success: true };
  }

  /**
   * 듀얼 신청
   */
  async requestDuel(
    challengerId: string,
    targetId: string,
    settings?: Partial<PvPMatchSettings>
  ): Promise<{ success: boolean; matchId?: string; error?: string }> {
    
    const challenger = await this.getPlayerInfo(challengerId);
    const target = await this.getPlayerInfo(targetId);

    if (!challenger || !target) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    if (challengerId === targetId) {
      return { success: false, error: '자신에게 듀얼을 신청할 수 없습니다.' };
    }

    // 대상이 온라인인지 확인 (실제로는 온라인 상태 체크)
    // if (!target.isOnline) {
    //   return { success: false, error: '대상 플레이어가 오프라인입니다.' };
    // }

    const matchId = await this.createMatch('duel', [challengerId, targetId], settings);
    
    logger.info(`듀얼 신청: ${challenger.name} → ${target.name}`);
    
    return { success: true, matchId };
  }

  /**
   * 매치 생성
   */
  private async createMatch(
    type: PvPMatchType,
    playerIds: string[],
    settings?: Partial<PvPMatchSettings>
  ): Promise<string> {
    
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultSettings: PvPMatchSettings = {
      timeLimit: 600, // 10분
      maxRounds: 1,
      allowItems: true,
      allowSkills: true,
      mapId: 'default_arena',
      specialRules: []
    };

    const participants: PvPParticipant[] = [];
    const teams: PvPTeam[] = [];

    // 참가자 정보 생성
    for (let i = 0; i < playerIds.length; i++) {
      const player = await this.getPlayerInfo(playerIds[i]);
      if (!player) continue;

      const teamId = type.includes('1v1') || type === 'duel' ? `team_${i}` : 
                    type.includes('2v2') ? `team_${Math.floor(i / 2)}` :
                    type.includes('3v3') ? `team_${Math.floor(i / 3)}` : `team_${i}`;

      const participant: PvPParticipant = {
        playerId: player.id,
        playerName: player.name,
        level: player.level,
        class: player.class || 'novice',
        teamId,
        rating: this.rankings.get(player.id)?.rating || 1200,
        stats: { ...player.stats },
        equipment: [], // 실제로는 player.equipment
        skills: [], // 실제로는 player.skills
        buffs: [],
        debuffs: [],
        currentHP: player.stats.hp,
        currentMP: player.stats.mp,
        isAlive: true,
        actions: []
      };

      participants.push(participant);

      // 팀 생성 또는 추가
      let team = teams.find(t => t.id === teamId);
      if (!team) {
        team = {
          id: teamId,
          name: `Team ${teams.length + 1}`,
          members: [],
          score: 0,
          isWinner: false
        };
        teams.push(team);
      }
      team.members.push(player.id);
    }

    const match: PvPMatch = {
      id: matchId,
      type,
      participants,
      teams,
      status: 'waiting',
      battleLog: [],
      settings: { ...defaultSettings, ...settings },
      createdAt: new Date(),
      rewards: []
    };

    this.matches.set(matchId, match);

    logger.info(`PvP 매치 생성: ${matchId} (${type})`);

    return matchId;
  }

  /**
   * 매치 시작
   */
  async startMatch(matchId: string): Promise<{ success: boolean; error?: string }> {
    const match = this.matches.get(matchId);
    if (!match) {
      return { success: false, error: '매치를 찾을 수 없습니다.' };
    }

    if (match.status !== 'waiting' && match.status !== 'matched') {
      return { success: false, error: '시작할 수 없는 매치 상태입니다.' };
    }

    match.status = 'in_progress';
    match.startedAt = new Date();

    // 시작 이벤트 추가
    this.addBattleEvent(match, {
      type: 'system',
      actorId: 'system',
      actionType: 'match_start',
      description: '매치가 시작되었습니다!'
    });

    logger.info(`PvP 매치 시작: ${matchId}`);

    return { success: true };
  }

  /**
   * 플레이어 액션 처리
   */
  async executeAction(
    matchId: string,
    playerId: string,
    action: Omit<PvPAction, 'id' | 'plannedAt'>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    
    const match = this.matches.get(matchId);
    if (!match) {
      return { success: false, error: '매치를 찾을 수 없습니다.' };
    }

    if (match.status !== 'in_progress') {
      return { success: false, error: '진행 중인 매치가 아닙니다.' };
    }

    const participant = match.participants.find(p => p.playerId === playerId);
    if (!participant) {
      return { success: false, error: '매치 참가자가 아닙니다.' };
    }

    if (!participant.isAlive) {
      return { success: false, error: '사망한 상태에서는 행동할 수 없습니다.' };
    }

    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAction: PvPAction = {
      id: actionId,
      plannedAt: new Date(),
      executedAt: new Date(),
      ...action
    };

    // 액션 타입별 처리
    let result: any = {};
    switch (action.type) {
      case 'attack':
        result = await this.processAttack(match, participant, action.targetId!);
        break;
      case 'skill':
        result = await this.processSkill(match, participant, action.skillId!, action.targetId);
        break;
      case 'item':
        result = await this.processItem(match, participant, action.itemId!);
        break;
      case 'defend':
        result = await this.processDefend(match, participant);
        break;
      case 'forfeit':
        result = await this.processForfeit(match, participant);
        break;
    }

    fullAction.result = result;
    participant.actions.push(fullAction);

    // 매치 종료 조건 확인
    await this.checkMatchEnd(match);

    return { success: true, result };
  }

  /**
   * 기본 공격 처리
   */
  private async processAttack(
    match: PvPMatch,
    attacker: PvPParticipant,
    targetId: string
  ): Promise<any> {
    
    const target = match.participants.find(p => p.playerId === targetId);
    if (!target) {
      return { error: '대상을 찾을 수 없습니다.' };
    }

    if (attacker.teamId === target.teamId) {
      return { error: '같은 팀을 공격할 수 없습니다.' };
    }

    // 데미지 계산
    const baseDamage = attacker.stats.str * 1.5;
    const defense = target.stats.def * 0.8;
    const finalDamage = Math.max(1, Math.floor(baseDamage - defense));

    // 크리티컬 확률 계산
    const critChance = (attacker.stats.dex + attacker.stats.luk) * 0.1;
    const isCritical = Math.random() * 100 < critChance;
    const damage = isCritical ? Math.floor(finalDamage * 1.5) : finalDamage;

    // 데미지 적용
    target.currentHP = Math.max(0, target.currentHP - damage);
    
    if (target.currentHP === 0) {
      target.isAlive = false;
    }

    // 전투 로그 추가
    this.addBattleEvent(match, {
      type: 'damage',
      actorId: attacker.playerId,
      targetId: target.playerId,
      actionType: 'basic_attack',
      value: damage,
      description: `${attacker.playerName}이(가) ${target.playerName}에게 ${damage} 데미지를 입혔습니다.${isCritical ? ' (치명타!)' : ''}`
    });

    if (!target.isAlive) {
      this.addBattleEvent(match, {
        type: 'death',
        actorId: target.playerId,
        actionType: 'death',
        description: `${target.playerName}이(가) 쓰러졌습니다.`
      });
    }

    return {
      damage,
      isCritical,
      targetHP: target.currentHP,
      targetAlive: target.isAlive
    };
  }

  /**
   * 매치 종료 조건 확인
   */
  private async checkMatchEnd(match: PvPMatch): Promise<void> {
    // 팀별 생존자 수 확인
    const teamSurvivors = new Map<string, number>();
    
    match.participants.forEach(participant => {
      if (participant.isAlive) {
        const current = teamSurvivors.get(participant.teamId) || 0;
        teamSurvivors.set(participant.teamId, current + 1);
      }
    });

    // 한 팀만 남은 경우 매치 종료
    const aliveTeams = Array.from(teamSurvivors.entries()).filter(([_, count]) => count > 0);
    
    if (aliveTeams.length <= 1) {
      const winningTeamId = aliveTeams.length === 1 ? aliveTeams[0][0] : null;
      await this.endMatch(match, winningTeamId);
    }
    
    // 시간 제한 확인
    if (match.startedAt) {
      const elapsed = Date.now() - match.startedAt.getTime();
      if (elapsed >= match.settings.timeLimit * 1000) {
        await this.endMatch(match, null); // 무승부
      }
    }
  }

  /**
   * 매치 종료
   */
  private async endMatch(match: PvPMatch, winningTeamId: string | null): Promise<void> {
    match.status = 'completed';
    match.endedAt = new Date();
    
    if (match.startedAt) {
      match.duration = match.endedAt.getTime() - match.startedAt.getTime();
    }

    if (winningTeamId) {
      const winningTeam = match.teams.find(t => t.id === winningTeamId);
      if (winningTeam) {
        winningTeam.isWinner = true;
        match.winner = winningTeamId;
        match.result = 'victory';
      }
    } else {
      match.result = 'draw';
    }

    // 보상 계산 및 지급
    await this.calculateRewards(match);
    
    // 랭킹 업데이트
    await this.updateRankings(match);

    this.addBattleEvent(match, {
      type: 'system',
      actorId: 'system',
      actionType: 'match_end',
      description: winningTeamId ? 
        `${match.teams.find(t => t.id === winningTeamId)?.name}이(가) 승리했습니다!` : 
        '무승부입니다!'
    });

    logger.info(`PvP 매치 종료: ${match.id} - ${match.result}`);
  }

  /**
   * 보상 계산
   */
  private async calculateRewards(match: PvPMatch): Promise<void> {
    const baseReward = {
      experience: 100,
      gold: 50,
      rating: 25
    };

    match.participants.forEach(participant => {
      const isWinner = match.teams.find(t => 
        t.id === participant.teamId && t.isWinner
      );

      const multiplier = isWinner ? 1.5 : 0.5;
      
      match.rewards.push(
        {
          playerId: participant.playerId,
          type: 'experience',
          value: Math.floor(baseReward.experience * multiplier),
          description: `경험치 획득`
        },
        {
          playerId: participant.playerId,
          type: 'gold',
          value: Math.floor(baseReward.gold * multiplier),
          description: `골드 획득`
        },
        {
          playerId: participant.playerId,
          type: 'rating',
          value: Math.floor(baseReward.rating * (isWinner ? 1 : -1)),
          description: `레이팅 ${isWinner ? '상승' : '하락'}`
        }
      );
    });
  }

  /**
   * 랭킹 업데이트
   */
  private async updateRankings(match: PvPMatch): Promise<void> {
    match.participants.forEach(participant => {
      let ranking = this.rankings.get(participant.playerId);
      if (!ranking) {
        const player = { 
          id: participant.playerId, 
          name: participant.playerName,
          level: participant.level
        };
        ranking = this.createDefaultRanking(player);
      }

      const isWinner = match.teams.find(t => 
        t.id === participant.teamId && t.isWinner
      );

      // 승패 기록 업데이트
      if (isWinner) {
        ranking.wins++;
        ranking.currentStreak++;
        ranking.bestStreak = Math.max(ranking.bestStreak, ranking.currentStreak);
      } else if (match.result === 'draw') {
        ranking.draws++;
        ranking.currentStreak = 0;
      } else {
        ranking.losses++;
        ranking.currentStreak = 0;
      }

      // 승률 계산
      const totalMatches = ranking.wins + ranking.losses + ranking.draws;
      ranking.winRate = totalMatches > 0 ? (ranking.wins / totalMatches) * 100 : 0;

      // 레이팅 업데이트
      const ratingReward = match.rewards.find(r => 
        r.playerId === participant.playerId && r.type === 'rating'
      );
      if (ratingReward) {
        ranking.rating = Math.max(0, ranking.rating + ratingReward.value);
      }

      // 티어 업데이트
      ranking.tier = this.getTierByRating(ranking.rating);

      this.rankings.set(participant.playerId, ranking);
    });
  }

  /**
   * 매치메이킹 시작
   */
  private startMatchmaking(): void {
    this.matchmakingInterval = setInterval(() => {
      this.processMatchmaking();
    }, 10000); // 10초마다 매치메이킹
  }

  /**
   * 매치메이킹 처리
   */
  private processMatchmaking(): void {
    this.queues.forEach(async (queue, type) => {
      if (queue.players.length < this.getRequiredPlayersForMatch(type)) {
        return;
      }

      // 레이팅 기반 매칭: 오름차순 정렬
      const sortedPlayers = queue.players.sort((a, b) => a.rating - b.rating);
      const playersPerMatch = this.getRequiredPlayersForMatch(type);
      
      if (sortedPlayers.length >= playersPerMatch) {
        const matchPlayers = sortedPlayers.slice(0, playersPerMatch);
        const playerIds = matchPlayers.map(p => p.playerId);
        
        // 대기열에서 제거
        matchPlayers.forEach(player => {
          const index = queue.players.findIndex(p => p.playerId === player.playerId);
          if (index !== -1) {
            queue.players.splice(index, 1);
          }
        });

        // 매치 생성
        await this.createMatch(type, playerIds);
        
        logger.info(`매치메이킹 완료: ${type} - ${playerIds.length}명`);
      }
    });
  }

  // 헬퍼 함수들
  private addBattleEvent(
    match: PvPMatch, 
    event: Omit<PvPBattleEvent, 'id' | 'timestamp' | 'round'>
  ): void {
    const battleEvent: PvPBattleEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      round: 1, // 현재는 단순화
      ...event
    };
    
    match.battleLog.push(battleEvent);
  }

  private createDefaultRanking(player: any): PvPRanking {
    return {
      playerId: player.id,
      playerName: player.name,
      rating: 1200,
      rank: 0,
      tier: this.getTierByRating(1200),
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      seasonStats: {
        seasonId: 'season_1',
        seasonName: 'Season 1',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후
        matches: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        peakRating: 1200,
        endRating: 1200,
        achievements: []
      }
    };
  }

  private getTierByRating(rating: number): PvPTier {
    return this.tiers.find(tier => rating >= tier.minRating && rating <= tier.maxRating) || this.tiers[0];
  }

  private getRequiredPlayersForMatch(type: PvPMatchType): number {
    switch (type) {
      case 'duel':
      case 'arena_1v1':
        return 2;
      case 'arena_2v2':
        return 4;
      case 'arena_3v3':
        return 6;
      case 'battleground':
        return 10;
      default:
        return 2;
    }
  }

  private calculateAverageWaitTime(queue: PvPQueue): number {
    if (queue.players.length === 0) return 0;
    
    const now = Date.now();
    const totalWaitTime = queue.players.reduce((sum, player) => {
      return sum + (now - player.queuedAt.getTime());
    }, 0);
    
    return Math.floor(totalWaitTime / queue.players.length / 1000); // 초 단위
  }

  private async processSkill(match: PvPMatch, caster: PvPParticipant, skillId: string, targetId?: string): Promise<any> {
    // 스킬 시스템과 연동하여 구현
    return { message: '스킬 사용 (구현 예정)' };
  }

  private async processItem(match: PvPMatch, user: PvPParticipant, itemId: string): Promise<any> {
    // 아이템 시스템과 연동하여 구현
    return { message: '아이템 사용 (구현 예정)' };
  }

  private async processDefend(match: PvPMatch, defender: PvPParticipant): Promise<any> {
    // 방어 처리
    return { message: '방어 자세' };
  }

  private async processForfeit(match: PvPMatch, player: PvPParticipant): Promise<any> {
    // 기권 처리
    player.isAlive = false;
    return { message: '기권' };
  }

  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현시 플레이어 데이터 소스에서 가져와야 함
    return null;
  }

  /**
   * PvP 랭킹 조회
   */
  getTopRankings(limit: number = 100): PvPRanking[] {
    return Array.from(this.rankings.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }));
  }

  /**
   * 플레이어의 PvP 통계 조회
   */
  getPlayerStats(playerId: string): PvPRanking | null {
    return this.rankings.get(playerId) || null;
  }

  /**
   * 매치 기록 조회
   */
  getPlayerMatches(playerId: string, limit: number = 10): PvPMatch[] {
    return Array.from(this.matches.values())
      .filter(match => match.participants.some(p => p.playerId === playerId))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * PvP 시스템 통계
   */
  getSystemStats(): {
    totalMatches: number;
    activeMatches: number;
    totalPlayers: number;
    playersInQueue: number;
    averageRating: number;
    topTier: string;
  } {
    const totalMatches = this.matches.size;
    const activeMatches = Array.from(this.matches.values())
      .filter(match => match.status === 'in_progress').length;
    
    const totalPlayers = this.rankings.size;
    const playersInQueue = Array.from(this.queues.values())
      .reduce((sum, queue) => sum + queue.players.length, 0);
    
    const ratings = Array.from(this.rankings.values()).map(r => r.rating);
    const averageRating = ratings.length > 0 ? 
      Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) : 0;
    
    const topPlayer = Array.from(this.rankings.values())
      .sort((a, b) => b.rating - a.rating)[0];
    const topTier = topPlayer ? topPlayer.tier.name : '없음';

    return {
      totalMatches,
      activeMatches,
      totalPlayers,
      playersInQueue,
      averageRating,
      topTier
    };
  }
}

// 전역 PvP 시스템 인스턴스
export const pvpSystem = new PvPSystem();

// PvP 관련 유틸리티
export const pvpUtils = {
  /**
   * 매치 타입 표시명 반환
   */
  getMatchTypeDisplayName(type: PvPMatchType): string {
    const names = {
      duel: '듀얼',
      arena_1v1: '1대1 아레나',
      arena_2v2: '2대2 아레나',
      arena_3v3: '3대3 아레나',
      battleground: '전장',
      guild_war: '길드 전쟁',
      tournament: '토너먼트'
    };
    return names[type] || type;
  },

  /**
   * 승률 색상 반환
   */
  getWinRateColor(winRate: number): string {
    if (winRate >= 70) return '#00ff00';
    if (winRate >= 50) return '#ffff00';
    if (winRate >= 30) return '#ff8800';
    return '#ff0000';
  },

  /**
   * 티어 색상 반환
   */
  getTierColor(tier: PvPTier): string {
    return tier.color;
  },

  /**
   * 레이팅 변화량 표시
   */
  formatRatingChange(change: number): string {
    return change >= 0 ? `+${change}` : `${change}`;
  }
};
