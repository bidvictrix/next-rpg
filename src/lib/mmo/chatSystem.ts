import { Player } from '@/types/game';
import { logger } from '../logger';

// 채팅 메시지 타입
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  channel: ChatChannel;
  targetId?: string; // 귓속말, 파티, 길드용
  isSystem: boolean;
  metadata?: {
    level?: number;
    class?: string;
    guildName?: string;
    partyId?: string;
  };
}

// 채팅 채널 타입
type ChatChannel = 'global' | 'local' | 'party' | 'guild' | 'whisper' | 'system' | 'trade' | 'help';

// 채팅 필터 설정
interface ChatFilter {
  profanityFilter: boolean;
  spamProtection: boolean;
  blockedUsers: string[];
  allowedChannels: ChatChannel[];
  messageHistory: number; // 표시할 메시지 개수
}

// 채팅 이벤트 리스너
type ChatEventListener = (message: ChatMessage) => void;

// 채팅 명령어
interface ChatCommand {
  command: string;
  handler: (player: Player, args: string[]) => Promise<string>;
  description: string;
  requiredLevel?: number;
  adminOnly?: boolean;
}

export class ChatSystem {
  private messages: Map<ChatChannel, ChatMessage[]> = new Map();
  private eventListeners: Map<string, ChatEventListener[]> = new Map();
  private chatCommands: Map<string, ChatCommand> = new Map();
  private playerFilters: Map<string, ChatFilter> = new Map();
  private messageHistory: number = 100;
  private spamTracker: Map<string, { count: number; lastMessage: number }> = new Map();

  constructor() {
    this.initializeChannels();
    this.initializeChatCommands();
    this.startSpamCleanup();
  }

  /**
   * 채팅 채널 초기화
   */
  private initializeChannels(): void {
    const channels: ChatChannel[] = ['global', 'local', 'party', 'guild', 'whisper', 'system', 'trade', 'help'];
    channels.forEach(channel => {
      this.messages.set(channel, []);
      this.eventListeners.set(channel, []);
    });
  }

  /**
   * 채팅 명령어 초기화
   */
  private initializeChatCommands(): void {
    // 기본 채팅 명령어들
    this.registerCommand({
      command: '/w',
      handler: this.handleWhisperCommand.bind(this),
      description: '귓속말 보내기: /w [플레이어명] [메시지]'
    });

    this.registerCommand({
      command: '/party',
      handler: this.handlePartyCommand.bind(this),
      description: '파티 채팅: /party [메시지]'
    });

    this.registerCommand({
      command: '/guild',
      handler: this.handleGuildCommand.bind(this),
      description: '길드 채팅: /guild [메시지]'
    });

    this.registerCommand({
      command: '/help',
      handler: this.handleHelpCommand.bind(this),
      description: '도움말 보기'
    });

    this.registerCommand({
      command: '/who',
      handler: this.handleWhoCommand.bind(this),
      description: '온라인 플레이어 목록'
    });

    this.registerCommand({
      command: '/ignore',
      handler: this.handleIgnoreCommand.bind(this),
      description: '플레이어 차단: /ignore [플레이어명]'
    });

    this.registerCommand({
      command: '/unignore',
      handler: this.handleUnignoreCommand.bind(this),
      description: '플레이어 차단 해제: /unignore [플레이어명]'
    });

    // 관리자 전용 명령어
    this.registerCommand({
      command: '/kick',
      handler: this.handleKickCommand.bind(this),
      description: '플레이어 추방 (관리자 전용)',
      adminOnly: true
    });

    this.registerCommand({
      command: '/mute',
      handler: this.handleMuteCommand.bind(this),
      description: '플레이어 음소거 (관리자 전용)',
      adminOnly: true
    });

    this.registerCommand({
      command: '/announce',
      handler: this.handleAnnounceCommand.bind(this),
      description: '공지사항 (관리자 전용)',
      adminOnly: true
    });
  }

  /**
   * 메시지 전송
   */
  async sendMessage(
    senderId: string, 
    content: string, 
    channel: ChatChannel = 'global',
    targetId?: string
  ): Promise<{ success: boolean; error?: string; message?: ChatMessage }> {
    
    // 스팸 방지 체크
    if (!this.checkSpamProtection(senderId)) {
      return { success: false, error: '메시지를 너무 빠르게 보내고 있습니다.' };
    }

    // 채팅 명령어 처리
    if (content.startsWith('/')) {
      return await this.handleChatCommand(senderId, content);
    }

    // 일반 메시지 처리
    const player = await this.getPlayerInfo(senderId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 욕설 필터링
    const filteredContent = this.applyProfanityFilter(content);

    // 메시지 생성
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName: player.name,
      content: filteredContent,
      timestamp: new Date(),
      channel,
      targetId,
      isSystem: false,
      metadata: {
        level: player.level,
        class: player.class,
        guildName: player.guildId ? await this.getGuildName(player.guildId) : undefined,
        partyId: player.partyId
      }
    };

    // 채널별 권한 확인
    const hasPermission = await this.checkChannelPermission(player, channel, targetId);
    if (!hasPermission.allowed) {
      return { success: false, error: hasPermission.reason };
    }

    // 메시지 저장
    await this.storeMessage(message);

    // 이벤트 발송
    this.broadcastMessage(message);

    logger.info(`채팅 메시지: [${channel}] ${player.name}: ${content}`);

    return { success: true, message };
  }

  /**
   * 시스템 메시지 전송
   */
  async sendSystemMessage(
    content: string, 
    channel: ChatChannel = 'system',
    targetId?: string
  ): Promise<void> {
    const message: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: 'system',
      senderName: 'System',
      content,
      timestamp: new Date(),
      channel,
      targetId,
      isSystem: true
    };

    await this.storeMessage(message);
    this.broadcastMessage(message);
  }

  /**
   * 채팅 명령어 처리
   */
  private async handleChatCommand(
    senderId: string, 
    content: string
  ): Promise<{ success: boolean; error?: string; message?: ChatMessage }> {
    const parts = content.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const chatCommand = this.chatCommands.get(command);
    if (!chatCommand) {
      return { success: false, error: '알 수 없는 명령어입니다. /help로 도움말을 확인하세요.' };
    }

    const player = await this.getPlayerInfo(senderId);
    if (!player) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 권한 확인
    if (chatCommand.adminOnly && !player.isAdmin) {
      return { success: false, error: '관리자 전용 명령어입니다.' };
    }

    if (chatCommand.requiredLevel && player.level < chatCommand.requiredLevel) {
      return { success: false, error: `레벨 ${chatCommand.requiredLevel} 이상만 사용할 수 있습니다.` };
    }

    try {
      const result = await chatCommand.handler(player, args);
      
      // 명령어 실행 결과를 시스템 메시지로 전송
      await this.sendSystemMessage(result, 'system', senderId);
      
      return { success: true };
    } catch (error) {
      logger.error('채팅 명령어 실행 오류:', error);
      return { success: false, error: '명령어 실행 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 채팅 명령어 등록
   */
  registerCommand(command: ChatCommand): void {
    this.chatCommands.set(`/${command.command}`, command);
  }

  /**
   * 채팅 이벤트 리스너 등록
   */
  addEventListener(channel: ChatChannel, listener: ChatEventListener): void {
    const listeners = this.eventListeners.get(channel) || [];
    listeners.push(listener);
    this.eventListeners.set(channel, listeners);
  }

  /**
   * 채팅 이벤트 리스너 제거
   */
  removeEventListener(channel: ChatChannel, listener: ChatEventListener): void {
    const listeners = this.eventListeners.get(channel) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 메시지 브로드캐스트
   */
  private broadcastMessage(message: ChatMessage): void {
    const listeners = this.eventListeners.get(message.channel) || [];
    listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        logger.error('채팅 이벤트 리스너 오류:', error);
      }
    });
  }

  /**
   * 채널 메시지 조회
   */
  getChannelMessages(channel: ChatChannel, limit: number = 50): ChatMessage[] {
    const messages = this.messages.get(channel) || [];
    return messages.slice(-limit);
  }

  /**
   * 플레이어별 귓속말 기록 조회
   */
  getWhisperHistory(playerId: string, otherPlayerId: string, limit: number = 20): ChatMessage[] {
    const whispers = this.messages.get('whisper') || [];
    return whispers
      .filter(msg => 
        (msg.senderId === playerId && msg.targetId === otherPlayerId) ||
        (msg.senderId === otherPlayerId && msg.targetId === playerId)
      )
      .slice(-limit);
  }

  /**
   * 채팅 필터 설정
   */
  setChatFilter(playerId: string, filter: Partial<ChatFilter>): void {
    const currentFilter = this.playerFilters.get(playerId) || this.getDefaultFilter();
    const newFilter = { ...currentFilter, ...filter };
    this.playerFilters.set(playerId, newFilter);
  }

  /**
   * 플레이어 차단
   */
  blockPlayer(playerId: string, targetPlayerId: string): void {
    const filter = this.playerFilters.get(playerId) || this.getDefaultFilter();
    if (!filter.blockedUsers.includes(targetPlayerId)) {
      filter.blockedUsers.push(targetPlayerId);
      this.playerFilters.set(playerId, filter);
    }
  }

  /**
   * 플레이어 차단 해제
   */
  unblockPlayer(playerId: string, targetPlayerId: string): void {
    const filter = this.playerFilters.get(playerId) || this.getDefaultFilter();
    const index = filter.blockedUsers.indexOf(targetPlayerId);
    if (index > -1) {
      filter.blockedUsers.splice(index, 1);
      this.playerFilters.set(playerId, filter);
    }
  }

  // 채팅 명령어 핸들러들
  private async handleWhisperCommand(player: Player, args: string[]): Promise<string> {
    if (args.length < 2) {
      return '사용법: /w [플레이어명] [메시지]';
    }

    const targetName = args[0];
    const message = args.slice(1).join(' ');
    
    const targetPlayer = await this.findPlayerByName(targetName);
    if (!targetPlayer) {
      return `플레이어 '${targetName}'을(를) 찾을 수 없습니다.`;
    }

    await this.sendMessage(player.id, message, 'whisper', targetPlayer.id);
    return `${targetName}에게 귓속말을 보냈습니다.`;
  }

  private async handlePartyCommand(player: Player, args: string[]): Promise<string> {
    if (!player.partyId) {
      return '파티에 속해있지 않습니다.';
    }

    const message = args.join(' ');
    if (!message) {
      return '사용법: /party [메시지]';
    }

    await this.sendMessage(player.id, message, 'party', player.partyId);
    return '파티 채팅으로 메시지를 보냈습니다.';
  }

  private async handleGuildCommand(player: Player, args: string[]): Promise<string> {
    if (!player.guildId) {
      return '길드에 속해있지 않습니다.';
    }

    const message = args.join(' ');
    if (!message) {
      return '사용법: /guild [메시지]';
    }

    await this.sendMessage(player.id, message, 'guild', player.guildId);
    return '길드 채팅으로 메시지를 보냈습니다.';
  }

  private async handleHelpCommand(player: Player, args: string[]): Promise<string> {
    const commands = Array.from(this.chatCommands.values())
      .filter(cmd => !cmd.adminOnly || player.isAdmin)
      .filter(cmd => !cmd.requiredLevel || player.level >= cmd.requiredLevel)
      .map(cmd => `${cmd.command} - ${cmd.description}`)
      .join('\n');

    return `사용 가능한 명령어:\n${commands}`;
  }

  private async handleWhoCommand(player: Player, args: string[]): Promise<string> {
    // 실제로는 온라인 플레이어 목록을 가져와야 함
    return '온라인 플레이어: [목록은 실제 구현시 추가]';
  }

  private async handleIgnoreCommand(player: Player, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '사용법: /ignore [플레이어명]';
    }

    const targetName = args[0];
    const targetPlayer = await this.findPlayerByName(targetName);
    if (!targetPlayer) {
      return `플레이어 '${targetName}'을(를) 찾을 수 없습니다.`;
    }

    this.blockPlayer(player.id, targetPlayer.id);
    return `${targetName}을(를) 차단했습니다.`;
  }

  private async handleUnignoreCommand(player: Player, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '사용법: /unignore [플레이어명]';
    }

    const targetName = args[0];
    const targetPlayer = await this.findPlayerByName(targetName);
    if (!targetPlayer) {
      return `플레이어 '${targetName}'을(를) 찾을 수 없습니다.`;
    }

    this.unblockPlayer(player.id, targetPlayer.id);
    return `${targetName}의 차단을 해제했습니다.`;
  }

  private async handleKickCommand(player: Player, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '사용법: /kick [플레이어명] [사유]';
    }

    const targetName = args[0];
    const reason = args.slice(1).join(' ') || '관리자에 의한 추방';
    
    // 실제 킥 로직 구현 필요
    return `${targetName}을(를) 추방했습니다. 사유: ${reason}`;
  }

  private async handleMuteCommand(player: Player, args: string[]): Promise<string> {
    if (args.length === 0) {
      return '사용법: /mute [플레이어명] [시간(분)]';
    }

    const targetName = args[0];
    const duration = parseInt(args[1]) || 10;
    
    // 실제 뮤트 로직 구현 필요
    return `${targetName}을(를) ${duration}분간 음소거했습니다.`;
  }

  private async handleAnnounceCommand(player: Player, args: string[]): Promise<string> {
    const announcement = args.join(' ');
    if (!announcement) {
      return '사용법: /announce [공지내용]';
    }

    await this.sendSystemMessage(`[공지] ${announcement}`, 'global');
    return '공지사항을 전송했습니다.';
  }

  // 헬퍼 함수들
  private async storeMessage(message: ChatMessage): Promise<void> {
    const channelMessages = this.messages.get(message.channel) || [];
    channelMessages.push(message);
    
    // 메시지 수 제한
    if (channelMessages.length > this.messageHistory) {
      channelMessages.splice(0, channelMessages.length - this.messageHistory);
    }
    
    this.messages.set(message.channel, channelMessages);
  }

  private checkSpamProtection(playerId: string): boolean {
    const now = Date.now();
    const tracker = this.spamTracker.get(playerId) || { count: 0, lastMessage: 0 };
    
    // 3초 내에 5개 이상 메시지 방지
    if (now - tracker.lastMessage < 3000) {
      tracker.count++;
      if (tracker.count > 5) {
        return false;
      }
    } else {
      tracker.count = 1;
    }
    
    tracker.lastMessage = now;
    this.spamTracker.set(playerId, tracker);
    
    return true;
  }

  private applyProfanityFilter(content: string): string {
    // 간단한 욕설 필터 (실제로는 더 정교한 필터 필요)
    const badWords = ['욕설1', '욕설2', '욕설3'];
    let filtered = content;
    
    badWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    
    return filtered;
  }

  private async checkChannelPermission(
    player: Player, 
    channel: ChatChannel, 
    targetId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    switch (channel) {
      case 'party':
        if (!player.partyId) {
          return { allowed: false, reason: '파티에 속해있지 않습니다.' };
        }
        break;
      case 'guild':
        if (!player.guildId) {
          return { allowed: false, reason: '길드에 속해있지 않습니다.' };
        }
        break;
      case 'whisper':
        if (!targetId) {
          return { allowed: false, reason: '귓속말 대상이 지정되지 않았습니다.' };
        }
        break;
    }
    
    return { allowed: true };
  }

  private getDefaultFilter(): ChatFilter {
    return {
      profanityFilter: true,
      spamProtection: true,
      blockedUsers: [],
      allowedChannels: ['global', 'local', 'party', 'guild', 'whisper', 'system', 'trade', 'help'],
      messageHistory: 50
    };
  }

  private startSpamCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      this.spamTracker.forEach((tracker, playerId) => {
        if (now - tracker.lastMessage > 60000) { // 1분 후 정리
          this.spamTracker.delete(playerId);
        }
      });
    }, 60000);
  }

  // 실제 구현시 플레이어 데이터 소스에서 가져와야 할 함수들
  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현 필요
    return null;
  }

  private async findPlayerByName(name: string): Promise<Player | null> {
    // 실제 구현 필요
    return null;
  }

  private async getGuildName(guildId: string): Promise<string | undefined> {
    // 실제 구현 필요
    return undefined;
  }

  /**
   * 채팅 시스템 통계
   */
  getSystemStats(): {
    totalMessages: number;
    messagesPerChannel: Record<ChatChannel, number>;
    activeUsers: number;
    commandsUsed: number;
  } {
    let totalMessages = 0;
    const messagesPerChannel = {} as Record<ChatChannel, number>;
    
    this.messages.forEach((messages, channel) => {
      messagesPerChannel[channel] = messages.length;
      totalMessages += messages.length;
    });

    return {
      totalMessages,
      messagesPerChannel,
      activeUsers: this.spamTracker.size,
      commandsUsed: this.chatCommands.size
    };
  }
}

// 전역 채팅 시스템 인스턴스
export const chatSystem = new ChatSystem();

// 채팅 관련 유틸리티
export const chatUtils = {
  /**
   * 메시지 포맷팅
   */
  formatMessage(message: ChatMessage): string {
    const time = message.timestamp.toLocaleTimeString();
    const levelBadge = message.metadata?.level ? `[Lv.${message.metadata.level}]` : '';
    const guildBadge = message.metadata?.guildName ? `<${message.metadata.guildName}>` : '';
    
    switch (message.channel) {
      case 'whisper':
        return `[${time}] [귓속말] ${levelBadge}${message.senderName}: ${message.content}`;
      case 'party':
        return `[${time}] [파티] ${levelBadge}${message.senderName}: ${message.content}`;
      case 'guild':
        return `[${time}] [길드] ${levelBadge}${message.senderName}: ${message.content}`;
      case 'system':
        return `[${time}] [시스템] ${message.content}`;
      case 'trade':
        return `[${time}] [거래] ${levelBadge}${message.senderName}: ${message.content}`;
      default:
        return `[${time}] ${levelBadge}${guildBadge}${message.senderName}: ${message.content}`;
    }
  },

  /**
   * 채널별 색상 반환
   */
  getChannelColor(channel: ChatChannel): string {
    const colors = {
      global: '#ffffff',
      local: '#ffff99',
      party: '#99ccff',
      guild: '#99ff99',
      whisper: '#ff99ff',
      system: '#ff9999',
      trade: '#ffcc99',
      help: '#cccccc'
    };
    return colors[channel] || '#ffffff';
  },

  /**
   * 메시지 유효성 검사
   */
  validateMessage(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, error: '빈 메시지는 보낼 수 없습니다.' };
    }
    
    if (content.length > 500) {
      return { valid: false, error: '메시지가 너무 깁니다. (최대 500자)' };
    }
    
    return { valid: true };
  }
};
