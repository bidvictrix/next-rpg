'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// 플레이어 인터페이스
interface Player {
  id: string;
  username: string;
  characterName: string;
  email: string;
  level: number;
  class: string;
  gold: number;
  experience: number;
  playtime: number; // 분 단위
  lastLogin: Date;
  registeredAt: Date;
  status: 'online' | 'offline' | 'banned' | 'suspended';
  location: string;
  guildName?: string;
  pvpRank: number;
  achievementCount: number;
  warnings: number;
  suspensionEnd?: Date;
  banReason?: string;
}

// 더미 플레이어 데이터 생성
const createDummyPlayers = (): Player[] => {
  const classes = ['warrior', 'mage', 'archer', 'thief', 'priest', 'paladin'];
  const locations = ['초보자 마을', '엘프 숲', '드워프 광산', '마법사 탑', '어둠의 던전'];
  const guilds = ['엘리트 길드', '드래곤 슬레이어', '마법사 연합', '도적 조합', null];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `player_${i + 1}`,
    username: `user${1000 + i}`,
    characterName: `${['용사', '마법사', '궁수', '도적', '성직자'][i % 5]}${i + 1}`,
    email: `user${1000 + i}@example.com`,
    level: Math.floor(Math.random() * 50) + 1,
    class: classes[i % classes.length],
    gold: Math.floor(Math.random() * 100000),
    experience: Math.floor(Math.random() * 50000),
    playtime: Math.floor(Math.random() * 5000), // 0-5000분
    lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 지난 7일 내
    registeredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // 지난 1년 내
    status: i < 15 ? 'online' : i < 45 ? 'offline' : i < 48 ? 'suspended' : 'banned',
    location: locations[i % locations.length],
    guildName: guilds[i % guilds.length] || undefined,
    pvpRank: Math.floor(Math.random() * 1000) + 1,
    achievementCount: Math.floor(Math.random() * 20),
    warnings: Math.floor(Math.random() * 5),
    suspensionEnd: i >= 45 && i < 48 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
    banReason: i >= 48 ? ['욕설', '핵 사용', '부정거래'][i % 3] : undefined
  }));
};

// 제재 타입
type SanctionType = 'warning' | 'suspension' | 'ban';

export default function PlayersManagement() {
  const [players, setPlayers] = useState<Player[]>(createDummyPlayers());
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'level' | 'playtime' | 'lastLogin' | 'registeredAt'>('lastLogin');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { isOpen: detailModalOpen, openModal: openDetailModal, closeModal: closeDetailModal } = useModal();
  const { isOpen: sanctionModalOpen, openModal: openSanctionModal, closeModal: closeSanctionModal } = useModal();

  // 필터링된 플레이어 목록
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = 
        player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      const matchesClass = classFilter === 'all' || player.class === classFilter;
      
      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [players, searchTerm, statusFilter, classFilter]);

  // 정렬된 플레이어 목록
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'lastLogin' || sortBy === 'registeredAt') {
        aVal = (aVal as Date).getTime();
        bVal = (bVal as Date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [filteredPlayers, sortBy, sortOrder]);

  // 페이지네이션
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlayers = sortedPlayers.slice(startIndex, startIndex + itemsPerPage);

  // 플레이어 상세 정보 보기
  const handlePlayerDetail = (player: Player) => {
    setSelectedPlayer(player);
    openDetailModal();
  };

  // 제재 모달 열기
  const handleSanction = (player: Player) => {
    setSelectedPlayer(player);
    openSanctionModal();
  };

  // 제재 실행
  const executeSanction = (type: SanctionType, reason: string, duration?: number) => {
    if (!selectedPlayer) return;

    setPlayers(prev => prev.map(player => {
      if (player.id === selectedPlayer.id) {
        switch (type) {
          case 'warning':
            return { ...player, warnings: player.warnings + 1 };
          case 'suspension':
            return {
              ...player,
              status: 'suspended',
              suspensionEnd: new Date(Date.now() + (duration || 24) * 60 * 60 * 1000)
            };
          case 'ban':
            return {
              ...player,
              status: 'banned',
              banReason: reason
            };
          default:
            return player;
        }
      }
      return player;
    }));

    closeSanctionModal();
  };

  // 제재 해제
  const removeSanction = (playerId: string) => {
    setPlayers(prev => prev.map(player => {
      if (player.id === playerId) {
        return {
          ...player,
          status: 'offline',
          suspensionEnd: undefined,
          banReason: undefined
        };
      }
      return player;
    }));
  };

  // 플레이어 통계
  const playerStats = useMemo(() => {
    const total = players.length;
    const online = players.filter(p => p.status === 'online').length;
    const banned = players.filter(p => p.status === 'banned').length;
    const suspended = players.filter(p => p.status === 'suspended').length;
    const avgLevel = Math.round(players.reduce((sum, p) => sum + p.level, 0) / total);
    const avgPlaytime = Math.round(players.reduce((sum, p) => sum + p.playtime, 0) / total);
    
    return { total, online, banned, suspended, avgLevel, avgPlaytime };
  }, [players]);

  // 상태별 색상
  const getStatusColor = (status: Player['status']) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-yellow-600 bg-yellow-100';
      case 'banned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 상태 텍스트
  const getStatusText = (status: Player['status']) => {
    switch (status) {
      case 'online': return '접속중';
      case 'offline': return '오프라인';
      case 'suspended': return '정지됨';
      case 'banned': return '밴됨';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">플레이어 관리</h1>
            <p className="text-gray-600">등록된 플레이어 조회 및 관리</p>
          </div>
          <Button variant="primary">
            플레이어 통계 내보내기
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{playerStats.total}</div>
              <div className="text-sm text-gray-600">전체 플레이어</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{playerStats.online}</div>
              <div className="text-sm text-gray-600">접속 중</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{playerStats.suspended}</div>
              <div className="text-sm text-gray-600">정지됨</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{playerStats.banned}</div>
              <div className="text-sm text-gray-600">밴됨</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{playerStats.avgLevel}</div>
              <div className="text-sm text-gray-600">평균 레벨</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.floor(playerStats.avgPlaytime / 60)}h</div>
              <div className="text-sm text-gray-600">평균 플레이</div>
            </div>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="플레이어 검색 (이름, 닉네임, 이메일)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon="🔍"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 상태</option>
              <option value="online">접속중</option>
              <option value="offline">오프라인</option>
              <option value="suspended">정지됨</option>
              <option value="banned">밴됨</option>
            </select>
            
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 클래스</option>
              <option value="warrior">전사</option>
              <option value="mage">마법사</option>
              <option value="archer">궁수</option>
              <option value="thief">도적</option>
              <option value="priest">성직자</option>
              <option value="paladin">성기사</option>
            </select>
            
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
              }}
              className="px-3 py-2 border rounded-md"
            >
              <option value="lastLogin_desc">최근 접속순</option>
              <option value="level_desc">레벨 높은순</option>
              <option value="level_asc">레벨 낮은순</option>
              <option value="playtime_desc">플레이타임 많은순</option>
              <option value="registeredAt_desc">최근 가입순</option>
            </select>
          </div>
        </Card>

        {/* 플레이어 목록 테이블 */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">플레이어</th>
                  <th className="text-left py-3 px-4">레벨/클래스</th>
                  <th className="text-left py-3 px-4">상태</th>
                  <th className="text-left py-3 px-4">위치</th>
                  <th className="text-left py-3 px-4">플레이타임</th>
                  <th className="text-left py-3 px-4">최근 접속</th>
                  <th className="text-left py-3 px-4">경고</th>
                  <th className="text-left py-3 px-4">액션</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPlayers.map(player => (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{player.characterName}</div>
                        <div className="text-sm text-gray-600">{player.username}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">Lv.{player.level}</div>
                        <div className="text-sm text-gray-600">{player.class}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(player.status))}>
                        {getStatusText(player.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{player.location}</td>
                    <td className="py-3 px-4 text-sm">
                      {Math.floor(player.playtime / 60)}h {player.playtime % 60}m
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {player.lastLogin.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {player.warnings > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          {player.warnings}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlayerDetail(player)}
                        >
                          상세
                        </Button>
                        {player.status !== 'banned' && player.status !== 'suspended' && (
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleSanction(player)}
                          >
                            제재
                          </Button>
                        )}
                        {(player.status === 'banned' || player.status === 'suspended') && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => removeSanction(player.id)}
                          >
                            해제
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              총 {filteredPlayers.length}명 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredPlayers.length)}명 표시
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                이전
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                다음
              </Button>
            </div>
          </div>
        </Card>

        {/* 플레이어 상세 정보 모달 */}
        <Modal
          isOpen={detailModalOpen}
          onClose={closeDetailModal}
          title={selectedPlayer ? `${selectedPlayer.characterName} 상세 정보` : ''}
          size="lg"
        >
          {selectedPlayer && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">기본 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>사용자명:</span>
                      <span className="font-medium">{selectedPlayer.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>캐릭터명:</span>
                      <span className="font-medium">{selectedPlayer.characterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>이메일:</span>
                      <span className="font-medium">{selectedPlayer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>가입일:</span>
                      <span className="font-medium">{selectedPlayer.registeredAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>최근 접속:</span>
                      <span className="font-medium">{selectedPlayer.lastLogin.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-3">게임 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>레벨:</span>
                      <span className="font-medium">{selectedPlayer.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>클래스:</span>
                      <span className="font-medium">{selectedPlayer.class}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>골드:</span>
                      <span className="font-medium">{selectedPlayer.gold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>경험치:</span>
                      <span className="font-medium">{selectedPlayer.experience.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PvP 랭킹:</span>
                      <span className="font-medium">{selectedPlayer.pvpRank}위</span>
                    </div>
                    <div className="flex justify-between">
                      <span>업적:</span>
                      <span className="font-medium">{selectedPlayer.achievementCount}개</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 플레이타임 */}
              <div>
                <h3 className="font-bold mb-3">플레이 통계</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-center mb-2">
                    {Math.floor(selectedPlayer.playtime / 60)}시간 {selectedPlayer.playtime % 60}분
                  </div>
                  <div className="text-center text-gray-600">총 플레이타임</div>
                </div>
              </div>

              {/* 제재 기록 */}
              {(selectedPlayer.warnings > 0 || selectedPlayer.status === 'banned' || selectedPlayer.status === 'suspended') && (
                <div>
                  <h3 className="font-bold mb-3 text-red-600">제재 기록</h3>
                  <div className="space-y-2">
                    {selectedPlayer.warnings > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <span className="font-medium">경고 {selectedPlayer.warnings}회</span>
                      </div>
                    )}
                    {selectedPlayer.status === 'suspended' && selectedPlayer.suspensionEnd && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                        <span className="font-medium">계정 정지</span>
                        <div className="text-sm text-gray-600 mt-1">
                          해제 예정: {selectedPlayer.suspensionEnd.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {selectedPlayer.status === 'banned' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <span className="font-medium">영구 밴</span>
                        {selectedPlayer.banReason && (
                          <div className="text-sm text-gray-600 mt-1">
                            사유: {selectedPlayer.banReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* 제재 모달 */}
        <Modal
          isOpen={sanctionModalOpen}
          onClose={closeSanctionModal}
          title={selectedPlayer ? `${selectedPlayer.characterName} 제재` : ''}
          size="md"
        >
          {selectedPlayer && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-red-600 mb-2">플레이어 제재</h3>
                <p className="text-gray-600">
                  {selectedPlayer.characterName}에 대한 제재를 선택하세요.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="warning"
                  size="lg"
                  onClick={() => executeSanction('warning', '경고')}
                  className="w-full justify-start"
                >
                  <span className="mr-2">⚠️</span>
                  경고 (현재: {selectedPlayer.warnings}회)
                </Button>
                
                <Button
                  variant="warning"
                  size="lg"
                  onClick={() => executeSanction('suspension', '24시간 정지', 24)}
                  className="w-full justify-start"
                >
                  <span className="mr-2">⏰</span>
                  24시간 정지
                </Button>
                
                <Button
                  variant="warning"
                  size="lg"
                  onClick={() => executeSanction('suspension', '7일 정지', 168)}
                  className="w-full justify-start"
                >
                  <span className="mr-2">📅</span>
                  7일 정지
                </Button>
                
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => executeSanction('ban', '규정 위반')}
                  className="w-full justify-start"
                >
                  <span className="mr-2">🚫</span>
                  영구 밴
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
