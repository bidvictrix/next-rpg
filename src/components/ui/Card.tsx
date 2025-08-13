/**
 * 재사용 가능한 카드 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

// 카드 변형 타입
export type CardVariant = 
  | 'default' 
  | 'elevated' 
  | 'outlined' 
  | 'flat' 
  | 'game' 
  | 'magical' 
  | 'legendary'
  | 'item'
  | 'character';

// 카드 크기 타입
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

// 카드 호버 효과 타입
export type CardHoverEffect = 'none' | 'lift' | 'glow' | 'scale' | 'tilt';

// 기본 카드 Props
export interface CardProps {
  variant?: CardVariant;
  size?: CardSize;
  hover?: CardHoverEffect;
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

// 카드 헤더 Props
export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

// 카드 본문 Props
export interface CardContentProps {
  className?: string;
  children?: React.ReactNode;
}

// 카드 푸터 Props
export interface CardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

// 아이템 카드 Props
export interface ItemCardProps extends Omit<CardProps, 'variant' | 'children'> {
  item: {
    id: string;
    name: string;
    description?: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    icon?: string;
    level?: number;
    quantity?: number;
    stats?: Record<string, number>;
  };
  showStats?: boolean;
  showQuantity?: boolean;
  showLevel?: boolean;
  onItemClick?: (itemId: string) => void;
}

// 캐릭터 카드 Props
export interface CharacterCardProps extends Omit<CardProps, 'variant' | 'children'> {
  character: {
    id: string;
    name: string;
    class: string;
    level: number;
    avatar?: string;
    hp: number;
    maxHp: number;
    mp?: number;
    maxMp?: number;
    exp?: number;
    maxExp?: number;
  };
  compact?: boolean;
  showProgress?: boolean;
  onCharacterClick?: (characterId: string) => void;
}

// 카드 스타일 생성 함수
const getCardClasses = (
  variant: CardVariant,
  size: CardSize,
  hover: CardHoverEffect,
  clickable: boolean,
  selected: boolean,
  disabled: boolean,
  loading: boolean
): string => {
  const baseClasses = [
    'rounded-lg',
    'transition-all',
    'duration-200',
    'overflow-hidden'
  ];

  // 크기별 클래스
  const sizeClasses = {
    sm: ['p-3'],
    md: ['p-4'],
    lg: ['p-6'],
    xl: ['p-8']
  };

  // 변형별 클래스
  const variantClasses = {
    default: [
      'bg-white',
      'border',
      'border-gray-200',
      'shadow-sm'
    ],
    elevated: [
      'bg-white',
      'shadow-lg',
      'border',
      'border-gray-100'
    ],
    outlined: [
      'bg-transparent',
      'border-2',
      'border-gray-300'
    ],
    flat: [
      'bg-gray-50',
      'border-0'
    ],
    game: [
      'bg-gradient-to-b',
      'from-amber-50',
      'to-amber-100',
      'border-2',
      'border-amber-300',
      'shadow-lg',
      'shadow-amber-500/20'
    ],
    magical: [
      'bg-gradient-to-br',
      'from-purple-50',
      'via-pink-50',
      'to-purple-100',
      'border-2',
      'border-purple-300',
      'shadow-lg',
      'shadow-purple-500/25',
      'relative',
      'overflow-hidden'
    ],
    legendary: [
      'bg-gradient-to-br',
      'from-orange-50',
      'via-yellow-50',
      'to-red-100',
      'border-2',
      'border-orange-400',
      'shadow-xl',
      'shadow-orange-500/30',
      'relative',
      'overflow-hidden'
    ],
    item: [
      'bg-white',
      'border-2',
      'shadow-md',
      'relative'
    ],
    character: [
      'bg-gradient-to-br',
      'from-blue-50',
      'to-indigo-100',
      'border-2',
      'border-blue-300',
      'shadow-lg'
    ]
  };

  // 호버 효과 클래스
  const hoverClasses = {
    none: [],
    lift: ['hover:-translate-y-1', 'hover:shadow-lg'],
    glow: ['hover:shadow-2xl', 'hover:shadow-blue-500/20'],
    scale: ['hover:scale-105'],
    tilt: ['hover:rotate-1', 'hover:scale-105']
  };

  // 상태 클래스
  const stateClasses = [];
  
  if (clickable && !disabled) {
    stateClasses.push('cursor-pointer');
    if (hover !== 'none') {
      stateClasses.push(...hoverClasses[hover]);
    }
  }

  if (selected) {
    stateClasses.push('ring-2', 'ring-blue-500', 'ring-offset-2');
  }

  if (disabled) {
    stateClasses.push('opacity-50', 'cursor-not-allowed');
  }

  if (loading) {
    stateClasses.push('animate-pulse');
  }

  return cn(
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    ...stateClasses
  );
};

// 희소성별 색상 가져오기
const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'border-gray-400',
    uncommon: 'border-green-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-orange-400',
    mythic: 'border-pink-400'
  };
  return colors[rarity as keyof typeof colors] || colors.common;
};

// 로딩 오버레이 컴포넌트
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// 메인 Card 컴포넌트
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  hover = 'none',
  clickable = false,
  selected = false,
  disabled = false,
  loading = false,
  className,
  onClick,
  children
}) => {
  const cardClasses = getCardClasses(
    variant,
    size,
    hover,
    clickable,
    selected,
    disabled,
    loading
  );

  const handleClick = () => {
    if (clickable && !disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(cardClasses, className, { relative: loading })}
      onClick={handleClick}
    >
      {/* 마법/전설 카드의 특수 효과 */}
      {variant === 'magical' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      )}
      {variant === 'legendary' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1500" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400" />
        </>
      )}

      {children}
      
      {loading && <LoadingOverlay />}
    </div>
  );
};

// Card Header 컴포넌트
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  className,
  children
}) => (
  <div className={cn('mb-4', className)}>
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
    {children}
  </div>
);

// Card Content 컴포넌트
export const CardContent: React.FC<CardContentProps> = ({
  className,
  children
}) => (
  <div className={cn('text-gray-700', className)}>
    {children}
  </div>
);

// Card Footer 컴포넌트
export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children
}) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>
    {children}
  </div>
);

// 아이템 카드 컴포넌트
export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  showStats = true,
  showQuantity = true,
  showLevel = true,
  onItemClick,
  ...cardProps
}) => {
  const rarityColor = getRarityColor(item.rarity);

  return (
    <Card
      variant="item"
      hover="lift"
      clickable={!!onItemClick}
      onClick={() => onItemClick?.(item.id)}
      className={cn(rarityColor, 'min-h-[200px]')}
      {...cardProps}
    >
      <div className="flex flex-col h-full">
        {/* 아이템 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          {item.icon && (
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
              {item.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                item.rarity === 'common' && 'bg-gray-100 text-gray-800',
                item.rarity === 'uncommon' && 'bg-green-100 text-green-800',
                item.rarity === 'rare' && 'bg-blue-100 text-blue-800',
                item.rarity === 'epic' && 'bg-purple-100 text-purple-800',
                item.rarity === 'legendary' && 'bg-orange-100 text-orange-800',
                item.rarity === 'mythic' && 'bg-pink-100 text-pink-800'
              )}>
                {item.rarity.toUpperCase()}
              </span>
              {showLevel && item.level && (
                <span className="text-gray-600">Lv.{item.level}</span>
              )}
            </div>
          </div>
          {showQuantity && item.quantity && item.quantity > 1 && (
            <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
              {item.quantity}
            </div>
          )}
        </div>

        {/* 아이템 설명 */}
        {item.description && (
          <p className="text-sm text-gray-600 mb-3 flex-1">
            {item.description}
          </p>
        )}

        {/* 아이템 스탯 */}
        {showStats && item.stats && Object.keys(item.stats).length > 0 && (
          <div className="mt-auto">
            <div className="border-t border-gray-200 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <div key={stat} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{stat}:</span>
                    <span className="font-medium text-gray-900">
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// 캐릭터 카드 컴포넌트
export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  compact = false,
  showProgress = true,
  onCharacterClick,
  ...cardProps
}) => {
  const hpPercent = (character.hp / character.maxHp) * 100;
  const mpPercent = character.mp && character.maxMp 
    ? (character.mp / character.maxMp) * 100 
    : 0;
  const expPercent = character.exp && character.maxExp 
    ? (character.exp / character.maxExp) * 100 
    : 0;

  return (
    <Card
      variant="character"
      hover="lift"
      clickable={!!onCharacterClick}
      onClick={() => onCharacterClick?.(character.id)}
      size={compact ? 'sm' : 'md'}
      {...cardProps}
    >
      <div className="flex items-center gap-4">
        {/* 캐릭터 아바타 */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {character.avatar || character.name.charAt(0)}
        </div>

        {/* 캐릭터 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {character.name}
            </h3>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Lv.{character.level}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {character.class}
          </p>

          {/* 진행률 바들 */}
          {showProgress && (
            <div className="space-y-1">
              {/* HP 바 */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-600 min-w-[20px]">HP</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
                <span className="text-gray-600 min-w-[40px] text-right">
                  {character.hp}/{character.maxHp}
                </span>
              </div>

              {/* MP 바 */}
              {character.mp !== undefined && character.maxMp !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-blue-600 min-w-[20px]">MP</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${mpPercent}%` }}
                    />
                  </div>
                  <span className="text-gray-600 min-w-[40px] text-right">
                    {character.mp}/{character.maxMp}
                  </span>
                </div>
              )}

              {/* EXP 바 */}
              {character.exp !== undefined && character.maxExp !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-yellow-600 min-w-[20px]">EXP</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${expPercent}%` }}
                    />
                  </div>
                  <span className="text-gray-600 min-w-[40px] text-right">
                    {Math.floor(expPercent)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// 스탯 카드 컴포넌트
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
} & Omit<CardProps, 'children'>> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
  ...cardProps
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      value: 'text-blue-900'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      value: 'text-green-900'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      value: 'text-red-900'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      value: 'text-yellow-900'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      value: 'text-purple-900'
    }
  };

  const styles = colorClasses[color];
  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️';
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card
      variant="outlined"
      className={cn(styles.bg, styles.border)}
      {...cardProps}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className={cn('text-2xl font-bold mt-1', styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={cn('flex items-center gap-1 text-xs mt-2', trendColor)}>
              <span>{trendIcon}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('text-3xl', styles.icon)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// 게임 특화 카드들
export const GameCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="game" {...props} />
);

export const MagicalCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="magical" {...props} />
);

export const LegendaryCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card variant="legendary" {...props} />
);

export default Card;