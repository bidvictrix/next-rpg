'use client';

import React, { useState, useEffect } from 'react';
import { PlayerStatus } from '@/components/game/PlayerStatus';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Player, createDefaultPlayer } from '@/types/player';
import { cn } from '@/lib/utils';

// 캐릭터 외형 옵션
interface AppearanceOptions {
  hair: string[];
  eyes: string[];
  skin: string[];
  avatar: string[];
}

// 캐릭터 통계
interface CharacterStats {
  totalPlaytime: number;
  monstersKilled: number;
  questsCompleted: number;
  itemsFound: number;
  goldEarned: number;
  skillsLearned: number;
  areasExplored: number;
  achievements: number;
}

// 상태 효과 더미 데이터
const dummyStatusEffects = [
  {
    id: 'blessing',
    name: '축복',
    description: '경험치 획득량이 20% 증가합니다.',
    icon: '✨',
    type: 'buff' as const,
    duration: 1800,
    maxDuration: 3600,
    stackable: false,
    effects: { experience: 20 }
  },
  {
    id: 'strength_boost',
    name: '힘 증가',
    description: '힘이 5 증가합니다.',
    icon: '💪',
    type: 'buff' as const,
    duration: 600,
    maxDuration: 900,
    stackable: true,
    stacks: 2,
    effects: { str: 5 }
  }
];

// 더미 플레이어 데이터 생성
const createDetailedPlayer = (): Player => {
  const player = createDefaultPlayer('player1', 'HeroPlayer', 'hero@example.com', '전설의용사');
  
  // 상세한 캐릭터 진행상황
  player.level.level = 42;
  player.level.experience = 15750;
  player.level.experienceToNext = 18000;
  player.level.statPoints = 8;
  player.level.skillPoints = 5;
  
  player.stats = {
    str: 45,
    dex: 38,
    int: 32,
    vit: 52,
    luk: 29,
    hp: 680,
    maxHp: 750,
    mp: 420,
    maxMp: 480,
    atk: 125,
    def: 78,
    acc: 92,
    eva: 45,
    crit: 34
  };
  
  player.gold = 12750;
  player.playtime = 4320; // 72시간
  player.info.class = 'paladin';
  player.pvpRank = 156;
  player.pvpPoints = 2840;
  
  return player;
};

// 외형 옵션
const appearanceOptions: AppearanceOptions = {
  hair: ['검은 머리', '갈색 머리', '금발', '빨간 머리', '은발', '백발'],
  eyes: ['검은 눈', '갈색 눈', '파란 눈', '초록 눈', '회색 눈', '보라 눈'],
  skin: ['밝은 피부', '보통 피부', '어두운 피부', '창백한 피부'],
  avatar: ['🧙‍♂️', '⚔️', '🛡️', '🏹', '🔮', '👑', '🌟', '💎']
};

// 캐릭터 통계 더미 데이터
const characterStats: CharacterStats = {
  totalPlaytime: 4320,
  monstersKilled: 1247,
  questsCompleted: 89,
  itemsFound: 342,
  goldEarned: 45600,
  skillsLearned: 23,
  areasExplored: 15,
  achievements: 12
};

export default function CharacterPage() {
  const [player, setPlayer] = useState<Player>(createDetailedPlayer());
  const [selectedTab, setSelectedTab] = useState<'stats' | 'appearance' | 'records' | 'equipment'>('stats');
  const [tempAppearance, setTempAppearance] = useState({
    hair: '검은 머리',
    eyes: '검은 눈',
    skin: '보통 피부',
    avatar: '⚔️'
  });
  
  const { isOpen: appearanceModalOpen, openModal: openAppearanceModal, closeModal: closeAppearanceModal } = useModal();
  const { isOpen: classChangeModalOpen, openModal: openClassChangeModal, closeModal: closeClassChangeModal } = useModal();

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
    }
  };

  // 클래스 변경 옵션
  const availableClasses = [
    { id: 'warrior', name: '전사', description: '근접 전투의 전문가', icon: '⚔️' },
    { id: 'mage', name: '마법사', description: '마법의 달인', icon: '🔮' },
    { id: 'archer', name: '궁수', description: '원거리 공격의 명수', icon: '🏹' },
    { id: 'thief', name: '도적', description: '은밀함의 대가', icon: '🗡️' },
    { id: 'priest', name: '성직자', description: '치유와 보조의 전문가', icon: '✨' },
    { id: 'paladin', name: '성기사', description: '정의의 수호자', icon: '🛡️' }
  ];

  // 클래스 변경
  const handleClassChange = (newClass: string) => {
    setPlayer(prev => ({
      ...prev,
      info: {
        ...prev.info,
        class: newClass
      }
    }));
    closeClassChangeModal();
  };

  // 외형 변경 적용
  const handleAppearanceChange = () => {
    // 실제로는 player 데이터에 외형 정보를 저장
    console.log('외형 변경:', tempAppearance);
    closeAppearanceModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">캐릭터 관리</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openAppearanceModal}>
              외형 변경
            </Button>
            <Button variant="primary" onClick={openClassChangeModal}>
              클래스 변경
            </Button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <Card className="p-4">
          <div className="flex gap-2">
            {[
              { key: 'stats', label: '스탯 관리', icon: '📊' },
              { key: 'appearance', label: '외형', icon: '👤' },
              { key: 'records', label: '기록', icon: '📜' },
              { key: 'equipment', label: '장비', icon: '⚔️' }
            ].map(tab => (
              <Button
                key={tab.key}
                variant={selectedTab === tab.key ? 'primary' : 'ghost'}
                onClick={() => setSelectedTab(tab.key as any)}
                className="flex items-center gap-2"
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽: 플레이어 상태 */}
          <div className="lg:col-span-1">
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
                title: '전설의 용사',
                guild: '엘리트 길드',
                location: '왕도'
              }}
              stats={player.stats}
              statusEffects={dummyStatusEffects}
              gold={player.gold}
              onStatIncrease={handleStatIncrease}
              compact={false}
              showDetailedStats={true}
            />
          </div>

          {/* 오른쪽: 탭 컨텐츠 */}
          <div className="lg:col-span-2">
            {selectedTab === 'stats' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">스탯 관리</h2>
                
                {/* 레벨 정보 */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">레벨 & 경험치</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>현재 레벨</span>
                      <span className="font-bold text-lg">{player.level.level}</span>
                    </div>
                    <Progress
                      value={player.level.experience}
                      max={player.level.experienceToNext}
                      variant="exp"
                      showValue
                      format={(current, max) => `${current.toLocaleString()} / ${max.toLocaleString()}`}
                    />
                    <div className="text-sm text-gray-600">
                      다음 레벨까지: {(player.level.experienceToNext - player.level.experience).toLocaleString()} EXP
                    </div>
                  </div>
                </div>

                {/* 스탯 배분 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">스탯 배분</h3>
                    <span className="text-blue-600 font-bold">
                      사용 가능한 포인트: {player.level.statPoints}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'str', name: 'STR (힘)', description: '물리 공격력 증가' },
                      { key: 'dex', name: 'DEX (민첩)', description: '명중률, 회피율, 치명타율 증가' },
                      { key: 'int', name: 'INT (지능)', description: '마법 공격력, MP 증가' },
                      { key: 'vit', name: 'VIT (체력)', description: 'HP, 방어력 증가' },
                      { key: 'luk', name: 'LUK (운)', description: '모든 능력치 소폭 증가' }
                    ].map(stat => (
                      <div key={stat.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{stat.name}</div>
                          <div className="text-sm text-gray-600">{stat.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg w-12 text-center">
                            {player.stats[stat.key as keyof typeof player.stats]}
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatIncrease(stat.key as any)}
                            disabled={player.level.statPoints === 0}
                          >
                            +1
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 파생 스탯 */}
                <div>
                  <h3 className="font-medium mb-3">파생 스탯</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'ATK', value: player.stats.atk, icon: '⚔️' },
                      { name: 'DEF', value: player.stats.def, icon: '🛡️' },
                      { name: 'ACC', value: player.stats.acc, icon: '🎯' },
                      { name: 'EVA', value: player.stats.eva, icon: '💨' },
                      { name: 'CRIT', value: player.stats.crit, icon: '💥' }
                    ].map(stat => (
                      <div key={stat.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span>{stat.icon}</span>
                          <span className="font-medium">{stat.name}</span>
                        </div>
                        <span className="font-bold">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {selectedTab === 'appearance' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">캐릭터 외형</h2>
                
                <div className="text-center mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-6xl mx-auto mb-4">
                    ⚔️
                  </div>
                  <h3 className="text-xl font-bold">{player.info.characterName}</h3>
                  <p className="text-gray-600">{player.info.class} • Lv.{player.level.level}</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">기본 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>클래스:</span>
                          <span className="font-medium">{player.info.class}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>레벨:</span>
                          <span className="font-medium">{player.level.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PvP 랭킹:</span>
                          <span className="font-medium">{player.pvpRank}위</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PvP 포인트:</span>
                          <span className="font-medium">{player.pvpPoints}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">플레이 정보</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>플레이 시간:</span>
                          <span className="font-medium">{Math.floor(player.playtime / 60)}시간</span>
                        </div>
                        <div className="flex justify-between">
                          <span>생성일:</span>
                          <span className="font-medium">
                            {new Date(player.info.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>마지막 접속:</span>
                          <span className="font-medium">
                            {new Date(player.info.lastLoginAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="primary" onClick={openAppearanceModal} className="w-full">
                    외형 변경하기
                  </Button>
                </div>
              </Card>
            )}

            {selectedTab === 'records' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">캐릭터 기록</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: '플레이 시간', value: `${Math.floor(characterStats.totalPlaytime / 60)}시간`, icon: '⏰' },
                    { name: '처치한 몬스터', value: characterStats.monstersKilled.toLocaleString(), icon: '⚔️' },
                    { name: '완료한 퀘스트', value: characterStats.questsCompleted, icon: '📜' },
                    { name: '발견한 아이템', value: characterStats.itemsFound.toLocaleString(), icon: '📦' },
                    { name: '획득한 골드', value: `${characterStats.goldEarned.toLocaleString()}G`, icon: '💰' },
                    { name: '배운 스킬', value: characterStats.skillsLearned, icon: '🔮' },
                    { name: '탐험한 지역', value: characterStats.areasExplored, icon: '🗺️' },
                    { name: '업적 달성', value: characterStats.achievements, icon: '🏆' }
                  ].map(record => (
                    <div key={record.name} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{record.icon}</div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{record.value}</div>
                          <div className="text-sm text-gray-600">{record.name}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 최근 활동 */}
                <div className="mt-6">
                  <h3 className="font-medium mb-3">최근 활동</h3>
                  <div className="space-y-2">
                    {[
                      { time: '5분 전', activity: '레드 고블린을 처치했습니다.', type: 'combat' },
                      { time: '12분 전', activity: '마법의 물약을 발견했습니다.', type: 'item' },
                      { time: '25분 전', activity: '[일일] 몬스터 사냥 퀘스트를 완료했습니다.', type: 'quest' },
                      { time: '1시간 전', activity: '새로운 지역 "어둠의 숲"을 발견했습니다.', type: 'exploration' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <span className="text-xs text-gray-500 w-16">{activity.time}</span>
                        <span className="text-sm">{activity.activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {selectedTab === 'equipment' && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">장비 관리</h2>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* 장비 슬롯들 */}
                  {[
                    { slot: 'weapon', name: '무기', icon: '⚔️', equipped: '전설의 검' },
                    { slot: 'helmet', name: '투구', icon: '🪖', equipped: null },
                    { slot: 'armor', name: '갑옷', icon: '🛡️', equipped: '미스릴 갑옷' },
                    { slot: 'gloves', name: '장갑', icon: '🧤', equipped: null },
                    { slot: 'boots', name: '신발', icon: '👢', equipped: '바람의 부츠' },
                    { slot: 'ring1', name: '반지1', icon: '💍', equipped: '힘의 반지' },
                    { slot: 'ring2', name: '반지2', icon: '💍', equipped: null },
                    { slot: 'accessory', name: '목걸이', icon: '📿', equipped: null }
                  ].map(item => (
                    <div
                      key={item.slot}
                      className={cn(
                        'p-4 border-2 rounded-lg text-center cursor-pointer transition-all',
                        item.equipped 
                          ? 'border-blue-400 bg-blue-50 hover:bg-blue-100' 
                          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div className="font-medium text-sm">{item.name}</div>
                      {item.equipped ? (
                        <div className="text-xs text-blue-600 mt-1">{item.equipped}</div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1">비어있음</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 장비 효과 요약 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">장비 효과 요약</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg text-red-600">+45</div>
                      <div className="text-gray-600">공격력</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-blue-600">+28</div>
                      <div className="text-gray-600">방어력</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-green-600">+15</div>
                      <div className="text-gray-600">이동속도</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* 외형 변경 모달 */}
        <Modal
          isOpen={appearanceModalOpen}
          onClose={closeAppearanceModal}
          title="외형 변경"
          size="md"
        >
          <div className="space-y-4">
            {Object.entries(appearanceOptions).map(([category, options]) => (
              <div key={category}>
                <label className="block text-sm font-medium mb-2 capitalize">{category}</label>
                <select
                  value={tempAppearance[category as keyof typeof tempAppearance]}
                  onChange={(e) => setTempAppearance(prev => ({
                    ...prev,
                    [category]: e.target.value
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
            
            <div className="flex gap-2 pt-4">
              <Button variant="primary" onClick={handleAppearanceChange} className="flex-1">
                적용
              </Button>
              <Button variant="ghost" onClick={closeAppearanceModal}>
                취소
              </Button>
            </div>
          </div>
        </Modal>

        {/* 클래스 변경 모달 */}
        <Modal
          isOpen={classChangeModalOpen}
          onClose={closeClassChangeModal}
          title="클래스 변경"
          size="lg"
        >
          <div className="grid grid-cols-2 gap-3">
            {availableClasses.map(cls => (
              <div
                key={cls.id}
                className={cn(
                  'p-4 border-2 rounded-lg cursor-pointer transition-all',
                  player.info.class === cls.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                )}
                onClick={() => handleClassChange(cls.id)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{cls.icon}</div>
                  <div className="font-bold">{cls.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{cls.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-sm text-yellow-800">
              ⚠️ 클래스 변경 시 일부 스킬이 초기화될 수 있습니다.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
