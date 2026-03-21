import { str, num, bool, obj, arr } from 'src/components/utils/utils';
import { Case } from 'src/components/entities/main-entities/case.entity';

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
