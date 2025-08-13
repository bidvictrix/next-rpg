'use client';

import React, { useState, useEffect } from 'react';
import { SkillTree } from '@/components/game/SkillTree';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Loading } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';

// 스킬 인터페이스 (SkillTree 컴포넌트용)
interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  type: 'active' | 'passive' | 'toggle';
  category: string;
  maxLevel: number;
  currentLevel: number;
  baseExperience: number;
  experienceMultiplier: number;
  currentExperience: number;
  experienceToNext: number;
  requirements: SkillRequirement[];
  effects: SkillEffect[];
  cooldown?: number;
  manaCost?: number;
  position: { x: number; y: number };
  unlocked: boolean;
  canLevelUp: boolean;
}

interface SkillRequirement {
  type: 'skill' | 'level' | 'stat' | 'item' | 'quest';
  target: string;
  value: number;
  description: string;
}

interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  target: 'self' | 'enemy' | 'ally' | 'all';
  stat?: string;
  value: number;
  duration?: number;
  description: string;
}

// 플레이어 스킬 정보
interface PlayerSkillData {
  skillPoints: number;
  level: number;
  stats: Record<string, number>;
}

// 더미 스킬 데이터 생성
const createDummySkills = (): Skill[] => {
  return [
    {
      id: 'basic_attack',
      name: '기본 공격',
      description: '기본적인 물리 공격을 가합니다.',
      icon: '⚔️',
      type: 'active',
      category: 'combat',
      maxLevel: 10,
      currentLevel: 5,
      baseExperience: 100,
      experienceMultiplier: 1.5,
      currentExperience: 250,
      experienceToNext: 400,
      requirements: [],
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          value: 120,
          description: '적에게 120% 공격력의 물리 데미지를 가합니다.'
        }
      ],
      cooldown: 0,
      manaCost: 0,
      position: { x: 100, y: 100 },
      unlocked: true,
      canLevelUp: true
    },
    {
      id: 'power_strike',
      name: '강타',
      description: '강력한 일격을 가합니다.',
      icon: '💥',
      type: 'active',
      category: 'combat',
      maxLevel: 10,
      currentLevel: 3,
      baseExperience: 150,
      experienceMultiplier: 1.8,
      currentExperience: 180,
      experienceToNext: 300,
      requirements: [
        {
          type: 'skill',
          target: 'basic_attack',
          value: 3,
          description: '기본 공격 레벨 3 이상'
        }
      ],
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          value: 200,
          description: '적에게 200% 공격력의 물리 데미지를 가합니다.'
        }
      ],
      cooldown: 5,
      manaCost: 15,
      position: { x: 200, y: 100 },
      unlocked: true,
      canLevelUp: true
    },
    {
      id: 'heal',
      name: '치료',
      description: 'HP를 회복합니다.',
      icon: '✨',
      type: 'active',
      category: 'magic',
      maxLevel: 10,
      currentLevel: 2,
      baseExperience: 120,
      experienceMultiplier: 1.6,
      currentExperience: 80,
      experienceToNext: 200,
      requirements: [
        {
          type: 'level',
          target: 'player',
          value: 5,
          description: '플레이어 레벨 5 이상'
        }
      ],
      effects: [
        {
          type: 'heal',
          target: 'self',
          value: 50,
          description: 'HP를 50 + 지능 × 2만큼 회복합니다.'
        }
      ],
      cooldown: 8,
      manaCost: 20,
      position: { x: 100, y: 200 },
      unlocked: true,
      canLevelUp: true
    },
    {
      id: 'strength_boost',
      name: '힘 증가',
      description: '일정 시간 동안 힘이 증가합니다.',
      icon: '💪',
      type: 'active',
      category: 'support',
      maxLevel: 5,
      currentLevel: 1,
      baseExperience: 200,
      experienceMultiplier: 2.0,
      currentExperience: 50,
      experienceToNext: 200,
      requirements: [
        {
          type: 'stat',
          target: 'str',
          value: 20,
          description: '힘 스탯 20 이상'
        }
      ],
      effects: [
        {
          type: 'buff',
          target: 'self',
          stat: 'str',
          value: 10,
          duration: 300,
          description: '5분 동안 힘이 10 증가합니다.'
        }
      ],
      cooldown: 60,
      manaCost: 25,
      position: { x: 200, y: 200 },
      unlocked: true,
      canLevelUp: true
    },
    {
      id: 'critical_mastery',
      name: '치명타 숙련',
      description: '치명타 확률이 영구적으로 증가합니다.',
      icon: '🎯',
      type: 'passive',
      category: 'passive',
      maxLevel: 5,
      currentLevel: 2,
      baseExperience: 300,
      experienceMultiplier: 2.5,
      currentExperience: 400,
      experienceToNext: 600,
      requirements: [
        {
          type: 'skill',
          target: 'power_strike',
          value: 5,
          description: '강타 레벨 5 이상'
        }
      ],
      effects: [
        {
          type: 'buff',
          target: 'self',
          stat: 'crit',
          value: 5,
          description: '치명타 확률이 5% 증가합니다.'
        }
      ],
      position: { x: 300, y: 100 },
      unlocked: false,
      canLevelUp: false
    },
    {
      id: 'mana_shield',
      name: '마나 방패',
      description: 'MP로 데미지를 흡수합니다.',
      icon: '🛡️',
      type: 'toggle',
      category: 'magic',
      maxLevel: 5,
      currentLevel: 0,
      baseExperience: 250,
      experienceMultiplier: 2.2,
      currentExperience: 0,
      experienceToNext: 250,
      requirements: [
        {
          type: 'stat',
          target: 'int',
          value: 25,
          description: '지능 스탯 25 이상'
        }
      ],
      effects: [
        {
          type: 'utility',
          target: 'self',
          value: 50,
          description: '받는 데미지의 50%를 MP로 대신 받습니다.'
        }
      ],
      manaCost: 2,
      position: { x: 200, y: 300 },
      unlocked: false,
      canLevelUp: false
    }
  ];
};

// 스킬 카테고리
const skillCategories = ['combat', 'magic', 'support', 'passive', 'utility'];

// 플레이어 스킬 데이터
const playerSkillData: PlayerSkillData = {
  skillPoints: 12,
  level: 25,
  stats: {
    str: 35,
    dex: 28,
    int: 22,
    vit: 40,
    luk: 18
  }
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(createDummySkills());
  const [playerData, setPlayerData] = useState<PlayerSkillData>(playerSkillData);
  const [selectedSkillPreset, setSelectedSkillPreset] = useState<string>('balanced');
  const [autoLevelMode, setAutoLevelMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  
  const { isOpen: presetModalOpen, openModal: openPresetModal, closeModal: closePresetModal } = useModal();
  const { isOpen: resetModalOpen, openModal: openResetModal, closeModal: closeResetModal } = useModal();

  // 스킬 레벨업 처리
  const handleSkillLevelUp = (skillId: string) => {
    if (playerData.skillPoints <= 0) return;

    setSkills(prevSkills => 
      prevSkills.map(skill => {
        if (skill.id === skillId && skill.canLevelUp) {
          const newLevel = skill.currentLevel + 1;
          const newExperience = 0;
          const newExperienceToNext = Math.floor(skill.baseExperience * Math.pow(skill.experienceMultiplier, newLevel));
          
          return {
            ...skill,
            currentLevel: newLevel,
            currentExperience: newExperience,
            experienceToNext: newExperienceToNext,
            canLevelUp: newLevel < skill.maxLevel && playerData.skillPoints > 1
          };
        }
        return skill;
      })
    );

    setPlayerData(prev => ({
      ...prev,
      skillPoints: prev.skillPoints - 1
    }));
  };

  // 스킬 사용 처리
  const handleSkillUse = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill || skill.currentLevel === 0) return;

    console.log(`스킬 "${skill.name}" 사용됨`);
    
    // 스킬 경험치 증가 시뮬레이션
    setSkills(prevSkills => 
      prevSkills.map(s => {
        if (s.id === skillId) {
          const expGain = Math.floor(Math.random() * 20) + 5;
          const newExp = s.currentExperience + expGain;
          
          if (newExp >= s.experienceToNext && s.currentLevel < s.maxLevel) {
            // 자동 레벨업
            return {
              ...s,
              currentLevel: s.currentLevel + 1,
              currentExperience: 0,
              experienceToNext: Math.floor(s.baseExperience * Math.pow(s.experienceMultiplier, s.currentLevel + 1))
            };
          } else {
            return {
              ...s,
              currentExperience: Math.min(newExp, s.experienceToNext)
            };
          }
        }
        return s;
      })
    );
  };

  // 스킬 토글 처리
  const handleSkillToggle = (skillId: string, enabled: boolean) => {
    console.log(`스킬 "${skillId}" 토글: ${enabled}`);
  };

  // 스킬 프리셋
  const skillPresets = [
    {
      id: 'balanced',
      name: '균형형',
      description: '모든 스킬을 골고루 발전시킵니다.',
      icon: '⚖️'
    },
    {
      id: 'combat',
      name: '전투형',
      description: '전투 스킬에 특화됩니다.',
      icon: '⚔️'
    },
    {
      id: 'magic',
      name: '마법형',
      description: '마법 스킬에 특화됩니다.',
      icon: '🔮'
    },
    {
      id: 'support',
      name: '지원형',
      description: '보조 스킬에 특화됩니다.',
      icon: '✨'
    }
  ];

  // 스킬 프리셋 적용
  const applySkillPreset = (presetId: string) => {
    setLoading(true);
    
    setTimeout(() => {
      console.log(`스킬 프리셋 "${presetId}" 적용됨`);
      setSelectedSkillPreset(presetId);
      setLoading(false);
      closePresetModal();
    }, 1000);
  };

  // 스킬 초기화
  const resetAllSkills = () => {
    setSkills(prevSkills => 
      prevSkills.map(skill => ({
        ...skill,
        currentLevel: skill.id === 'basic_attack' ? 1 : 0,
        currentExperience: 0,
        experienceToNext: skill.baseExperience,
        unlocked: skill.id === 'basic_attack',
        canLevelUp: skill.id === 'basic_attack'
      }))
    );

    // 사용한 스킬 포인트 환불
    const usedSkillPoints = skills.reduce((total, skill) => total + skill.currentLevel, 0);
    setPlayerData(prev => ({
      ...prev,
      skillPoints: prev.skillPoints + usedSkillPoints
    }));

    closeResetModal();
  };

  // 스킬 요구사항 체크 및 해금 처리
  useEffect(() => {
    setSkills(prevSkills => 
      prevSkills.map(skill => {
        if (skill.unlocked) return skill;

        const meetsRequirements = skill.requirements.every(req => {
          switch (req.type) {
            case 'level':
              return playerData.level >= req.value;
            case 'stat':
              return playerData.stats[req.target] >= req.value;
            case 'skill':
              const requiredSkill = prevSkills.find(s => s.id === req.target);
              return requiredSkill && requiredSkill.currentLevel >= req.value;
            default:
              return false;
          }
        });

        return {
          ...skill,
          unlocked: meetsRequirements,
          canLevelUp: meetsRequirements && skill.currentLevel < skill.maxLevel && playerData.skillPoints > 0
        };
      })
    );
  }, [playerData, skills]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">스킬 관리</h1>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openPresetModal}>
              스킬 프리셋
            </Button>
            <Button variant="warning" onClick={openResetModal}>
              스킬 초기화
            </Button>
          </div>
        </div>

        {/* 스킬 정보 카드 */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{playerData.skillPoints}</div>
              <div className="text-sm text-gray-600">스킬 포인트</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {skills.filter(s => s.unlocked).length}
              </div>
              <div className="text-sm text-gray-600">해금된 스킬</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {skills.filter(s => s.currentLevel >= s.maxLevel).length}
              </div>
              <div className="text-sm text-gray-600">마스터한 스킬</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {skills.filter(s => s.canLevelUp).length}
              </div>
              <div className="text-sm text-gray-600">레벨업 가능</div>
            </div>
          </Card>
        </div>

        {/* 스킬 트리 */}
        <SkillTree
          skills={skills}
          categories={skillCategories}
          skillPoints={playerData.skillPoints}
          playerLevel={playerData.level}
          playerStats={playerData.stats}
          onSkillLevelUp={handleSkillLevelUp}
          onSkillUse={handleSkillUse}
          onSkillToggle={handleSkillToggle}
          loading={loading}
        />

        {/* 활성 스킬 목록 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">활성 스킬</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills
              .filter(skill => skill.currentLevel > 0 && skill.type === 'active')
              .map(skill => (
                <div
                  key={skill.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">{skill.icon}</div>
                    <div>
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-600">Lv.{skill.currentLevel}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{skill.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSkillUse(skill.id)}
                    >
                      사용
                    </Button>
                    
                    {skill.canLevelUp && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleSkillLevelUp(skill.id)}
                      >
                        레벨업
                      </Button>
                    )}
                  </div>
                  
                  {skill.currentLevel < skill.maxLevel && (
                    <div className="mt-3">
                      <Progress
                        value={skill.currentExperience}
                        max={skill.experienceToNext}
                        size="sm"
                        variant="skill"
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {skill.currentExperience} / {skill.experienceToNext} EXP
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </Card>

        {/* 패시브 스킬 목록 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">패시브 스킬</h2>
          <div className="space-y-3">
            {skills
              .filter(skill => skill.currentLevel > 0 && skill.type === 'passive')
              .map(skill => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{skill.icon}</div>
                    <div>
                      <div className="font-medium">{skill.name} Lv.{skill.currentLevel}</div>
                      <div className="text-sm text-gray-600">{skill.description}</div>
                    </div>
                  </div>
                  
                  {skill.canLevelUp && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleSkillLevelUp(skill.id)}
                    >
                      레벨업
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </Card>

        {/* 스킬 프리셋 모달 */}
        <Modal
          isOpen={presetModalOpen}
          onClose={closePresetModal}
          title="스킬 프리셋"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              스킬 프리셋을 선택하면 해당 특성에 맞게 스킬 포인트가 자동으로 배분됩니다.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {skillPresets.map(preset => (
                <div
                  key={preset.id}
                  className={cn(
                    'p-4 border-2 rounded-lg cursor-pointer transition-all',
                    selectedSkillPreset === preset.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  )}
                  onClick={() => applySkillPreset(preset.id)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{preset.icon}</div>
                    <div className="font-bold">{preset.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{preset.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {loading && (
              <div className="text-center py-4">
                <Loading text="프리셋 적용 중..." size="sm" />
              </div>
            )}
          </div>
        </Modal>

        {/* 스킬 초기화 모달 */}
        <Modal
          isOpen={resetModalOpen}
          onClose={closeResetModal}
          title="스킬 초기화"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-red-600 mb-2">정말 초기화하시겠습니까?</h3>
              <p className="text-gray-600">
                모든 스킬이 초기화되고 사용한 스킬 포인트가 반환됩니다.
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="danger" onClick={resetAllSkills} className="flex-1">
                초기화
              </Button>
              <Button variant="ghost" onClick={closeResetModal} className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
