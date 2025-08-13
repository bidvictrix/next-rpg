/**
 * 재사용 가능한 프로그레스 바 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

// 프로그레스 변형 타입
export type ProgressVariant = 
  | 'default' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  | 'hp' 
  | 'mp' 
  | 'exp' 
  | 'skill'
  | 'game'
  | 'magical';

// 프로그레스 크기 타입
export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 프로그레스 방향 타입
export type ProgressDirection = 'horizontal' | 'vertical';

// 기본 프로그레스 Props
export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  direction?: ProgressDirection;
  animated?: boolean;
  striped?: boolean;
  showLabel?: boolean;
  showPercentage?: boolean;
  showValue?: boolean;
  label?: string;
  className?: string;
  barClassName?: string;
  labelClassName?: string;
  format?: (value: number, max: number) => string;
  color?: string;
  backgroundColor?: string;
  glowing?: boolean;
}

// 스탯 프로그레스 Props
export interface StatProgressProps extends Omit<ProgressProps, 'variant'> {
  statName: string;
  statIcon?: React.ReactNode;
  current: number;
  maximum: number;
  showCurrent?: boolean;
  showMaximum?: boolean;
  compact?: boolean;
}

// 원형 프로그레스 Props
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
  glowing?: boolean;
}

// 멀티 프로그레스 Props
export interface MultiProgressProps {
  segments: Array<{
    value: number;
    variant?: ProgressVariant;
    label?: string;
    color?: string;
  }>;
  max?: number;
  size?: ProgressSize;
  showLabels?: boolean;
  className?: string;
}

// 크기별 클래스 가져오기
const getSizeClasses = (size: ProgressSize, direction: ProgressDirection) => {
  const sizes = {
    xs: {
      horizontal: 'h-1',
      vertical: 'w-1',
      text: 'text-xs'
    },
    sm: {
      horizontal: 'h-2',
      vertical: 'w-2',
      text: 'text-sm'
    },
    md: {
      horizontal: 'h-3',
      vertical: 'w-3',
      text: 'text-base'
    },
    lg: {
      horizontal: 'h-4',
      vertical: 'w-4',
      text: 'text-lg'
    },
    xl: {
      horizontal: 'h-6',
      vertical: 'w-6',
      text: 'text-xl'
    }
  };
  
  return {
    bar: sizes[size][direction],
    text: sizes[size].text
  };
};

// 변형별 클래스 가져오기
const getVariantClasses = (variant: ProgressVariant, glowing: boolean = false) => {
  const variants = {
    default: {
      bg: 'bg-blue-600',
      glow: glowing ? 'shadow-lg shadow-blue-500/50' : ''
    },
    success: {
      bg: 'bg-green-600',
      glow: glowing ? 'shadow-lg shadow-green-500/50' : ''
    },
    warning: {
      bg: 'bg-yellow-600',
      glow: glowing ? 'shadow-lg shadow-yellow-500/50' : ''
    },
    danger: {
      bg: 'bg-red-600',
      glow: glowing ? 'shadow-lg shadow-red-500/50' : ''
    },
    info: {
      bg: 'bg-cyan-600',
      glow: glowing ? 'shadow-lg shadow-cyan-500/50' : ''
    },
    hp: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      glow: glowing ? 'shadow-lg shadow-red-500/50' : ''
    },
    mp: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      glow: glowing ? 'shadow-lg shadow-blue-500/50' : ''
    },
    exp: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      glow: glowing ? 'shadow-lg shadow-yellow-500/50' : ''
    },
    skill: {
      bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      glow: glowing ? 'shadow-lg shadow-purple-500/50' : ''
    },
    game: {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
      glow: glowing ? 'shadow-lg shadow-amber-500/50' : ''
    },
    magical: {
      bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600',
      glow: glowing ? 'shadow-lg shadow-purple-500/50 animate-pulse' : ''
    }
  };

  return variants[variant] || variants.default;
};

// 메인 Progress 컴포넌트
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  direction = 'horizontal',
  animated = false,
  striped = false,
  showLabel = false,
  showPercentage = false,
  showValue = false,
  label,
  className,
  barClassName,
  labelClassName,
  format,
  color,
  backgroundColor = 'bg-gray-200',
  glowing = false
}) => {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;
  
  const sizeClasses = getSizeClasses(size, direction);
  const variantClasses = getVariantClasses(variant, glowing);
  
  const formattedValue = format ? format(clampedValue, max) : `${clampedValue}`;
  const percentageText = `${Math.round(percentage)}%`;

  const progressStyle = direction === 'horizontal' 
    ? { width: `${percentage}%` }
    : { height: `${percentage}%` };

  return (
    <div className={cn('relative', className)}>
      {/* 라벨 */}
      {(showLabel || label) && (
        <div className={cn(
          'flex justify-between items-center mb-1',
          sizeClasses.text,
          labelClassName
        )}>
          <span className="font-medium text-gray-700">
            {label || (showValue ? formattedValue : '')}
          </span>
          {showPercentage && (
            <span className="text-gray-600">
              {percentageText}
            </span>
          )}
        </div>
      )}

      {/* 프로그레스 바 컨테이너 */}
      <div className={cn(
        'rounded-full overflow-hidden',
        backgroundColor,
        direction === 'horizontal' ? sizeClasses.bar : `${sizeClasses.bar} h-full`,
        direction === 'vertical' && 'flex items-end'
      )}>
        {/* 프로그레스 바 */}
        <div
          className={cn(
            'rounded-full transition-all duration-300 ease-out relative',
            color || variantClasses.bg,
            variantClasses.glow,
            animated && 'transition-all duration-500',
            striped && 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_20px]',
            direction === 'vertical' && 'w-full',
            barClassName
          )}
          style={progressStyle}
        >
          {/* 스트라이프 애니메이션 */}
          {striped && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:20px_20px] animate-pulse" />
          )}
          
          {/* 글로우 효과 */}
          {glowing && variant === 'magical' && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/50 via-pink-400/50 to-purple-400/50 animate-pulse rounded-full" />
          )}
        </div>
      </div>

      {/* 값 표시 (바 위에) */}
      {showValue && !showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'font-bold text-white text-shadow',
            sizeClasses.text
          )}>
            {formattedValue}
          </span>
        </div>
      )}
    </div>
  );
};

// 스탯 프로그레스 컴포넌트
export const StatProgress: React.FC<StatProgressProps> = ({
  statName,
  statIcon,
  current,
  maximum,
  showCurrent = true,
  showMaximum = true,
  compact = false,
  ...progressProps
}) => {
  const percentage = maximum > 0 ? (current / maximum) * 100 : 0;
  const isLow = percentage < 25;
  const isCritical = percentage < 10;

  // 스탯에 따른 변형 자동 결정
  const getStatVariant = (name: string): ProgressVariant => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hp') || lowerName.includes('health')) return 'hp';
    if (lowerName.includes('mp') || lowerName.includes('mana')) return 'mp';
    if (lowerName.includes('exp') || lowerName.includes('experience')) return 'exp';
    if (lowerName.includes('skill')) return 'skill';
    return 'default';
  };

  const variant = progressProps.variant || getStatVariant(statName);

  return (
    <div className={cn('space-y-1', compact && 'space-y-0')}>
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statIcon && <span className="text-sm">{statIcon}</span>}
            <span className="text-sm font-medium text-gray-700">
              {statName}
            </span>
          </div>
          {(showCurrent || showMaximum) && (
            <span className={cn(
              'text-sm font-medium',
              isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-600'
            )}>
              {showCurrent && showMaximum ? `${current} / ${maximum}` :
               showCurrent ? `${current}` :
               showMaximum ? `${maximum}` : ''}
            </span>
          )}
        </div>
      )}
      
      <Progress
        value={current}
        max={maximum}
        variant={variant}
        glowing={isCritical}
        animated={isLow}
        size={compact ? 'xs' : 'sm'}
        {...progressProps}
      />
      
      {compact && (showCurrent || showMaximum) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {statIcon && <span>{statIcon}</span>}
            <span className="font-medium text-gray-600">{statName}</span>
          </div>
          <span className={cn(
            'font-medium',
            isCritical ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-600'
          )}>
            {showCurrent && showMaximum ? `${current}/${maximum}` :
             showCurrent ? `${current}` :
             showMaximum ? `${maximum}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

// 원형 프로그레스 컴포넌트
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showLabel = false,
  showPercentage = true,
  label,
  className,
  animated = true,
  glowing = false
}) => {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (clampedValue / max) * 100 : 0;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  const variantClasses = getVariantClasses(variant, glowing);
  
  // SVG 색상 추출 (TailwindCSS 클래스에서)
  const getStrokeColor = (bgClass: string) => {
    const colorMap: Record<string, string> = {
      'bg-blue-600': '#2563eb',
      'bg-green-600': '#16a34a',
      'bg-red-600': '#dc2626',
      'bg-yellow-600': '#ca8a04',
      'bg-purple-600': '#9333ea',
      'bg-cyan-600': '#0891b2'
    };
    
    return colorMap[bgClass] || '#2563eb';
  };

  const strokeColor = getStrokeColor(variantClasses.bg.split(' ')[0]);

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      glowing && variantClasses.glow,
      className
    )}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* 프로그레스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            animated && 'transition-all duration-500 ease-out'
          )}
        />
        
        {/* 글로우 효과 */}
        {glowing && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth / 2}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="opacity-50 animate-pulse"
            filter="blur(2px)"
          />
        )}
      </svg>
      
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-2xl font-bold text-gray-800">
            {Math.round(percentage)}%
          </span>
        )}
        {(showLabel || label) && (
          <span className="text-sm text-gray-600 mt-1">
            {label || `${clampedValue}/${max}`}
          </span>
        )}
      </div>
    </div>
  );
};

// 멀티 프로그레스 컴포넌트
export const MultiProgress: React.FC<MultiProgressProps> = ({
  segments,
  max = 100,
  size = 'md',
  showLabels = false,
  className
}) => {
  const sizeClasses = getSizeClasses(size, 'horizontal');
  const totalValue = segments.reduce((sum, segment) => sum + segment.value, 0);
  
  return (
    <div className={cn('space-y-2', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span>Total: {totalValue}</span>
          <span>Max: {max}</span>
        </div>
      )}
      
      <div className={cn(
        'bg-gray-200 rounded-full overflow-hidden flex',
        sizeClasses.bar
      )}>
        {segments.map((segment, index) => {
          const segmentPercentage = max > 0 ? (segment.value / max) * 100 : 0;
          const variantClasses = segment.color ? 
            { bg: segment.color } : 
            getVariantClasses(segment.variant || 'default');
          
          return (
            <div
              key={index}
              className={cn(
                'transition-all duration-300',
                variantClasses.bg,
                index === 0 && 'rounded-l-full',
                index === segments.length - 1 && 'rounded-r-full'
              )}
              style={{ width: `${segmentPercentage}%` }}
              title={segment.label}
            />
          );
        })}
      </div>
      
      {showLabels && (
        <div className="space-y-1">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    segment.color ? segment.color : getVariantClasses(segment.variant || 'default').bg
                  )}
                />
                <span>{segment.label || `Segment ${index + 1}`}</span>
              </div>
              <span>{segment.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 게임 특화 프로그레스 컴포넌트들
export const HPProgress: React.FC<Omit<ProgressProps, 'variant'>> = (props) => (
  <Progress variant="hp" glowing={props.value < 25} {...props} />
);

export const MPProgress: React.FC<Omit<ProgressProps, 'variant'>> = (props) => (
  <Progress variant="mp" {...props} />
);

export const EXPProgress: React.FC<Omit<ProgressProps, 'variant'>> = (props) => (
  <Progress variant="exp" animated striped {...props} />
);

export const SkillProgress: React.FC<Omit<ProgressProps, 'variant'>> = (props) => (
  <Progress variant="skill" {...props} />
);

// 캐릭터 스탯 패널 컴포넌트
export const CharacterStatsPanel: React.FC<{
  stats: {
    hp: { current: number; max: number; };
    mp: { current: number; max: number; };
    exp: { current: number; max: number; };
  };
  compact?: boolean;
  className?: string;
}> = ({ stats, compact = false, className }) => (
  <div className={cn('space-y-2', className)}>
    <StatProgress
      statName="HP"
      statIcon="❤️"
      current={stats.hp.current}
      maximum={stats.hp.max}
      variant="hp"
      compact={compact}
      glowing={stats.hp.current < stats.hp.max * 0.25}
    />
    
    <StatProgress
      statName="MP"
      statIcon="💙"
      current={stats.mp.current}
      maximum={stats.mp.max}
      variant="mp"
      compact={compact}
    />
    
    <StatProgress
      statName="EXP"
      statIcon="⭐"
      current={stats.exp.current}
      maximum={stats.exp.max}
      variant="exp"
      compact={compact}
      animated
      striped
    />
  </div>
);

export default Progress;