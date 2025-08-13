'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

// 아이템 인터페이스
interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  slot?: 'weapon' | 'helmet' | 'armor' | 'pants' | 'shoes' | 'gloves' | 'ring' | 'necklace';
  
  // 경제
  economy: {
    buyPrice: number;
    sellPrice: number;
    stackable: boolean;
    maxStack: number;
  };
  
  // 스탯 (장비용)
  stats?: {
    hp?: number;
    mp?: number;
    atk?: number;
    def?: number;
    acc?: number;
    eva?: number;
    crit?: number;
    speed?: number;
  };
  
  // 소모품 효과
  consumable?: {
    effects: ItemEffect[];
    cooldown?: number;
    consumeOnUse: boolean;
  };
  
  // 요구사항
  requirements: {
    level?: number;
    classes?: string[];
    stats?: Record<string, number>;
  };
  
  // 메타 정보
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number; // 플레이어들이 사용한 횟수
}

interface ItemEffect {
  id: string;
  type: 'heal' | 'restore' | 'buff' | 'debuff' | 'damage';
  target: 'self' | 'enemy' | 'party';
  value: number;
  stat?: string;
  duration?: number;
  description: string;
}

// 더미 아이템 데이터 생성
const createDummyItems = (): Item[] => {
  return [
    {
      id: 'iron_sword',
      name: '철 검',
      description: '단단한 철로 만든 기본적인 검입니다.',
      icon: '⚔️',
      type: 'weapon',
      category: 'sword',
      rarity: 'common',
      slot: 'weapon',
      economy: {
        buyPrice: 100,
        sellPrice: 25,
        stackable: false,
        maxStack: 1
      },
      stats: {
        atk: 30,
        crit: 5
      },
      requirements: {
        level: 5,
        classes: ['warrior', 'paladin']
      },
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-08-10'),
      usageCount: 8420
    },
    {
      id: 'health_potion',
      name: '체력 물약',
      description: 'HP를 50 회복하는 물약입니다.',
      icon: '🧪',
      type: 'consumable',
      category: 'potion',
      rarity: 'common',
      economy: {
        buyPrice: 50,
        sellPrice: 12,
        stackable: true,
        maxStack: 99
      },
      consumable: {
        effects: [
          {
            id: 'heal_effect',
            type: 'heal',
            target: 'self',
            value: 50,
            stat: 'hp',
            description: 'HP를 50 회복합니다.'
          }
        ],
        cooldown: 3,
        consumeOnUse: true
      },
      requirements: {
        level: 1
      },
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-08-05'),
      usageCount: 25430
    },
    {
      id: 'legendary_staff',
      name: '아르카나 지팡이',
      description: '고대 마법사들이 사용했던 전설적인 지팡이입니다.',
      icon: '🔮',
      type: 'weapon',
      category: 'staff',
      rarity: 'legendary',
      slot: 'weapon',
      economy: {
        buyPrice: 50000,
        sellPrice: 12500,
        stackable: false,
        maxStack: 1
      },
      stats: {
        atk: 120,
        mp: 100,
        crit: 20,
        speed: 10
      },
      requirements: {
        level: 40,
        classes: ['mage', 'priest'],
        stats: {
          int: 50
        }
      },
      isActive: true,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-08-01'),
      usageCount: 156
    },
    {
      id: 'dragon_scale',
      name: '용의 비늘',
      description: '고대 용에서 얻은 귀중한 재료입니다.',
      icon: '🐲',
      type: 'material',
      category: 'rare_material',
      rarity: 'epic',
      economy: {
        buyPrice: 1000,
        sellPrice: 800,
        stackable: true,
        maxStack: 10
      },
      requirements: {
        level: 1
      },
      isActive: true,
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-07-20'),
      usageCount: 342
    },
    {
      id: 'magic_ring',
      name: '마력의 반지',
      description: '마력을 증폭시키는 신비한 반지입니다.',
      icon: '💍',
      type: 'accessory',
      category: 'ring',
      rarity: 'rare',
      slot: 'ring',
      economy: {
        buyPrice: 2500,
        sellPrice: 625,
        stackable: false,
        maxStack: 1
      },
      stats: {
        mp: 50,
        atk: 15,
        crit: 10
      },
      requirements: {
        level: 20,
        stats: {
          int: 25
        }
      },
      isActive: true,
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-07-15'),
      usageCount: 1230
    },
    {
      id: 'quest_item_key',
      name: '고대 유적의 열쇠',
      description: '특별한 퀘스트에서만 사용되는 열쇠입니다.',
      icon: '🗝️',
      type: 'quest',
      category: 'key',
      rarity: 'uncommon',
      economy: {
        buyPrice: 0,
        sellPrice: 0,
        stackable: false,
        maxStack: 1
      },
      requirements: {
        level: 15
      },
      isActive: false,
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
      usageCount: 89
    }
  ];
};

export default function ItemsEditor() {
  const [items, setItems] = useState<Item[]>(createDummyItems());
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<Item>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { isOpen: editModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: previewModalOpen, openModal: openPreviewModal, closeModal: closePreviewModal } = useModal();

  // 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && item.isActive) ||
                           (statusFilter === 'inactive' && !item.isActive);
      
      return matchesSearch && matchesType && matchesRarity && matchesStatus;
    });
  }, [items, searchTerm, typeFilter, rarityFilter, statusFilter]);

  // 아이템 통계
  const itemStats = useMemo(() => {
    const total = items.length;
    const active = items.filter(i => i.isActive).length;
    const byType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byRarity = items.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const totalUsage = items.reduce((sum, i) => sum + i.usageCount, 0);
    
    return { total, active, byType, byRarity, totalUsage };
  }, [items]);

  // 새 아이템 생성
  const createNewItem = () => {
    const newItem: Item = {
      id: `item_${Date.now()}`,
      name: '새 아이템',
      description: '새로운 아이템입니다.',
      icon: '📦',
      type: 'misc',
      category: 'general',
      rarity: 'common',
      economy: {
        buyPrice: 10,
        sellPrice: 2,
        stackable: true,
        maxStack: 99
      },
      requirements: {
        level: 1
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    setSelectedItem(newItem);
    setEditingItem(newItem);
    openEditModal();
  };

  // 아이템 편집 열기
  const openItemEdit = (item: Item) => {
    setSelectedItem(item);
    setEditingItem({ ...item });
    openEditModal();
  };

  // 아이템 저장
  const saveItem = () => {
    if (!editingItem.id) return;

    setItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === editingItem.id);
      const updatedItem = {
        ...editingItem,
        updatedAt: new Date()
      } as Item;

      if (existingIndex >= 0) {
        // 기존 아이템 업데이트
        const newItems = [...prev];
        newItems[existingIndex] = updatedItem;
        return newItems;
      } else {
        // 새 아이템 추가
        return [...prev, updatedItem];
      }
    });

    closeEditModal();
  };

  // 아이템 삭제
  const deleteItem = () => {
    if (!selectedItem) return;

    setItems(prev => prev.filter(i => i.id !== selectedItem.id));
    closeDeleteModal();
  };

  // 아이템 활성/비활성 토글
  const toggleItemStatus = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isActive: !item.isActive, updatedAt: new Date() }
        : item
    ));
  };

  // 효과 추가 (소모품용)
  const addEffect = () => {
    const newEffect: ItemEffect = {
      id: `effect_${Date.now()}`,
      type: 'heal',
      target: 'self',
      value: 10,
      description: '새 효과'
    };
    
    setEditingItem(prev => ({
      ...prev,
      consumable: {
        ...prev.consumable!,
        effects: [...(prev.consumable?.effects || []), newEffect]
      }
    }));
  };

  // 타입별 색상
  const getTypeColor = (type: Item['type']) => {
    switch (type) {
      case 'weapon': return 'text-red-600 bg-red-100';
      case 'armor': return 'text-blue-600 bg-blue-100';
      case 'accessory': return 'text-purple-600 bg-purple-100';
      case 'consumable': return 'text-green-600 bg-green-100';
      case 'material': return 'text-orange-600 bg-orange-100';
      case 'quest': return 'text-yellow-600 bg-yellow-100';
      case 'misc': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 희소성별 색상
  const getRarityColor = (rarity: Item['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'uncommon': return 'text-green-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-orange-600';
      case 'mythic': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">아이템 편집</h1>
            <p className="text-gray-600">게임 아이템 생성 및 편집</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              아이템 가져오기
            </Button>
            <Button variant="primary" onClick={createNewItem}>
              새 아이템 생성
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{itemStats.total}</div>
              <div className="text-sm text-gray-600">전체 아이템</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{itemStats.active}</div>
              <div className="text-sm text-gray-600">활성 아이템</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{itemStats.byType.weapon || 0}</div>
              <div className="text-sm text-gray-600">무기</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{itemStats.byRarity.legendary || 0}</div>
              <div className="text-sm text-gray-600">전설</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{itemStats.byType.consumable || 0}</div>
              <div className="text-sm text-gray-600">소모품</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{Math.floor(itemStats.totalUsage / 1000)}K</div>
              <div className="text-sm text-gray-600">총 사용</div>
            </div>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="아이템 검색..."
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
              <option value="weapon">무기</option>
              <option value="armor">방어구</option>
              <option value="accessory">장신구</option>
              <option value="consumable">소모품</option>
              <option value="material">재료</option>
              <option value="quest">퀘스트</option>
              <option value="misc">기타</option>
            </select>
            
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 희소성</option>
              <option value="common">일반</option>
              <option value="uncommon">고급</option>
              <option value="rare">희귀</option>
              <option value="epic">영웅</option>
              <option value="legendary">전설</option>
              <option value="mythic">신화</option>
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
        </Card>

        {/* 아이템 목록 테이블 */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">아이템</th>
                  <th className="text-left py-3 px-4">타입</th>
                  <th className="text-left py-3 px-4">희소성</th>
                  <th className="text-left py-3 px-4">가격</th>
                  <th className="text-left py-3 px-4">사용 횟수</th>
                  <th className="text-left py-3 px-4">상태</th>
                  <th className="text-left py-3 px-4">수정일</th>
                  <th className="text-left py-3 px-4">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', getTypeColor(item.type))}>
                        {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('font-medium', getRarityColor(item.rarity))}>
                        {item.rarity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>구매: {item.economy.buyPrice}G</div>
                      <div className="text-gray-600">판매: {item.economy.sellPrice}G</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {item.usageCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        item.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      )}>
                        {item.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {item.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openItemEdit(item)}
                        >
                          편집
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            openPreviewModal();
                          }}
                        >
                          미리보기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleItemStatus(item.id)}
                        >
                          {item.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 아이템 편집 모달 */}
        <Modal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          title={editingItem.id?.startsWith('item_') ? '새 아이템 생성' : '아이템 편집'}
          size="xl"
        >
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">아이템 이름</label>
                <Input
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">아이콘</label>
                <Input
                  value={editingItem.icon || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, icon: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">설명</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={3}
                value={editingItem.description || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">타입</label>
                <select
                  value={editingItem.type || 'misc'}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, type: e.target.value as Item['type'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="weapon">무기</option>
                  <option value="armor">방어구</option>
                  <option value="accessory">장신구</option>
                  <option value="consumable">소모품</option>
                  <option value="material">재료</option>
                  <option value="quest">퀘스트</option>
                  <option value="misc">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <Input
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">희소성</label>
                <select
                  value={editingItem.rarity || 'common'}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, rarity: e.target.value as Item['rarity'] }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="common">일반</option>
                  <option value="uncommon">고급</option>
                  <option value="rare">희귀</option>
                  <option value="epic">영웅</option>
                  <option value="legendary">전설</option>
                  <option value="mythic">신화</option>
                </select>
              </div>
              {(editingItem.type === 'weapon' || editingItem.type === 'armor' || editingItem.type === 'accessory') && (
                <div>
                  <label className="block text-sm font-medium mb-2">장비 슬롯</label>
                  <select
                    value={editingItem.slot || ''}
                    onChange={(e) => setEditingItem(prev => ({ ...prev, slot: e.target.value as NonNullable<Item['slot']> }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">선택 안함</option>
                    <option value="weapon">무기</option>
                    <option value="helmet">투구</option>
                    <option value="armor">갑옷</option>
                    <option value="pants">바지</option>
                    <option value="shoes">신발</option>
                    <option value="gloves">장갑</option>
                    <option value="ring">반지</option>
                    <option value="necklace">목걸이</option>
                  </select>
                </div>
              )}
            </div>

            {/* 경제 정보 */}
            <div>
              <h3 className="font-medium mb-3">경제 정보</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">구매 가격</label>
                  <Input
                    type="number"
                    value={editingItem.economy?.buyPrice || 0}
                    onChange={(e) => setEditingItem(prev => ({
                      ...prev,
                      economy: { ...prev.economy!, buyPrice: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">판매 가격</label>
                  <Input
                    type="number"
                    value={editingItem.economy?.sellPrice || 0}
                    onChange={(e) => setEditingItem(prev => ({
                      ...prev,
                      economy: { ...prev.economy!, sellPrice: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">중첩 가능</label>
                  <select
                    value={editingItem.economy?.stackable ? 'true' : 'false'}
                    onChange={(e) => setEditingItem(prev => ({
                      ...prev,
                      economy: { ...prev.economy!, stackable: e.target.value === 'true' }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="false">불가능</option>
                    <option value="true">가능</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">최대 개수</label>
                  <Input
                    type="number"
                    value={editingItem.economy?.maxStack || 1}
                    onChange={(e) => setEditingItem(prev => ({
                      ...prev,
                      economy: { ...prev.economy!, maxStack: parseInt(e.target.value) || 1 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* 스탯 (장비용) */}
            {(editingItem.type === 'weapon' || editingItem.type === 'armor' || editingItem.type === 'accessory') && (
              <div>
                <h3 className="font-medium mb-3">스탯 보너스</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">HP</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.hp || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, hp: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">MP</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.mp || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, mp: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">공격력</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.atk || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, atk: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">방어력</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.def || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, def: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">명중률</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.acc || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, acc: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">회피율</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.eva || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, eva: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">치명타율</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.crit || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, crit: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">속도</label>
                    <Input
                      type="number"
                      value={editingItem.stats?.speed || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        stats: { ...prev.stats!, speed: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 소모품 효과 */}
            {editingItem.type === 'consumable' && (
              <div>
                <h3 className="font-medium mb-3">소모품 효과</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">쿨다운 (초)</label>
                    <Input
                      type="number"
                      value={editingItem.consumable?.cooldown || 0}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        consumable: { ...prev.consumable!, cooldown: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">사용 시 소모</label>
                    <select
                      value={editingItem.consumable?.consumeOnUse ? 'true' : 'false'}
                      onChange={(e) => setEditingItem(prev => ({
                        ...prev,
                        consumable: { ...prev.consumable!, consumeOnUse: e.target.value === 'true' }
                      }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="true">소모됨</option>
                      <option value="false">소모 안됨</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">효과</label>
                    <Button variant="ghost" size="sm" onClick={addEffect}>
                      효과 추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editingItem.consumable?.effects?.map((effect: ItemEffect, index: number) => (
                      <div key={effect.id} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <select
                            value={effect.type}
                            onChange={(e) => {
                              const newEffects: ItemEffect[] = [...(editingItem.consumable?.effects || [])];
                              newEffects[index] = { ...effect, type: e.target.value as ItemEffect['type'] };
                              setEditingItem(prev => ({
                                ...prev,
                                consumable: { ...prev.consumable!, effects: newEffects }
                              }));
                            }}
                            className="p-1 border rounded text-xs"
                          >
                            <option value="heal">회복</option>
                            <option value="restore">복원</option>
                            <option value="buff">버프</option>
                            <option value="debuff">디버프</option>
                            <option value="damage">데미지</option>
                          </select>
                          <select
                            value={effect.target}
                            onChange={(e) => {
                              const newEffects: ItemEffect[] = [...(editingItem.consumable?.effects || [])];
                              newEffects[index] = { ...effect, target: e.target.value as ItemEffect['target'] };
                              setEditingItem(prev => ({
                                ...prev,
                                consumable: { ...prev.consumable!, effects: newEffects }
                              }));
                            }}
                            className="p-1 border rounded text-xs"
                          >
                            <option value="self">자신</option>
                            <option value="enemy">적</option>
                            <option value="party">파티</option>
                          </select>
                          <Input
                            type="number"
                            value={effect.value}
                            onChange={(e) => {
                              const newEffects: ItemEffect[] = [...(editingItem.consumable?.effects || [])];
                              newEffects[index] = { ...effect, value: parseInt(e.target.value) || 0 };
                              setEditingItem(prev => ({
                                ...prev,
                                consumable: { ...prev.consumable!, effects: newEffects }
                              }));
                            }}
                            size="sm"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              const newEffects: ItemEffect[] = (editingItem.consumable?.effects || []).filter((_, i) => i !== index);
                              setEditingItem(prev => ({
                                ...prev,
                                consumable: { ...prev.consumable!, effects: newEffects as ItemEffect[] }
                              }));
                            }}
                          >
                            삭제
                          </Button>
                        </div>
                        <Input
                          placeholder="효과 설명"
                          value={effect.description}
                          onChange={(e) => {
                             const newEffects: ItemEffect[] = [...(editingItem.consumable?.effects || [])];
                            newEffects[index] = { ...effect, description: e.target.value };
                            setEditingItem(prev => ({
                              ...prev,
                              consumable: { ...prev.consumable!, effects: newEffects }
                            }));
                          }}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 요구사항 */}
            <div>
              <h3 className="font-medium mb-3">요구사항</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">최소 레벨</label>
                  <Input
                    type="number"
                    value={editingItem.requirements?.level || 1}
                    onChange={(e) => setEditingItem(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements!, level: parseInt(e.target.value) || 1 }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">사용 가능 클래스</label>
                  <Input
                    placeholder="warrior,mage,archer"
                    value={editingItem.requirements?.classes?.join(',') || ''}
                    onChange={(e) => setEditingItem(prev => ({
                      ...prev,
                      requirements: { 
                        ...prev.requirements!, 
                        classes: e.target.value ? e.target.value.split(',') : []
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={saveItem} className="flex-1">
              저장
            </Button>
            <Button variant="ghost" onClick={closeEditModal}>
              취소
            </Button>
            {!editingItem.id?.startsWith('item_') && (
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

        {/* 아이템 미리보기 모달 */}
        <Modal
          isOpen={previewModalOpen}
          onClose={closePreviewModal}
          title="아이템 미리보기"
          size="md"
        >
          {selectedItem && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-2">{selectedItem.icon}</div>
                <h3 className={cn('text-xl font-bold', getRarityColor(selectedItem.rarity))}>
                  {selectedItem.name}
                </h3>
                <p className="text-gray-600">{selectedItem.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">타입:</span>
                  <span className="ml-2 font-medium">{selectedItem.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">희소성:</span>
                  <span className={cn('ml-2 font-medium', getRarityColor(selectedItem.rarity))}>
                    {selectedItem.rarity}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">구매 가격:</span>
                  <span className="ml-2 font-medium">{selectedItem.economy.buyPrice}G</span>
                </div>
                <div>
                  <span className="text-gray-600">판매 가격:</span>
                  <span className="ml-2 font-medium">{selectedItem.economy.sellPrice}G</span>
                </div>
              </div>

              {selectedItem.stats && Object.values(selectedItem.stats).some(v => v > 0) && (
                <div>
                  <h4 className="font-medium mb-2">스탯 보너스</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedItem.stats).map(([stat, value]) => 
                      value > 0 && (
                        <div key={stat} className="flex justify-between">
                          <span>{stat.toUpperCase()}:</span>
                          <span className="font-medium text-green-600">+{value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedItem.consumable && selectedItem.consumable.effects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">소모품 효과</h4>
                  <div className="space-y-2">
                    {selectedItem.consumable.effects.map(effect => (
                      <div key={effect.id} className="p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">
                          {effect.type} → {effect.target} ({effect.value})
                        </div>
                        <div className="text-xs text-gray-600">{effect.description}</div>
                      </div>
                    ))}
                    {selectedItem.consumable.cooldown && (
                      <div className="text-xs text-gray-600">
                        쿨다운: {selectedItem.consumable.cooldown}초
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.requirements.level && selectedItem.requirements.level > 1 && (
                <div>
                  <h4 className="font-medium mb-2">요구사항</h4>
                  <div className="text-sm text-gray-600">
                    • 레벨 {selectedItem.requirements.level} 이상
                    {selectedItem.requirements.classes && selectedItem.requirements.classes.length > 0 && (
                      <div>• 클래스: {selectedItem.requirements.classes.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          title="아이템 삭제 확인"
          size="sm"
        >
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-red-600 mb-2">아이템 삭제</h3>
              <p className="text-gray-600">
                {selectedItem?.name} 아이템을 정말 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={deleteItem} className="flex-1">
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
