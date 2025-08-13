import { Player } from '@/types/game';
import { logger } from '../logger';

// 거래 요청 인터페이스
interface TradeRequest {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
}

// 거래 아이템
interface TradeItem {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: string;
  value: number;
  enchantment?: number;
  metadata?: Record<string, unknown>;
}

// 거래 제안
interface TradeOffer {
  playerId: string;
  items: TradeItem[];
  gold: number;
  isConfirmed: boolean;
  confirmedAt?: Date;
}

// 거래 세션
interface TradeSession {
  id: string;
  participants: string[]; // 플레이어 ID 배열
  offers: TradeOffer[];
  status: TradeStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
  chatMessages: TradeChatMessage[];
  logs: TradeLog[];
}

// 거래 상태
type TradeStatus = 'active' | 'both_confirmed' | 'completed' | 'cancelled' | 'failed';

// 거래 채팅 메시지
interface TradeChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

// 거래 로그
interface TradeLog {
  id: string;
  timestamp: Date;
  action: 'item_added' | 'item_removed' | 'gold_changed' | 'confirmed' | 'unconfirmed' | 'completed' | 'cancelled';
  playerId: string;
  playerName: string;
  details: string;
  metadata?: Record<string, unknown>;
}

// 거래 제한 설정
interface TradeRestrictions {
  minLevel: number;
  maxValueDifference: number; // 최대 가치 차이 (%)
  cooldownPeriod: number; // 거래 후 대기시간 (초)
  maxItemsPerTrade: number;
  maxGoldPerTrade: number;
  bannedItems: string[]; // 거래 불가 아이템
  requiredVerification: boolean; // 이메일 인증 등
}

// 거래 통계
interface TradeStatistics {
  totalTrades: number;
  successfulTrades: number;
  cancelledTrades: number;
  failedTrades: number;
  totalItemsTraded: number;
  totalGoldTraded: number;
  averageTradeValue: number;
  popularItems: Record<string, number>;
  tradingPartners: Record<string, number>;
}

export class TradingSystem {
  private tradeRequests: Map<string, TradeRequest> = new Map();
  private tradeSessions: Map<string, TradeSession> = new Map();
  private playerTradeCooldowns: Map<string, Date> = new Map();
  private tradeStatistics: Map<string, TradeStatistics> = new Map();
  private restrictions: TradeRestrictions;

  constructor() {
    this.restrictions = {
      minLevel: 10,
      maxValueDifference: 200, // 200% 차이까지 허용
      cooldownPeriod: 30, // 30초 대기
      maxItemsPerTrade: 20,
      maxGoldPerTrade: 1000000, // 100만 골드
      bannedItems: [],
      requiredVerification: false
    };

    this.startCleanupTasks();
  }

  /**
   * 거래 요청 보내기
   */
  async sendTradeRequest(
    fromPlayerId: string,
    toPlayerId: string,
    message?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    
    if (fromPlayerId === toPlayerId) {
      return { success: false, error: '자신과는 거래할 수 없습니다.' };
    }

    const fromPlayer = await this.getPlayerInfo(fromPlayerId);
    const toPlayer = await this.getPlayerInfo(toPlayerId);

    if (!fromPlayer || !toPlayer) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 레벨 제한 확인
    if (fromPlayer.level < this.restrictions.minLevel || toPlayer.level < this.restrictions.minLevel) {
      return { success: false, error: `레벨 ${this.restrictions.minLevel} 이상만 거래할 수 있습니다.` };
    }

    // 대기시간 확인
    const cooldown = this.playerTradeCooldowns.get(fromPlayerId);
    if (cooldown && new Date() < cooldown) {
      const remainingTime = Math.ceil((cooldown.getTime() - Date.now()) / 1000);
      return { success: false, error: `${remainingTime}초 후에 거래를 요청할 수 있습니다.` };
    }

    // 이미 진행 중인 거래가 있는지 확인
    const activeSession = Array.from(this.tradeSessions.values())
      .find(session => 
        session.participants.includes(fromPlayerId) || session.participants.includes(toPlayerId)
      );
    
    if (activeSession) {
      return { success: false, error: '이미 진행 중인 거래가 있습니다.' };
    }

    // 기존 요청이 있는지 확인
    const existingRequest = Array.from(this.tradeRequests.values())
      .find(req => 
        req.fromPlayerId === fromPlayerId && 
        req.toPlayerId === toPlayerId && 
        req.status === 'pending'
      );
    
    if (existingRequest) {
      return { success: false, error: '이미 거래 요청을 보냈습니다.' };
    }

    const requestId = `trade_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const request: TradeRequest = {
      id: requestId,
      fromPlayerId,
      toPlayerId,
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2분 후 만료
      status: 'pending'
    };

    this.tradeRequests.set(requestId, request);

    logger.info(`거래 요청: ${fromPlayer.name} → ${toPlayer.name}`);

    return { success: true, requestId };
  }

  /**
   * 거래 요청 응답
   */
  async respondToTradeRequest(
    requestId: string,
    playerId: string,
    accept: boolean
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    
    const request = this.tradeRequests.get(requestId);
    if (!request) {
      return { success: false, error: '거래 요청을 찾을 수 없습니다.' };
    }

    if (request.toPlayerId !== playerId) {
      return { success: false, error: '거래 요청 대상이 아닙니다.' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: '이미 처리된 요청입니다.' };
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      return { success: false, error: '거래 요청이 만료되었습니다.' };
    }

    if (accept) {
      request.status = 'accepted';
      const sessionId = await this.createTradeSession(request.fromPlayerId, request.toPlayerId);
      
      logger.info(`거래 요청 수락: ${requestId} → 세션 ${sessionId}`);
      
      return { success: true, sessionId };
    } else {
      request.status = 'declined';
      
      logger.info(`거래 요청 거절: ${requestId}`);
      
      return { success: true };
    }
  }

  /**
   * 거래 세션 생성
   */
  private async createTradeSession(player1Id: string, player2Id: string): Promise<string> {
    const sessionId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: TradeSession = {
      id: sessionId,
      participants: [player1Id, player2Id],
      offers: [
        { playerId: player1Id, items: [], gold: 0, isConfirmed: false },
        { playerId: player2Id, items: [], gold: 0, isConfirmed: false }
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      chatMessages: [],
      logs: []
    };

    this.tradeSessions.set(sessionId, session);

    // 세션 시작 로그
    await this.addTradeLog(session, {
      action: 'completed',
      playerId: 'system',
      playerName: 'System',
      details: '거래 세션이 시작되었습니다.'
    });

    return sessionId;
  }

  /**
   * 거래에 아이템 추가
   */
  async addItemToTrade(
    sessionId: string,
    playerId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    if (!session.participants.includes(playerId)) {
      return { success: false, error: '거래 참가자가 아닙니다.' };
    }

    if (session.status !== 'active') {
      return { success: false, error: '활성 상태가 아닌 거래입니다.' };
    }

    const offer = session.offers.find(o => o.playerId === playerId);
    if (!offer) {
      return { success: false, error: '거래 제안을 찾을 수 없습니다.' };
    }

    // 아이템 개수 제한 확인
    if (offer.items.length >= this.restrictions.maxItemsPerTrade) {
      return { success: false, error: `최대 ${this.restrictions.maxItemsPerTrade}개까지만 거래할 수 있습니다.` };
    }

    // 플레이어 아이템 보유 확인
    const playerItem = await this.getPlayerItem(playerId, itemId);
    if (!playerItem) {
      return { success: false, error: '보유하지 않은 아이템입니다.' };
    }

    if (playerItem.quantity < quantity) {
      return { success: false, error: '수량이 부족합니다.' };
    }

    // 거래 금지 아이템 확인
    if (this.restrictions.bannedItems.includes(itemId)) {
      return { success: false, error: '거래할 수 없는 아이템입니다.' };
    }

    // 이미 추가된 아이템인지 확인
    const existingItem = offer.items.find(item => item.itemId === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const tradeItem: TradeItem = {
        itemId,
        itemName: playerItem.name,
        quantity,
        rarity: playerItem.rarity,
        value: playerItem.value * quantity,
        enchantment: playerItem.enchantment,
        metadata: playerItem.metadata
      };
      offer.items.push(tradeItem);
    }

    // 확인 상태 초기화
    session.offers.forEach(o => o.isConfirmed = false);
    session.updatedAt = new Date();

    await this.addTradeLog(session, {
      action: 'item_added',
      playerId,
      playerName: (await this.getPlayerInfo(playerId))?.name || 'Unknown',
      details: `${playerItem.name} x${quantity} 추가`
    });

    logger.info(`거래 아이템 추가: ${sessionId} - ${playerItem.name} x${quantity}`);

    return { success: true };
  }

  /**
   * 거래에서 아이템 제거
   */
  async removeItemFromTrade(
    sessionId: string,
    playerId: string,
    itemId: string,
    quantity?: number
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    const offer = session.offers.find(o => o.playerId === playerId);
    if (!offer) {
      return { success: false, error: '거래 제안을 찾을 수 없습니다.' };
    }

    const itemIndex = offer.items.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) {
      return { success: false, error: '거래에 추가되지 않은 아이템입니다.' };
    }

    const item = offer.items[itemIndex];
    const removeQuantity = quantity || item.quantity;

    if (removeQuantity >= item.quantity) {
      offer.items.splice(itemIndex, 1);
    } else {
      item.quantity -= removeQuantity;
      item.value = (item.value / (item.quantity + removeQuantity)) * item.quantity;
    }

    // 확인 상태 초기화
    session.offers.forEach(o => o.isConfirmed = false);
    session.updatedAt = new Date();

    await this.addTradeLog(session, {
      action: 'item_removed',
      playerId,
      playerName: (await this.getPlayerInfo(playerId))?.name || 'Unknown',
      details: `${item.itemName} x${removeQuantity} 제거`
    });

    return { success: true };
  }

  /**
   * 거래에 골드 설정
   */
  async setTradeGold(
    sessionId: string,
    playerId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    const offer = session.offers.find(o => o.playerId === playerId);
    if (!offer) {
      return { success: false, error: '거래 제안을 찾을 수 없습니다.' };
    }

    if (amount < 0) {
      return { success: false, error: '올바른 금액을 입력하세요.' };
    }

    if (amount > this.restrictions.maxGoldPerTrade) {
      return { success: false, error: `최대 ${this.restrictions.maxGoldPerTrade} 골드까지만 거래할 수 있습니다.` };
    }

    // 플레이어 골드 확인
    const player = await this.getPlayerInfo(playerId);
    if (!player || player.gold < amount) {
      return { success: false, error: '골드가 부족합니다.' };
    }

    const oldAmount = offer.gold;
    offer.gold = amount;

    // 확인 상태 초기화
    session.offers.forEach(o => o.isConfirmed = false);
    session.updatedAt = new Date();

    await this.addTradeLog(session, {
      action: 'gold_changed',
      playerId,
      playerName: player.name,
      details: `골드: ${oldAmount} → ${amount}`
    });

    return { success: true };
  }

  /**
   * 거래 확인
   */
  async confirmTrade(
    sessionId: string,
    playerId: string
  ): Promise<{ success: boolean; error?: string; completed?: boolean }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    const offer = session.offers.find(o => o.playerId === playerId);
    if (!offer) {
      return { success: false, error: '거래 제안을 찾을 수 없습니다.' };
    }

    if (offer.isConfirmed) {
      return { success: false, error: '이미 확인했습니다.' };
    }

    offer.isConfirmed = true;
    offer.confirmedAt = new Date();

    await this.addTradeLog(session, {
      action: 'confirmed',
      playerId,
      playerName: (await this.getPlayerInfo(playerId))?.name || 'Unknown',
      details: '거래를 확인했습니다.'
    });

    // 모든 참가자가 확인했는지 체크
    const allConfirmed = session.offers.every(o => o.isConfirmed);
    
    if (allConfirmed) {
      session.status = 'both_confirmed';
      
      // 거래 유효성 최종 검증
      const validationResult = await this.validateTrade(session);
      if (!validationResult.valid) {
        session.status = 'failed';
        return { success: false, error: validationResult.error };
      }

      // 거래 실행
      const executeResult = await this.executeTrade(session);
      if (executeResult.success) {
        session.status = 'completed';
        session.completedAt = new Date();
        return { success: true, completed: true };
      } else {
        session.status = 'failed';
        return { success: false, error: executeResult.error };
      }
    }

    return { success: true, completed: false };
  }

  /**
   * 거래 확인 취소
   */
  async unconfirmTrade(
    sessionId: string,
    playerId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    const offer = session.offers.find(o => o.playerId === playerId);
    if (!offer) {
      return { success: false, error: '거래 제안을 찾을 수 없습니다.' };
    }

    if (!offer.isConfirmed) {
      return { success: false, error: '확인하지 않은 상태입니다.' };
    }

    offer.isConfirmed = false;
    offer.confirmedAt = undefined;
    session.status = 'active';

    await this.addTradeLog(session, {
      action: 'unconfirmed',
      playerId,
      playerName: (await this.getPlayerInfo(playerId))?.name || 'Unknown',
      details: '거래 확인을 취소했습니다.'
    });

    return { success: true };
  }

  /**
   * 거래 취소
   */
  async cancelTrade(
    sessionId: string,
    playerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    if (!session.participants.includes(playerId)) {
      return { success: false, error: '거래 참가자가 아닙니다.' };
    }

    session.status = 'cancelled';
    session.cancelledBy = playerId;
    session.cancelReason = reason;
    session.updatedAt = new Date();

    await this.addTradeLog(session, {
      action: 'cancelled',
      playerId,
      playerName: (await this.getPlayerInfo(playerId))?.name || 'Unknown',
      details: `거래를 취소했습니다.${reason ? ` (사유: ${reason})` : ''}`
    });

    // 대기시간 설정
    this.playerTradeCooldowns.set(playerId, new Date(Date.now() + this.restrictions.cooldownPeriod * 1000));

    logger.info(`거래 취소: ${sessionId} by ${playerId}`);

    return { success: true };
  }

  /**
   * 거래 유효성 검증
   */
  private async validateTrade(session: TradeSession): Promise<{ valid: boolean; error?: string }> {
    // 참가자 유효성 확인
    for (const playerId of session.participants) {
      const player = await this.getPlayerInfo(playerId);
      if (!player) {
        return { valid: false, error: '플레이어 정보를 찾을 수 없습니다.' };
      }

      const offer = session.offers.find(o => o.playerId === playerId);
      if (!offer) continue;

      // 골드 확인
      if (player.gold < offer.gold) {
        return { valid: false, error: `${player.name}의 골드가 부족합니다.` };
      }

      // 아이템 확인
      for (const tradeItem of offer.items) {
        const playerItem = await this.getPlayerItem(playerId, tradeItem.itemId);
        if (!playerItem || playerItem.quantity < tradeItem.quantity) {
          return { valid: false, error: `${player.name}의 ${tradeItem.itemName} 수량이 부족합니다.` };
        }
      }
    }

    // 거래 균형 확인 (선택적)
    const [offer1, offer2] = session.offers;
    const value1 = this.calculateOfferValue(offer1);
    const value2 = this.calculateOfferValue(offer2);
    
    if (value1 > 0 && value2 > 0) {
      const difference = Math.abs(value1 - value2) / Math.min(value1, value2) * 100;
      if (difference > this.restrictions.maxValueDifference) {
        return { valid: false, error: '거래 가치 차이가 너무 큽니다.' };
      }
    }

    return { valid: true };
  }

  /**
   * 거래 실행
   */
  private async executeTrade(session: TradeSession): Promise<{ success: boolean; error?: string }> {
    try {
      const [player1Id, player2Id] = session.participants;
      const [offer1, offer2] = session.offers;

      // 트랜잭션 시작 (실제로는 데이터베이스 트랜잭션)
      
      // 플레이어 1 → 플레이어 2
      await this.transferItems(player1Id, player2Id, offer1.items);
      await this.transferGold(player1Id, player2Id, offer1.gold);
      
      // 플레이어 2 → 플레이어 1
      await this.transferItems(player2Id, player1Id, offer2.items);
      await this.transferGold(player2Id, player1Id, offer2.gold);

      // 통계 업데이트
      await this.updateTradeStatistics(session);

      await this.addTradeLog(session, {
        action: 'completed',
        playerId: 'system',
        playerName: 'System',
        details: '거래가 완료되었습니다.'
      });

      logger.info(`거래 완료: ${session.id}`);

      return { success: true };
    } catch (error) {
      logger.error('거래 실행 오류:', error);
      return { success: false, error: '거래 실행 중 오류가 발생했습니다.' };
    }
  }

  /**
   * 거래 채팅
   */
  async sendTradeMessage(
    sessionId: string,
    senderId: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const session = this.tradeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '거래 세션을 찾을 수 없습니다.' };
    }

    if (!session.participants.includes(senderId)) {
      return { success: false, error: '거래 참가자가 아닙니다.' };
    }

    if (content.length > 200) {
      return { success: false, error: '메시지가 너무 깁니다.' };
    }

    const sender = await this.getPlayerInfo(senderId);
    if (!sender) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    const message: TradeChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName: sender.name,
      content,
      timestamp: new Date()
    };

    session.chatMessages.push(message);
    session.updatedAt = new Date();

    return { success: true };
  }

  // 헬퍼 함수들
  private calculateOfferValue(offer: TradeOffer): number {
    const itemValue = offer.items.reduce((sum, item) => sum + item.value, 0);
    return itemValue + offer.gold;
  }

  private async addTradeLog(
    session: TradeSession,
    log: Omit<TradeLog, 'id' | 'timestamp'>
  ): Promise<void> {
    const tradeLog: TradeLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...log
    };
    session.logs.push(tradeLog);
  }

  private async transferItems(fromPlayerId: string, toPlayerId: string, items: TradeItem[]): Promise<void> {
    // 실제로는 플레이어 인벤토리 시스템과 연동
    logger.info(`아이템 이전: ${fromPlayerId} → ${toPlayerId} - ${items.length}개 아이템`);
  }

  private async transferGold(fromPlayerId: string, toPlayerId: string, amount: number): Promise<void> {
    if (amount <= 0) return;
    // 실제로는 플레이어 골드 시스템과 연동
    logger.info(`골드 이전: ${fromPlayerId} → ${toPlayerId} - ${amount} 골드`);
  }

  private async updateTradeStatistics(session: TradeSession): Promise<void> {
    // 거래 통계 업데이트
    session.participants.forEach(playerId => {
      let stats = this.tradeStatistics.get(playerId);
      if (!stats) {
        stats = {
          totalTrades: 0,
          successfulTrades: 0,
          cancelledTrades: 0,
          failedTrades: 0,
          totalItemsTraded: 0,
          totalGoldTraded: 0,
          averageTradeValue: 0,
          popularItems: {},
          tradingPartners: {}
        };
      }

      stats.totalTrades++;
      stats.successfulTrades++;
      
      const offer = session.offers.find(o => o.playerId === playerId);
      if (offer) {
        stats.totalItemsTraded += offer.items.length;
        stats.totalGoldTraded += offer.gold;
      }

      this.tradeStatistics.set(playerId, stats);
    });
  }

  private startCleanupTasks(): void {
    // 만료된 요청 정리
    setInterval(() => {
      const now = new Date();
      this.tradeRequests.forEach((request, id) => {
        if (request.status === 'pending' && now > request.expiresAt) {
          request.status = 'expired';
        }
      });
    }, 60000); // 1분마다

    // 비활성 세션 정리
    setInterval(() => {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30분 전
      this.tradeSessions.forEach((session, id) => {
        if (session.status === 'active' && session.updatedAt < cutoff) {
          session.status = 'cancelled';
          session.cancelReason = '비활성으로 인한 자동 취소';
        }
      });
    }, 5 * 60 * 1000); // 5분마다
  }

  // 실제로는 다른 시스템에서 가져와야 할 함수들
  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    // 실제 구현 필요
    return null;
  }

  private async getPlayerItem(playerId: string, itemId: string): Promise<{ itemId: string; quantity: number } | null> {
    // 실제 구현 필요
    return null;
  }

  /**
   * 거래 세션 조회
   */
  getTradeSession(sessionId: string): TradeSession | null {
    return this.tradeSessions.get(sessionId) || null;
  }

  /**
   * 플레이어의 거래 요청 목록
   */
  getPlayerTradeRequests(playerId: string): TradeRequest[] {
    return Array.from(this.tradeRequests.values())
      .filter(req => req.toPlayerId === playerId && req.status === 'pending');
  }

  /**
   * 플레이어의 활성 거래 세션
   */
  getPlayerActiveTradeSession(playerId: string): TradeSession | null {
    return Array.from(this.tradeSessions.values())
      .find(session => 
        session.participants.includes(playerId) && 
        (session.status === 'active' || session.status === 'both_confirmed')
      ) || null;
  }

  /**
   * 거래 통계 조회
   */
  getPlayerTradeStats(playerId: string): TradeStatistics | null {
    return this.tradeStatistics.get(playerId) || null;
  }

  /**
   * 시스템 거래 통계
   */
  getSystemTradeStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    pendingRequests: number;
    totalValue: number;
  } {
    const sessions = Array.from(this.tradeSessions.values());
    const requests = Array.from(this.tradeRequests.values());

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      totalValue: sessions
        .filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + s.offers.reduce((total, offer) => 
          total + this.calculateOfferValue(offer), 0), 0)
    };
  }
}

// 전역 거래 시스템 인스턴스
export const tradingSystem = new TradingSystem();

// 거래 관련 유틸리티
export const tradeUtils = {
  /**
   * 거래 상태 표시명
   */
  getTradeStatusDisplayName(status: TradeStatus): string {
    const names = {
      active: '진행 중',
      both_confirmed: '양측 확인',
      completed: '완료',
      cancelled: '취소됨',
      failed: '실패'
    };
    return names[status];
  },

  /**
   * 거래 가치 포맷팅
   */
  formatTradeValue(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },

  /**
   * 거래 시간 포맷팅
   */
  formatTradeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '방금';
    if (minutes < 60) return `${minutes}분 전`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  }
};
