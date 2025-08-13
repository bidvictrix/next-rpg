'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

// 스킬 인터페이스
interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'active' | 'passive' | 'toggle';
  category: 'combat' | 'magic' | 'support' | 'passive' | 'utility';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  maxLevel: number;
  baseExperience: number;
  experienceMultiplier: number;
  cooldown?: number;
  manaCost?: number;
  effects: SkillEffect[];
  requirements: SkillRequirement[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number; // 플레이어들이 사용한 횟수
}

interface SkillEffect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  target: 'self' | 'enemy' | 'ally' | 'all';
  value: number;
  stat?: string;
  duration?: number;
  description: string;
}

interface SkillRequirement {
  id: string;
  type: 'level' | 'skill' | 'stat' | 'item' | 'quest';
  target: string;
  value: number;
  description: string;
}

// 더미 스킬 데이터 생성
const createDummySkills = (): Skill[] => {
  const skills: Skill[] = [
    {
      id: 'basic_attack',
      name: '기본 공격',
      description: '가장 기본적인 물리 공격입니다.',
      icon: '⚔️',
      type: 'active',
      category: 'combat',
      rarity: 'common',
      maxLevel: 10,
      baseExperience: 100,
      experienceMultiplier: 1.5,
      cooldown: 0,
      manaCost: 0,
      effects: [
        {
          id: 'effect1',
          type: 'damage',
          target: 'enemy',
          value: 100,
          description: '적에게 100% 공격력의 물리 데미지'
        }
      ],
      requirements: [],
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-08-10'),
      usageCount: 15420
    },
    {
      id: 'fireball',
      name: '파이어볼',
      description: '화염구를 발사하여 적에게 화염 데미지를 입힙니다.',
      icon: '🔥',
      type: 'active',
      category: 'magic',
      rarity: 'uncommon',
      maxLevel: 10,
      baseExperience: 150,
      experienceMultiplier: 1.8,
      cooldown: 3,
      manaCost: 20,
      effects: [
        {
          id: 'effect2',
          type: 'damage',
          target: 'enemy',
          value: 160,
          description: '적에게 160% 지능의 화염 데미지'
        }
      ],
      requirements: [
        {
          id: 'req1',
          type: 'level',
          target: 'player',
          value: 5,
          description: '플레이어 레벨 5 이상'
        }
      ],
      isActive: true,
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-08-12'),
      usageCount: 8730
    },
    {
      id: 'heal',
      name: '치료',
      description: 'HP를 회복합니다.',
      icon: '✨',
      type: 'active',
      category: 'support',
      rarity: 'common',
      maxLevel: 10,
      baseExperience: 120,
      experienceMultiplier: 1.6,
      cooldown: 5,
      manaCost: 25,
      effects: [
        {
          id: 'effect3',
          type: 'heal',
          target: 'self',
          value: 50,
          stat: 'hp',
          description: 'HP를 50 + 지능 × 2만큼 회복'
        }
      ],
      requirements: [
        {
          id: 'req2',
          type: 'stat',
          target: 'int',
          value: 15,
          description: '지능 15 이상'
        }
      ],
      isActive: true,
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-08-08'),
      usageCount: 12450
    },
    {
      id: 'critical_mastery',
      name: '치명타 숙련',
      description: '치명타 확률이 영구적으로 증가합니다.',
      icon: '🎯',
      type: 'passive',
      category: 'passive',
      rarity: 'rare',
      maxLevel: 5,
      baseExperience: 300,
      experienceMultiplier: 2.0,
      effects: [
        {
          id: 'effect4',
          type: 'buff',
          target: 'self',
          value: 5,
          stat: 'crit',
          description: '치명타 확률 +5%'
        }
      ],
      requirements: [
        {
          id: 'req3',
          type: 'skill',
          target: 'basic_attack',
          value: 5,
          description: '기본 공격 레벨 5 이상'
        }
      ],
      isActive: true,
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-08-05'),
      usageCount: 3420
    },
    {
      id: 'mana_shield',
      name: '마나 방패',
      description: 'MP로 데미지를 흡수합니다.',
      icon: '🛡️',
      type: 'toggle',
      category: 'magic',
      rarity: 'epic',
      maxLevel: 5,
      baseExperience: 250,
      experienceMultiplier: 2.2,
      manaCost: 2,
      effects: [
        {
          id: 'effect5',
          type: 'utility',
          target: 'self',
          value: 50,
          description: '받는 데미지의 50%를 MP로 대신 받음'
        }
      ],
      requirements: [
        {
          id: 'req4',
          type: 'stat',
          target: 'int',
          value: 30,
          description: '지능 30 이상'
        }
      ],
      isActive: false,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-08-01'),
      usageCount: 1250
    }
  ];

  return skills;
};

export default function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>(createDummySkills());
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { isOpen: editModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: previewModalOpen, openModal: openPreviewModal, closeModal: closePreviewModal } = useModal();

  // 필터링된 스킬 목록
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;
      const matchesType = typeFilter === 'all' || skill.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && skill.isActive) ||
                           (statusFilter === 'inactive' && !skill.isActive);
      
      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [skills, searchTerm, categoryFilter, typeFilter, statusFilter]);

  // 스킬 통계
  const skillStats = useMemo(() => {
    const total = skills.length;
    const active = skills.filter(s => s.isActive).length;
    const byCategory = skills.reduce((acc, skill) => {
      acc[skill.category] = (acc[skill.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byType = skills.reduce((acc, skill) => {
      acc[skill.type] = (acc[skill.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, active, byCategory, byType };
  }, [skills]);

  // 새 스킬 생성
  const createNewSkill = () => {
    const newSkill: Skill = {
      id: `skill_${Date.now()}`,
      name: '새 스킬',
      description: '새로운 스킬입니다.',
      icon: '⭐',
      type: 'active',
      category: 'combat',
      rarity: 'common',
      maxLevel: 10,
      baseExperience: 100,
      experienceMultiplier: 1.5,
      effects: [],
      requirements: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    };
    
    setSelectedSkill(newSkill);
    setEditingSkill(newSkill);
    openEditModal();
  };

  // 스킬 편집 열기
  const openSkillEdit = (skill: Skill) => {
    setSelectedSkill(skill);
    setEditingSkill({ ...skill });
    openEditModal();
  };

  // 스킬 저장
  const saveSkill = () => {
    if (!editingSkill.id) return;

    setSkills(prev => {
      const existingIndex = prev.findIndex(s => s.id === editingSkill.id);
      const updatedSkill = {
        ...editingSkill,
        updatedAt: new Date()
      } as Skill;

      if (existingIndex >= 0) {
        // 기존 스킬 업데이트
        const newSkills = [...prev];
        newSkills[existingIndex] = updatedSkill;
        return newSkills;
      } else {
        // 새 스킬 추가
        return [...prev, updatedSkill];
      }
    });

    closeEditModal();
  };

  // 스킬 삭제
  const deleteSkill = () => {
    if (!selectedSkill) return;

    setSkills(prev => prev.filter(s => s.id !== selectedSkill.id));
    closeDeleteModal();
  };

  // 스킬 활성/비활성 토글
  const toggleSkillStatus = (skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, isActive: !skill.isActive, updatedAt: new Date() }
        : skill
    ));
  };

  // 효과 추가
  const addEffect = () => {
    const newEffect: SkillEffect = {
      id: `effect_${Date.now()}`,
      type: 'damage',
      target: 'enemy',
      value: 100,
      description: '새 효과'
    };
    
    setEditingSkill(prev => ({
      ...prev,
      effects: [...(prev.effects || []), newEffect]
    }));
  };

  // 요구사항 추가
  const addRequirement = () => {
    const newRequirement: SkillRequirement = {
      id: `req_${Date.now()}`,
      type: 'level',
      target: 'player',
      value: 1,
      description: '새 요구사항'
    };
    
    setEditingSkill(prev => ({
      ...prev,
      requirements: [...(prev.requirements || []), newRequirement]
    }));
  };

  // 타입별 색상
  const getTypeColor = (type: Skill['type']) => {
    switch (type) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'passive': return 'text-purple-600 bg-purple-100';
      case 'toggle': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 희소성 색상
  const getRarityColor = (rarity: Skill['rarity']) => {
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
            <h1 className="text-3xl font-bold">스킬 편집</h1>
            <p className="text-gray-600">게임 스킬 생성 및 편집</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">
              스킬 가져오기
            </Button>
            <Button variant="primary" onClick={createNewSkill}>
              새 스킬 생성
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{skillStats.total}</div>
              <div className="text-sm text-gray-600">전체 스킬</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{skillStats.active}</div>
              <div className="text-sm text-gray-600">활성 스킬</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{skillStats.byType.active || 0}</div>
              <div className="text-sm text-gray-600">액티브</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{skillStats.byType.passive || 0}</div>
              <div className="text-sm text-gray-600">패시브</div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{skillStats.byCategory.combat || 0}</div>
              <div className="text-sm text-gray-600">전투 스킬</div>
            </div>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="스킬 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon="🔍"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 카테고리</option>
              <option value="combat">전투</option>
              <option value="magic">마법</option>
              <option value="support">지원</option>
              <option value="passive">패시브</option>
              <option value="utility">유틸리티</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">모든 타입</option>
              <option value="active">액티브</option>
              <option value="passive">패시브</option>
              <option value="toggle">토글</option>
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

        {/* 스킬 목록 테이블 */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">스킬</th>
                  <th className="text-left py-3 px-4">타입</th>
                  <th className="text-left py-3 px-4">카테고리</th>
                  <th className="text-left py-3 px-4">레벨</th>
                  <th className="text-left py-3 px-4">사용 횟수</th>
                  <th className="text-left py-3 px-4">상태</th>
                  <th className="text-left py-3 px-4">수정일</th>
                  <th className="text-left py-3 px-4">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map(skill => (
                  <tr key={skill.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{skill.icon}</div>
                        <div>
                          <div className="font-medium">{skill.name}</div>
                          <div className={cn('text-sm font-medium', getRarityColor(skill.rarity))}>
                            {skill.rarity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', getTypeColor(skill.type))}>
                        {skill.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{skill.category}</td>
                    <td className="py-3 px-4 text-sm">
                      {skill.maxLevel}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {skill.usageCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        skill.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      )}>
                        {skill.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {skill.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSkillEdit(skill)}
                        >
                          편집
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSkill(skill);
                            openPreviewModal();
                          }}
                        >
                          미리보기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSkillStatus(skill.id)}
                        >
                          {skill.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 스킬 편집 모달 */}
        <Modal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          title={editingSkill.id?.startsWith('skill_') ? '새 스킬 생성' : '스킬 편집'}
          size="lg"
        >
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">스킬 이름</label>
                <Input
                  value={editingSkill.name || ''}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">아이콘</label>
                <Input
                  value={editingSkill.icon || ''}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, icon: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">설명</label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={3}
                value={editingSkill.description || ''}
                onChange={(e) => setEditingSkill(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">타입</label>
                <select
                  value={editingSkill.type || 'active'}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="active">액티브</option>
                  <option value="passive">패시브</option>
                  <option value="toggle">토글</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <select
                  value={editingSkill.category || 'combat'}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="combat">전투</option>
                  <option value="magic">마법</option>
                  <option value="support">지원</option>
                  <option value="passive">패시브</option>
                  <option value="utility">유틸리티</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">희소성</label>
                <select
                  value={editingSkill.rarity || 'common'}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, rarity: e.target.value as any }))}
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
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">최대 레벨</label>
                <Input
                  type="number"
                  value={editingSkill.maxLevel || 10}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, maxLevel: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">기본 경험치</label>
                <Input
                  type="number"
                  value={editingSkill.baseExperience || 100}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, baseExperience: parseInt(e.target.value) }))}
                />
              </div>
              {editingSkill.type !== 'passive' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">쿨다운 (초)</label>
                    <Input
                      type="number"
                      value={editingSkill.cooldown || 0}
                      onChange={(e) => setEditingSkill(prev => ({ ...prev, cooldown: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">MP 소모</label>
                    <Input
                      type="number"
                      value={editingSkill.manaCost || 0}
                      onChange={(e) => setEditingSkill(prev => ({ ...prev, manaCost: parseInt(e.target.value) }))}
                    />
                  </div>
                </>
              )}
            </div>

            {/* 효과 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">효과</h3>
                <Button variant="ghost" size="sm" onClick={addEffect}>
                  효과 추가
                </Button>
              </div>
              <div className="space-y-2">
                {editingSkill.effects?.map((effect, index) => (
                  <div key={effect.id} className="p-3 border rounded-lg">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <select
                        value={effect.type}
                        onChange={(e) => {
                          const newEffects = [...(editingSkill.effects || [])];
                          newEffects[index] = { ...effect, type: e.target.value as any };
                          setEditingSkill(prev => ({ ...prev, effects: newEffects }));
                        }}
                        className="p-1 border rounded text-xs"
                      >
                        <option value="damage">데미지</option>
                        <option value="heal">회복</option>
                        <option value="buff">버프</option>
                        <option value="debuff">디버프</option>
                        <option value="utility">유틸리티</option>
                      </select>
                      <select
                        value={effect.target}
                        onChange={(e) => {
                          const newEffects = [...(editingSkill.effects || [])];
                          newEffects[index] = { ...effect, target: e.target.value as any };
                          setEditingSkill(prev => ({ ...prev, effects: newEffects }));
                        }}
                        className="p-1 border rounded text-xs"
                      >
                        <option value="self">자신</option>
                        <option value="enemy">적</option>
                        <option value="ally">아군</option>
                        <option value="all">전체</option>
                      </select>
                      <Input
                        type="number"
                        value={effect.value}
                        onChange={(e) => {
                          const newEffects = [...(editingSkill.effects || [])];
                          newEffects[index] = { ...effect, value: parseInt(e.target.value) };
                          setEditingSkill(prev => ({ ...prev, effects: newEffects }));
                        }}
                        size="sm"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const newEffects = editingSkill.effects?.filter((_, i) => i !== index);
                          setEditingSkill(prev => ({ ...prev, effects: newEffects }));
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                    <Input
                      placeholder="효과 설명"
                      value={effect.description}
                      onChange={(e) => {
                        const newEffects = [...(editingSkill.effects || [])];
                        newEffects[index] = { ...effect, description: e.target.value };
                        setEditingSkill(prev => ({ ...prev, effects: newEffects }));
                      }}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 요구사항 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">요구사항</h3>
                <Button variant="ghost" size="sm" onClick={addRequirement}>
                  요구사항 추가
                </Button>
              </div>
              <div className="space-y-2">
                {editingSkill.requirements?.map((req, index) => (
                  <div key={req.id} className="p-3 border rounded-lg">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <select
                        value={req.type}
                        onChange={(e) => {
                          const newReqs = [...(editingSkill.requirements || [])];
                          newReqs[index] = { ...req, type: e.target.value as any };
                          setEditingSkill(prev => ({ ...prev, requirements: newReqs }));
                        }}
                        className="p-1 border rounded text-xs"
                      >
                        <option value="level">레벨</option>
                        <option value="skill">스킬</option>
                        <option value="stat">스탯</option>
                        <option value="item">아이템</option>
                        <option value="quest">퀘스트</option>
                      </select>
                      <Input
                        placeholder="타겟"
                        value={req.target}
                        onChange={(e) => {
                          const newReqs = [...(editingSkill.requirements || [])];
                          newReqs[index] = { ...req, target: e.target.value };
                          setEditingSkill(prev => ({ ...prev, requirements: newReqs }));
                        }}
                        size="sm"
                      />
                      <Input
                        type="number"
                        value={req.value}
                        onChange={(e) => {
                          const newReqs = [...(editingSkill.requirements || [])];
                          newReqs[index] = { ...req, value: parseInt(e.target.value) };
                          setEditingSkill(prev => ({ ...prev, requirements: newReqs }));
                        }}
                        size="sm"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const newReqs = editingSkill.requirements?.filter((_, i) => i !== index);
                          setEditingSkill(prev => ({ ...prev, requirements: newReqs }));
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                    <Input
                      placeholder="요구사항 설명"
                      value={req.description}
                      onChange={(e) => {
                        const newReqs = [...(editingSkill.requirements || [])];
                        newReqs[index] = { ...req, description: e.target.value };
                        setEditingSkill(prev => ({ ...prev, requirements: newReqs }));
                      }}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="primary" onClick={saveSkill} className="flex-1">
              저장
            </Button>
            <Button variant="ghost" onClick={closeEditModal}>
              취소
            </Button>
            {!editingSkill.id?.startsWith('skill_') && (
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

        {/* 스킬 미리보기 모달 */}
        <Modal
          isOpen={previewModalOpen}
          onClose={closePreviewModal}
          title="스킬 미리보기"
          size="md"
        >
          {selectedSkill && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-2">{selectedSkill.icon}</div>
                <h3 className="text-xl font-bold">{selectedSkill.name}</h3>
                <p className="text-gray-600">{selectedSkill.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">타입:</span>
                  <span className="ml-2 font-medium">{selectedSkill.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">카테고리:</span>
                  <span className="ml-2 font-medium">{selectedSkill.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">최대 레벨:</span>
                  <span className="ml-2 font-medium">{selectedSkill.maxLevel}</span>
                </div>
                <div>
                  <span className="text-gray-600">희소성:</span>
                  <span className={cn('ml-2 font-medium', getRarityColor(selectedSkill.rarity))}>
                    {selectedSkill.rarity}
                  </span>
                </div>
                {selectedSkill.cooldown && (
                  <div>
                    <span className="text-gray-600">쿨다운:</span>
                    <span className="ml-2 font-medium">{selectedSkill.cooldown}초</span>
                  </div>
                )}
                {selectedSkill.manaCost && (
                  <div>
                    <span className="text-gray-600">MP 소모:</span>
                    <span className="ml-2 font-medium">{selectedSkill.manaCost}</span>
                  </div>
                )}
              </div>

              {selectedSkill.effects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">효과</h4>
                  <div className="space-y-2">
                    {selectedSkill.effects.map(effect => (
                      <div key={effect.id} className="p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">
                          {effect.type} → {effect.target} ({effect.value})
                        </div>
                        <div className="text-xs text-gray-600">{effect.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSkill.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">요구사항</h4>
                  <div className="space-y-1">
                    {selectedSkill.requirements.map(req => (
                      <div key={req.id} className="text-sm text-gray-600">
                        • {req.description}
                      </div>
                    ))}
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
          title="스킬 삭제 확인"
          size="sm"
        >
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-red-600 mb-2">스킬 삭제</h3>
              <p className="text-gray-600">
                {selectedSkill?.name} 스킬을 정말 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={deleteSkill} className="flex-1">
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
