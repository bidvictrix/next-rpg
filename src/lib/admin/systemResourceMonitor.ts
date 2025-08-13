import { logger } from '../logger';

// 리소스 메트릭 타입
type ResourceMetricType = 
  | 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'network_bandwidth'
  | 'database_performance' | 'response_time' | 'error_rate' | 'throughput'
  | 'concurrent_users' | 'queue_length' | 'cache_hit_rate' | 'api_latency';

// 시스템 컴포넌트
type SystemComponent = 
  | 'web_server' | 'game_server' | 'database' | 'cache' | 'file_storage'
  | 'load_balancer' | 'message_queue' | 'auth_service' | 'payment_service';

// 알림 레벨
type AlertLevel = 'info' | 'warning' | 'critical' | 'emergency';

// 시스템 메트릭
interface SystemMetric {
  id: string;
  type: ResourceMetricType;
  component: SystemComponent;
  name: string;
  description: string;
  value: number;
  unit: string;
  timestamp: Date;
  threshold: MetricThreshold;
  status: MetricStatus;
  trend: TrendDirection;
  historicalData: MetricDataPoint[];
}

// 메트릭 상태
type MetricStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

// 트렌드 방향
type TrendDirection = 'up' | 'down' | 'stable' | 'fluctuating';

// 메트릭 임계값
interface MetricThreshold {
  warning: number;
  critical: number;
  emergency: number;
  target?: number; // 목표값
}

// 메트릭 데이터 포인트
interface MetricDataPoint {
  timestamp: Date;
  value: number;
  context?: string;
}

// 시스템 상태
interface SystemHealth {
  overall: HealthStatus;
  components: Record<SystemComponent, ComponentHealth>;
  lastUpdated: Date;
  uptime: number; // 초 단위
  version: string;
  environment: 'development' | 'staging' | 'production';
}

// 건강 상태
interface HealthStatus {
  score: number; // 0-100
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  issues: HealthIssue[];
}

// 컴포넌트 건강 상태
interface ComponentHealth extends HealthStatus {
  component: SystemComponent;
  metrics: SystemMetric[];
  dependencies: string[];
  lastCheck: Date;
  errorCount: number;
  responseTime: number;
}

// 건강 이슈
interface HealthIssue {
  id: string;
  component: SystemComponent;
  severity: AlertLevel;
  message: string;
  timestamp: Date;
  resolved: boolean;
  autoResolved: boolean;
}

// 성능 보고서
interface PerformanceReport {
  period: { start: Date; end: Date };
  summary: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
    uptime: number;
    peakConcurrentUsers: number;
  };
  metrics: PerformanceMetric[];
  incidents: Incident[];
  recommendations: PerformanceRecommendation[];
}

// 성능 메트릭
interface PerformanceMetric {
  name: string;
  average: number;
  minimum: number;
  maximum: number;
  percentile95: number;
  percentile99: number;
  unit: string;
  trend: TrendDirection;
}

// 사건/인시던트
interface Incident {
  id: string;
  title: string;
  description: string;
  severity: AlertLevel;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  affectedComponents: SystemComponent[];
  impact: IncidentImpact;
  resolution?: string;
  lessons: string[];
}

// 인시던트 영향
interface IncidentImpact {
  usersAffected: number;
  downtime: number; // 분 단위
  revenueImpact: number;
  reputationImpact: 'none' | 'minor' | 'moderate' | 'major';
}

// 성능 추천사항
interface PerformanceRecommendation {
  type: 'optimization' | 'scaling' | 'infrastructure' | 'configuration';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expectedBenefit: string;
  estimatedEffort: string;
  implementation: string[];
}

// 리소스 사용률
interface ResourceUtilization {
  component: SystemComponent;
  cpu: number; // %
  memory: number; // %
  disk: number; // %
  network: number; // %
  timestamp: Date;
}

// 확장성 메트릭
interface ScalabilityMetric {
  currentCapacity: number;
  currentLoad: number;
  utilizationRate: number; // %
  estimatedTimeToCapacity: number; // 시간
  recommendedAction: 'monitor' | 'scale_up' | 'scale_out' | 'optimize';
  nextReview: Date;
}

// 자동 알림 규칙
interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: ResourceMetricType;
  component?: SystemComponent;
  condition: AlertCondition;
  action: AlertAction;
  isActive: boolean;
  cooldown: number; // 초 단위
  lastTriggered?: Date;
  triggerCount: number;
}

// 알림 조건
interface AlertCondition {
  operator: 'greater_than' | 'less_than' | 'equals' | 'percentage_increase' | 'percentage_decrease';
  value: number;
  duration?: number; // 조건이 지속되어야 하는 시간 (초)
  consecutiveChecks?: number; // 연속으로 조건을 만족해야 하는 횟수
}

// 알림 액션
interface AlertAction {
  type: 'notification' | 'auto_scale' | 'restart_service' | 'failover' | 'webhook';
  target: string;
  parameters?: Record<string, unknown>;
}

export class SystemResourceMonitor {
  private metrics: Map<string, SystemMetric> = new Map();
  private systemHealth: SystemHealth;
  private alertRules: Map<string, AlertRule> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private resourceUtilization: Map<SystemComponent, ResourceUtilization> = new Map();
  private scalabilityMetrics: Map<SystemComponent, ScalabilityMetric> = new Map();
  private performanceHistory: MetricDataPoint[] = [];
  private maxHistorySize: number = 10000;
  private monitoringInterval: number = 30; // 초 단위

  constructor() {
    this.systemHealth = this.initializeSystemHealth();
    this.initializeDefaultMetrics();
    this.initializeDefaultAlertRules();
    this.startResourceMonitoring();
  }

  /**
   * 시스템 건강 상태 초기화
   */
  private initializeSystemHealth(): SystemHealth {
    const components: SystemComponent[] = [
      'web_server', 'game_server', 'database', 'cache', 'file_storage',
      'load_balancer', 'message_queue', 'auth_service', 'payment_service'
    ];

    const componentHealth = {} as Record<SystemComponent, ComponentHealth>;

    components.forEach(component => {
      componentHealth[component] = {
        component,
        score: 100,
        status: 'healthy',
        issues: [],
        metrics: [],
        dependencies: this.getComponentDependencies(component),
        lastCheck: new Date(),
        errorCount: 0,
        responseTime: 0
      };
    });

    return {
      overall: {
        score: 100,
        status: 'healthy',
        issues: []
      },
      components: componentHealth,
      lastUpdated: new Date(),
      uptime: 0,
      version: '1.0.0',
      environment: 'production'
    };
  }

  /**
   * 기본 메트릭 초기화
   */
  private initializeDefaultMetrics(): void {
    const defaultMetrics: Omit<SystemMetric, 'id' | 'value' | 'timestamp' | 'status' | 'trend' | 'historicalData'>[] = [
      {
        type: 'cpu_usage',
        component: 'web_server',
        name: 'Web Server CPU 사용률',
        description: '웹 서버의 CPU 사용률',
        unit: '%',
        threshold: { warning: 70, critical: 85, emergency: 95, target: 50 }
      },
      {
        type: 'memory_usage',
        component: 'web_server',
        name: 'Web Server 메모리 사용률',
        description: '웹 서버의 메모리 사용률',
        unit: '%',
        threshold: { warning: 80, critical: 90, emergency: 95, target: 60 }
      },
      {
        type: 'response_time',
        component: 'web_server',
        name: 'API 응답 시간',
        description: 'API 요청의 평균 응답 시간',
        unit: 'ms',
        threshold: { warning: 500, critical: 1000, emergency: 2000, target: 200 }
      },
      {
        type: 'database_performance',
        component: 'database',
        name: '데이터베이스 응답 시간',
        description: '데이터베이스 쿼리 평균 응답 시간',
        unit: 'ms',
        threshold: { warning: 100, critical: 300, emergency: 1000, target: 50 }
      },
      {
        type: 'error_rate',
        component: 'game_server',
        name: '게임 서버 에러율',
        description: '게임 서버의 에러 발생률',
        unit: '%',
        threshold: { warning: 1, critical: 5, emergency: 10, target: 0.1 }
      },
      {
        type: 'concurrent_users',
        component: 'game_server',
        name: '동시 접속자 수',
        description: '현재 동시 접속 중인 사용자 수',
        unit: 'users',
        threshold: { warning: 800, critical: 950, emergency: 1000 }
      },
      {
        type: 'cache_hit_rate',
        component: 'cache',
        name: '캐시 히트율',
        description: '캐시 히트율',
        unit: '%',
        threshold: { warning: 80, critical: 70, emergency: 60, target: 95 }
      },
      {
        type: 'disk_usage',
        component: 'file_storage',
        name: '디스크 사용률',
        description: '파일 스토리지 디스크 사용률',
        unit: '%',
        threshold: { warning: 80, critical: 90, emergency: 95, target: 70 }
      }
    ];

    defaultMetrics.forEach(metricData => {
      const metric: SystemMetric = {
        id: `${metricData.component}_${metricData.type}`,
        value: 0,
        timestamp: new Date(),
        status: 'healthy',
        trend: 'stable',
        historicalData: [],
        ...metricData
      };

      this.metrics.set(metric.id, metric);
    });
  }

  /**
   * 기본 알림 규칙 초기화
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: Omit<AlertRule, 'id' | 'triggerCount'>[] = [
      {
        name: 'CPU 사용률 임계값 초과',
        description: 'CPU 사용률이 임계값을 초과했습니다',
        metric: 'cpu_usage',
        condition: {
          operator: 'greater_than',
          value: 85,
          duration: 300 // 5분
        },
        action: {
          type: 'notification',
          target: 'ops-team@game.com'
        },
        isActive: true,
        cooldown: 600 // 10분
      },
      {
        name: '메모리 사용률 임계값 초과',
        description: '메모리 사용률이 임계값을 초과했습니다',
        metric: 'memory_usage',
        condition: {
          operator: 'greater_than',
          value: 90,
          duration: 180 // 3분
        },
        action: {
          type: 'auto_scale',
          target: 'web_server'
        },
        isActive: true,
        cooldown: 1800 // 30분
      },
      {
        name: '응답 시간 임계값 초과',
        description: 'API 응답 시간이 임계값을 초과했습니다',
        metric: 'response_time',
        condition: {
          operator: 'greater_than',
          value: 1000,
          consecutiveChecks: 5
        },
        action: {
          type: 'notification',
          target: 'dev-team@game.com'
        },
        isActive: true,
        cooldown: 300 // 5분
      },
      {
        name: '에러율 급증',
        description: '에러율이 급격히 증가했습니다',
        metric: 'error_rate',
        condition: {
          operator: 'greater_than',
          value: 5,
          duration: 60 // 1분
        },
        action: {
          type: 'notification',
          target: 'incident-team@game.com'
        },
        isActive: true,
        cooldown: 120 // 2분
      },
      {
        name: '디스크 사용량 임계값 초과',
        description: '디스크 사용량이 임계값을 초과했습니다',
        metric: 'disk_usage',
        condition: {
          operator: 'greater_than',
          value: 90,
          duration: 600 // 10분
        },
        action: {
          type: 'webhook',
          target: 'https://api.game.com/alerts/disk-cleanup'
        },
        isActive: true,
        cooldown: 3600 // 1시간
      }
    ];

    defaultRules.forEach(ruleData => {
      const rule: AlertRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        triggerCount: 0,
        ...ruleData
      };

      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * 리소스 모니터링 시작
   */
  private startResourceMonitoring(): void {
    // 메인 모니터링 루프
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.monitoringInterval * 1000);

    // 건강 상태 업데이트
    setInterval(() => {
      this.updateSystemHealth();
    }, 60 * 1000); // 1분마다

    // 확장성 분석
    setInterval(() => {
      this.analyzeScalability();
    }, 5 * 60 * 1000); // 5분마다

    // 알림 규칙 평가
    setInterval(() => {
      this.evaluateAlertRules();
    }, 30 * 1000); // 30초마다

    // 히스토리 정리
    setInterval(() => {
      this.cleanupHistory();
    }, 60 * 60 * 1000); // 1시간마다

    logger.info('시스템 리소스 모니터링 시작');
  }

  /**
   * 시스템 메트릭 수집
   */
  private collectSystemMetrics(): void {
    this.metrics.forEach(metric => {
      const newValue = this.collectMetricValue(metric);
      
      // 이전 값과 비교하여 트렌드 계산
      const previousValue = metric.value;
      metric.value = newValue;
      metric.timestamp = new Date();
      
      // 히스토리 업데이트
      metric.historicalData.push({
        timestamp: new Date(),
        value: newValue
      });

      // 히스토리 크기 제한
      if (metric.historicalData.length > 100) {
        metric.historicalData = metric.historicalData.slice(-100);
      }

      // 트렌드 계산
      metric.trend = this.calculateTrend(metric.historicalData);

      // 상태 업데이트
      metric.status = this.calculateMetricStatus(metric);

      // 성능 히스토리에 추가 (중요한 메트릭만)
      if (['response_time', 'cpu_usage', 'memory_usage', 'error_rate'].includes(metric.type)) {
        this.performanceHistory.push({
          timestamp: new Date(),
          value: newValue,
          context: `${metric.component}_${metric.type}`
        });
      }
    });

    // 리소스 사용률 업데이트
    this.updateResourceUtilization();
  }

  /**
   * 개별 메트릭 값 수집
   */
  private collectMetricValue(metric: SystemMetric): number {
    // 실제 환경에서는 시스템 API나 모니터링 툴에서 가져와야 함
    // 여기서는 시뮬레이션된 값 반환
    
    switch (metric.type) {
      case 'cpu_usage':
        return this.simulateCpuUsage(metric.component);
      case 'memory_usage':
        return this.simulateMemoryUsage(metric.component);
      case 'disk_usage':
        return this.simulateDiskUsage(metric.component);
      case 'response_time':
        return this.simulateResponseTime(metric.component);
      case 'error_rate':
        return this.simulateErrorRate(metric.component);
      case 'concurrent_users':
        return this.getCurrentConcurrentUsers();
      case 'cache_hit_rate':
        return this.getCacheHitRate();
      case 'database_performance':
        return this.getDatabasePerformance();
      default:
        return Math.random() * 100;
    }
  }

  /**
   * 시뮬레이션된 메트릭 값들
   */
  private simulateCpuUsage(component: SystemComponent): number {
    const baseUsage = {
      'web_server': 45,
      'game_server': 60,
      'database': 35,
      'cache': 20,
      'file_storage': 15,
      'load_balancer': 25,
      'message_queue': 30,
      'auth_service': 40,
      'payment_service': 20
    };

    const base = baseUsage[component] || 30;
    const variation = (Math.random() - 0.5) * 20; // ±10% 변동
    return Math.max(0, Math.min(100, base + variation));
  }

  private simulateMemoryUsage(component: SystemComponent): number {
    const baseUsage = {
      'web_server': 65,
      'game_server': 75,
      'database': 80,
      'cache': 70,
      'file_storage': 40,
      'load_balancer': 35,
      'message_queue': 55,
      'auth_service': 50,
      'payment_service': 45
    };

    const base = baseUsage[component] || 50;
    const variation = (Math.random() - 0.5) * 15; // ±7.5% 변동
    return Math.max(0, Math.min(100, base + variation));
  }

  private simulateDiskUsage(component: SystemComponent): number {
    // 디스크 사용량은 천천히 증가
    const existing = this.resourceUtilization.get(component);
    const current = existing?.disk || 70;
    const growth = Math.random() * 0.1; // 천천히 증가
    return Math.min(100, current + growth);
  }

  private simulateResponseTime(component: SystemComponent): number {
    const baseTime = {
      'web_server': 150,
      'game_server': 50,
      'database': 30,
      'auth_service': 100,
      'payment_service': 200
    };

    const base = baseTime[component] || 100;
    const spike = Math.random() < 0.05 ? Math.random() * 500 : 0; // 5% 확률로 스파이크
    const variation = (Math.random() - 0.5) * base * 0.3;
    return Math.max(10, base + variation + spike);
  }

  private simulateErrorRate(component: SystemComponent): number {
    const baseError = Math.random() * 2; // 0-2% 기본 에러율
    const spike = Math.random() < 0.02 ? Math.random() * 10 : 0; // 2% 확률로 에러 스파이크
    return Math.min(100, baseError + spike);
  }

  private getCurrentConcurrentUsers(): number {
    // 시간대별 접속자 패턴 시뮬레이션
    const hour = new Date().getHours();
    const basePeak = 600; // 기본 피크 접속자
    const hourlyMultiplier = Math.sin((hour - 6) * Math.PI / 12) * 0.5 + 0.5; // 오후 6시 피크
    const randomVariation = (Math.random() - 0.5) * 100;
    
    return Math.max(50, Math.floor(basePeak * hourlyMultiplier + randomVariation));
  }

  private getCacheHitRate(): number {
    // 캐시 히트율 시뮬레이션
    const baseHitRate = 85 + Math.random() * 10; // 85-95%
    const occasional_miss = Math.random() < 0.1 ? -Math.random() * 20 : 0; // 10% 확률로 히트율 저하
    return Math.max(50, Math.min(100, baseHitRate + occasional_miss));
  }

  private getDatabasePerformance(): number {
    // 데이터베이스 성능 시뮬레이션
    const baseLatency = 40 + Math.random() * 20; // 40-60ms 기본
    const loadImpact = this.getCurrentConcurrentUsers() / 600 * 30; // 부하에 따른 지연
    const randomSpike = Math.random() < 0.03 ? Math.random() * 200 : 0; // 3% 확률로 스파이크
    
    return Math.max(10, baseLatency + loadImpact + randomSpike);
  }

  /**
   * 트렌드 계산
   */
  private calculateTrend(data: MetricDataPoint[]): TrendDirection {
    if (data.length < 3) return 'stable';

    const recent = data.slice(-5); // 최근 5개 데이터 포인트
    const values = recent.map(point => point.value);
    
    // 선형 회귀를 사용한 트렌드 계산
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const variance = values.reduce((sum, val, i) => sum + Math.pow(val - (values.reduce((a,b) => a+b)/n), 2), 0) / n;

    if (variance > 100) return 'fluctuating'; // 높은 변동성
    if (slope > 1) return 'up';
    if (slope < -1) return 'down';
    return 'stable';
  }

  /**
   * 메트릭 상태 계산
   */
  private calculateMetricStatus(metric: SystemMetric): MetricStatus {
    const value = metric.value;
    const threshold = metric.threshold;

    if (value >= threshold.emergency) return 'critical';
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'healthy';
  }

  /**
   * 리소스 사용률 업데이트
   */
  private updateResourceUtilization(): void {
    const components: SystemComponent[] = [
      'web_server', 'game_server', 'database', 'cache', 'file_storage'
    ];

    components.forEach(component => {
      const utilization: ResourceUtilization = {
        component,
        cpu: this.simulateCpuUsage(component),
        memory: this.simulateMemoryUsage(component),
        disk: this.simulateDiskUsage(component),
        network: Math.random() * 50 + 20, // 20-70% 네트워크 사용률
        timestamp: new Date()
      };

      this.resourceUtilization.set(component, utilization);
    });
  }

  /**
   * 시스템 건강 상태 업데이트
   */
  private updateSystemHealth(): void {
    let overallScore = 0;
    let totalComponents = 0;
    let criticalIssues = 0;

    // 각 컴포넌트 건강 상태 업데이트
    Object.keys(this.systemHealth.components).forEach(componentKey => {
      const component = componentKey as SystemComponent;
      const health = this.systemHealth.components[component];
      
      // 컴포넌트 메트릭 수집
      const componentMetrics = Array.from(this.metrics.values())
        .filter(metric => metric.component === component);
      
      health.metrics = componentMetrics;
      
      // 건강 점수 계산
      let componentScore = 100;
      const issues: HealthIssue[] = [];

      componentMetrics.forEach(metric => {
        if (metric.status === 'critical') {
          componentScore -= 30;
          criticalIssues++;
          issues.push({
            id: `issue_${metric.id}_${Date.now()}`,
            component,
            severity: 'critical',
            message: `${metric.name}이(가) 임계값을 초과했습니다 (${metric.value}${metric.unit})`,
            timestamp: new Date(),
            resolved: false,
            autoResolved: false
          });
        } else if (metric.status === 'warning') {
          componentScore -= 15;
          issues.push({
            id: `issue_${metric.id}_${Date.now()}`,
            component,
            severity: 'warning',
            message: `${metric.name}이(가) 경고 수준입니다 (${metric.value}${metric.unit})`,
            timestamp: new Date(),
            resolved: false,
            autoResolved: false
          });
        }
      });

      health.score = Math.max(0, componentScore);
      health.issues = issues;
      health.lastCheck = new Date();
      
      // 상태 결정
      if (health.score >= 80) {
        health.status = 'healthy';
      } else if (health.score >= 60) {
        health.status = 'degraded';
      } else {
        health.status = 'down';
      }

      overallScore += health.score;
      totalComponents++;
    });

    // 전체 시스템 건강 상태 업데이트
    this.systemHealth.overall.score = totalComponents > 0 ? overallScore / totalComponents : 100;
    this.systemHealth.lastUpdated = new Date();
    
    // 전체 상태 결정
    if (criticalIssues > 2) {
      this.systemHealth.overall.status = 'down';
    } else if (this.systemHealth.overall.score >= 80) {
      this.systemHealth.overall.status = 'healthy';
    } else {
      this.systemHealth.overall.status = 'degraded';
    }

    // 업타임 업데이트 (시뮬레이션)
    this.systemHealth.uptime += this.monitoringInterval;
  }

  /**
   * 확장성 분석
   */
  private analyzeScalability(): void {
    const criticalComponents: SystemComponent[] = ['web_server', 'game_server', 'database'];

    criticalComponents.forEach(component => {
      const utilization = this.resourceUtilization.get(component);
      if (!utilization) return;

      const avgUtilization = (utilization.cpu + utilization.memory) / 2;
      const concurrentUsers = this.getCurrentConcurrentUsers();
      
      // 현재 용량 추정 (동시 접속자 기준)
      const currentCapacity = 1000; // 예시 최대 용량
      const currentLoad = concurrentUsers;
      const utilizationRate = (currentLoad / currentCapacity) * 100;

      // 확장성 메트릭 계산
      let recommendedAction: ScalabilityMetric['recommendedAction'] = 'monitor';
      let timeToCapacity = Infinity;

      if (utilizationRate > 90) {
        recommendedAction = 'scale_out';
        timeToCapacity = 1; // 즉시
      } else if (utilizationRate > 80) {
        recommendedAction = 'scale_up';
        timeToCapacity = 24; // 24시간
      } else if (avgUtilization > 85) {
        recommendedAction = 'optimize';
        timeToCapacity = 72; // 3일
      }

      const scalabilityMetric: ScalabilityMetric = {
        currentCapacity,
        currentLoad,
        utilizationRate,
        estimatedTimeToCapacity: timeToCapacity,
        recommendedAction,
        nextReview: new Date(Date.now() + 60 * 60 * 1000) // 1시간 후
      };

      this.scalabilityMetrics.set(component, scalabilityMetric);
    });
  }

  /**
   * 알림 규칙 평가
   */
  private evaluateAlertRules(): void {
    const now = Date.now();

    this.alertRules.forEach(rule => {
      if (!rule.isActive) return;

      // 쿨다운 확인
      if (rule.lastTriggered && (now - rule.lastTriggered.getTime()) < rule.cooldown * 1000) {
        return;
      }

      // 메트릭 값 확인
      const relevantMetrics = Array.from(this.metrics.values()).filter(metric => {
        if (metric.type !== rule.metric) return false;
        if (rule.component && metric.component !== rule.component) return false;
        return true;
      });

      relevantMetrics.forEach(metric => {
        if (this.evaluateCondition(metric, rule.condition)) {
          this.triggerAlert(rule, metric);
        }
      });
    });
  }

  /**
   * 조건 평가
   */
  private evaluateCondition(metric: SystemMetric, condition: AlertCondition): boolean {
    const value = metric.value;
    const threshold = condition.value;

    let conditionMet = false;
    switch (condition.operator) {
      case 'greater_than':
        conditionMet = value > threshold;
        break;
      case 'less_than':
        conditionMet = value < threshold;
        break;
      case 'equals':
        conditionMet = Math.abs(value - threshold) < 0.01;
        break;
      case 'percentage_increase':
        if (metric.historicalData.length >= 2) {
          const previous = metric.historicalData[metric.historicalData.length - 2].value;
          const increase = ((value - previous) / previous) * 100;
          conditionMet = increase > threshold;
        }
        break;
      case 'percentage_decrease':
        if (metric.historicalData.length >= 2) {
          const previous = metric.historicalData[metric.historicalData.length - 2].value;
          const decrease = ((previous - value) / previous) * 100;
          conditionMet = decrease > threshold;
        }
        break;
    }

    // 연속 체크 조건 확인
    if (conditionMet && condition.consecutiveChecks) {
      const recentData = metric.historicalData.slice(-condition.consecutiveChecks);
      return recentData.length >= condition.consecutiveChecks &&
             recentData.every(point => {
               switch (condition.operator) {
                 case 'greater_than': return point.value > threshold;
                 case 'less_than': return point.value < threshold;
                 default: return true;
               }
             });
    }

    return conditionMet;
  }

  /**
   * 알림 트리거
   */
  private triggerAlert(rule: AlertRule, metric: SystemMetric): void {
    rule.lastTriggered = new Date();
    rule.triggerCount++;

    const alertMessage = `[${rule.name}] ${metric.component} - ${metric.name}: ${metric.value}${metric.unit}`;

    switch (rule.action.type) {
      case 'notification':
        this.sendNotification(rule.action.target, alertMessage);
        break;
      case 'auto_scale':
        this.executeAutoScale(rule.action.target);
        break;
      case 'restart_service':
        this.restartService(rule.action.target);
        break;
      case 'webhook':
        this.callWebhook(rule.action.target, { rule, metric, message: alertMessage });
        break;
    }

    // 인시던트 생성 (심각한 경우)
    if (metric.status === 'critical') {
      this.createIncident({
        title: `시스템 리소스 임계값 초과: ${metric.component}`,
        description: alertMessage,
        severity: 'critical',
        affectedComponents: [metric.component],
        startTime: new Date()
      });
    }

    logger.warn(`알림 트리거: ${alertMessage}`);
  }

  /**
   * 인시던트 생성
   */
  private createIncident(incidentData: Omit<Incident, 'id' | 'impact'>): void {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const incident: Incident = {
      id: incidentId,
      impact: {
        usersAffected: this.getCurrentConcurrentUsers(),
        downtime: 0,
        revenueImpact: 0,
        reputationImpact: 'minor'
      },
      lessons: [],
      ...incidentData
    };

    this.incidents.set(incidentId, incident);
    logger.error(`인시던트 생성: ${incident.title}`);
  }

  /**
   * 히스토리 정리
   */
  private cleanupHistory(): void {
    // 메트릭 히스토리 정리
    this.metrics.forEach(metric => {
      if (metric.historicalData.length > 1000) {
        metric.historicalData = metric.historicalData.slice(-1000);
      }
    });

    // 성능 히스토리 정리
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
    }

    // 해결된 인시던트 정리 (30일 이상)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.incidents.forEach((incident, id) => {
      if (incident.endTime && incident.endTime < thirtyDaysAgo) {
        this.incidents.delete(id);
      }
    });
  }

  /**
   * 컴포넌트 의존성 가져오기
   */
  private getComponentDependencies(component: SystemComponent): string[] {
    const dependencies: Record<SystemComponent, string[]> = {
      'web_server': ['load_balancer', 'auth_service'],
      'game_server': ['database', 'cache', 'message_queue'],
      'database': ['file_storage'],
      'cache': [],
      'file_storage': [],
      'load_balancer': [],
      'message_queue': [],
      'auth_service': ['database'],
      'payment_service': ['auth_service', 'database']
    };

    return dependencies[component] || [];
  }

  /**
   * 액션 실행 함수들
   */
  private sendNotification(target: string, message: string): void {
    logger.info(`알림 전송 to ${target}: ${message}`);
  }

  private executeAutoScale(target: string): void {
    logger.info(`자동 스케일링 실행: ${target}`);
  }

  private restartService(target: string): void {
    logger.warn(`서비스 재시작: ${target}`);
  }

  private callWebhook(url: string, data: Record<string, unknown>): void {
    logger.info(`웹훅 호출: ${url}`, data);
  }

  /**
   * 공개 API 메서드들
   */
  
  /**
   * 시스템 건강 상태 조회
   */
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  /**
   * 메트릭 조회
   */
  getMetric(metricId: string): SystemMetric | null {
    return this.metrics.get(metricId) || null;
  }

  /**
   * 모든 메트릭 조회
   */
  getAllMetrics(): SystemMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 컴포넌트별 메트릭 조회
   */
  getMetricsByComponent(component: SystemComponent): SystemMetric[] {
    return Array.from(this.metrics.values())
      .filter(metric => metric.component === component);
  }

  /**
   * 리소스 사용률 조회
   */
  getResourceUtilization(component?: SystemComponent): ResourceUtilization[] {
    if (component) {
      const utilization = this.resourceUtilization.get(component);
      return utilization ? [utilization] : [];
    }
    return Array.from(this.resourceUtilization.values());
  }

  /**
   * 확장성 메트릭 조회
   */
  getScalabilityMetrics(): ScalabilityMetric[] {
    return Array.from(this.scalabilityMetrics.values());
  }

  /**
   * 활성 인시던트 조회
   */
  getActiveIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .filter(incident => !incident.endTime);
  }

  /**
   * 모든 인시던트 조회
   */
  getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * 성능 보고서 생성
   */
  generatePerformanceReport(startDate: Date, endDate: Date): PerformanceReport {
    const filteredHistory = this.performanceHistory.filter(point =>
      point.timestamp >= startDate && point.timestamp <= endDate
    );

    const incidents = Array.from(this.incidents.values()).filter(incident =>
      incident.startTime >= startDate && incident.startTime <= endDate
    );

    // 요약 통계 계산
    const responseTimeData = filteredHistory
      .filter(point => point.context?.includes('response_time'))
      .map(point => point.value);

    const errorRateData = filteredHistory
      .filter(point => point.context?.includes('error_rate'))
      .map(point => point.value);

    const summary = {
      averageResponseTime: responseTimeData.length > 0 ? 
        responseTimeData.reduce((a, b) => a + b, 0) / responseTimeData.length : 0,
      totalRequests: filteredHistory.length,
      errorRate: errorRateData.length > 0 ?
        errorRateData.reduce((a, b) => a + b, 0) / errorRateData.length : 0,
      uptime: this.calculateUptime(incidents),
      peakConcurrentUsers: this.calculatePeakUsers(filteredHistory)
    };

    // 성능 메트릭 계산
    const metrics = this.calculatePerformanceMetrics(filteredHistory);

    // 추천사항 생성
    const recommendations = this.generatePerformanceRecommendations(summary, incidents);

    return {
      period: { start: startDate, end: endDate },
      summary,
      metrics,
      incidents,
      recommendations
    };
  }

  /**
   * 알림 규칙 관리
   */
  createAlertRule(rule: Omit<AlertRule, 'id' | 'triggerCount'>): string {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.alertRules.set(ruleId, { ...rule, id: ruleId, triggerCount: 0 });
    return ruleId;
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;
    
    Object.assign(rule, updates);
    return true;
  }

  deleteAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * 인시던트 관리
   */
  resolveIncident(incidentId: string, resolution: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    incident.endTime = new Date();
    incident.duration = incident.endTime.getTime() - incident.startTime.getTime();
    incident.resolution = resolution;

    logger.info(`인시던트 해결: ${incident.title}`);
    return true;
  }

  addIncidentNote(incidentId: string, note: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    incident.lessons.push(note);
    return true;
  }

  /**
   * 시스템 상태 요약
   */
  getSystemSummary(): {
    health: HealthStatus;
    criticalMetrics: SystemMetric[];
    activeIncidents: number;
    recommendations: string[];
  } {
    const criticalMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.status === 'critical');

    const activeIncidents = this.getActiveIncidents().length;

    const recommendations = this.generateSystemRecommendations();

    return {
      health: this.systemHealth.overall,
      criticalMetrics,
      activeIncidents,
      recommendations
    };
  }

  // 헬퍼 함수들
  private calculateUptime(incidents: Incident[]): number {
    const totalDowntime = incidents.reduce((sum, incident) => {
      return sum + (incident.duration || 0);
    }, 0);

    const totalTime = 24 * 60 * 60 * 1000; // 24시간 (밀리초)
    return ((totalTime - totalDowntime) / totalTime) * 100;
  }

  private calculatePeakUsers(history: MetricDataPoint[]): number {
    const userCounts = history
      .filter(point => point.context?.includes('concurrent_users'))
      .map(point => point.value);

    return userCounts.length > 0 ? Math.max(...userCounts) : 0;
  }

  private calculatePerformanceMetrics(history: MetricDataPoint[]): PerformanceMetric[] {
    // 메트릭별로 그룹화하고 통계 계산
    const metricGroups = new Map<string, number[]>();
    
    history.forEach(point => {
      if (point.context) {
        if (!metricGroups.has(point.context)) {
          metricGroups.set(point.context, []);
        }
        metricGroups.get(point.context)!.push(point.value);
      }
    });

    const performanceMetrics: PerformanceMetric[] = [];

    metricGroups.forEach((values, context) => {
      values.sort((a, b) => a - b);
      
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const minimum = values[0];
      const maximum = values[values.length - 1];
      const percentile95 = values[Math.floor(values.length * 0.95)];
      const percentile99 = values[Math.floor(values.length * 0.99)];

      performanceMetrics.push({
        name: context,
        average,
        minimum,
        maximum,
        percentile95,
        percentile99,
        unit: this.getMetricUnit(context),
        trend: this.calculateMetricTrend(values)
      });
    });

    return performanceMetrics;
  }

  private getMetricUnit(context: string): string {
    if (context.includes('response_time')) return 'ms';
    if (context.includes('usage')) return '%';
    if (context.includes('rate')) return '%';
    if (context.includes('users')) return 'users';
    return '';
  }

  private calculateMetricTrend(values: number[]): TrendDirection {
    if (values.length < 10) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (changePercent > 10) return 'up';
    if (changePercent < -10) return 'down';
    return 'stable';
  }

  private generatePerformanceRecommendations(
    summary: { averageResponseTime: number; errorRate: number; cpuUsage: number; memoryUsage: number }, 
    incidents: Incident[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // 응답 시간 기반 추천
    if (summary.averageResponseTime > 500) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'API 응답 시간 최적화',
        description: '평균 응답 시간이 목표치를 초과하고 있습니다.',
        expectedBenefit: '응답 시간 30% 개선 예상',
        estimatedEffort: '2-3주',
        implementation: [
          '데이터베이스 쿼리 최적화',
          '캐시 전략 개선',
          'API 엔드포인트 리팩토링'
        ]
      });
    }

    // 에러율 기반 추천
    if (summary.errorRate > 2) {
      recommendations.push({
        type: 'infrastructure',
        priority: 'urgent',
        title: '에러율 개선',
        description: '에러율이 허용 기준을 초과하고 있습니다.',
        expectedBenefit: '시스템 안정성 향상',
        estimatedEffort: '1-2주',
        implementation: [
          '에러 로깅 및 모니터링 강화',
          '장애 복구 프로세스 개선',
          '코드 품질 검토'
        ]
      });
    }

    // 확장성 기반 추천
    const scalabilityMetrics = Array.from(this.scalabilityMetrics.values());
    const needsScaling = scalabilityMetrics.some(metric => 
      metric.recommendedAction === 'scale_up' || metric.recommendedAction === 'scale_out'
    );

    if (needsScaling) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        title: '시스템 확장',
        description: '현재 리소스 사용률이 높아 확장이 필요합니다.',
        expectedBenefit: '성능 및 안정성 향상',
        estimatedEffort: '1주',
        implementation: [
          '서버 리소스 증설',
          '로드 밸런서 설정 조정',
          '자동 스케일링 구성'
        ]
      });
    }

    return recommendations;
  }

  private generateSystemRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // 중요한 메트릭 확인
    const criticalMetrics = Array.from(this.metrics.values())
      .filter(metric => metric.status === 'critical');

    if (criticalMetrics.length > 0) {
      recommendations.push('임계 상태의 메트릭들을 즉시 확인하세요.');
    }

    // 활성 인시던트 확인
    const activeIncidents = this.getActiveIncidents();
    if (activeIncidents.length > 0) {
      recommendations.push(`${activeIncidents.length}개의 활성 인시던트를 해결하세요.`);
    }

    // 확장성 확인
    const needsAttention = Array.from(this.scalabilityMetrics.values())
      .filter(metric => metric.recommendedAction !== 'monitor');

    if (needsAttention.length > 0) {
      recommendations.push('리소스 확장 또는 최적화를 고려하세요.');
    }

    if (recommendations.length === 0) {
      recommendations.push('시스템이 정상적으로 작동하고 있습니다.');
    }

    return recommendations;
  }
}

// 전역 시스템 리소스 모니터 인스턴스
export const systemResourceMonitor = new SystemResourceMonitor();

// 시스템 리소스 모니터링 관련 유틸리티
export const resourceMonitorUtils = {
  /**
   * 메트릭 타입 표시명
   */
  getMetricTypeDisplayName(type: ResourceMetricType): string {
    const names = {
      cpu_usage: 'CPU 사용률',
      memory_usage: '메모리 사용률',
      disk_usage: '디스크 사용률',
      network_bandwidth: '네트워크 대역폭',
      database_performance: '데이터베이스 성능',
      response_time: '응답 시간',
      error_rate: '에러율',
      throughput: '처리량',
      concurrent_users: '동시 사용자',
      queue_length: '큐 길이',
      cache_hit_rate: '캐시 히트율',
      api_latency: 'API 지연시간'
    };
    return names[type];
  },

  /**
   * 컴포넌트 표시명
   */
  getComponentDisplayName(component: SystemComponent): string {
    const names = {
      web_server: '웹 서버',
      game_server: '게임 서버',
      database: '데이터베이스',
      cache: '캐시',
      file_storage: '파일 스토리지',
      load_balancer: '로드 밸런서',
      message_queue: '메시지 큐',
      auth_service: '인증 서비스',
      payment_service: '결제 서비스'
    };
    return names[component];
  },

  /**
   * 상태 색상
   */
  getStatusColor(status: MetricStatus): string {
    const colors = {
      healthy: '#28a745',
      warning: '#ffc107',
      critical: '#dc3545',
      unknown: '#6c757d'
    };
    return colors[status];
  },

  /**
   * 트렌드 아이콘
   */
  getTrendIcon(trend: TrendDirection): string {
    const icons = {
      up: '📈',
      down: '📉',
      stable: '➡️',
      fluctuating: '📊'
    };
    return icons[trend];
  },

  /**
   * 값 포맷팅
   */
  formatMetricValue(value: number, unit: string): string {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'ms') {
      return `${value.toFixed(0)}ms`;
    }
    if (unit === 'users') {
      return `${Math.floor(value)} users`;
    }
    return `${value.toFixed(2)} ${unit}`;
  },

  /**
   * 건강도 등급
   */
  getHealthGrade(score: number): { grade: string; color: string } {
    if (score >= 95) return { grade: 'A+', color: '#28a745' };
    if (score >= 90) return { grade: 'A', color: '#32cd32' };
    if (score >= 80) return { grade: 'B', color: '#ffc107' };
    if (score >= 70) return { grade: 'C', color: '#fd7e14' };
    if (score >= 60) return { grade: 'D', color: '#dc3545' };
    return { grade: 'F', color: '#6f42c1' };
  }
};
