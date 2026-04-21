import {
  makeBuild,
  makeCpu,
  makeMotherboard,
  makeCpuCooler,
  makeGpu,
  makePcCase,
  makePowerSupply,
  makeRam,
  makeBuildRam,
  makeStorageDrive,
  makeBuildStorage,
  makeM2Slot,
  makePcieSlot,
} from '../utils/test-factories';

import { R01CpuMotherboardSocketRule } from './rules/r01-cpu-motherboard-socket.rule';
import { R02CpuCpuCoolerSocketRule } from './rules/r02-cpu-cpu-cooler-socket.rule';
import { R03CpuRamTypeRule } from './rules/r03-cpu-ram-type.rule';
import { R04CpuMustHaveCoolerRule } from './rules/r04-cpu-must-have-cooler.rule';
import { R05GpuPowerConnectorsRule } from './rules/r05-gpu-power-connectors.rule';
import { R06GpuFitsInCaseRule } from './rules/r06-gpu-fits-in-case.rule';
import { R07R11PcieSlotAssignmentRule } from './rules/r07-r11-pcie-slot-assignments.rule';
import { R08SystemMustHaveGpuRule } from './rules/r08-system-must-have-gpu.rule';
import { R09R10M2SlotAssignmentRule } from './rules/r09-r10-m2-drive-needs-slot.rule';
import { R12R13DrivesBaysRule } from './rules/r12-r13-SSD-HDD-bays.rule';
import { R14RamMotherboardMemoryTypeRule } from './rules/r14-ram-motherboard-memory-type.rule';
import { R15RamQuantityLimitRule } from './rules/r15-ram-quantity-limit.rule';
import { R16RamMotherboardMaxMemoryRule } from './rules/r16-ram-motherboard-max-memory.rule';
import { R17RamMotherboardFormFactorRule } from './rules/r17-ram-motherboard-form-factor.rule';
import { R18MotherboardCaseFormFactorRule } from './rules/r18-motherboard-case-form-factor.rule';
import { R19CpuCoolerFitsInCaseRule } from './rules/r19-cpu-cooler-fits-in-case-rule';
import { R20RadiatorFitsInCaseRule } from './rules/r20-radiator-fits-in-case.rule';
import { R21PSUEnoughEneryForAllSystemRule } from './rules/r21-psu-enough-energy-for-all-system.rule';
import { R22MotherboardSataPortsRule } from './rules/r22-motherboard-sata-ports.rule';
import { R23MotherbardU2PortsRule } from './rules/r23-motherboard-u2-ports.rule';
import { R24R25SATAConnectorsRule } from './rules/r24-r25-SATA-power-connectors.rule';

import {
  parseM2Sizes,
  parseSlotKey,
  parseM2Interface,
  comparePcieGen,
  isM2Drive,
  isWifiSlot,
  getStorageSlots,
  keysAreCompatible,
} from '../utils/m2-slot-utils';

import {
  parseGpuInterface,
  expandPcieSlots,
  gpuFitsInSlot,
  nvmeFitsInSlot,
  maximumMatching,
  parseNvmePcieInterface,
} from '../utils/pcie-slot-utils';

describe('R01CpuMotherboardSocketRule', () => {
  const rule = new R01CpuMotherboardSocketRule();

  it('returns null when cpu or motherboard is missing', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(rule.check(makeBuild({ cpu: makeCpu() }))).toBeNull();
    expect(
      rule.check(makeBuild({ motherboard: makeMotherboard() })),
    ).toBeNull();
  });

  it('returns unverifiable when socket info is missing', () => {
    const result = rule.check(
      makeBuild({
        cpu: makeCpu({ socket: null }),
        motherboard: makeMotherboard(),
      }),
    );
    expect(result?.severity).toBe('unverifiable');
    expect(result?.rule).toBe('R01_CPU_MOTHERBOARD_SOCKET');
  });

  it('returns error when sockets do not match', () => {
    const result = rule.check(
      makeBuild({
        cpu: makeCpu({ socket: 'AM5' }),
        motherboard: makeMotherboard({ socket: 'LGA1700' }),
      }),
    );
    expect(result?.severity).toBe('error');
    expect(result?.message).toContain('AM5');
    expect(result?.message).toContain('LGA1700');
  });

  it('returns null when sockets match', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ socket: 'AM5' }),
          motherboard: makeMotherboard({ socket: 'AM5' }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R02CpuCpuCoolerSocketRule', () => {
  const rule = new R02CpuCpuCoolerSocketRule();

  it('returns null when cpu or cooler is absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(rule.check(makeBuild({ cpu: makeCpu() }))).toBeNull();
  });

  it('returns unverifiable when cpu socket is null', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ socket: null }),
          cpuCooler: makeCpuCooler({ supportedSockets: ['AM5'] }),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns unverifiable when cooler has no supported sockets', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ socket: 'AM5' }),
          cpuCooler: makeCpuCooler({ supportedSockets: [] }),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when socket is not supported', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ socket: 'AM5' }),
          cpuCooler: makeCpuCooler({ supportedSockets: ['LGA1700'] }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when socket is supported', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ socket: 'AM5' }),
          cpuCooler: makeCpuCooler({ supportedSockets: ['AM5', 'AM4'] }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R03CpuRamTypeRule', () => {
  const rule = new R03CpuRamTypeRule();

  it('returns null when cpu or rams absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(rule.check(makeBuild({ cpu: makeCpu() }))).toBeNull();
  });

  it('returns null when rams array is empty', () => {
    expect(rule.check(makeBuild({ cpu: makeCpu(), rams: [] }))).toBeNull();
  });

  it('returns unverifiable when cpu has no supported memory types', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ supportedMemoryTypes: [] }),
          rams: [makeBuildRam(makeRam({ memoryType: 'DDR5' }))],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns unverifiable when a ram has no memory type', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ supportedMemoryTypes: ['DDR5'] }),
          rams: [makeBuildRam(makeRam({ memoryType: null }))],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when ram type not in cpu supported types', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ supportedMemoryTypes: ['DDR4'] }),
          rams: [makeBuildRam(makeRam({ memoryType: 'DDR5' }))],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when all ram types are supported', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ supportedMemoryTypes: ['DDR5', 'DDR4'] }),
          rams: [makeBuildRam(makeRam({ memoryType: 'DDR5' }))],
        }),
      ),
    ).toBeNull();
  });
});

describe('R04CpuMustHaveCoolerRule', () => {
  const rule = new R04CpuMustHaveCoolerRule();

  it('returns null when no cpu', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when includesCooler is null and no cooler provided', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ includesCooler: null }),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when includesCooler is null but cooler is provided', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ includesCooler: null }),
          cpuCooler: makeCpuCooler(),
        }),
      ),
    ).toBeNull();
  });

  it('returns error when cpu has no cooler and no cooler is assigned', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ includesCooler: false }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when cpu includes cooler', () => {
    expect(
      rule.check(makeBuild({ cpu: makeCpu({ includesCooler: true }) })),
    ).toBeNull();
  });

  it('returns null when cpu has no cooler but an external cooler is added', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ includesCooler: false }),
          cpuCooler: makeCpuCooler(),
        }),
      ),
    ).toBeNull();
  });
});

describe('R05GpuPowerConnectorsRule', () => {
  const rule = new R05GpuPowerConnectorsRule();

  it('returns null when gpu or psu absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(rule.check(makeBuild({ gpu: makeGpu() }))).toBeNull();
  });

  it('returns unverifiable when all gpu connector data is null', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({
            pcie6Pin: null,
            pcie8Pin: null,
            pcie12VHPWR: null,
            pcie12V2x6: null,
          }),
          powerSupply: makePowerSupply(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when gpu demands no power connectors', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({
            pcie6Pin: 0,
            pcie8Pin: 0,
            pcie12VHPWR: 0,
            pcie12V2x6: 0,
          }),
          powerSupply: makePowerSupply(),
        }),
      ),
    ).toBeNull();
  });

  it('returns error when psu does not have enough 8-pin connectors', () => {
    const result = rule.check(
      makeBuild({
        gpu: makeGpu({
          pcie6Pin: 0,
          pcie8Pin: 3,
          pcie12VHPWR: 0,
          pcie12V2x6: 0,
        }),
        powerSupply: makePowerSupply({ pcie6Plus2Pin: 2 }),
      }),
    );
    expect(result?.severity).toBe('error');
    expect(result?.message).toContain('3');
  });

  it('returns warning when gpu needs 16-pin but psu can provide via adapter', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({
            pcie6Pin: 0,
            pcie8Pin: 0,
            pcie12VHPWR: 1,
            pcie12V2x6: 0,
          }),
          powerSupply: makePowerSupply({ pcie6Plus2Pin: 4, pcie12Vhpwr: 0 }),
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns error when gpu needs 16-pin and psu has no adapter cables', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({
            pcie6Pin: 0,
            pcie8Pin: 0,
            pcie12VHPWR: 1,
            pcie12V2x6: 0,
          }),
          powerSupply: makePowerSupply({ pcie6Plus2Pin: 1, pcie12Vhpwr: 0 }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when psu has a native 16-pin connector', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({
            pcie6Pin: 0,
            pcie8Pin: 0,
            pcie12VHPWR: 1,
            pcie12V2x6: 0,
          }),
          powerSupply: makePowerSupply({ pcie12Vhpwr: 1 }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R06GpuFitsInCaseRule', () => {
  const rule = new R06GpuFitsInCaseRule();

  it('returns null when gpu or case absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when length data missing', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({ length: null }),
          pcCase: makePcCase(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when gpu is too long for case', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({ length: 500 }),
          pcCase: makePcCase({ maxVideoCardLength: 400 }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when gpu fits', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({ length: 300 }),
          pcCase: makePcCase({ maxVideoCardLength: 400 }),
        }),
      ),
    ).toBeNull();
  });

  it('returns null when gpu length exactly equals the case limit', () => {
    expect(
      rule.check(
        makeBuild({
          gpu: makeGpu({ length: 400 }),
          pcCase: makePcCase({ maxVideoCardLength: 400 }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R07R11PcieSlotAssignmentRule', () => {
  const rule = new R07R11PcieSlotAssignmentRule();

  it('returns null when no motherboard', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns null when no gpu and no pcie storage', () => {
    expect(
      rule.check(makeBuild({ motherboard: makeMotherboard() })),
    ).toBeNull();
  });

  it('returns unverifiable when motherboard has no pcie slot info', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ pcieSlots: [] }),
          gpu: makeGpu(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when gpu fits in available pcie slot', () => {
    const mobo = makeMotherboard({
      pcieSlots: [makePcieSlot({ gen: '4', lanes: 16, quantity: 1 })],
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: mobo,
          gpu: makeGpu({ gpuInterface: 'PCIe 4.0 x16' }),
        }),
      ),
    ).toBeNull();
  });

  it('returns error when gpu cannot fit in any available slot', () => {
    const mobo = makeMotherboard({
      pcieSlots: [makePcieSlot({ lanes: 1, quantity: 1 })],
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: mobo,
          gpu: makeGpu({ gpuInterface: 'PCIe 4.0 x16' }),
        }),
      )?.severity,
    ).toBe('error');
  });
});

describe('R08SystemMustHaveGpuRule', () => {
  const rule = new R08SystemMustHaveGpuRule();

  it('returns null when no cpu', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when integratedGraphics info is missing', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ integratedGraphics: null }),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when integratedGraphics is null but a discrete gpu is present', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ integratedGraphics: null }),
          gpu: makeGpu(),
        }),
      ),
    ).toBeNull();
  });

  it('returns error when cpu has no iGPU and no discrete gpu', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ integratedGraphics: 'None' }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when cpu has integrated graphics', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ integratedGraphics: 'Radeon Graphics' }),
        }),
      ),
    ).toBeNull();
  });

  it('returns null when cpu has no iGPU but discrete gpu is provided', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ integratedGraphics: 'None' }),
          gpu: makeGpu(),
        }),
      ),
    ).toBeNull();
  });
});

describe('R09R10M2SlotAssignmentRule', () => {
  const rule = new R09R10M2SlotAssignmentRule();

  it('returns null when no motherboard or no storage drives', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(
      rule.check(makeBuild({ motherboard: makeMotherboard() })),
    ).toBeNull();
  });

  it('returns null when no m2 drives in build', () => {
    const sata = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard(),
          storageDrives: [makeBuildStorage(sata)],
        }),
      ),
    ).toBeNull();
  });

  it('returns error when motherboard has no m2 slots but build has m2 drives', () => {
    const m2 = makeStorageDrive({
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 4.0 x4',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [] }),
          storageDrives: [makeBuildStorage(m2)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when m2 drive fits in compatible slot', () => {
    const m2 = makeStorageDrive({
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 4.0 x4',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [makeM2Slot()] }),
          storageDrives: [makeBuildStorage(m2)],
        }),
      ),
    ).toBeNull();
  });

  it('returns error when more m2 drives than compatible slots', () => {
    const m2 = makeStorageDrive({
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 4.0 x4',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [makeM2Slot()] }),
          storageDrives: [makeBuildStorage(m2, 2)],
        }),
      )?.severity,
    ).toBe('error');
  });
});

describe('R12R13DrivesBaysRule', () => {
  const rule = new R12R13DrivesBaysRule();

  it('returns null when no pcCase or no storage', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when bay info or form factor is missing', () => {
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ internal25bays: null }),
          storageDrives: [
            makeBuildStorage(makeStorageDrive({ formFactor: '2.5"' })),
          ],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when no 2.5" or 3.5" drives', () => {
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase(),
          storageDrives: [
            makeBuildStorage(makeStorageDrive({ formFactor: 'M.2 2280' })),
          ],
        }),
      ),
    ).toBeNull();
  });

  it('returns error when not enough 3.5" bays', () => {
    const hdd = makeStorageDrive({
      formFactor: '3.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ internal35bays: 1 }),
          storageDrives: [makeBuildStorage(hdd, 2)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns error when not enough 2.5" bays', () => {
    const ssd = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ internal25bays: 1, internal35bays: 0 }),
          storageDrives: [makeBuildStorage(ssd, 3)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when bays are sufficient', () => {
    const ssd = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ internal25bays: 4, internal35bays: 2 }),
          storageDrives: [makeBuildStorage(ssd, 2)],
        }),
      ),
    ).toBeNull();
  });
});

describe('R14RamMotherboardMemoryTypeRule', () => {
  const rule = new R14RamMotherboardMemoryTypeRule();

  it('returns null when motherboard or rams absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when motherboard ram type is null', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ ramType: null }),
          rams: [makeBuildRam(makeRam())],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when ram type mismatches motherboard', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ ramType: 'DDR4' }),
          rams: [makeBuildRam(makeRam({ memoryType: 'DDR5' }))],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when ram type matches motherboard', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ ramType: 'DDR5' }),
          rams: [makeBuildRam(makeRam({ memoryType: 'DDR5' }))],
        }),
      ),
    ).toBeNull();
  });
});

describe('R15RamQuantityLimitRule', () => {
  const rule = new R15RamQuantityLimitRule();

  it('returns null when no motherboard or no rams', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when motherboard memorySlots is null', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ memorySlots: null }),
          rams: [makeBuildRam(makeRam({ quantity: 2 }))],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when total modules exceed slots', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ memorySlots: 4 }),
          rams: [makeBuildRam(makeRam({ quantity: 2 }), 3)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when total modules fit in slots', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ memorySlots: 4 }),
          rams: [makeBuildRam(makeRam({ quantity: 2 }), 2)],
        }),
      ),
    ).toBeNull();
  });
});

describe('R16RamMotherboardMaxMemoryRule', () => {
  const rule = new R16RamMotherboardMaxMemoryRule();

  it('returns null when no motherboard or no rams', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when maxMemory is null', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ maxMemory: null }),
          rams: [makeBuildRam(makeRam({ capacity: 16 }))],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when total capacity exceeds max memory', () => {
    const build = makeBuild({
      motherboard: makeMotherboard({
        name: 'Motherboard X',
        maxMemory: 32,
      }),
      rams: [
        makeBuildRam(
          makeRam({
            name: 'DDR4 32GB',
            capacity: 32,
            quantity: 1,
          }),
          2,
        ),
      ],
    });

    const result = rule.check(build);

    expect(result).not.toBeNull();
    expect(result?.severity).toBe('error');
    expect(result?.message).toContain('(64 GB)');
  });

  it('returns null when capacity is within limit', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ maxMemory: 128 }),
          rams: [makeBuildRam(makeRam({ capacity: 16, quantity: 2 }), 2)],
        }),
      ),
    ).toBeNull();
  });
});

describe('R17RamMotherboardFormFactorRule', () => {
  const rule = new R17RamMotherboardFormFactorRule();

  it('returns null when rams or motherboard absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when form factor info missing', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [makeBuildRam(makeRam({ formFactor: null }))],
          motherboard: makeMotherboard(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when mixing DIMM and SO-DIMM', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [
            makeBuildRam(makeRam({ formFactor: 'DIMM' })),
            makeBuildRam(makeRam({ formFactor: 'SO-DIMM' })),
          ],
          motherboard: makeMotherboard({ formFactor: 'ATX' }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns warning when motherboard is Mini-ITX', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [makeBuildRam(makeRam({ formFactor: 'DIMM' }))],
          motherboard: makeMotherboard({ formFactor: 'Mini-ITX' }),
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns error when SO-DIMM used with non Thin-Mini-ITX', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [makeBuildRam(makeRam({ formFactor: 'SO-DIMM' }))],
          motherboard: makeMotherboard({ formFactor: 'ATX' }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when DIMM is used with ATX', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [makeBuildRam(makeRam({ formFactor: 'DIMM' }))],
          motherboard: makeMotherboard({ formFactor: 'ATX' }),
        }),
      ),
    ).toBeNull();
  });

  it('returns null when SO-DIMM is used with Thin Mini-ITX', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [makeBuildRam(makeRam({ formFactor: 'SO-DIMM' }))],
          motherboard: makeMotherboard({ formFactor: 'Thin Mini-ITX' }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R18MotherboardCaseFormFactorRule', () => {
  const rule = new R18MotherboardCaseFormFactorRule();

  it('returns null when either component is missing', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when form factor data missing', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ formFactor: null }),
          pcCase: makePcCase({ supportedMotherboardFormFactors: ['ATX'] }),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when motherboard form factor not supported by case', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ formFactor: 'E-ATX' }),
          pcCase: makePcCase({
            supportedMotherboardFormFactors: ['ATX', 'Micro ATX'],
          }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when form factor is supported', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ formFactor: 'ATX' }),
          pcCase: makePcCase({
            supportedMotherboardFormFactors: ['ATX', 'Micro ATX'],
          }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R19CpuCoolerFitsInCaseRule', () => {
  const rule = new R19CpuCoolerFitsInCaseRule();

  it('returns null when cooler or case absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns null when cooler is water cooled', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ waterCooled: true, height: 999 }),
          pcCase: makePcCase({ maxCpuCoolerHeight: 100 }),
        }),
      ),
    ).toBeNull();
  });

  it('returns unverifiable when height info missing', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ height: null, waterCooled: false }),
          pcCase: makePcCase(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when cooler is taller than case allows', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ height: 170, waterCooled: false }),
          pcCase: makePcCase({ maxCpuCoolerHeight: 155 }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when cooler fits in case', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ height: 150, waterCooled: false }),
          pcCase: makePcCase({ maxCpuCoolerHeight: 165 }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R20RadiatorFitsInCaseRule', () => {
  const rule = new R20RadiatorFitsInCaseRule();

  it('returns null when cooler or case absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns null when cooler is not water cooled', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ waterCooled: false }),
          pcCase: makePcCase(),
        }),
      ),
    ).toBeNull();
  });

  it('returns unverifiable when radiator or case dimensions missing', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ waterCooled: true, radiatorSize: null }),
          pcCase: makePcCase(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns warning when radiator may not fit', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ waterCooled: true, radiatorSize: 480 }),
          pcCase: makePcCase({ height: 200, width: 150, depth: 200 }),
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns null when radiator fits', () => {
    expect(
      rule.check(
        makeBuild({
          cpuCooler: makeCpuCooler({ waterCooled: true, radiatorSize: 240 }),
          pcCase: makePcCase({ height: 450, width: 220, depth: 400 }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R21PSUEnoughEneryForAllSystemRule', () => {
  const rule = new R21PSUEnoughEneryForAllSystemRule();

  it('returns null when cpu or psu absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(rule.check(makeBuild({ cpu: makeCpu() }))).toBeNull();
  });

  it('returns unverifiable when tdp data missing', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ tdp: null }),
          powerSupply: makePowerSupply(),
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when psu wattage is insufficient', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ tdp: 125, manufacturer: 'AMD' }),
          gpu: makeGpu({ tdp: 350 }),
          powerSupply: makePowerSupply({ wattage: 400 }),
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when psu provides enough power', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ tdp: 65, manufacturer: 'AMD' }),
          gpu: makeGpu({ tdp: 150 }),
          powerSupply: makePowerSupply({ wattage: 750 }),
        }),
      ),
    ).toBeNull();
  });

  it('works without a GPU', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ tdp: 65, manufacturer: 'AMD' }),
          powerSupply: makePowerSupply({ wattage: 300 }),
        }),
      ),
    ).toBeNull();
  });
});

describe('R22MotherboardSataPortsRule', () => {
  const rule = new R22MotherboardSataPortsRule();

  it('returns null when no motherboard or no storage', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when port data missing', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ sata6GbSPorts: null }),
          storageDrives: [
            makeBuildStorage(
              makeStorageDrive({
                storageInterface: 'SATA 6.0 Gb/s',
                formFactor: '2.5"',
              }),
            ),
          ],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when no sata drives in build', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard(),
          storageDrives: [
            makeBuildStorage(
              makeStorageDrive({
                formFactor: 'M.2 2280',
                storageInterface: 'M.2 PCIe 4.0 x4',
              }),
            ),
          ],
        }),
      ),
    ).toBeNull();
  });

  it('returns error when more sata devices than total ports', () => {
    const sata = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ sata6GbSPorts: 2, sata3GbSPorts: 0 }),
          storageDrives: [makeBuildStorage(sata, 4)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when sata drives fit in available ports', () => {
    const sata = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ sata6GbSPorts: 4 }),
          storageDrives: [makeBuildStorage(sata, 2)],
        }),
      ),
    ).toBeNull();
  });

  it('returns warning when 6Gb/s drives overflow to 3Gb/s ports', () => {
    const sata6 = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ sata6GbSPorts: 1, sata3GbSPorts: 2 }),
          storageDrives: [makeBuildStorage(sata6, 3)],
        }),
      )?.severity,
    ).toBe('warning');
  });
});

describe('R23MotherbardU2PortsRule', () => {
  const rule = new R23MotherbardU2PortsRule();

  it('returns null when no motherboard or no storage', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when u2Ports info missing', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ u2Ports: null }),
          storageDrives: [
            makeBuildStorage(makeStorageDrive({ storageInterface: 'U.2' })),
          ],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns null when no U.2 drives', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ u2Ports: 0 }),
          storageDrives: [
            makeBuildStorage(
              makeStorageDrive({ storageInterface: 'SATA 6.0 Gb/s' }),
            ),
          ],
        }),
      ),
    ).toBeNull();
  });

  it('returns error when more U.2 drives than ports', () => {
    const u2 = makeStorageDrive({
      storageInterface: 'U.2',
      formFactor: '2.5"',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ u2Ports: 1 }),
          storageDrives: [makeBuildStorage(u2, 2)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('returns null when U.2 drives fit in available ports', () => {
    const u2 = makeStorageDrive({
      storageInterface: 'U.2',
      formFactor: '2.5"',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ u2Ports: 2 }),
          storageDrives: [makeBuildStorage(u2, 2)],
        }),
      ),
    ).toBeNull();
  });
});

describe('R24R25SATAConnectorsRule', () => {
  const rule = new R24R25SATAConnectorsRule();

  it('returns null when no psu', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns unverifiable when storage interface data missing', () => {
    expect(
      rule.check(
        makeBuild({
          powerSupply: makePowerSupply(),
          storageDrives: [
            makeBuildStorage(makeStorageDrive({ storageInterface: null })),
          ],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns unverifiable when psu sata count is null', () => {
    const sata = makeStorageDrive({
      storageInterface: 'SATA 6.0 Gb/s',
      formFactor: '2.5"',
    });
    expect(
      rule.check(
        makeBuild({
          powerSupply: makePowerSupply({ sata: null }),
          storageDrives: [makeBuildStorage(sata)],
        }),
      )?.severity,
    ).toBe('unverifiable');
  });

  it('returns error when psu lacks enough sata power connectors', () => {
    const sata = makeStorageDrive({
      storageInterface: 'SATA 6.0 Gb/s',
      formFactor: '2.5"',
    });
    expect(
      rule.check(
        makeBuild({
          powerSupply: makePowerSupply({ sata: 2 }),
          storageDrives: [makeBuildStorage(sata, 4)],
        }),
      )?.severity,
    ).toBe('error');
  });

  it('counts water cooler as an extra sata demand', () => {
    const sata = makeStorageDrive({
      storageInterface: 'SATA 6.0 Gb/s',
      formFactor: '2.5"',
    });
    const result = rule.check(
      makeBuild({
        powerSupply: makePowerSupply({ sata: 2 }),
        cpuCooler: makeCpuCooler({ waterCooled: true }),
        storageDrives: [makeBuildStorage(sata, 2)],
      }),
    );
    expect(result?.severity).toBe('error');
    expect(result?.message).toContain('water cooled');
  });

  it('returns null when psu has enough sata connectors', () => {
    const sata = makeStorageDrive({
      storageInterface: 'SATA 6.0 Gb/s',
      formFactor: '2.5"',
    });
    expect(
      rule.check(
        makeBuild({
          powerSupply: makePowerSupply({ sata: 6 }),
          storageDrives: [makeBuildStorage(sata, 3)],
        }),
      ),
    ).toBeNull();
  });
});

describe('m2SlotsUtils – parseM2Sizes', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseM2Sizes(null)).toEqual([]);
    expect(parseM2Sizes(undefined)).toEqual([]);
  });

  it('parses a single size token', () => {
    expect(parseM2Sizes('2280')).toContain(22 * 1000 + 80);
  });

  it('parses multiple size tokens separated by /', () => {
    expect(parseM2Sizes('2242/2260/2280')).toHaveLength(3);
  });

  it('ignores unknown dimension codes', () => {
    expect(parseM2Sizes('1234')).toEqual([]);
  });
});

describe('m2SlotsUtils – parseSlotKey', () => {
  it('returns M for "M"', () => expect(parseSlotKey('M')).toBe('M'));
  it('returns B for "b" (case-insensitive)', () =>
    expect(parseSlotKey('b')).toBe('B'));
  it('returns E for "E"', () => expect(parseSlotKey('E')).toBe('E'));
  it('returns null for an unknown key', () =>
    expect(parseSlotKey('X')).toBeNull());
  it('returns null for null input', () =>
    expect(parseSlotKey(null)).toBeNull());
});

describe('m2SlotsUtils – parseM2Interface', () => {
  it('returns null for null input', () => {
    expect(parseM2Interface(null)).toBeNull();
  });

  it('detects wifi interface', () => {
    expect(parseM2Interface('WIFI MODULE')?.isWifi).toBe(true);
  });

  it('parses PCIe generation number', () => {
    expect(parseM2Interface('PCIe 4.0 x4')?.maxPcieGen).toBe(4);
  });

  it('detects SATA presence', () => {
    expect(parseM2Interface('SATA III')?.hasSata).toBe(true);
  });

  it('parses combined PCIe + SATA interface', () => {
    const result = parseM2Interface('PCIe 3.0 x4 / SATA');
    expect(result?.hasSata).toBe(true);
    expect(result?.maxPcieGen).toBe(3);
  });
});

describe('m2SlotsUtils – comparePcieGen', () => {
  it('returns compatible when slot gen >= drive gen', () => {
    expect(comparePcieGen(4, 4)).toBe('compatible');
    expect(comparePcieGen(4, 5)).toBe('compatible');
  });

  it('returns downgraded when slot gen < drive gen', () => {
    expect(comparePcieGen(5, 4)).toBe('downgraded');
  });

  it('returns unverifiable when either gen is null', () => {
    expect(comparePcieGen(null, 4)).toBe('unverifiable');
    expect(comparePcieGen(4, null)).toBe('unverifiable');
  });
});

describe('m2SlotsUtils – isM2Drive', () => {
  it('returns true for M.2 form factor', () => {
    expect(isM2Drive(makeStorageDrive({ formFactor: 'M.2 2280' }))).toBe(true);
  });

  it('returns false for 2.5" form factor', () => {
    expect(isM2Drive(makeStorageDrive({ formFactor: '2.5"' }))).toBe(false);
  });
});

describe('m2SlotsUtils – isWifiSlot', () => {
  it('returns true for wifi interface', () => {
    expect(isWifiSlot(makeM2Slot({ m2Interface: 'WIFI MODULE' }))).toBe(true);
  });

  it('returns false for storage interface', () => {
    expect(isWifiSlot(makeM2Slot({ m2Interface: 'PCIe 4.0 x4' }))).toBe(false);
  });
});

describe('m2SlotsUtils – getStorageSlots', () => {
  it('filters out wifi slots and returns only storage slots', () => {
    const slots = [
      makeM2Slot({ m2Interface: 'PCIe 4.0 x4' }),
      makeM2Slot({ m2Interface: 'WIFI MODULE' }),
      makeM2Slot({ m2Interface: 'PCIe 3.0 x4' }),
    ];
    expect(getStorageSlots(slots)).toHaveLength(2);
  });
});

describe('m2SlotsUtils – keysAreCompatible', () => {
  it('M key drive fits M slot', () =>
    expect(keysAreCompatible('M', 'M')).toBe(true));
  it('M key drive does not fit B slot', () =>
    expect(keysAreCompatible('M', 'B')).toBe(false));
  it('B+M key drive fits B slot', () =>
    expect(keysAreCompatible('B+M', 'B')).toBe(true));
  it('B+M key drive fits M slot', () =>
    expect(keysAreCompatible('B+M', 'M')).toBe(true));
  it('nothing fits an E slot', () =>
    expect(keysAreCompatible('M', 'E')).toBe(false));
  it('returns null when a key is unknown', () =>
    expect(keysAreCompatible(null, 'M')).toBeNull());
});

describe('pcieSlotsUtils – parseGpuInterface', () => {
  it('returns null for null/empty input', () => {
    expect(parseGpuInterface(null)).toBeNull();
    expect(parseGpuInterface('')).toBeNull();
  });

  it('parses gen and lanes from a standard PCIe string', () => {
    const result = parseGpuInterface('PCIe 4.0 x16');
    expect(result?.gen).toBe(4);
    expect(result?.lanes).toBe(16);
  });

  it('parses x1 lane width', () => {
    expect(parseGpuInterface('PCIe 3.0 x1')?.lanes).toBe(1);
  });
});

describe('pcieSlotsUtils – expandPcieSlots', () => {
  it('expands a slot with quantity > 1 into multiple entries', () => {
    expect(
      expandPcieSlots([makePcieSlot({ gen: '4', lanes: 16, quantity: 2 })]),
    ).toHaveLength(2);
  });

  it('defaults to quantity 1 when null', () => {
    expect(
      expandPcieSlots([makePcieSlot({ gen: '3', lanes: 4, quantity: null })]),
    ).toHaveLength(1);
  });

  it('floors float gen values', () => {
    expect(
      expandPcieSlots([makePcieSlot({ gen: '4.0', lanes: 16, quantity: 1 })])[0]
        .gen,
    ).toBe(4);
  });
});

describe('pcieSlotsUtils – gpuFitsInSlot', () => {
  it('returns true when slot has equal lanes', () => {
    expect(gpuFitsInSlot({ gen: 4, lanes: 16 }, { gen: 4, lanes: 16 })).toBe(
      true,
    );
  });

  it('returns true when slot has more lanes', () => {
    expect(gpuFitsInSlot({ gen: 4, lanes: 16 }, { gen: 4, lanes: 32 })).toBe(
      true,
    );
  });

  it('returns false when slot has fewer lanes', () => {
    expect(gpuFitsInSlot({ gen: 4, lanes: 16 }, { gen: 4, lanes: 4 })).toBe(
      false,
    );
  });

  it('returns null when lane info is missing', () => {
    expect(
      gpuFitsInSlot({ gen: 4, lanes: null }, { gen: 4, lanes: 16 }),
    ).toBeNull();
    expect(
      gpuFitsInSlot({ gen: 4, lanes: 16 }, { gen: 4, lanes: null }),
    ).toBeNull();
  });
});

describe('pcieSlotsUtils – nvmeFitsInSlot', () => {
  it('returns true when slot has enough lanes', () => {
    expect(nvmeFitsInSlot({ gen: 4, lanes: 4 }, { gen: 4, lanes: 4 })).toBe(
      true,
    );
  });

  it('returns false when slot has fewer lanes', () => {
    expect(nvmeFitsInSlot({ gen: 4, lanes: 4 }, { gen: 4, lanes: 1 })).toBe(
      false,
    );
  });
});

describe('pcieSlotsUtils – maximumMatching', () => {
  it('matches all when a perfect assignment is possible', () => {
    const adj = [
      [true, false],
      [false, true],
    ];
    expect(maximumMatching(adj, 2, 2).matched).toBe(2);
  });

  it('reports partial match when slots are insufficient', () => {
    expect(maximumMatching([[true], [true]], 2, 1).matched).toBe(1);
  });

  it('sets usedUnverifiable when a null edge was used', () => {
    const result = maximumMatching([[null]], 1, 1);
    expect(result.matched).toBe(1);
    expect(result.usedUnverifiable).toBe(true);
  });

  it('does not set usedUnverifiable when only true edges were used', () => {
    expect(maximumMatching([[true]], 1, 1).usedUnverifiable).toBe(false);
  });
});

describe('pcieSlotsUtils – parseNvmePcieInterface', () => {
  it('returns the same result as parseGpuInterface', () => {
    expect(parseNvmePcieInterface('PCIe 4.0 x4')).toEqual(
      parseGpuInterface('PCIe 4.0 x4'),
    );
  });
});
