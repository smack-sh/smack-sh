import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheck, HiOutlineX, HiOutlineInformationCircle, HiOutlineExclamation, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { classNames } from '~/utils/classNames';

// Safe ID generation with fallback for environments without crypto
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const icons = {
  info: HiOutlineInformationCircle,
  success: HiOutlineCheckCircle,
  warning: HiOutlineExclamation,
  error: HiOutlineXCircle,
};

const colors = {
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
};

const iconColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

export function NotificationCenter({ notifications, onDismiss }: NotificationCenterProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      <AnimatePresence>
        {notifications.map(function(notification) {
          return (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={function() { return onDismiss(notification.id) }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const Icon = icons[notification.type];
  const onDismissRef = useRef(onDismiss);

  // Keep the ref in sync with the latest callback
  useEffect(function() {
    onDismissRef.current = onDismiss;
  });

  useEffect(function() {
    if (notification.duration != null) {
      const timer = setTimeout(function() {
        onDismissRef.current();
      }, notification.duration);
      return function() { return clearTimeout(timer) };
    }
  }, [notification.duration]);

  const handleDismiss = function() {
    onDismissRef.current();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={classNames(
        'rounded-xl border p-4 shadow-xl backdrop-blur-md bg-smack-elements-background-depth-2/95',
        colors[notification.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={classNames(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          iconColors[notification.type],
          notification.type === 'info' && 'bg-blue-500/10',
          notification.type === 'success' && 'bg-green-500/10',
          notification.type === 'warning' && 'bg-yellow-500/10',
          notification.type === 'error' && 'bg-red-500/10'
        )}>
          <Icon className={classNames('w-5 h-5', iconColors[notification.type])} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-smack-elements-textPrimary mb-1">{notification.title}</h4>
          <p className="text-sm text-smack-elements-textSecondary leading-relaxed">{notification.message}</p>
        </div>
        {notification.dismissible !== false && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss notification"
            className="flex-shrink-0 p-2 rounded-lg hover:bg-smack-elements-background-depth-3 transition-all duration-200 hover:scale-105"
          >
            <HiOutlineX className="w-4 h-4 text-smack-elements-textTertiary hover:text-smack-elements-textSecondary" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    setNotifications((prev) => [...prev, { ...notification, id }]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
  };
}
