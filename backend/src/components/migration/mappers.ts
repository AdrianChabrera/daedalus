import { str, num, bool, obj, arr } from 'src/components/utils/utils';
import { Cpu } from '../entities/main-entities/cpu.entity';
import { PcCase } from '../entities/main-entities/pc-case.entity';
import { CpuCooler } from '../entities/main-entities/cpu-cooler.entity';
import { Gpu } from '../entities/main-entities/gpu.entity';
import { PowerSupply } from '../entities/main-entities/power-supply.entity';
import { Ram } from '../entities/main-entities/ram.entity';
import { Fan } from '../entities/main-entities/fan.entity';
import { Monitor } from '../entities/main-entities/monitor.entity';
import { Mouse } from '../entities/main-entities/mouse.entity';
import { Keyboard } from '../entities/main-entities/keyboard.entity';
import { Motherboard } from '../entities/main-entities/motherboard.entity';
import { DataSource } from 'typeorm';
import { PcieSlot } from '../entities/secondary-entities/pcie-slot.entity';
import { M2Slot } from '../entities/secondary-entities/m2-slot.entity';
import { Component } from '../entities/component.entity';
import { StorageDrive } from '../entities/main-entities/storage.entity';

function mapBaseEntity<T extends Component>(
  entity: T,
  raw: Record<string, unknown>,
): T {
  const meta = obj(raw.metadata);

  entity.buildcoresId = raw.opendb_id as string;
  entity.name = str(meta.name) ?? null;
  entity.manufacturer = str(meta.manufacturer) ?? null;
  entity.series = str(meta.series) ?? str(raw.series) ?? null;
  entity.variant = str(meta.variant) ?? null;
  entity.releaseYear = num(meta.releaseYear) ?? null;

  return entity;
}

export function mapCase(raw: Record<string, unknown>): PcCase {
  const entity = mapBaseEntity(new PcCase(), raw);

  if (raw.dimensions_mm) {
    const dimensions = obj(raw.dimensions_mm);
    entity.width = num(dimensions.width) || null;
    entity.height = num(dimensions.height) || null;
    entity.depth = num(dimensions.depth) || null;
  } else {
    const extractedDimensions = str(raw.dimensions)
      ?.split('x')
      .map((dim) => num(dim.trim()));
    if (extractedDimensions && extractedDimensions.length === 3) {
      entity.width = extractedDimensions[1] || null;
      entity.height = extractedDimensions[2] || null;
      entity.depth = extractedDimensions[0] || null;
    }
  }
  entity.maxVideoCardLength = num(raw.max_video_card_length) || null;
  entity.maxCpuCoolerHeight = num(raw.max_cpu_cooler_height) || null;
  entity.internal35bays = num(raw.internal_3_5_bays);
  entity.internal25bays = num(raw.internal_2_5_bays);
  entity.expansionSlots = num(raw.expansion_slots);
  entity.riserExpansionSlots = num(raw.riser_expansion_slots);
  entity.volume = num(raw.volume) || null;
  entity.weight = num(raw.weight) || null;
  entity.formFactor = str(raw.form_factor);
  const includedPowerSupply = str(raw.power_supply);
  const lowerCasedPowerSupply = includedPowerSupply?.toLowerCase();
  if (
    lowerCasedPowerSupply === 'none' ||
    lowerCasedPowerSupply === 'not included' ||
    lowerCasedPowerSupply === 'no' ||
    lowerCasedPowerSupply === 'atx (not included)'
  ) {
    entity.powerSupply = 'None';
  } else {
    entity.powerSupply = includedPowerSupply;
  }
  entity.sidePanel = str(raw.side_panel);
  entity.supportedMotherboardFormFactors =
    arr(raw.supported_motherboard_form_factors) ?? [];
  entity.frontUsbPorts = arr(raw.front_usb_ports) ?? [];
  entity.powerSupplyShroud = bool(raw.power_supply_shroud);

  return entity;
}

export function mapCpu(raw: Record<string, unknown>): Cpu {
  const cores = obj(raw.cores);
  const clocks = obj(raw.clocks);
  const clocksPerformance = obj(clocks.performance);
  const cache = obj(raw.cache);
  const specs = obj(raw.specifications);
  const igpu = obj(specs.integratedGraphics);
  const memory = obj(specs.memory);

  const entity = mapBaseEntity(new Cpu(), raw);

  entity.microarchitecture = str(raw.microarchitecture);
  entity.coreFamily = str(raw.coreFamily);
  entity.socket = str(raw.socket);

  entity.coreCount = num(cores.total) || null;
  entity.threadCount = num(cores.threads) || null;

  const baseClock = num(clocksPerformance.base);
  entity.baseClock =
    (baseClock != null
      ? baseClock > 100
        ? baseClock / 1000
        : baseClock
      : null) || null;
  const boostClock = num(clocksPerformance.boost);
  entity.boostClock =
    (boostClock != null
      ? boostClock > 100
        ? boostClock / 1000
        : boostClock
      : null) || null;

  entity.cachel1 = str(cache.l1);
  entity.cachel2 = num(cache.l2);
  entity.cachel3 = num(cache.l3);

  entity.tdp = num(specs.tdp) || null;
  entity.ppt = num(specs.ppt) || null;
  entity.simultaneousMultithreading = bool(specs.simultaneousMultithreading);
  entity.eccSupport = bool(specs.eccSupport);
  entity.includesCooler = bool(specs.includesCooler);
  entity.integratedGraphics = str(igpu.model);

  const maxSupportedMemory = num(memory.maxSupport) || null;
  entity.maxSupportedMemory = maxSupportedMemory
    ? maxSupportedMemory > 10
      ? maxSupportedMemory
      : maxSupportedMemory * 1000
    : null;
  entity.supportedMemoryTypes = arr(memory.types);

  return entity;
}

export function mapCpuCooler(raw: Record<string, unknown>): CpuCooler {
  const entity = mapBaseEntity(new CpuCooler(), raw);

  const minFanRpm = num(raw.min_fan_rpm) || null;
  entity.minFanRpm = minFanRpm && minFanRpm > 1 ? minFanRpm : null;
  entity.maxFanRpm = num(raw.max_fan_rpm) || null;
  entity.fanSize = num(raw.fan_size) || null;
  entity.fanQuantity = num(raw.fan_quantity);
  entity.minNoiseLevel = num(raw.min_noise_level) || null;
  entity.maxNoiseLevel = num(raw.max_noise_level) || null;
  entity.height = num(raw.height) || null;
  entity.radiatorSize = num(raw.radiator_size) || null;
  entity.waterCooled = bool(raw.water_cooled);
  entity.fanless = bool(raw.fanless);

  entity.supportedSockets = arr(raw.cpu_sockets) ?? [];

  return entity;
}

export function mapFan(raw: Record<string, unknown>): Fan {
  const entity = mapBaseEntity(new Fan(), raw);

  entity.quantity = num(raw.quantity);
  entity.minNoiseLevel = num(raw.min_noise_level) || null;
  entity.maxNoiseLevel = num(raw.max_noise_level) || null;
  const minAirflow = num(raw.min_airflow);
  const filteredMinAirflow =
    minAirflow != null && minAirflow >= 0 && minAirflow < 350
      ? minAirflow
      : null;
  entity.minAirflow = filteredMinAirflow;
  const maxAirflow = num(raw.max_airflow);
  if (filteredMinAirflow && !maxAirflow) {
    entity.maxAirflow = filteredMinAirflow;
  } else {
    entity.maxAirflow =
      maxAirflow != null && maxAirflow >= 5 && maxAirflow < 350
        ? maxAirflow
        : null;
  }
  entity.size = num(raw.size) || null;
  entity.staticPressure = num(raw.static_pressure) || null;
  entity.led = str(raw.led);
  entity.connector = str(raw.connector);
  entity.controller = str(raw.controller);
  entity.flowDirection = str(raw.flow_direction);
  entity.pwm = bool(raw.pwm);

  return entity;
}

export function mapGpu(raw: Record<string, unknown>): Gpu {
  const powerConnectors = obj(raw.power_connectors);
  const videoOutputs = obj(raw.video_outputs);

  const entity = mapBaseEntity(new Gpu(), raw);

  entity.memory = num(raw.memory) || null;
  entity.coreBaseClock = num(raw.core_base_clock) || null;
  entity.coreBoostClock = num(raw.core_boost_clock) || null;
  entity.effectiveMemoryClock = num(raw.effective_memory_clock) || null;
  entity.memoryBus = num(raw.memory_bus) || null;
  entity.length = num(raw.length) || null;
  entity.tdp = num(raw.tdp) || null;
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
  entity.gpuInterface = str(raw.interface);

  return entity;
}

export function mapKeyboard(raw: Record<string, unknown>): Keyboard {
  const entity = mapBaseEntity(new Keyboard(), raw);

  return entity;
}

export function mapMonitor(raw: Record<string, unknown>): Monitor {
  const resolution = obj(raw.resolution);

  const entity = mapBaseEntity(new Monitor(), raw);

  entity.horizontalRes = num(resolution.horizontalRes) || null;
  entity.verticalRes = num(resolution.verticalRes) || null;
  entity.refreshRate = num(raw.refresh_rate) || null;
  const responseTime = num(raw.response_time);
  entity.responseTime =
    responseTime != null && responseTime < 50 ? responseTime : null;
  entity.screenSize = num(raw.screen_size) || null;
  entity.panelType = str(raw.panel_type);
  entity.aspectRatio = str(raw.aspect_ratio);
  entity.connectors = str(raw.connectors);
  entity.maxBrightness = str(raw.max_brightness);
  entity.adaptiveSync = str(raw.adaptive_sync);

  return entity;
}

export async function mapMotherboard(
  raw: Record<string, unknown>,
  dataSource: DataSource,
): Promise<Motherboard> {
  const pcieSlotRepository = dataSource.getRepository(PcieSlot);
  const m2SlotRepository = dataSource.getRepository(M2Slot);

  const memory = obj(raw.memory);
  const storageDevices = obj(raw.storage_devices);
  const usbHeaders = obj(raw.usb_headers);
  const biosFeatures = obj(raw.bios_features);
  const audio = obj(raw.audio);
  const pcieSlots = (raw.pcie_slots as Record<string, unknown>[]) ?? [];
  const m2Slots = (raw.m2_slots as Record<string, unknown>[]) ?? [];
  const onboardEthernet =
    (raw.onboard_ethernet as Record<string, unknown>[]) ?? [];

  const entity = mapBaseEntity(new Motherboard(), raw);

  entity.maxMemory = num(memory.max) || null;
  entity.memorySlots = num(memory.slots);
  entity.sata6GbSPorts = num(storageDevices.sata_6_gb_s);
  entity.sata3GbSPorts = num(storageDevices.sata_3_gb_s);
  entity.u2Ports = num(storageDevices.u2);
  entity.usb20Headers = num(usbHeaders.usb_2_0);
  entity.usb32Gen1Headers = num(usbHeaders.usb_3_2_gen_1);
  entity.usb32Gen2Headers = num(usbHeaders.usb_3_2_gen_2);
  entity.usb32Gen2x2Headers = num(usbHeaders.usb_3_2_gen_2x2);
  entity.usb4Headers = num(usbHeaders.usb_4);
  entity.socket = str(raw.socket);
  entity.ramType = str(memory.ram_type);
  entity.audio =
    [str(audio?.chipset), str(audio?.channels)].filter(Boolean).join(' ') ||
    null;
  entity.chipset = str(raw.chipset);
  entity.wirelessNetworking = str(raw.wireless_networking);
  entity.formFactor = str(raw.form_factor);
  entity.backPanelPorts = arr(raw.back_panel_ports);
  entity.biosFlashback = bool(biosFeatures.flashback);
  entity.biosClearCmos = bool(biosFeatures.clear_cmos);
  entity.eccSupport = bool(raw.ecc_support);
  entity.raidSupport = bool(raw.raid_support);
  entity.backConnect = bool(raw.back_connect_connectors);
  entity.onboardEthernet =
    onboardEthernet
      .map((e) => [str(e?.controller), str(e?.speed)].filter(Boolean).join(' '))
      .filter(Boolean)
      .join(', ') || null;

  pcieSlots.map((p) => {
    const quantity = num(p.quantity) || 1;
    p.quantity = quantity < 10 ? quantity : 1;
  });

  entity.m2SlotCount = m2Slots.length;
  entity.pcieSlotCount = pcieSlots
    .map((p) => {
      return num(p.quantity) || 1;
    })
    .reduce((sum, q) => sum + q, 0);

  await pcieSlotRepository.delete({
    motherboard: { buildcoresId: entity.buildcoresId },
  });
  await Promise.all(
    pcieSlots.map((p) =>
      pcieSlotRepository.save({
        ...p,
        lanes: num(p.lanes) || null,
        motherboard: entity,
      }),
    ),
  );

  await m2SlotRepository.delete({
    motherboard: { buildcoresId: entity.buildcoresId },
  });
  await Promise.all(
    m2Slots.map((m) =>
      m2SlotRepository.save({
        ...m,
        m2Interface: str(m.interface),
        motherboard: entity,
      }),
    ),
  );

  return entity;
}

export function mapMouse(raw: Record<string, unknown>): Mouse {
  const entity = mapBaseEntity(new Mouse(), raw);

  return entity;
}

export function mapPowerSupply(raw: Record<string, unknown>): PowerSupply {
  const connectors = obj(raw.connectors);

  const entity = mapBaseEntity(new PowerSupply(), raw);

  entity.atx24Pin = num(connectors.atx_24_pin);
  entity.eps8Pin = num(connectors.eps_8_pin);
  entity.pcie12Vhpwr = num(connectors.pcie_12vhpwr);
  entity.pcie6Plus2Pin = num(connectors.pcie_6_plus_2_pin);
  entity.sata = num(connectors.sata);
  entity.wattage = num(raw.wattage) || null;
  entity.length = num(raw.length) || null;
  entity.fanless = bool(raw.fanless);
  entity.formFactor = str(raw.form_factor);
  entity.efficencyRating = str(raw.efficiency_rating);
  entity.modular = str(raw.modular);

  return entity;
}

export function mapRam(raw: Record<string, unknown>): Ram {
  const modules = obj(raw.modules);

  const entity = mapBaseEntity(new Ram(), raw);

  entity.quantity = num(modules.quantity);

  entity.capacity = num(raw.capacity) || null;
  entity.speed = num(raw.speed) || null;
  entity.formFactor = str(raw.form_factor) || null;
  entity.casLatency = num(raw.cas_latency) || null;
  entity.voltage = num(raw.voltage) || null;
  entity.ecc = str(raw.ecc) == 'ECC' ? true : false;
  entity.heatSpreader = bool(raw.heat_spreader) || null;
  entity.rgb = bool(raw.rgb) || null;
  entity.memoryType = str(raw.ram_type);
  entity.timings = str(raw.timings);

  return entity;
}

export function mapStorage(raw: Record<string, unknown>): StorageDrive {
  const entity = mapBaseEntity(new StorageDrive(), raw);

  entity.capacity = num(raw.capacity);
  entity.storageType = str(raw.storage_type);
  entity.formFactor = str(raw.form_factor);
  entity.storageInterface = str(raw.interface);
  entity.nvme = bool(raw.nvme);

  return entity;
}
