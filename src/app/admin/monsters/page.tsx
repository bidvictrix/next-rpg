'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { Monster } from '@/types/game';

// 몬스터 카테고리 인터페이스
interface MonsterCategory {
  id: string;
  name: string;
  description: string;
  monsters: string[];
}

// 몬스터 통계 타입 (API 응답 형식에 맞춤)
interface MonsterStats {
  total: number;
  averageLevel: number;
  byType?: Partial<Record<Monster['type'], number>>;
}

export default function MonstersEditor() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [categories, setCategories] = useState<MonsterCategory[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [editingMonster, setEditingMonster] = useState<Partial<Monster>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelRange, setLevelRange] = useState({ min: 1, max: 100 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monsterStats, setMonsterStats] = useState<MonsterStats | null>(null);
  
  const { isOpen: editModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: statsModalOpen, openModal: openStatsModal, closeModal: closeStatsModal } = useModal();

  // 몬스터 데이터 로드
  const loadMonsters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [monstersResponse, categoriesResponse, statsResponse] = await Promise.all([
        fetch('/api/monsters'),
        fetch('/api/monsters/categories'),
        fetch('/api/monsters?stats=true')
      ]);
      
      if (!monstersResponse.ok || !categoriesResponse.ok || !statsResponse.ok) {
        throw new Error('데이터를 불러올 수 없습니다.');
      }
      
      const [monstersData, categoriesData, statsData] = await Promise.all([
        monstersResponse.json(),
        categoriesResponse.json(),
        statsResponse.json()
      ]);
      
      if (monstersData.success) {
        setMonsters(monstersData.data);
      }
      
      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
      
      if (statsData.success) {
        setMonsterStats(statsData.data);
      }
    } catch (error) {
      console.error('몬스터 데이터 로드 실패:', error);
      setError('몬스터 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadMonsters();
  }, []);

  // 필터링된 몬스터 목록
  const filteredMonsters = useMemo(() => {
    return monsters.filter(monster => {
      const matchesSearch = monster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           monster.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || monster.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && !monster.questTarget) ||
                           (statusFilter === 'inactive' && monster.questTarget);
      const matchesLevel = monster.level >= levelRange.min && monster.level <= levelRange.max;
      
      return matchesSearch && matchesType && matchesStatus && matchesLevel;
    });
  }, [monsters, searchTerm, typeFilter, categoryFilter, statusFilter, levelRange]);

  // 새 몬스터 생성
  const createNewMonster = () => {
    const newMonster: Partial<Monster> = {
      id: `monster_${Date.now()}`,
      name: '새 몬스터',
      description: '새로운 몬스터입니다.',
      type: 'normal',
      level: 1,
      stats: {
        str: 10,
        dex: 10,
        int: 10,
        vit: 10,
        luk: 10,
        hp: 100,
        mp: 50,
        def: 10
      },
      skills: [],
      ai: {
        type: 'aggressive',
        attackRange: 1,
        detectionRange: 5,
        moveSpeed: 1,
        skills: []
      },
      dropTable: {
        items: [],
        gold: { min: 5, max: 15 },
        experience: 25
      },
      spawnAreas: [],
      spawnRate: 50,
      spawnLimit: 5,
      respawnTime: 300,
      size: 'medium',
      appearance: '새로운 몬스터의 모습'
    };
    
    setSelectedMonster(null);
    setEditingMonster(newMonster);
    openEditModal();
  };

  // 몬스터 편집 열기
  const openMonsterEdit = (monster: Monster) => {
    setSelectedMonster(monster);
    setEditingMonster({ ...monster });
    openEditModal();
  };

  // 몬스터 저장
  const saveMonster = async () => {
    if (!editingMonster.id) return;

    try {
      setLoading(true);
      setError(null);

      const isNewMonster = !selectedMonster;
      const url = '/api/monsters';
      const method = isNewMonster ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingMonster)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '몬스터 저장에 실패했습니다.');
      }

      // 성공 시 목록 새로고침
      await loadMonsters();
      closeEditModal();
    } catch (error) {
      console.error('몬스터 저장 실패:', error);
      setError(error instanceof Error ? error.message : '몬스터 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 몬스터 삭제
  const deleteMonster = async () => {
    if (!selectedMonster) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/monsters?id=${selectedMonster.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '몬스터 삭제에 실패했습니다.');
      }

      // 성공 시 목록 새로고침
      await loadMonsters();
      closeDeleteModal();
    } catch (error) {
      console.error('몬스터 삭제 실패:', error);
      setError(error instanceof Error ? error.message : '몬스터 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 드롭 아이템 추가
  const addDropItem = () => {
    const newItem = {
      itemId: 'new_item',
      quantity: { min: 1, max: 1 },
      chance: 50
    };
    
    setEditingMonster(prev => ({
      ...prev,
      dropTable: {
        ...prev.dropTable!,
        items: [...(prev.dropTable?.items || []), newItem]
      }
    }));
  };

  // 타입별 색상
  const getTypeColor = (type: Monster['type']) => {
    switch (type) {
      case 'normal': return 'text-gray-600 bg-gray-100';
      case 'elite': return 'text-blue-600 bg-blue-100';
      case 'boss': return 'text-red-600 bg-red-100';
      case 'raid_boss': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">몬스터 관리</h1>
            <p className="text-gray-600">실시간 몬스터 편집 및 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadMonsters}>
              새로고침
            </Button>
            <Button variant="primary" onClick={createNewMonster}>
              새 몬스터 생성
            </Button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* 통계 카드 */}
        {monsterStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{monsterStats.total}</div>
                <div className="text-sm text-gray-600">전체 몬스터</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{monsterStats.byType?.normal || 0}</div>
                <div className="text-sm text-gray-600">일반 몬스터</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{monsterStats.byType?.boss || 0}</div>
                <div className="text-sm text-gray-600">보스</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{monsterStats.averageLevel}</div>
                <div className="text-sm text-gray-600">평균 레벨</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{monsterStats.byType?.raid_boss || 0}</div>
                <div className="text-sm text-gray-600">레이드 보스</div>
              </div>
            </Card>
          </div>
        )}

        {/* 필터 및 검색 */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="몬스터 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon="🔍"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">모든 타입</option>
                <option value="normal">일반</option>
                <option value="elite">정예</option>
                <option value="boss">보스</option>
                <option value="raid_boss">레이드 보스</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">레벨 범위:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={levelRange.min}
                  onChange={(e) => setLevelRange(prev => ({ ...prev, min: parseInt(e.target.value) || 1 }))}
                  size="sm"
                  className="w-20"
                />
                <span>~</span>
                <Input
                  type="number"
                  value={levelRange.max}
                  onChange={(e) => setLevelRange(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
                  size="sm"
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 몬스터 목록 테이블 */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">몬스터</th>
                    <th className="text-left py-3 px-4">레벨</th>
                    <th className="text-left py-3 px-4">타입</th>
                    <th className="text-left py-3 px-4">크기</th>
                    <th className="text-left py-3 px-4">스폰 확률</th>
                    <th className="text-left py-3 px-4">경험치</th>
                    <th className="text-left py-3 px-4">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMonsters.map(monster => (
                    <tr key={monster.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">👾</div>
                          <div>
                            <div className="font-medium">{monster.name}</div>
                            <div className="text-sm text-gray-600">{monster.description.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{monster.level}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', getTypeColor(monster.type))}>
                          {monster.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{monster.size}</td>
                      <td className="py-3 px-4 text-sm">{monster.spawnRate}%</td>
                      <td className="py-3 px-4 text-sm">
                        {monster.dropTable.experience.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openMonsterEdit(monster)}
                          >
                            편집
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMonster(monster);
                              openStatsModal();
                            }}
                          >
                            상세
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* 몬스터 편집 모달 */}
        <Modal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          title={!selectedMonster ? '새 몬스터 생성' : '몬스터 편집'}
          size="xl"
        >
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">몬스터 이름</label>
                <Input
                  value={editingMonster.name || ''}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ID</label>
                <Input
                  value={editingMonster.id || ''}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, id: e.target.value }))}
                  disabled={!!selectedMonster}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">설명</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={3}
                value={editingMonster.description || ''}
                onChange={(e) => setEditingMonster(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">레벨</label>
                <Input
                  type="number"
                  value={editingMonster.level || 1}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">타입</label>
                <select
                  value={editingMonster.type || 'normal'}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, type: e.target.value as Monster['type'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="normal">일반</option>
                  <option value="elite">정예</option>
                  <option value="boss">보스</option>
                  <option value="raid_boss">레이드 보스</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">크기</label>
                <select
                  value={editingMonster.size || 'medium'}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, size: e.target.value as Monster['size'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="tiny">작음</option>
                  <option value="small">소형</option>
                  <option value="medium">중형</option>
                  <option value="large">대형</option>
                  <option value="huge">거대</option>
                </select>
              </div>
            </div>

            {/* 스탯 */}
            <div>
              <h3 className="font-medium mb-3">스탯</h3>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">STR</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.str || 10}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, str: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">DEX</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.dex || 10}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, dex: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">INT</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.int || 10}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, int: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">VIT</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.vit || 10}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, vit: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">LUK</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.luk || 10}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, luk: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* 드롭 정보 */}
            <div>
              <h3 className="font-medium mb-3">드롭 정보</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">경험치</label>
                  <Input
                    type="number"
                    value={editingMonster.dropTable?.experience || 25}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      dropTable: { ...prev.dropTable!, experience: parseInt(e.target.value) || 25 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">골드 최소</label>
                  <Input
                    type="number"
                    value={editingMonster.dropTable?.gold?.min || 5}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      dropTable: { 
                        ...prev.dropTable!, 
                        gold: { 
                          ...prev.dropTable!.gold, 
                          min: parseInt(e.target.value) || 5 
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">골드 최대</label>
                  <Input
                    type="number"
                    value={editingMonster.dropTable?.gold?.max || 15}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      dropTable: { 
                        ...prev.dropTable!, 
                        gold: { 
                          ...prev.dropTable!.gold, 
                          max: parseInt(e.target.value) || 15 
                        }
                      }
                    }))}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">드롭 아이템</label>
                  <Button variant="ghost" size="sm" onClick={addDropItem}>
                    아이템 추가
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingMonster.dropTable?.items?.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="아이템 ID"
                          value={item.itemId}
                          onChange={(e) => {
                            const newItems = [...(editingMonster.dropTable?.items || [])];
                            newItems[index] = { ...item, itemId: e.target.value };
                            setEditingMonster(prev => ({
                              ...prev,
                              dropTable: { ...prev.dropTable!, items: newItems }
                            }));
                          }}
                          size="sm"
                        />
                        <Input
                          type="number"
                          placeholder="드롭률(%)"
                          value={item.chance}
                          onChange={(e) => {
                            const newItems = [...(editingMonster.dropTable?.items || [])];
                            newItems[index] = { ...item, chance: parseInt(e.target.value) || 0 };
                            setEditingMonster(prev => ({
                              ...prev,
                              dropTable: { ...prev.dropTable!, items: newItems }
                            }));
                          }}
                          size="sm"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="최소"
                            value={item.quantity.min}
                            onChange={(e) => {
                              const newItems = [...(editingMonster.dropTable?.items || [])];
                              newItems[index] = { 
                                ...item, 
                                quantity: { ...item.quantity, min: parseInt(e.target.value) || 1 }
                              };
                              setEditingMonster(prev => ({
                                ...prev,
                                dropTable: { ...prev.dropTable!, items: newItems }
                              }));
                            }}
                            size="sm"
                          />
                          <Input
                            type="number"
                            placeholder="최대"
                            value={item.quantity.max}
                            onChange={(e) => {
                              const newItems = [...(editingMonster.dropTable?.items || [])];
                              newItems[index] = { 
                                ...item, 
                                quantity: { ...item.quantity, max: parseInt(e.target.value) || 1 }
                              };
                              setEditingMonster(prev => ({
                                ...prev,
                                dropTable: { ...prev.dropTable!, items: newItems }
                              }));
                            }}
                            size="sm"
                          />
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            const newItems = (editingMonster.dropTable?.items || []).filter((_, i) => i !== index);
                            setEditingMonster(prev => ({
                              ...prev,
                              dropTable: { ...prev.dropTable!, items: newItems }
                            }));
                          }}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={saveMonster} className="flex-1" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
            <Button variant="ghost" onClick={closeEditModal}>
              취소
            </Button>
            {selectedMonster && (
              <Button
                variant="danger"
                onClick={() => {
                  closeEditModal();
                  openDeleteModal();
                }}
              >
                삭제
              </Button>
            )}
          </div>
        </Modal>

        {/* 몬스터 상세 모달 */}
        <Modal
          isOpen={statsModalOpen}
          onClose={closeStatsModal}
          title="몬스터 상세 정보"
          size="md"
        >
          {selectedMonster && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-2">👾</div>
                <h3 className="text-xl font-bold">{selectedMonster.name}</h3>
                <p className="text-gray-600">레벨 {selectedMonster.level} {selectedMonster.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedMonster.dropTable.experience}</div>
                    <div className="text-sm text-gray-600">경험치 드롭</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedMonster.dropTable.gold.min}-{selectedMonster.dropTable.gold.max}</div>
                    <div className="text-sm text-gray-600">골드 드롭</div>
                  </div>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">스탯</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>STR:</span>
                    <span className="font-medium">{selectedMonster.stats.str}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DEX:</span>
                    <span className="font-medium">{selectedMonster.stats.dex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>INT:</span>
                    <span className="font-medium">{selectedMonster.stats.int}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VIT:</span>
                    <span className="font-medium">{selectedMonster.stats.vit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LUK:</span>
                    <span className="font-medium">{selectedMonster.stats.luk}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">AI 설정</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>AI 타입:</span>
                    <span className="font-medium">{selectedMonster.ai.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>공격 범위:</span>
                    <span className="font-medium">{selectedMonster.ai.attackRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>감지 범위:</span>
                    <span className="font-medium">{selectedMonster.ai.detectionRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>이동 속도:</span>
                    <span className="font-medium">{selectedMonster.ai.moveSpeed}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">스폰 설정</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>스폰 확률:</span>
                    <span className="font-medium">{selectedMonster.spawnRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>스폰 제한:</span>
                    <span className="font-medium">{selectedMonster.spawnLimit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>리스폰 시간:</span>
                    <span className="font-medium">{selectedMonster.respawnTime}초</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          title="몬스터 삭제 확인"
          size="sm"
        >
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-red-600 mb-2">몬스터 삭제</h3>
              <p className="text-gray-600">
                {selectedMonster?.name} 몬스터를 정말 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={deleteMonster} className="flex-1" disabled={loading}>
                {loading ? '삭제 중...' : '삭제'}
              </Button>
              <Button variant="ghost" onClick={closeDeleteModal} className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
