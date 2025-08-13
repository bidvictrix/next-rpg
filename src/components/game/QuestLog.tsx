/**
 * 퀘스트 로그 컴포넌트
 */

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, useModal } from '../ui/Modal';
import { Progress } from '../ui/Progress';
import { Loading } from '../ui/Loading';

// 퀘스트 상태
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'locked';

// 퀘스트 목표
export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'craft' | 'level' | 'custom';
  target?: string;
  current: number;
  required: number;
  completed: boolean;
  optional: boolean;
}

// 퀘스트 보상
export interface QuestReward {
  type: 'experience' | 'gold' | 'item' | 'skill_point' | 'stat_point';
  id?: string;
  name?: string;
  quantity: number;
  description: string;
}

// 퀘스트 요구사항
export interface QuestRequirement {
  type: 'level' | 'quest' | 'item' | 'skill' | 'stat';
  target: string;
  value: number;
  description: string;
  met: boolean;
}

// 퀘스트 인터페이스
export interface Quest {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'main' | 'side' | 'daily' | 'weekly' | 'event' | 'guild';
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  requirements: QuestRequirement[];
  requiredLevel: number;
  maxLevel?: number;
  timeLimit?: number; // 제한 시간 (초)
  timeRemaining?: number; // 남은 시간 (초)
  startDate?: string;
  completedDate?: string;
  failedDate?: string;
  repeatType?: 'none' | 'daily' | 'weekly' | 'unlimited';
  repeatable: boolean;
  completedCount: number;
  giver?: string;
  location?: string;
  icon?: string;
  priority: number;
}

// 퀘스트 로그 Props
export interface QuestLogProps {
  quests: Quest[];
  categories: string[];
  onQuestAccept?: (questId: string) => void;
  onQuestAbandon?: (questId: string) => void;
  onQuestComplete?: (questId: string) => void;
  onQuestTrack?: (questId: string, track: boolean) => void;
  trackedQuests?: string[];
  playerLevel: number;
  className?: string;
  loading?: boolean;
}

// 퀘스트 타입별 색상
const typeColors = {
  main: 'from-purple-400 to-purple-600',
  side: 'from-blue-400 to-blue-600',
  daily: 'from-green-400 to-green-600',
  weekly: 'from-orange-400 to-orange-600',
  event: 'from-pink-400 to-pink-600',
  guild: 'from-red-400 to-red-600'
};

// 난이도별 색상
const difficultyColors = {
  easy: 'text-green-600',
  normal: 'text-blue-600',
  hard: 'text-orange-600',
  extreme: 'text-red-600'
};

// 상태별 색상
const statusColors = {
  available: 'border-green-400 bg-green-50',
  active: 'border-blue-400 bg-blue-50',
  completed: 'border-gray-400 bg-gray-50',
  failed: 'border-red-400 bg-red-50',
  locked: 'border-gray-300 bg-gray-100 opacity-50'
};

// 퀘스트 아이템 컴포넌트
const QuestItem: React.FC<{
  quest: Quest;
  isTracked?: boolean;
  onClick: (quest: Quest) => void;
  onTrackToggle?: (questId: string, track: boolean) => void;
  onAccept?: (questId: string) => void;
  onAbandon?: (questId: string) => void;
  compact?: boolean;
}> = ({ 
  quest, 
  isTracked = false, 
  onClick, 
  onTrackToggle, 
  onAccept, 
  onAbandon,
  compact = false 
}) => {
  const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
  const totalObjectives = quest.objectives.length;
  const progressPercentage = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;
  
  const typeGradient = typeColors[quest.type];
  const canAccept = quest.status === 'available' && quest.requirements.every(req => req.met);

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        statusColors[quest.status],
        isTracked && 'ring-2 ring-yellow-400'
      )}
      onClick={() => onClick(quest)}
    >
      <div className="flex items-start gap-3">
        {/* 퀘스트 아이콘 */}
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold',
          `bg-gradient-to-br ${typeGradient}`
        )}>
          {quest.icon || '📜'}
        </div>

        {/* 퀘스트 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{quest.name}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  quest.type === 'main' && 'bg-purple-100 text-purple-800',
                  quest.type === 'side' && 'bg-blue-100 text-blue-800',
                  quest.type === 'daily' && 'bg-green-100 text-green-800',
                  quest.type === 'weekly' && 'bg-orange-100 text-orange-800',
                  quest.type === 'event' && 'bg-pink-100 text-pink-800',
                  quest.type === 'guild' && 'bg-red-100 text-red-800'
                )}>
                  {quest.type.toUpperCase()}
                </span>
                <span className={difficultyColors[quest.difficulty]}>
                  {quest.difficulty.toUpperCase()}
                </span>
                <span className="text-gray-600">Lv.{quest.requiredLevel}</span>
                {quest.maxLevel && (
                  <span className="text-gray-600">~{quest.maxLevel}</span>
                )}
              </div>
            </div>

            {/* 추적/액션 버튼 */}
            <div className="flex gap-1 ml-2">
              {quest.status === 'active' && onTrackToggle && (
                <Button
                  variant={isTracked ? 'primary' : 'ghost'}
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrackToggle(quest.id, !isTracked);
                  }}
                >
                  {isTracked ? '📍' : '📌'}
                </Button>
              )}
              
              {canAccept && onAccept && (
                <Button
                  variant="success"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(quest.id);
                  }}
                >
                  수락
                </Button>
              )}
              
              {quest.status === 'active' && onAbandon && (
                <Button
                  variant="danger"
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAbandon(quest.id);
                  }}
                >
                  포기
                </Button>
              )}
            </div>
          </div>

          {/* 퀘스트 설명 */}
          {!compact && (
            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {quest.description}
            </p>
          )}

          {/* 진행도 */}
          {quest.status === 'active' && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">진행도</span>
                <span className="text-gray-600">
                  {completedObjectives} / {totalObjectives}
                </span>
              </div>
              <Progress
                value={progressPercentage}
                variant="default"
                size="sm"
              />
            </div>
          )}

          {/* 목표 목록 (활성 퀘스트만) */}
          {quest.status === 'active' && !compact && quest.objectives.length > 0 && (
            <div className="space-y-1">
              {quest.objectives.slice(0, 3).map(objective => (
                <div
                  key={objective.id}
                  className={cn(
                    'flex items-center justify-between text-sm p-2 rounded',
                    objective.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700',
                    objective.optional && 'border border-dashed'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {objective.completed ? '✅' : '⭕'}
                    </span>
                    <span className={objective.optional ? 'italic' : ''}>
                      {objective.description}
                      {objective.optional && ' (선택)'}
                    </span>
                  </div>
                  <span className="font-medium">
                    {objective.current} / {objective.required}
                  </span>
                </div>
              ))}
              {quest.objectives.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  ...{quest.objectives.length - 3}개 더
                </div>
              )}
            </div>
          )}

          {/* 시간 제한 */}
          {quest.timeRemaining && quest.timeRemaining > 0 && (
            <div className="mt-2 p-2 bg-yellow-100 rounded">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <span>⏰</span>
                <span>남은 시간: {Math.floor(quest.timeRemaining / 3600)}시간 {Math.floor((quest.timeRemaining % 3600) / 60)}분</span>
              </div>
            </div>
          )}

          {/* 위치 정보 */}
          {quest.location && (
            <div className="mt-2 text-xs text-gray-600">
              📍 {quest.location}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// 퀘스트 상세 모달
const QuestDetailModal: React.FC<{
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (questId: string) => void;
  onAbandon?: (questId: string) => void;
  onComplete?: (questId: string) => void;
  playerLevel: number;
}> = ({ quest, isOpen, onClose, onAccept, onAbandon, onComplete, playerLevel }) => {
  if (!quest) return null;

  const canAccept = quest.status === 'available' && quest.requirements.every(req => req.met);
  const canComplete = quest.status === 'active' && quest.objectives.every(obj => obj.completed || obj.optional);
  const typeGradient = typeColors[quest.type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quest.name}
      size="lg"
    >
      <div className="space-y-6">
        {/* 퀘스트 헤더 */}
        <div className="flex items-start gap-4">
          <div className={cn(
            'w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl',
            `bg-gradient-to-br ${typeGradient}`
          )}>
            {quest.icon || '📜'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                quest.type === 'main' && 'bg-purple-100 text-purple-800',
                quest.type === 'side' && 'bg-blue-100 text-blue-800',
                quest.type === 'daily' && 'bg-green-100 text-green-800',
                quest.type === 'weekly' && 'bg-orange-100 text-orange-800',
                quest.type === 'event' && 'bg-pink-100 text-pink-800',
                quest.type === 'guild' && 'bg-red-100 text-red-800'
              )}>
                {quest.type.toUpperCase()}
              </span>
              <span className={cn('font-medium', difficultyColors[quest.difficulty])}>
                {quest.difficulty.toUpperCase()}
              </span>
              <span className="text-gray-600">Lv.{quest.requiredLevel}</span>
            </div>
            
            <p className="text-gray-700">{quest.description}</p>
            
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              {quest.category && (
                <div>
                  <span className="text-gray-600">카테고리:</span>
                  <span className="ml-1 font-medium">{quest.category}</span>
                </div>
              )}
              {quest.giver && (
                <div>
                  <span className="text-gray-600">의뢰인:</span>
                  <span className="ml-1 font-medium">{quest.giver}</span>
                </div>
              )}
              {quest.location && (
                <div>
                  <span className="text-gray-600">위치:</span>
                  <span className="ml-1 font-medium">{quest.location}</span>
                </div>
              )}
              {quest.repeatable && (
                <div>
                  <span className="text-gray-600">반복:</span>
                  <span className="ml-1 font-medium">{quest.repeatType || 'unlimited'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 요구사항 */}
        {quest.requirements.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">요구사항</h4>
            <div className="space-y-2">
              {quest.requirements.map((req, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-2 rounded text-sm',
                    req.met ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{req.met ? '✅' : '❌'}</span>
                    <span>{req.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 목표 */}
        {quest.objectives.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">목표</h4>
            <div className="space-y-2">
              {quest.objectives.map(objective => (
                <div
                  key={objective.id}
                  className={cn(
                    'p-3 rounded border',
                    objective.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200',
                    objective.optional && 'border-dashed'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {objective.completed ? '✅' : '⭕'}
                      </span>
                      <span className={objective.optional ? 'italic' : ''}>
                        {objective.description}
                        {objective.optional && ' (선택사항)'}
                      </span>
                    </div>
                    <span className="font-medium">
                      {objective.current} / {objective.required}
                    </span>
                  </div>
                  
                  {!objective.completed && objective.required > 1 && (
                    <div className="mt-2">
                      <Progress
                        value={objective.current}
                        max={objective.required}
                        size="sm"
                        variant={objective.optional ? 'warning' : 'default'}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 보상 */}
        {quest.rewards.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">보상</h4>
            <div className="grid grid-cols-2 gap-3">
              {quest.rewards.map((reward, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {reward.type === 'experience' && '⭐'}
                      {reward.type === 'gold' && '💰'}
                      {reward.type === 'item' && '📦'}
                      {reward.type === 'skill_point' && '🔮'}
                      {reward.type === 'stat_point' && '💪'}
                    </span>
                    <div>
                      <div className="font-medium">
                        {reward.name || reward.type}
                      </div>
                      <div className="text-sm text-gray-600">
                        {reward.quantity > 1 ? `×${reward.quantity}` : ''}
                      </div>
                    </div>
                  </div>
                  {reward.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {reward.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시간 제한 정보 */}
        {quest.timeLimit && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded">
            <div className="flex items-center gap-2 text-orange-800">
              <span>⏰</span>
              <span className="font-medium">시간 제한: {Math.floor(quest.timeLimit / 3600)}시간</span>
            </div>
            {quest.timeRemaining && (
              <div className="text-sm text-orange-600 mt-1">
                남은 시간: {Math.floor(quest.timeRemaining / 3600)}시간 {Math.floor((quest.timeRemaining % 3600) / 60)}분
              </div>
            )}
          </div>
        )}
      </div>

      {/* 모달 푸터 */}
      <div className="flex gap-2 mt-6">
        {canAccept && onAccept && (
          <Button
            variant="success"
            onClick={() => {
              onAccept(quest.id);
              onClose();
            }}
          >
            퀘스트 수락
          </Button>
        )}
        
        {canComplete && onComplete && (
          <Button
            variant="primary"
            onClick={() => {
              onComplete(quest.id);
              onClose();
            }}
          >
            퀘스트 완료
          </Button>
        )}
        
        {quest.status === 'active' && onAbandon && (
          <Button
            variant="danger"
            onClick={() => {
              onAbandon(quest.id);
              onClose();
            }}
          >
            퀘스트 포기
          </Button>
        )}
        
        <Button variant="ghost" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
};

// 메인 퀘스트 로그 컴포넌트
export const QuestLog: React.FC<QuestLogProps> = ({
  quests,
  categories,
  onQuestAccept,
  onQuestAbandon,
  onQuestComplete,
  onQuestTrack,
  trackedQuests = [],
  playerLevel,
  className,
  loading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'available' | 'active' | 'completed'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'type' | 'difficulty' | 'priority'>('priority');
  
  const { isOpen, openModal, closeModal } = useModal();

  // 필터링된 퀘스트들
  const filteredQuests = useMemo(() => {
    return quests.filter(quest => {
      // 탭 필터
      if (selectedTab !== 'all' && quest.status !== selectedTab) {
        return false;
      }
      
      // 카테고리 필터
      if (selectedCategory !== 'all' && quest.category !== selectedCategory) {
        return false;
      }
      
      // 검색 필터
      if (searchTerm && !quest.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !quest.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [quests, selectedTab, selectedCategory, searchTerm]);

  // 정렬된 퀘스트들
  const sortedQuests = useMemo(() => {
    return [...filteredQuests].sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priority - a.priority;
      }
      if (sortBy === 'level') {
        return a.requiredLevel - b.requiredLevel;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      }
      if (sortBy === 'difficulty') {
        const difficultyOrder = { easy: 1, normal: 2, hard: 3, extreme: 4 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      }
      return 0;
    });
  }, [filteredQuests, sortBy]);

  // 퀘스트 통계
  const questStats = useMemo(() => {
    const total = quests.length;
    const available = quests.filter(q => q.status === 'available').length;
    const active = quests.filter(q => q.status === 'active').length;
    const completed = quests.filter(q => q.status === 'completed').length;
    const failed = quests.filter(q => q.status === 'failed').length;
    
    return { total, available, active, completed, failed };
  }, [quests]);

  // 퀘스트 클릭 핸들러
  const handleQuestClick = useCallback((quest: Quest) => {
    setSelectedQuest(quest);
    openModal();
  }, [openModal]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loading text="퀘스트 로딩중..." size="lg" />
      </div>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">퀘스트 로그</h2>
          <div className="text-sm text-gray-600">
            진행중: {questStats.active} | 완료: {questStats.completed}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-bold text-lg">{questStats.total}</div>
            <div className="text-xs text-gray-600">전체</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-bold text-lg text-green-600">{questStats.available}</div>
            <div className="text-xs text-gray-600">수락 가능</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-bold text-lg text-blue-600">{questStats.active}</div>
            <div className="text-xs text-gray-600">진행중</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-bold text-lg text-gray-600">{questStats.completed}</div>
            <div className="text-xs text-gray-600">완료</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="font-bold text-lg text-red-600">{questStats.failed}</div>
            <div className="text-xs text-gray-600">실패</div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: '전체', count: questStats.total },
            { key: 'available', label: '수락 가능', count: questStats.available },
            { key: 'active', label: '진행중', count: questStats.active },
            { key: 'completed', label: '완료', count: questStats.completed }
          ].map(tab => (
            <Button
              key={tab.key}
              variant={selectedTab === tab.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            >
              {tab.label} ({tab.count})
            </Button>
          ))}
        </div>

        {/* 검색 및 필터 */}
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="퀘스트 검색..."
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
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="priority">우선순위</option>
            <option value="name">이름</option>
            <option value="level">레벨</option>
            <option value="type">타입</option>
            <option value="difficulty">난이도</option>
          </select>
        </div>
      </div>

      {/* 퀘스트 목록 */}
      <div className="space-y-3">
        {sortedQuests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedCategory !== 'all' ? 
              '검색 조건에 맞는 퀘스트가 없습니다.' : 
              '퀘스트가 없습니다.'}
          </div>
        ) : (
          sortedQuests.map(quest => (
            <QuestItem
              key={quest.id}
              quest={quest}
              isTracked={trackedQuests.includes(quest.id)}
              onClick={handleQuestClick}
              onTrackToggle={onQuestTrack}
              onAccept={onQuestAccept}
              onAbandon={onQuestAbandon}
            />
          ))
        )}
      </div>

      {/* 퀘스트 상세 모달 */}
      <QuestDetailModal
        quest={selectedQuest}
        isOpen={isOpen}
        onClose={closeModal}
        onAccept={onQuestAccept}
        onAbandon={onQuestAbandon}
        onComplete={onQuestComplete}
        playerLevel={playerLevel}
      />
    </Card>
  );
};

export default QuestLog;