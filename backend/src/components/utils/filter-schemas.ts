import { FilterDefinition } from '../interfaces/pc-components.interfaces';

export const COMPONENT_FILTER_SCHEMAS: Record<
  string,
  Record<string, FilterDefinition>
> = {
  cpu: {
    coreCount: { field: 'core_count', type: 'range' },
    threadCount: { field: 'thread_count', type: 'range' },
    baseClock: { field: 'base_clock', type: 'range' },
    boostClock: { field: 'boost_clock', type: 'range' },
    tdp: { field: 'tdp', type: 'range' },
    maxSupportedMemory: { field: 'max_supported_memory', type: 'range' },
    socket: { field: 'socket', type: 'multi-string' },
    manufacturer: { field: 'manufacturer', type: 'multi-string' },
    microarchitecture: { field: 'microarchitecture', type: 'multi-string' },
    coreFamily: { field: 'core_family', type: 'multi-string' },
    integratedGraphics: { field: 'integrated_graphics', type: 'multi-string' },
    eccSupport: { field: 'ecc_support', type: 'boolean' },
    includesCooler: { field: 'includes_cooler', type: 'boolean' },
    simultaneousMultithreading: {
      field: 'simultaneous_multithreading',
      type: 'boolean',
    },
  },

  ram: {
    quantity: { field: 'quantity', type: 'range' },
    capacity: { field: 'capacity', type: 'range' },
    speed: { field: 'speed', type: 'range' },
    casLatency: { field: 'cas_latency', type: 'range' },
    voltage: { field: 'voltage', type: 'range' },
    memoryType: { field: 'memory_type', type: 'multi-string' },
    formFactor: { field: 'form_factor', type: 'multi-string' },
    manufacturer: { field: 'manufacturer', type: 'multi-string' },
    heatSpreader: { field: 'heat_spreader', type: 'boolean' },
    ecc: { field: 'ecc', type: 'boolean' },
  },
};
