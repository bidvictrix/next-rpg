import { Player } from '@/types/game';
import { logger } from '../logger';

// 파티 멤버 인터페이스
interface PartyMember {
  playerId: string;
  playerName: string;
  level: number;
  class: string;
  role: PartyRole;
  isOnline: boolean;
  joinedAt: Date;
  contribution: PartyContribution;
}

// 파티 역할
type PartyRole = 'leader' | 'officer' | 'member';

// 파티 기여도
interface PartyContribution {
  damageDealt: number;
  damageReceived: number;
  healing: number;
  kills: number;
  deaths: number;
  experience: number;
}

// 파티 설정
interface PartySettings {
  name: string;
  description: string;
  isPublic: boolean;
  maxMembers: number;
  levelRange: { min: number; max: number };
  allowedClasses: string[];
  lootDistribution: LootDistribution;
  experienceShare: ExperienceShare;
  inviteOnly: boolean;
  password?: string;
}

// 루팅 방식
type LootDistribution = 'free_for_all' | 'round_robin' | 'leader_decide' | 'need_before_greed' | 'random';

// 경험치 분배 방식
type ExperienceShare = 'equal' | 'level_based' | 'contribution_based';

// 파티 인터페이스
interface Party {
  id: string;
  settings: PartySettings;
  members: PartyMember[];
  createdAt: Date;
  updatedAt: Date;
  statistics: PartyStatistics;
  currentActivity?: PartyActivity;
}

// 파티 통계
interface PartyStatistics {
  totalPlayTime: number;
  monstersKilled: number;
  questsCompleted: number;
  itemsLooted: number;
  experienceGained: number;
  deathCount: number;
}

// 파티 활동
interface PartyActivity {
  type: 'dungeon' | 'quest' | 'hunting' | 'pvp' | 'idle';
  name: string;
  startTime: Date;
  location?: string;
  participants: string[];
}

// 파티 초대
interface PartyInvitation {
  id: string;
  partyId: string;
  fromPlayerId: string;
  toPlayerId: string;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export class PartySystem {
  private parties: Map<string, Party> = new Map();
  private playerParties: Map<string, string> = new Map(); // playerId -> partyId
  private invitations: Map<string, PartyInvitation> = new Map();
  private maxPartySize: number = 6;

  constructor() {
    this.startInvitationCleanup();
  }

  /**
   * 파티 생성
   */
  async createParty(
    leaderId: string, 
    settings: Partial<PartySettings>
  ): Promise<{ success: boolean; partyId?: string; error?: string }> {
    
    // 이미 파티에 속해 있는지 확인
    if (this.playerParties.has(leaderId)) {
      return { success: false, error: '이미 파티에 속해 있습니다.' };
    }

    const leader = await this.getPlayerInfo(leaderId);
    if (!leader) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    const partyId = `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultSettings: PartySettings = {
      name: `${leader.name}의 파티`,
      description: '',
      isPublic: true,
      maxMembers: this.maxPartySize,
      levelRange: { min: 1, max: 1000 },
      allowedClasses: [],
      lootDistribution: 'free_for_all',
      experienceShare: 'equal',
      inviteOnly: false
    };

    const leaderMember: PartyMember = {
      playerId: leaderId,
      playerName: leader.name,
      level: leader.level,
      class: leader.class || 'novice',
      role: 'leader',
      isOnline: true,
      joinedAt: new Date(),
      contribution: this.createEmptyContribution()
    };

    const party: Party = {
      id: partyId,
      settings: { ...defaultSettings, ...settings },
      members: [leaderMember],
      createdAt: new Date(),
      updatedAt: new Date(),
      statistics: this.createEmptyStatistics(),
      currentActivity: undefined
    };

    this.parties.set(partyId, party);
    this.playerParties.set(leaderId, partyId);

    logger.info(`파티 생성: ${partyId} by ${leader.name}`);

    return { success: true, partyId };
  }

  /**
   * 파티 초대
   */
  async invitePlayer(
    partyId: string, 
    inviterId: string, 
    targetPlayerId: string,
    message?: string
  ): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    const inviter = party.members.find(m => m.playerId === inviterId);
    if (!inviter || (inviter.role !== 'leader' && inviter.role !== 'officer')) {
      return { success: false, error: '초대 권한이 없습니다.' };
    }

    // 대상 플레이어가 이미 파티에 속해 있는지 확인
    if (this.playerParties.has(targetPlayerId)) {
      return { success: false, error: '대상 플레이어가 이미 파티에 속해 있습니다.' };
    }

    // 파티가 가득 찬지 확인
    if (party.members.length >= party.settings.maxMembers) {
      return { success: false, error: '파티가 가득 찼습니다.' };
    }

    const targetPlayer = await this.getPlayerInfo(targetPlayerId);
    if (!targetPlayer) {
      return { success: false, error: '대상 플레이어를 찾을 수 없습니다.' };
    }

    // 레벨 제한 확인
    if (targetPlayer.level < party.settings.levelRange.min || 
        targetPlayer.level > party.settings.levelRange.max) {
      return { success: false, error: '대상 플레이어가 파티 레벨 범위에 맞지 않습니다.' };
    }

    // 클래스 제한 확인
    if (party.settings.allowedClasses.length > 0 && 
        !party.settings.allowedClasses.includes(targetPlayer.class || '')) {
      return { success: false, error: '대상 플레이어의 클래스가 허용되지 않습니다.' };
    }

    // 기존 초대가 있는지 확인
    const existingInvitation = Array.from(this.invitations.values())
      .find(inv => inv.partyId === partyId && inv.toPlayerId === targetPlayerId && inv.status === 'pending');
    
    if (existingInvitation) {
      return { success: false, error: '이미 초대를 보낸 플레이어입니다.' };
    }

    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invitation: PartyInvitation = {
      id: invitationId,
      partyId,
      fromPlayerId: inviterId,
      toPlayerId: targetPlayerId,
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5분 후 만료
      status: 'pending'
    };

    this.invitations.set(invitationId, invitation);

    logger.info(`파티 초대: ${inviter.playerName} → ${targetPlayer.name} (${partyId})`);

    return { success: true, invitationId };
  }

  /**
   * 파티 초대 응답
   */
  async respondToInvitation(
    invitationId: string, 
    playerId: string, 
    accept: boolean
  ): Promise<{ success: boolean; error?: string }> {
    
    const invitation = this.invitations.get(invitationId);
    if (!invitation) {
      return { success: false, error: '초대를 찾을 수 없습니다.' };
    }

    if (invitation.toPlayerId !== playerId) {
      return { success: false, error: '초대 대상이 아닙니다.' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: '이미 처리된 초대입니다.' };
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      return { success: false, error: '초대가 만료되었습니다.' };
    }

    if (accept) {
      // 파티 가입 처리
      const joinResult = await this.joinParty(invitation.partyId, playerId);
      if (!joinResult.success) {
        return joinResult;
      }
      invitation.status = 'accepted';
    } else {
      invitation.status = 'declined';
    }

    logger.info(`파티 초대 응답: ${playerId} ${accept ? 'accepted' : 'declined'} ${invitationId}`);

    return { success: true };
  }

  /**
   * 파티 가입
   */
  async joinParty(
    partyId: string, 
    playerId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    if (this.playerParties.has(playerId)) {
      return { success: false, error: '이미 다른 파티에 속해 있습니다.' };
    }

    if (party.members.length >= party.settings.maxMembers) {
      return { success: false, error: '파티가 가득 찼습니다.' };
    }

    const player = await this.getPlayerInfo(playerId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    const newMember: PartyMember = {
      playerId,
      playerName: player.name,
      level: player.level,
      class: player.class || 'novice',
      role: 'member',
      isOnline: true,
      joinedAt: new Date(),
      contribution: this.createEmptyContribution()
    };

    party.members.push(newMember);
    party.updatedAt = new Date();
    this.playerParties.set(playerId, partyId);

    // 파티원들에게 알림
    await this.notifyPartyMembers(partyId, `${player.name}이(가) 파티에 가입했습니다.`);

    logger.info(`파티 가입: ${player.name} → ${partyId}`);

    return { success: true };
  }

  /**
   * 파티 탈퇴
   */
  async leaveParty(playerId: string): Promise<{ success: boolean; error?: string }> {
    const partyId = this.playerParties.get(playerId);
    if (!partyId) {
      return { success: false, error: '파티에 속해 있지 않습니다.' };
    }

    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    const memberIndex = party.members.findIndex(m => m.playerId === playerId);
    if (memberIndex === -1) {
      return { success: false, error: '파티 멤버가 아닙니다.' };
    }

    const member = party.members[memberIndex];
    const playerName = member.playerName;

    // 리더가 탈퇴하는 경우 리더십 이양
    if (member.role === 'leader') {
      if (party.members.length > 1) {
        // 가장 오래된 멤버에게 리더십 이양
        const newLeader = party.members
          .filter(m => m.playerId !== playerId)
          .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];
        
        newLeader.role = 'leader';
        await this.notifyPartyMembers(partyId, `${newLeader.playerName}이(가) 새로운 파티장이 되었습니다.`);
      } else {
        // 마지막 멤버인 경우 파티 해체
        this.disbandParty(partyId);
        return { success: true };
      }
    }

    party.members.splice(memberIndex, 1);
    party.updatedAt = new Date();
    this.playerParties.delete(playerId);

    await this.notifyPartyMembers(partyId, `${playerName}이(가) 파티를 떠났습니다.`);

    logger.info(`파티 탈퇴: ${playerName} from ${partyId}`);

    return { success: true };
  }

  /**
   * 파티 해체
   */
  async disbandParty(partyId: string): Promise<{ success: boolean; error?: string }> {
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    // 모든 멤버의 파티 소속 해제
    party.members.forEach(member => {
      this.playerParties.delete(member.playerId);
    });

    await this.notifyPartyMembers(partyId, '파티가 해체되었습니다.');

    this.parties.delete(partyId);

    logger.info(`파티 해체: ${partyId}`);

    return { success: true };
  }

  /**
   * 파티 멤버 추방
   */
  async kickMember(
    partyId: string, 
    kickerId: string, 
    targetPlayerId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    const kicker = party.members.find(m => m.playerId === kickerId);
    if (!kicker || (kicker.role !== 'leader' && kicker.role !== 'officer')) {
      return { success: false, error: '추방 권한이 없습니다.' };
    }

    const target = party.members.find(m => m.playerId === targetPlayerId);
    if (!target) {
      return { success: false, error: '대상 멤버를 찾을 수 없습니다.' };
    }

    if (target.role === 'leader') {
      return { success: false, error: '파티장은 추방할 수 없습니다.' };
    }

    const memberIndex = party.members.findIndex(m => m.playerId === targetPlayerId);
    party.members.splice(memberIndex, 1);
    party.updatedAt = new Date();
    this.playerParties.delete(targetPlayerId);

    await this.notifyPartyMembers(partyId, `${target.playerName}이(가) 파티에서 추방되었습니다.`);

    logger.info(`파티 추방: ${target.playerName} by ${kicker.playerName}`);

    return { success: true };
  }

  /**
   * 파티 설정 변경
   */
  async updatePartySettings(
    partyId: string, 
    playerId: string, 
    newSettings: Partial<PartySettings>
  ): Promise<{ success: boolean; error?: string }> {
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    const member = party.members.find(m => m.playerId === playerId);
    if (!member || member.role !== 'leader') {
      return { success: false, error: '파티장만 설정을 변경할 수 있습니다.' };
    }

    party.settings = { ...party.settings, ...newSettings };
    party.updatedAt = new Date();

    logger.info(`파티 설정 변경: ${partyId} by ${member.playerName}`);

    return { success: true };
  }

  /**
   * 파티 활동 설정
   */
  async setPartyActivity(
    partyId: string, 
    activity: PartyActivity
  ): Promise<{ success: boolean; error?: string }> {
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { success: false, error: '파티를 찾을 수 없습니다.' };
    }

    party.currentActivity = activity;
    party.updatedAt = new Date();

    await this.notifyPartyMembers(partyId, `파티 활동: ${activity.name} 시작`);

    return { success: true };
  }

  /**
   * 경험치 분배
   */
  async distributeExperience(
    partyId: string, 
    totalExperience: number, 
    killerPlayerId?: string
  ): Promise<{ distribution: Record<string, number>; error?: string }> {
    
    const party = this.parties.get(partyId);
    if (!party) {
      return { distribution: {}, error: '파티를 찾을 수 없습니다.' };
    }

    const onlineMembers = party.members.filter(m => m.isOnline);
    const distribution: Record<string, number> = {};

    switch (party.settings.experienceShare) {
      case 'equal':
        const equalShare = Math.floor(totalExperience / onlineMembers.length);
        onlineMembers.forEach(member => {
          distribution[member.playerId] = equalShare;
        });
        break;

      case 'level_based':
        const totalLevels = onlineMembers.reduce((sum, m) => sum + m.level, 0);
        onlineMembers.forEach(member => {
          const share = Math.floor((totalExperience * member.level) / totalLevels);
          distribution[member.playerId] = share;
        });
        break;

      case 'contribution_based':
        const totalContribution = onlineMembers.reduce((sum, m) => 
          sum + m.contribution.damageDealt + m.contribution.healing, 0);
        
        onlineMembers.forEach(member => {
          const memberContribution = member.contribution.damageDealt + member.contribution.healing;
          const share = totalContribution > 0 ? 
            Math.floor((totalExperience * memberContribution) / totalContribution) : 
            Math.floor(totalExperience / onlineMembers.length);
          distribution[member.playerId] = share;
        });
        break;
    }

    // 킬러 보너스 (있는 경우)
    if (killerPlayerId && distribution[killerPlayerId]) {
      const bonus = Math.floor(totalExperience * 0.1); // 10% 보너스
      distribution[killerPlayerId] += bonus;
    }

    // 파티 통계 업데이트
    party.statistics.experienceGained += totalExperience;

    return { distribution };
  }

  /**
   * 파티원에게 알림
   */
  private async notifyPartyMembers(partyId: string, message: string): Promise<void> {
    // 실제로는 채팅 시스템과 연동하여 파티 채널로 메시지 전송
    logger.info(`파티 알림 [${partyId}]: ${message}`);
  }

  /**
   * 플레이어의 파티 정보 조회
   */
  getPlayerParty(playerId: string): Party | null {
    const partyId = this.playerParties.get(playerId);
    if (!partyId) return null;
    return this.parties.get(partyId) || null;
  }

  /**
   * 파티 목록 조회 (공개 파티만)
   */
  getPublicParties(filters?: {
    levelRange?: { min: number; max: number };
    hasSpace?: boolean;
    activityType?: string;
  }): Party[] {
    const publicParties = Array.from(this.parties.values())
      .filter(party => party.settings.isPublic);

    if (!filters) return publicParties;

    return publicParties.filter(party => {
      if (filters.levelRange) {
        const avgLevel = party.members.reduce((sum, m) => sum + m.level, 0) / party.members.length;
        if (avgLevel < filters.levelRange.min || avgLevel > filters.levelRange.max) {
          return false;
        }
      }

      if (filters.hasSpace && party.members.length >= party.settings.maxMembers) {
        return false;
      }

      if (filters.activityType && party.currentActivity?.type !== filters.activityType) {
        return false;
      }

      return true;
    });
  }

  /**
   * 플레이어 초대 목록 조회
   */
  getPlayerInvitations(playerId: string): PartyInvitation[] {
    return Array.from(this.invitations.values())
      .filter(inv => inv.toPlayerId === playerId && inv.status === 'pending');
  }

  // 헬퍼 함수들
  private createEmptyContribution(): PartyContribution {
    return {
      damageDealt: 0,
      damageReceived: 0,
      healing: 0,
      kills: 0,
      deaths: 0,
      experience: 0
    };
  }

  private createEmptyStatistics(): PartyStatistics {
    return {
      totalPlayTime: 0,
      monstersKilled: 0,
      questsCompleted: 0,
      itemsLooted: 0,
      experienceGained: 0,
      deathCount: 0
    };
  }

  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현시 플레이어 데이터 소스에서 가져와야 함
    return null;
  }

  private startInvitationCleanup(): void {
    setInterval(() => {
      const now = new Date();
      this.invitations.forEach((invitation, id) => {
        if (invitation.status === 'pending' && now > invitation.expiresAt) {
          invitation.status = 'expired';
        }
      });
    }, 60000); // 1분마다 정리
  }

  /**
   * 파티 시스템 통계
   */
  getSystemStats(): {
    totalParties: number;
    activeParties: number;
    totalMembers: number;
    pendingInvitations: number;
    averagePartySize: number;
  } {
    const totalParties = this.parties.size;
    const activeParties = Array.from(this.parties.values())
      .filter(party => party.members.some(m => m.isOnline)).length;
    
    const totalMembers = Array.from(this.parties.values())
      .reduce((sum, party) => sum + party.members.length, 0);
    
    const pendingInvitations = Array.from(this.invitations.values())
      .filter(inv => inv.status === 'pending').length;
    
    const averagePartySize = totalParties > 0 ? totalMembers / totalParties : 0;

    return {
      totalParties,
      activeParties,
      totalMembers,
      pendingInvitations,
      averagePartySize
    };
  }
}

// 전역 파티 시스템 인스턴스
export const partySystem = new PartySystem();

// 파티 관련 유틸리티
export const partyUtils = {
  /**
   * 파티 역할 표시명 반환
   */
  getRoleDisplayName(role: PartyRole): string {
    const roleNames = {
      leader: '파티장',
      officer: '간부',
      member: '멤버'
    };
    return roleNames[role];
  },

  /**
   * 루팅 방식 표시명 반환
   */
  getLootDistributionName(distribution: LootDistribution): string {
    const names = {
      free_for_all: '자유 획득',
      round_robin: '순서 분배',
      leader_decide: '파티장 분배',
      need_before_greed: '필요도 우선',
      random: '랜덤 분배'
    };
    return names[distribution];
  },

  /**
   * 경험치 분배 방식 표시명 반환
   */
  getExperienceShareName(share: ExperienceShare): string {
    const names = {
      equal: '균등 분배',
      level_based: '레벨 비례',
      contribution_based: '기여도 비례'
    };
    return names[share];
  },

  /**
   * 파티 평균 레벨 계산
   */
  getAverageLevel(party: Party): number {
    if (party.members.length === 0) return 0;
    const totalLevel = party.members.reduce((sum, member) => sum + member.level, 0);
    return Math.round(totalLevel / party.members.length);
  },

  /**
   * 파티 온라인 멤버 수 반환
   */
  getOnlineMembersCount(party: Party): number {
    return party.members.filter(member => member.isOnline).length;
  }
};
