import { Build } from 'src/builds/entities/build';
import { BuildRam } from 'src/builds/entities/build-rams.entity';
import { BuildStorageDrive } from 'src/builds/entities/build-storage-drives.entity';
import { CpuCooler } from 'src/components/entities/main-entities/cpu-cooler.entity';
import { Cpu } from 'src/components/entities/main-entities/cpu.entity';
import { Gpu } from 'src/components/entities/main-entities/gpu.entity';
import { Motherboard } from 'src/components/entities/main-entities/motherboard.entity';
import { PcCase } from 'src/components/entities/main-entities/pc-case.entity';
import { PowerSupply } from 'src/components/entities/main-entities/power-supply.entity';
import { Ram } from 'src/components/entities/main-entities/ram.entity';
import { StorageDrive } from 'src/components/entities/main-entities/storage.entity';
import { M2Slot } from 'src/components/entities/secondary-entities/m2-slot.entity';
import { PcieSlot } from 'src/components/entities/secondary-entities/pcie-slot.entity';

export function makeBuild(overrides: Partial<Build> = {}): Build {
  const b = new Build();
  b.fans = [];
  b.rams = [];
  b.monitors = [];
  b.storageDrives = [];
  return Object.assign(b, overrides);
}

export function makeCpu(overrides: Partial<Cpu> = {}): Cpu {
  const c = new Cpu();
  c.name = 'Test CPU';
  c.socket = 'AM5';
  c.includesCooler = false;
  c.integratedGraphics = 'None';
  c.supportedMemoryTypes = ['DDR5'];
  c.tdp = 65;
  c.manufacturer = 'AMD';
  c.eccSupport = false;
  return Object.assign(c, overrides);
}

export function makeMotherboard(
  overrides: Partial<Motherboard> = {},
): Motherboard {
  const m = new Motherboard();
  m.name = 'Test Motherboard';
  m.socket = 'AM5';
  m.ramType = 'DDR5';
  m.memorySlots = 4;
  m.maxMemory = 128;
  m.formFactor = 'ATX';
  m.sata6GbSPorts = 4;
  m.sata3GbSPorts = 0;
  m.u2Ports = 0;
  m.m2Slots = [];
  m.pcieSlots = [];
  m.cpuPowerConnectors = ['8-pin'];
  m.eccSupport = false;
  return Object.assign(m, overrides);
}

export function makeCpuCooler(overrides: Partial<CpuCooler> = {}): CpuCooler {
  const c = new CpuCooler();
  c.name = 'Test Cooler';
  c.supportedSockets = ['AM5'];
  c.waterCooled = false;
  c.height = 150;
  return Object.assign(c, overrides);
}

export function makeGpu(overrides: Partial<Gpu> = {}): Gpu {
  const g = new Gpu();
  g.name = 'Test GPU';
  g.length = 300;
  g.tdp = 200;
  g.pcie6Pin = 0;
  g.pcie8Pin = 2;
  g.pcie12VHPWR = 0;
  g.pcie12V2x6 = 0;
  g.gpuInterface = 'PCIe 4.0 x16';
  return Object.assign(g, overrides);
}

export function makePcCase(overrides: Partial<PcCase> = {}): PcCase {
  const p = new PcCase();
  p.name = 'Test Case';
  p.maxVideoCardLength = 400;
  p.maxCpuCoolerHeight = 165;
  p.internal25bays = 2;
  p.internal35bays = 2;
  p.supportedMotherboardFormFactors = ['ATX', 'Micro ATX', 'Mini-ITX'];
  p.powerSupply = 'None';
  p.height = 450;
  p.width = 220;
  p.depth = 400;
  return Object.assign(p, overrides);
}

export function makePowerSupply(
  overrides: Partial<PowerSupply> = {},
): PowerSupply {
  const ps = new PowerSupply();
  ps.name = 'Test PSU';
  ps.wattage = 750;
  ps.pcie6Plus2Pin = 4;
  ps.pcie12Vhpwr = 0;
  ps.sata = 6;
  ps.eps8Pin = 2;
  return Object.assign(ps, overrides);
}

export function makeRam(overrides: Partial<Ram> = {}): Ram {
  const r = new Ram();
  r.name = 'Test RAM';
  r.memoryType = 'DDR5';
  r.formFactor = 'DIMM';
  r.quantity = 2;
  r.capacity = 16;
  r.ecc = false;
  return Object.assign(r, overrides);
}

export function makeBuildRam(ram: Ram, quantity = 1): BuildRam {
  const br = new BuildRam();
  br.ram = ram;
  br.quantity = quantity;
  return br;
}

export function makeStorageDrive(
  overrides: Partial<StorageDrive> = {},
): StorageDrive {
  const s = new StorageDrive();
  s.name = 'Test SSD';
  s.formFactor = 'M.2 2280';
  s.storageInterface = 'M.2 PCIe 4.0 x4';
  s.nvme = true;
  return Object.assign(s, overrides);
}

export function makeBuildStorage(
  drive: StorageDrive,
  quantity = 1,
): BuildStorageDrive {
  const bs = new BuildStorageDrive();
  bs.storageDrive = drive;
  bs.quantity = quantity;
  return bs;
}

export function makeM2Slot(overrides: Partial<M2Slot> = {}): M2Slot {
  const s = new M2Slot();
  s.size = '2280';
  s.key = 'M';
  s.m2Interface = 'PCIe 4.0 x4';
  return Object.assign(s, overrides);
}

export function makePcieSlot(overrides: Partial<PcieSlot> = {}): PcieSlot {
  const s = new PcieSlot();
  s.gen = '4';
  s.lanes = 16;
  s.quantity = 1;
  return Object.assign(s, overrides);
}
