/**
 * 재사용 가능한 입력 컴포넌트
 */

import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// 입력 컴포넌트 변형 타입
export type InputVariant = 'default' | 'error' | 'success' | 'warning' | 'game' | 'magical';

// 입력 컴포넌트 크기 타입
export type InputSize = 'sm' | 'md' | 'lg';

// 기본 입력 Props
export interface BaseInputProps {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  fullWidth?: boolean;
  tooltip?: string;
  characterLimit?: number;
  showCharacterCount?: boolean;
  debounceMs?: number; // 입력 디바운스 시간
}

// Input Props
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    BaseInputProps {}

// Textarea Props
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>,
    BaseInputProps {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  autoResize?: boolean;
}

// 스타일 생성 함수
const getInputClasses = (
  variant: InputVariant,
  size: InputSize,
  disabled: boolean,
  error?: string,
  success?: string
): string => {
  const baseClasses = [
    'block',
    'w-full',
    'border',
    'rounded-md',
    'shadow-sm',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-1',
    'placeholder-gray-400'
  ];

  // 크기별 클래스
  const sizeClasses = {
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-4', 'py-2', 'text-base'],
    lg: ['px-5', 'py-3', 'text-lg']
  };

  // 상태에 따른 변형 결정
  let currentVariant = variant;
  if (error) currentVariant = 'error';
  else if (success) currentVariant = 'success';

  // 변형별 클래스
  const variantClasses = {
    default: [
      'bg-white',
      'border-gray-300',
      'text-gray-900',
      'focus:border-blue-500',
      'focus:ring-blue-500'
    ],
    error: [
      'bg-red-50',
      'border-red-300',
      'text-red-900',
      'focus:border-red-500',
      'focus:ring-red-500'
    ],
    success: [
      'bg-green-50',
      'border-green-300',
      'text-green-900',
      'focus:border-green-500',
      'focus:ring-green-500'
    ],
    warning: [
      'bg-yellow-50',
      'border-yellow-300',
      'text-yellow-900',
      'focus:border-yellow-500',
      'focus:ring-yellow-500'
    ],
    game: [
      'bg-gradient-to-b',
      'from-amber-50',
      'to-amber-100',
      'border-amber-300',
      'text-amber-900',
      'focus:border-amber-500',
      'focus:ring-amber-500',
      'font-medium'
    ],
    magical: [
      'bg-gradient-to-r',
      'from-purple-50',
      'to-pink-50',
      'border-purple-300',
      'text-purple-900',
      'focus:border-purple-500',
      'focus:ring-purple-500',
      'font-medium'
    ]
  };

  // 비활성 상태 클래스
  const disabledClasses = disabled
    ? ['opacity-50', 'cursor-not-allowed', 'bg-gray-100']
    : [];

  return cn(
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[currentVariant],
    ...disabledClasses
  );
};

// 라벨 컴포넌트
const InputLabel: React.FC<{
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ htmlFor, required, children }) => (
  <label
    htmlFor={htmlFor}
    className="block text-sm font-medium text-gray-700 mb-1"
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

// 설명 텍스트 컴포넌트
const InputDescription: React.FC<{ children: React.ReactNode }> = ({
  children
}) => <p className="text-sm text-gray-500 mb-1">{children}</p>;

// 에러/성공 메시지 컴포넌트
const InputMessage: React.FC<{
  type: 'error' | 'success' | 'warning';
  children: React.ReactNode;
}> = ({ type, children }) => {
  const colorClasses = {
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-yellow-600'
  };

  const iconMap = {
    error: '⚠️',
    success: '✅',
    warning: '⚠️'
  };

  return (
    <p className={cn('text-sm mt-1 flex items-center gap-1', colorClasses[type])}>
      <span>{iconMap[type]}</span>
      {children}
    </p>
  );
};

// 아이콘 래퍼 컴포넌트
const IconWrapper: React.FC<{
  icon: React.ReactNode;
  position: 'left' | 'right';
  clickable?: boolean;
  onClick?: () => void;
}> = ({ icon, position, clickable, onClick }) => {
  const baseClasses = [
    'absolute',
    'inset-y-0',
    'flex',
    'items-center',
    'px-3',
    'text-gray-400'
  ];

  const positionClasses = position === 'left' ? ['left-0'] : ['right-0'];

  const clickableClasses = clickable
    ? ['cursor-pointer', 'hover:text-gray-600', 'transition-colors']
    : [];

  return (
    <div
      className={cn(...baseClasses, ...positionClasses, ...clickableClasses)}
      onClick={clickable ? onClick : undefined}
    >
      {icon}
    </div>
  );
};

// 문자 수 카운터 컴포넌트
const CharacterCounter: React.FC<{
  current: number;
  max?: number;
}> = ({ current, max }) => {
  if (!max) return null;

  const isOverLimit = current > max;
  const percentage = (current / max) * 100;

  return (
    <div className="text-xs text-right mt-1">
      <span
        className={cn(
          'transition-colors',
          isOverLimit ? 'text-red-500' : 
          percentage > 80 ? 'text-yellow-500' : 'text-gray-400'
        )}
      >
        {current}
        {max && ` / ${max}`}
      </span>
      {max && (
        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            className={cn(
              'h-1 rounded-full transition-all duration-200',
              isOverLimit ? 'bg-red-500' : 
              percentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// 로딩 오버레이 컴포넌트
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// 메인 Input 컴포넌트
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      description,
      error,
      success,
      required,
      disabled,
      loading,
      leftIcon,
      rightIcon,
      onLeftIconClick,
      onRightIconClick,
      fullWidth = true,
      tooltip,
      characterLimit,
      showCharacterCount,
      debounceMs,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState<string>(props.value as string || '');
    const [debouncedValue, setDebouncedValue] = React.useState<string>(value);
    const inputId = React.useId();

    // 디바운스 처리
    React.useEffect(() => {
      if (!debounceMs) {
        setDebouncedValue(value);
        return;
      }

      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [value, debounceMs]);

    // 디바운스된 값이 변경될 때 onChange 호출
    React.useEffect(() => {
      if (debounceMs && onChange && debouncedValue !== props.value) {
        onChange({
          target: { value: debouncedValue }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }, [debouncedValue, onChange, debounceMs, props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      // 문자 수 제한 확인
      if (characterLimit && newValue.length > characterLimit) {
        return;
      }

      setValue(newValue);

      // 디바운스가 없으면 즉시 호출
      if (!debounceMs && onChange) {
        onChange(e);
      }
    };

    const inputClasses = getInputClasses(variant, size, disabled, error, success);
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon || loading;

    // 아이콘이 있을 때 패딩 조정
    const paddingClasses = cn(
      hasLeftIcon && 'pl-10',
      hasRightIcon && 'pr-10'
    );

    const currentValue = debounceMs ? value : (props.value || '');
    const characterCount = String(currentValue).length;

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* 라벨 */}
        {label && (
          <InputLabel htmlFor={inputId} required={required}>
            {label}
          </InputLabel>
        )}

        {/* 설명 */}
        {description && <InputDescription>{description}</InputDescription>}

        {/* 입력 필드 컨테이너 */}
        <div className="relative">
          {/* 왼쪽 아이콘 */}
          {leftIcon && (
            <IconWrapper
              icon={leftIcon}
              position="left"
              clickable={!!onLeftIconClick}
              onClick={onLeftIconClick}
            />
          )}

          {/* 입력 필드 */}
          <input
            ref={ref}
            id={inputId}
            className={cn(inputClasses, paddingClasses, className)}
            disabled={disabled || loading}
            value={debounceMs ? value : props.value}
            onChange={handleChange}
            {...props}
          />

          {/* 오른쪽 아이콘 */}
          {rightIcon && !loading && (
            <IconWrapper
              icon={rightIcon}
              position="right"
              clickable={!!onRightIconClick}
              onClick={onRightIconClick}
            />
          )}

          {/* 로딩 오버레이 */}
          {loading && <LoadingOverlay />}
        </div>

        {/* 문자 수 카운터 */}
        {(showCharacterCount || characterLimit) && (
          <CharacterCounter
            current={characterCount}
            max={characterLimit}
          />
        )}

        {/* 에러 메시지 */}
        {error && <InputMessage type="error">{error}</InputMessage>}

        {/* 성공 메시지 */}
        {success && <InputMessage type="success">{success}</InputMessage>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea 컴포넌트
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      variant = 'default',
      size = 'md',
      label,
      description,
      error,
      success,
      required,
      disabled,
      loading,
      fullWidth = true,
      characterLimit,
      showCharacterCount,
      debounceMs,
      rows = 3,
      minRows,
      maxRows,
      autoResize,
      className,
      onChange,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState<string>(props.value as string || '');
    const [debouncedValue, setDebouncedValue] = React.useState<string>(value);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const inputId = React.useId();

    // ref 합치기
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // 디바운스 처리
    React.useEffect(() => {
      if (!debounceMs) {
        setDebouncedValue(value);
        return;
      }

      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [value, debounceMs]);

    // 자동 리사이즈
    React.useEffect(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      
      const newHeight = textarea.scrollHeight;
      const minHeight = minRows ? minRows * 24 : rows * 24; // 대략적인 줄 높이
      const maxHeight = maxRows ? maxRows * 24 : Infinity;
      
      textarea.style.height = `${Math.max(minHeight, Math.min(newHeight, maxHeight))}px`;
    }, [value, autoResize, minRows, maxRows, rows]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      // 문자 수 제한 확인
      if (characterLimit && newValue.length > characterLimit) {
        return;
      }

      setValue(newValue);

      // 디바운스가 없으면 즉시 호출
      if (!debounceMs && onChange) {
        onChange(e);
      }
    };

    const textareaClasses = getInputClasses(variant, size, disabled, error, success);
    const currentValue = debounceMs ? value : (props.value || '');
    const characterCount = String(currentValue).length;

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* 라벨 */}
        {label && (
          <InputLabel htmlFor={inputId} required={required}>
            {label}
          </InputLabel>
        )}

        {/* 설명 */}
        {description && <InputDescription>{description}</InputDescription>}

        {/* 입력 필드 컨테이너 */}
        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id={inputId}
            className={cn(textareaClasses, className)}
            disabled={disabled || loading}
            rows={autoResize ? undefined : rows}
            value={debounceMs ? value : props.value}
            onChange={handleChange}
            style={autoResize ? { resize: 'none' } : undefined}
            {...props}
          />

          {/* 로딩 오버레이 */}
          {loading && <LoadingOverlay />}
        </div>

        {/* 문자 수 카운터 */}
        {(showCharacterCount || characterLimit) && (
          <CharacterCounter
            current={characterCount}
            max={characterLimit}
          />
        )}

        {/* 에러 메시지 */}
        {error && <InputMessage type="error">{error}</InputMessage>}

        {/* 성공 메시지 */}
        {success && <InputMessage type="success">{success}</InputMessage>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// 게임 특화 입력 컴포넌트들
export const GameInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input variant="game" {...props} />
);

export const MagicalInput: React.FC<Omit<InputProps, 'variant'>> = (props) => (
  <Input variant="magical" {...props} />
);

// 검색 입력 컴포넌트
export const SearchInput: React.FC<
  InputProps & {
    onSearch?: (value: string) => void;
    onClear?: () => void;
    placeholder?: string;
  }
> = ({ onSearch, onClear, placeholder = '검색...', ...props }) => {
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearch = () => {
    onSearch?.(searchValue);
  };

  const handleClear = () => {
    setSearchValue('');
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Input
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      leftIcon={<span>🔍</span>}
      rightIcon={searchValue && <span onClick={handleClear}>✕</span>}
      onRightIconClick={searchValue ? handleClear : undefined}
      {...props}
    />
  );
};

// 수량 입력 컴포넌트
export const QuantityInput: React.FC<
  Omit<InputProps, 'type'> & {
    min?: number;
    max?: number;
    step?: number;
    onIncrement?: () => void;
    onDecrement?: () => void;
  }
> = ({ min = 1, max = 999, step = 1, onIncrement, onDecrement, ...props }) => {
  const [quantity, setQuantity] = React.useState<number>(
    Number(props.value) || min
  );

  const handleIncrement = () => {
    const newValue = Math.min(quantity + step, max);
    setQuantity(newValue);
    onIncrement?.();
  };

  const handleDecrement = () => {
    const newValue = Math.max(quantity - step, min);
    setQuantity(newValue);
    onDecrement?.();
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={quantity <= min}
        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-l-md"
      >
        −
      </button>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="text-center rounded-none border-l-0 border-r-0"
        fullWidth={false}
        {...props}
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-r-md"
      >
        +
      </button>
    </div>
  );
};

export default Input;