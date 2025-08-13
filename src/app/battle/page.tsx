'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BattleInterface } from '@/components/game/BattleInterface';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// 전투 참가자 인터페이스 (BattleInterface 컴포넌트용)
interface BattleParticipant {
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

interface BattleStatusEffect {
  id: string;
  name: string;
  icon: string;
  type: 'buff' | 'debuff';
  duration: number;
  effects: Record<string, number>;
}

interface BattleAction {
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

interface BattleLogEntry {
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

interface BattleResult {
  victory: boolean;
  experience: number;
  gold: number;
  items: Array<{ id: string; name: string; quantity: number }>;
  levelUp?: boolean;
  newLevel?: number;
}

// 전투 상태
type BattleState = 'preparing' | 'fighting' | 'result' | 'ended';

// 더미 플레이어 생성
const createPlayer = (): BattleParticipant => ({
  id: 'player',
  name: '용사',
  level: 15,
  hp: 380,
  maxHp: 400,
  mp: 180,
  maxMp: 200,
  atk: 85,
  def: 45,
  acc: 75,
  eva: 35,
  crit: 22,
  speed: 60,
  avatar: '⚔️',
  statusEffects: [],
  isPlayer: true
});

// 더미 몬스터 생성
const createMonsters = (): BattleParticipant[] => [
  {
    id: 'goblin1',
    name: '고블린 전사',
    level: 12,
    hp: 180,
    maxHp: 180,
    mp: 30,
    maxMp: 30,
    atk: 45,
    def: 25,
    acc: 60,
    eva: 40,
    crit: 10,
    speed: 55,
    statusEffects: [],
    isPlayer: false
  },
  {
    id: 'goblin2',
    name: '고블린 궁수',
    level: 10,
    hp: 120,
    maxHp: 120,
    mp: 50,
    maxMp: 50,
    atk: 55,
    def: 20,
    acc: 80,
    eva: 50,
    crit: 15,
    speed: 70,
    statusEffects: [],
    isPlayer: false
  }
];

// 사용 가능한 액션들
const createBattleActions = (player: BattleParticipant): BattleAction[] => [
  {
    id: 'basic_attack',
    type: 'attack',
    name: '공격',
    description: '기본 공격을 합니다.',
    icon: '⚔️',
    targetType: 'enemy',
    available: true
  },
  {
    id: 'power_strike',
    type: 'skill',
    name: '강타',
    description: '강력한 일격을 가합니다.',
    icon: '💥',
    cooldown: 3,
    manaCost: 15,
    skillId: 'power_strike',
    targetType: 'enemy',
    available: player.mp >= 15
  },
  {
    id: 'heal',
    type: 'skill',
    name: '치료',
    description: 'HP를 회복합니다.',
    icon: '✨',
    cooldown: 2,
    manaCost: 20,
    skillId: 'heal',
    targetType: 'self',
    available: player.mp >= 20 && player.hp < player.maxHp
  },
  {
    id: 'health_potion',
    type: 'item',
    name: '체력 물약',
    description: 'HP를 50 회복합니다.',
    icon: '🧪',
    itemId: 'health_potion',
    targetType: 'self',
    available: true
  },
  {
    id: 'defend',
    type: 'defend',
    name: '방어',
    description: '방어 태세를 취해 받는 피해를 반감시킵니다.',
    icon: '🛡️',
    targetType: 'self',
    available: true
  },
  {
    id: 'flee',
    type: 'flee',
    name: '도망',
    description: '전투에서 도망칩니다.',
    icon: '🏃',
    targetType: 'self',
    available: true
  }
];

export default function BattlePage() {
  const [battleState, setBattleState] = useState<BattleState>('preparing');
  const [player, setPlayer] = useState<BattleParticipant>(createPlayer());
  const [enemies, setEnemies] = useState<BattleParticipant[]>(createMonsters());
  const [allies, setAllies] = useState<BattleParticipant[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>('player');
  const [turnOrder, setTurnOrder] = useState<string[]>(['player', 'goblin1', 'goblin2']);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [availableActions, setAvailableActions] = useState<BattleAction[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResult | undefined>();
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [turnCounter, setTurnCounter] = useState(0);
  
  const { isOpen: setupModalOpen, openModal: openSetupModal, closeModal: closeSetupModal } = useModal();

  // 전투 로그 추가
  const addBattleLog = useCallback((
    type: BattleLogEntry['type'],
    actor: string,
    message: string,
    target?: string,
    value?: number,
    critical?: boolean,
    missed?: boolean
  ) => {
    const entry: BattleLogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type,
      actor,
      target,
      message,
      value,
      critical,
      missed
    };
    
    setBattleLog(prev => [...prev.slice(-49), entry]);
  }, []);

  // 데미지 계산
  const calculateDamage = useCallback((attacker: BattleParticipant, target: BattleParticipant, skill?: string): {
    damage: number;
    critical: boolean;
    missed: boolean;
  } => {
    // 명중 판정
    const hitChance = attacker.acc - target.eva + 50; // 기본 50% + 명중률 - 회피율
    const missed = Math.random() * 100 > hitChance;
    
    if (missed) {
      return { damage: 0, critical: false, missed: true };
    }

    // 기본 데미지 계산
    let baseDamage = attacker.atk - target.def;
    baseDamage = Math.max(1, baseDamage); // 최소 1 데미지

    // 스킬 보정
    if (skill === 'power_strike') {
      baseDamage *= 2.0; // 강타는 2배 데미지
    }

    // 크리티컬 판정
    const critical = Math.random() * 100 < attacker.crit;
    if (critical) {
      baseDamage *= 1.5;
    }

    // 랜덤 요소 (90-110%)
    const randomMultiplier = 0.9 + Math.random() * 0.2;
    const finalDamage = Math.floor(baseDamage * randomMultiplier);

    return { damage: finalDamage, critical, missed: false };
  }, []);

  // 액션 실행
  const executeAction = useCallback((action: BattleAction, targetId?: string) => {
    setIsAnimating(true);
    
    setTimeout(() => {
      const actor = currentTurn === 'player' ? player : enemies.find(e => e.id === currentTurn);
      if (!actor) return;

      let target: BattleParticipant | undefined;
      
      // 타겟 결정
      if (action.targetType === 'self') {
        target = actor;
      } else if (action.targetType === 'enemy') {
        if (actor.isPlayer) {
          target = enemies.find(e => e.id === targetId) || enemies[0];
        } else {
          target = player;
        }
      }

      if (!target) return;

      // 액션에 따른 처리
      switch (action.type) {
        case 'attack':
        case 'skill': {
          const { damage, critical, missed } = calculateDamage(actor, target, action.skillId);
          
          if (missed) {
            addBattleLog('action', actor.name, `${target.name}에게 공격했지만 빗나갔습니다!`, target.name, 0, false, true);
          } else {
            // HP 감소
            if (target.isPlayer) {
              setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - damage) }));
            } else {
              setEnemies(prev => prev.map(e => 
                e.id === target!.id ? { ...e, hp: Math.max(0, e.hp - damage) } : e
              ));
            }
            
            addBattleLog('damage', actor.name, 
              `${target.name}에게 ${damage} 데미지를 입혔습니다!`, 
              target.name, damage, critical, false
            );
          }

          // MP 소모
          if (action.manaCost && actor.isPlayer) {
            setPlayer(prev => ({ ...prev, mp: Math.max(0, prev.mp - (action.manaCost || 0)) }));
          }
          break;
        }
        
        case 'item': {
          if (action.itemId === 'health_potion') {
            const healAmount = 50;
            if (actor.isPlayer) {
              setPlayer(prev => ({ 
                ...prev, 
                hp: Math.min(prev.maxHp, prev.hp + healAmount) 
              }));
            }
            addBattleLog('heal', actor.name, `체력 물약을 사용하여 ${healAmount} HP를 회복했습니다!`);
          }
          break;
        }
        
        case 'defend': {
          addBattleLog('action', actor.name, '방어 태세를 취했습니다.');
          // 방어 효과는 다음 턴까지 지속
          break;
        }
        
        case 'flee': {
          addBattleLog('system', actor.name, '전투에서 도망쳤습니다!');
          setBattleState('ended');
          return;
        }
      }

      setIsAnimating(false);
      
      // 다음 턴으로
      setTimeout(() => {
        nextTurn();
      }, 1000);
    }, 1500);
  }, [currentTurn, player, enemies, addBattleLog, calculateDamage]);

  // 다음 턴
  const nextTurn = useCallback(() => {
    setTurnCounter(prev => prev + 1);
    
    const currentIndex = turnOrder.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextTurnId = turnOrder[nextIndex];
    
    setCurrentTurn(nextTurnId);
    setIsPlayerTurn(nextTurnId === 'player');
    
    // 액션 업데이트
    if (nextTurnId === 'player') {
      setAvailableActions(createBattleActions(player));
    }
  }, [currentTurn, turnOrder, player]);

  // AI 턴 처리
  useEffect(() => {
    if (!isPlayerTurn && battleState === 'fighting' && !isAnimating) {
      const aiDelay = setTimeout(() => {
        const aiEnemy = enemies.find(e => e.id === currentTurn);
        if (aiEnemy && aiEnemy.hp > 0) {
          // 간단한 AI: 50% 확률로 공격, 50% 확률로 스킬 사용
          const aiAction: BattleAction = Math.random() > 0.5 
            ? {
                id: 'ai_attack',
                type: 'attack',
                name: '공격',
                description: '기본 공격',
                targetType: 'enemy',
                available: true
              }
            : {
                id: 'ai_skill',
                type: 'skill',
                name: '강타',
                description: '강력한 공격',
                targetType: 'enemy',
                available: true
              };
          
          executeAction(aiAction, 'player');
        } else {
          nextTurn();
        }
      }, 2000);
      
      return () => clearTimeout(aiDelay);
    }
  }, [isPlayerTurn, battleState, isAnimating, currentTurn, enemies, executeAction, nextTurn]);

  // 전투 종료 조건 체크
  useEffect(() => {
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    const playerAlive = player.hp > 0;
    
    if (!playerAlive) {
      // 플레이어 패배
      setBattleResult({
        victory: false,
        experience: 0,
        gold: 0,
        items: []
      });
      setBattleState('result');
      addBattleLog('system', '', '패배했습니다...');
    } else if (aliveEnemies.length === 0) {
      // 플레이어 승리
      const expGained = enemies.reduce((total, enemy) => total + enemy.level * 15, 0);
      const goldGained = enemies.reduce((total, enemy) => total + enemy.level * 10 + Math.floor(Math.random() * 20), 0);
      
      setBattleResult({
        victory: true,
        experience: expGained,
        gold: goldGained,
        items: [
          { id: 'health_potion', name: '체력 물약', quantity: 2 },
          { id: 'copper_coin', name: '구리 동전', quantity: 5 }
        ]
      });
      setBattleState('result');
      addBattleLog('system', '', '승리했습니다!');
    }
  }, [player.hp, enemies, addBattleLog]);

  // 전투 시작
  const startBattle = useCallback(() => {
    setBattleState('fighting');
    setAvailableActions(createBattleActions(player));
    addBattleLog('system', '', '전투가 시작되었습니다!');
    closeSetupModal();
  }, [player, addBattleLog, closeSetupModal]);

  // 전투 종료
  const endBattle = useCallback(() => {
    setBattleState('ended');
  }, []);

  // 새 전투 시작
  const newBattle = useCallback(() => {
    setPlayer(createPlayer());
    setEnemies(createMonsters());
    setBattleLog([]);
    setBattleResult(undefined);
    setCurrentTurn('player');
    setIsPlayerTurn(true);
    setIsAnimating(false);
    setTurnCounter(0);
    setBattleState('preparing');
    openSetupModal();
  }, [openSetupModal]);

  // 자동 전투 토글
  const toggleAutoMode = useCallback(() => {
    setAutoMode(prev => !prev);
  }, []);

  // 초기 설정
  useEffect(() => {
    openSetupModal();
  }, [openSetupModal]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">전투</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={newBattle}>
              새 전투
            </Button>
            {battleState === 'fighting' && (
              <Button variant="warning" onClick={endBattle}>
                전투 포기
              </Button>
            )}
          </div>
        </div>

        {/* 전투 상태 표시 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                battleState === 'preparing' && 'bg-yellow-100 text-yellow-800',
                battleState === 'fighting' && 'bg-blue-100 text-blue-800',
                battleState === 'result' && 'bg-green-100 text-green-800',
                battleState === 'ended' && 'bg-gray-100 text-gray-800'
              )}>
                {battleState === 'preparing' && '준비 중'}
                {battleState === 'fighting' && '전투 중'}
                {battleState === 'result' && '결과'}
                {battleState === 'ended' && '종료'}
              </div>
              
              {battleState === 'fighting' && (
                <div className="text-sm text-gray-600">
                  턴 {Math.floor(turnCounter / turnOrder.length) + 1}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                적 {enemies.filter(e => e.hp > 0).length}/{enemies.length}
              </div>
            </div>
          </div>
        </Card>

        {/* 전투 인터페이스 */}
        {battleState === 'fighting' && (
          <BattleInterface
            player={player}
            enemies={enemies}
            allies={allies}
            availableActions={availableActions}
            battleLog={battleLog}
            currentTurn={currentTurn}
            turnOrder={turnOrder}
            battleResult={battleResult}
            isPlayerTurn={isPlayerTurn}
            isAnimating={isAnimating}
            onActionSelect={executeAction}
            onBattleEnd={endBattle}
            autoMode={autoMode}
            onToggleAuto={toggleAutoMode}
          />
        )}

        {/* 전투 준비 중 화면 */}
        {battleState === 'preparing' && (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">⚔️</div>
            <h2 className="text-2xl font-bold mb-4">전투 준비</h2>
            <p className="text-gray-600 mb-6">
              전투를 시작하려면 아래 버튼을 클릭하세요.
            </p>
            <Button variant="primary" size="lg" onClick={startBattle}>
              전투 시작
            </Button>
          </Card>
        )}

        {/* 전투 종료 화면 */}
        {battleState === 'ended' && (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">🏃</div>
            <h2 className="text-2xl font-bold mb-4">전투 종료</h2>
            <p className="text-gray-600 mb-6">
              전투에서 벗어났습니다.
            </p>
            <Button variant="primary" size="lg" onClick={newBattle}>
              새 전투 시작
            </Button>
          </Card>
        )}

        {/* 전투 설정 모달 */}
        <Modal
          isOpen={setupModalOpen}
          onClose={closeSetupModal}
          title="전투 설정"
          size="md"
        >
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold mb-2">고블린 무리와의 전투</h3>
              <p className="text-gray-600">
                2마리의 고블린이 당신을 가로막고 있습니다!
              </p>
            </div>

            {/* 적 정보 */}
            <div>
              <h4 className="font-medium mb-3">적 정보</h4>
              <div className="space-y-2">
                {createMonsters().map(enemy => (
                  <div key={enemy.id} className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div>
                      <div className="font-medium">{enemy.name}</div>
                      <div className="text-sm text-gray-600">Lv.{enemy.level}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">HP: {enemy.hp}</div>
                      <div className="text-sm">ATK: {enemy.atk}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 플레이어 정보 */}
            <div>
              <h4 className="font-medium mb-3">당신의 상태</h4>
              <div className="p-3 bg-blue-50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm">Lv.{player.level}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>HP: {player.hp}/{player.maxHp}</div>
                  <div>MP: {player.mp}/{player.maxMp}</div>
                  <div>ATK: {player.atk}</div>
                  <div>DEF: {player.def}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={startBattle} className="flex-1">
                전투 시작
              </Button>
              <Button variant="ghost" onClick={() => setBattleState('ended')}>
                도망가기
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
