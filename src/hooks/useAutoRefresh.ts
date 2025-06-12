import { useEffect, useRef, useCallback, useState } from 'react';

interface AutoRefreshOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  pauseOnBlur?: boolean; // Tạm dừng khi tab không active
  onRefresh?: () => Promise<void> | void;
  onError?: (error: Error) => void;
}

interface AutoRefreshReturn {
  isRefreshing: boolean;
  lastRefreshTime: Date | null;
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
  toggle: () => void;
  isActive: boolean;
}

export const useAutoRefresh = ({
  enabled = true,
  interval = 600000, // 10 phút mặc định
  pauseOnBlur = true,
  onRefresh,
  onError
}: AutoRefreshOptions): AutoRefreshReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(enabled);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef(enabled);
  const onRefreshRef = useRef(onRefresh);

  // Cập nhật refs để tránh stale closure
  useEffect(() => {
    enabledRef.current = enabled;
    onRefreshRef.current = onRefresh;
  }, [enabled, onRefresh]);

  // Theo dõi visibility của tab
  useEffect(() => {
    if (!pauseOnBlur) return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pauseOnBlur]);

  // Hàm refresh dữ liệu - stable callback
  const refresh = useCallback(async () => {
    if (!onRefreshRef.current) return;

    // Tránh double refresh
    setIsRefreshing(prevState => {
      if (prevState) return prevState; // Đang refresh rồi, bỏ qua
      
      // Thực hiện refresh
      (async () => {
        try {
          await onRefreshRef.current!();
          setLastRefreshTime(new Date());
        } catch (error) {
          console.error('Auto refresh error:', error);
          onError?.(error as Error);
        } finally {
          setIsRefreshing(false);
        }
      })();
      
      return true; // Set isRefreshing = true
    });
  }, [onError]);

  // Bắt đầu auto refresh
  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsActive(true);
    
    // Refresh ngay lập tức
    refresh();

    // Thiết lập interval
    intervalRef.current = setInterval(() => {
      // Chỉ refresh khi tab visible (nếu pauseOnBlur = true)
      if (pauseOnBlur && !document.hidden) {
        if (enabledRef.current) {
          refresh();
        }
      } else if (!pauseOnBlur) {
        if (enabledRef.current) {
          refresh();
        }
      }
    }, interval);
  }, [interval, pauseOnBlur, refresh]);

  // Dừng auto refresh
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Toggle auto refresh
  const toggle = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  // Khởi động auto refresh khi component mount
  useEffect(() => {
    if (enabled) {
      start();
    }

    return () => {
      stop();
    };
  }, [enabled, interval, pauseOnBlur]); // Chỉ depend vào primitive values

  // Tạm dừng/tiếp tục khi tab visibility thay đổi - đơn giản hóa
  useEffect(() => {
    if (!pauseOnBlur) return;

    if (isVisible && enabled && !isActive) {
      start();
    }
    // Không cần xử lý case !isVisible vì đã handle trong setInterval
  }, [isVisible, pauseOnBlur, enabled, isActive]);

  return {
    isRefreshing,
    lastRefreshTime,
    start,
    stop,
    refresh,
    toggle,
    isActive
  };
}; 