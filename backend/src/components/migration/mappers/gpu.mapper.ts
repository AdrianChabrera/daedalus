import { str, num, obj } from 'src/components/utils/utils';
import { Gpu } from 'src/components/entities/main-entities/gpu.entity';

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
