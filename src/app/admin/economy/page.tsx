'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// 경제 통계 인터페이스
interface EconomyStats {
  totalGold: number;
  goldInCirculation: number;
  dailyGoldCreated: number;
  dailyGoldDestroyed: number;
  inflationRate: number;
  averagePlayerGold: number;
  totalTransactions: number;
  dailyTransactionVolume: number;
}

// 골드 소스/싱크 데이터
interface GoldFlow {
  id: string;
  type: 'source' | 'sink';
  category: string;
  name: string;
  dailyAmount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// 아이템 가격 데이터
interface ItemPrice {
  itemId: string;
  itemName: string;
  averagePrice: number;
  priceChange24h: number;
  priceChange7d: number;
  transactionCount: number;
  category: string;
  rarity: string;
}

// 거래 로그
interface TransactionLog {
  id: string;
  timestamp: Date;
  type: 'player_trade' | 'npc_shop' | 'auction' | 'quest_reward' | 'monster_drop';
  playerId?: string;
  playerName?: string;
  itemId?: string;
  itemName?: string;
  quantity: number;
  price: number;
  suspicious: boolean;
  suspiciousReason?: string;
}

// 경제 정책 설정
interface EconomyPolicy {
  id: string;
  name: string;
  type: 'tax' | 'shop_price' | 'reward_multiplier' | 'drop_rate';
  value: number;
  isActive: boolean;
  description: string;
}

// 더미 데이터 생성
const createEconomyStats = (): EconomyStats => ({
  totalGold: 45892156,
  goldInCirculation: 38473821,
  dailyGoldCreated: 1247583,
  dailyGoldDestroyed: 956724,
  inflationRate: 2.3,
  averagePlayerGold: 2456,
  totalTransactions: 892456,
  dailyTransactionVolume: 45239
});

const createGoldFlows = (): GoldFlow[] => [
  {
    id: 'quest_rewards',
    type: 'source',
    category: '퀘스트',
    name: '퀘스트 보상',
    dailyAmount: 524830,
    percentage: 42.1,
    trend: 'up'
  },
  {
    id: 'monster_drops',
    type: 'source',
    category: '몬스터',
    name: '몬스터 드롭',
    dailyAmount: 387456,
    percentage: 31.0,
    trend: 'stable'
  },
  {
    id: 'daily_rewards',
    type: 'source',
    category: '시스템',
    name: '일일 보상',
    dailyAmount: 185239,
    percentage: 14.9,
    trend: 'down'
  },
  {
    id: 'item_sales',
    type: 'source',
    category: '거래',
    name: '아이템 판매',
    dailyAmount: 150058,
    percentage: 12.0,
    trend: 'up'
  },
  {
    id: 'npc_shops',
    type: 'sink',
    category: '상점',
    name: 'NPC 상점',
    dailyAmount: 456789,
    percentage: 47.7,
    trend: 'stable'
  },
  {
    id: 'repair_costs',
    type: 'sink',
    category: '수리',
    name: '장비 수리',
    dailyAmount: 234567,
    percentage: 24.5,
    trend: 'up'
  },
  {
    id: 'auction_fees',
    type: 'sink',
    category: '수수료',
    name: '경매장 수수료',
    dailyAmount: 156234,
    percentage: 16.3,
    trend: 'up'
  },
  {
    id: 'taxes',
    type: 'sink',
    category: '세금',
    name: '거래 세금',
    dailyAmount: 109134,
    percentage: 11.4,
    trend: 'stable'
  }
];

const createItemPrices = (): ItemPrice[] => [
  {
    itemId: 'iron_sword',
    itemName: '철 검',
    averagePrice: 125,
    priceChange24h: 3.2,
    priceChange7d: -1.8,
    transactionCount: 456,
    category: 'weapon',
    rarity: 'common'
  },
  {
    itemId: 'health_potion',
    itemName: '체력 물약',
    averagePrice: 52,
    priceChange24h: 0.5,
    priceChange7d: 2.1,
    transactionCount: 2341,
    category: 'consumable',
    rarity: 'common'
  },
  {
    itemId: 'legendary_staff',
    itemName: '아르카나 지팡이',
    averagePrice: 48500,
    priceChange24h: 15.2,
    priceChange7d: 23.7,
    transactionCount: 3,
    category: 'weapon',
    rarity: 'legendary'
  },
  {
    itemId: 'dragon_scale',
    itemName: '용의 비늘',
    averagePrice: 950,
    priceChange24h: -5.3,
    priceChange7d: 8.9,
    transactionCount: 89,
    category: 'material',
    rarity: 'epic'
  }
];

const createTransactionLogs = (): TransactionLog[] => [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'player_trade',
    playerId: 'player1',
    playerName: '용사123',
    itemId: 'iron_sword',
    itemName: '철 검',
    quantity: 1,
    price: 125,
    suspicious: false
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: 'auction',
    playerId: 'player2',
    playerName: '마법사ABC',
    itemId: 'legendary_staff',
    itemName: '아르카나 지팡이',
    quantity: 1,
    price: 50000,
    suspicious: true,
    suspiciousReason: '시장가 대비 과도한 가격'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    type: 'npc_shop',
    playerId: 'player3',
    playerName: '궁수DEF',
    itemId: 'health_potion',
    itemName: '체력 물약',
    quantity: 50,
    price: 2500,
    suspicious: false
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: 'player_trade',
    playerId: 'player4',
    playerName: '도적GHI',
    itemId: 'dragon_scale',
    itemName: '용의 비늘',
    quantity: 10,
    price: 1,
    suspicious: true,
    suspiciousReason: '비정상적으로 낮은 가격'
  }
];

const createEconomyPolicies = (): EconomyPolicy[] => [
  {
    id: 'auction_tax',
    name: '경매장 거래 세금',
    type: 'tax',
    value: 5.0,
    isActive: true,
    description: '경매장에서 거래 시 부과되는 세금 (%)'
  },
  {
    id: 'shop_price_multiplier',
    name: 'NPC 상점 가격 배율',
    type: 'shop_price',
    value: 1.2,
    isActive: true,
    description: 'NPC 상점 아이템 가격에 적용되는 배율'
  },
  {
    id: 'quest_gold_bonus',
    name: '퀘스트 골드 보너스',
    type: 'reward_multiplier',
    value: 1.0,
    isActive: true,
    description: '퀘스트 완료 시 골드 보상 배율'
  },
  {
    id: 'rare_drop_rate',
    name: '희귀 아이템 드롭률',
    type: 'drop_rate',
    value: 2.5,
    isActive: true,
    description: '희귀 아이템 드롭률 (%)'
  }
];

export default function EconomyManagement() {
  const [economyStats] = useState<EconomyStats>(createEconomyStats());
  const [goldFlows] = useState<GoldFlow[]>(createGoldFlows());
  const [itemPrices] = useState<ItemPrice[]>(createItemPrices());
  const [transactionLogs] = useState<TransactionLog[]>(createTransactionLogs());
  const [policies, setPolicies] = useState<EconomyPolicy[]>(createEconomyPolicies());
  
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  
  const { isOpen: policyModalOpen, openModal: openPolicyModal, closeModal: closePolicyModal } = useModal();
  const { isOpen: alertModalOpen, openModal: openAlertModal, closeModal: closeAlertModal } = useModal();

  // 필터링된 거래 로그
  const filteredTransactions = useMemo(() => {
    return transactionLogs.filter(transaction => {
      const matchesSearch = !searchTerm || 
        transaction.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.itemName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSuspicious = !suspiciousOnly || transaction.suspicious;
      
      return matchesSearch && matchesSuspicious;
    });
  }, [transactionLogs, searchTerm, suspiciousOnly]);

  // 골드 플로우 계산
  const goldFlowStats = useMemo(() => {
    const sources = goldFlows.filter(f => f.type === 'source');
    const sinks = goldFlows.filter(f => f.type === 'sink');
    const totalIn = sources.reduce((sum, f) => sum + f.dailyAmount, 0);
    const totalOut = sinks.reduce((sum, f) => sum + f.dailyAmount, 0);
    const netFlow = totalIn - totalOut;
    
    return { totalIn, totalOut, netFlow, sources, sinks };
  }, [goldFlows]);

  // 의심스러운 거래 개수
  const suspiciousCount = useMemo(() => {
    return transactionLogs.filter(t => t.suspicious).length;
  }, [transactionLogs]);

  // 정책 업데이트
  const updatePolicy = (policyId: string, value: number) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, value }
        : policy
    ));
  };

  // 정책 활성/비활성 토글
  const togglePolicy = (policyId: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, isActive: !policy.isActive }
        : policy
    ));
  };

  // 가격 변동 색상
  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // 트렌드 아이콘
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➖';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">경제 관리</h1>
            <p className="text-gray-600">게임 내 경제 시스템 모니터링 및 관리</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="1d">최근 1일</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
            </select>
            <Button variant="secondary">
              리포트 생성
            </Button>
            <Button variant="primary" onClick={openPolicyModal}>
              정책 설정
            </Button>
          </div>
        </div>

        {/* 경제 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 골드</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.floor(economyStats.totalGold / 1000000)}M
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
            <div className="mt-4">
              <Progress 
                value={economyStats.goldInCirculation} 
                max={economyStats.totalGold} 
                size="sm"
                variant="warning"
              />
              <div className="text-xs text-gray-600 mt-1">
                유통 중: {Math.floor(economyStats.goldInCirculation / 1000000)}M
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">일일 골드 순증가</p>
                <p className="text-2xl font-bold text-green-600">
                  +{Math.floor(goldFlowStats.netFlow / 1000)}K
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
            <div className="mt-4 text-sm">
              <div className="text-green-600">생성: +{Math.floor(goldFlowStats.totalIn / 1000)}K</div>
              <div className="text-red-600">소멸: -{Math.floor(goldFlowStats.totalOut / 1000)}K</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">인플레이션율</p>
                <p className="text-2xl font-bold text-orange-600">
                  {economyStats.inflationRate}%
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              평균 플레이어 골드: {economyStats.averagePlayerGold.toLocaleString()}G
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">일일 거래량</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(economyStats.dailyTransactionVolume / 1000)}K
                </p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600">
                의심스러운 거래: 
                <span className="text-red-600 font-medium ml-1">{suspiciousCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 골드 플로우 */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">골드 플로우</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-green-600 mb-2">골드 소스 (일일)</h3>
                  <div className="space-y-2">
                    {goldFlowStats.sources.map(source => (
                      <div key={source.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{source.name}</span>
                          <span className="text-xs">{getTrendIcon(source.trend)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.floor(source.dailyAmount / 1000)}K
                          </div>
                          <div className="text-xs text-gray-600">
                            {source.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-red-600 mb-2">골드 싱크 (일일)</h3>
                  <div className="space-y-2">
                    {goldFlowStats.sinks.map(sink => (
                      <div key={sink.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sink.name}</span>
                          <span className="text-xs">{getTrendIcon(sink.trend)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.floor(sink.dailyAmount / 1000)}K
                          </div>
                          <div className="text-xs text-gray-600">
                            {sink.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 중앙: 아이템 가격 동향 */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">아이템 가격 동향</h2>
              
              <div className="space-y-3">
                {itemPrices.map(item => (
                  <div key={item.itemId} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-gray-600">{item.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.averagePrice.toLocaleString()}G</div>
                        <div className="text-xs text-gray-600">
                          {item.transactionCount} 거래
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={getPriceChangeColor(item.priceChange24h)}>
                        24h: {item.priceChange24h > 0 ? '+' : ''}{item.priceChange24h}%
                      </span>
                      <span className={getPriceChangeColor(item.priceChange7d)}>
                        7d: {item.priceChange7d > 0 ? '+' : ''}{item.priceChange7d}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 거래 로그 */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">거래 로그</h2>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                    className="w-32"
                  />
                  <Button
                    variant={suspiciousOnly ? 'warning' : 'ghost'}
                    size="sm"
                    onClick={() => setSuspiciousOnly(!suspiciousOnly)}
                  >
                    의심
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className={cn(
                      'p-3 border rounded-lg',
                      transaction.suspicious && 'border-red-200 bg-red-50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">
                          {transaction.playerName || 'System'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {transaction.type.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {transaction.price.toLocaleString()}G
                        </div>
                        <div className="text-xs text-gray-600">
                          {transaction.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    {transaction.itemName && (
                      <div className="text-sm text-gray-700 mb-1">
                        {transaction.itemName} × {transaction.quantity}
                      </div>
                    )}
                    
                    {transaction.suspicious && (
                      <div className="text-xs text-red-600 font-medium">
                        ⚠️ {transaction.suspiciousReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 하단: 빠른 액션 및 알림 */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">빠른 액션</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" size="sm" className="justify-start">
                💳 골드 지급
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                🗑️ 골드 회수
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                📊 가격 리셋
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                🚫 거래 제한
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                📈 이벤트 시작
              </Button>
              <Button variant="ghost" size="sm" className="justify-start" onClick={openAlertModal}>
                🚨 긴급 알림
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">경제 건강도</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>골드 유통 밸런스</span>
                <div className="flex items-center gap-2">
                  <Progress value={75} variant="success" size="sm" className="w-24" />
                  <span className="text-sm font-medium text-green-600">양호</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>가격 안정성</span>
                <div className="flex items-center gap-2">
                  <Progress value={60} variant="warning" size="sm" className="w-24" />
                  <span className="text-sm font-medium text-yellow-600">보통</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>거래 활성도</span>
                <div className="flex items-center gap-2">
                  <Progress value={85} variant="success" size="sm" className="w-24" />
                  <span className="text-sm font-medium text-green-600">활발</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>의심 거래 비율</span>
                <div className="flex items-center gap-2">
                  <Progress value={15} variant="danger" size="sm" className="w-24" />
                  <span className="text-sm font-medium text-red-600">주의</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 정책 설정 모달 */}
        <Modal
          isOpen={policyModalOpen}
          onClose={closePolicyModal}
          title="경제 정책 설정"
          size="lg"
        >
          <div className="space-y-4">
            {policies.map(policy => (
              <Card key={policy.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{policy.name}</h3>
                    <p className="text-sm text-gray-600">{policy.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={policy.isActive ? 'success' : 'ghost'}
                      size="sm"
                      onClick={() => togglePolicy(policy.id)}
                    >
                      {policy.isActive ? '활성' : '비활성'}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={policy.value}
                      onChange={(e) => updatePolicy(policy.id, parseFloat(e.target.value) || 0)}
                      disabled={!policy.isActive}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {policy.type === 'tax' && '%'}
                    {policy.type === 'shop_price' && '배율'}
                    {policy.type === 'reward_multiplier' && '배율'}
                    {policy.type === 'drop_rate' && '%'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={closePolicyModal} className="flex-1">
              적용
            </Button>
            <Button variant="ghost" onClick={closePolicyModal}>
              취소
            </Button>
          </div>
        </Modal>

        {/* 긴급 알림 모달 */}
        <Modal
          isOpen={alertModalOpen}
          onClose={closeAlertModal}
          title="긴급 경제 알림"
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h3 className="text-lg font-bold text-red-600 mb-2">경제 시스템 긴급 알림</h3>
              <p className="text-gray-600">
                플레이어들에게 긴급 경제 관련 공지를 발송합니다.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">알림 유형</label>
              <select className="w-full p-2 border rounded-md">
                <option value="maintenance">시스템 점검</option>
                <option value="inflation_warning">인플레이션 경고</option>
                <option value="trade_limit">거래 제한</option>
                <option value="price_adjustment">가격 조정</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">메시지</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={4}
                placeholder="긴급 알림 내용을 입력하세요..."
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="warning" className="flex-1">
                즉시 발송
              </Button>
              <Button variant="ghost" onClick={closeAlertModal}>
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
