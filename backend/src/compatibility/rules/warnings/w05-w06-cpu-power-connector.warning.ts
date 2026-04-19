import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from 'src/compatibility/consts/compatibilityMessages';

@Injectable()
export class W05W06CpuPowerConnectorWarning implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { powerSupply, motherboard } = build;
    if (!motherboard || !powerSupply) return null;

    if (powerSupply.eps8Pin === null || powerSupply.eps8Pin === undefined) {
      return {
        rule: 'W05_W06_CPU_POWER_CONNECTOR',
        severity: 'unverifiable',
        message:
          `We are sorry, but we cannot verify how many CPU cables the power supply has because of lack of information` +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [powerSupply.name ?? 'Power Supply'],
      };
    }

    const powerSupplyEps8PinPorts = Number(powerSupply.eps8Pin);

    if (powerSupplyEps8PinPorts < 1) {
      return {
        rule: 'W05_W06_CPU_POWER_CONNECTOR',
        severity: 'warning',
        message: `Nowadays, almost all CPUs need one or more 8-pin cables from the power supply, and this power supply doesn't have any. Please, check if your CPU really doesn't need one before buying.`,
        components: [powerSupply.name ?? 'Power Supply'],
      };
    }

    const motherboardCpuConnectorsCount =
      motherboard.cpuPowerConnectors?.length;

    if (
      motherboardCpuConnectorsCount &&
      motherboardCpuConnectorsCount > powerSupplyEps8PinPorts
    ) {
      return {
        rule: 'W05_W06_CPU_POWER_CONNECTOR',
        severity: 'warning',
        message: `Be careful, your motherboard demands the following CPU connectors: (${motherboard.cpuPowerConnectors?.join(', ')}), but your power supply only offers (${powerSupplyEps8PinPorts} ports). If you buy a low-budget cpu, it will work out, but if you select a high-end CPU, you'll need to use all the motherboard's CPU power ports..`,
        components: [powerSupply.name ?? 'Power Supply'],
      };
    }

    return null;
  }
}
