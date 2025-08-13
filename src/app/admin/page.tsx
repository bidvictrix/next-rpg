'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

// 서버 통계 인터페이스
interface ServerStats {
  totalPlayers: number;
  onlinePlayers: number;
  activeGames: number;
  totalGold: number;
  totalItems: number;
  totalQuests: number;
  dailyRegistrations: number;
  serverUptime: number;
}

// 실시간 활동 로그
interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'login' | 'logout' | 'levelup' | 'quest' | 'battle' | 'trade' | 'error';
  playerId?: string;
  playerName?: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

// 시스템 상태
interface SystemStatus {
  server: 'online' | 'maintenance' | 'error';
  database: 'online' | 'slow' | 'error';
  api: 'online' | 'slow' | 'error';
  memory: number; // 사용률 %
  cpu: number; // 사용률 %
  disk: number; // 사용률 %
}

// 더미 데이터 생성
const createDummyStats = (): ServerStats => ({
  totalPlayers: 15847,
  onlinePlayers: 1284,
  activeGames: 623,
  totalGold: 45892156,
  totalItems: 2341876,
  totalQuests: 1247,
  dailyRegistrations: 89,
  serverUptime: 2547 // 시간
});

const createDummyLogs = (): ActivityLog[] => [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 30),
    type: 'levelup',
    playerId: 'player1',
    playerName: '용사123',
    message: '레벨 25에 도달했습니다!',
    severity: 'success'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60),
    type: 'quest',
    playerId: 'player2',
    playerName: '마법사ABC',
    message: '[일일] 몬스터 사냥 퀘스트를 완료했습니다.',
    severity: 'info'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 90),
    type: 'error',
    message: 'DB 연결 지연 발생 (응답시간: 2.3초)',
    severity: 'warning'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 120),
    type: 'login',
    playerId: 'player3',
    playerName: '궁수DEF',
    message: '게임에 접속했습니다.',
    severity: 'info'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 180),
    type: 'trade',
    playerId: 'player4',
    playerName: '상인GHI',
    message: '아이템 거래를 완료했습니다. (전설의 검)',
    severity: 'info'
  }
];

const createDummySystemStatus = (): SystemStatus => ({
  server: 'online',
  database: 'slow',
  api: 'online',
  memory: 67,
  cpu: 45,
  disk: 23
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<ServerStats>(createDummyStats());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(createDummyLogs());
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(createDummySystemStatus());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false);
  
  const { isOpen: announcementModalOpen, openModal: openAnnouncementModal, closeModal: closeAnnouncementModal } = useModal();
  const { isOpen: eventModalOpen, openModal: openEventModal, closeModal: closeEventModal } = useModal();
  const { isOpen: maintenanceModalOpen, openModal: openMaintenanceModal, closeModal: closeMaintenanceModal } = useModal();

  // 실시간 데이터 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      // 통계 업데이트
      setStats(prev => ({
        ...prev,
        onlinePlayers: prev.onlinePlayers + Math.floor(Math.random() * 10) - 5,
        activeGames: prev.activeGames + Math.floor(Math.random() * 6) - 3
      }));

      // 시스템 상태 업데이트
      setSystemStatus(prev => ({
        ...prev,
        memory: Math.max(0, Math.min(100, prev.memory + Math.floor(Math.random() * 6) - 3)),
        cpu: Math.max(0, Math.min(100, prev.cpu + Math.floor(Math.random() * 8) - 4))
      }));

      // 새 활동 로그 추가 (10% 확률)
      if (Math.random() < 0.1) {
        const newLog: ActivityLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type: ['login', 'levelup', 'quest', 'battle'][Math.floor(Math.random() * 4)] as any,
          playerName: `플레이어${Math.floor(Math.random() * 1000)}`,
          message: '새로운 활동이 발생했습니다.',
          severity: 'info'
        };
        
        setActivityLogs(prev => [newLog, ...prev.slice(0, 19)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 빠른 액션들
  const quickActions = [
    {
      id: 'announcement',
      name: '공지사항',
      description: '전체 공지사항을 작성합니다.',
      icon: '📢',
      color: 'bg-blue-500',
      action: openAnnouncementModal
    },
    {
      id: 'event',
      name: '이벤트 생성',
      description: '새로운 게임 이벤트를 만듭니다.',
      icon: '🎉',
      color: 'bg-green-500',
      action: openEventModal
    },
    {
      id: 'maintenance',
      name: '점검 모드',
      description: '서버 점검 모드를 설정합니다.',
      icon: '🔧',
      color: 'bg-orange-500',
      action: openMaintenanceModal
    },
    {
      id: 'backup',
      name: '백업 실행',
      description: '데이터베이스 백업을 실행합니다.',
      icon: '💾',
      color: 'bg-purple-500',
      action: () => console.log('백업 실행')
    }
  ];

  // 네비게이션 메뉴
  const navigationMenus = [
    {
      id: 'players',
      name: '플레이어 관리',
      description: '플레이어 정보 조회 및 관리',
      icon: '👥',
      href: '/admin/players'
    },
    {
      id: 'content',
      name: '콘텐츠 관리',
      description: '게임 콘텐츠 편집 및 관리',
      icon: '📝',
      href: '/admin/content'
    },
    {
      id: 'skills',
      name: '스킬 편집',
      description: '스킬 데이터 편집',
      icon: '🔮',
      href: '/admin/skills'
    },
    {
      id: 'monsters',
      name: '몬스터 편집',
      description: '몬스터 데이터 편집',
      icon: '👹',
      href: '/admin/monsters'
    },
    {
      id: 'items',
      name: '아이템 편집',
      description: '아이템 데이터 편집',
      icon: '⚔️',
      href: '/admin/items'
    },
    {
      id: 'economy',
      name: '경제 관리',
      description: '게임 내 경제 시스템 관리',
      icon: '💰',
      href: '/admin/economy'
    }
  ];

  // 활동 로그 타입별 스타일
  const getLogStyle = (type: ActivityLog['type'], severity: ActivityLog['severity']) => {
    const severityStyles = {
      info: 'border-blue-200 bg-blue-50',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50',
      error: 'border-red-200 bg-red-50'
    };
    
    return severityStyles[severity];
  };

  // 시스템 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'slow': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'maintenance': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-gray-600">게임 서버 관리 및 모니터링</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="1h">최근 1시간</option>
              <option value="24h">최근 24시간</option>
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
            </select>
            <div className="text-sm text-gray-600">
              마지막 업데이트: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* 서버 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 플레이어</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalPlayers.toLocaleString()}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <div className="mt-4 text-sm text-green-600">
              ↗ 오늘 {stats.dailyRegistrations}명 신규 가입
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">접속 중</p>
                <p className="text-3xl font-bold text-green-600">{stats.onlinePlayers.toLocaleString()}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
            <div className="mt-4">
              <Progress 
                value={stats.onlinePlayers} 
                max={stats.totalPlayers} 
                size="sm"
                variant="success"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">활성 게임</p>
                <p className="text-3xl font-bold text-purple-600">{stats.activeGames.toLocaleString()}</p>
              </div>
              <div className="text-4xl">🎮</div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              전투: {Math.floor(stats.activeGames * 0.4)}개
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">서버 가동시간</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.floor(stats.serverUptime / 24)}일
                </p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {stats.serverUptime % 24}시간
            </div>
          </Card>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 시스템 상태 & 빠른 액션 */}
          <div className="space-y-6">
            {/* 시스템 상태 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">시스템 상태</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>서버</span>
                  <span className={cn('font-medium', getStatusColor(systemStatus.server))}>
                    {systemStatus.server.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>데이터베이스</span>
                  <span className={cn('font-medium', getStatusColor(systemStatus.database))}>
                    {systemStatus.database.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>API</span>
                  <span className={cn('font-medium', getStatusColor(systemStatus.api))}>
                    {systemStatus.api.toUpperCase()}
                  </span>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>메모리</span>
                        <span>{systemStatus.memory}%</span>
                      </div>
                      <Progress value={systemStatus.memory} variant="warning" size="sm" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU</span>
                        <span>{systemStatus.cpu}%</span>
                      </div>
                      <Progress value={systemStatus.cpu} variant="info" size="sm" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>디스크</span>
                        <span>{systemStatus.disk}%</span>
                      </div>
                      <Progress value={systemStatus.disk} variant="success" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 빠른 액션 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">빠른 액션</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="p-4 text-white rounded-lg hover:opacity-90 transition-opacity text-left"
                    style={{ backgroundColor: action.color.replace('bg-', '') === 'blue-500' ? '#3B82F6' : 
                              action.color.replace('bg-', '') === 'green-500' ? '#10B981' :
                              action.color.replace('bg-', '') === 'orange-500' ? '#F59E0B' : '#8B5CF6' }}
                  >
                    <div className="text-2xl mb-2">{action.icon}</div>
                    <div className="font-medium text-sm">{action.name}</div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* 중앙: 활동 로그 */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">실시간 활동</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLogs.map(log => (
                  <div
                    key={log.id}
                    className={cn('p-3 border rounded-lg', getLogStyle(log.type, log.severity))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm">
                          {log.playerName && (
                            <span className="font-medium">{log.playerName}</span>
                          )}
                          <span className={log.playerName ? 'ml-1' : ''}>{log.message}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {log.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        {log.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 오른쪽: 네비게이션 */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">관리 메뉴</h2>
              <div className="space-y-3">
                {navigationMenus.map(menu => (
                  <a
                    key={menu.id}
                    href={menu.href}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{menu.icon}</div>
                      <div>
                        <div className="font-medium">{menu.name}</div>
                        <div className="text-sm text-gray-600">{menu.description}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 하단: 추가 통계 */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-bold mb-3">게임 경제</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>총 골드</span>
                <span className="font-medium">{stats.totalGold.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>총 아이템</span>
                <span className="font-medium">{stats.totalItems.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>활성 퀘스트</span>
                <span className="font-medium">{stats.totalQuests.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-3">서버 성능</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>평균 응답시간</span>
                <span className="font-medium text-green-600">142ms</span>
              </div>
              <div className="flex justify-between">
                <span>처리량</span>
                <span className="font-medium">1,247 req/min</span>
              </div>
              <div className="flex justify-between">
                <span>오류율</span>
                <span className="font-medium text-red-600">0.02%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-3">최근 업데이트</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>마지막 패치</span>
                <span className="text-gray-600">2일 전</span>
              </div>
              <div className="flex justify-between">
                <span>DB 백업</span>
                <span className="text-green-600">6시간 전</span>
              </div>
              <div className="flex justify-between">
                <span>서버 재시작</span>
                <span className="text-gray-600">3일 전</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 공지사항 모달 */}
        <Modal
          isOpen={announcementModalOpen}
          onClose={closeAnnouncementModal}
          title="공지사항 작성"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">제목</label>
              <Input placeholder="공지사항 제목을 입력하세요" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">내용</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={6}
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">우선순위</label>
              <select className="w-full p-2 border rounded-md">
                <option value="normal">일반</option>
                <option value="important">중요</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1">
                발송
              </Button>
              <Button variant="ghost" onClick={closeAnnouncementModal}>
                취소
              </Button>
            </div>
          </div>
        </Modal>

        {/* 이벤트 생성 모달 */}
        <Modal
          isOpen={eventModalOpen}
          onClose={closeEventModal}
          title="이벤트 생성"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">이벤트 이름</label>
              <Input placeholder="이벤트 이름" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">시작 시간</label>
                <Input type="datetime-local" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">종료 시간</label>
                <Input type="datetime-local" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">이벤트 타입</label>
              <select className="w-full p-2 border rounded-md">
                <option value="exp_boost">경험치 부스트</option>
                <option value="drop_boost">드롭률 증가</option>
                <option value="special_quest">특별 퀘스트</option>
                <option value="pvp_event">PvP 이벤트</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1">
                생성
              </Button>
              <Button variant="ghost" onClick={closeEventModal}>
                취소
              </Button>
            </div>
          </div>
        </Modal>

        {/* 점검 모드 모달 */}
        <Modal
          isOpen={maintenanceModalOpen}
          onClose={closeMaintenanceModal}
          title="점검 모드 설정"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-lg font-bold text-orange-600 mb-2">서버 점검 모드</h3>
              <p className="text-gray-600">
                점검 모드를 활성화하면 모든 플레이어가 접속할 수 없습니다.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">점검 시간 (분)</label>
              <Input type="number" placeholder="60" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">점검 사유</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={3}
                placeholder="점검 사유를 입력하세요"
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="warning" className="flex-1">
                점검 시작
              </Button>
              <Button variant="ghost" onClick={closeMaintenanceModal}>
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
