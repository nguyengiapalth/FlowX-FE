/**
 * Utility for tracking and managing localStorage usage
 */

export interface StorageStats {
  totalSizeBytes: number;
  totalSizeKB: number;
  totalSizeMB: number;
  totalItems: number;
  itemDetails: Array<{
    key: string;
    sizeBytes: number;
    sizeKB: number;
    value: string;
  }>;
  usagePercentage: number;
  availableSpace: number;
}

export interface StorageConfig {
  maxQuotaMB: number; // Default localStorage quota (usually 5-10MB)
}

const DEFAULT_CONFIG: StorageConfig = {
  maxQuotaMB: 10, // Default to 10MB
};

/**
 * Calculate the size of a string in bytes (UTF-16)
 */
function getStringSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Get detailed localStorage usage statistics
 */
export function getLocalStorageStats(config: Partial<StorageConfig> = {}): StorageStats {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const maxQuotaBytes = finalConfig.maxQuotaMB * 1024 * 1024;
  
  let totalSizeBytes = 0;
  const itemDetails: StorageStats['itemDetails'] = [];

  // Iterate through all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      const keySize = getStringSize(key);
      const valueSize = getStringSize(value);
      const itemSize = keySize + valueSize;
      
      totalSizeBytes += itemSize;
      
      itemDetails.push({
        key,
        sizeBytes: itemSize,
        sizeKB: Number((itemSize / 1024).toFixed(2)),
        value: value.length > 100 ? value.substring(0, 100) + '...' : value,
      });
    }
  }

  // Sort items by size (largest first)
  itemDetails.sort((a, b) => b.sizeBytes - a.sizeBytes);

  return {
    totalSizeBytes,
    totalSizeKB: Number((totalSizeBytes / 1024).toFixed(2)),
    totalSizeMB: Number((totalSizeBytes / (1024 * 1024)).toFixed(2)),
    totalItems: localStorage.length,
    itemDetails,
    usagePercentage: Number(((totalSizeBytes / maxQuotaBytes) * 100).toFixed(2)),
    availableSpace: maxQuotaBytes - totalSizeBytes,
  };
}

/**
 * Get localStorage usage as a formatted string for logging
 */
export function getLocalStorageUsageString(config: Partial<StorageConfig> = {}): string {
  const stats = getLocalStorageStats(config);
  
  let output = `
🗂️  localStorage Usage Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Size: ${stats.totalSizeMB}MB (${stats.totalSizeKB}KB)
📦 Total Items: ${stats.totalItems}
📈 Usage: ${stats.usagePercentage}%
💾 Available: ${(stats.availableSpace / (1024 * 1024)).toFixed(2)}MB

🔍 Top Items by Size:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  stats.itemDetails.slice(0, 10).forEach((item, index) => {
    output += `\n${index + 1}. ${item.key}: ${item.sizeKB}KB`;
  });

  return output;
}

/**
 * Log localStorage usage to console
 */
export function logLocalStorageUsage(config: Partial<StorageConfig> = {}): void {
  console.log(getLocalStorageUsageString(config));
}

/**
 * Check if localStorage is approaching its limit
 */
export function isLocalStorageNearLimit(
  config: Partial<StorageConfig> = {},
  warningThreshold: number = 80
): boolean {
  const stats = getLocalStorageStats(config);
  return stats.usagePercentage >= warningThreshold;
}

/**
 * Get the largest items in localStorage
 */
export function getLargestLocalStorageItems(limit: number = 5): Array<{
  key: string;
  sizeKB: number;
}> {
  const stats = getLocalStorageStats();
  return stats.itemDetails
    .slice(0, limit)
    .map(item => ({
      key: item.key,
      sizeKB: item.sizeKB,
    }));
}

/**
 * Clean up localStorage by removing items over a certain size
 */
export function cleanupLocalStorageBySize(maxSizeKB: number): number {
  const stats = getLocalStorageStats();
  let removedCount = 0;

  stats.itemDetails.forEach(item => {
    if (item.sizeKB > maxSizeKB) {
      localStorage.removeItem(item.key);
      removedCount++;
    }
  });

  return removedCount;
}

/**
 * Monitor localStorage usage and warn when approaching limits
 */
export function setupLocalStorageMonitoring(
  config: Partial<StorageConfig> = {},
  options: {
    warningThreshold?: number;
    checkInterval?: number; // in milliseconds
    onWarning?: (stats: StorageStats) => void;
  } = {}
): () => void {
  const {
    warningThreshold = 80,
    checkInterval = 30000, // 30 seconds
    onWarning,
  } = options;

  const intervalId = setInterval(() => {
    const stats = getLocalStorageStats(config);
    
    if (stats.usagePercentage >= warningThreshold) {
      console.warn(`⚠️ localStorage usage is at ${stats.usagePercentage}%`);
      onWarning?.(stats);
    }
  }, checkInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Export localStorage data for backup
 */
export function exportLocalStorageData(): string {
  const data: Record<string, string> = {};
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      data[key] = localStorage.getItem(key) || '';
    }
  }
  
  return JSON.stringify(data, null, 2);
}

/**
 * Import localStorage data from backup
 */
export function importLocalStorageData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });
    
    return true;
  } catch (error) {
    console.error('Failed to import localStorage data:', error);
    return false;
  }
} 