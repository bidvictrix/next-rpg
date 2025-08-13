/**
 * 게임 인벤토리 컴포넌트
 */

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, useModal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Loading } from '../ui/Loading';

// 인벤토리 아이템 인터페이스
export interface InventoryItem {
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

// 인벤토리 Props
export interface InventoryProps {
  items: InventoryItem[];
  size: number;
  onItemUse?: (item: InventoryItem) => void;
  onItemEquip?: (item: InventoryItem) => void;
  onItemSell?: (item: InventoryItem, quantity: number) => void;
  onItemMove?: (fromSlot: number, toSlot: number) => void;
  onInventoryExpand?: () => void;
  loading?: boolean;
  expandable?: boolean;
  expandCost?: number;
  gold?: number;
  className?: string;
}

// 아이템 정렬 옵션
type SortOption = 'name' | 'type' | 'rarity' | 'level' | 'value' | 'quantity';
type SortDirection = 'asc' | 'desc';

// 아이템 필터 옵션
interface FilterOptions {
  search: string;
  type: string;
  rarity: string;
  minLevel: number;
  maxLevel: number;
  usableOnly: boolean;
  equippedOnly: boolean;
}

// 희소성 색상 매핑
const rarityColors = {
  common: 'border-gray-400 bg-gray-50',
  uncommon: 'border-green-400 bg-green-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-orange-400 bg-orange-50',
  mythic: 'border-pink-400 bg-pink-50'
};

// 아이템 타입 아이콘
const typeIcons = {
  weapon: '⚔️',
  armor: '🛡️',
  consumable: '🧪',
  material: '⚒️',
  quest: '📜',
  misc: '📦'
};

// 아이템 슬롯 컴포넌트
const ItemSlot: React.FC<{
  item?: InventoryItem;
  slotIndex: number;
  onItemClick: (slotIndex: number, item?: InventoryItem) => void;
  onItemDoubleClick?: (item: InventoryItem) => void;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent, item: InventoryItem, slotIndex: number) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetSlot: number) => void;
  selected?: boolean;
}> = ({
  item,
  slotIndex,
  onItemClick,
  onItemDoubleClick,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  selected
}) => {
  const isEmpty = !item;
  const rarityClass = item ? rarityColors[item.rarity] : '';

  return (
    <div
      className={cn(
        'w-16 h-16 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200',
        isEmpty ? 'border-gray-300 bg-gray-100 hover:bg-gray-200' : rarityClass,
        selected && 'ring-2 ring-blue-500',
        isDragOver && 'ring-2 ring-green-500',
        item?.equipped && 'shadow-lg shadow-blue-500/25',
        'relative group'
      )}
      onClick={() => onItemClick(slotIndex, item)}
      onDoubleClick={() => item && onItemDoubleClick?.(item)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, slotIndex)}
      onDragEnter={(e) => e.preventDefault()}
    >
      {item && (
        <>
          <div
            draggable
            onDragStart={(e) => onDragStart?.(e, item, slotIndex)}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            {/* 아이템 아이콘 */}
            <div className="text-2xl mb-1">
              {item.icon || typeIcons[item.type]}
            </div>
            
            {/* 수량 표시 */}
            {item.quantity > 1 && (
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs font-bold px-1 rounded-tl min-w-[16px] text-center">
                {item.quantity > 999 ? '999+' : item.quantity}
              </div>
            )}
            
            {/* 레벨 표시 */}
            {item.level && (
              <div className="absolute top-0 left-0 bg-gray-800 text-white text-xs px-1 rounded-br">
                {item.level}
              </div>
            )}
            
            {/* 장착 표시 */}
            {item.equipped && (
              <div className="absolute top-0 right-0 text-blue-500 text-xs">
                ✓
              </div>
            )}
          </div>
          
          {/* 툴팁 */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div className="font-medium">{item.name}</div>
            {item.level && <div>레벨 {item.level}</div>}
            <div className="text-gray-300">{item.type} · {item.rarity}</div>
          </div>
        </>
      )}
    </div>
  );
};

// 아이템 상세 정보 모달
const ItemDetailModal: React.FC<{
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUse?: (item: InventoryItem) => void;
  onEquip?: (item: InventoryItem) => void;
  onSell?: (item: InventoryItem, quantity: number) => void;
}> = ({ item, isOpen, onClose, onUse, onEquip, onSell }) => {
  const [sellQuantity, setSellQuantity] = useState(1);

  if (!item) return null;

  const canUse = item.usable && item.type === 'consumable';
  const canEquip = ['weapon', 'armor'].includes(item.type);
  const totalValue = item.value * sellQuantity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      size="md"
    >
      <div className="space-y-4">
        {/* 아이템 기본 정보 */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
            {item.icon || typeIcons[item.type]}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{item.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                item.rarity === 'common' && 'bg-gray-100 text-gray-800',
                item.rarity === 'uncommon' && 'bg-green-100 text-green-800',
                item.rarity === 'rare' && 'bg-blue-100 text-blue-800',
                item.rarity === 'epic' && 'bg-purple-100 text-purple-800',
                item.rarity === 'legendary' && 'bg-orange-100 text-orange-800',
                item.rarity === 'mythic' && 'bg-pink-100 text-pink-800'
              )}>
                {item.rarity.toUpperCase()}
              </span>
              <span>{item.type}</span>
              {item.level && <span>레벨 {item.level}</span>}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              수량: {item.quantity} / 가치: {item.value}골드
            </div>
          </div>
        </div>

        {/* 아이템 설명 */}
        {item.description && (
          <div className="text-gray-700">
            {item.description}
          </div>
        )}

        {/* 아이템 스탯 */}
        {item.stats && Object.keys(item.stats).length > 0 && (
          <div>
            <h4 className="font-medium mb-2">효과</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(item.stats).map(([stat, value]) => (
                <div key={stat} className="flex justify-between">
                  <span className="capitalize">{stat}:</span>
                  <span className={value > 0 ? 'text-green-600' : 'text-red-600'}>
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 판매 옵션 */}
        {item.value > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">판매</h4>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity))}
                min={1}
                max={item.quantity}
                size="sm"
                className="w-20"
              />
              <span className="text-sm">개 × {item.value}골드 = {totalValue}골드</span>
              <Button
                variant="warning"
                size="sm"
                onClick={() => {
                  onSell?.(item, sellQuantity);
                  onClose();
                }}
              >
                판매
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 모달 푸터 */}
      <div className="flex gap-2 mt-6">
        {canUse && (
          <Button
            variant="primary"
            onClick={() => {
              onUse?.(item);
              onClose();
            }}
          >
            사용
          </Button>
        )}
        {canEquip && (
          <Button
            variant={item.equipped ? 'secondary' : 'success'}
            onClick={() => {
              onEquip?.(item);
              onClose();
            }}
          >
            {item.equipped ? '해제' : '장착'}
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
};

// 메인 인벤토리 컴포넌트
export const Inventory: React.FC<InventoryProps> = ({
  items,
  size,
  onItemUse,
  onItemEquip,
  onItemSell,
  onItemMove,
  onInventoryExpand,
  loading = false,
  expandable = false,
  expandCost = 1000,
  gold = 0,
  className
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    item: InventoryItem;
    fromSlot: number;
  } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    rarity: 'all',
    minLevel: 0,
    maxLevel: 999,
    usableOnly: false,
    equippedOnly: false
  });

  const { isOpen, openModal, closeModal } = useModal();

  // 슬롯별 아이템 배열 생성
  const slotItems = useMemo(() => {
    const slots: (InventoryItem | undefined)[] = new Array(size).fill(undefined);
    items.forEach(item => {
      if (item.slot !== undefined && item.slot < size) {
        slots[item.slot] = item;
      }
    });
    return slots;
  }, [items, size]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      if (filters.rarity !== 'all' && item.rarity !== filters.rarity) {
        return false;
      }
      if (item.level && (item.level < filters.minLevel || item.level > filters.maxLevel)) {
        return false;
      }
      if (filters.usableOnly && !item.usable) {
        return false;
      }
      if (filters.equippedOnly && !item.equipped) {
        return false;
      }
      return true;
    });
  }, [items, filters]);

  // 정렬된 아이템
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aValue: string | number | undefined = a[sortBy] as unknown as string | number | undefined;
      let bValue: string | number | undefined = b[sortBy] as unknown as string | number | undefined;

      if (sortBy === 'rarity') {
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 } as const;
        aValue = rarityOrder[a.rarity];
        bValue = rarityOrder[b.rarity];
      }

      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortBy, sortDirection]);

  // 선택된 아이템
  const selectedItem: InventoryItem | null = selectedSlot !== null ? (slotItems[selectedSlot] ?? null) : null;

  // 아이템 클릭 핸들러
  const handleItemClick = useCallback((slotIndex: number, item?: InventoryItem) => {
    setSelectedSlot(selectedSlot === slotIndex ? null : slotIndex);
  }, [selectedSlot]);

  // 아이템 더블클릭 핸들러 (상세 정보)
  const handleItemDoubleClick = useCallback((item: InventoryItem) => {
    openModal();
  }, [openModal]);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, item: InventoryItem, fromSlot: number) => {
    setDraggedItem({ item, fromSlot });
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // 드래그 오버
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    if (draggedItem && draggedItem.fromSlot !== targetSlot) {
      onItemMove?.(draggedItem.fromSlot, targetSlot);
    }
    setDraggedItem(null);
    setDragOverSlot(null);
  }, [draggedItem, onItemMove]);

  // 정렬 변경
  const handleSortChange = useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  }, [sortBy, sortDirection]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loading text="인벤토리 로딩중..." size="lg" />
      </div>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">인벤토리</h2>
          <div className="text-sm text-gray-600">
            {items.length} / {size}
            {expandable && (
              <Button
                variant="game"
                size="sm"
                className="ml-2"
                onClick={onInventoryExpand}
                disabled={gold < expandCost}
              >
                확장 ({expandCost}골드)
              </Button>
            )}
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="아이템 검색..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon="🔍"
              size="sm"
              className="flex-1"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">모든 타입</option>
              <option value="weapon">무기</option>
              <option value="armor">방어구</option>
              <option value="consumable">소비품</option>
              <option value="material">재료</option>
              <option value="quest">퀘스트</option>
              <option value="misc">기타</option>
            </select>
            <select
              value={filters.rarity}
              onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">모든 등급</option>
              <option value="common">일반</option>
              <option value="uncommon">고급</option>
              <option value="rare">희귀</option>
              <option value="epic">영웅</option>
              <option value="legendary">전설</option>
              <option value="mythic">신화</option>
            </select>
          </div>

          {/* 정렬 옵션 */}
          <div className="flex gap-2">
            <span className="text-sm text-gray-600 py-1">정렬:</span>
            {(['name', 'type', 'rarity', 'level', 'value'] as SortOption[]).map(option => (
              <Button
                key={option}
                variant={sortBy === option ? 'primary' : 'ghost'}
                size="xs"
                onClick={() => handleSortChange(option)}
              >
                {option}
                {sortBy === option && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </Button>
            ))}
          </div>

          {/* 필터 체크박스 */}
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.usableOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, usableOnly: e.target.checked }))}
              />
              사용 가능만
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.equippedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, equippedOnly: e.target.checked }))}
              />
              장착한 것만
            </label>
          </div>
        </div>
      </div>

      {/* 인벤토리 그리드 */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        {slotItems.map((item, index) => (
          <ItemSlot
            key={index}
            item={item}
            slotIndex={index}
            onItemClick={handleItemClick}
            onItemDoubleClick={handleItemDoubleClick}
            selected={selectedSlot === index}
            isDragOver={dragOverSlot === index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* 선택된 아이템 정보 */}
      {selectedItem && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
              {selectedItem.icon || typeIcons[selectedItem.type]}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{selectedItem.name}</h3>
              <p className="text-sm text-gray-600">
                {selectedItem.type} · {selectedItem.rarity} · 수량: {selectedItem.quantity}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedItem.usable && (
                <Button
                  size="sm"
                  onClick={() => onItemUse?.(selectedItem)}
                >
                  사용
                </Button>
              )}
              {(['weapon', 'armor'].includes(selectedItem.type)) && (
                <Button
                  variant={selectedItem.equipped ? 'secondary' : 'success'}
                  size="sm"
                  onClick={() => onItemEquip?.(selectedItem)}
                >
                  {selectedItem.equipped ? '해제' : '장착'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={openModal}
              >
                상세정보
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 아이템 상세 모달 */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={isOpen}
        onClose={closeModal}
        onUse={onItemUse}
        onEquip={onItemEquip}
        onSell={onItemSell}
      />
    </Card>
  );
};

export default Inventory;