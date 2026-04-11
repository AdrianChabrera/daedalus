import { Cpu, Fan, Gpu, HardDrive, Keyboard, Layers, MemoryStick, Monitor, Mouse, PcCase, Thermometer, Zap } from "lucide-react";
import type { BuildState, SlotConfig } from "../types/CreateBuildTypes";

export const CREATE_BUILD_SLOTS: SlotConfig[] = [
  { key: 'cpuId',          label: 'CPU',          endpoint: 'cpu',           icon: <Cpu size={22} />,        multi: false, specs: ['coreCount', 'boostClock', 'socket'] },
  { key: 'ramIds',         label: 'RAM',           endpoint: 'ram',           icon: <MemoryStick size={22} />, multi: true,  specs: ['speed', 'capacity', 'memoryType'] },
  { key: 'gpuId',          label: 'GPU',           endpoint: 'gpu',           icon: <Gpu size={22} />,    multi: false, specs: ['memory', 'chipset', 'memoryType'] },
  { key: 'storageDriveIds',label: 'Storage',       endpoint: 'storage-drive', icon: <HardDrive size={22} />,  multi: true,  specs: ['capacity', 'storageType', 'storageInterface'] },
  { key: 'motherboardId',  label: 'Motherboard',   endpoint: 'motherboard',   icon: <Layers size={22} />,     multi: false, specs: ['chipset', 'socket', 'memorySlots'] },
  { key: 'powerSupplyId',  label: 'Power Supply',  endpoint: 'power-supply',  icon: <Zap size={22} />,        multi: false, specs: ['wattage', 'efficencyRating', 'modular'] },
  { key: 'cpuCoolerId',    label: 'CPU Cooler',    endpoint: 'cpu-cooler',    icon: <Thermometer size={22} />, multi: false, specs: ['waterCooled', 'fanSize', 'maxFanRpm'] },
  { key: 'caseId',         label: 'Case',          endpoint: 'case',          icon: <PcCase size={22} />,     multi: false, specs: ['formFactor', 'maxVideoCardLength', 'sidePanel'] },
  { key: 'fanIds',         label: 'Fan',           endpoint: 'fan',           icon: <Fan size={22} />,        multi: true,  specs: ['size', 'connector', 'maxAirflow'] },
  { key: 'monitorIds',     label: 'Monitor',       endpoint: 'monitor',       icon: <Monitor size={22} />,    multi: true,  specs: ['screenSize', 'refreshRate', 'panelType'] },
  { key: 'keyboardId',     label: 'Keyboard',      endpoint: 'keyboard',      icon: <Keyboard size={22} />,   multi: false, specs: [] },
  { key: 'mouseId',        label: 'Mouse',         endpoint: 'mouse',         icon: <Mouse size={22} />,      multi: false, specs: [] },
];

export const STORAGE_KEY = 'daedalus_draft_build';

export const MULTI_COMPONENT_TYPES = new Set(['ram', 'fan', 'storage-drive', 'monitor']);

export const TYPE_TO_BUILD_KEY: Record<string, keyof BuildState> = {
  cpu: 'cpuId',
  gpu: 'gpuId',
  motherboard: 'motherboardId',
  case: 'caseId',
  'power-supply': 'powerSupplyId',
  'cpu-cooler': 'cpuCoolerId',
  keyboard: 'keyboardId',
  mouse: 'mouseId',
  ram: 'ramIds',
  'storage-drive': 'storageDriveIds',
  fan: 'fanIds',
  monitor: 'monitorIds',
};