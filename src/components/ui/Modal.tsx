/**
 * 재사용 가능한 모달 컴포넌트
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// 모달 크기 타입
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

// 모달 위치 타입
export type ModalPosition = 'center' | 'top' | 'bottom';

// 모달 애니메이션 타입
export type ModalAnimation = 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';

// 모달 Props 인터페이스
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  position?: ModalPosition;
  animation?: ModalAnimation;
  closeOnOverlayClick?: boolean;
  closeOnEscapeKey?: boolean;
  showCloseButton?: boolean;
  preventClose?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  headerIcon?: React.ReactNode;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
}

// 확인 모달 Props
export interface ConfirmModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

// 알림 모달 Props
export interface AlertModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  buttonText?: string;
}

// 모달 크기별 클래스
const getSizeClasses = (size: ModalSize): string => {
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4'
  };
  return sizeClasses[size];
};

// 모달 위치별 클래스
const getPositionClasses = (position: ModalPosition): string => {
  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20',
    bottom: 'items-end justify-center pb-20'
  };
  return positionClasses[position];
};

// 애니메이션 클래스
const getAnimationClasses = (animation: ModalAnimation, isOpen: boolean): {
  overlay: string;
  content: string;
} => {
  const baseOverlay = 'transition-opacity duration-300';
  const baseContent = 'transition-all duration-300';

  const overlayClass = isOpen
    ? `${baseOverlay} opacity-100`
    : `${baseOverlay} opacity-0`;

  let contentClass = baseContent;

  if (isOpen) {
    switch (animation) {
      case 'fade':
        contentClass += ' opacity-100';
        break;
      case 'scale':
        contentClass += ' opacity-100 scale-100';
        break;
      case 'slide-up':
        contentClass += ' opacity-100 translate-y-0';
        break;
      case 'slide-down':
        contentClass += ' opacity-100 translate-y-0';
        break;
      case 'slide-left':
        contentClass += ' opacity-100 translate-x-0';
        break;
      case 'slide-right':
        contentClass += ' opacity-100 translate-x-0';
        break;
    }
  } else {
    switch (animation) {
      case 'fade':
        contentClass += ' opacity-0';
        break;
      case 'scale':
        contentClass += ' opacity-0 scale-75';
        break;
      case 'slide-up':
        contentClass += ' opacity-0 translate-y-4';
        break;
      case 'slide-down':
        contentClass += ' opacity-0 -translate-y-4';
        break;
      case 'slide-left':
        contentClass += ' opacity-0 translate-x-4';
        break;
      case 'slide-right':
        contentClass += ' opacity-0 -translate-x-4';
        break;
    }
  }

  return {
    overlay: overlayClass,
    content: contentClass
  };
};

// 포커스 트랩 훅
const useFocusTrap = (isOpen: boolean, containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusableElement = focusableElements[0] as HTMLElement;
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstFocusableElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, containerRef]);
};

// 메인 Modal 컴포넌트
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  position = 'center',
  animation = 'fade',
  closeOnOverlayClick = true,
  closeOnEscapeKey = true,
  showCloseButton = true,
  preventClose = false,
  className,
  overlayClassName,
  contentClassName,
  children,
  footer,
  headerIcon,
  onAfterOpen,
  onAfterClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 포커스 트랩
  useFocusTrap(isOpen, contentRef);

  // 모달이 열릴 때 이전 포커스 저장
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden'; // 스크롤 방지
      onAfterOpen?.();
    } else {
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
      onAfterClose?.();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onAfterOpen, onAfterClose]);

  // ESC 키 처리
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscapeKey && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, closeOnEscapeKey, preventClose, onClose]);

  // 오버레이 클릭 처리
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (
      closeOnOverlayClick &&
      !preventClose &&
      e.target === modalRef.current
    ) {
      onClose();
    }
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  const animationClasses = getAnimationClasses(animation, isOpen);

  return (
    <div
      ref={modalRef}
      className={cn(
        'fixed inset-0 z-50 flex',
        getPositionClasses(position),
        animationClasses.overlay,
        'bg-black bg-opacity-50',
        overlayClassName
      )}
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className={cn(
          'relative w-full bg-white rounded-lg shadow-xl',
          getSizeClasses(size),
          animationClasses.content,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className={cn(
            'flex items-center justify-between p-6 border-b border-gray-200',
            contentClassName
          )}>
            <div className="flex items-center gap-3">
              {headerIcon && (
                <div className="flex-shrink-0 text-xl">{headerIcon}</div>
              )}
              <div>
                {title && (
                  <h3
                    id="modal-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="text-sm text-gray-500 mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {showCloseButton && !preventClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="모달 닫기"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className={cn('p-6', contentClassName)}>
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className={cn(
            'flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg',
            contentClassName
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// 확인 모달
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false,
  ...modalProps
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      modalProps.onClose();
    } catch (error) {
      console.error('확인 처리 중 오류:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    modalProps.onClose();
  };

  const getVariantClasses = (variant: string) => {
    const variants = {
      default: {
        icon: '❓',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600',
        confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
      },
      danger: {
        icon: '⚠️',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600',
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white'
      },
      warning: {
        icon: '⚠️',
        iconBg: 'bg-yellow-100',
        iconText: 'text-yellow-600',
        confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white'
      },
      success: {
        icon: '✅',
        iconBg: 'bg-green-100',
        iconText: 'text-green-600',
        confirmBtn: 'bg-green-600 hover:bg-green-700 text-white'
      }
    };
    return variants[variant as keyof typeof variants] || variants.default;
  };

  const variantClasses = getVariantClasses(variant);

  return (
    <Modal
      {...modalProps}
      preventClose={loading || isConfirming}
      headerIcon={
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', variantClasses.iconBg)}>
          <span className="text-xl">{variantClasses.icon}</span>
        </div>
      }
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading || isConfirming}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isConfirming}
            className={cn(
              'px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2',
              variantClasses.confirmBtn
            )}
          >
            {(loading || isConfirming) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};

// 알림 모달
export const AlertModal: React.FC<AlertModalProps> = ({
  message,
  variant = 'info',
  buttonText = '확인',
  ...modalProps
}) => {
  const getVariantClasses = (variant: string) => {
    const variants = {
      info: {
        icon: 'ℹ️',
        iconBg: 'bg-blue-100',
        iconText: 'text-blue-600'
      },
      success: {
        icon: '✅',
        iconBg: 'bg-green-100',
        iconText: 'text-green-600'
      },
      warning: {
        icon: '⚠️',
        iconBg: 'bg-yellow-100',
        iconText: 'text-yellow-600'
      },
      error: {
        icon: '❌',
        iconBg: 'bg-red-100',
        iconText: 'text-red-600'
      }
    };
    return variants[variant as keyof typeof variants] || variants.info;
  };

  const variantClasses = getVariantClasses(variant);

  return (
    <Modal
      {...modalProps}
      headerIcon={
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', variantClasses.iconBg)}>
          <span className="text-xl">{variantClasses.icon}</span>
        </div>
      }
      footer={
        <button
          type="button"
          onClick={modalProps.onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {buttonText}
        </button>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
};

// 게임 특화 모달들
export const GameModal: React.FC<ModalProps> = (props) => (
  <Modal
    {...props}
    className={cn(
      'bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-amber-300',
      props.className
    )}
    overlayClassName={cn('bg-black bg-opacity-60', props.overlayClassName)}
  />
);

export const MagicalModal: React.FC<ModalProps> = (props) => (
  <Modal
    {...props}
    animation="scale"
    className={cn(
      'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 border-2 border-purple-300 shadow-2xl shadow-purple-500/25',
      props.className
    )}
    overlayClassName={cn('bg-purple-900 bg-opacity-50', props.overlayClassName)}
  />
);

// 모달 훅
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
};

// 확인 모달 훅
export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmModalProps, 'isOpen' | 'onClose'> | null>(null);

  const showConfirm = React.useCallback((config: Omit<ConfirmModalProps, 'isOpen' | 'onClose'>) => {
    setConfig(config);
    setIsOpen(true);
  }, []);

  const closeConfirm = React.useCallback(() => {
    setIsOpen(false);
    setConfig(null);
  }, []);

  const ConfirmModalComponent = config ? (
    <ConfirmModal
      {...config}
      isOpen={isOpen}
      onClose={closeConfirm}
    />
  ) : null;

  return {
    showConfirm,
    closeConfirm,
    ConfirmModal: ConfirmModalComponent
  };
};

export default Modal;