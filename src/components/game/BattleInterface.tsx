/**
 * 전투 인터페이스 컴포넌트
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Modal, useModal } from '../ui/Modal';
import { Loading } from '../ui/Loading';

// 전투 참가자 인터페이스
export interface BattleParticipant {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  acc: number;
  eva: number;
  crit: number;
  speed: number;
  avatar?: string;
  statusEffects: BattleStatusEffect[];
  isPlayer: boolean;
}

// 전투 상태 효과
export interface BattleStatusEffect {
  id: string;
  name: string;
  icon: string;
  type: 'buff' | 'debuff';
  duration: number;
  effects: Record<string, number>;
}

// 전투 액션
export interface BattleAction {
  id: string;
  type: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  name: string;
  description: string;
  icon?: string;
  cooldown?: number;
  manaCost?: number;
  itemId?: string;
  skillId?: string;
  targetType: 'self' | 'enemy' | 'all_enemies' | 'all_allies';
  available: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

// 전투 로그 엔트리
export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: 'action' | 'damage' | 'heal' | 'effect' | 'system';
  actor: string;
  target?: string;
  message: string;
  value?: number;
  critical?: boolean;
  missed?: boolean;
}

// 전투 결과
export interface BattleResult {
  victory: boolean;
  experience: number;
  gold: number;
  items: Array<{ id: string; name: string; quantity: number }>;
  levelUp?: boolean;
  newLevel?: number;
}

// 전투 인터페이스 Props
export interface BattleInterfaceProps {
  player: BattleParticipant;
  enemies: BattleParticipant[];
  allies?: BattleParticipant[];
  availableActions: BattleAction[];
  battleLog: BattleLogEntry[];
  currentTurn: string;
  turnOrder: string[];
  battleResult?: BattleResult;
  isPlayerTurn: boolean;
  isAnimating: boolean;
  onActionSelect: (action: BattleAction, targetId?: string) => void;
  onBattleEnd?: () => void;
  autoMode?: boolean;
  onToggleAuto?: () => void;
  className?: string;
}

// 참가자 카드 컴포넌트
const ParticipantCard: React.FC<{
  participant: BattleParticipant;
  isCurrentTurn: boolean;
  isTarget?: boolean;
  onSelect?: (id: string) => void;
  showDetailedStats?: boolean;
  animating?: boolean;
}> = ({ 
  participant, 
  isCurrentTurn, 
  isTarget, 
  onSelect, 
  showDetailedStats = false,
  animating = false
}) => {
  const hpPercentage = (participant.hp / participant.maxHp) * 100;
  const mpPercentage = (participant.mp / participant.maxMp) * 100;
  const isDead = participant.hp <= 0;

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all duration-200',
        isCurrentTurn && 'ring-2 ring-blue-500',
        isTarget && 'ring-2 ring-red-500',
        isDead && 'opacity-50 grayscale',
        animating && 'animate-pulse',
        participant.isPlayer ? 'bg-blue-50' : 'bg-red-50'
      )}
      onClick={() => onSelect?.(participant.id)}
    >
      <div className="flex items-center gap-3">
        {/* 아바타 */}
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold',
          participant.isPlayer ? 'bg-blue-500' : 'bg-red-500'
        )}>
          {participant.avatar || participant.name.charAt(0)}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold truncate">{participant.name}</h3>
            <span className="text-sm text-gray-600">Lv.{participant.level}</span>
            {isCurrentTurn && (
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                턴
              </span>
            )}
          </div>

          {/* HP 바 */}
          <div className="mb-2">
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="text-red-600 font-medium">HP</span>
              <span className="text-gray-600">
                {participant.hp} / {participant.maxHp}
              </span>
              <span className="ml-auto text-gray-600">
                {Math.round(hpPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-500',
                  hpPercentage > 50 ? 'bg-green-500' :
                  hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
          </div>

          {/* MP 바 */}
          <div className="mb-2">
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="text-blue-600 font-medium">MP</span>
              <span className="text-gray-600">
                {participant.mp} / {participant.maxMp}
              </span>
              <span className="ml-auto text-gray-600">
                {Math.round(mpPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${mpPercentage}%` }}
              />
            </div>
          </div>

          {/* 상태 효과 */}
          {participant.statusEffects.length > 0 && (
            <div className="flex gap-1 mt-2">
              {participant.statusEffects.map(effect => (
                <div
                  key={effect.id}
                  className={cn(
                    'w-6 h-6 rounded flex items-center justify-center text-xs',
                    effect.type === 'buff' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  )}
                  title={`${effect.name} (${effect.duration}턴)`}
                >
                  {effect.icon}
                </div>
              ))}
            </div>
          )}

          {/* 상세 스탯 (선택사항) */}
          {showDetailedStats && (
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div>ATK: {participant.atk}</div>
              <div>DEF: {participant.def}</div>
              <div>SPD: {participant.speed}</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// 액션 버튼 컴포넌트
const ActionButton: React.FC<{
  action: BattleAction;
  onSelect: (action: BattleAction) => void;
  disabled?: boolean;
}> = ({ action, onSelect, disabled }) => {
  const getVariant = () => {
    switch (action.type) {
      case 'attack': return 'danger';
      case 'skill': return 'primary';
      case 'item': return 'success';
      case 'defend': return 'secondary';
      case 'flee': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Button
      variant={getVariant()}
      size="lg"
      onClick={() => onSelect(action)}
      disabled={disabled || !action.available}
      className="h-20 flex-col gap-1"
      tooltip={action.disabled ? action.disabledReason : action.description}
    >
      <div className="text-2xl">{action.icon || '⚡'}</div>
      <div className="text-sm font-medium">{action.name}</div>
      {action.manaCost && (
        <div className="text-xs opacity-75">MP {action.manaCost}</div>
      )}
      {action.cooldown && (
        <div className="text-xs opacity-75">CD {action.cooldown}</div>
      )}
    </Button>
  );
};

// 전투 로그 컴포넌트
const BattleLog: React.FC<{
  entries: BattleLogEntry[];
  maxEntries?: number;
}> = ({ entries, maxEntries = 50 }) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  const getEntryStyle = (entry: BattleLogEntry) => {
    switch (entry.type) {
      case 'damage':
        return entry.critical ? 'text-red-600 font-bold' : 'text-red-700';
      case 'heal':
        return 'text-green-600';
      case 'effect':
        return 'text-purple-600';
      case 'system':
        return 'text-gray-600 italic';
      default:
        return 'text-gray-800';
    }
  };

  const displayEntries = entries.slice(-maxEntries);

  return (
    <Card className="h-48 p-4">
      <h4 className="font-medium mb-2">전투 로그</h4>
      <div
        ref={logRef}
        className="h-32 overflow-y-auto space-y-1 text-sm"
      >
        {displayEntries.map(entry => (
          <div
            key={entry.id}
            className={cn('leading-relaxed', getEntryStyle(entry))}
          >
            <span className="text-gray-500 text-xs mr-2">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            {entry.message}
            {entry.critical && <span className="ml-1 text-yellow-500">⚡</span>}
            {entry.missed && <span className="ml-1 text-gray-500">❌</span>}
          </div>
        ))}
      </div>
    </Card>
  );
};

// 전투 결과 모달
const BattleResultModal: React.FC<{
  result: BattleResult | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ result, isOpen, onClose }) => {
  if (!result) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={result.victory ? '승리!' : '패배...'}
      size="md"
      preventClose={true}
    >
      <div className="text-center space-y-4">
        {/* 결과 아이콘 */}
        <div className="text-6xl">
          {result.victory ? '🎉' : '💀'}
        </div>

        {/* 결과 메시지 */}
        <h3 className={cn(
          'text-2xl font-bold',
          result.victory ? 'text-green-600' : 'text-red-600'
        )}>
          {result.victory ? '전투 승리!' : '전투 패배'}
        </h3>

        {/* 보상 (승리 시만) */}
        {result.victory && (
          <div className="space-y-3">
            {/* 경험치 */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-blue-800 font-medium">
                경험치 획득: +{result.experience} EXP
              </div>
            </div>

            {/* 골드 */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="text-yellow-800 font-medium">
                골드 획득: +{result.gold} 골드
              </div>
            </div>

            {/* 아이템 */}
            {result.items.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-green-800 font-medium mb-2">아이템 획득:</div>
                <div className="space-y-1">
                  {result.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.name} x{item.quantity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 레벨업 */}
            {result.levelUp && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-purple-800 font-bold text-lg">
                  🎊 레벨업! 🎊
                </div>
                <div className="text-purple-700">
                  새 레벨: {result.newLevel}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 확인 버튼 */}
        <Button
          variant="primary"
          size="lg"
          onClick={onClose}
          className="w-full mt-6"
        >
          확인
        </Button>
      </div>
    </Modal>
  );
};

// 메인 전투 인터페이스 컴포넌트
export const BattleInterface: React.FC<BattleInterfaceProps> = ({
  player,
  enemies,
  allies = [],
  availableActions,
  battleLog,
  currentTurn,
  turnOrder,
  battleResult,
  isPlayerTurn,
  isAnimating,
  onActionSelect,
  onBattleEnd,
  autoMode = false,
  onToggleAuto,
  className
}) => {
  const [selectedAction, setSelectedAction] = useState<BattleAction | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  
  const { isOpen: resultModalOpen, openModal: openResultModal, closeModal: closeResultModal } = useModal();

  // 전투 결과 모달 열기
  useEffect(() => {
    if (battleResult) {
      openResultModal();
    }
  }, [battleResult, openResultModal]);

  // 액션 선택 핸들러
  const handleActionSelect = useCallback((action: BattleAction) => {
    setSelectedAction(action);
    
    // 타겟이 필요없는 액션은 바로 실행
    if (action.targetType === 'self' || action.type === 'defend' || action.type === 'flee') {
      onActionSelect(action);
      setSelectedAction(null);
    }
  }, [onActionSelect]);

  // 타겟 선택 핸들러
  const handleTargetSelect = useCallback((targetId: string) => {
    if (selectedAction) {
      onActionSelect(selectedAction, targetId);
      setSelectedAction(null);
      setSelectedTarget(null);
    } else {
      setSelectedTarget(targetId);
    }
  }, [selectedAction, onActionSelect]);

  // 전투 결과 모달 닫기
  const handleResultModalClose = useCallback(() => {
    closeResultModal();
    onBattleEnd?.();
  }, [closeResultModal, onBattleEnd]);

  // 모든 참가자 목록
  const allParticipants = [player, ...allies, ...enemies];

  // 타겟 선택 모드인지 확인
  const isTargetSelectionMode = selectedAction && selectedAction.targetType !== 'self';

  return (
    <div className={cn('space-y-6', className)}>
      {/* 전투 헤더 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">전투 진행중</h2>
            {isAnimating && <Loading size="sm" />}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedStats(!showDetailedStats)}
            >
              상세 정보
            </Button>
            
            {onToggleAuto && (
              <Button
                variant={autoMode ? 'primary' : 'ghost'}
                size="sm"
                onClick={onToggleAuto}
              >
                자동 전투
              </Button>
            )}
          </div>
        </div>

        {/* 턴 순서 표시 */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">턴 순서:</div>
          <div className="flex gap-2">
            {turnOrder.map((participantId, index) => {
              const participant = allParticipants.find(p => p.id === participantId);
              if (!participant) return null;
              
              return (
                <div
                  key={participantId}
                  className={cn(
                    'px-3 py-1 rounded text-sm font-medium',
                    participantId === currentTurn
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  )}
                >
                  {participant.name}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 왼쪽: 플레이어와 아군 */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-blue-600">아군</h3>
          
          <ParticipantCard
            participant={player}
            isCurrentTurn={currentTurn === player.id}
            isTarget={selectedTarget === player.id}
            onSelect={handleTargetSelect}
            showDetailedStats={showDetailedStats}
            animating={isAnimating && currentTurn === player.id}
          />
          
          {allies.map(ally => (
            <ParticipantCard
              key={ally.id}
              participant={ally}
              isCurrentTurn={currentTurn === ally.id}
              isTarget={selectedTarget === ally.id}
              onSelect={handleTargetSelect}
              showDetailedStats={showDetailedStats}
              animating={isAnimating && currentTurn === ally.id}
            />
          ))}
        </div>

        {/* 중앙: 전투 로그와 액션 */}
        <div className="space-y-4">
          <BattleLog entries={battleLog} />
          
          {/* 액션 버튼들 */}
          {isPlayerTurn && !isAnimating && (
            <Card className="p-4">
              <h4 className="font-medium mb-3">
                {isTargetSelectionMode ? '타겟을 선택하세요' : '행동을 선택하세요'}
              </h4>
              
              {isTargetSelectionMode ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    선택된 액션: {selectedAction?.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAction(null);
                      setSelectedTarget(null);
                    }}
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableActions.map(action => (
                    <ActionButton
                      key={action.id}
                      action={action}
                      onSelect={handleActionSelect}
                      disabled={isAnimating}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}
          
          {!isPlayerTurn && (
            <Card className="p-4 text-center">
              <div className="text-gray-600">
                {isAnimating ? '액션 실행중...' : '상대방 턴'}
              </div>
            </Card>
          )}
        </div>

        {/* 오른쪽: 적군 */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-red-600">적군</h3>
          
          {enemies.map(enemy => (
            <ParticipantCard
              key={enemy.id}
              participant={enemy}
              isCurrentTurn={currentTurn === enemy.id}
              isTarget={selectedTarget === enemy.id}
              onSelect={handleTargetSelect}
              showDetailedStats={showDetailedStats}
              animating={isAnimating && currentTurn === enemy.id}
            />
          ))}
        </div>
      </div>

      {/* 전투 결과 모달 */}
      <BattleResultModal
        result={battleResult ?? null}
        isOpen={resultModalOpen}
        onClose={handleResultModalClose}
      />
    </div>
  );
};

export default BattleInterface;