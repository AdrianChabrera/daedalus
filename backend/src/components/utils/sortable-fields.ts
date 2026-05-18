export const COMPONENT_SORTABLE_FIELDS: Record<string, string[]> = {
  cpu: ['name', 'rating', 'coreCount', 'boostClock', 'tdp'],
  gpu: ['name', 'rating', 'memory', 'coreBoostClock', 'tdp'],
  motherboard: ['name', 'rating', 'maxMemory', 'memorySlots'],
  ram: ['name', 'rating', 'capacity', 'speed', 'casLatency'],
  'storage-drive': ['name', 'rating', 'capacity'],
  'cpu-cooler': ['name', 'rating', 'maxFanRpm', 'maxNoiseLevel'],
  'pc-case': ['name', 'rating', 'volume', 'weight'],
  'power-supply': ['name', 'rating', 'wattage'],
  fan: ['name', 'rating'],
  monitor: ['name', 'rating', 'screenSize', 'refreshRate', 'responseTime'],
  keyboard: ['name', 'rating'],
  mouse: ['name', 'rating'],
};
