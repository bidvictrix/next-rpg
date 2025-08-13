/**
 * 스킬 트리 UI 컴포넌트
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, useModal } from '../ui/Modal';
import { Progress } from '../ui/Progress';
import { Loading } from '../ui/Loading';

// 스킬 인터페이스
export interface Skill {
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

// 스킬 요구사항
export interface SkillRequirement {
  type: 'skill' | 'level' | 'stat' | 'item' | 'quest';
  target: string;
  value: number;
  description: string;
}

// 스킬 효과
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  target: 'self' | 'enemy' | 'ally' | 'all';
  stat?: string;
  value: number;
  duration?: number;
  description: string;
}

// 스킬 트리 Props
export interface SkillTreeProps {
  skills: Skill[];
  categories: string[];
  skillPoints: number;
  playerLevel: number;
  playerStats: Record<string, number>;
  onSkillLevelUp?: (skillId: string) => void;
  onSkillUse?: (skillId: string) => void;
  onSkillToggle?: (skillId: string, enabled: boolean) => void;
  className?: string;
  loading?: boolean;
}

// 스킬 카테고리 색상
const categoryColors = {
  combat: 'from-red-400 to-red-600',
  magic: 'from-blue-400 to-blue-600',
  support: 'from-green-400 to-green-600',
  passive: 'from-purple-400 to-purple-600',
  crafting: 'from-orange-400 to-orange-600',
  utility: 'from-gray-400 to-gray-600'
};

// 스킬 타입 아이콘
const typeIcons = {
  active: '⚡',
  passive: '🔮',
  toggle: '🔄'
};

// 스킬 노드 컴포넌트
const SkillNode: React.FC<{
  skill: Skill;
  onClick: (skill: Skill) => void;
  onLevelUp: (skillId: string) => void;
  onUse?: (skillId: string) => void;
  scale?: number;
  showConnections?: boolean;
  connectedSkills?: string[];
}> = ({ 
  skill, 
  onClick, 
  onLevelUp, 
  onUse, 
  scale = 1,
  showConnections = true,
  connectedSkills = []
}) => {
  const nodeSize = 80 * scale;
  const isMaxLevel = skill.currentLevel >= skill.maxLevel;
  const expPercentage = skill.experienceToNext > 0 
    ? (skill.currentExperience / skill.experienceToNext) * 100 
    : 100;

  const categoryGradient = categoryColors[skill.category as keyof typeof categoryColors] || categoryColors.utility;

  return (
    <div
      className="absolute"
      style={{
        left: skill.position.x * scale,
        top: skill.position.y * scale,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* 연결선 렌더링 */}
      {showConnections && connectedSkills.map(connectedSkillId => {
        // 실제 구현에서는 connectedSkill의 위치를 계산해서 선을 그어야 함
        return null; // 단순화를 위해 생략
      })}

      {/* 스킬 노드 */}
      <div
        className={cn(
          'relative rounded-full border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group',
          skill.unlocked
            ? skill.canLevelUp
              ? 'border-yellow-400 hover:border-yellow-300 shadow-lg shadow-yellow-400/25'
              : isMaxLevel
              ? 'border-green-400 shadow-lg shadow-green-400/25'
              : 'border-blue-400 hover:border-blue-300 shadow-lg shadow-blue-400/25'
            : 'border-gray-400 opacity-50 grayscale',
          `bg-gradient-to-br ${categoryGradient}`
        )}
        style={{ width: nodeSize, height: nodeSize }}
        onClick={() => onClick(skill)}
      >
        {/* 스킬 아이콘 */}
        <div className="text-white text-xl font-bold mb-1">
          {skill.icon || typeIcons[skill.type]}
        </div>

        {/* 스킬 레벨 */}
        <div className="text-white text-xs font-bold">
          {skill.currentLevel}/{skill.maxLevel}
        </div>

        {/* 경험치 바 */}
        {skill.unlocked && !isMaxLevel && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${expPercentage}%` }}
            />
          </div>
        )}

        {/* 스킬 타입 표시 */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs shadow-md">
          {typeIcons[skill.type]}
        </div>

        {/* 레벨업 가능 표시 */}
        {skill.canLevelUp && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
        )}

        {/* 툴팁 */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-3 py-2 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 max-w-xs">
          <div className="font-medium">{skill.name}</div>
          <div className="text-gray-300 text-xs mt-1">{skill.description}</div>
          <div className="text-gray-400 text-xs mt-1">
            {skill.category} • {skill.type}
          </div>
          {skill.cooldown && (
            <div className="text-gray-400 text-xs">
              쿨다운: {skill.cooldown}초
            </div>
          )}
          {skill.manaCost && (
            <div className="text-blue-400 text-xs">
              소모 MP: {skill.manaCost}
            </div>
          )}
        </div>

        {/* 액션 버튼들 (호버 시 표시) */}
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          {skill.canLevelUp && (
            <Button
              variant="game"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onLevelUp(skill.id);
              }}
            >
              UP
            </Button>
          )}
          {skill.type === 'active' && skill.currentLevel > 0 && onUse && (
            <Button
              variant="primary"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onUse(skill.id);
              }}
            >
              사용
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// 스킬 상세 정보 모달
const SkillDetailModal: React.FC<{
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onLevelUp?: (skillId: string) => void;
  onUse?: (skillId: string) => void;
  skillPoints: number;
}> = ({ skill, isOpen, onClose, onLevelUp, onUse, skillPoints }) => {
  if (!skill) return null;

  const isMaxLevel = skill.currentLevel >= skill.maxLevel;
  const expPercentage = skill.experienceToNext > 0 
    ? (skill.currentExperience / skill.experienceToNext) * 100 
    : 100;

  const categoryGradient = categoryColors[skill.category as keyof typeof categoryColors] || categoryColors.utility;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={skill.name}
      size="lg"
    >
      <div className="space-y-6">
        {/* 스킬 헤더 */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-20 h-20 rounded-full border-4 flex items-center justify-center text-white text-3xl',
              skill.unlocked ? 'border-blue-400' : 'border-gray-400 opacity-50',
              `bg-gradient-to-br ${categoryGradient}`
            )}
          >
            {skill.icon || typeIcons[skill.type]}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold">{skill.name}</h3>
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                skill.type === 'active' && 'bg-red-100 text-red-800',
                skill.type === 'passive' && 'bg-purple-100 text-purple-800',
                skill.type === 'toggle' && 'bg-blue-100 text-blue-800'
              )}>
                {skill.type.toUpperCase()}
              </span>
            </div>
            
            <p className="text-gray-700 mb-3">{skill.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">카테고리:</span>
                <span className="ml-1 font-medium">{skill.category}</span>
              </div>
              <div>
                <span className="text-gray-600">레벨:</span>
                <span className="ml-1 font-medium">{skill.currentLevel}/{skill.maxLevel}</span>
              </div>
              {skill.cooldown && (
                <div>
                  <span className="text-gray-600">쿨다운:</span>
                  <span className="ml-1 font-medium">{skill.cooldown}초</span>
                </div>
              )}
              {skill.manaCost && (
                <div>
                  <span className="text-gray-600">소모 MP:</span>
                  <span className="ml-1 font-medium text-blue-600">{skill.manaCost}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 경험치 진행도 */}
        {skill.unlocked && !isMaxLevel && (
          <div>
            <h4 className="font-medium mb-2">경험치</h4>
            <Progress
              value={skill.currentExperience}
              max={skill.experienceToNext}
              variant="skill"
              showValue
              format={(current, max) => `${current} / ${max}`}
            />
            <div className="text-sm text-gray-600 mt-1">
              다음 레벨까지: {skill.experienceToNext - skill.currentExperience} EXP
            </div>
          </div>
        )}

        {/* 스킬 효과 */}
        {skill.effects.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">효과</h4>
            <div className="space-y-2">
              {skill.effects.map((effect, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      effect.type === 'damage' && 'bg-red-100 text-red-800',
                      effect.type === 'heal' && 'bg-green-100 text-green-800',
                      effect.type === 'buff' && 'bg-blue-100 text-blue-800',
                      effect.type === 'debuff' && 'bg-red-100 text-red-800',
                      effect.type === 'utility' && 'bg-gray-100 text-gray-800'
                    )}>
                      {effect.type}
                    </span>
                    <span className="text-sm text-gray-600">→ {effect.target}</span>
                  </div>
                  <p className="text-sm">{effect.description}</p>
                  {effect.stat && (
                    <div className="text-sm text-gray-600 mt-1">
                      {effect.stat}: {effect.value > 0 ? '+' : ''}{effect.value}
                      {effect.duration && ` (${effect.duration}초)`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 요구사항 */}
        {skill.requirements.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">요구사항</h4>
            <div className="space-y-2">
              {skill.requirements.map((req, index) => (
                <div key={index} className={cn(
                  'p-2 rounded-lg text-sm',
                  'bg-red-50 text-red-800' // 실제로는 충족 여부에 따라 색상 변경
                )}>
                  {req.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 레벨별 변화 미리보기 */}
        {skill.currentLevel < skill.maxLevel && (
          <div>
            <h4 className="font-medium mb-3">다음 레벨 효과</h4>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                레벨 {skill.currentLevel + 1}에서 효과가 강화됩니다.
              </p>
              {/* 실제로는 다음 레벨의 구체적인 효과를 표시 */}
            </div>
          </div>
        )}
      </div>

      {/* 모달 푸터 */}
      <div className="flex gap-2 mt-6">
        {skill.canLevelUp && skillPoints > 0 && (
          <Button
            variant="success"
            onClick={() => {
              onLevelUp?.(skill.id);
              onClose();
            }}
          >
            레벨업 (SP 1 소모)
          </Button>
        )}
        {skill.type === 'active' && skill.currentLevel > 0 && onUse && (
          <Button
            variant="primary"
            onClick={() => {
              onUse(skill.id);
              onClose();
            }}
          >
            스킬 사용
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
};

// 메인 스킬 트리 컴포넌트
export const SkillTree: React.FC<SkillTreeProps> = ({
  skills,
  categories,
  skillPoints,
  playerLevel,
  playerStats,
  onSkillLevelUp,
  onSkillUse,
  onSkillToggle,
  className,
  loading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // 필터링된 스킬들
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [skills, selectedCategory, searchTerm]);

  // 스킬 통계
  const skillStats = useMemo(() => {
    const total = skills.length;
    const unlocked = skills.filter(s => s.unlocked).length;
    const maxLevel = skills.filter(s => s.currentLevel >= s.maxLevel).length;
    const canLevelUp = skills.filter(s => s.canLevelUp).length;
    
    return { total, unlocked, maxLevel, canLevelUp };
  }, [skills]);

  // 스킬 클릭 핸들러
  const handleSkillClick = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    openModal();
  }, [openModal]);

  // 마우스 드래그로 뷰 이동
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // 왼쪽 마우스 버튼
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewPosition.x, y: e.clientY - viewPosition.y });
    }
  }, [viewPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setViewPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 줌 조절
  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  // 휠로 줌 조절
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [handleZoom]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loading text="스킬 트리 로딩중..." size="lg" />
      </div>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">스킬 트리</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              스킬 포인트: <span className="font-bold text-blue-600">{skillPoints}</span>
            </div>
            <div className="text-sm text-gray-600">
              {skillStats.unlocked}/{skillStats.total} 해금
            </div>
          </div>
        </div>

        {/* 통계 표시 */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{skillStats.unlocked}</div>
            <div className="text-sm text-gray-600">해금된 스킬</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{skillStats.maxLevel}</div>
            <div className="text-sm text-gray-600">최대 레벨</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{skillStats.canLevelUp}</div>
            <div className="text-sm text-gray-600">레벨업 가능</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{skillPoints}</div>
            <div className="text-sm text-gray-600">스킬 포인트</div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="스킬 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon="🔍"
            size="sm"
            className="flex-1"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">모든 카테고리</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleZoom(0.1)}>
            확대
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.1)}>
            축소
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoomLevel(1)}>
            100%
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setViewPosition({ x: 0, y: 0 })}>
            중앙정렬
          </Button>
          <span className="text-sm text-gray-600 ml-2">
            줌: {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* 스킬 트리 캔버스 */}
      <div
        ref={containerRef}
        className="relative w-full h-96 border-2 border-gray-200 rounded-lg overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `translate(${viewPosition.x}px, ${viewPosition.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          {/* 스킬 노드들 */}
          {filteredSkills.map(skill => (
            <SkillNode
              key={skill.id}
              skill={skill}
              onClick={handleSkillClick}
              onLevelUp={onSkillLevelUp || (() => {})}
              onUse={onSkillUse}
              scale={1}
            />
          ))}
        </div>

        {/* 미니맵 (선택사항) */}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-white/90 border rounded-lg p-2">
          <div className="text-xs text-gray-600 mb-1">미니맵</div>
          <div className="relative w-full h-full bg-gray-100 rounded">
            {/* 간단한 미니맵 표시 */}
            <div
              className="absolute w-4 h-3 border border-blue-500 bg-blue-200/50"
              style={{
                left: `${Math.max(0, Math.min(100, 50 - viewPosition.x / 10))}%`,
                top: `${Math.max(0, Math.min(100, 50 - viewPosition.y / 10))}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">범례</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 rounded bg-gray-200"></div>
            <span>잠금됨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 rounded bg-blue-200"></div>
            <span>해금됨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-400 rounded bg-yellow-200"></div>
            <span>레벨업 가능</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-green-400 rounded bg-green-200"></div>
            <span>최대 레벨</span>
          </div>
        </div>
      </div>

      {/* 스킬 상세 모달 */}
      <SkillDetailModal
        skill={selectedSkill}
        isOpen={isOpen}
        onClose={closeModal}
        onLevelUp={onSkillLevelUp}
        onUse={onSkillUse}
        skillPoints={skillPoints}
      />
    </Card>
  );
};

export default SkillTree;