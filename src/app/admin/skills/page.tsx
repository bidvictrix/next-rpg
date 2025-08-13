'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, useModal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { Skill, SkillEffect, SkillRequirement, SkillCategory } from '@/types/skills';

export default function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill>>({});
  const [editingCategory, setEditingCategory] = useState<Partial<SkillCategory>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { isOpen: editModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { isOpen: deleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();
  const { isOpen: previewModalOpen, openModal: openPreviewModal, closeModal: closePreviewModal } = useModal();
  const { isOpen: categoryModalOpen, openModal: openCategoryModal, closeModal: closeCategoryModal } = useModal();

  // 스킬 데이터 로드
  const loadSkills = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/skills');
      const result = await response.json();
      
      if (result.success) {
        setSkills(result.data || []);
      } else {
        console.error('스킬 로드 실패:', result.error);
        alert('스킬 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('스킬 로드 에러:', error);
      alert('서버 연결 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 데이터 로드
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/skills/categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data || []);
      } else {
        console.error('카테고리 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('카테고리 로드 에러:', error);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadSkills();
    loadCategories();
  }, []);

  // 필터링된 스킬 목록
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;
      const matchesType = typeFilter === 'all' || skill.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && skill.isActive !== false) ||
                           (statusFilter === 'inactive' && skill.isActive === false);
      
      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [skills, searchTerm, categoryFilter, typeFilter, statusFilter]);

  // 스킬 통계
  const skillStats = useMemo(() => {
    const total = skills.length;
    const active = skills.filter(s => s.isActive !== false).length;
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
    const newSkill: Partial<Skill> = {
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
      isActive: true
    };
    
    setSelectedSkill(null);
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
  const saveSkill = async () => {
    if (!editingSkill.id || !editingSkill.name) {
      alert('스킬 ID와 이름은 필수입니다.');
      return;
    }

    try {
      setIsSaving(true);
      
      const isNewSkill = !selectedSkill;
      const url = '/api/skills';
      const method = isNewSkill ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSkill),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadSkills(); // 데이터 새로고침
        closeEditModal();
        alert(result.message || '스킬이 성공적으로 저장되었습니다.');
      } else {
        alert(result.error || '스킬 저장에 실패했습니다.');
        if (result.details) {
          console.error('유효성 검사 오류:', result.details);
        }
      }
    } catch (error) {
      console.error('스킬 저장 에러:', error);
      alert('서버 연결 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 스킬 삭제
  const deleteSkill = async () => {
    if (!selectedSkill) return;

    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/skills?id=${selectedSkill.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadSkills(); // 데이터 새로고침
        closeDeleteModal();
        alert(result.message || '스킬이 성공적으로 삭제되었습니다.');
      } else {
        alert(result.error || '스킬 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('스킬 삭제 에러:', error);
      alert('서버 연결 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 스킬 활성/비활성 토글
  const toggleSkillStatus = async (skill: Skill) => {
    try {
      const updatedSkill = { ...skill, isActive: !skill.isActive };
      
      const response = await fetch('/api/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSkill),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadSkills(); // 데이터 새로고침
      } else {
        alert(result.error || '스킬 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('스킬 상태 변경 에러:', error);
      alert('서버 연결 오류가 발생했습니다.');
    }
  };

  // 카테고리 편집 열기
  const openCategoryEdit = (category: SkillCategory) => {
    setSelectedCategory(category);
    setEditingCategory({ ...category });
    openCategoryModal();
  };

  // 카테고리 저장
  const saveCategory = async () => {
    if (!editingCategory.id || !editingCategory.name) {
      alert('카테고리 ID와 이름은 필수입니다.');
      return;
    }

    try {
      setIsSaving(true);
      
      const isNewCategory = !selectedCategory;
      const url = '/api/skills/categories';
      const method = isNewCategory ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCategory),
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadCategories(); // 데이터 새로고침
        closeCategoryModal();
        alert(result.message || '카테고리가 성공적으로 저장되었습니다.');
      } else {
        alert(result.error || '카테고리 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 저장 에러:', error);
      alert('서버 연결 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg text-gray-600">스킬 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">실시간 스킬 편집</h1>
            <p className="text-gray-600">게임 스킬 실시간 생성, 수정 및 관리</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadSkills} disabled={isLoading}>
              새로고침
            </Button>
            <Button variant="secondary" onClick={() => {
              setSelectedCategory(null);
              setEditingCategory({
                id: `category_${Date.now()}`,
                name: '새 카테고리',
                description: '새로운 스킬 카테고리입니다.',
                color: '#3b82f6',
                skills: []
              });
              openCategoryModal();
            }}>
              카테고리 관리
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
                        <div className="text-2xl">{skill.icon || '⚔️'}</div>
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
                      {(skill.usageCount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        skill.isActive !== false ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      )}>
                        {skill.isActive !== false ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {skill.updatedAt ? new Date(skill.updatedAt).toLocaleDateString() : '-'}
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
                          onClick={() => toggleSkillStatus(skill)}
                        >
                          {skill.isActive !== false ? '비활성화' : '활성화'}
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
          title={selectedSkill ? '스킬 편집' : '새 스킬 생성'}
          size="lg"
        >
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">스킬 ID</label>
                <Input
                  value={editingSkill.id || ''}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, id: e.target.value }))}
                  disabled={!!selectedSkill}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">스킬 이름</label>
                <Input
                  value={editingSkill.name || ''}
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, type: e.target.value as Skill['type'] }))}
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
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, category: e.target.value as Skill['category'] }))}
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
                  onChange={(e) => setEditingSkill(prev => ({ ...prev, rarity: e.target.value as NonNullable<Skill['rarity']> }))}
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
                {editingSkill.effects?.map((effect: SkillEffect, index: number) => (
                  <div key={effect.id} className="p-3 border rounded-lg">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <select
                        value={effect.type}
                        onChange={(e) => {
                          const newEffects: SkillEffect[] = [...(editingSkill.effects || [])];
                          newEffects[index] = { ...effect, type: e.target.value as SkillEffect['type'] };
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
                          const newEffects: SkillEffect[] = [...(editingSkill.effects || [])];
                          newEffects[index] = { ...effect, target: e.target.value as SkillEffect['target'] };
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
                          const newEffects: SkillEffect[] = [...(editingSkill.effects || [])];
                          newEffects[index] = { ...effect, value: parseInt(e.target.value) };
                          setEditingSkill(prev => ({ ...prev, effects: newEffects }));
                        }}
                        size="sm"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const newEffects: SkillEffect[] = (editingSkill.effects || []).filter((_, i) => i !== index);
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
                          const newEffects: SkillEffect[] = [...(editingSkill.effects || [])];
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
                          newReqs[index] = { ...req, type: e.target.value as SkillRequirement['type'] };
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
                        value={req.target || ''}
                        onChange={(e) => {
                          const newReqs = [...(editingSkill.requirements || [])];
                          newReqs[index] = { ...req, target: e.target.value };
                          setEditingSkill(prev => ({ ...prev, requirements: newReqs }));
                        }}
                        size="sm"
                      />
                      <Input
                        type="number"
                        value={req.value as number}
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
            <Button 
              variant="primary" 
              onClick={saveSkill} 
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button variant="ghost" onClick={closeEditModal} disabled={isSaving}>
              취소
            </Button>
            {selectedSkill && (
              <Button
                variant="danger"
                onClick={() => {
                  closeEditModal();
                  openDeleteModal();
                }}
                disabled={isSaving}
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
                <div className="text-6xl mb-2">{selectedSkill.icon || '⚔️'}</div>
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
              <Button 
                variant="danger" 
                onClick={deleteSkill} 
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? '삭제 중...' : '삭제'}
              </Button>
              <Button variant="ghost" onClick={closeDeleteModal} className="flex-1" disabled={isSaving}>
                취소
              </Button>
            </div>
          </div>
        </Modal>

        {/* 카테고리 관리 모달 */}
        <Modal
          isOpen={categoryModalOpen}
          onClose={closeCategoryModal}
          title="카테고리 관리"
          size="lg"
        >
          <div className="space-y-6">
            {/* 기존 카테고리 목록 */}
            <div>
              <h3 className="font-medium mb-3">기존 카테고리</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-600">{category.description}</div>
                        <div className="text-xs text-gray-500">
                          {category.skills.length}개 스킬
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCategoryEdit(category)}
                    >
                      편집
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 카테고리 편집 폼 */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">
                {selectedCategory ? '카테고리 편집' : '새 카테고리 생성'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">카테고리 ID</label>
                    <Input
                      value={editingCategory.id || ''}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, id: e.target.value }))}
                      disabled={!!selectedCategory}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">카테고리 이름</label>
                    <Input
                      value={editingCategory.name || ''}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">설명</label>
                  <textarea
                    className="w-full p-3 border rounded-md"
                    rows={3}
                    value={editingCategory.description || ''}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">색상</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={editingCategory.color || '#3b82f6'}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10 border rounded cursor-pointer"
                    />
                    <Input
                      value={editingCategory.color || '#3b82f6'}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button 
              variant="primary" 
              onClick={saveCategory} 
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <Button variant="ghost" onClick={closeCategoryModal} disabled={isSaving}>
              취소
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
