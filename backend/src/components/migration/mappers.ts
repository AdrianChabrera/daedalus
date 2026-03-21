import { str, num, bool, obj, arr } from 'src/components/utils/utils';
import { Cpu } from '../entities/main-entities/cpu.entity';
import { Case } from '../entities/main-entities/case.entity';
import { CpuCooler } from '../entities/main-entities/cpu-cooler.entity';
import { Gpu } from '../entities/main-entities/gpu.entity';
import { PowerSupply } from '../entities/main-entities/power-supply.entity';
import { Ram } from '../entities/main-entities/ram.entity';
import { Fan } from '../entities/main-entities/fan.entity';

export function mapCase(raw: Record<string, unknown>): Case {
  const entity = new Case();

  const meta = obj(raw.metadata);
  const dimensions = obj(raw.dimensions_mm);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.width = num(dimensions.width);
  entity.height = num(dimensions.height);
  entity.depth = num(dimensions.depth);
  entity.maxVideoCardLength = num(raw.max_video_card_length);
  entity.maxCpuCoolerHeight = num(raw.max_cpu_cooler_height);
  entity.internal35bays = num(raw.internal_3_5_bays);
  entity.internal25bays = num(raw.internal_2_5_bays);
  entity.expansionSlots = num(raw.expansion_slots);
  entity.riserExpansionSlots = num(raw.riser_expansion_slots);
  entity.volume = num(raw.volume);
  entity.weight = num(raw.weight);
  entity.formFactor = str(raw.form_factor);
  entity.powerSupply = str(raw.power_supply);
  entity.sidePanel = str(raw.side_panel);
  entity.supportedMotherboardFormFactors =
    arr(raw.supported_motherboard_form_factors) ?? [];
  entity.frontUsbPorts = arr(raw.front_usb_ports) ?? [];
  entity.powerSupplyShroud = bool(raw.power_supply_shroud);

  return entity;
}

export function mapCpu(raw: Record<string, unknown>): Cpu {
  const entity = new Cpu();

  const meta = obj(raw.metadata);
  const cores = obj(raw.cores);
  const clocks = obj(raw.clocks);
  const clocksPerformance = obj(clocks.performance);
  const cache = obj(raw.cache);
  const specs = obj(raw.specifications);
  const igpu = obj(specs.integratedGraphics);
  const memory = obj(specs.memory);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.microarchitecture = str(raw.microarchitecture);
  entity.coreFamily = str(raw.coreFamily);
  entity.socket = str(raw.socket);

  entity.coreCount = num(cores.total);
  entity.threadCount = num(cores.threads);

  entity.baseClock = num(clocksPerformance.base);
  entity.boostClock = num(clocksPerformance.boost);

  entity.cachel1 = str(cache.l1);
  entity.cachel2 = num(cache.l2);
  entity.cachel3 = num(cache.l3);

  entity.tdp = num(specs.tdp);
  entity.simultaneousMultithreading = bool(specs.simultaneousMultithreading);
  entity.eccSupport = bool(specs.eccSupport);
  entity.includesCooler = bool(specs.includesCooler);
  entity.integratedGraphics = str(igpu.model);

  entity.maxSupportedMemory = num(memory.maxSupport);
  //TODO: añadir supportedMemoryTypes cuando se añadan las RAMs

  return entity;
}

export function mapCpuCooler(raw: Record<string, unknown>): CpuCooler {
  const entity = new CpuCooler();

  const meta = obj(raw.metadata);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.minFanRpm = num(raw.min_fan_rpm);
  entity.maxFanRpm = num(raw.max_fan_rpm);
  entity.fanSize = num(raw.fan_size);
  entity.fanQuantity = num(raw.fan_quantity);
  entity.minNoiseLevel = num(raw.min_noise_level);
  entity.maxNoiseLevel = num(raw.max_noise_level);
  entity.height = num(raw.height);
  entity.radiatorSize = num(raw.radiator_size);
  entity.waterCooled = bool(raw.water_cooled);
  entity.fanless = bool(raw.fanless);

  entity.supportedSockets = arr(raw.cpu_sockets) ?? [];

  return entity;
}

export function mapGpu(raw: Record<string, unknown>): Gpu {
  const entity = new Gpu();

  const meta = obj(raw.metadata);
  const powerConnectors = obj(raw.power_connectors);
  const videoOutputs = obj(raw.video_outputs);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.memory = num(raw.memory);
  entity.coreBaseClock = num(raw.core_base_clock);
  entity.coreBoostClock = num(raw.core_boost_clock);
  entity.effectiveMemoryClock = num(raw.effective_memory_clock);
  entity.memoryBus = num(raw.memory_bus);
  entity.length = num(raw.length);
  entity.tdp = num(raw.tdp);
  entity.pcie6Pin = num(powerConnectors.pcie_6_pin);
  entity.pcie8Pin = num(powerConnectors.pcie_8_pin);
  entity.pcie12VHPWR = num(powerConnectors.pcie_12VHPWR);
  entity.pcie12V2x6 = num(powerConnectors.pcie_12V_2x6);
  entity.hdmi21 = num(videoOutputs.hdmi_2_1);
  entity.hdmi20 = num(videoOutputs.hdmi_2_0);
  entity.displayPort21 = num(videoOutputs.displayport_2_1);
  entity.displayPort21a = num(videoOutputs.displayport_2_1a);
  entity.displayPort14a = num(videoOutputs.displayport_1_4a);
  entity.dvid = num(videoOutputs.dvi_d);
  entity.vga = num(videoOutputs.vga);
  entity.chipset = str(raw.chipset);
  entity.memoryType = str(raw.memory_type);
  entity.interface = str(raw.interface);

  return entity;
}

export function mapPowerSupply(raw: Record<string, unknown>): PowerSupply {
  const entity = new PowerSupply();

  const meta = obj(raw.metadata);
  const connectors = obj(raw.connectors);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.atx24Pin = num(connectors.atx_24_pin);
  entity.eps8Pin = num(connectors.eps_8_pin);
  entity.pcie12Vhpwr = num(connectors.pcie_12vhpwr);
  entity.pcie6Plus2Pin = num(connectors.pcie_6_plus_2_pin);
  entity.sata = num(connectors.sata);
  entity.wattage = num(raw.wattage);
  entity.length = num(raw.length);
  entity.fanless = bool(raw.fanless);
  entity.formFactor = str(raw.form_factor);
  entity.efficiencyRating = str(raw.efficiency_rating);
  entity.modular = str(raw.modular);

  return entity;
}

export function mapRam(raw: Record<string, unknown>): Ram {
  const entity = new Ram();

  const meta = obj(raw.metadata);
  const modules = obj(raw.modules);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.quantity = num(modules.quantity);

  entity.capacity = num(raw.capacity) ?? null;
  entity.speed = num(raw.speed) ?? null;
  entity.formFactor = str(raw.form_factor) ?? '';
  entity.casLatency = num(raw.cas_latency) ?? null;
  entity.voltage = num(raw.voltage) ?? null;
  entity.ecc = bool(raw.ecc) ?? null;
  entity.heatSpreader = bool(raw.heat_spreader) ?? null;
  entity.rgb = bool(raw.rgb) ?? null;
  entity.type = str(raw.ram_type);

  return entity;
}

export function mapStorage(raw: Record<string, unknown>): Storage {
  const entity = new Storage();

  const meta = obj(raw.metadata);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? '';
  entity.manufacturer = str(meta.manufacturer) ?? '';
  entity.series = str(meta.series) ?? str(raw.series) ?? '';
  entity.variant = str(meta.variant) ?? '';
  entity.releaseYear = num(meta.releaseYear) ?? 0;

  entity.capacity = num(raw.capacity);
  entity.type = str(raw.storage_type);
  entity.formFactor = str(raw.form_factor);
  entity.interface = str(raw.interface);
  entity.nvme = bool(raw.nvme);

  return entity;
}
