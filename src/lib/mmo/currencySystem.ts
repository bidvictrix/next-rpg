import { Player } from '@/types/game';
import { logger } from '../logger';

// 화폐 타입
interface Currency {
  id: string;
  name: string;
  symbol: string;
  description: string;
  maxAmount: number;
  canTrade: boolean;
  canDrop: boolean;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  sources: CurrencySource[];
  uses: CurrencyUse[];
}

// 화폐 획득처
interface CurrencySource {
  type: 'monster' | 'quest' | 'trade' | 'daily' | 'event' | 'purchase' | 'exchange';
  description: string;
  amount: { min: number; max: number };
  chance: number; // 확률 (%)
}

// 화폐 사용처
interface CurrencyUse {
  type: 'shop' | 'upgrade' | 'service' | 'exchange' | 'tax';
  description: string;
  location: string;
}

// 플레이어 화폐 지갑
interface CurrencyWallet {
  playerId: string;
  currencies: Record<string, number>;
  transactions: CurrencyTransaction[];
  dailyLimits: Record<string, DailyLimit>;
  lockedAmounts: Record<string, number>; // 거래 등으로 잠긴 금액
  lastUpdated: Date;
}

// 화폐 거래 기록
interface CurrencyTransaction {
  id: string;
  playerId: string;
  currencyId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  description: string;
  metadata?: any;
  timestamp: Date;
  relatedTransactionId?: string; // 연관 거래 (교환 등)
}

// 거래 타입
type TransactionType = 
  | 'earn_monster' | 'earn_quest' | 'earn_daily' | 'earn_event'
  | 'spend_shop' | 'spend_upgrade' | 'spend_service' | 'spend_tax'
  | 'trade_send' | 'trade_receive'
  | 'exchange_give' | 'exchange_get'
  | 'admin_add' | 'admin_remove'
  | 'system_refund' | 'system_correction';

// 일일 제한
interface DailyLimit {
  currencyId: string;
  maxEarn: number;
  maxSpend: number;
  currentEarn: number;
  currentSpend: number;
  resetDate: Date;
}

// 화폐 교환 비율
interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  fee: number; // 수수료 (%)
  isActive: boolean;
  lastUpdated: Date;
}

// 화폐 상점
interface CurrencyShop {
  id: string;
  name: string;
  description: string;
  items: CurrencyShopItem[];
  currencies: string[]; // 사용 가능한 화폐
  isActive: boolean;
  category: 'general' | 'premium' | 'event' | 'guild' | 'pvp';
  refreshInterval?: number; // 상품 갱신 간격 (시간)
  lastRefresh?: Date;
  requiredLevel?: number;
  requiredAchievements?: string[];
}

// 화폐 상점 아이템
interface CurrencyShopItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: string;
  prices: Record<string, number>; // currencyId -> price
  quantity: number;
  maxPurchasePerDay?: number;
  maxPurchaseTotal?: number;
  requiredLevel?: number;
  requiredItems?: Array<{ itemId: string; quantity: number }>;
  isLimited: boolean;
  isEventItem: boolean;
  discountRate?: number; // 할인율 (%)
  validUntil?: Date;
}

// 화폐 시스템 설정
interface CurrencySystemSettings {
  maxTransactionHistory: number;
  exchangeFeeRate: number; // 기본 교환 수수료율
  dailyLimitResetHour: number; // 일일 제한 리셋 시간
  maxCurrenciesPerPlayer: number;
  taxRates: Record<string, number>; // 거래세율
  inflationControl: boolean;
  deflationMeasures: boolean;
}

// 화폐 시스템 통계
interface CurrencySystemStats {
  totalSupply: Record<string, number>; // 총 유통량
  dailyVolume: Record<string, number>; // 일일 거래량
  activeWallets: number;
  exchangeVolume: Record<string, Record<string, number>>; // 교환 거래량
  topHolders: Array<{ playerId: string; playerName: string; amount: number; currencyId: string }>;
  priceHistory: Record<string, Array<{ date: Date; rate: number }>>;
  inflationRate: Record<string, number>;
}

export class CurrencySystem {
  private currencies: Map<string, Currency> = new Map();
  private wallets: Map<string, CurrencyWallet> = new Map();
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private shops: Map<string, CurrencyShop> = new Map();
  private settings: CurrencySystemSettings;
  private stats: CurrencySystemStats;
  private transactionQueue: CurrencyTransaction[] = [];

  constructor() {
    this.settings = {
      maxTransactionHistory: 1000,
      exchangeFeeRate: 2, // 2%
      dailyLimitResetHour: 0, // 자정
      maxCurrenciesPerPlayer: 20,
      taxRates: {
        'gold': 0,
        'premium_coin': 0,
        'honor_point': 0,
        'guild_token': 0
      },
      inflationControl: true,
      deflationMeasures: true
    };

    this.stats = {
      totalSupply: {},
      dailyVolume: {},
      activeWallets: 0,
      exchangeVolume: {},
      topHolders: [],
      priceHistory: {},
      inflationRate: {}
    };

    this.initializeBaseCurrencies();
    this.initializeExchangeRates();
    this.initializeShops();
    this.startMaintenanceTasks();
  }

  /**
   * 기본 화폐 초기화
   */
  private initializeBaseCurrencies(): void {
    const baseCurrencies: Currency[] = [
      {
        id: 'gold',
        name: '골드',
        symbol: 'G',
        description: '가장 기본적인 화폐입니다.',
        maxAmount: 999999999,
        canTrade: true,
        canDrop: true,
        icon: '🪙',
        rarity: 'common',
        sources: [
          { type: 'monster', description: '몬스터 처치', amount: { min: 10, max: 100 }, chance: 80 },
          { type: 'quest', description: '퀘스트 완료', amount: { min: 100, max: 1000 }, chance: 100 },
          { type: 'trade', description: '플레이어 거래', amount: { min: 1, max: 999999999 }, chance: 100 }
        ],
        uses: [
          { type: 'shop', description: '일반 상점', location: 'general_shop' },
          { type: 'upgrade', description: '장비 강화', location: 'blacksmith' },
          { type: 'service', description: '각종 서비스', location: 'various' }
        ]
      },
      {
        id: 'premium_coin',
        name: '프리미엄 코인',
        symbol: 'PC',
        description: '현금으로 구매하거나 특별한 방법으로 획득할 수 있는 프리미엄 화폐입니다.',
        maxAmount: 999999,
        canTrade: false,
        canDrop: false,
        icon: '💎',
        rarity: 'legendary',
        sources: [
          { type: 'purchase', description: '현금 구매', amount: { min: 1, max: 10000 }, chance: 100 },
          { type: 'event', description: '특별 이벤트', amount: { min: 1, max: 100 }, chance: 5 },
          { type: 'daily', description: '일일 보상', amount: { min: 1, max: 10 }, chance: 10 }
        ],
        uses: [
          { type: 'shop', description: '프리미엄 상점', location: 'premium_shop' },
          { type: 'service', description: '편의 서비스', location: 'convenience' },
          { type: 'exchange', description: '화폐 교환', location: 'exchange' }
        ]
      },
      {
        id: 'honor_point',
        name: '명예 포인트',
        symbol: 'HP',
        description: 'PvP 활동을 통해 획득할 수 있는 화폐입니다.',
        maxAmount: 99999,
        canTrade: false,
        canDrop: false,
        icon: '⚔️',
        rarity: 'epic',
        sources: [
          { type: 'monster', description: 'PvP 승리', amount: { min: 10, max: 50 }, chance: 100 },
          { type: 'quest', description: 'PvP 퀘스트', amount: { min: 50, max: 200 }, chance: 100 }
        ],
        uses: [
          { type: 'shop', description: 'PvP 상점', location: 'pvp_shop' },
          { type: 'upgrade', description: 'PvP 장비', location: 'pvp_vendor' }
        ]
      },
      {
        id: 'guild_token',
        name: '길드 토큰',
        symbol: 'GT',
        description: '길드 활동을 통해 획득할 수 있는 화폐입니다.',
        maxAmount: 50000,
        canTrade: false,
        canDrop: false,
        icon: '🏰',
        rarity: 'rare',
        sources: [
          { type: 'quest', description: '길드 퀘스트', amount: { min: 20, max: 100 }, chance: 100 },
          { type: 'daily', description: '길드 기여도', amount: { min: 5, max: 30 }, chance: 100 }
        ],
        uses: [
          { type: 'shop', description: '길드 상점', location: 'guild_shop' },
          { type: 'upgrade', description: '길드 시설', location: 'guild_hall' }
        ]
      },
      {
        id: 'event_coin',
        name: '이벤트 코인',
        symbol: 'EC',
        description: '특별 이벤트에서만 획득할 수 있는 한정 화폐입니다.',
        maxAmount: 10000,
        canTrade: false,
        canDrop: false,
        icon: '🎉',
        rarity: 'legendary',
        sources: [
          { type: 'event', description: '이벤트 참여', amount: { min: 1, max: 50 }, chance: 100 }
        ],
        uses: [
          { type: 'shop', description: '이벤트 상점', location: 'event_shop' }
        ]
      }
    ];

    baseCurrencies.forEach(currency => {
      this.currencies.set(currency.id, currency);
      this.stats.totalSupply[currency.id] = 0;
      this.stats.dailyVolume[currency.id] = 0;
      this.stats.inflationRate[currency.id] = 0;
    });
  }

  /**
   * 교환 비율 초기화
   */
  private initializeExchangeRates(): void {
    const exchangeRates: ExchangeRate[] = [
      {
        fromCurrency: 'premium_coin',
        toCurrency: 'gold',
        rate: 1000, // 1 PC = 1000 G
        minAmount: 1,
        maxAmount: 1000,
        fee: 0,
        isActive: true,
        lastUpdated: new Date()
      },
      {
        fromCurrency: 'honor_point',
        toCurrency: 'gold',
        rate: 10, // 1 HP = 10 G
        minAmount: 10,
        maxAmount: 5000,
        fee: 5,
        isActive: true,
        lastUpdated: new Date()
      },
      {
        fromCurrency: 'guild_token',
        toCurrency: 'gold',
        rate: 50, // 1 GT = 50 G
        minAmount: 5,
        maxAmount: 1000,
        fee: 5,
        isActive: true,
        lastUpdated: new Date()
      }
    ];

    exchangeRates.forEach(rate => {
      const key = `${rate.fromCurrency}_to_${rate.toCurrency}`;
      this.exchangeRates.set(key, rate);
    });
  }

  /**
   * 상점 초기화
   */
  private initializeShops(): void {
    const shops: CurrencyShop[] = [
      {
        id: 'premium_shop',
        name: '프리미엄 상점',
        description: '프리미엄 코인으로 구매할 수 있는 특별한 아이템들',
        items: [],
        currencies: ['premium_coin'],
        isActive: true,
        category: 'premium'
      },
      {
        id: 'honor_shop',
        name: '명예 상점',
        description: 'PvP 명예 포인트로 구매할 수 있는 아이템들',
        items: [],
        currencies: ['honor_point'],
        isActive: true,
        category: 'pvp'
      },
      {
        id: 'guild_shop',
        name: '길드 상점',
        description: '길드 토큰으로 구매할 수 있는 아이템들',
        items: [],
        currencies: ['guild_token'],
        isActive: true,
        category: 'guild'
      }
    ];

    shops.forEach(shop => {
      this.shops.set(shop.id, shop);
    });
  }

  /**
   * 플레이어 지갑 생성 또는 조회
   */
  private getOrCreateWallet(playerId: string): CurrencyWallet {
    let wallet = this.wallets.get(playerId);
    if (!wallet) {
      wallet = {
        playerId,
        currencies: {},
        transactions: [],
        dailyLimits: {},
        lockedAmounts: {},
        lastUpdated: new Date()
      };

      // 기본 화폐 초기화
      this.currencies.forEach((currency, currencyId) => {
        wallet!.currencies[currencyId] = currencyId === 'gold' ? 1000 : 0; // 골드는 1000으로 시작
        wallet!.lockedAmounts[currencyId] = 0;
      });

      this.wallets.set(playerId, wallet);
      this.stats.activeWallets++;
    }
    return wallet;
  }

  /**
   * 화폐 지급
   */
  async addCurrency(
    playerId: string,
    currencyId: string,
    amount: number,
    source: string,
    description: string,
    type: TransactionType = 'earn_monster'
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    
    if (amount <= 0) {
      return { success: false, error: '올바른 금액을 입력하세요.' };
    }

    const currency = this.currencies.get(currencyId);
    if (!currency) {
      return { success: false, error: '존재하지 않는 화폐입니다.' };
    }

    const wallet = this.getOrCreateWallet(playerId);
    const currentBalance = wallet.currencies[currencyId] || 0;
    
    // 최대 보유량 확인
    if (currentBalance + amount > currency.maxAmount) {
      return { success: false, error: `최대 보유량을 초과합니다. (최대: ${currency.maxAmount.toLocaleString()})` };
    }

    // 일일 제한 확인
    const dailyLimit = this.getDailyLimit(wallet, currencyId);
    if (type.startsWith('earn_') && dailyLimit.currentEarn + amount > dailyLimit.maxEarn) {
      return { success: false, error: '일일 획득 제한을 초과합니다.' };
    }

    const newBalance = currentBalance + amount;
    wallet.currencies[currencyId] = newBalance;
    wallet.lastUpdated = new Date();

    // 일일 제한 업데이트
    if (type.startsWith('earn_')) {
      dailyLimit.currentEarn += amount;
    }

    // 거래 기록 추가
    await this.addTransaction(wallet, {
      currencyId,
      type,
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      source,
      description
    });

    // 통계 업데이트
    this.stats.totalSupply[currencyId] = (this.stats.totalSupply[currencyId] || 0) + amount;
    this.stats.dailyVolume[currencyId] = (this.stats.dailyVolume[currencyId] || 0) + amount;

    logger.info(`화폐 지급: ${playerId} +${amount} ${currencyId} (${description})`);

    return { success: true, newBalance };
  }

  /**
   * 화폐 차감
   */
  async deductCurrency(
    playerId: string,
    currencyId: string,
    amount: number,
    source: string,
    description: string,
    type: TransactionType = 'spend_shop'
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    
    if (amount <= 0) {
      return { success: false, error: '올바른 금액을 입력하세요.' };
    }

    const currency = this.currencies.get(currencyId);
    if (!currency) {
      return { success: false, error: '존재하지 않는 화폐입니다.' };
    }

    const wallet = this.getOrCreateWallet(playerId);
    const currentBalance = wallet.currencies[currencyId] || 0;
    const lockedAmount = wallet.lockedAmounts[currencyId] || 0;
    const availableBalance = currentBalance - lockedAmount;

    if (availableBalance < amount) {
      return { success: false, error: '잔액이 부족합니다.' };
    }

    // 일일 제한 확인
    const dailyLimit = this.getDailyLimit(wallet, currencyId);
    if (type.startsWith('spend_') && dailyLimit.currentSpend + amount > dailyLimit.maxSpend) {
      return { success: false, error: '일일 사용 제한을 초과합니다.' };
    }

    const newBalance = currentBalance - amount;
    wallet.currencies[currencyId] = newBalance;
    wallet.lastUpdated = new Date();

    // 일일 제한 업데이트
    if (type.startsWith('spend_')) {
      dailyLimit.currentSpend += amount;
    }

    // 거래 기록 추가
    await this.addTransaction(wallet, {
      currencyId,
      type,
      amount: -amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      source,
      description
    });

    // 통계 업데이트
    this.stats.totalSupply[currencyId] = Math.max(0, (this.stats.totalSupply[currencyId] || 0) - amount);
    this.stats.dailyVolume[currencyId] = (this.stats.dailyVolume[currencyId] || 0) + amount;

    logger.info(`화폐 차감: ${playerId} -${amount} ${currencyId} (${description})`);

    return { success: true, newBalance };
  }

  /**
   * 화폐 교환
   */
  async exchangeCurrency(
    playerId: string,
    fromCurrencyId: string,
    toCurrencyId: string,
    fromAmount: number
  ): Promise<{ success: boolean; received?: number; fee?: number; error?: string }> {
    
    const rateKey = `${fromCurrencyId}_to_${toCurrencyId}`;
    const exchangeRate = this.exchangeRates.get(rateKey);
    
    if (!exchangeRate || !exchangeRate.isActive) {
      return { success: false, error: '사용할 수 없는 교환 조합입니다.' };
    }

    if (fromAmount < exchangeRate.minAmount || fromAmount > exchangeRate.maxAmount) {
      return { success: false, error: `교환 가능 수량: ${exchangeRate.minAmount} - ${exchangeRate.maxAmount}` };
    }

    const wallet = this.getOrCreateWallet(playerId);
    const fromBalance = wallet.currencies[fromCurrencyId] || 0;
    const lockedAmount = wallet.lockedAmounts[fromCurrencyId] || 0;
    const availableBalance = fromBalance - lockedAmount;

    if (availableBalance < fromAmount) {
      return { success: false, error: '교환할 화폐가 부족합니다.' };
    }

    // 교환 계산
    const grossReceived = Math.floor(fromAmount * exchangeRate.rate);
    const fee = Math.floor(grossReceived * (exchangeRate.fee / 100));
    const netReceived = grossReceived - fee;

    // 받을 화폐의 최대 보유량 확인
    const toCurrency = this.currencies.get(toCurrencyId);
    const toBalance = wallet.currencies[toCurrencyId] || 0;
    
    if (toCurrency && toBalance + netReceived > toCurrency.maxAmount) {
      return { success: false, error: '받을 화폐의 최대 보유량을 초과합니다.' };
    }

    // 교환 실행
    const deductResult = await this.deductCurrency(
      playerId, fromCurrencyId, fromAmount, 'exchange', 
      `${toCurrencyId}로 교환`, 'exchange_give'
    );

    if (!deductResult.success) {
      return { success: false, error: deductResult.error };
    }

    const addResult = await this.addCurrency(
      playerId, toCurrencyId, netReceived, 'exchange',
      `${fromCurrencyId}에서 교환`, 'exchange_get'
    );

    if (!addResult.success) {
      // 롤백
      await this.addCurrency(
        playerId, fromCurrencyId, fromAmount, 'system', 
        '교환 실패 롤백', 'system_refund'
      );
      return { success: false, error: addResult.error };
    }

    // 교환량 통계 업데이트
    if (!this.stats.exchangeVolume[fromCurrencyId]) {
      this.stats.exchangeVolume[fromCurrencyId] = {};
    }
    this.stats.exchangeVolume[fromCurrencyId][toCurrencyId] = 
      (this.stats.exchangeVolume[fromCurrencyId][toCurrencyId] || 0) + fromAmount;

    logger.info(`화폐 교환: ${playerId} ${fromAmount}${fromCurrencyId} → ${netReceived}${toCurrencyId} (수수료: ${fee})`);

    return { success: true, received: netReceived, fee };
  }

  /**
   * 화폐 잠금 (거래 등에 사용)
   */
  async lockCurrency(
    playerId: string,
    currencyId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const wallet = this.getOrCreateWallet(playerId);
    const currentBalance = wallet.currencies[currencyId] || 0;
    const currentLocked = wallet.lockedAmounts[currencyId] || 0;
    const availableBalance = currentBalance - currentLocked;

    if (availableBalance < amount) {
      return { success: false, error: '잠글 수 있는 잔액이 부족합니다.' };
    }

    wallet.lockedAmounts[currencyId] = currentLocked + amount;
    wallet.lastUpdated = new Date();

    logger.info(`화폐 잠금: ${playerId} ${amount} ${currencyId} (${reason})`);

    return { success: true };
  }

  /**
   * 화폐 잠금 해제
   */
  async unlockCurrency(
    playerId: string,
    currencyId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const wallet = this.getOrCreateWallet(playerId);
    const currentLocked = wallet.lockedAmounts[currencyId] || 0;

    if (currentLocked < amount) {
      return { success: false, error: '잠긴 금액보다 많이 해제할 수 없습니다.' };
    }

    wallet.lockedAmounts[currencyId] = currentLocked - amount;
    wallet.lastUpdated = new Date();

    logger.info(`화폐 잠금 해제: ${playerId} ${amount} ${currencyId} (${reason})`);

    return { success: true };
  }

  /**
   * 화폐 이전 (거래 등)
   */
  async transferCurrency(
    fromPlayerId: string,
    toPlayerId: string,
    currencyId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const currency = this.currencies.get(currencyId);
    if (!currency) {
      return { success: false, error: '존재하지 않는 화폐입니다.' };
    }

    if (!currency.canTrade) {
      return { success: false, error: '거래할 수 없는 화폐입니다.' };
    }

    // 보내는 플레이어에서 차감
    const deductResult = await this.deductCurrency(
      fromPlayerId, currencyId, amount, 'trade',
      `${toPlayerId}에게 전송`, 'trade_send'
    );

    if (!deductResult.success) {
      return { success: false, error: deductResult.error };
    }

    // 받는 플레이어에게 지급
    const addResult = await this.addCurrency(
      toPlayerId, currencyId, amount, 'trade',
      `${fromPlayerId}에게서 수신`, 'trade_receive'
    );

    if (!addResult.success) {
      // 롤백
      await this.addCurrency(
        fromPlayerId, currencyId, amount, 'system',
        '이전 실패 롤백', 'system_refund'
      );
      return { success: false, error: addResult.error };
    }

    logger.info(`화폐 이전: ${fromPlayerId} → ${toPlayerId} ${amount} ${currencyId}`);

    return { success: true };
  }

  // 헬퍼 함수들
  private getDailyLimit(wallet: CurrencyWallet, currencyId: string): DailyLimit {
    const today = new Date();
    today.setHours(this.settings.dailyLimitResetHour, 0, 0, 0);
    
    let limit = wallet.dailyLimits[currencyId];
    if (!limit || limit.resetDate < today) {
      limit = {
        currencyId,
        maxEarn: this.getMaxDailyEarn(currencyId),
        maxSpend: this.getMaxDailySpend(currencyId),
        currentEarn: 0,
        currentSpend: 0,
        resetDate: today
      };
      wallet.dailyLimits[currencyId] = limit;
    }
    
    return limit;
  }

  private getMaxDailyEarn(currencyId: string): number {
    const limits: Record<string, number> = {
      'gold': 100000,
      'premium_coin': 50,
      'honor_point': 1000,
      'guild_token': 500,
      'event_coin': 100
    };
    return limits[currencyId] || 10000;
  }

  private getMaxDailySpend(currencyId: string): number {
    const limits: Record<string, number> = {
      'gold': 500000,
      'premium_coin': 1000,
      'honor_point': 5000,
      'guild_token': 2000,
      'event_coin': 500
    };
    return limits[currencyId] || 50000;
  }

  private async addTransaction(
    wallet: CurrencyWallet,
    transaction: Omit<CurrencyTransaction, 'id' | 'playerId' | 'timestamp'>
  ): Promise<void> {
    const fullTransaction: CurrencyTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: wallet.playerId,
      timestamp: new Date(),
      ...transaction
    };

    wallet.transactions.push(fullTransaction);
    
    // 거래 기록 제한
    if (wallet.transactions.length > this.settings.maxTransactionHistory) {
      wallet.transactions = wallet.transactions.slice(-this.settings.maxTransactionHistory);
    }

    this.transactionQueue.push(fullTransaction);
  }

  private startMaintenanceTasks(): void {
    // 일일 제한 리셋
    setInterval(() => {
      this.resetDailyLimits();
    }, 60 * 60 * 1000); // 1시간마다 확인

    // 통계 업데이트
    setInterval(() => {
      this.updateSystemStatistics();
    }, 5 * 60 * 1000); // 5분마다

    // 인플레이션 모니터링
    setInterval(() => {
      this.monitorInflation();
    }, 24 * 60 * 60 * 1000); // 24시간마다
  }

  private resetDailyLimits(): void {
    const now = new Date();
    const resetHour = this.settings.dailyLimitResetHour;
    
    if (now.getHours() === resetHour && now.getMinutes() === 0) {
      this.wallets.forEach(wallet => {
        Object.values(wallet.dailyLimits).forEach(limit => {
          limit.currentEarn = 0;
          limit.currentSpend = 0;
          limit.resetDate = new Date(now);
        });
      });
      
      // 일일 거래량 리셋
      Object.keys(this.stats.dailyVolume).forEach(currencyId => {
        this.stats.dailyVolume[currencyId] = 0;
      });
      
      logger.info('일일 제한 및 통계 리셋 완료');
    }
  }

  private updateSystemStatistics(): void {
    // 활성 지갑 수 업데이트
    this.stats.activeWallets = this.wallets.size;

    // 상위 보유자 업데이트
    this.stats.topHolders = [];
    this.currencies.forEach((currency, currencyId) => {
      const holders = Array.from(this.wallets.entries())
        .map(([playerId, wallet]) => ({
          playerId,
          playerName: playerId, // 실제로는 플레이어 이름 조회
          amount: wallet.currencies[currencyId] || 0,
          currencyId
        }))
        .filter(holder => holder.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);
      
      this.stats.topHolders.push(...holders);
    });

    // 총 유통량 재계산
    this.currencies.forEach((currency, currencyId) => {
      let totalSupply = 0;
      this.wallets.forEach(wallet => {
        totalSupply += wallet.currencies[currencyId] || 0;
      });
      this.stats.totalSupply[currencyId] = totalSupply;
    });
  }

  private monitorInflation(): void {
    if (!this.settings.inflationControl) return;

    this.currencies.forEach((currency, currencyId) => {
      const currentSupply = this.stats.totalSupply[currencyId] || 0;
      const dailyVolume = this.stats.dailyVolume[currencyId] || 0;
      
      // 간단한 인플레이션 지표 계산
      const inflationRate = currentSupply > 0 ? (dailyVolume / currentSupply) * 100 : 0;
      this.stats.inflationRate[currencyId] = inflationRate;
      
      // 인플레이션이 높으면 경고
      if (inflationRate > 10) { // 10% 이상
        logger.warn(`높은 인플레이션 감지: ${currencyId} - ${inflationRate.toFixed(2)}%`);
      }
    });
  }

  /**
   * 공개 API 메서드들
   */
  getCurrency(currencyId: string): Currency | null {
    return this.currencies.get(currencyId) || null;
  }

  getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values());
  }

  getPlayerBalance(playerId: string, currencyId?: string): Record<string, number> | number {
    const wallet = this.wallets.get(playerId);
    if (!wallet) {
      return currencyId ? 0 : {};
    }
    
    if (currencyId) {
      return wallet.currencies[currencyId] || 0;
    }
    
    return { ...wallet.currencies };
  }

  getPlayerAvailableBalance(playerId: string, currencyId: string): number {
    const wallet = this.wallets.get(playerId);
    if (!wallet) return 0;
    
    const balance = wallet.currencies[currencyId] || 0;
    const locked = wallet.lockedAmounts[currencyId] || 0;
    return Math.max(0, balance - locked);
  }

  getPlayerTransactions(playerId: string, currencyId?: string, limit: number = 50): CurrencyTransaction[] {
    const wallet = this.wallets.get(playerId);
    if (!wallet) return [];
    
    let transactions = wallet.transactions;
    
    if (currencyId) {
      transactions = transactions.filter(tx => tx.currencyId === currencyId);
    }
    
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  getExchangeRate(fromCurrency: string, toCurrency: string): ExchangeRate | null {
    const key = `${fromCurrency}_to_${toCurrency}`;
    return this.exchangeRates.get(key) || null;
  }

  getAvailableExchanges(currencyId: string): ExchangeRate[] {
    return Array.from(this.exchangeRates.values())
      .filter(rate => rate.fromCurrency === currencyId && rate.isActive);
  }

  getShop(shopId: string): CurrencyShop | null {
    return this.shops.get(shopId) || null;
  }

  getAllShops(): CurrencyShop[] {
    return Array.from(this.shops.values()).filter(shop => shop.isActive);
  }

  getSystemStats(): CurrencySystemStats {
    return { ...this.stats };
  }

  getSettings(): CurrencySystemSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<CurrencySystemSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  // 관리자 기능
  async adminAddCurrency(
    playerId: string,
    currencyId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    return await this.addCurrency(playerId, currencyId, amount, 'admin', reason, 'admin_add');
  }

  async adminRemoveCurrency(
    playerId: string,
    currencyId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    return await this.deductCurrency(playerId, currencyId, amount, 'admin', reason, 'admin_remove');
  }

  async createCurrency(currency: Currency): Promise<{ success: boolean; error?: string }> {
    if (this.currencies.has(currency.id)) {
      return { success: false, error: '이미 존재하는 화폐 ID입니다.' };
    }

    this.currencies.set(currency.id, currency);
    this.stats.totalSupply[currency.id] = 0;
    this.stats.dailyVolume[currency.id] = 0;
    this.stats.inflationRate[currency.id] = 0;

    logger.info(`새 화폐 생성: ${currency.name} (${currency.id})`);

    return { success: true };
  }

  updateExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    newRate: number,
    newFee?: number
  ): { success: boolean; error?: string } {
    const key = `${fromCurrency}_to_${toCurrency}`;
    const exchangeRate = this.exchangeRates.get(key);
    
    if (!exchangeRate) {
      return { success: false, error: '존재하지 않는 교환 조합입니다.' };
    }

    exchangeRate.rate = newRate;
    if (newFee !== undefined) {
      exchangeRate.fee = newFee;
    }
    exchangeRate.lastUpdated = new Date();

    logger.info(`교환 비율 업데이트: ${fromCurrency} → ${toCurrency} = ${newRate} (수수료: ${exchangeRate.fee}%)`);

    return { success: true };
  }
}

// 전역 화폐 시스템 인스턴스
export const currencySystem = new CurrencySystem();

// 화폐 관련 유틸리티
export const currencyUtils = {
  /**
   * 화폐 금액 포맷팅
   */
  formatAmount(amount: number, currency?: Currency): string {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString();
  },

  /**
   * 화폐 심볼과 함께 포맷팅
   */
  formatWithSymbol(amount: number, currency: Currency): string {
    const formattedAmount = currencyUtils.formatAmount(amount, currency);
    return `${formattedAmount}${currency.symbol}`;
  },

  /**
   * 거래 타입 표시명
   */
  getTransactionTypeDisplayName(type: TransactionType): string {
    const names: Record<TransactionType, string> = {
      earn_monster: '몬스터 처치',
      earn_quest: '퀘스트 완료',
      earn_daily: '일일 보상',
      earn_event: '이벤트 보상',
      spend_shop: '상점 구매',
      spend_upgrade: '강화 비용',
      spend_service: '서비스 이용',
      spend_tax: '세금',
      trade_send: '거래 지급',
      trade_receive: '거래 수령',
      exchange_give: '교환 지급',
      exchange_get: '교환 수령',
      admin_add: '관리자 지급',
      admin_remove: '관리자 차감',
      system_refund: '시스템 환불',
      system_correction: '시스템 보정'
    };
    return names[type] || type;
  },

  /**
   * 화폐 희귀도 색상
   */
  getRarityColor(rarity: string): string {
    const colors = {
      common: '#ffffff',
      uncommon: '#1eff00',
      rare: '#0070dd',
      epic: '#a335ee',
      legendary: '#ff8000'
    };
    return colors[rarity as keyof typeof colors] || '#ffffff';
  },

  /**
   * 교환 수수료 계산
   */
  calculateExchangeFee(amount: number, rate: number, feeRate: number): number {
    const grossReceived = Math.floor(amount * rate);
    return Math.floor(grossReceived * (feeRate / 100));
  }
};
