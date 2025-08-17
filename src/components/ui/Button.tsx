/**
 * 재사용 가능한 버튼 컴포넌트
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// 버튼 변형 타입
export type ButtonVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'ghost' 
  | 'link'
  | 'game' 
  | 'magical' 
  | 'legendary';

// 버튼 크기 타입
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 버튼 Props 인터페이스
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  tooltip?: string;
  cooldown?: number; // 쿨다운 시간 (밀리초)
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  className?: string;
}

// 버튼 스타일 클래스 생성
const getButtonClasses = (
  variant: ButtonVariant,
  size: ButtonSize,
  loading: boolean,
  disabled: boolean,
  fullWidth: boolean
): string => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-medium',
    'transition-all',
    'duration-200',
    'rounded-md',
    'border',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'active:scale-95',
    'select-none',
    'whitespace-nowrap'
  ];

  // 크기별 클래스
  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs', 'min-h-[24px]'],
    sm: ['px-3', 'py-1.5', 'text-sm', 'min-h-[32px]'],
    md: ['px-4', 'py-2', 'text-sm', 'min-h-[40px]'],
    lg: ['px-6', 'py-3', 'text-base', 'min-h-[48px]'],
    xl: ['px-8', 'py-4', 'text-lg', 'min-h-[56px]']
  };

  // 변형별 클래스
  const variantClasses = {
    default: [
      'bg-white',
      'text-gray-700',
      'border-gray-300',
      'hover:bg-gray-50',
      'hover:border-gray-400',
      'focus:ring-gray-500'
    ],
    primary: [
      'bg-blue-600',
      'text-white',
      'border-blue-600',
      'hover:bg-blue-700',
      'hover:border-blue-700',
      'focus:ring-blue-500'
    ],
    secondary: [
      'bg-gray-600',
      'text-white',
      'border-gray-600',
      'hover:bg-gray-700',
      'hover:border-gray-700',
      'focus:ring-gray-500'
    ],
    success: [
      'bg-green-600',
      'text-white',
      'border-green-600',
      'hover:bg-green-700',
      'hover:border-green-700',
      'focus:ring-green-500'
    ],
    warning: [
      'bg-yellow-500',
      'text-white',
      'border-yellow-500',
      'hover:bg-yellow-600',
      'hover:border-yellow-600',
      'focus:ring-yellow-400'
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'border-red-600',
      'hover:bg-red-700',
      'hover:border-red-700',
      'focus:ring-red-500'
    ],
    ghost: [
      'bg-transparent',
      'text-gray-700',
      'border-transparent',
      'hover:bg-gray-100',
      'hover:text-gray-900',
      'focus:ring-gray-500'
    ],
    link: [
      'bg-transparent',
      'text-blue-600',
      'border-transparent',
      'hover:text-blue-800',
      'hover:underline',
      'focus:ring-blue-500',
      'p-0',
      'h-auto',
      'min-h-0'
    ],
    game: [
      'bg-gradient-to-b',
      'from-amber-400',
      'to-amber-600',
      'text-amber-900',
      'border-amber-500',
      'shadow-lg',
      'hover:from-amber-300',
      'hover:to-amber-500',
      'hover:shadow-xl',
      'focus:ring-amber-400',
      'font-bold',
      'text-shadow'
    ],
    magical: [
      'bg-gradient-to-r',
      'from-purple-500',
      'via-pink-500',
      'to-purple-600',
      'text-white',
      'border-purple-400',
      'shadow-lg',
      'shadow-purple-500/25',
      'hover:shadow-purple-500/40',
      'hover:scale-105',
      'focus:ring-purple-400',
      'animate-pulse',
      'font-bold'
    ],
    legendary: [
      'bg-gradient-to-r',
      'from-orange-400',
      'via-red-500',
      'to-yellow-500',
      'text-white',
      'border-orange-400',
      'shadow-xl',
      'shadow-orange-500/30',
      'hover:shadow-orange-500/50',
      'hover:scale-110',
      'focus:ring-orange-400',
      'animate-pulse',
      'font-bold',
      'relative',
      'overflow-hidden',
      'before:absolute',
      'before:inset-0',
      'before:bg-gradient-to-r',
      'before:from-transparent',
      'before:via-white/20',
      'before:to-transparent',
      'before:translate-x-[-100%]',
      'hover:before:translate-x-[100%]',
      'before:transition-transform',
      'before:duration-1000'
    ]
  };

  // 비활성/로딩 상태 클래스
  const stateClasses = [];
  if (disabled || loading) {
    stateClasses.push(
      'opacity-50',
      'cursor-not-allowed',
      'pointer-events-none'
    );
  }

  // 전체 폭 클래스
  if (fullWidth) {
    stateClasses.push('w-full');
  }

  return [
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    ...stateClasses
  ].join(' ');
};

// 로딩 스피너 컴포넌트
const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => {
  const spinnerSize = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }[size];

  return (
    <svg
      className={cn('animate-spin', spinnerSize)}
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
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// 쿨다운 오버레이 컴포넌트
const CooldownOverlay: React.FC<{ cooldownPercent: number }> = ({ cooldownPercent }) => {
  if (cooldownPercent <= 0) return null;

  return (
    <div className="absolute inset-0 bg-black/20 rounded-md overflow-hidden">
      <div
        className="bg-black/40 h-full transition-all duration-100"
        style={{ width: `${cooldownPercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-xs">
          {Math.ceil(cooldownPercent)}%
        </span>
      </div>
    </div>
  );
};

// 툴팁 컴포넌트
const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ 
  content, 
  children 
}) => {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

// 메인 Button 컴포넌트
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      tooltip,
      cooldown,
      onClick,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [cooldownPercent, setCooldownPercent] = React.useState(0);
    const [isOnCooldown, setIsOnCooldown] = React.useState(false);

    // 쿨다운 처리
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || loading || isOnCooldown) {
          event.preventDefault();
          return;
        }

        onClick?.(event);

        // 쿨다운 시작
        if (cooldown && cooldown > 0) {
          setIsOnCooldown(true);
          setCooldownPercent(100);

          const startTime = Date.now();
          const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, cooldown - elapsed);
            const percent = (remaining / cooldown) * 100;

            setCooldownPercent(percent);

            if (remaining <= 0) {
              clearInterval(interval);
              setIsOnCooldown(false);
              setCooldownPercent(0);
            }
          }, 16); // ~60fps
        }
      },
      [onClick, disabled, loading, isOnCooldown, cooldown]
    );

    const buttonClasses = getButtonClasses(
      variant,
      size,
      loading,
      disabled || isOnCooldown,
      fullWidth
    );

    const buttonContent = (
      <button
        ref={ref}
        className={cn(buttonClasses, className, (cooldown ? 'relative' : undefined))}
        disabled={disabled || loading || isOnCooldown}
        onClick={handleClick}
        {...props}
      >
        {/* 왼쪽 아이콘 */}
        {leftIcon && !loading && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {/* 로딩 스피너 */}
        {loading && <LoadingSpinner size={size} />}

        {/* 버튼 텍스트 */}
        {children && (
          <span className={cn(loading && 'opacity-50')}>{children}</span>
        )}

        {/* 오른쪽 아이콘 */}
        {rightIcon && !loading && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}

        {/* 쿨다운 오버레이 */}
        {cooldown && <CooldownOverlay cooldownPercent={cooldownPercent} />}
      </button>
    );

    // 툴팁으로 감싸기
    if (tooltip) {
      return <Tooltip content={tooltip}>{buttonContent}</Tooltip>;
    }

    return buttonContent;
  }
);

Button.displayName = 'Button';

// 사전 정의된 게임 버튼들
export const GameButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="game" {...props} />
);

export const MagicalButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="magical" {...props} />
);

export const LegendaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="legendary" {...props} />
);

// 액션 버튼 (스킬 사용 등)
export const ActionButton: React.FC<
  ButtonProps & {
    hotkey?: string;
    manaCost?: number;
    currentMana?: number;
  }
> = ({ hotkey, manaCost, currentMana, children, tooltip, ...props }) => {
  const canAfford = manaCost === undefined || currentMana === undefined || currentMana >= manaCost;
  const hotkeyText = hotkey ? ` [${hotkey}]` : '';
  const manaCostText = manaCost ? ` (MP: ${manaCost})` : '';
  const fullTooltip = tooltip ? `${tooltip}${manaCostText}${hotkeyText}` : undefined;

  return (
    <Button
      variant={canAfford ? 'primary' : 'secondary'}
      disabled={!canAfford}
      tooltip={fullTooltip}
      {...props}
    >
      {children}
      {hotkey && (
        <span className="ml-1 text-xs opacity-75">[{hotkey}]</span>
      )}
    </Button>
  );
};

// 레어리티별 버튼
export const RarityButton: React.FC<
  ButtonProps & {
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  }
> = ({ rarity, ...props }) => {
  const rarityVariants = {
    common: 'default' as ButtonVariant,
    uncommon: 'success' as ButtonVariant,
    rare: 'primary' as ButtonVariant,
    epic: 'secondary' as ButtonVariant,
    legendary: 'legendary' as ButtonVariant,
    mythic: 'magical' as ButtonVariant
  };

  return <Button variant={rarityVariants[rarity]} {...props} />;
};

export default Button;