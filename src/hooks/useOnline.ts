import { useState, useEffect, useCallback, useRef } from 'react';

type Action = () => void;

export function useOnline() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const actionQueue = useRef<Action[]>([]);

  const processQueue = useCallback(() => {
    if (actionQueue.current.length === 0) return;
    
    // Process actions
    const actions = [...actionQueue.current];
    actionQueue.current = [];
    
    actions.forEach(action => {
      try {
        action();
      } catch (error) {
        console.error('Failed to execute queued action', error);
      }
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  const queueAction = useCallback((action: Action) => {
    if (isOnline) {
      action();
    } else {
      actionQueue.current.push(action);
    }
  }, [isOnline]);

  const checkOnlineStatus = useCallback(() => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);
    if (online) {
      processQueue();
    }
    return online;
  }, [processQueue]);

  return { isOnline, queueAction, checkOnlineStatus };
}
