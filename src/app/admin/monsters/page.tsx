'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// 몬스터 인터페이스
interface Monster {
  id: string;
  name: string;
  description: string;
  sprite: string;
  level: number;
  type: 'normal' | 'elite' | 'boss' | 'raid_boss' | 'miniboss';
  category: 'beast' | 'undead' | 'demon' | 'elemental' | 'humanoid' | 'dragon' | 'construct';
  element: 'none' | 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark';
  
  // 기본 스탯
  stats: {
    hp: number;
    mp: number;
    atk: number;
    def: number;
    acc: number;
    eva: number;
    crit: number;
    speed: number;
  };
  
  // 드롭 정보
  drops: {
    experience: number;
    gold: number;
    items: MonsterDrop[];
  };
  
  // 스킬
  skills: string[]; // 스킬 ID 배열
  
  // AI 행동
  behavior: {
    aggroRange: number;
    movementType: 'stationary' | 'patrol' | 'random' | 'aggressive';
    abilities: string[];
    aiScript?: string;
  };
  
  // 등장 위치
  locations: string[]; // 지역 ID 배열
  
  // 메타 정보
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  killCount: number; // 플레이어들이 처치한 횟수
}

interface MonsterDrop {
  itemId: string;
  itemName: string;
  dropRate: number; // 0-100%
  quantity: {
    min: number;
    max: number;
  };
}

// 더미 몬스터 데이터 생성
const createDummyMonsters = (): Monster[] => {
  return [
    {
      id: 'goblin_warrior',
      name: '고블린 전사',
      description: '가장 기본적인 고블린 몬스터입니다. 약하지만 무리를 지어 다닙니다.',
      sprite: '👹',
      level: 5,
      type: 'normal',
      category: 'humanoid',
      element: 'none',
      stats: {
        hp: 120,
        mp: 20,
        atk: 25,
        def: 15,
        acc: 70,
        eva: 20,
        crit: 5,
        speed: 40
      },
      drops: {
        experience: 50,
        gold: 10,
        items: [
          {
            itemId: 'goblin_tooth',
            itemName: '고블린 이빨',
            dropRate: 30,
            quantity: { min: 1, max: 2 }
          },
          {
            itemId: 'copper_coin',
            itemName: '구리 동전',
            dropRate: 80,
            quantity: { min: 3, max: 8 }
          }
        ]
      },
      skills: ['basic_attack', 'goblin_charge'],
      behavior: {
        aggroRange: 5,
        movementType: 'patrol',
        abilities: ['group_call'],
        aiScript: 'basic_aggressive'
      },
      locations: ['goblin_cave', 'forest_entrance'],
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-08-10'),
      killCount: 12450
    },
    {
      id: 'fire_elemental',
      name: '화염 정령',
      description: '불타는 마력으로 이루어진 정령입니다. 화염 마법에 능숙합니다.',
      sprite: '🔥',
      level: 15,
      type: 'elite',
      category: 'elemental',
      element: 'fire',
      stats: {
        hp: 300,
        mp: 150,
        atk: 45,
        def: 20,
        acc: 80,
        eva: 30,
        crit: 15,
        speed: 60
      },
      drops: {
        experience: 200,
        gold: 50,
        items: [
          {
            itemId: 'fire_crystal',
            itemName: '화염 크리스탈',
            dropRate: 25,
            quantity: { min: 1, max: 1 }
          },
          {
            itemId: 'flame_essence',
            itemName: '화염 정수',
            dropRate: 60,
            quantity: { min: 2, max: 4 }
          }
        ]
      },
      skills: ['fireball', 'flame_burst', 'fire_shield'],
      behavior: {
        aggroRange: 8,
        movementType: 'aggressive',
        abilities: ['fire_immunity', 'water_weakness'],
        aiScript: 'elemental_caster'
      },
      locations: ['volcanic_cave', 'fire_temple'],
      isActive: true,
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-08-05'),
      killCount: 3420
    },
    {
      id: 'ancient_dragon',
      name: '고대 용',
      description: '전설적인 고대 용입니다. 엄청난 힘과 마법을 가지고 있습니다.',
      sprite: '🐉',
      level: 50,
      type: 'raid_boss',
      category: 'dragon',
      element: 'fire',
      stats: {
        hp: 50000,
        mp: 5000,
        atk: 300,
        def: 150,
        acc: 95,
        eva: 20,
        crit: 25,
        speed: 80
      },
      drops: {
        experience: 10000,
        gold: 5000,
        items: [
          {
            itemId: 'dragon_scale',
            itemName: '용의 비늘',
            dropRate: 100,
            quantity: { min: 5, max: 10 }
          },
          {
            itemId: 'dragon_heart',
            itemName: '용의 심장',
            dropRate: 50,
            quantity: { min: 1, max: 1 }
          },
          {
            itemId: 'legendary_sword',
            itemName: '전설의 검',
            dropRate: 5,
            quantity: { min: 1, max: 1 }
          }
        ]
      },
      skills: ['dragon_breath', 'meteor', 'ancient_magic', 'tail_sweep'],
      behavior: {
        aggroRange: 15,
        movementType: 'aggressive',
        abilities: ['flight', 'magic_immunity', 'enrage'],
        aiScript: 'raid_boss'
      },
      locations: ['dragon_lair'],
      isActive: true,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-08-01'),
      killCount: 23
    },
    {
      id: 'skeleton_archer',
      name: '해골 궁수',
      description: '죽음에서 되살아난 해골 궁수입니다. 정확한 원거리 공격을 합니다.',
      sprite: '💀',
      level: 12,
      type: 'normal',
      category: 'undead',
      element: 'dark',
      stats: {
        hp: 180,
        mp: 40,
        atk: 35,
        def: 10,
        acc: 90,
        eva: 40,
        crit: 20,
        speed: 50
      },
      drops: {
        experience: 80,
        gold: 25,
        items: [
          {
            itemId: 'bone_arrow',
            itemName: '뼈 화살',
            dropRate: 70,
            quantity: { min: 5, max: 15 }
          },
          {
            itemId: 'rusty_bow',
            itemName: '녹슨 활',
            dropRate: 15,
            quantity: { min: 1, max: 1 }
          }
        ]
      },
      skills: ['bone_shot', 'piercing_arrow', 'multi_shot'],
      behavior: {
        aggroRange: 12,
        movementType: 'stationary',
        abilities: ['undead_immunity', 'ranged_combat'],
        aiScript: 'ranged_attacker'
      },
      locations: ['undead_cemetery', 'forgotten_ruins'],
      isActive: true,
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-07-30'),
      killCount: 5670
    },
    {
      id: 'test_dummy',
      name: '훈련용 허수아비',
      description: '테스트용 몬스터입니다.',
      sprite: '🎯',
      level: 1,
      type: 'normal',
      category: 'construct',
      element: 'none',
      stats: {
        hp: 1000,
        mp: 0,
        atk: 0,
        def: 0,
        acc: 0,
        eva: 0,
        crit: 0,
        speed: 0
      },
      drops: {
        experience: 0,
        gold: 0,
        items: []
      },
      skills: [],
      behavior: {
        aggroRange: 0,
        movementType: 'stationary',
        abilities: ['immortal'],
        aiScript: 'passive'
      },
      locations: ['training_ground'],
      isActive: false,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      killCount: 999999
    }
  ];
};

export default function MonstersEditor() {
  const [monsters, setMonsters] = useState<Monster[]>(createDummyMonsters());
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [editingMonster, setEditingMonster] = useState<Partial<Monster>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelRange, setLevelRange] = useState({ min: 1, max: 100 });
  
  const { isOpen: editModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: statsModalOpen, openModal: openStatsModal, closeModal: closeStatsModal } = useModal();

  // 필터링된 몬스터 목록
  const filteredMonsters = useMemo(() => {
    return monsters.filter(monster => {
      const matchesSearch = monster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           monster.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || monster.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || monster.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && monster.isActive) ||
                           (statusFilter === 'inactive' && !monster.isActive);
      const matchesLevel = monster.level >= levelRange.min && monster.level <= levelRange.max;
      
      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesLevel;
    });
  }, [monsters, searchTerm, typeFilter, categoryFilter, statusFilter, levelRange]);

  // 몬스터 통계
  const monsterStats = useMemo(() => {
    const total = monsters.length;
    const active = monsters.filter(m => m.isActive).length;
    const byType = monsters.reduce((acc, monster) => {
      acc[monster.type] = (acc[monster.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byCategory = monsters.reduce((acc, monster) => {
      acc[monster.category] = (acc[monster.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const avgLevel = Math.round(monsters.reduce((sum, m) => sum + m.level, 0) / total);
    const totalKills = monsters.reduce((sum, m) => sum + m.killCount, 0);
    
    return { total, active, byType, byCategory, avgLevel, totalKills };
  }, [monsters]);

  // 새 몬스터 생성
  const createNewMonster = () => {
    const newMonster: Monster = {
      id: `monster_${Date.now()}`,
      name: '새 몬스터',
      description: '새로운 몬스터입니다.',
      sprite: '👾',
      level: 1,
      type: 'normal',
      category: 'beast',
      element: 'none',
      stats: {
        hp: 100,
        mp: 20,
        atk: 20,
        def: 10,
        acc: 70,
        eva: 20,
        crit: 5,
        speed: 30
      },
      drops: {
        experience: 25,
        gold: 5,
        items: []
      },
      skills: [],
      behavior: {
        aggroRange: 5,
        movementType: 'patrol',
        abilities: []
      },
      locations: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      killCount: 0
    };
    
    setSelectedMonster(newMonster);
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
  const saveMonster = () => {
    if (!editingMonster.id) return;

    setMonsters(prev => {
      const existingIndex = prev.findIndex(m => m.id === editingMonster.id);
      const updatedMonster = {
        ...editingMonster,
        updatedAt: new Date()
      } as Monster;

      if (existingIndex >= 0) {
        // 기존 몬스터 업데이트
        const newMonsters = [...prev];
        newMonsters[existingIndex] = updatedMonster;
        return newMonsters;
      } else {
        // 새 몬스터 추가
        return [...prev, updatedMonster];
      }
    });

    closeEditModal();
  };

  // 몬스터 삭제
  const deleteMonster = () => {
    if (!selectedMonster) return;

    setMonsters(prev => prev.filter(m => m.id !== selectedMonster.id));
    closeDeleteModal();
  };

  // 몬스터 활성/비활성 토글
  const toggleMonsterStatus = (monsterId: string) => {
    setMonsters(prev => prev.map(monster => 
      monster.id === monsterId 
        ? { ...monster, isActive: !monster.isActive, updatedAt: new Date() }
        : monster
    ));
  };

  // 드롭 아이템 추가
  const addDropItem = () => {
    const newDrop: MonsterDrop = {
      itemId: 'new_item',
      itemName: '새 아이템',
      dropRate: 50,
      quantity: { min: 1, max: 1 }
    };
    
    setEditingMonster(prev => ({
      ...prev,
      drops: {
        ...prev.drops!,
        items: [...(prev.drops?.items || []), newDrop]
      }
    }));
  };

  // 타입별 색상
  const getTypeColor = (type: Monster['type']) => {
    switch (type) {
      case 'normal': return 'text-gray-600 bg-gray-100';
      case 'elite': return 'text-blue-600 bg-blue-100';
      case 'miniboss': return 'text-purple-600 bg-purple-100';
      case 'boss': return 'text-red-600 bg-red-100';
      case 'raid_boss': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 원소별 색상
  const getElementColor = (element: Monster['element']) => {
    switch (element) {
      case 'fire': return 'text-red-500';
      case 'water': return 'text-blue-500';
      case 'earth': return 'text-green-500';
      case 'air': return 'text-cyan-500';
      case 'light': return 'text-yellow-500';
      case 'dark': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">몬스터 편집</h1>
            <p className="text-gray-600">게임 몬스터 생성 및 편집</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              몬스터 가져오기
            </Button>
            <Button variant="primary" onClick={createNewMonster}>
              새 몬스터 생성
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monsterStats.total}</div>
              <div className="text-sm text-gray-600">전체 몬스터</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{monsterStats.active}</div>
              <div className="text-sm text-gray-600">활성 몬스터</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{monsterStats.byType.boss || 0}</div>
              <div className="text-sm text-gray-600">보스</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{monsterStats.avgLevel}</div>
              <div className="text-sm text-gray-600">평균 레벨</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{Math.floor(monsterStats.totalKills / 1000)}K</div>
              <div className="text-sm text-gray-600">총 처치</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{monsterStats.byCategory.dragon || 0}</div>
              <div className="text-sm text-gray-600">드래곤</div>
            </div>
          </Card>
        </div>

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
                <option value="miniboss">미니보스</option>
                <option value="boss">보스</option>
                <option value="raid_boss">레이드 보스</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">모든 종족</option>
                <option value="beast">야수</option>
                <option value="undead">언데드</option>
                <option value="demon">악마</option>
                <option value="elemental">정령</option>
                <option value="humanoid">인간형</option>
                <option value="dragon">드래곤</option>
                <option value="construct">구조물</option>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">몬스터</th>
                  <th className="text-left py-3 px-4">레벨</th>
                  <th className="text-left py-3 px-4">타입</th>
                  <th className="text-left py-3 px-4">종족</th>
                  <th className="text-left py-3 px-4">원소</th>
                  <th className="text-left py-3 px-4">HP</th>
                  <th className="text-left py-3 px-4">처치 횟수</th>
                  <th className="text-left py-3 px-4">상태</th>
                  <th className="text-left py-3 px-4">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonsters.map(monster => (
                  <tr key={monster.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{monster.sprite}</div>
                        <div>
                          <div className="font-medium">{monster.name}</div>
                          <div className="text-sm text-gray-600">{monster.category}</div>
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
                    <td className="py-3 px-4 text-sm">{monster.category}</td>
                    <td className="py-3 px-4">
                      <span className={cn('font-medium', getElementColor(monster.element))}>
                        {monster.element === 'none' ? '-' : monster.element}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {monster.stats.hp.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {monster.killCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        monster.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      )}>
                        {monster.isActive ? '활성' : '비활성'}
                      </span>
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
                          통계
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMonsterStatus(monster.id)}
                        >
                          {monster.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 몬스터 편집 모달 */}
        <Modal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          title={editingMonster.id?.startsWith('monster_') ? '새 몬스터 생성' : '몬스터 편집'}
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
                <label className="block text-sm font-medium mb-2">스프라이트</label>
                <Input
                  value={editingMonster.sprite || ''}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, sprite: e.target.value }))}
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

            <div className="grid grid-cols-4 gap-4">
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
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="normal">일반</option>
                  <option value="elite">정예</option>
                  <option value="miniboss">미니보스</option>
                  <option value="boss">보스</option>
                  <option value="raid_boss">레이드 보스</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">종족</label>
                <select
                  value={editingMonster.category || 'beast'}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="beast">야수</option>
                  <option value="undead">언데드</option>
                  <option value="demon">악마</option>
                  <option value="elemental">정령</option>
                  <option value="humanoid">인간형</option>
                  <option value="dragon">드래곤</option>
                  <option value="construct">구조물</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">원소</label>
                <select
                  value={editingMonster.element || 'none'}
                  onChange={(e) => setEditingMonster(prev => ({ ...prev, element: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="none">없음</option>
                  <option value="fire">화염</option>
                  <option value="water">물</option>
                  <option value="earth">대지</option>
                  <option value="air">바람</option>
                  <option value="light">빛</option>
                  <option value="dark">어둠</option>
                </select>
              </div>
            </div>

            {/* 스탯 */}
            <div>
              <h3 className="font-medium mb-3">스탯</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">HP</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.hp || 100}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, hp: parseInt(e.target.value) || 100 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MP</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.mp || 20}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, mp: parseInt(e.target.value) || 20 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">공격력</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.atk || 20}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, atk: parseInt(e.target.value) || 20 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">방어력</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.def || 10}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, def: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">명중률</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.acc || 70}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, acc: parseInt(e.target.value) || 70 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">회피율</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.eva || 20}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, eva: parseInt(e.target.value) || 20 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">치명타율</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.crit || 5}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, crit: parseInt(e.target.value) || 5 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">속도</label>
                  <Input
                    type="number"
                    value={editingMonster.stats?.speed || 30}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      stats: { ...prev.stats!, speed: parseInt(e.target.value) || 30 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* 드롭 정보 */}
            <div>
              <h3 className="font-medium mb-3">드롭 정보</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">경험치</label>
                  <Input
                    type="number"
                    value={editingMonster.drops?.experience || 25}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      drops: { ...prev.drops!, experience: parseInt(e.target.value) || 25 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">골드</label>
                  <Input
                    type="number"
                    value={editingMonster.drops?.gold || 5}
                    onChange={(e) => setEditingMonster(prev => ({
                      ...prev,
                      drops: { ...prev.drops!, gold: parseInt(e.target.value) || 5 }
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
                  {editingMonster.drops?.items?.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="grid grid-cols-5 gap-2">
                        <Input
                          placeholder="아이템 ID"
                          value={item.itemId}
                          onChange={(e) => {
                            const newItems = [...(editingMonster.drops?.items || [])];
                            newItems[index] = { ...item, itemId: e.target.value };
                            setEditingMonster(prev => ({
                              ...prev,
                              drops: { ...prev.drops!, items: newItems }
                            }));
                          }}
                          size="sm"
                        />
                        <Input
                          placeholder="아이템 이름"
                          value={item.itemName}
                          onChange={(e) => {
                            const newItems = [...(editingMonster.drops?.items || [])];
                            newItems[index] = { ...item, itemName: e.target.value };
                            setEditingMonster(prev => ({
                              ...prev,
                              drops: { ...prev.drops!, items: newItems }
                            }));
                          }}
                          size="sm"
                        />
                        <Input
                          type="number"
                          placeholder="드롭률(%)"
                          value={item.dropRate}
                          onChange={(e) => {
                            const newItems = [...(editingMonster.drops?.items || [])];
                            newItems[index] = { ...item, dropRate: parseInt(e.target.value) || 0 };
                            setEditingMonster(prev => ({
                              ...prev,
                              drops: { ...prev.drops!, items: newItems }
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
                              const newItems = [...(editingMonster.drops?.items || [])];
                              newItems[index] = { 
                                ...item, 
                                quantity: { ...item.quantity, min: parseInt(e.target.value) || 1 }
                              };
                              setEditingMonster(prev => ({
                                ...prev,
                                drops: { ...prev.drops!, items: newItems }
                              }));
                            }}
                            size="sm"
                          />
                          <Input
                            type="number"
                            placeholder="최대"
                            value={item.quantity.max}
                            onChange={(e) => {
                              const newItems = [...(editingMonster.drops?.items || [])];
                              newItems[index] = { 
                                ...item, 
                                quantity: { ...item.quantity, max: parseInt(e.target.value) || 1 }
                              };
                              setEditingMonster(prev => ({
                                ...prev,
                                drops: { ...prev.drops!, items: newItems }
                              }));
                            }}
                            size="sm"
                          />
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            const newItems = editingMonster.drops?.items?.filter((_, i) => i !== index);
                            setEditingMonster(prev => ({
                              ...prev,
                              drops: { ...prev.drops!, items: newItems }
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
            <Button variant="primary" onClick={saveMonster} className="flex-1">
              저장
            </Button>
            <Button variant="ghost" onClick={closeEditModal}>
              취소
            </Button>
            {!editingMonster.id?.startsWith('monster_') && (
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

        {/* 몬스터 통계 모달 */}
        <Modal
          isOpen={statsModalOpen}
          onClose={closeStatsModal}
          title="몬스터 통계"
          size="md"
        >
          {selectedMonster && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-2">{selectedMonster.sprite}</div>
                <h3 className="text-xl font-bold">{selectedMonster.name}</h3>
                <p className="text-gray-600">레벨 {selectedMonster.level} {selectedMonster.category}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{selectedMonster.killCount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">총 처치 횟수</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedMonster.drops.experience}</div>
                    <div className="text-sm text-gray-600">경험치 드롭</div>
                  </div>
                </Card>
              </div>

              <div>
                <h4 className="font-medium mb-2">스탯</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>HP:</span>
                    <span className="font-medium">{selectedMonster.stats.hp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MP:</span>
                    <span className="font-medium">{selectedMonster.stats.mp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>공격력:</span>
                    <span className="font-medium">{selectedMonster.stats.atk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>방어력:</span>
                    <span className="font-medium">{selectedMonster.stats.def}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>명중률:</span>
                    <span className="font-medium">{selectedMonster.stats.acc}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>회피율:</span>
                    <span className="font-medium">{selectedMonster.stats.eva}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">드롭 정보</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>골드:</span>
                    <span className="font-medium">{selectedMonster.drops.gold}</span>
                  </div>
                  {selectedMonster.drops.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.itemName}:</span>
                      <span className="font-medium">{item.dropRate}%</span>
                    </div>
                  ))}
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
              <Button variant="danger" onClick={deleteMonster} className="flex-1">
                삭제
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
