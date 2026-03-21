import { str, num, bool, obj } from 'src/components/utils/utils';
import { PowerSupply } from 'src/components/entities/main-entities/power-supply.entity';

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
