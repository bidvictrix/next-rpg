'use client';

import React, { useState, useEffect } from 'react';
import { PlayerStatus, PlayerMiniStatus } from '@/components/game/PlayerStatus';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, useModal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { Player, createDefaultPlayer } from '@/types/player';
import { cn } from '@/lib/utils';

// 게임 액션 타입
interface GameAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
  cooldown?: number;
}

// 게임 상태
interface GameState {
  currentArea: string;
  currentAreaName: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: 'clear' | 'cloudy' | 'rainy' | 'stormy';
  onlinePlayerCount: number;
  serverStatus: 'online' | 'maintenance' | 'busy';
}

// 게임 로그 엔트리
interface GameLogEntry {
  id: string;
  timestamp: Date;
  type: 'system' | 'action' | 'combat' | 'quest' | 'chat';
  message: string;
  color?: string;
}

// 더미 플레이어 데이터 생성
const createDummyPlayer = (): Player => {
  const player = createDefaultPlayer('player1', 'TestUser', 'test@example.com', '테스트용사');
  
  // 게임 진행상황 시뮬레이션
  player.level.level = 15;
  player.level.experience = 750;
  player.level.experienceToNext = 1200;
  player.level.statPoints = 3;
  player.level.skillPoints = 2;
  
  player.stats = {
    str: 25,
    dex: 20,
    int: 15,
    vit: 30,
    luk: 18,
    hp: 380,
    maxHp: 400,
    mp: 180,
    maxMp: 200,
    atk: 85,
    def: 45,
    acc: 75,
    eva: 35,
    crit: 22
  };
  
  player.gold = 2550;
  player.playtime = 1200; // 20시간
  
  return player;
};

// 초기 게임 상태
const initialGameState: GameState = {
  currentArea: 'starter_village',
  currentAreaName: '초보자 마을',
  timeOfDay: 'afternoon',
  weather: 'clear',
  onlinePlayerCount: 1337,
  serverStatus: 'online'
};

export default function GamePage() {
  const [player, setPlayer] = useState<Player>(createDummyPlayer());
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  
  const { isOpen: menuOpen, openModal: openMenu, closeModal: closeMenu } = useModal();

  // 게임 로그에 메시지 추가
  const addLogEntry = (type: GameLogEntry['type'], message: string, color?: string) => {
    const entry: GameLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      color
    };
    
    setGameLog(prev => [...prev.slice(-49), entry]); // 최대 50개 유지
  };

  // 스탯 포인트 할당
  const handleStatIncrease = (stat: keyof Pick<typeof player.stats, 'str' | 'dex' | 'int' | 'vit' | 'luk'>) => {
    if (player.level.statPoints > 0) {
      setPlayer(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: prev.stats[stat] + 1
        },
        level: {
          ...prev.level,
          statPoints: prev.level.statPoints - 1
        }
      }));
      
      addLogEntry('action', `${stat.toUpperCase()} 스탯이 1 증가했습니다.`, 'text-green-600');
    }
  };

  // 게임 액션 정의
  const gameActions: GameAction[] = [
    {
      id: 'hunt',
      name: '사냥하기',
      description: '몬스터를 사냥하여 경험치와 골드를 획득합니다.',
      icon: '⚔️',
      action: () => {
        setLoading(true);
        setTimeout(() => {
          const expGain = Math.floor(Math.random() * 50) + 20;
          const goldGain = Math.floor(Math.random() * 30) + 10;
          
          setPlayer(prev => ({
            ...prev,
            level: {
              ...prev.level,
              experience: prev.level.experience + expGain
            },
            gold: prev.gold + goldGain
          }));
          
          addLogEntry('combat', `몬스터를 처치하여 경험치 ${expGain}, 골드 ${goldGain}을 획득했습니다.`, 'text-blue-600');
          setLoading(false);
        }, 2000);
      }
    },
    {
      id: 'explore',
      name: '탐험하기',
      description: '새로운 지역을 탐험합니다.',
      icon: '🗺️',
      action: () => {
        const areas = ['어두운 숲', '고대 유적', '신비한 동굴', '몬스터 소굴', '잃어버린 사원'];
        const randomArea = areas[Math.floor(Math.random() * areas.length)];
        addLogEntry('action', `${randomArea}을 발견했습니다.`, 'text-purple-600');
      }
    },
    {
      id: 'training',
      name: '수련하기',
      description: '스킬 포인트를 획득합니다.',
      icon: '🥋',
      action: () => {
        if (Math.random() > 0.5) {
          setPlayer(prev => ({
            ...prev,
            level: {
              ...prev.level,
              skillPoints: prev.level.skillPoints + 1
            }
          }));
          addLogEntry('action', '수련을 통해 스킬 포인트 1을 획득했습니다.', 'text-green-600');
        } else {
          addLogEntry('action', '수련을 했지만 별다른 성과가 없었습니다.', 'text-gray-600');
        }
      }
    },
    {
      id: 'rest',
      name: '휴식하기',
      description: 'HP와 MP를 회복합니다.',
      icon: '😴',
      action: () => {
        setPlayer(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            hp: prev.stats.maxHp || prev.stats.hp,
            mp: prev.stats.maxMp || prev.stats.mp
          }
        }));
        addLogEntry('action', 'HP와 MP가 완전히 회복되었습니다.', 'text-green-600');
      }
    }
  ];

  // 시간과 날씨 변화 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const timeOptions: GameState['timeOfDay'][] = ['morning', 'afternoon', 'evening', 'night'];
        const weatherOptions: GameState['weather'][] = ['clear', 'cloudy', 'rainy', 'stormy'];
        
        const newTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
        const newWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
        
        return {
          ...prev,
          timeOfDay: newTime,
          weather: newWeather,
          onlinePlayerCount: prev.onlinePlayerCount + Math.floor(Math.random() * 10) - 5
        };
      });
    }, 30000); // 30초마다 변화

    return () => clearInterval(interval);
  }, []);

  // 초기 게임 로그
  useEffect(() => {
    addLogEntry('system', '게임에 접속했습니다. 모험을 시작하세요!', 'text-blue-600');
  }, []);

  const timeEmoji = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌆',
    night: '🌙'
  };

  const weatherEmoji = {
    clear: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 미니 상태바 */}
        <PlayerMiniStatus
          player={{
            characterName: player.info.characterName,
            level: player.level.level,
            class: player.info.class
          }}
          stats={{
            hp: player.stats.hp!,
            maxHp: player.stats.maxHp!,
            mp: player.stats.mp!,
            maxMp: player.stats.maxMp!
          }}
          gold={player.gold}
          className="sticky top-4 z-10"
        />

        {/* 메인 게임 영역 */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* 왼쪽: 플레이어 상태 */}
          <div className="lg:col-span-1 space-y-4">
            <PlayerStatus
              player={{
                id: player.info.id,
                username: player.info.username,
                characterName: player.info.characterName,
                class: player.info.class,
                level: player.level.level,
                experience: player.level.experience,
                experienceToNext: player.level.experienceToNext,
                onlineStatus: 'online',
                location: player.location.mapName
              }}
              stats={player.stats}
              statusEffects={[]}
              gold={player.gold}
              onStatIncrease={handleStatIncrease}
              compact={false}
              showDetailedStats={true}
            />

            {/* 게임 정보 카드 */}
            <Card className="p-4">
              <h3 className="font-bold mb-3">게임 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>현재 위치:</span>
                  <span className="font-medium">{gameState.currentAreaName}</span>
                </div>
                <div className="flex justify-between">
                  <span>시간:</span>
                  <span className="font-medium">
                    {timeEmoji[gameState.timeOfDay]} {gameState.timeOfDay}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>날씨:</span>
                  <span className="font-medium">
                    {weatherEmoji[gameState.weather]} {gameState.weather}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>접속자:</span>
                  <span className="font-medium">{gameState.onlinePlayerCount.toLocaleString()}명</span>
                </div>
                <div className="flex justify-between">
                  <span>서버:</span>
                  <span className={cn(
                    'font-medium',
                    gameState.serverStatus === 'online' && 'text-green-600',
                    gameState.serverStatus === 'busy' && 'text-yellow-600',
                    gameState.serverStatus === 'maintenance' && 'text-red-600'
                  )}>
                    {gameState.serverStatus}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* 중앙: 게임 액션 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 게임 액션 카드 */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">무엇을 하시겠습니까?</h2>
              <div className="grid grid-cols-2 gap-4">
                {gameActions.map(action => (
                  <Button
                    key={action.id}
                    variant="game"
                    size="lg"
                    onClick={action.action}
                    disabled={loading || action.disabled}
                    className="h-20 flex-col gap-2"
                  >
                    <div className="text-2xl">{action.icon}</div>
                    <div className="font-medium">{action.name}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </Button>
                ))}
              </div>
              
              {loading && (
                <div className="mt-4 text-center">
                  <Loading text="액션 실행 중..." size="sm" />
                </div>
              )}
            </Card>

            {/* 네비게이션 */}
            <Card className="p-4">
              <h3 className="font-bold mb-3">빠른 이동</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="ghost" size="sm" className="flex-col gap-1">
                  <span>👤</span>
                  <span className="text-xs">캐릭터</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-col gap-1">
                  <span>🔮</span>
                  <span className="text-xs">스킬</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-col gap-1">
                  <span>🎒</span>
                  <span className="text-xs">인벤토리</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-col gap-1">
                  <span>⚔️</span>
                  <span className="text-xs">전투</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex-col gap-1">
                  <span>📜</span>
                  <span className="text-xs">퀘스트</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={openMenu} className="flex-col gap-1">
                  <span>⚙️</span>
                  <span className="text-xs">설정</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* 오른쪽: 게임 로그 */}
          <div className="lg:col-span-1">
            <Card className="p-4 h-96">
              <h3 className="font-bold mb-3">게임 로그</h3>
              <div className="h-72 overflow-y-auto space-y-1 text-sm">
                {gameLog.map(entry => (
                  <div
                    key={entry.id}
                    className={cn('leading-relaxed', entry.color || 'text-gray-700')}
                  >
                    <span className="text-gray-500 text-xs mr-2">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    {entry.message}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 게임 메뉴 모달 */}
        <Modal
          isOpen={menuOpen}
          onClose={closeMenu}
          title="게임 메뉴"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" size="lg" className="flex-col gap-2 h-20">
                <span className="text-2xl">💾</span>
                <span>저장하기</span>
              </Button>
              <Button variant="secondary" size="lg" className="flex-col gap-2 h-20">
                <span className="text-2xl">⚙️</span>
                <span>설정</span>
              </Button>
              <Button variant="warning" size="lg" className="flex-col gap-2 h-20">
                <span className="text-2xl">🚪</span>
                <span>마을로</span>
              </Button>
              <Button variant="danger" size="lg" className="flex-col gap-2 h-20">
                <span className="text-2xl">📴</span>
                <span>게임 종료</span>
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-600 mt-4">
              <div>플레이 시간: {Math.floor(player.playtime / 60)}시간 {player.playtime % 60}분</div>
              <div>접속일: {new Date(player.info.lastLoginAt).toLocaleDateString()}</div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
