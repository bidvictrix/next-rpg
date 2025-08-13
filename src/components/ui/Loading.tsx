/**
 * 재사용 가능한 로딩 컴포넌트
 */

import React from 'react';
import { cn } from '@/lib/utils';

// 로딩 스피너 타입
export type LoadingSpinnerType = 
  | 'default' 
  | 'dots' 
  | 'pulse' 
  | 'bounce' 
  | 'wave' 
  | 'ring' 
  | 'dual-ring'
  | 'game'
  | 'magical'
  | 'sword'
  | 'shield';

// 로딩 크기 타입
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 로딩 위치 타입
export type LoadingPosition = 'inline' | 'center' | 'absolute' | 'fixed';

// 기본 로딩 Props
export interface LoadingProps {
  type?: LoadingSpinnerType;
  size?: LoadingSize;
  position?: LoadingPosition;
  text?: string;
  color?: string;
  className?: string;
  overlay?: boolean;
  overlayClassName?: string;
}

// 페이지 로딩 Props
export interface PageLoadingProps extends Omit<LoadingProps, 'position'> {
  fullScreen?: boolean;
  background?: string;
}

// 버튼 로딩 Props
export interface ButtonLoadingProps extends Omit<LoadingProps, 'position' | 'overlay'> {
  inline?: boolean;
}

// 프로그레스 로딩 Props
export interface ProgressLoadingProps extends Omit<LoadingProps, 'type'> {
  progress: number;
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

// 스켈레톤 로딩 Props
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  count?: number;
  animate?: boolean;
}

// 크기별 클래스
const getSizeClasses = (size: LoadingSize) => {
  const sizes = {
    xs: { spinner: 'w-3 h-3', text: 'text-xs' },
    sm: { spinner: 'w-4 h-4', text: 'text-sm' },
    md: { spinner: 'w-6 h-6', text: 'text-base' },
    lg: { spinner: 'w-8 h-8', text: 'text-lg' },
    xl: { spinner: 'w-12 h-12', text: 'text-xl' }
  };
  return sizes[size];
};

// 위치별 클래스
const getPositionClasses = (position: LoadingPosition) => {
  const positions = {
    inline: 'inline-flex items-center',
    center: 'flex items-center justify-center',
    absolute: 'absolute inset-0 flex items-center justify-center',
    fixed: 'fixed inset-0 flex items-center justify-center z-50'
  };
  return positions[position];
};

// 기본 스피너 컴포넌트
const DefaultSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'text-blue-600' 
}) => (
  <svg
    className={cn('animate-spin', className, color)}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// 점 로딩 컴포넌트
const DotsSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'bg-blue-600' 
}) => (
  <div className={cn('flex space-x-1', className)}>
    <div className={cn('w-2 h-2 rounded-full animate-bounce', color)} style={{ animationDelay: '0ms' }} />
    <div className={cn('w-2 h-2 rounded-full animate-bounce', color)} style={{ animationDelay: '150ms' }} />
    <div className={cn('w-2 h-2 rounded-full animate-bounce', color)} style={{ animationDelay: '300ms' }} />
  </div>
);

// 펄스 로딩 컴포넌트
const PulseSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'bg-blue-600' 
}) => (
  <div className={cn('rounded-full animate-pulse', className, color)} />
);

// 바운스 로딩 컴포넌트
const BounceSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'bg-blue-600' 
}) => (
  <div className="flex justify-center items-center space-x-1">
    <div className={cn('w-3 h-3 rounded-full animate-bounce', color)} style={{ animationDelay: '0ms' }} />
    <div className={cn('w-3 h-3 rounded-full animate-bounce', color)} style={{ animationDelay: '200ms' }} />
    <div className={cn('w-3 h-3 rounded-full animate-bounce', color)} style={{ animationDelay: '400ms' }} />
  </div>
);

// 웨이브 로딩 컴포넌트
const WaveSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'bg-blue-600' 
}) => (
  <div className="flex items-end space-x-1">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={cn('w-1 h-8 animate-pulse', color)}
        style={{
          animationDelay: `${i * 100}ms`,
          animationDuration: '1s'
        }}
      />
    ))}
  </div>
);

// 링 로딩 컴포넌트
const RingSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'border-blue-600' 
}) => (
  <div
    className={cn(
      'animate-spin rounded-full border-4 border-gray-200 border-t-transparent',
      className,
      color.replace('border-', 'border-t-')
    )}
  />
);

// 듀얼 링 로딩 컴포넌트
const DualRingSpinner: React.FC<{ className: string; color?: string }> = ({ 
  className, 
  color = 'border-blue-600' 
}) => (
  <div className="relative">
    <div
      className={cn(
        'animate-spin rounded-full border-4 border-gray-200 border-t-transparent',
        className,
        color.replace('border-', 'border-t-')
      )}
    />
    <div
      className={cn(
        'absolute top-1 left-1 animate-spin rounded-full border-2 border-gray-300 border-b-transparent',
        className.replace('w-', 'w-').replace('h-', 'h-'),
        color.replace('border-', 'border-b-')
      )}
      style={{
        width: 'calc(100% - 8px)',
        height: 'calc(100% - 8px)',
        animationDirection: 'reverse',
        animationDuration: '1.5s'
      }}
    />
  </div>
);

// 게임 로딩 컴포넌트 (검과 방패)
const GameSpinner: React.FC<{ className: string }> = ({ className }) => (
  <div className={cn('relative', className)}>
    <div className="animate-spin text-4xl">⚔️</div>
    <div className="absolute inset-0 animate-spin text-2xl" style={{ animationDirection: 'reverse', animationDuration: '2s' }}>
      🛡️
    </div>
  </div>
);

// 마법 로딩 컴포넌트
const MagicalSpinner: React.FC<{ className: string }> = ({ className }) => (
  <div className={cn('relative', className)}>
    <div className="animate-spin text-4xl">✨</div>
    <div className="absolute inset-0 animate-pulse text-3xl opacity-50">💫</div>
    <div className="absolute inset-0 animate-bounce text-2xl">🌟</div>
  </div>
);

// 검 로딩 컴포넌트
const SwordSpinner: React.FC<{ className: string }> = ({ className }) => (
  <div className={cn('animate-bounce text-4xl', className)}>⚔️</div>
);

// 방패 로딩 컴포넌트
const ShieldSpinner: React.FC<{ className: string }> = ({ className }) => (
  <div className={cn('animate-pulse text-4xl', className)}>🛡️</div>
);

// 스피너 컴포넌트 매핑
const getSpinnerComponent = (type: LoadingSpinnerType) => {
  const spinners = {
    default: DefaultSpinner,
    dots: DotsSpinner,
    pulse: PulseSpinner,
    bounce: BounceSpinner,
    wave: WaveSpinner,
    ring: RingSpinner,
    'dual-ring': DualRingSpinner,
    game: GameSpinner,
    magical: MagicalSpinner,
    sword: SwordSpinner,
    shield: ShieldSpinner
  };
  return spinners[type] || DefaultSpinner;
};

// 메인 Loading 컴포넌트
export const Loading: React.FC<LoadingProps> = ({
  type = 'default',
  size = 'md',
  position = 'inline',
  text,
  color,
  className,
  overlay = false,
  overlayClassName
}) => {
  const SpinnerComponent = getSpinnerComponent(type);
  const sizeClasses = getSizeClasses(size);
  const positionClasses = getPositionClasses(position);

  const content = (
    <div className={cn(positionClasses, 'gap-3', className)}>
      <SpinnerComponent className={sizeClasses.spinner} color={color} />
      {text && (
        <span className={cn('font-medium text-gray-600', sizeClasses.text)}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className={cn('absolute inset-0 bg-white/80 z-10', overlayClassName)}>
        {content}
      </div>
    );
  }

  return content;
};

// 페이지 로딩 컴포넌트
export const PageLoading: React.FC<PageLoadingProps> = ({
  fullScreen = true,
  background = 'bg-white',
  ...props
}) => (
  <div className={cn(
    fullScreen ? 'fixed inset-0' : 'absolute inset-0',
    'flex items-center justify-center z-50',
    background
  )}>
    <Loading
      position="center"
      size="lg"
      text="로딩중..."
      {...props}
    />
  </div>
);

// 버튼 로딩 컴포넌트
export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  inline = true,
  size = 'sm',
  ...props
}) => (
  <Loading
    position={inline ? 'inline' : 'center'}
    size={size}
    type="default"
    {...props}
  />
);

// 프로그레스 바 컴포넌트
export const ProgressBar: React.FC<ProgressLoadingProps> = ({
  progress,
  showPercentage = true,
  animated = true,
  striped = false,
  variant = 'default',
  text,
  className
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-cyan-600'
  };

  return (
    <div className={cn('w-full', className)}>
      {(text || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {text && <span className="text-sm font-medium text-gray-700">{text}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            variantClasses[variant],
            animated && 'transition-all duration-500 ease-out',
            striped && 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_20px] animate-pulse'
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

// 원형 프로그레스 컴포넌트
export const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  className?: string;
}> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  className
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
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
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* 프로그레스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

// 스켈레톤 로딩 컴포넌트
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className,
  rounded = false,
  count = 1,
  animate = true
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={cn(
        'bg-gray-200',
        animate && 'animate-pulse',
        rounded ? 'rounded-full' : 'rounded',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  ));

  return count === 1 ? skeletons[0] : <div className="space-y-2">{skeletons}</div>;
};

// 스켈레톤 텍스트 컴포넌트
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton
        key={index}
        height="0.75rem"
        width={index === lines - 1 ? '75%' : '100%'}
      />
    ))}
  </div>
);

// 게임 특화 로딩 컴포넌트들
export const GameLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="game" {...props} />
);

export const MagicalLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="magical" {...props} />
);

export const BattleLoading: React.FC<Omit<LoadingProps, 'type'>> = (props) => (
  <Loading type="sword" text="전투 준비중..." {...props} />
);

// 데이터 로딩 훅
export const useLoading = (initialLoading = false) => {
  const [isLoading, setIsLoading] = React.useState(initialLoading);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading
  };
};

export default Loading;