/**
 * 플레이어 상태 표시 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress, StatProgress, CircularProgress } from '../ui/Progress';
import { Modal, useModal } from '../ui/Modal';

// 플레이어 기본 정보
export interface PlayerInfo {
  id: string;
  username: string;
  characterName: string;
  class: string;
  level: number;
  experience: number;
  experienceToNext: number;
  avatar?: string;
  title?: string;
  guild?: string;
  location?: string;
  onlineStatus: 'online' | 'away' | 'busy' | 'offline';
  lastActive?: string;
}

// 플레이어 스탯
export interface PlayerStats {
  // 기본 스탯
  str: number; // 힘
  dex: number; // 민첩
  int: number; // 지능
  vit: number; // 체력
  luk: number; // 운

  // 파생 스탯 (계산됨)
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  acc: number; // 명중
  eva: number; // 회피
  crit: number; // 치명타
  
  // 추가 스탯
  statPoints: number; // 사용 가능한 스탯 포인트
  skillPoints: number; // 사용 가능한 스킬 포인트
}

// 플레이어 상태 효과
export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'buff' | 'debuff' | 'neutral';
  duration: number; // 남은 시간 (초)
  maxDuration: number; // 최대 지속 시간
  stackable: boolean;
  stacks?: number;
  effects: Record<string, number>; // 스탯 변화
}

// 플레이어 상태 Props
export interface PlayerStatusProps {
  player: PlayerInfo;
  stats: PlayerStats;
  statusEffects?: StatusEffect[];
  gold: number;
  onStatIncrease?: (stat: keyof Omit<PlayerStats, 'hp' | 'maxHp' | 'mp' | 'maxMp' | 'atk' | 'def' | 'acc' | 'eva' | 'crit'>) => void;
  onStatusEffectClick?: (effect: StatusEffect) => void;
  compact?: boolean;
  showDetailedStats?: boolean;
  className?: string;
}

// 온라인 상태 색상
const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-500'
};

// 온라인 상태 텍스트
const statusTexts = {
  online: '온라인',
  away: '자리비움',
  busy: '바쁨',
  offline: '오프라인'
};

// 클래스별 색상
const classColors = {
  warrior: 'from-red-400 to-red-600',
  mage: 'from-blue-400 to-blue-600',
  archer: 'from-green-400 to-green-600',
  thief: 'from-purple-400 to-purple-600',
  priest: 'from-yellow-400 to-yellow-600',
  knight: 'from-gray-400 to-gray-600'
};

// 상태 효과 아이템 컴포넌트
const StatusEffectItem: React.FC<{
  effect: StatusEffect;
  onClick?: (effect: StatusEffect) => void;
}> = ({ effect, onClick }) => {
  const [timeLeft, setTimeLeft] = useState(effect.duration);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const percentage = (timeLeft / effect.maxDuration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className={cn(
        'relative w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer group',
        effect.type === 'buff' && 'border-green-400 bg-green-50',
        effect.type === 'debuff' && 'border-red-400 bg-red-50',
        effect.type === 'neutral' && 'border-gray-400 bg-gray-50'
      )}
      onClick={() => onClick?.(effect)}
    >
      {/* 아이콘 */}
      <span className="text-xl">{effect.icon}</span>
      
      {/* 스택 수 */}
      {effect.stackable && effect.stacks && effect.stacks > 1 && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {effect.stacks}
        </div>
      )}
      
      {/* 지속 시간 표시 */}
      <div
        className="absolute bottom-0 left-0 bg-blue-500 h-1 transition-all duration-1000"
        style={{ width: `${percentage}%` }}
      />
      
      {/* 툴팁 */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs">
        <div className="font-medium">{effect.name}</div>
        <div className="text-gray-300 text-xs mt-1">{effect.description}</div>
        <div className="text-gray-400 text-xs mt-1">
          {minutes}:{seconds.toString().padStart(2, '0')} 남음
        </div>
        {Object.keys(effect.effects).length > 0 && (
          <div className="text-xs mt-1 border-t border-gray-700 pt-1">
            {Object.entries(effect.effects).map(([stat, value]) => (
              <div key={stat} className="flex justify-between">
                <span>{stat}:</span>
                <span className={value > 0 ? 'text-green-400' : 'text-red-400'}>
                  {value > 0 ? '+' : ''}{value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 스탯 포인트 할당 모달
const StatAllocationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onStatIncrease?: (stat: keyof Omit<PlayerStats, 'hp' | 'maxHp' | 'mp' | 'maxMp' | 'atk' | 'def' | 'acc' | 'eva' | 'crit'>) => void;
}> = ({ isOpen, onClose, stats, onStatIncrease }) => {
  const [allocation, setAllocation] = useState({
    str: 0,
    dex: 0,
    int: 0,
    vit: 0,
    luk: 0
  });

  const totalAllocated = Object.values(allocation).reduce((sum, val) => sum + val, 0);
  const remainingPoints = stats.statPoints - totalAllocated;

  const handleIncrement = (stat: keyof typeof allocation) => {
    if (remainingPoints > 0) {
      setAllocation(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
    }
  };

  const handleDecrement = (stat: keyof typeof allocation) => {
    if (allocation[stat] > 0) {
      setAllocation(prev => ({ ...prev, [stat]: prev[stat] - 1 }));
    }
  };

  const handleApply = () => {
    Object.entries(allocation).forEach(([stat, points]) => {
      for (let i = 0; i < points; i++) {
        onStatIncrease?.(stat as any);
      }
    });
    setAllocation({ str: 0, dex: 0, int: 0, vit: 0, luk: 0 });
    onClose();
  };

  const handleReset = () => {
    setAllocation({ str: 0, dex: 0, int: 0, vit: 0, luk: 0 });
  };

  const statDescriptions = {
    str: '물리 공격력과 무기 데미지 증가',
    dex: '명중률, 회피율, 치명타율 증가',
    int: '마법 공격력과 MP 증가',
    vit: 'HP와 방어력 증가',
    luk: '모든 능력치 소폭 증가, 크리티컬 데미지 증가'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="스탯 포인트 할당"
      size="md"
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-lg font-bold">사용 가능한 포인트: {remainingPoints}</div>
          <div className="text-sm text-gray-600">할당 예정: {totalAllocated}</div>
        </div>

        <div className="space-y-3">
          {Object.entries(allocation).map(([stat, points]) => (
            <div key={stat} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium uppercase">{stat}</span>
                  <span className="text-gray-600">
                    ({(stats as any)[stat]} → {(stats as any)[stat] + points})
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {statDescriptions[stat as keyof typeof statDescriptions]}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDecrement(stat as keyof typeof allocation)}
                  disabled={points === 0}
                >
                  −
                </Button>
                <span className="w-8 text-center font-medium">{points}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleIncrement(stat as keyof typeof allocation)}
                  disabled={remainingPoints === 0}
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="secondary" onClick={handleReset}>
            초기화
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={totalAllocated === 0}
            className="flex-1"
          >
            적용
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 메인 플레이어 상태 컴포넌트
export const PlayerStatus: React.FC<PlayerStatusProps> = ({
  player,
  stats,
  statusEffects = [],
  gold,
  onStatIncrease,
  onStatusEffectClick,
  compact = false,
  showDetailedStats = true,
  className
}) => {
  const { isOpen, openModal, closeModal } = useModal();
  
  const expPercentage = (player.experience / player.experienceToNext) * 100;
  const hpPercentage = (stats.hp / stats.maxHp) * 100;
  const mpPercentage = (stats.mp / stats.maxMp) * 100;

  const classGradient = classColors[player.class as keyof typeof classColors] || classColors.warrior;

  if (compact) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br',
            classGradient
          )}>
            {player.avatar || player.characterName.charAt(0)}
          </div>

          {/* 기본 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg truncate">{player.characterName}</h3>
              <div className={cn('w-3 h-3 rounded-full', statusColors[player.onlineStatus])} />
            </div>
            <div className="text-sm text-gray-600">
              Lv.{player.level} {player.class}
              {player.guild && ` • ${player.guild}`}
            </div>
            
            {/* 컴팩트 HP/MP 바 */}
            <div className="mt-2 space-y-1">
              <StatProgress
                statName="HP"
                statIcon="❤️"
                current={stats.hp}
                maximum={stats.maxHp}
                variant="hp"
                compact
              />
              <StatProgress
                statName="MP"
                statIcon="💙"
                current={stats.mp}
                maximum={stats.maxMp}
                variant="mp"
                compact
              />
            </div>
          </div>

          {/* 골드 */}
          <div className="text-right">
            <div className="text-yellow-600 font-bold">{gold.toLocaleString()}G</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* 플레이어 기본 정보 */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold bg-gradient-to-br',
              classGradient
            )}>
              {player.avatar || player.characterName.charAt(0)}
            </div>
            
            {/* 온라인 상태 표시 */}
            <div className={cn(
              'absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white',
              statusColors[player.onlineStatus]
            )} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{player.characterName}</h2>
              {player.title && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                  {player.title}
                </span>
              )}
            </div>
            
            <div className="text-gray-600 space-y-1">
              <div>Lv.{player.level} {player.class} • {statusTexts[player.onlineStatus]}</div>
              {player.guild && <div>길드: {player.guild}</div>}
              {player.location && <div>위치: {player.location}</div>}
              <div>골드: <span className="text-yellow-600 font-bold">{gold.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        {/* HP/MP/EXP 바 */}
        <div className="space-y-3">
          <StatProgress
            statName="HP"
            statIcon="❤️"
            current={stats.hp}
            maximum={stats.maxHp}
            variant="hp"
            glowing={hpPercentage < 25}
          />
          
          <StatProgress
            statName="MP"
            statIcon="💙"
            current={stats.mp}
            maximum={stats.maxMp}
            variant="mp"
          />
          
          <StatProgress
            statName="EXP"
            statIcon="⭐"
            current={player.experience}
            maximum={player.experienceToNext}
            variant="exp"
            animated
            striped
          />
        </div>

        {/* 기본 스탯 */}
        {showDetailedStats && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">스탯</h3>
              {stats.statPoints > 0 && (
                <Button variant="primary" size="sm" onClick={openModal}>
                  스탯 포인트 할당 ({stats.statPoints})
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 기본 스탯 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">기본 스탯</h4>
                {[
                  { key: 'str', name: 'STR', value: stats.str },
                  { key: 'dex', name: 'DEX', value: stats.dex },
                  { key: 'int', name: 'INT', value: stats.int },
                  { key: 'vit', name: 'VIT', value: stats.vit },
                  { key: 'luk', name: 'LUK', value: stats.luk }
                ].map(stat => (
                  <div key={stat.key} className="flex justify-between text-sm">
                    <span>{stat.name}</span>
                    <span className="font-medium">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* 파생 스탯 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">전투 스탯</h4>
                {[
                  { name: 'ATK', value: stats.atk },
                  { name: 'DEF', value: stats.def },
                  { name: 'ACC', value: stats.acc },
                  { name: 'EVA', value: stats.eva },
                  { name: 'CRIT', value: stats.crit }
                ].map(stat => (
                  <div key={stat.name} className="flex justify-between text-sm">
                    <span>{stat.name}</span>
                    <span className="font-medium">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 스킬 포인트 */}
            {stats.skillPoints > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">
                  사용 가능한 스킬 포인트: {stats.skillPoints}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 상태 효과 */}
        {statusEffects.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">상태 효과</h3>
            <div className="flex flex-wrap gap-2">
              {statusEffects.map(effect => (
                <StatusEffectItem
                  key={effect.id}
                  effect={effect}
                  onClick={onStatusEffectClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 스탯 할당 모달 */}
      <StatAllocationModal
        isOpen={isOpen}
        onClose={closeModal}
        stats={stats}
        onStatIncrease={onStatIncrease}
      />
    </Card>
  );
};

// 플레이어 미니 상태 컴포넌트 (게임 UI 상단용)
export const PlayerMiniStatus: React.FC<{
  player: Pick<PlayerInfo, 'characterName' | 'level' | 'class'>;
  stats: Pick<PlayerStats, 'hp' | 'maxHp' | 'mp' | 'maxMp'>;
  gold: number;
  className?: string;
}> = ({ player, stats, gold, className }) => {
  const hpPercentage = (stats.hp / stats.maxHp) * 100;
  const mpPercentage = (stats.mp / stats.maxMp) * 100;

  return (
    <div className={cn('flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm', className)}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {player.characterName.charAt(0)}
        </div>
        <div>
          <div className="font-medium text-sm">{player.characterName}</div>
          <div className="text-xs text-gray-600">Lv.{player.level} {player.class}</div>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-600 w-6">HP</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${hpPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 w-16 text-right">
            {stats.hp}/{stats.maxHp}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 w-6">MP</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${mpPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 w-16 text-right">
            {stats.mp}/{stats.maxMp}
          </span>
        </div>
      </div>

      <div className="text-right">
        <div className="text-yellow-600 font-bold text-sm">{gold.toLocaleString()}</div>
        <div className="text-xs text-gray-600">골드</div>
      </div>
    </div>
  );
};

export default PlayerStatus;