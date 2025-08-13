import { Player } from '@/types/game';
import { logger } from '../logger';

// 길드 멤버 인터페이스
interface GuildMember {
  playerId: string;
  playerName: string;
  level: number;
  class: string;
  rank: GuildRank;
  joinedAt: Date;
  lastActiveAt: Date;
  isOnline: boolean;
  contribution: GuildContribution;
  permissions: GuildPermission[];
}

// 길드 계급
interface GuildRank {
  id: string;
  name: string;
  level: number; // 낮을수록 높은 계급
  permissions: GuildPermission[];
  canPromote: boolean;
  canDemote: boolean;
  maxMembers?: number; // 해당 계급의 최대 인원
}

// 길드 권한
type GuildPermission = 
  | 'invite_members'
  | 'kick_members'
  | 'promote_members'
  | 'demote_members'
  | 'manage_ranks'
  | 'manage_settings'
  | 'use_guild_warehouse'
  | 'manage_warehouse'
  | 'declare_war'
  | 'manage_alliances'
  | 'chat_officer'
  | 'view_logs';

// 길드 기여도
interface GuildContribution {
  totalContribution: number;
  weeklyContribution: number;
  monthlyContribution: number;
  donatedGold: number;
  donatedItems: number;
  questsCompleted: number;
  pvpWins: number;
  pvpLosses: number;
  raidParticipation: number;
}

// 길드 설정
interface GuildSettings {
  name: string;
  description: string;
  motd: string; // Message of the Day
  emblem: string;
  isPublic: boolean;
  autoAccept: boolean;
  levelRequirement: number;
  contributionRequirement: number;
  allowedClasses: string[];
  maxMembers: number;
  taxRate: number; // 길드세 (0-100%)
  language: string;
  timezone: string;
}

// 길드 인터페이스
interface Guild {
  id: string;
  settings: GuildSettings;
  members: GuildMember[];
  ranks: GuildRank[];
  statistics: GuildStatistics;
  treasury: GuildTreasury;
  activities: GuildActivity[];
  wars: GuildWar[];
  alliances: GuildAlliance[];
  createdAt: Date;
  updatedAt: Date;
  level: number;
  experience: number;
  requiredExperience: number;
}

// 길드 통계
interface GuildStatistics {
  totalPlayTime: number;
  monstersKilled: number;
  questsCompleted: number;
  pvpWins: number;
  pvpLosses: number;
  raidsCompleted: number;
  totalContribution: number;
  goldEarned: number;
  membersJoined: number;
  membersLeft: number;
}

// 길드 창고
interface GuildTreasury {
  gold: number;
  items: GuildItem[];
  logs: TreasuryLog[];
}

// 길드 아이템
interface GuildItem {
  itemId: string;
  itemName: string;
  quantity: number;
  donatedBy: string;
  donatedAt: Date;
  accessLevel: number; // 최소 요구 계급 레벨
}

// 창고 로그
interface TreasuryLog {
  id: string;
  playerId: string;
  playerName: string;
  action: 'deposit' | 'withdraw';
  type: 'gold' | 'item';
  amount: number;
  itemId?: string;
  itemName?: string;
  timestamp: Date;
}

// 길드 활동
interface GuildActivity {
  id: string;
  type: 'raid' | 'event' | 'war' | 'alliance' | 'promotion' | 'general';
  title: string;
  description: string;
  scheduledAt?: Date;
  participants: string[];
  rewards?: Array<{ id: string; amount?: number; type?: string }>;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
}

// 길드 전쟁
interface GuildWar {
  id: string;
  targetGuildId: string;
  targetGuildName: string;
  declaredBy: string;
  declaredAt: Date;
  startTime: Date;
  endTime: Date;
  status: 'declared' | 'accepted' | 'active' | 'ended' | 'declined';
  score: {
    ourGuild: number;
    enemyGuild: number;
  };
  participants: {
    ourGuild: string[];
    enemyGuild: string[];
  };
  rewards?: Array<{ id: string; amount?: number; type?: string }>;
}

// 길드 동맹
interface GuildAlliance {
  id: string;
  guildId: string;
  guildName: string;
  type: 'alliance' | 'neutral' | 'enemy';
  establishedAt: Date;
  establishedBy: string;
  expiresAt?: Date;
  terms?: string;
}

// 길드 신청서
interface GuildApplication {
  id: string;
  guildId: string;
  playerId: string;
  playerName: string;
  playerLevel: number;
  message?: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}

export class GuildSystem {
  private guilds: Map<string, Guild> = new Map();
  private playerGuilds: Map<string, string> = new Map(); // playerId -> guildId
  private applications: Map<string, GuildApplication> = new Map();
  private guildNames: Set<string> = new Set(); // 중복 방지
  private maxGuildSize: number = 100;

  constructor() {
    this.initializeDefaultRanks();
  }

  /**
   * 기본 길드 계급 시스템 초기화
   */
  private initializeDefaultRanks(): GuildRank[] {
    return [
      {
        id: 'guild_master',
        name: '길드마스터',
        level: 0,
        permissions: ['invite_members', 'kick_members', 'promote_members', 'demote_members', 
                     'manage_ranks', 'manage_settings', 'manage_warehouse', 'declare_war', 
                     'manage_alliances', 'chat_officer', 'view_logs'],
        canPromote: true,
        canDemote: true,
        maxMembers: 1
      },
      {
        id: 'vice_master',
        name: '부길드마스터',
        level: 1,
        permissions: ['invite_members', 'kick_members', 'promote_members', 'demote_members',
                     'manage_warehouse', 'declare_war', 'chat_officer', 'view_logs'],
        canPromote: true,
        canDemote: true,
        maxMembers: 2
      },
      {
        id: 'officer',
        name: '간부',
        level: 2,
        permissions: ['invite_members', 'kick_members', 'use_guild_warehouse', 'chat_officer'],
        canPromote: false,
        canDemote: false,
        maxMembers: 10
      },
      {
        id: 'veteran',
        name: '고참',
        level: 3,
        permissions: ['use_guild_warehouse'],
        canPromote: false,
        canDemote: false
      },
      {
        id: 'member',
        name: '멤버',
        level: 4,
        permissions: [],
        canPromote: false,
        canDemote: false
      }
    ];
  }

  /**
   * 길드 생성
   */
  async createGuild(
    founderId: string,
    guildName: string,
    settings: Partial<GuildSettings>
  ): Promise<{ success: boolean; guildId?: string; error?: string }> {
    
    // 이미 길드에 속해 있는지 확인
    if (this.playerGuilds.has(founderId)) {
      return { success: false, error: '이미 길드에 속해 있습니다.' };
    }

    // 길드명 중복 확인
    if (this.guildNames.has(guildName.toLowerCase())) {
      return { success: false, error: '이미 존재하는 길드명입니다.' };
    }

    // 길드명 유효성 검사
    if (guildName.length < 2 || guildName.length > 20) {
      return { success: false, error: '길드명은 2-20자 사이여야 합니다.' };
    }

    const founder = await this.getPlayerInfo(founderId);
    if (!founder) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 길드 생성 비용 확인 (실제로는 골드나 아이템 필요)
    const creationCost = 100000; // 10만 골드
    // if (founder.gold < creationCost) {
    //   return { success: false, error: '길드 생성 비용이 부족합니다.' };
    // }

    const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultSettings: GuildSettings = {
      name: guildName,
      description: '',
      motd: `${guildName}에 오신 것을 환영합니다!`,
      emblem: '⚔️',
      isPublic: true,
      autoAccept: false,
      levelRequirement: 1,
      contributionRequirement: 0,
      allowedClasses: [],
      maxMembers: this.maxGuildSize,
      taxRate: 0,
      language: 'ko',
      timezone: 'Asia/Seoul'
    };

    const founderMember: GuildMember = {
      playerId: founderId,
      playerName: founder.name,
      level: founder.level,
      class: founder.class || 'novice',
      rank: this.initializeDefaultRanks()[0], // 길드마스터
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      isOnline: true,
      contribution: this.createEmptyContribution(),
      permissions: this.initializeDefaultRanks()[0].permissions
    };

    const guild: Guild = {
      id: guildId,
      settings: { ...defaultSettings, ...settings },
      members: [founderMember],
      ranks: this.initializeDefaultRanks(),
      statistics: this.createEmptyStatistics(),
      treasury: {
        gold: 0,
        items: [],
        logs: []
      },
      activities: [],
      wars: [],
      alliances: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      level: 1,
      experience: 0,
      requiredExperience: 1000
    };

    this.guilds.set(guildId, guild);
    this.playerGuilds.set(founderId, guildId);
    this.guildNames.add(guildName.toLowerCase());

    logger.info(`길드 생성: ${guildName} (${guildId}) by ${founder.name}`);

    return { success: true, guildId };
  }

  /**
   * 길드 가입 신청
   */
  async applyToGuild(
    guildId: string,
    playerId: string,
    message?: string
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    if (this.playerGuilds.has(playerId)) {
      return { success: false, error: '이미 다른 길드에 속해 있습니다.' };
    }

    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 길드 가입 조건 확인
    if (player.level < guild.settings.levelRequirement) {
      return { success: false, error: `레벨 ${guild.settings.levelRequirement} 이상만 가입할 수 있습니다.` };
    }

    if (guild.settings.allowedClasses.length > 0 && 
        !guild.settings.allowedClasses.includes(player.class || '')) {
      return { success: false, error: '허용되지 않는 클래스입니다.' };
    }

    if (guild.members.length >= guild.settings.maxMembers) {
      return { success: false, error: '길드가 가득 찼습니다.' };
    }

    // 기존 신청서 확인
    const existingApplication = Array.from(this.applications.values())
      .find(app => app.guildId === guildId && app.playerId === playerId && app.status === 'pending');
    
    if (existingApplication) {
      return { success: false, error: '이미 신청서가 제출되어 있습니다.' };
    }

    // 자동 승인 설정인 경우
    if (guild.settings.autoAccept) {
      return await this.joinGuild(guildId, playerId);
    }

    // 신청서 생성
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const application: GuildApplication = {
      id: applicationId,
      guildId,
      playerId,
      playerName: player.name,
      playerLevel: player.level,
      message,
      createdAt: new Date(),
      status: 'pending'
    };

    this.applications.set(applicationId, application);

    logger.info(`길드 가입 신청: ${player.name} → ${guild.settings.name}`);

    return { success: true, applicationId };
  }

  /**
   * 길드 가입 신청 처리
   */
  async processApplication(
    applicationId: string,
    reviewerId: string,
    accept: boolean,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const application = this.applications.get(applicationId);
    if (!application) {
      return { success: false, error: '신청서를 찾을 수 없습니다.' };
    }

    if (application.status !== 'pending') {
      return { success: false, error: '이미 처리된 신청서입니다.' };
    }

    const guild = this.guilds.get(application.guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    const reviewer = guild.members.find(m => m.playerId === reviewerId);
    if (!reviewer || !reviewer.permissions.includes('invite_members')) {
      return { success: false, error: '신청서 처리 권한이 없습니다.' };
    }

    if (accept) {
      const joinResult = await this.joinGuild(application.guildId, application.playerId);
      if (!joinResult.success) {
        return joinResult;
      }
      application.status = 'accepted';
    } else {
      application.status = 'rejected';
    }

    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();

    logger.info(`길드 신청서 처리: ${application.playerName} ${accept ? 'accepted' : 'rejected'} by ${reviewer.playerName}`);

    return { success: true };
  }

  /**
   * 길드 가입 (내부 함수)
   */
  private async joinGuild(
    guildId: string,
    playerId: string
  ): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    if (this.playerGuilds.has(playerId)) {
      return { success: false, error: '이미 다른 길드에 속해 있습니다.' };
    }

    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    const newMember: GuildMember = {
      playerId,
      playerName: player.name,
      level: player.level,
      class: player.class || 'novice',
      rank: guild.ranks.find(r => r.id === 'member')!,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
      isOnline: true,
      contribution: this.createEmptyContribution(),
      permissions: []
    };

    guild.members.push(newMember);
    guild.updatedAt = new Date();
    guild.statistics.membersJoined++;
    this.playerGuilds.set(playerId, guildId);

    // 길드원들에게 알림
    await this.notifyGuildMembers(guildId, `${player.name}님이 길드에 가입했습니다!`);

    logger.info(`길드 가입: ${player.name} → ${guild.settings.name}`);

    return { success: true };
  }

  /**
   * 길드 탈퇴
   */
  async leaveGuild(playerId: string): Promise<{ success: boolean; error?: string }> {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) {
      return { success: false, error: '길드에 속해 있지 않습니다.' };
    }

    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    const member = guild.members.find(m => m.playerId === playerId);
    if (!member) {
      return { success: false, error: '길드 멤버가 아닙니다.' };
    }

    // 길드마스터는 탈퇴 불가 (길드 해체만 가능)
    if (member.rank.id === 'guild_master') {
      return { success: false, error: '길드마스터는 탈퇴할 수 없습니다. 길드를 해체하거나 다른 멤버에게 길드마스터를 위임하세요.' };
    }

    const memberIndex = guild.members.findIndex(m => m.playerId === playerId);
    guild.members.splice(memberIndex, 1);
    guild.updatedAt = new Date();
    guild.statistics.membersLeft++;
    this.playerGuilds.delete(playerId);

    await this.notifyGuildMembers(guildId, `${member.playerName}님이 길드를 탈퇴했습니다.`);

    logger.info(`길드 탈퇴: ${member.playerName} from ${guild.settings.name}`);

    return { success: true };
  }

  /**
   * 길드 멤버 추방
   */
  async kickMember(
    guildId: string,
    kickerId: string,
    targetPlayerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    const kicker = guild.members.find(m => m.playerId === kickerId);
    if (!kicker || !kicker.permissions.includes('kick_members')) {
      return { success: false, error: '추방 권한이 없습니다.' };
    }

    const target = guild.members.find(m => m.playerId === targetPlayerId);
    if (!target) {
      return { success: false, error: '대상 멤버를 찾을 수 없습니다.' };
    }

    if (target.rank.level <= kicker.rank.level) {
      return { success: false, error: '같거나 높은 계급의 멤버는 추방할 수 없습니다.' };
    }

    const memberIndex = guild.members.findIndex(m => m.playerId === targetPlayerId);
    guild.members.splice(memberIndex, 1);
    guild.updatedAt = new Date();
    this.playerGuilds.delete(targetPlayerId);

    const reasonText = reason ? ` (사유: ${reason})` : '';
    await this.notifyGuildMembers(guildId, `${target.playerName}님이 길드에서 추방되었습니다${reasonText}`);

    logger.info(`길드 추방: ${target.playerName} by ${kicker.playerName}${reasonText}`);

    return { success: true };
  }

  /**
   * 멤버 승진/강등
   */
  async changeRank(
    guildId: string,
    promoterId: string,
    targetPlayerId: string,
    newRankId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    const promoter = guild.members.find(m => m.playerId === promoterId);
    if (!promoter || !promoter.permissions.includes('promote_members')) {
      return { success: false, error: '승진/강등 권한이 없습니다.' };
    }

    const target = guild.members.find(m => m.playerId === targetPlayerId);
    if (!target) {
      return { success: false, error: '대상 멤버를 찾을 수 없습니다.' };
    }

    const newRank = guild.ranks.find(r => r.id === newRankId);
    if (!newRank) {
      return { success: false, error: '존재하지 않는 계급입니다.' };
    }

    // 권한 확인
    if (newRank.level <= promoter.rank.level && promoter.rank.id !== 'guild_master') {
      return { success: false, error: '자신과 같거나 높은 계급으로 승진시킬 수 없습니다.' };
    }

    // 계급별 인원 제한 확인
    if (newRank.maxMembers) {
      const currentCount = guild.members.filter(m => m.rank.id === newRankId).length;
      if (currentCount >= newRank.maxMembers) {
        return { success: false, error: `${newRank.name} 계급의 정원이 가득 찼습니다.` };
      }
    }

    const oldRankName = target.rank.name;
    target.rank = newRank;
    target.permissions = newRank.permissions;
    guild.updatedAt = new Date();

    const isPromotion = newRank.level < target.rank.level;
    const action = isPromotion ? '승진' : '강등';
    
    await this.notifyGuildMembers(guildId, 
      `${target.playerName}님이 ${oldRankName}에서 ${newRank.name}으로 ${action}했습니다!`);

    logger.info(`길드 계급 변경: ${target.playerName} ${oldRankName} → ${newRank.name} by ${promoter.playerName}`);

    return { success: true };
  }

  /**
   * 길드 창고 골드 입금
   */
  async depositGold(
    guildId: string,
    playerId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    const member = guild.members.find(m => m.playerId === playerId);
    if (!member) {
      return { success: false, error: '길드 멤버가 아닙니다.' };
    }

    if (amount <= 0) {
      return { success: false, error: '올바른 금액을 입력하세요.' };
    }

    // 플레이어 골드 확인 (실제로는 플레이어 데이터에서 확인)
    // const player = await this.getPlayerInfo(playerId);
    // if (player.gold < amount) {
    //   return { success: false, error: '골드가 부족합니다.' };
    // }

    guild.treasury.gold += amount;
    member.contribution.donatedGold += amount;
    member.contribution.totalContribution += amount;

    // 로그 추가
    const log: TreasuryLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      playerName: member.playerName,
      action: 'deposit',
      type: 'gold',
      amount,
      timestamp: new Date()
    };
    guild.treasury.logs.push(log);

    guild.updatedAt = new Date();

    logger.info(`길드 골드 입금: ${member.playerName} ${amount}G → ${guild.settings.name}`);

    return { success: true };
  }

  /**
   * 길드 전쟁 선포
   */
  async declareWar(
    declaringGuildId: string,
    declarerId: string,
    targetGuildId: string,
    duration: number = 24
  ): Promise<{ success: boolean; warId?: string; error?: string }> {
    
    const declaringGuild = this.guilds.get(declaringGuildId);
    const targetGuild = this.guilds.get(targetGuildId);

    if (!declaringGuild || !targetGuild) {
      return { success: false, error: '길드를 찾을 수 없습니다.' };
    }

    const declarer = declaringGuild.members.find(m => m.playerId === declarerId);
    if (!declarer || !declarer.permissions.includes('declare_war')) {
      return { success: false, error: '전쟁 선포 권한이 없습니다.' };
    }

    // 이미 진행 중인 전쟁이 있는지 확인
    const existingWar = declaringGuild.wars.find(w => 
      w.targetGuildId === targetGuildId && 
      (w.status === 'declared' || w.status === 'accepted' || w.status === 'active')
    );

    if (existingWar) {
      return { success: false, error: '이미 해당 길드와 전쟁 중입니다.' };
    }

    const warId = `war_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const war: GuildWar = {
      id: warId,
      targetGuildId,
      targetGuildName: targetGuild.settings.name,
      declaredBy: declarerId,
      declaredAt: new Date(),
      startTime: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 시작
      endTime: new Date(Date.now() + (duration * 60 * 60 * 1000)), // duration 시간 후 종료
      status: 'declared',
      score: { ourGuild: 0, enemyGuild: 0 },
      participants: { ourGuild: [], enemyGuild: [] }
    };

    declaringGuild.wars.push(war);
    targetGuild.wars.push({ ...war, targetGuildId: declaringGuildId, targetGuildName: declaringGuild.settings.name });

    await this.notifyGuildMembers(declaringGuildId, `${targetGuild.settings.name}에게 전쟁을 선포했습니다!`);
    await this.notifyGuildMembers(targetGuildId, `${declaringGuild.settings.name}이(가) 전쟁을 선포했습니다!`);

    logger.info(`길드 전쟁 선포: ${declaringGuild.settings.name} → ${targetGuild.settings.name}`);

    return { success: true, warId };
  }

  /**
   * 길드원에게 알림
   */
  private async notifyGuildMembers(guildId: string, message: string): Promise<void> {
    // 실제로는 채팅 시스템과 연동하여 길드 채널로 메시지 전송
    logger.info(`길드 알림 [${guildId}]: ${message}`);
  }

  /**
   * 플레이어의 길드 정보 조회
   */
  getPlayerGuild(playerId: string): Guild | null {
    const guildId = this.playerGuilds.get(playerId);
    if (!guildId) return null;
    return this.guilds.get(guildId) || null;
  }

  /**
   * 길드 목록 조회 (공개 길드만)
   */
  getPublicGuilds(filters?: {
    levelRange?: { min: number; max: number };
    hasSpace?: boolean;
    language?: string;
  }): Guild[] {
    const publicGuilds = Array.from(this.guilds.values())
      .filter(guild => guild.settings.isPublic);

    if (!filters) return publicGuilds;

    return publicGuilds.filter(guild => {
      if (filters.levelRange) {
        const avgLevel = guild.members.reduce((sum, m) => sum + m.level, 0) / guild.members.length;
        if (avgLevel < filters.levelRange.min || avgLevel > filters.levelRange.max) {
          return false;
        }
      }

      if (filters.hasSpace && guild.members.length >= guild.settings.maxMembers) {
        return false;
      }

      if (filters.language && guild.settings.language !== filters.language) {
        return false;
      }

      return true;
    });
  }

  /**
   * 길드 신청서 목록 조회
   */
  getGuildApplications(guildId: string): GuildApplication[] {
    return Array.from(this.applications.values())
      .filter(app => app.guildId === guildId && app.status === 'pending');
  }

  // 헬퍼 함수들
  private createEmptyContribution(): GuildContribution {
    return {
      totalContribution: 0,
      weeklyContribution: 0,
      monthlyContribution: 0,
      donatedGold: 0,
      donatedItems: 0,
      questsCompleted: 0,
      pvpWins: 0,
      pvpLosses: 0,
      raidParticipation: 0
    };
  }

  private createEmptyStatistics(): GuildStatistics {
    return {
      totalPlayTime: 0,
      monstersKilled: 0,
      questsCompleted: 0,
      pvpWins: 0,
      pvpLosses: 0,
      raidsCompleted: 0,
      totalContribution: 0,
      goldEarned: 0,
      membersJoined: 0,
      membersLeft: 0
    };
  }

  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현시 플레이어 데이터 소스에서 가져와야 함
    return null;
  }

  /**
   * 길드 시스템 통계
   */
  getSystemStats(): {
    totalGuilds: number;
    activeGuilds: number;
    totalMembers: number;
    pendingApplications: number;
    averageGuildSize: number;
    totalWars: number;
  } {
    const totalGuilds = this.guilds.size;
    const activeGuilds = Array.from(this.guilds.values())
      .filter(guild => guild.members.some(m => m.isOnline)).length;
    
    const totalMembers = Array.from(this.guilds.values())
      .reduce((sum, guild) => sum + guild.members.length, 0);
    
    const pendingApplications = Array.from(this.applications.values())
      .filter(app => app.status === 'pending').length;
    
    const averageGuildSize = totalGuilds > 0 ? totalMembers / totalGuilds : 0;
    
    const totalWars = Array.from(this.guilds.values())
      .reduce((sum, guild) => sum + guild.wars.length, 0);

    return {
      totalGuilds,
      activeGuilds,
      totalMembers,
      pendingApplications,
      averageGuildSize,
      totalWars
    };
  }
}

// 전역 길드 시스템 인스턴스
export const guildSystem = new GuildSystem();

// 길드 관련 유틸리티
export const guildUtils = {
  /**
   * 길드 계급 표시명 반환
   */
  getRankDisplayName(rank: GuildRank): string {
    return rank.name;
  },

  /**
   * 권한 표시명 반환
   */
  getPermissionDisplayName(permission: GuildPermission): string {
    const names: Record<GuildPermission, string> = {
      invite_members: '멤버 초대',
      kick_members: '멤버 추방',
      promote_members: '승진/강등',
      demote_members: '강등',
      manage_ranks: '계급 관리',
      manage_settings: '길드 설정',
      use_guild_warehouse: '창고 사용',
      manage_warehouse: '창고 관리',
      declare_war: '전쟁 선포',
      manage_alliances: '동맹 관리',
      chat_officer: '간부 채팅',
      view_logs: '로그 조회'
    };
    return names[permission];
  },

  /**
   * 길드 레벨 계산
   */
  calculateGuildLevel(experience: number): number {
    return Math.floor(Math.sqrt(experience / 1000)) + 1;
  },

  /**
   * 다음 레벨까지 필요한 경험치
   */
  getRequiredExperienceForNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel, 2) * 1000;
  },

  /**
   * 길드 평균 레벨 계산
   */
  getAverageLevel(guild: Guild): number {
    if (guild.members.length === 0) return 0;
    const totalLevel = guild.members.reduce((sum, member) => sum + member.level, 0);
    return Math.round(totalLevel / guild.members.length);
  },

  /**
   * 길드 온라인 멤버 수 반환
   */
  getOnlineMembersCount(guild: Guild): number {
    return guild.members.filter(member => member.isOnline).length;
  }
};
