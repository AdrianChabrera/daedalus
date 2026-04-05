import type { PcComponent, PcComponentTypeConfig } from '../types/PcComponents.types';
import { Cpu, Gpu, Layers, HardDrive, MemoryStick, Fan, Keyboard, Mouse, Zap, PcCase, Thermometer, Monitor } from 'lucide-react';

export const COMPONENT_TYPES: PcComponentTypeConfig[] = [
  {
    label: 'CPU',
    endpoint: 'cpu',
    icon: <Cpu size={16} />,
    sortFields: [
      { label: 'Total Cores', field: 'coreCount' },
      { label: 'Boost Clock', field: 'boostClock' },
      { label: 'TDP', field: 'tdp' },
    ],
    subtitle: (c) => {
      const cpu = c as PcComponent & { boostClock?: number; coreCount?: number; socket?: string };
      const boostClock = cpu.boostClock ? `${cpu.boostClock} GHz` : 'N/A';
      const coreCount = cpu.coreCount ? `${cpu.coreCount}` : 'N/A';
      const socket = cpu.socket ?? 'N/A';
      return <span>Boost Clock: {boostClock} <br/>Cores: {coreCount} <br/>Socket: {socket}</span>;
    },
  },
  {
    label: 'GPU',
    endpoint: 'gpu',
    icon: <Gpu size={16} />,
    sortFields: [
      { label: 'Memory', field: 'memory' },
      { label: 'Boost Clock', field: 'coreBoostClock' },
      { label: 'TDP', field: 'tdp' },
    ],
    subtitle: (c) => {
      const gpu = c as PcComponent & { memory?: number; coreBoostClock?: number; chipset?: string };
      const memory = gpu.memory ? `${gpu.memory} GB` : 'N/A';
      const coreBoostClock = gpu.coreBoostClock ? `${gpu.coreBoostClock} GHz` : 'N/A';
      const chipset = gpu.chipset ?? 'N/A';
      return <span>Memory: {memory} <br/>Boost Clock: {coreBoostClock} <br/>Chipset: {chipset}</span>;
    },
  },
  {
    label: 'Motherboard',
    endpoint: 'motherboard',
    icon: <Layers size={16} />,
    sortFields: [
      { label: 'Max Memory', field: 'maxMemory' },
      { label: 'Memory Slots', field: 'memorySlots' },
    ],
    subtitle: (c) => {
      const mb = c as PcComponent & { socket?: string; formFactor?: string; chipset?: string };
      return <span>Socket: {mb.socket ?? 'N/A'} <br/>Form Factor: {mb.formFactor ?? 'N/A'} <br/>Chipset: {mb.chipset ?? 'N/A'}</span>;
    },
  },
  {
    label: 'RAM',
    endpoint: 'ram',
    icon: <MemoryStick size={16} />,
    sortFields: [
      { label: 'Capacity', field: 'capacity' },
      { label: 'Speed', field: 'speed' },
      { label: 'CAS Latency', field: 'casLatency' },
    ],
    subtitle: (c) => {
      const ram = c as PcComponent & { speed?: number; capacity?: number; memoryType?: string };
      const speed = ram.speed ? `${ram.speed} MHz` : 'N/A';
      const capacity = ram.capacity ? `${ram.capacity} GB` : 'N/A';
      return <span>Speed: {speed} <br/>Capacity: {capacity} <br/>Type: {ram.memoryType ?? 'N/A'}</span>;
    },
  },
  {
    label: 'Storage',
    endpoint: 'storage-drive',
    icon: <HardDrive size={16} />,
    sortFields: [{ label: 'Capacity', field: 'capacity' }],
    subtitle: (c) => {
      const s = c as PcComponent & { capacity?: number; storageType?: string; storageInterface?: string };
      const capacity = s.capacity ? `${s.capacity} GB` : 'N/A';
      return <span>Capacity: {capacity} <br/>Type: {s.storageType ?? 'N/A'} <br/>Interface: {s.storageInterface ?? 'N/A'}</span>;
    },
  },
  {
    label: 'CPU Cooler',
    endpoint: 'cpu-cooler',
    icon: <Thermometer size={16} />,
    sortFields: [
      { label: 'Max Fan RPM', field: 'maxFanRpm' },
      { label: 'Noise Level', field: 'maxNoiseLevel' },
    ],
    subtitle: (c) => {
      const cc = c as PcComponent & { waterCooled?: boolean };
      return <span>Type: {cc.waterCooled ? 'Water Cooled' : 'Air Cooled'}</span>;
    },
  },
  {
    label: 'Case',
    endpoint: 'case',
    icon: <PcCase size={16} />,
    sortFields: [
      { label: 'Volume', field: 'volume' },
      { label: 'Weight', field: 'weight' },
    ],
    subtitle: (c) => {
      const cs = c as PcComponent & { formFactor?: string };
      return <span>Form Factor: {cs.formFactor ?? 'N/A'}</span>;
    },
  },
  {
    label: 'Power Supply',
    endpoint: 'power-supply',
    icon: <Zap size={16} />,
    sortFields: [{ label: 'Wattage', field: 'wattage' }],
    subtitle: (c) => {
      const ps = c as PcComponent & { wattage?: number; efficencyRating?: string };
      const wattage = ps.wattage ? `${ps.wattage} W` : 'N/A';
      return <span>Wattage: {wattage} <br/>Efficiency Rating: {ps.efficencyRating ?? 'N/A'}</span>;
    },
  },
  {
    label: 'Fan',
    endpoint: 'fan',
    icon: <Fan size={16} />,
    subtitle: () => <span />,
  },
  {
    label: 'Monitor',
    endpoint: 'monitor',
    icon: <Monitor size={16} />,
    sortFields: [
      { label: 'Screen Size', field: 'screenSize' },
      { label: 'Refresh Rate', field: 'refreshRate' },
      { label: 'Response Time', field: 'responseTime' },
    ],
    subtitle: (c) => {
      const m = c as PcComponent & { verticalRes?: string; horizontalRes?: string; screenSize?: number };
      const resolution = m.verticalRes && m.horizontalRes ? `${m.horizontalRes}x${m.verticalRes}` : 'N/A';
      const screenSize = m.screenSize ? `${m.screenSize} "` : 'N/A';
      return <span>Resolution: {resolution} <br/>Screen Size: {screenSize}</span>;
    },
  },
  {
    label: 'Keyboard',
    endpoint: 'keyboard',
    icon: <Keyboard size={16} />,
    subtitle: () => <span />,
  },
  {
    label: 'Mouse',
    endpoint: 'mouse',
    icon: <Mouse size={16} />,
    subtitle: () => <span />,
  },
];