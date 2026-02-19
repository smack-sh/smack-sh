import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBell, HiOutlineCheck, HiOutlineX, HiOutlineInformationCircle, HiOutlineExclamation, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import { classNames } from '~/utils/classNames';

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
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[notification.type];

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 100, scale: isVisible ? 1 : 0.9 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={classNames(
        'rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        colors[notification.type]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={classNames('w-5 h-5 mt-0.5 flex-shrink-0', iconColors[notification.type])} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
        </div>
        {notification.dismissible !== false && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <HiOutlineX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { ...notification, id }]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    NotificationCenter: () => (
      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />
    ),
  };
}
