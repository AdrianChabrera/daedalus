import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';
import { FEEL_FREE_TO_CONTRIBUTE } from '../../consts/compatibilityMessages';

@Injectable()
export class R05GpuPowerConnectorsRule implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { gpu, powerSupply } = build;
    if (!gpu || !powerSupply) return null;

    const allGpuConnectorDataMissing =
      gpu.pcie6Pin === null &&
      gpu.pcie8Pin === null &&
      gpu.pcie12V2x6 === null &&
      gpu.pcie12VHPWR === null;

    if (allGpuConnectorDataMissing) {
      return {
        rule: 'R05_GPU_POWER_CONNECTORS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the connectivity between the GPU and the power supply because the GPU power connector information is missing.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [gpu.name ?? 'GPU', powerSupply.name ?? 'Power Supply'],
      };
    }

    const demanded8Pin =
      (gpu.pcie6Pin !== null ? gpu.pcie6Pin : 0) +
      (gpu.pcie8Pin !== null ? gpu.pcie8Pin : 0);
    const demanded16Pin = (gpu.pcie12V2x6 ?? 0) + (gpu.pcie12VHPWR ?? 0);

    if (demanded8Pin === 0 && demanded16Pin === 0) return null;

    const needs8Pin = demanded8Pin > 0;
    const needs16Pin = demanded16Pin > 0;

    if (needs8Pin && powerSupply.pcie6Plus2Pin === null) {
      return {
        rule: 'R05_GPU_POWER_CONNECTORS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the connectivity between the GPU and the power supply because the power supply 6+2-pin connector count is missing.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [gpu.name ?? 'GPU', powerSupply.name ?? 'Power Supply'],
      };
    }

    if (
      needs16Pin &&
      powerSupply.pcie12Vhpwr === null &&
      powerSupply.pcie6Plus2Pin === null
    ) {
      return {
        rule: 'R05_GPU_POWER_CONNECTORS',
        severity: 'unverifiable',
        message:
          'We are sorry, but we cannot verify the connectivity between the GPU and the power supply because the power supply 16-pin and 6+2-pin connector counts are both missing.' +
          FEEL_FREE_TO_CONTRIBUTE,
        components: [gpu.name ?? 'GPU', powerSupply.name ?? 'Power Supply'],
      };
    }

    const offered8Pin = powerSupply.pcie6Plus2Pin ?? 0;
    const offered16Pin = powerSupply.pcie12Vhpwr ?? 0;

    if (demanded8Pin > offered8Pin) {
      return {
        rule: 'R05_GPU_POWER_CONNECTORS',
        severity: 'error',
        message: `GPU demands ${demanded8Pin} 6+2-pin connector(s), but the power supply only offers ${offered8Pin}.`,
        components: [gpu.name ?? 'GPU', powerSupply.name ?? 'Power Supply'],
      };
    }

    if (demanded16Pin > offered16Pin) {
      const free8Pin = offered8Pin - demanded8Pin;

      if (free8Pin < 2) {
        return {
          rule: 'R05_GPU_POWER_CONNECTORS',
          severity: 'error',
          message: `GPU requires a 16-pin connector, but the power supply does not have one natively 
            and doesn't have enough 6+2-pin cables available for an adapter.`,
          components: [gpu.name ?? 'GPU', powerSupply.name ?? 'Power Supply'],
        };
      }

      return {
        rule: 'R05_GPU_POWER_CONNECTORS',
        severity: 'warning',
        message: `The power supply does not have a native 16-pin connector required by the GPU. 
          You will need to use an adapter, which typically requires between 2 and 4 spare 6+2-pin 
          cables. You currently have ${free8Pin} spare cable(s) available.
          Please verify the exact cable requirement in your GPU's official 
          specifications, and make sure that an adapter is either included in 
          the box or purchased separately if not.`,
        components: [gpu.name ?? 'GPU', powerSupply.name ?? 'Power Supply'],
      };
    }

    return null;
  }
}
