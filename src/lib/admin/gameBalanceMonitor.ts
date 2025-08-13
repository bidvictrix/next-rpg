import { Player } from '@/types/game';
import { logger } from '../logger';

// 밸런스 메트릭 타입
type BalanceMetricType = 
  | 'level_distribution' | 'class_distribution' | 'skill_usage' | 'item_economy'
  | 'monster_difficulty' | 'quest_completion' | 'pvp_balance' | 'progression_rate'
  | 'resource_flow' | 'market_prices' | 'power_creep' | 'engagement_metrics';

// 밸런스 지표
interface BalanceMetric {
  id: string;
  type: BalanceMetricType;
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  tolerance: number; // 허용 오차 (%)
  trend: TrendDirection;
  severity: MetricSeverity;
  lastUpdated: Date;
  historicalData: HistoricalDataPoint[];
  threshold: MetricThreshold;
  category: MetricCategory;
}

// 트렌드 방향
type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';

// 지표 심각도
type MetricSeverity = 'normal' | 'warning' | 'critical' | 'emergency';

// 히스토리 데이터 포인트
interface HistoricalDataPoint {
  timestamp: Date;
  value: number;
  context?: string; // 컨텍스트 정보 (이벤트, 업데이트 등)
}

// 지표 임계값
interface MetricThreshold {
  warning: { min?: number; max?: number };
  critical: { min?: number; max?: number };
  emergency: { min?: number; max?: number };
}

// 지표 카테고리
type MetricCategory = 'player' | 'economy' | 'content' | 'social' | 'technical';

// 밸런스 이슈
interface BalanceIssue {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  affectedMetrics: string[];
  detectedAt: Date;
  status: IssueStatus;
  priority: IssuePriority;
  impact: IssueImpact;
  recommendations: Recommendation[];
  relatedData: Record<string, unknown>;
  assignedTo?: string;
  resolvedAt?: Date;
  notes: IssueNote[];
}

// 이슈 심각도
type IssueSeverity = 'minor' | 'moderate' | 'major' | 'critical' | 'game_breaking';

// 이슈 카테고리
type IssueCategory = 
  | 'class_imbalance' | 'item_imbalance' | 'progression_issue' | 'economy_issue'
  | 'content_difficulty' | 'pvp_imbalance' | 'exploit' | 'engagement_drop';

// 이슈 상태
type IssueStatus = 'open' | 'investigating' | 'in_progress' | 'testing' | 'resolved' | 'wont_fix';

// 이슈 우선순위
type IssuePriority = 'low' | 'normal' | 'high' | 'urgent' | 'emergency';

// 이슈 영향도
interface IssueImpact {
  playerAffected: number; // 영향받는 플레이어 수
  revenueImpact: number; // 수익 영향 (%)
  retentionImpact: number; // 유지율 영향 (%)
  gameplayImpact: 'minor' | 'moderate' | 'major' | 'severe';
}

// 추천사항
interface Recommendation {
  type: 'immediate' | 'short_term' | 'long_term';
  action: string;
  description: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  estimatedImpact: 'low' | 'medium' | 'high';
  risks: string[];
}

// 이슈 노트
interface IssueNote {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'comment' | 'update' | 'resolution';
}

// 클래스 밸런스 분석
interface ClassBalanceAnalysis {
  className: string;
  playerCount: number;
  averageLevel: number;
  winRate: number; // PvP 승률
  popularityScore: number; // 인기도 점수
  progressionRate: number; // 진행 속도
  retentionRate: number; // 유지율
  skillUsageStats: Record<string, number>;
  itemPreferences: Record<string, number>;
  balanceScore: number; // 0-100 점
  issues: string[];
  recommendations: string[];
}

// 아이템 경제 분석
interface ItemEconomyAnalysis {
  itemId: string;
  itemName: string;
  currentPrice: number;
  targetPrice: number;
  priceVolatility: number;
  supply: number;
  demand: number;
  marketShare: number; // 시장 점유율 (%)
  usageFrequency: number;
  dropRate: number;
  inflationRate: number; // 인플레이션율 (%)
  economicImpact: 'positive' | 'neutral' | 'negative';
  priceHistory: Array<{ timestamp: Date; price: number; volume: number }>;
}

// 콘텐츠 난이도 분석
interface ContentDifficultyAnalysis {
  contentId: string;
  contentName: string;
  type: 'quest' | 'dungeon' | 'raid' | 'pvp' | 'event';
  difficulty: number; // 1-10
  completionRate: number; // 완료율 (%)
  averageAttempts: number;
  averageTime: number; // 완료 시간 (분)
  playerFeedback: number; // 1-5 점
  recommendedLevel: number;
  actualPlayerLevel: number; // 실제 도전 플레이어 평균 레벨
  difficultyScore: number; // 밸런스 점수
  adjustmentNeeded: boolean;
}

// 진행률 분석
interface ProgressionAnalysis {
  levelRange: { min: number; max: number };
  playerCount: number;
  averagePlayTime: number; // 시간 단위
  progressionSpeed: number; // 시간당 경험치
  bottlenecks: ProgressionBottleneck[];
  dropoffPoints: number[]; // 이탈이 많은 레벨들
  engagement: number; // 참여도 점수
  satisfaction: number; // 만족도 점수
}

// 진행 병목
interface ProgressionBottleneck {
  level: number;
  type: 'experience' | 'content' | 'resources' | 'difficulty';
  description: string;
  severity: number; // 1-10
  playersAffected: number;
  averageStuckTime: number; // 시간 단위
}

// PvP 밸런스 분석
interface PvPBalanceAnalysis {
  totalMatches: number;
  classWinRates: Record<string, number>;
  skillUsageStats: Record<string, { usage: number; winRate: number }>;
  itemUsageStats: Record<string, { usage: number; winRate: number }>;
  averageMatchDuration: number; // 분
  ragequitRate: number; // 중도포기율 (%)
  balanceIndex: number; // 0-100, 100이 완벽한 밸런스
  dominantStrategies: string[];
  underusedContent: string[];
}

// 자동 밸런스 조정 제안
interface BalanceAdjustment {
  id: string;
  type: 'nerf' | 'buff' | 'rework' | 'new_content' | 'economy_adjustment';
  target: string; // 대상 (클래스, 스킬, 아이템 등)
  description: string;
  changes: AdjustmentChange[];
  expectedImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
  testingRequired: boolean;
  implementationPriority: number; // 1-10
  estimatedDevelopmentTime: number; // 시간 단위
  relatedIssues: string[];
}

// 조정 변경사항
interface AdjustmentChange {
  property: string;
  currentValue: number;
  suggestedValue: number;
  reasoning: string;
}

export class GameBalanceMonitor {
  private metrics: Map<string, BalanceMetric> = new Map();
  private issues: Map<string, BalanceIssue> = new Map();
  private classAnalyses: Map<string, ClassBalanceAnalysis> = new Map();
  private economyAnalyses: Map<string, ItemEconomyAnalysis> = new Map();
  private contentAnalyses: Map<string, ContentDifficultyAnalysis> = new Map();
  private progressionData: Map<string, ProgressionAnalysis> = new Map();
  private pvpAnalysis: PvPBalanceAnalysis | null = null;
  private balanceAdjustments: Map<string, BalanceAdjustment> = new Map();
  private analysisHistory: Array<{ timestamp: Date; snapshot: Record<string, unknown> }> = [];
  private maxHistorySize: number = 1000;

  constructor() {
    this.initializeDefaultMetrics();
    this.startBalanceMonitoring();
  }

  /**
   * 기본 밸런스 지표 초기화
   */
  private initializeDefaultMetrics(): void {
    const defaultMetrics: BalanceMetric[] = [
      {
        id: 'level_distribution',
        type: 'level_distribution',
        name: '레벨 분포',
        description: '플레이어들의 레벨 분포 균형성',
        currentValue: 0,
        targetValue: 100,
        tolerance: 10,
        trend: 'stable',
        severity: 'normal',
        lastUpdated: new Date(),
        historicalData: [],
        threshold: {
          warning: { min: 80, max: 120 },
          critical: { min: 60, max: 140 },
          emergency: { min: 40, max: 160 }
        },
        category: 'player'
      },
      {
        id: 'class_balance',
        type: 'class_distribution',
        name: '클래스 밸런스',
        description: '클래스별 플레이어 분포 및 성능 균형',
        currentValue: 0,
        targetValue: 100,
        tolerance: 15,
        trend: 'stable',
        severity: 'normal',
        lastUpdated: new Date(),
        historicalData: [],
        threshold: {
          warning: { min: 75, max: 125 },
          critical: { min: 50, max: 150 },
          emergency: { min: 25, max: 175 }
        },
        category: 'player'
      },
      {
        id: 'economy_health',
        type: 'item_economy',
        name: '경제 건전성',
        description: '게임 내 경제 시스템의 균형성',
        currentValue: 0,
        targetValue: 100,
        tolerance: 20,
        trend: 'stable',
        severity: 'normal',
        lastUpdated: new Date(),
        historicalData: [],
        threshold: {
          warning: { min: 70, max: 130 },
          critical: { min: 50, max: 150 },
          emergency: { min: 30, max: 170 }
        },
        category: 'economy'
      },
      {
        id: 'progression_rate',
        type: 'progression_rate',
        name: '진행률',
        description: '플레이어 진행 속도의 적절성',
        currentValue: 0,
        targetValue: 100,
        tolerance: 25,
        trend: 'stable',
        severity: 'normal',
        lastUpdated: new Date(),
        historicalData: [],
        threshold: {
          warning: { min: 60, max: 140 },
          critical: { min: 40, max: 160 },
          emergency: { min: 20, max: 180 }
        },
        category: 'content'
      },
      {
        id: 'pvp_balance',
        type: 'pvp_balance',
        name: 'PvP 밸런스',
        description: 'PvP 콘텐츠의 밸런스 상태',
        currentValue: 0,
        targetValue: 100,
        tolerance: 15,
        trend: 'stable',
        severity: 'normal',
        lastUpdated: new Date(),
        historicalData: [],
        threshold: {
          warning: { min: 70, max: 130 },
          critical: { min: 50, max: 150 },
          emergency: { min: 30, max: 170 }
        },
        category: 'social'
      }
    ];

    defaultMetrics.forEach(metric => {
      this.metrics.set(metric.id, metric);
    });
  }

  /**
   * 전체 밸런스 분석 실행
   */
  async runFullBalanceAnalysis(): Promise<{
    metrics: BalanceMetric[];
    issues: BalanceIssue[];
    summary: BalanceSummary;
  }> {
    logger.info('전체 밸런스 분석 시작...');

    // 각 분석 실행
    await this.analyzeClassBalance();
    await this.analyzeItemEconomy();
    await this.analyzeContentDifficulty();
    await this.analyzeProgression();
    await this.analyzePvPBalance();

    // 지표 업데이트
    this.updateAllMetrics();

    // 이슈 감지
    this.detectBalanceIssues();

    // 자동 조정 제안 생성
    this.generateAdjustmentSuggestions();

    // 스냅샷 저장
    this.saveAnalysisSnapshot();

    const summary = this.generateBalanceSummary();

    logger.info('전체 밸런스 분석 완료');

    return {
      metrics: Array.from(this.metrics.values()),
      issues: Array.from(this.issues.values()),
      summary
    };
  }

  /**
   * 클래스 밸런스 분석
   */
  private async analyzeClassBalance(): Promise<void> {
    const players = await this.getAllPlayers();
    const classCounts = new Map<string, number>();
    const classLevels = new Map<string, number[]>();
    const classWinRates = new Map<string, number>();

    // 기본 데이터 수집
    players.forEach(player => {
      const className = player.class || 'unknown';
      classCounts.set(className, (classCounts.get(className) || 0) + 1);
      
      if (!classLevels.has(className)) {
        classLevels.set(className, []);
      }
      classLevels.get(className)!.push(player.level);
    });

    // PvP 승률 데이터 수집 (실제로는 PvP 시스템에서 가져와야 함)
    const pvpData = await this.getPvPWinRates();
    pvpData.forEach(({ className, winRate }) => {
      classWinRates.set(className, winRate);
    });

    // 각 클래스 분석
    classCounts.forEach((count, className) => {
      const levels = classLevels.get(className) || [];
      const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;
      const winRate = classWinRates.get(className) || 50;
      
      const totalPlayers = players.length;
      const expectedShare = 100 / classCounts.size; // 이상적인 분배율
      const actualShare = (count / totalPlayers) * 100;
      const popularityScore = (actualShare / expectedShare) * 100;

      // 밸런스 점수 계산 (여러 요소 종합)
      const balanceScore = this.calculateClassBalanceScore({
        popularityScore,
        winRate,
        averageLevel,
        progressionRate: this.calculateProgressionRate(className)
      });

      const analysis: ClassBalanceAnalysis = {
        className,
        playerCount: count,
        averageLevel,
        winRate,
        popularityScore,
        progressionRate: this.calculateProgressionRate(className),
        retentionRate: this.calculateRetentionRate(className),
        skillUsageStats: this.getSkillUsageStats(className),
        itemPreferences: this.getItemPreferences(className),
        balanceScore,
        issues: this.identifyClassIssues(balanceScore, popularityScore, winRate),
        recommendations: this.generateClassRecommendations(balanceScore, popularityScore, winRate)
      };

      this.classAnalyses.set(className, analysis);
    });
  }

  /**
   * 아이템 경제 분석
   */
  private async analyzeItemEconomy(): Promise<void> {
    const items = await this.getAllItems();
    const marketData = await this.getMarketData();
    const inflationData = this.calculateInflationRates();

    items.forEach(item => {
      const market = marketData.get(item.id);
      if (!market) return;

      const priceHistory = this.getItemPriceHistory(item.id);
      const volatility = this.calculatePriceVolatility(priceHistory);
      
      const analysis: ItemEconomyAnalysis = {
        itemId: item.id,
        itemName: item.name,
        currentPrice: market.currentPrice,
        targetPrice: market.targetPrice || market.currentPrice,
        priceVolatility: volatility,
        supply: market.supply,
        demand: market.demand,
        marketShare: this.calculateMarketShare(item.id),
        usageFrequency: this.getItemUsageFrequency(item.id),
        dropRate: this.getItemDropRate(item.id),
        inflationRate: inflationData.get(item.id) || 0,
        economicImpact: this.assessEconomicImpact(item.id),
        priceHistory
      };

      this.economyAnalyses.set(item.id, analysis);
    });
  }

  /**
   * 콘텐츠 난이도 분석
   */
  private async analyzeContentDifficulty(): Promise<void> {
    const contents = await this.getAllContent();
    
    contents.forEach(async content => {
      const completionStats = await this.getContentCompletionStats(content.id);
      
      const analysis: ContentDifficultyAnalysis = {
        contentId: content.id,
        contentName: content.name,
        type: content.type,
        difficulty: content.difficulty,
        completionRate: completionStats.completionRate,
        averageAttempts: completionStats.averageAttempts,
        averageTime: completionStats.averageTime,
        playerFeedback: completionStats.playerFeedback,
        recommendedLevel: content.recommendedLevel,
        actualPlayerLevel: completionStats.actualPlayerLevel,
        difficultyScore: this.calculateDifficultyScore(completionStats),
        adjustmentNeeded: this.needsDifficultyAdjustment(completionStats)
      };

      this.contentAnalyses.set(content.id, analysis);
    });
  }

  /**
   * 진행률 분석
   */
  private async analyzeProgression(): Promise<void> {
    const players = await this.getAllPlayers();
    const levelRanges = [
      { min: 1, max: 10 },
      { min: 11, max: 20 },
      { min: 21, max: 30 },
      { min: 31, max: 40 },
      { min: 41, max: 50 },
      { min: 51, max: 100 }
    ];

    levelRanges.forEach(range => {
      const rangePlayers = players.filter(p => 
        p.level >= range.min && p.level <= range.max
      );

      if (rangePlayers.length === 0) return;

      const playTimes = rangePlayers.map(p => this.getPlayerPlayTime(p.id));
      const averagePlayTime = playTimes.reduce((sum, time) => sum + time, 0) / playTimes.length;

      const progressionSpeeds = rangePlayers.map(p => this.getProgressionSpeed(p.id));
      const averageSpeed = progressionSpeeds.reduce((sum, speed) => sum + speed, 0) / progressionSpeeds.length;

      const analysis: ProgressionAnalysis = {
        levelRange: range,
        playerCount: rangePlayers.length,
        averagePlayTime,
        progressionSpeed: averageSpeed,
        bottlenecks: this.identifyBottlenecks(range),
        dropoffPoints: this.findDropoffPoints(range),
        engagement: this.calculateEngagement(range),
        satisfaction: this.calculateSatisfaction(range)
      };

      const rangeKey = `${range.min}-${range.max}`;
      this.progressionData.set(rangeKey, analysis);
    });
  }

  /**
   * PvP 밸런스 분석
   */
  private async analyzePvPBalance(): Promise<void> {
    const pvpMatches = await this.getPvPMatches();
    const classStats = new Map<string, { wins: number; total: number }>();
    const skillStats = new Map<string, { usage: number; wins: number; total: number }>();
    const itemStats = new Map<string, { usage: number; wins: number; total: number }>();

    let totalMatches = pvpMatches.length;
    let totalDuration = 0;
    let ragequits = 0;

    pvpMatches.forEach(match => {
      totalDuration += match.duration;
      if (match.ragequit) ragequits++;

      // 클래스 통계
      match.participants.forEach(participant => {
        const className = participant.class;
        if (!classStats.has(className)) {
          classStats.set(className, { wins: 0, total: 0 });
        }
        const stats = classStats.get(className)!;
        stats.total++;
        if (participant.result === 'win') {
          stats.wins++;
        }

        // 스킬 사용 통계
        participant.skillsUsed.forEach(skill => {
          if (!skillStats.has(skill)) {
            skillStats.set(skill, { usage: 0, wins: 0, total: 0 });
          }
          const skillStat = skillStats.get(skill)!;
          skillStat.usage++;
          skillStat.total++;
          if (participant.result === 'win') {
            skillStat.wins++;
          }
        });

        // 아이템 사용 통계
        participant.itemsUsed.forEach(item => {
          if (!itemStats.has(item)) {
            itemStats.set(item, { usage: 0, wins: 0, total: 0 });
          }
          const itemStat = itemStats.get(item)!;
          itemStat.usage++;
          itemStat.total++;
          if (participant.result === 'win') {
            itemStat.wins++;
          }
        });
      });
    });

    // 승률 계산
    const classWinRates: Record<string, number> = {};
    classStats.forEach((stats, className) => {
      classWinRates[className] = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
    });

    const skillUsageStats: Record<string, { usage: number; winRate: number }> = {};
    skillStats.forEach((stats, skillName) => {
      skillUsageStats[skillName] = {
        usage: stats.usage,
        winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
      };
    });

    const itemUsageStats: Record<string, { usage: number; winRate: number }> = {};
    itemStats.forEach((stats, itemName) => {
      itemUsageStats[itemName] = {
        usage: stats.usage,
        winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
      };
    });

    this.pvpAnalysis = {
      totalMatches,
      classWinRates,
      skillUsageStats,
      itemUsageStats,
      averageMatchDuration: totalDuration / totalMatches,
      ragequitRate: (ragequits / totalMatches) * 100,
      balanceIndex: this.calculatePvPBalanceIndex(classWinRates),
      dominantStrategies: this.identifyDominantStrategies(skillUsageStats, itemUsageStats),
      underusedContent: this.identifyUnderusedContent(skillUsageStats, itemUsageStats)
    };
  }

  /**
   * 모든 지표 업데이트
   */
  private updateAllMetrics(): void {
    // 레벨 분포 지표
    const levelMetric = this.metrics.get('level_distribution')!;
    levelMetric.currentValue = this.calculateLevelDistributionScore();
    levelMetric.lastUpdated = new Date();
    this.updateMetricTrend(levelMetric);
    this.updateMetricSeverity(levelMetric);

    // 클래스 밸런스 지표
    const classMetric = this.metrics.get('class_balance')!;
    classMetric.currentValue = this.calculateOverallClassBalance();
    classMetric.lastUpdated = new Date();
    this.updateMetricTrend(classMetric);
    this.updateMetricSeverity(classMetric);

    // 경제 건전성 지표
    const economyMetric = this.metrics.get('economy_health')!;
    economyMetric.currentValue = this.calculateEconomyHealthScore();
    economyMetric.lastUpdated = new Date();
    this.updateMetricTrend(economyMetric);
    this.updateMetricSeverity(economyMetric);

    // 진행률 지표
    const progressionMetric = this.metrics.get('progression_rate')!;
    progressionMetric.currentValue = this.calculateProgressionScore();
    progressionMetric.lastUpdated = new Date();
    this.updateMetricTrend(progressionMetric);
    this.updateMetricSeverity(progressionMetric);

    // PvP 밸런스 지표
    const pvpMetric = this.metrics.get('pvp_balance')!;
    pvpMetric.currentValue = this.pvpAnalysis?.balanceIndex || 0;
    pvpMetric.lastUpdated = new Date();
    this.updateMetricTrend(pvpMetric);
    this.updateMetricSeverity(pvpMetric);
  }

  /**
   * 밸런스 이슈 감지
   */
  private detectBalanceIssues(): void {
    // 클래스 불균형 감지
    this.classAnalyses.forEach((analysis, className) => {
      if (analysis.balanceScore < 70) {
        this.createIssue({
          title: `${className} 클래스 밸런스 문제`,
          description: `${className} 클래스의 밸런스 점수가 ${analysis.balanceScore}로 낮습니다.`,
          severity: analysis.balanceScore < 50 ? 'critical' : 'moderate',
          category: 'class_imbalance',
          affectedMetrics: ['class_balance'],
          impact: this.calculateClassImpact(analysis),
          recommendations: this.generateClassIssueRecommendations(analysis)
        });
      }
    });

    // 경제 문제 감지
    this.economyAnalyses.forEach((analysis, itemId) => {
      if (analysis.inflationRate > 20) {
        this.createIssue({
          title: `${analysis.itemName} 가격 불안정`,
          description: `${analysis.itemName}의 인플레이션율이 ${analysis.inflationRate}%로 과도합니다.`,
          severity: analysis.inflationRate > 50 ? 'major' : 'moderate',
          category: 'economy_issue',
          affectedMetrics: ['economy_health'],
          impact: this.calculateEconomicImpact(analysis),
          recommendations: this.generateEconomyIssueRecommendations(analysis)
        });
      }
    });

    // 콘텐츠 난이도 문제 감지
    this.contentAnalyses.forEach((analysis, contentId) => {
      if (analysis.completionRate < 20 || analysis.completionRate > 90) {
        const isTooDifficult = analysis.completionRate < 20;
        this.createIssue({
          title: `${analysis.contentName} 난이도 ${isTooDifficult ? '과도' : '부족'}`,
          description: `완료율이 ${analysis.completionRate}%로 ${isTooDifficult ? '너무 낮습니다' : '너무 높습니다'}.`,
          severity: 'moderate',
          category: 'content_difficulty',
          affectedMetrics: ['progression_rate'],
          impact: this.calculateContentImpact(analysis),
          recommendations: this.generateContentIssueRecommendations(analysis)
        });
      }
    });

    // PvP 불균형 감지
    if (this.pvpAnalysis && this.pvpAnalysis.balanceIndex < 70) {
      this.createIssue({
        title: 'PvP 밸런스 불균형',
        description: `PvP 밸런스 지수가 ${this.pvpAnalysis.balanceIndex}로 낮습니다.`,
        severity: this.pvpAnalysis.balanceIndex < 50 ? 'major' : 'moderate',
        category: 'pvp_imbalance',
        affectedMetrics: ['pvp_balance'],
        impact: this.calculatePvPImpact(this.pvpAnalysis),
        recommendations: this.generatePvPIssueRecommendations(this.pvpAnalysis)
      });
    }
  }

  /**
   * 자동 조정 제안 생성
   */
  private generateAdjustmentSuggestions(): void {
    // 클래스 조정 제안
    this.classAnalyses.forEach((analysis, className) => {
      if (analysis.balanceScore < 80) {
        const suggestions = this.generateClassAdjustments(analysis);
        suggestions.forEach(suggestion => {
          this.balanceAdjustments.set(suggestion.id, suggestion);
        });
      }
    });

    // 경제 조정 제안
    this.economyAnalyses.forEach((analysis, itemId) => {
      if (Math.abs(analysis.inflationRate) > 15) {
        const suggestion = this.generateEconomyAdjustment(analysis);
        this.balanceAdjustments.set(suggestion.id, suggestion);
      }
    });

    // 콘텐츠 조정 제안
    this.contentAnalyses.forEach((analysis, contentId) => {
      if (analysis.adjustmentNeeded) {
        const suggestion = this.generateContentAdjustment(analysis);
        this.balanceAdjustments.set(suggestion.id, suggestion);
      }
    });
  }

  // 헬퍼 함수들
  private calculateClassBalanceScore(data: {
    popularityScore: number;
    winRate: number;
    averageLevel: number;
    progressionRate: number;
  }): number {
    // 인기도 점수 (100에 가까울수록 좋음)
    const popularityWeight = 0.3;
    const popularityScore = Math.max(0, 100 - Math.abs(data.popularityScore - 100));

    // 승률 점수 (50에 가까울수록 좋음)
    const winRateWeight = 0.4;
    const winRateScore = Math.max(0, 100 - Math.abs(data.winRate - 50) * 2);

    // 진행률 점수
    const progressionWeight = 0.3;
    const progressionScore = Math.min(100, data.progressionRate);

    return (
      popularityScore * popularityWeight +
      winRateScore * winRateWeight +
      progressionScore * progressionWeight
    );
  }

  private calculatePvPBalanceIndex(classWinRates: Record<string, number>): number {
    const winRates = Object.values(classWinRates);
    if (winRates.length === 0) return 100;

    // 표준편차 계산
    const mean = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
    const variance = winRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / winRates.length;
    const stdDev = Math.sqrt(variance);

    // 밸런스 지수 계산 (표준편차가 낮을수록 좋음)
    return Math.max(0, 100 - stdDev * 2);
  }

  private updateMetricTrend(metric: BalanceMetric): void {
    // 히스토리 데이터 추가
    metric.historicalData.push({
      timestamp: new Date(),
      value: metric.currentValue
    });

    // 최근 10개 데이터 포인트 유지
    if (metric.historicalData.length > 10) {
      metric.historicalData = metric.historicalData.slice(-10);
    }

    // 트렌드 계산
    if (metric.historicalData.length >= 3) {
      const recent = metric.historicalData.slice(-3);
      const values = recent.map(point => point.value);
      
      const isIncreasing = values[2] > values[1] && values[1] > values[0];
      const isDecreasing = values[2] < values[1] && values[1] < values[0];
      
      if (isIncreasing) {
        metric.trend = 'increasing';
      } else if (isDecreasing) {
        metric.trend = 'decreasing';
      } else {
        const variance = this.calculateVariance(values);
        metric.trend = variance > 100 ? 'volatile' : 'stable';
      }
    }
  }

  private updateMetricSeverity(metric: BalanceMetric): void {
    const value = metric.currentValue;
    const thresholds = metric.threshold;

    if ((thresholds.emergency.min && value < thresholds.emergency.min) ||
        (thresholds.emergency.max && value > thresholds.emergency.max)) {
      metric.severity = 'emergency';
    } else if ((thresholds.critical.min && value < thresholds.critical.min) ||
               (thresholds.critical.max && value > thresholds.critical.max)) {
      metric.severity = 'critical';
    } else if ((thresholds.warning.min && value < thresholds.warning.min) ||
               (thresholds.warning.max && value > thresholds.warning.max)) {
      metric.severity = 'warning';
    } else {
      metric.severity = 'normal';
    }
  }

  private createIssue(issueData: {
    title: string;
    description: string;
    severity: IssueSeverity;
    category: IssueCategory;
    affectedMetrics: string[];
    impact: IssueImpact;
    recommendations: Recommendation[];
  }): void {
    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const issue: BalanceIssue = {
      id: issueId,
      title: issueData.title,
      description: issueData.description,
      severity: issueData.severity,
      category: issueData.category,
      affectedMetrics: issueData.affectedMetrics,
      detectedAt: new Date(),
      status: 'open',
      priority: this.calculateIssuePriority(issueData.severity, issueData.impact),
      impact: issueData.impact,
      recommendations: issueData.recommendations,
      relatedData: {},
      notes: []
    };

    this.issues.set(issueId, issue);
    logger.info(`밸런스 이슈 감지: ${issue.title}`);
  }

  private calculateIssuePriority(severity: IssueSeverity, impact: IssueImpact): IssuePriority {
    if (severity === 'game_breaking' || impact.playerAffected > 1000) {
      return 'emergency';
    }
    if (severity === 'critical' || impact.playerAffected > 500) {
      return 'urgent';
    }
    if (severity === 'major' || impact.playerAffected > 100) {
      return 'high';
    }
    if (severity === 'moderate') {
      return 'normal';
    }
    return 'low';
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private generateBalanceSummary(): BalanceSummary {
    const metrics = Array.from(this.metrics.values());
    const issues = Array.from(this.issues.values());

    const criticalMetrics = metrics.filter(m => m.severity === 'critical' || m.severity === 'emergency');
    const openIssues = issues.filter(i => i.status === 'open');
    const urgentIssues = openIssues.filter(i => i.priority === 'urgent' || i.priority === 'emergency');

    const overallHealth = this.calculateOverallHealth(metrics);

    return {
      overallHealth,
      criticalMetrics: criticalMetrics.length,
      openIssues: openIssues.length,
      urgentIssues: urgentIssues.length,
      topIssues: urgentIssues.slice(0, 5),
      healthByCategory: this.calculateHealthByCategory(metrics),
      trends: this.summarizeTrends(metrics),
      recommendations: this.getTopRecommendations()
    };
  }

  private calculateOverallHealth(metrics: BalanceMetric[]): number {
    const weights = {
      normal: 1,
      warning: 0.8,
      critical: 0.5,
      emergency: 0.2
    };

    let totalWeight = 0;
    let weightedSum = 0;

    metrics.forEach(metric => {
      const weight = weights[metric.severity];
      totalWeight += 1;
      weightedSum += weight;
    });

    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 100;
  }

  private saveAnalysisSnapshot(): void {
    const snapshot = {
      timestamp: new Date(),
      metrics: Array.from(this.metrics.values()),
      issues: Array.from(this.issues.values()),
      classAnalyses: Array.from(this.classAnalyses.values()),
      economyAnalyses: Array.from(this.economyAnalyses.values()),
      contentAnalyses: Array.from(this.contentAnalyses.values()),
      progressionData: Array.from(this.progressionData.values()),
      pvpAnalysis: this.pvpAnalysis
    };

    this.analysisHistory.push({ timestamp: new Date(), snapshot });

    if (this.analysisHistory.length > this.maxHistorySize) {
      this.analysisHistory = this.analysisHistory.slice(-this.maxHistorySize);
    }
  }

  private startBalanceMonitoring(): void {
    // 전체 분석 (1시간마다)
    setInterval(() => {
      this.runFullBalanceAnalysis();
    }, 60 * 60 * 1000);

    // 빠른 지표 업데이트 (10분마다)
    setInterval(() => {
      this.updateCriticalMetrics();
    }, 10 * 60 * 1000);

    // 이슈 상태 업데이트 (5분마다)
    setInterval(() => {
      this.updateIssueStatuses();
    }, 5 * 60 * 1000);
  }

  private updateCriticalMetrics(): void {
    // 중요한 지표들만 빠르게 업데이트
    const criticalMetricIds = ['class_balance', 'pvp_balance', 'economy_health'];
    
    criticalMetricIds.forEach(id => {
      const metric = this.metrics.get(id);
      if (metric) {
        // 빠른 업데이트 로직
        this.quickUpdateMetric(metric);
      }
    });
  }

  private quickUpdateMetric(metric: BalanceMetric): void {
    // 간단한 업데이트 로직 (실제로는 각 지표별로 구현)
    metric.lastUpdated = new Date();
    this.updateMetricSeverity(metric);
  }

  private updateIssueStatuses(): void {
    this.issues.forEach(issue => {
      // 자동 해결 확인
      if (issue.status === 'open' && this.isIssueAutoResolved(issue)) {
        issue.status = 'resolved';
        issue.resolvedAt = new Date();
        
        issue.notes.push({
          id: `note_${Date.now()}`,
          author: 'system',
          content: '자동으로 해결됨',
          timestamp: new Date(),
          type: 'resolution'
        });
      }
    });
  }

  private isIssueAutoResolved(issue: BalanceIssue): boolean {
    // 간단한 자동 해결 체크
    const relatedMetrics = issue.affectedMetrics.map(id => this.metrics.get(id)).filter(Boolean);
    return relatedMetrics.every(metric => metric!.severity === 'normal');
  }

  // 데이터 접근 함수들 (실제로는 다른 시스템에서 가져와야 함)
  private async getAllPlayers(): Promise<Player[]> {
    // 실제 구현 필요
    return [];
  }

  private async getAllItems(): Promise<Array<Record<string, unknown>>> {
    // 실제 구현 필요
    return [];
  }

  private async getAllContent(): Promise<Array<Record<string, unknown>>> {
    // 실제 구현 필요
    return [];
  }

  private async getPvPWinRates(): Promise<Array<{ className: string; winRate: number }>> {
    // 실제 구현 필요
    return [];
  }

  private async getMarketData(): Promise<Map<string, unknown>> {
    // 실제 구현 필요
    return new Map();
  }

  private async getPvPMatches(): Promise<Array<Record<string, unknown>>> {
    // 실제 구현 필요
    return [];
  }

  private async getContentCompletionStats(contentId: string): Promise<Record<string, unknown>> {
    // 실제 구현 필요
    return {};
  }

  // 다른 계산 함수들도 실제 구현 필요...
  private calculateProgressionRate(className: string): number { return 100; }
  private calculateRetentionRate(className: string): number { return 100; }
  private getSkillUsageStats(className: string): Record<string, number> { return {}; }
  private getItemPreferences(className: string): Record<string, number> { return {}; }
  private identifyClassIssues(score: number, popularity: number, winRate: number): string[] { return []; }
  private generateClassRecommendations(score: number, popularity: number, winRate: number): string[] { return []; }
  private calculateInflationRates(): Map<string, number> { return new Map(); }
  private getItemPriceHistory(itemId: string): Array<{ timestamp: Date; price: number; volume: number }> { return []; }
  private calculatePriceVolatility(history: Array<{ timestamp: Date; price: number; volume: number }>): number { return 0; }
  private calculateMarketShare(itemId: string): number { return 0; }
  private getItemUsageFrequency(itemId: string): number { return 0; }
  private getItemDropRate(itemId: string): number { return 0; }
  private assessEconomicImpact(itemId: string): 'positive' | 'neutral' | 'negative' { return 'neutral'; }
  private calculateDifficultyScore(stats: Record<string, unknown>): number { return 100; }
  private needsDifficultyAdjustment(stats: Record<string, unknown>): boolean { return false; }
  private identifyBottlenecks(range: Record<string, unknown>): ProgressionBottleneck[] { return []; }
  private findDropoffPoints(range: Record<string, unknown>): number[] { return []; }
  private calculateEngagement(range: Record<string, unknown>): number { return 100; }
  private calculateSatisfaction(range: Record<string, unknown>): number { return 100; }
  private getPlayerPlayTime(playerId: string): number { return 0; }
  private getProgressionSpeed(playerId: string): number { return 0; }
  private identifyDominantStrategies(skillStats: Record<string, unknown>, itemStats: Record<string, unknown>): string[] { return []; }
  private identifyUnderusedContent(skillStats: Record<string, unknown>, itemStats: Record<string, unknown>): string[] { return []; }
  private calculateLevelDistributionScore(): number { return 100; }
  private calculateOverallClassBalance(): number { return 100; }
  private calculateEconomyHealthScore(): number { return 100; }
  private calculateProgressionScore(): number { return 100; }
  private calculateClassImpact(analysis: ClassBalanceAnalysis): IssueImpact {
    return { playerAffected: 0, revenueImpact: 0, retentionImpact: 0, gameplayImpact: 'minor' };
  }
  private calculateEconomicImpact(analysis: ItemEconomyAnalysis): IssueImpact {
    return { playerAffected: 0, revenueImpact: 0, retentionImpact: 0, gameplayImpact: 'minor' };
  }
  private calculateContentImpact(analysis: ContentDifficultyAnalysis): IssueImpact {
    return { playerAffected: 0, revenueImpact: 0, retentionImpact: 0, gameplayImpact: 'minor' };
  }
  private calculatePvPImpact(analysis: PvPBalanceAnalysis): IssueImpact {
    return { playerAffected: 0, revenueImpact: 0, retentionImpact: 0, gameplayImpact: 'minor' };
  }
  private generateClassIssueRecommendations(analysis: ClassBalanceAnalysis): Recommendation[] { return []; }
  private generateEconomyIssueRecommendations(analysis: ItemEconomyAnalysis): Recommendation[] { return []; }
  private generateContentIssueRecommendations(analysis: ContentDifficultyAnalysis): Recommendation[] { return []; }
  private generatePvPIssueRecommendations(analysis: PvPBalanceAnalysis): Recommendation[] { return []; }
  private generateClassAdjustments(analysis: ClassBalanceAnalysis): BalanceAdjustment[] { return []; }
  private generateEconomyAdjustment(analysis: ItemEconomyAnalysis): BalanceAdjustment {
    return {
      id: '',
      type: 'economy_adjustment',
      target: '',
      description: '',
      changes: [],
      expectedImpact: '',
      riskLevel: 'low',
      testingRequired: false,
      implementationPriority: 1,
      estimatedDevelopmentTime: 0,
      relatedIssues: []
    };
  }
  private generateContentAdjustment(analysis: ContentDifficultyAnalysis): BalanceAdjustment {
    return {
      id: '',
      type: 'new_content',
      target: '',
      description: '',
      changes: [],
      expectedImpact: '',
      riskLevel: 'low',
      testingRequired: false,
      implementationPriority: 1,
      estimatedDevelopmentTime: 0,
      relatedIssues: []
    };
  }
  private calculateHealthByCategory(metrics: BalanceMetric[]): Record<string, number> { return {}; }
  private summarizeTrends(metrics: BalanceMetric[]): Record<string, string> { return {}; }
  private getTopRecommendations(): string[] { return []; }

  /**
   * 공개 API 메서드들
   */
  getMetric(metricId: string): BalanceMetric | null {
    return this.metrics.get(metricId) || null;
  }

  getAllMetrics(): BalanceMetric[] {
    return Array.from(this.metrics.values());
  }

  getIssue(issueId: string): BalanceIssue | null {
    return this.issues.get(issueId) || null;
  }

  getAllIssues(): BalanceIssue[] {
    return Array.from(this.issues.values());
  }

  getOpenIssues(): BalanceIssue[] {
    return Array.from(this.issues.values()).filter(issue => issue.status === 'open');
  }

  getCriticalIssues(): BalanceIssue[] {
    return Array.from(this.issues.values()).filter(issue => 
      issue.severity === 'critical' || issue.severity === 'game_breaking'
    );
  }

  getClassAnalysis(className: string): ClassBalanceAnalysis | null {
    return this.classAnalyses.get(className) || null;
  }

  getAllClassAnalyses(): ClassBalanceAnalysis[] {
    return Array.from(this.classAnalyses.values());
  }

  getItemEconomyAnalysis(itemId: string): ItemEconomyAnalysis | null {
    return this.economyAnalyses.get(itemId) || null;
  }

  getPvPAnalysis(): PvPBalanceAnalysis | null {
    return this.pvpAnalysis;
  }

  getBalanceAdjustments(): BalanceAdjustment[] {
    return Array.from(this.balanceAdjustments.values());
  }

  addIssueNote(issueId: string, author: string, content: string, type: 'comment' | 'update' | 'resolution' = 'comment'): boolean {
    const issue = this.issues.get(issueId);
    if (!issue) return false;

    const note: IssueNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author,
      content,
      timestamp: new Date(),
      type
    };

    issue.notes.push(note);
    return true;
  }

  updateIssueStatus(issueId: string, status: IssueStatus, assignedTo?: string): boolean {
    const issue = this.issues.get(issueId);
    if (!issue) return false;

    issue.status = status;
    if (assignedTo) issue.assignedTo = assignedTo;
    if (status === 'resolved') issue.resolvedAt = new Date();

    return true;
  }

  exportBalanceReport(startDate: Date, endDate: Date): Record<string, unknown> {
    const relevantHistory = this.analysisHistory.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );

    return {
      period: { start: startDate, end: endDate },
      currentState: {
        metrics: Array.from(this.metrics.values()),
        issues: Array.from(this.issues.values()),
        summary: this.generateBalanceSummary()
      },
      historicalData: relevantHistory,
      trends: this.analyzeTrends(relevantHistory),
      recommendations: this.generateReportRecommendations()
    };
  }

  private analyzeTrends(history: Array<Record<string, unknown>>): Record<string, unknown> {
    // 트렌드 분석 로직
    return {};
  }

  private generateReportRecommendations(): string[] {
    // 보고서 추천사항 생성
    return [];
  }
}

// 밸런스 요약 인터페이스
interface BalanceSummary {
  overallHealth: number;
  criticalMetrics: number;
  openIssues: number;
  urgentIssues: number;
  topIssues: BalanceIssue[];
  healthByCategory: Record<string, number>;
  trends: Record<string, string>;
  recommendations: string[];
}

// 전역 게임 밸런스 모니터 인스턴스
export const gameBalanceMonitor = new GameBalanceMonitor();

// 게임 밸런스 모니터링 관련 유틸리티
export const balanceMonitorUtils = {
  /**
   * 메트릭 타입 표시명
   */
  getMetricTypeDisplayName(type: BalanceMetricType): string {
    const names = {
      level_distribution: '레벨 분포',
      class_distribution: '클래스 분포',
      skill_usage: '스킬 사용률',
      item_economy: '아이템 경제',
      monster_difficulty: '몬스터 난이도',
      quest_completion: '퀘스트 완료율',
      pvp_balance: 'PvP 밸런스',
      progression_rate: '진행률',
      resource_flow: '자원 흐름',
      market_prices: '시장 가격',
      power_creep: '파워 크리프',
      engagement_metrics: '참여도 지표'
    };
    return names[type];
  },

  /**
   * 심각도 색상
   */
  getSeverityColor(severity: MetricSeverity): string {
    const colors = {
      normal: '#28a745',
      warning: '#ffc107',
      critical: '#dc3545',
      emergency: '#6f42c1'
    };
    return colors[severity];
  },

  /**
   * 이슈 카테고리 표시명
   */
  getIssueCategoryDisplayName(category: IssueCategory): string {
    const names = {
      class_imbalance: '클래스 불균형',
      item_imbalance: '아이템 불균형',
      progression_issue: '진행 문제',
      economy_issue: '경제 문제',
      content_difficulty: '콘텐츠 난이도',
      pvp_imbalance: 'PvP 불균형',
      exploit: '익스플로잇',
      engagement_drop: '참여도 저하'
    };
    return names[category];
  },

  /**
   * 트렌드 아이콘
   */
  getTrendIcon(trend: TrendDirection): string {
    const icons = {
      increasing: '↗️',
      decreasing: '↘️',
      stable: '➡️',
      volatile: '↕️'
    };
    return icons[trend];
  },

  /**
   * 건강도 상태
   */
  getHealthStatus(score: number): { status: string; color: string } {
    if (score >= 80) {
      return { status: '건강', color: '#28a745' };
    } else if (score >= 60) {
      return { status: '주의', color: '#ffc107' };
    } else if (score >= 40) {
      return { status: '위험', color: '#fd7e14' };
    } else {
      return { status: '심각', color: '#dc3545' };
    }
  }
};
