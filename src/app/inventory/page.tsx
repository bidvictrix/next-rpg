'use client';

import React, { useState, useEffect } from 'react';
import { Inventory } from '@/components/game/Inventory';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, useModal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// 인벤토리 아이템 인터페이스 (Inventory 컴포넌트용)
interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  description?: string;
  icon?: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material' | 'quest' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  quantity: number;
  maxStack: number;
  level?: number;
  value: number;
  stats?: Record<string, number>;
  usable?: boolean;
  equipped?: boolean;
  slot?: number;
}

// 상점 아이템 인터페이스
interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: InventoryItem['type'];
  rarity: InventoryItem['rarity'];
  price: number;
  stock: number;
  level?: number;
  stats?: Record<string, number>;
  icon?: string;
}

// 플레이어 정보
interface PlayerInfo {
  gold: number;
  inventorySize: number;
}

// 더미 인벤토리 아이템 생성
const createDummyInventoryItems = (): InventoryItem[] => {
  return [
    {
      id: 'inv_1',
      itemId: 'iron_sword',
      name: '철 검',
      description: '튼튼한 철로 만들어진 기본적인 검입니다.',
      icon: '⚔️',
      type: 'weapon',
      rarity: 'common',
      quantity: 1,
      maxStack: 1,
      level: 5,
      value: 150,
      stats: { atk: 25, str: 3 },
      usable: false,
      equipped: true,
      slot: 0
    },
    {
      id: 'inv_2',
      itemId: 'health_potion',
      name: '체력 물약',
      description: 'HP를 50 회복시켜주는 물약입니다.',
      icon: '🧪',
      type: 'consumable',
      rarity: 'common',
      quantity: 15,
      maxStack: 99,
      value: 25,
      usable: true,
      slot: 1
    },
    {
      id: 'inv_3',
      itemId: 'leather_armor',
      name: '가죽 갑옷',
      description: '부드러운 가죽으로 만든 가벼운 갑옷입니다.',
      icon: '🦺',
      type: 'armor',
      rarity: 'common',
      quantity: 1,
      maxStack: 1,
      level: 3,
      value: 120,
      stats: { def: 15, vit: 2 },
      usable: false,
      equipped: true,
      slot: 2
    },
    {
      id: 'inv_4',
      itemId: 'mana_crystal',
      name: '마나 크리스탈',
      description: '마법력이 깃든 신비로운 크리스탈입니다.',
      icon: '💎',
      type: 'material',
      rarity: 'rare',
      quantity: 3,
      maxStack: 50,
      value: 200,
      usable: false,
      slot: 3
    },
    {
      id: 'inv_5',
      itemId: 'magic_ring',
      name: '마법의 반지',
      description: '마법력을 증폭시켜주는 반지입니다.',
      icon: '💍',
      type: 'armor',
      rarity: 'uncommon',
      quantity: 1,
      maxStack: 1,
      level: 8,
      value: 300,
      stats: { int: 5, mp: 20 },
      usable: false,
      equipped: false,
      slot: 4
    },
    {
      id: 'inv_6',
      itemId: 'bread',
      name: '빵',
      description: '배고픔을 달래주는 맛있는 빵입니다.',
      icon: '🍞',
      type: 'consumable',
      rarity: 'common',
      quantity: 8,
      maxStack: 99,
      value: 5,
      usable: true,
      slot: 5
    },
    {
      id: 'inv_7',
      itemId: 'rare_gem',
      name: '희귀한 보석',
      description: '매우 귀중한 보석입니다.',
      icon: '💠',
      type: 'misc',
      rarity: 'epic',
      quantity: 1,
      maxStack: 10,
      value: 1000,
      usable: false,
      slot: 6
    }
  ];
};

// 더미 상점 아이템 생성
const createDummyShopItems = (): ShopItem[] => {
  return [
    {
      id: 'shop_1',
      name: '강철 검',
      description: '철보다 강한 강철로 제작된 검입니다.',
      type: 'weapon',
      rarity: 'uncommon',
      price: 500,
      stock: 3,
      level: 10,
      stats: { atk: 45, str: 5 },
      icon: '⚔️'
    },
    {
      id: 'shop_2',
      name: '큰 체력 물약',
      description: 'HP를 100 회복시켜주는 강력한 물약입니다.',
      type: 'consumable',
      rarity: 'uncommon',
      price: 75,
      stock: 20,
      icon: '🧪'
    },
    {
      id: 'shop_3',
      name: '철 갑옷',
      description: '견고한 철로 만든 무거운 갑옷입니다.',
      type: 'armor',
      rarity: 'uncommon',
      price: 400,
      stock: 2,
      level: 8,
      stats: { def: 30, vit: 4 },
      icon: '🛡️'
    },
    {
      id: 'shop_4',
      name: '마나 물약',
      description: 'MP를 50 회복시켜주는 물약입니다.',
      type: 'consumable',
      rarity: 'common',
      price: 30,
      stock: 25,
      icon: '🔮'
    },
    {
      id: 'shop_5',
      name: '민첩의 부츠',
      description: '이동 속도와 회피율을 증가시켜주는 부츠입니다.',
      type: 'armor',
      rarity: 'rare',
      price: 800,
      stock: 1,
      level: 12,
      stats: { dex: 8, eva: 15 },
      icon: '👟'
    }
  ];
};

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(createDummyInventoryItems());
  const [shopItems, setShopItems] = useState<ShopItem[]>(createDummyShopItems());
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({ gold: 2500, inventorySize: 40 });
  const [selectedTab, setSelectedTab] = useState<'inventory' | 'shop' | 'storage'>('inventory');
  const [shopCategory, setShopCategory] = useState<string>('all');
  
  const { isOpen: shopModalOpen, openModal: openShopModal, closeModal: closeShopModal } = useModal();
  const { isOpen: sellAllModalOpen, openModal: openSellAllModal, closeModal: closeSellAllModal } = useModal();

  // 아이템 사용 처리
  const handleItemUse = (item: InventoryItem) => {
    if (!item.usable) return;

    console.log(`아이템 "${item.name}" 사용됨`);
    
    // 소모품인 경우 수량 감소
    if (item.type === 'consumable') {
      setInventoryItems(prevItems => 
        prevItems.map(invItem => {
          if (invItem.id === item.id) {
            const newQuantity = invItem.quantity - 1;
            return newQuantity > 0 ? { ...invItem, quantity: newQuantity } : null;
          }
          return invItem;
        }).filter(Boolean) as InventoryItem[]
      );
    }
  };

  // 아이템 장착/해제 처리
  const handleItemEquip = (item: InventoryItem) => {
    if (!['weapon', 'armor'].includes(item.type)) return;

    setInventoryItems(prevItems => 
      prevItems.map(invItem => {
        if (invItem.id === item.id) {
          return { ...invItem, equipped: !invItem.equipped };
        }
        return invItem;
      })
    );

    console.log(`아이템 "${item.name}" ${item.equipped ? '해제' : '장착'}됨`);
  };

  // 아이템 판매 처리
  const handleItemSell = (item: InventoryItem, quantity: number) => {
    const totalValue = item.value * quantity;
    
    setPlayerInfo(prev => ({ ...prev, gold: prev.gold + totalValue }));
    
    setInventoryItems(prevItems => 
      prevItems.map(invItem => {
        if (invItem.id === item.id) {
          const newQuantity = invItem.quantity - quantity;
          return newQuantity > 0 ? { ...invItem, quantity: newQuantity } : null;
        }
        return invItem;
      }).filter(Boolean) as InventoryItem[]
    );

    console.log(`아이템 "${item.name}" ${quantity}개 판매, ${totalValue}골드 획득`);
  };

  // 아이템 이동 처리
  const handleItemMove = (fromSlot: number, toSlot: number) => {
    setInventoryItems(prevItems => {
      const newItems = [...prevItems];
      const fromItem = newItems.find(item => item.slot === fromSlot);
      const toItem = newItems.find(item => item.slot === toSlot);

      if (fromItem) {
        fromItem.slot = toSlot;
      }
      if (toItem) {
        toItem.slot = fromSlot;
      }

      return newItems;
    });

    console.log(`아이템을 슬롯 ${fromSlot}에서 ${toSlot}로 이동`);
  };

  // 인벤토리 확장
  const handleInventoryExpand = () => {
    const expandCost = 1000;
    if (playerInfo.gold >= expandCost) {
      setPlayerInfo(prev => ({
        gold: prev.gold - expandCost,
        inventorySize: prev.inventorySize + 10
      }));
      console.log('인벤토리가 10칸 확장되었습니다.');
    }
  };

  // 상점 아이템 구매
  const handleShopItemBuy = (shopItem: ShopItem, quantity: number = 1) => {
    const totalCost = shopItem.price * quantity;
    
    if (playerInfo.gold < totalCost) {
      alert('골드가 부족합니다.');
      return;
    }

    if (shopItem.stock < quantity) {
      alert('재고가 부족합니다.');
      return;
    }

    // 인벤토리에 아이템 추가
    const newInventoryItem: InventoryItem = {
      id: `inv_${Date.now()}`,
      itemId: shopItem.id,
      name: shopItem.name,
      description: shopItem.description,
      icon: shopItem.icon,
      type: shopItem.type,
      rarity: shopItem.rarity,
      quantity: quantity,
      maxStack: shopItem.type === 'consumable' ? 99 : 1,
      level: shopItem.level,
      value: Math.floor(shopItem.price * 0.7), // 판매가는 구매가의 70%
      stats: shopItem.stats,
      usable: shopItem.type === 'consumable',
      equipped: false,
      slot: findEmptySlot()
    };

    setInventoryItems(prev => [...prev, newInventoryItem]);
    setPlayerInfo(prev => ({ ...prev, gold: prev.gold - totalCost }));
    setShopItems(prev => 
      prev.map(item => 
        item.id === shopItem.id 
          ? { ...item, stock: item.stock - quantity }
          : item
      )
    );

    console.log(`"${shopItem.name}" ${quantity}개 구매, ${totalCost}골드 소모`);
  };

  // 빈 슬롯 찾기
  const findEmptySlot = (): number => {
    const usedSlots = inventoryItems.map(item => item.slot).filter(slot => slot !== undefined);
    for (let i = 0; i < playerInfo.inventorySize; i++) {
      if (!usedSlots.includes(i)) {
        return i;
      }
    }
    return inventoryItems.length;
  };

  // 일괄 판매 (특정 타입)
  const handleSellAllByType = (type: InventoryItem['type']) => {
    const itemsToSell = inventoryItems.filter(item => item.type === type && !item.equipped);
    const totalValue = itemsToSell.reduce((sum, item) => sum + (item.value * item.quantity), 0);
    
    setPlayerInfo(prev => ({ ...prev, gold: prev.gold + totalValue }));
    setInventoryItems(prev => prev.filter(item => item.type !== type || item.equipped));
    
    console.log(`${type} 아이템 일괄 판매로 ${totalValue}골드 획득`);
    closeSellAllModal();
  };

  // 상점 카테고리 필터링
  const filteredShopItems = shopCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.type === shopCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">인벤토리</h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold text-yellow-600">
              💰 {playerInfo.gold.toLocaleString()} 골드
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openSellAllModal}>
                일괄 판매
              </Button>
              <Button variant="primary" onClick={openShopModal}>
                상점
              </Button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Card className="p-4">
          <div className="flex gap-2">
            {[
              { key: 'inventory', label: '인벤토리', icon: '🎒' },
              { key: 'shop', label: '상점', icon: '🏪' },
              { key: 'storage', label: '창고', icon: '📦' }
            ].map(tab => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? 'primary' : 'ghost'}
              onClick={() => setSelectedTab(tab.key as 'inventory' | 'shop' | 'storage')}
                className="flex items-center gap-2"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* 컨텐츠 영역 */}
        {selectedTab === 'inventory' && (
          <Inventory
            items={inventoryItems}
            size={playerInfo.inventorySize}
            onItemUse={handleItemUse}
            onItemEquip={handleItemEquip}
            onItemSell={handleItemSell}
            onItemMove={handleItemMove}
            onInventoryExpand={handleInventoryExpand}
            expandable={true}
            expandCost={1000}
            gold={playerInfo.gold}
            loading={false}
          />
        )}

        {selectedTab === 'shop' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">상점</h2>
              <select
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">모든 카테고리</option>
                <option value="weapon">무기</option>
                <option value="armor">방어구</option>
                <option value="consumable">소비품</option>
                <option value="material">재료</option>
                <option value="misc">기타</option>
              </select>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShopItems.map(shopItem => (
                <Card key={shopItem.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{shopItem.icon || '📦'}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold">{shopItem.name}</h3>
                        {shopItem.level && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Lv.{shopItem.level}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          shopItem.rarity === 'common' && 'bg-gray-100 text-gray-800',
                          shopItem.rarity === 'uncommon' && 'bg-green-100 text-green-800',
                          shopItem.rarity === 'rare' && 'bg-blue-100 text-blue-800',
                          shopItem.rarity === 'epic' && 'bg-purple-100 text-purple-800',
                          shopItem.rarity === 'legendary' && 'bg-orange-100 text-orange-800'
                        )}>
                          {shopItem.rarity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{shopItem.type}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{shopItem.description}</p>
                      
                      {shopItem.stats && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-600 mb-1">효과:</div>
                          <div className="text-sm">
                            {Object.entries(shopItem.stats).map(([stat, value]) => (
                              <span key={stat} className="mr-2">
                                {stat.toUpperCase()}: +{value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-yellow-600">
                            {shopItem.price.toLocaleString()}골드
                          </div>
                          <div className="text-xs text-gray-600">
                            재고: {shopItem.stock}개
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleShopItemBuy(shopItem)}
                          disabled={playerInfo.gold < shopItem.price || shopItem.stock === 0}
                        >
                          구매
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {selectedTab === 'storage' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">창고</h2>
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📦</div>
              <p>창고 기능은 아직 구현되지 않았습니다.</p>
              <p className="text-sm mt-2">향후 업데이트에서 제공될 예정입니다.</p>
            </div>
          </Card>
        )}

        {/* 상점 모달 */}
        <Modal
          isOpen={shopModalOpen}
          onClose={closeShopModal}
          title="상점"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-yellow-600">
                보유 골드: {playerInfo.gold.toLocaleString()}G
              </div>
              <select
                value={shopCategory}
                onChange={(e) => setShopCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">모든 카테고리</option>
                <option value="weapon">무기</option>
                <option value="armor">방어구</option>
                <option value="consumable">소비품</option>
                <option value="material">재료</option>
              </select>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredShopItems.map(shopItem => (
                <div key={shopItem.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{shopItem.icon || '📦'}</div>
                    <div>
                      <div className="font-medium">{shopItem.name}</div>
                      <div className="text-sm text-gray-600">
                        {shopItem.price.toLocaleString()}골드 • 재고: {shopItem.stock}개
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleShopItemBuy(shopItem)}
                    disabled={playerInfo.gold < shopItem.price || shopItem.stock === 0}
                  >
                    구매
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        {/* 일괄 판매 모달 */}
        <Modal
          isOpen={sellAllModalOpen}
          onClose={closeSellAllModal}
          title="일괄 판매"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              선택한 타입의 모든 아이템을 판매합니다. (장착 중인 아이템은 제외)
            </p>
            
            <div className="space-y-2">
              {['consumable', 'material', 'misc'].map(type => {
                const typeItems = inventoryItems.filter(item => item.type === type && !item.equipped);
                const totalValue = typeItems.reduce((sum, item) => sum + (item.value * item.quantity), 0);
                
                return (
                  <div key={type} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium capitalize">{type}</div>
                      <div className="text-sm text-gray-600">
                        {typeItems.length}개 아이템 • {totalValue.toLocaleString()}골드
                      </div>
                    </div>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => handleSellAllByType(type as InventoryItem['type'])}
                      disabled={typeItems.length === 0}
                    >
                      판매
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
