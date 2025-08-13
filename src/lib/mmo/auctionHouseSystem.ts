import { Player } from '@/types/game';
import { logger } from '../logger';

// 경매 아이템
interface AuctionItem {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  itemType: string;
  itemGrade: string;
  quantity: number;
  description: string;
  enchantLevel?: number;
  rarity: string;
  metadata?: any;
  imageUrl?: string;
}

// 경매 리스팅
interface AuctionListing {
  id: string;
  item: AuctionItem;
  startingPrice: number;
  currentPrice: number;
  buyoutPrice?: number;
  duration: number; // 시간 (분 단위)
  createdAt: Date;
  expiresAt: Date;
  status: AuctionStatus;
  bidHistory: AuctionBid[];
  currentHighestBid?: AuctionBid;
  watchers: string[]; // 관심 목록에 추가한 플레이어들
  views: number;
  category: AuctionCategory;
  tags: string[];
  soldAt?: Date;
  soldPrice?: number;
  cancelledAt?: Date;
  cancelReason?: string;
  listingFee: number;
  commissionRate: number; // 판매 수수료율
}

// 경매 상태
type AuctionStatus = 'active' | 'sold' | 'expired' | 'cancelled' | 'pending_payment';

// 경매 카테고리
type AuctionCategory = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'misc' | 'all';

// 경매 입찰
interface AuctionBid {
  id: string;
  listingId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
  isWinning: boolean;
  isOutbid: boolean;
  autoBid?: AutoBidSettings;
}

// 자동 입찰 설정
interface AutoBidSettings {
  maxAmount: number;
  increment: number;
  isActive: boolean;
}

// 경매장 검색 필터
interface AuctionSearchFilter {
  category?: AuctionCategory;
  itemName?: string;
  itemType?: string;
  minPrice?: number;
  maxPrice?: number;
  minLevel?: number;
  maxLevel?: number;
  rarity?: string[];
  sellerId?: string;
  hasStock?: boolean;
  sortBy?: AuctionSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 정렬 기준
type AuctionSortBy = 'price' | 'time_left' | 'created_at' | 'popularity' | 'level';

// 관심 목록
interface WatchList {
  playerId: string;
  listings: string[];
  notifications: boolean;
  updatedAt: Date;
}

// 경매장 통계
interface AuctionStats {
  totalListings: number;
  activeListings: number;
  soldToday: number;
  soldThisWeek: number;
  totalVolume: number;
  averagePrice: number;
  popularCategories: Record<AuctionCategory, number>;
  topSellers: Array<{ playerId: string; playerName: string; sales: number; volume: number }>;
  priceHistory: Array<{ date: Date; averagePrice: number; volume: number }>;
}

// 경매장 설정
interface AuctionHouseSettings {
  maxListingsPerPlayer: number;
  maxListingDuration: number; // 최대 경매 기간 (시간)
  minListingDuration: number; // 최소 경매 기간 (시간)
  baseLis tingFee: number;
  baseCommissionRate: number; // 기본 수수료율 (%)
  maxBuyoutPriceMultiplier: number; // 즉시구매가 최대 배수
  bidIncrement: number; // 최소 입찰 증가액
  autoBidMaxIncrement: number;
  searchResultsLimit: number;
  featuredListingCost: number;
  premiumListingBenefits: string[];
}

export class AuctionHouseSystem {
  private listings: Map<string, AuctionListing> = new Map();
  private bids: Map<string, AuctionBid> = new Map();
  private watchLists: Map<string, WatchList> = new Map();
  private playerListings: Map<string, string[]> = new Map(); // playerId -> listingIds
  private categoryCache: Map<AuctionCategory, string[]> = new Map();
  private priceHistory: Map<string, Array<{ date: Date; price: number }>> = new Map();
  private settings: AuctionHouseSettings;
  private stats: AuctionStats;

  constructor() {
    this.settings = {
      maxListingsPerPlayer: 20,
      maxListingDuration: 168, // 7일
      minListingDuration: 1, // 1시간
      baseLis tingFee: 100,
      baseCommissionRate: 5,
      maxBuyoutPriceMultiplier: 10,
      bidIncrement: 100,
      autoBidMaxIncrement: 1000,
      searchResultsLimit: 50,
      featuredListingCost: 1000,
      premiumListingBenefits: ['표시 우선순위', '더 많은 노출', '상세 통계']
    };

    this.stats = {
      totalListings: 0,
      activeListings: 0,
      soldToday: 0,
      soldThisWeek: 0,
      totalVolume: 0,
      averagePrice: 0,
      popularCategories: {} as Record<AuctionCategory, number>,
      topSellers: [],
      priceHistory: []
    };

    this.initializeCategories();
    this.startMaintenanceTasks();
  }

  /**
   * 카테고리 초기화
   */
  private initializeCategories(): void {
    const categories: AuctionCategory[] = ['weapon', 'armor', 'accessory', 'consumable', 'material', 'misc'];
    categories.forEach(category => {
      this.categoryCache.set(category, []);
      this.stats.popularCategories[category] = 0;
    });
  }

  /**
   * 아이템 경매 등록
   */
  async createListing(
    sellerId: string,
    itemId: string,
    quantity: number,
    startingPrice: number,
    duration: number,
    buyoutPrice?: number,
    category?: AuctionCategory
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    
    const seller = await this.getPlayerInfo(sellerId);
    if (!seller) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 아이템 보유 확인
    const playerItem = await this.getPlayerItem(sellerId, itemId);
    if (!playerItem) {
      return { success: false, error: '보유하지 않은 아이템입니다.' };
    }

    if (playerItem.quantity < quantity) {
      return { success: false, error: '수량이 부족합니다.' };
    }

    // 등록 제한 확인
    const playerListingIds = this.playerListings.get(sellerId) || [];
    if (playerListingIds.length >= this.settings.maxListingsPerPlayer) {
      return { success: false, error: `최대 ${this.settings.maxListingsPerPlayer}개까지만 등록할 수 있습니다.` };
    }

    // 기간 제한 확인
    if (duration < this.settings.minListingDuration || duration > this.settings.maxListingDuration) {
      return { success: false, error: `경매 기간은 ${this.settings.minListingDuration}-${this.settings.maxListingDuration}시간 사이여야 합니다.` };
    }

    // 즉시구매가 검증
    if (buyoutPrice && buyoutPrice < startingPrice) {
      return { success: false, error: '즉시구매가는 시작가보다 높아야 합니다.' };
    }

    if (buyoutPrice && buyoutPrice > startingPrice * this.settings.maxBuyoutPriceMultiplier) {
      return { success: false, error: `즉시구매가는 시작가의 ${this.settings.maxBuyoutPriceMultiplier}배를 초과할 수 없습니다.` };
    }

    // 등록 수수료 확인
    const listingFee = this.calculateListingFee(startingPrice, duration);
    if (seller.gold < listingFee) {
      return { success: false, error: '등록 수수료가 부족합니다.' };
    }

    const listingId = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);

    const auctionItem: AuctionItem = {
      id: `item_${listingId}`,
      sellerId,
      sellerName: seller.name,
      itemId,
      itemName: playerItem.name,
      itemType: playerItem.type,
      itemGrade: playerItem.grade || 'common',
      quantity,
      description: playerItem.description || '',
      enchantLevel: playerItem.enchantLevel,
      rarity: playerItem.rarity,
      metadata: playerItem.metadata,
      imageUrl: playerItem.imageUrl
    };

    const listing: AuctionListing = {
      id: listingId,
      item: auctionItem,
      startingPrice,
      currentPrice: startingPrice,
      buyoutPrice,
      duration,
      createdAt: now,
      expiresAt,
      status: 'active',
      bidHistory: [],
      watchers: [],
      views: 0,
      category: category || this.determineCategory(playerItem),
      tags: this.generateTags(playerItem),
      listingFee,
      commissionRate: this.settings.baseCommissionRate
    };

    // 아이템 차감 (실제로는 임시 보관)
    await this.reservePlayerItem(sellerId, itemId, quantity);
    
    // 등록 수수료 차감
    await this.deductPlayerGold(sellerId, listingFee);

    this.listings.set(listingId, listing);
    
    // 플레이어 등록 목록 업데이트
    playerListingIds.push(listingId);
    this.playerListings.set(sellerId, playerListingIds);

    // 카테고리 캐시 업데이트
    const categoryListings = this.categoryCache.get(listing.category) || [];
    categoryListings.push(listingId);
    this.categoryCache.set(listing.category, categoryListings);

    // 통계 업데이트
    this.stats.totalListings++;
    this.stats.activeListings++;

    logger.info(`경매 등록: ${seller.name} - ${playerItem.name} x${quantity} (${startingPrice}G)`);

    return { success: true, listingId };
  }

  /**
   * 입찰하기
   */
  async placeBid(
    listingId: string,
    bidderId: string,
    amount: number,
    autoBidSettings?: AutoBidSettings
  ): Promise<{ success: boolean; bidId?: string; error?: string; outbidPrevious?: boolean }> {
    
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, error: '경매를 찾을 수 없습니다.' };
    }

    if (listing.status !== 'active') {
      return { success: false, error: '활성 상태가 아닌 경매입니다.' };
    }

    if (new Date() > listing.expiresAt) {
      return { success: false, error: '마감된 경매입니다.' };
    }

    if (listing.item.sellerId === bidderId) {
      return { success: false, error: '자신의 경매에는 입찰할 수 없습니다.' };
    }

    const bidder = await this.getPlayerInfo(bidderId);
    if (!bidder) {
      return { success: false, error: '플레이어 정보를 찾을 수 없습니다.' };
    }

    // 최소 입찰가 확인
    const minimumBid = listing.currentPrice + this.settings.bidIncrement;
    if (amount < minimumBid) {
      return { success: false, error: `최소 입찰가는 ${minimumBid} 골드입니다.` };
    }

    // 골드 확인
    if (bidder.gold < amount) {
      return { success: false, error: '골드가 부족합니다.' };
    }

    // 즉시구매가 확인
    if (listing.buyoutPrice && amount >= listing.buyoutPrice) {
      return await this.buyoutItem(listingId, bidderId);
    }

    const bidId = `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const bid: AuctionBid = {
      id: bidId,
      listingId,
      bidderId,
      bidderName: bidder.name,
      amount,
      timestamp: new Date(),
      isWinning: true,
      isOutbid: false,
      autoBid: autoBidSettings
    };

    // 이전 최고 입찰자 처리
    let outbidPrevious = false;
    if (listing.currentHighestBid) {
      listing.currentHighestBid.isWinning = false;
      listing.currentHighestBid.isOutbid = true;
      outbidPrevious = true;
      
      // 이전 입찰자에게 골드 반환
      await this.refundBid(listing.currentHighestBid);
      
      // 자동 입찰 처리
      if (listing.currentHighestBid.autoBid?.isActive) {
        await this.processAutoBid(listing, listing.currentHighestBid, amount);
      }
    }

    // 새로운 입찰 처리
    await this.lockPlayerGold(bidderId, amount);
    
    listing.currentPrice = amount;
    listing.currentHighestBid = bid;
    listing.bidHistory.push(bid);
    
    this.bids.set(bidId, bid);

    // 마감 시간 연장 (스나이핑 방지)
    const timeLeft = listing.expiresAt.getTime() - Date.now();
    if (timeLeft < 5 * 60 * 1000) { // 5분 미만 남은 경우
      listing.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 연장
    }

    // 관심 목록 플레이어들에게 알림
    await this.notifyWatchers(listing, 'bid_placed', { bidderName: bidder.name, amount });

    logger.info(`입찰: ${bidder.name} - ${listing.item.itemName} (${amount}G)`);

    return { success: true, bidId, outbidPrevious };
  }

  /**
   * 즉시 구매
   */
  async buyoutItem(
    listingId: string,
    buyerId: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, error: '경매를 찾을 수 없습니다.' };
    }

    if (!listing.buyoutPrice) {
      return { success: false, error: '즉시구매가 설정되지 않은 경매입니다.' };
    }

    if (listing.status !== 'active') {
      return { success: false, error: '활성 상태가 아닌 경매입니다.' };
    }

    if (listing.item.sellerId === buyerId) {
      return { success: false, error: '자신의 경매는 구매할 수 없습니다.' };
    }

    const buyer = await this.getPlayerInfo(buyerId);
    if (!buyer) {
      return { success: false, error: '구매자 정보를 찾을 수 없습니다.' };
    }

    if (buyer.gold < listing.buyoutPrice) {
      return { success: false, error: '골드가 부족합니다.' };
    }

    // 거래 실행
    await this.completeSale(listing, buyerId, listing.buyoutPrice);

    logger.info(`즉시구매: ${buyer.name} - ${listing.item.itemName} (${listing.buyoutPrice}G)`);

    return { success: true };
  }

  /**
   * 경매 취소
   */
  async cancelListing(
    listingId: string,
    sellerId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, error: '경매를 찾을 수 없습니다.' };
    }

    if (listing.item.sellerId !== sellerId) {
      return { success: false, error: '자신의 경매만 취소할 수 있습니다.' };
    }

    if (listing.status !== 'active') {
      return { success: false, error: '활성 상태가 아닌 경매입니다.' };
    }

    // 입찰이 있는 경우 취소 제한
    if (listing.bidHistory.length > 0) {
      return { success: false, error: '입찰이 있는 경매는 취소할 수 없습니다.' };
    }

    listing.status = 'cancelled';
    listing.cancelledAt = new Date();
    listing.cancelReason = reason;

    // 아이템 반환
    await this.returnReservedItem(listing);

    // 통계 업데이트
    this.stats.activeListings--;

    // 플레이어 등록 목록에서 제거
    const playerListingIds = this.playerListings.get(sellerId) || [];
    const index = playerListingIds.indexOf(listingId);
    if (index > -1) {
      playerListingIds.splice(index, 1);
      this.playerListings.set(sellerId, playerListingIds);
    }

    logger.info(`경매 취소: ${listing.item.sellerName} - ${listing.item.itemName}`);

    return { success: true };
  }

  /**
   * 경매 검색
   */
  async searchListings(filters: AuctionSearchFilter): Promise<{
    listings: AuctionListing[];
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    
    let filteredListings = Array.from(this.listings.values())
      .filter(listing => listing.status === 'active');

    // 필터 적용
    if (filters.category && filters.category !== 'all') {
      filteredListings = filteredListings.filter(listing => listing.category === filters.category);
    }

    if (filters.itemName) {
      const searchTerm = filters.itemName.toLowerCase();
      filteredListings = filteredListings.filter(listing => 
        listing.item.itemName.toLowerCase().includes(searchTerm) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.itemType) {
      filteredListings = filteredListings.filter(listing => listing.item.itemType === filters.itemType);
    }

    if (filters.minPrice !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.currentPrice >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filteredListings = filteredListings.filter(listing => listing.currentPrice <= filters.maxPrice!);
    }

    if (filters.rarity && filters.rarity.length > 0) {
      filteredListings = filteredListings.filter(listing => filters.rarity!.includes(listing.item.rarity));
    }

    if (filters.sellerId) {
      filteredListings = filteredListings.filter(listing => listing.item.sellerId === filters.sellerId);
    }

    if (filters.hasStock) {
      filteredListings = filteredListings.filter(listing => listing.item.quantity > 0);
    }

    // 정렬
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    
    filteredListings.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'price':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'time_left':
          aValue = a.expiresAt.getTime() - Date.now();
          bValue = b.expiresAt.getTime() - Date.now();
          break;
        case 'created_at':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'popularity':
          aValue = a.views + a.bidHistory.length + a.watchers.length;
          bValue = b.views + b.bidHistory.length + b.watchers.length;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // 페이지네이션
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || this.settings.searchResultsLimit, this.settings.searchResultsLimit);
    const totalCount = filteredListings.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedListings = filteredListings.slice(startIndex, endIndex);

    // 조회수 증가
    paginatedListings.forEach(listing => {
      listing.views++;
    });

    return {
      listings: paginatedListings,
      totalCount,
      page,
      totalPages
    };
  }

  /**
   * 관심 목록에 추가
   */
  async addToWatchList(playerId: string, listingId: string): Promise<{ success: boolean; error?: string }> {
    const listing = this.listings.get(listingId);
    if (!listing) {
      return { success: false, error: '경매를 찾을 수 없습니다.' };
    }

    if (listing.item.sellerId === playerId) {
      return { success: false, error: '자신의 경매는 관심 목록에 추가할 수 없습니다.' };
    }

    let watchList = this.watchLists.get(playerId);
    if (!watchList) {
      watchList = {
        playerId,
        listings: [],
        notifications: true,
        updatedAt: new Date()
      };
      this.watchLists.set(playerId, watchList);
    }

    if (watchList.listings.includes(listingId)) {
      return { success: false, error: '이미 관심 목록에 추가된 경매입니다.' };
    }

    watchList.listings.push(listingId);
    watchList.updatedAt = new Date();

    // 경매 관찰자 목록에 추가
    if (!listing.watchers.includes(playerId)) {
      listing.watchers.push(playerId);
    }

    return { success: true };
  }

  /**
   * 관심 목록에서 제거
   */
  async removeFromWatchList(playerId: string, listingId: string): Promise<{ success: boolean; error?: string }> {
    const watchList = this.watchLists.get(playerId);
    if (!watchList) {
      return { success: false, error: '관심 목록이 없습니다.' };
    }

    const index = watchList.listings.indexOf(listingId);
    if (index === -1) {
      return { success: false, error: '관심 목록에 없는 경매입니다.' };
    }

    watchList.listings.splice(index, 1);
    watchList.updatedAt = new Date();

    // 경매 관찰자 목록에서 제거
    const listing = this.listings.get(listingId);
    if (listing) {
      const watcherIndex = listing.watchers.indexOf(playerId);
      if (watcherIndex > -1) {
        listing.watchers.splice(watcherIndex, 1);
      }
    }

    return { success: true };
  }

  // 내부 헬퍼 함수들
  private async completeSale(listing: AuctionListing, buyerId: string, price: number): Promise<void> {
    listing.status = 'sold';
    listing.soldAt = new Date();
    listing.soldPrice = price;

    // 구매자에게 아이템 지급
    await this.transferItemToBuyer(listing, buyerId);

    // 판매자에게 골드 지급 (수수료 제외)
    const commission = Math.floor(price * (listing.commissionRate / 100));
    const sellerReceives = price - commission;
    await this.paySellerGold(listing.item.sellerId, sellerReceives);

    // 이전 입찰자들에게 골드 반환
    if (listing.currentHighestBid && listing.currentHighestBid.bidderId !== buyerId) {
      await this.refundBid(listing.currentHighestBid);
    }

    // 통계 업데이트
    this.updateSaleStatistics(listing, price);

    // 가격 기록 업데이트
    this.updatePriceHistory(listing.item.itemId, price);

    // 관찰자들에게 알림
    await this.notifyWatchers(listing, 'sold', { price, buyerName: buyerId });
  }

  private calculateListingFee(startingPrice: number, duration: number): number {
    const baseFee = this.settings.baseLis tingFee;
    const priceFee = Math.floor(startingPrice * 0.01); // 1%
    const durationFee = Math.floor(duration * 10); // 시간당 10골드
    return baseFee + priceFee + durationFee;
  }

  private determineCategory(item: any): AuctionCategory {
    // 아이템 타입에 따른 카테고리 자동 분류
    if (item.type?.includes('weapon')) return 'weapon';
    if (item.type?.includes('armor')) return 'armor';
    if (item.type?.includes('accessory')) return 'accessory';
    if (item.type?.includes('potion') || item.type?.includes('consumable')) return 'consumable';
    if (item.type?.includes('material') || item.type?.includes('ore')) return 'material';
    return 'misc';
  }

  private generateTags(item: any): string[] {
    const tags: string[] = [];
    
    if (item.enchantLevel > 0) tags.push(`+${item.enchantLevel}`);
    if (item.rarity) tags.push(item.rarity);
    if (item.grade) tags.push(item.grade);
    if (item.level) tags.push(`레벨${item.level}`);
    
    return tags;
  }

  private async processAutoBid(listing: AuctionListing, previousBid: AuctionBid, newBidAmount: number): Promise<void> {
    const autoBid = previousBid.autoBid!;
    if (!autoBid.isActive || newBidAmount >= autoBid.maxAmount) return;

    const nextBidAmount = Math.min(
      newBidAmount + Math.min(autoBid.increment, this.settings.autoBidMaxIncrement),
      autoBid.maxAmount
    );

    if (nextBidAmount <= newBidAmount) return;

    // 자동 입찰 실행
    setTimeout(async () => {
      await this.placeBid(listing.id, previousBid.bidderId, nextBidAmount, autoBid);
    }, 1000); // 1초 후 자동 입찰
  }

  private startMaintenanceTasks(): void {
    // 만료된 경매 처리
    setInterval(() => {
      this.processExpiredListings();
    }, 60000); // 1분마다

    // 통계 업데이트
    setInterval(() => {
      this.updateSystemStatistics();
    }, 5 * 60000); // 5분마다

    // 가격 기록 정리
    setInterval(() => {
      this.cleanupPriceHistory();
    }, 24 * 60 * 60000); // 24시간마다
  }

  private async processExpiredListings(): Promise<void> {
    const now = new Date();
    const expiredListings = Array.from(this.listings.values())
      .filter(listing => listing.status === 'active' && now > listing.expiresAt);

    for (const listing of expiredListings) {
      if (listing.currentHighestBid) {
        // 최고 입찰자가 있으면 판매 완료
        await this.completeSale(listing, listing.currentHighestBid.bidderId, listing.currentHighestBid.amount);
      } else {
        // 입찰이 없으면 만료 처리
        listing.status = 'expired';
        await this.returnReservedItem(listing);
        this.stats.activeListings--;
      }
    }
  }

  private updateSaleStatistics(listing: AuctionListing, price: number): void {
    this.stats.soldToday++;
    this.stats.soldThisWeek++;
    this.stats.totalVolume += price;
    this.stats.activeListings--;
    this.stats.popularCategories[listing.category]++;
  }

  private updatePriceHistory(itemId: string, price: number): void {
    let history = this.priceHistory.get(itemId) || [];
    history.push({ date: new Date(), price });
    
    // 최근 30일 데이터만 보관
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    history = history.filter(entry => entry.date > cutoff);
    
    this.priceHistory.set(itemId, history);
  }

  private async notifyWatchers(listing: AuctionListing, event: string, data: any): Promise<void> {
    // 실제로는 알림 시스템과 연동
    logger.info(`경매 알림 [${listing.id}] ${event}:`, data);
  }

  // 실제로는 다른 시스템과 연동해야 할 함수들
  private async getPlayerInfo(playerId: string): Promise<Player | null> {
    return null;
  }

  private async getPlayerItem(playerId: string, itemId: string): Promise<any> {
    return null;
  }

  private async reservePlayerItem(playerId: string, itemId: string, quantity: number): Promise<void> {
    // 실제 구현 필요
  }

  private async returnReservedItem(listing: AuctionListing): Promise<void> {
    // 실제 구현 필요
  }

  private async transferItemToBuyer(listing: AuctionListing, buyerId: string): Promise<void> {
    // 실제 구현 필요
  }

  private async deductPlayerGold(playerId: string, amount: number): Promise<void> {
    // 실제 구현 필요
  }

  private async lockPlayerGold(playerId: string, amount: number): Promise<void> {
    // 실제 구현 필요
  }

  private async refundBid(bid: AuctionBid): Promise<void> {
    // 실제 구현 필요
  }

  private async paySellerGold(sellerId: string, amount: number): Promise<void> {
    // 실제 구현 필요
  }

  private updateSystemStatistics(): void {
    // 시스템 통계 업데이트
    const activeListings = Array.from(this.listings.values())
      .filter(listing => listing.status === 'active');
    
    this.stats.activeListings = activeListings.length;
    
    if (activeListings.length > 0) {
      const totalPrice = activeListings.reduce((sum, listing) => sum + listing.currentPrice, 0);
      this.stats.averagePrice = Math.floor(totalPrice / activeListings.length);
    }
  }

  private cleanupPriceHistory(): void {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.priceHistory.forEach((history, itemId) => {
      const filtered = history.filter(entry => entry.date > cutoff);
      if (filtered.length === 0) {
        this.priceHistory.delete(itemId);
      } else {
        this.priceHistory.set(itemId, filtered);
      }
    });
  }

  /**
   * 공개 API 메서드들
   */
  getListing(listingId: string): AuctionListing | null {
    return this.listings.get(listingId) || null;
  }

  getPlayerListings(playerId: string): AuctionListing[] {
    const listingIds = this.playerListings.get(playerId) || [];
    return listingIds.map(id => this.listings.get(id)).filter(Boolean) as AuctionListing[];
  }

  getPlayerWatchList(playerId: string): AuctionListing[] {
    const watchList = this.watchLists.get(playerId);
    if (!watchList) return [];
    
    return watchList.listings
      .map(id => this.listings.get(id))
      .filter(Boolean) as AuctionListing[];
  }

  getPlayerBids(playerId: string): AuctionBid[] {
    return Array.from(this.bids.values())
      .filter(bid => bid.bidderId === playerId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getItemPriceHistory(itemId: string): Array<{ date: Date; price: number }> {
    return this.priceHistory.get(itemId) || [];
  }

  getSystemStats(): AuctionStats {
    return { ...this.stats };
  }

  getSettings(): AuctionHouseSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<AuctionHouseSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// 전역 경매장 시스템 인스턴스
export const auctionHouseSystem = new AuctionHouseSystem();

// 경매장 관련 유틸리티
export const auctionUtils = {
  /**
   * 남은 시간 포맷팅
   */
  formatTimeLeft(expiresAt: Date): string {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return '마감';
    
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 ${hours % 24}시간`;
    }
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    
    return `${minutes}분`;
  },

  /**
   * 가격 포맷팅
   */
  formatPrice(price: number): string {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toLocaleString();
  },

  /**
   * 카테고리 표시명
   */
  getCategoryDisplayName(category: AuctionCategory): string {
    const names = {
      weapon: '무기',
      armor: '방어구',
      accessory: '액세서리',
      consumable: '소모품',
      material: '재료',
      misc: '기타',
      all: '전체'
    };
    return names[category];
  },

  /**
   * 경매 상태 표시명
   */
  getStatusDisplayName(status: AuctionStatus): string {
    const names = {
      active: '진행 중',
      sold: '판매됨',
      expired: '마감됨',
      cancelled: '취소됨',
      pending_payment: '결제 대기'
    };
    return names[status];
  }
};
