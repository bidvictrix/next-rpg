'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// 콘텐츠 통계 인터페이스
interface ContentStats {
  skills: { total: number; active: number; categories: string[] };
  monsters: { total: number; active: number; types: string[] };
  items: { total: number; active: number; rarities: string[] };
  quests: { total: number; active: number; types: string[] };
  areas: { total: number; active: number; types: string[] };
  npcs: { total: number; active: number; types: string[] };
}

// 변경 로그 인터페이스
interface ChangeLog {
  id: string;
  timestamp: Date;
  type: 'create' | 'update' | 'delete';
  contentType: 'skill' | 'monster' | 'item' | 'quest' | 'area' | 'npc';
  contentId: string;
  contentName: string;
  changes: string;
  editor: string;
}

// 콘텐츠 검증 결과
interface ValidationResult {
  contentType: string;
  issues: Array<{
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    contentId?: string;
  }>;
}

// 더미 콘텐츠 통계 데이터
const createDummyContentStats = (): ContentStats => ({
  skills: {
    total: 157,
    active: 142,
    categories: ['combat', 'magic', 'support', 'passive', 'utility']
  },
  monsters: {
    total: 89,
    active: 84,
    types: ['normal', 'elite', 'boss', 'raid_boss']
  },
  items: {
    total: 342,
    active: 329,
    rarities: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
  },
  quests: {
    total: 127,
    active: 119,
    types: ['main', 'side', 'daily', 'weekly', 'event']
  },
  areas: {
    total: 28,
    active: 25,
    types: ['town', 'dungeon', 'field', 'pvp', 'raid']
  },
  npcs: {
    total: 94,
    active: 87,
    types: ['merchant', 'quest_giver', 'trainer', 'guard']
  }
});

// 더미 변경 로그 데이터
const createDummyChangeLogs = (): ChangeLog[] => [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'update',
    contentType: 'skill',
    contentId: 'fireball',
    contentName: '파이어볼',
    changes: '데미지 증가: 150 → 160',
    editor: 'admin1'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: 'create',
    contentType: 'monster',
    contentId: 'shadow_wolf',
    contentName: '그림자 늑대',
    changes: '새 몬스터 추가 (레벨 25)',
    editor: 'admin2'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    type: 'update',
    contentType: 'item',
    contentId: 'iron_sword',
    contentName: '철 검',
    changes: '공격력 증가: 25 → 30',
    editor: 'admin1'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: 'delete',
    contentType: 'quest',
    contentId: 'old_quest',
    contentName: '오래된 퀘스트',
    changes: '퀘스트 삭제',
    editor: 'admin3'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    type: 'create',
    contentType: 'area',
    contentId: 'mystic_forest',
    contentName: '신비한 숲',
    changes: '새 지역 추가 (레벨 20-30)',
    editor: 'admin2'
  }
];

// 더미 검증 결과
const createDummyValidationResults = (): ValidationResult[] => [
  {
    contentType: 'Skills',
    issues: [
      {
        id: '1',
        severity: 'warning',
        message: '파이어볼 스킬의 MP 소모량이 과도함 (50 MP)',
        contentId: 'fireball'
      },
      {
        id: '2',
        severity: 'info',
        message: '3개의 스킬이 아직 테스트되지 않음'
      }
    ]
  },
  {
    contentType: 'Monsters',
    issues: [
      {
        id: '3',
        severity: 'error',
        message: '드래곤 보스의 HP가 설정되지 않음',
        contentId: 'dragon_boss'
      }
    ]
  },
  {
    contentType: 'Items',
    issues: [
      {
        id: '4',
        severity: 'warning',
        message: '전설 등급 아이템이 너무 흔함 (드롭률 5%)',
        contentId: 'legendary_sword'
      }
    ]
  }
];

export default function ContentManagement() {
  const [contentStats] = useState<ContentStats>(createDummyContentStats());
  const [changeLogs] = useState<ChangeLog[]>(createDummyChangeLogs());
  const [validationResults] = useState<ValidationResult[]>(createDummyValidationResults());
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationRunning, setValidationRunning] = useState(false);
  
  const { isOpen: newContentModalOpen, openModal: openNewContentModal, closeModal: closeNewContentModal } = useModal();
  const { isOpen: backupModalOpen, openModal: openBackupModal, closeModal: closeBackupModal } = useModal();

  // 콘텐츠 타입별 정보
  const contentTypes = [
    {
      id: 'skills',
      name: '스킬',
      icon: '🔮',
      color: 'from-blue-400 to-blue-600',
      editUrl: '/admin/skills',
      stats: contentStats.skills
    },
    {
      id: 'monsters',
      name: '몬스터',
      icon: '👹',
      color: 'from-red-400 to-red-600',
      editUrl: '/admin/monsters',
      stats: contentStats.monsters
    },
    {
      id: 'items',
      name: '아이템',
      icon: '⚔️',
      color: 'from-purple-400 to-purple-600',
      editUrl: '/admin/items',
      stats: contentStats.items
    },
    {
      id: 'quests',
      name: '퀘스트',
      icon: '📜',
      color: 'from-green-400 to-green-600',
      editUrl: '/admin/quests',
      stats: contentStats.quests
    },
    {
      id: 'areas',
      name: '지역',
      icon: '🗺️',
      color: 'from-orange-400 to-orange-600',
      editUrl: '/admin/areas',
      stats: contentStats.areas
    },
    {
      id: 'npcs',
      name: 'NPC',
      icon: '👤',
      color: 'from-gray-400 to-gray-600',
      editUrl: '/admin/npcs',
      stats: contentStats.npcs
    }
  ];

  // 필터링된 변경 로그
  const filteredChangeLogs = useMemo(() => {
    return changeLogs.filter(log => {
      const matchesType = selectedContentType === 'all' || log.contentType === selectedContentType;
      const matchesSearch = searchTerm === '' || 
        log.contentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changes.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  }, [changeLogs, selectedContentType, searchTerm]);

  // 전체 이슈 개수
  const totalIssues = useMemo(() => {
    return validationResults.reduce((total, result) => total + result.issues.length, 0);
  }, [validationResults]);

  // 심각도별 이슈 개수
  const issuesBySeverity = useMemo(() => {
    const counts = { error: 0, warning: 0, info: 0 };
    validationResults.forEach(result => {
      result.issues.forEach(issue => {
        counts[issue.severity]++;
      });
    });
    return counts;
  }, [validationResults]);

  // 콘텐츠 검증 실행
  const runValidation = () => {
    setValidationRunning(true);
    setTimeout(() => {
      setValidationRunning(false);
      console.log('콘텐츠 검증 완료');
    }, 3000);
  };

  // 변경 타입별 색상
  const getChangeTypeColor = (type: ChangeLog['type']) => {
    switch (type) {
      case 'create': return 'text-green-600 bg-green-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'delete': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 변경 타입 텍스트
  const getChangeTypeText = (type: ChangeLog['type']) => {
    switch (type) {
      case 'create': return '생성';
      case 'update': return '수정';
      case 'delete': return '삭제';
      default: return '알 수 없음';
    }
  };

  // 심각도별 색상
  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">콘텐츠 관리</h1>
            <p className="text-gray-600">게임 콘텐츠 편집 및 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openBackupModal}>
              백업 관리
            </Button>
            <Button variant="primary" onClick={openNewContentModal}>
              새 콘텐츠 추가
            </Button>
          </div>
        </div>

        {/* 콘텐츠 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentTypes.map(contentType => (
            <Card key={contentType.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl',
                  `bg-gradient-to-br ${contentType.color}`
                )}>
                  {contentType.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{contentType.stats.total}</div>
                  <div className="text-sm text-gray-600">전체</div>
                </div>
              </div>
              
              <h3 className="font-bold text-lg mb-2">{contentType.name}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>활성:</span>
                  <span className="font-medium text-green-600">{contentType.stats.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>비활성:</span>
                  <span className="font-medium text-red-600">{contentType.stats.total - contentType.stats.active}</span>
                </div>
                <Progress
                  value={contentType.stats.active}
                  max={contentType.stats.total}
                  variant="success"
                  size="sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1">
                  <a href={contentType.editUrl} className="block w-full">편집</a>
                </Button>
                <Button variant="ghost" size="sm">
                  통계
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 콘텐츠 검증 */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">콘텐츠 검증</h2>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={runValidation}
                  disabled={validationRunning}
                >
                  {validationRunning ? '검증 중...' : '검증 실행'}
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{issuesBySeverity.error}</div>
                    <div className="text-xs text-gray-600">오류</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <div className="text-lg font-bold text-yellow-600">{issuesBySeverity.warning}</div>
                    <div className="text-xs text-gray-600">경고</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">{issuesBySeverity.info}</div>
                    <div className="text-xs text-gray-600">정보</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {validationResults.map((result, index) => (
                    <div key={index}>
                      <h4 className="font-medium mb-2">{result.contentType}</h4>
                      {result.issues.map(issue => (
                        <div
                          key={issue.id}
                          className="p-2 border-l-4 border-gray-300 bg-gray-50 text-sm"
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              getSeverityColor(issue.severity)
                            )}>
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className="flex-1">{issue.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 빠른 액션 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">빠른 액션</h2>
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  📤 콘텐츠 내보내기
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  📥 콘텐츠 가져오기
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  🔄 콘텐츠 동기화
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  📊 사용률 분석
                </Button>
              </div>
            </Card>
          </div>

          {/* 중앙 및 오른쪽: 변경 로그 */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">최근 변경사항</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="변경사항 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                    className="w-48"
                  />
                  <select
                    value={selectedContentType}
                    onChange={(e) => setSelectedContentType(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">모든 타입</option>
                    <option value="skill">스킬</option>
                    <option value="monster">몬스터</option>
                    <option value="item">아이템</option>
                    <option value="quest">퀘스트</option>
                    <option value="area">지역</option>
                    <option value="npc">NPC</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredChangeLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            getChangeTypeColor(log.type)
                          )}>
                            {getChangeTypeText(log.type)}
                          </span>
                          <span className="font-medium">{log.contentName}</span>
                          <span className="text-sm text-gray-600">({log.contentType})</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">{log.changes}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>편집자: {log.editor}</span>
                          <span>{log.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        상세
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 새 콘텐츠 추가 모달 */}
        <Modal
          isOpen={newContentModalOpen}
          onClose={closeNewContentModal}
          title="새 콘텐츠 추가"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              추가하고 싶은 콘텐츠 타입을 선택하세요.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map(contentType => (
                <a
                  key={contentType.id}
                  href={`${contentType.editUrl}?action=create`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{contentType.icon}</div>
                    <div className="font-medium">{contentType.name}</div>
                    <div className="text-sm text-gray-600">
                      새 {contentType.name} 추가
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </Modal>

        {/* 백업 관리 모달 */}
        <Modal
          isOpen={backupModalOpen}
          onClose={closeBackupModal}
          title="백업 관리"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">백업 생성</h3>
              <div className="space-y-2">
                <Button variant="primary" className="w-full">
                  전체 콘텐츠 백업
                </Button>
                <Button variant="secondary" className="w-full">
                  선택적 백업
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">최근 백업</h3>
              <div className="space-y-2">
                {[
                  { name: '전체 백업', date: '2025-08-14 10:30', size: '24.5MB' },
                  { name: '스킬 백업', date: '2025-08-13 15:20', size: '2.1MB' },
                  { name: '몬스터 백업', date: '2025-08-12 09:15', size: '1.8MB' }
                ].map((backup, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium text-sm">{backup.name}</div>
                      <div className="text-xs text-gray-600">{backup.date} • {backup.size}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        복원
                      </Button>
                      <Button variant="ghost" size="sm">
                        다운로드
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
