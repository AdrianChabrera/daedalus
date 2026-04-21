import {
  makeBuild,
  makeCpu,
  makeMotherboard,
  makePcCase,
  makePowerSupply,
  makeRam,
  makeBuildRam,
  makeStorageDrive,
  makeBuildStorage,
  makeM2Slot,
} from '../utils/test-factories';

import { W01MultipleRamModelsWarning } from './warnings/w01-multiple-ram-models.warning';
import { W02RamCpuMotherboardEccRule } from './warnings/w02-ram-cpu-motherboard-ecc.rule';
import { W03IncludedPowerSupplyWarning } from './warnings/w03-included-power-supply.warning';
import { W04M2SlotGenRule } from './warnings/w04-m2-slot-gen.rule';
import { W05W06CpuPowerConnectorWarning } from './warnings/w05-w06-cpu-power-connector.warning';

describe('W01MultipleRamModelsWarning', () => {
  const rule = new W01MultipleRamModelsWarning();

  it('returns null when no rams', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns null with a single ram model', () => {
    expect(
      rule.check(
        makeBuild({
          rams: [makeBuildRam(makeRam())],
        }),
      ),
    ).toBeNull();
  });

  it('returns warning with multiple ram models', () => {
    const result = rule.check(
      makeBuild({
        rams: [
          makeBuildRam(makeRam({ name: 'RAM A' })),
          makeBuildRam(makeRam({ name: 'RAM B' })),
        ],
      }),
    );
    expect(result?.severity).toBe('warning');
    expect(result?.rule).toBe('W01_MULTIPLE_RAM_MODELS');
  });

  it('includes the names of affected components', () => {
    const result = rule.check(
      makeBuild({
        rams: [
          makeBuildRam(makeRam({ name: 'Kingston Fury' })),
          makeBuildRam(makeRam({ name: 'Corsair Vengeance' })),
        ],
      }),
    );
    expect(result?.components[0]).toContain('Kingston Fury');
    expect(result?.components[0]).toContain('Corsair Vengeance');
  });
});

// ─── W02 – ECC mismatch ───────────────────────────────────────────────────────

describe('W02RamCpuMotherboardEccRule', () => {
  const rule = new W02RamCpuMotherboardEccRule();

  it('returns null when any required component is missing', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(rule.check(makeBuild({ cpu: makeCpu() }))).toBeNull();
    expect(
      rule.check(makeBuild({ cpu: makeCpu(), motherboard: makeMotherboard() })),
    ).toBeNull();
  });

  it('returns warning when ECC ram is used but cpu and mobo do not support ECC', () => {
    const result = rule.check(
      makeBuild({
        cpu: makeCpu({ eccSupport: false }),
        motherboard: makeMotherboard({ eccSupport: false }),
        rams: [makeBuildRam(makeRam({ ecc: true }))],
      }),
    );
    expect(result?.severity).toBe('warning');
    expect(result?.rule).toBe('W02_RAM_CPU_MOTHERBOARD_ECC');
  });

  it('returns warning when ECC ram is used but only cpu lacks ECC support', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ eccSupport: false }),
          motherboard: makeMotherboard({ eccSupport: true }),
          rams: [makeBuildRam(makeRam({ ecc: true }))],
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns warning when ECC ram is used but only mobo lacks ECC support', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ eccSupport: true }),
          motherboard: makeMotherboard({ eccSupport: false }),
          rams: [makeBuildRam(makeRam({ ecc: true }))],
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns null when non-ECC ram is used', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ eccSupport: false }),
          motherboard: makeMotherboard({ eccSupport: false }),
          rams: [makeBuildRam(makeRam({ ecc: false }))],
        }),
      ),
    ).toBeNull();
  });

  it('returns null when all components support ECC', () => {
    expect(
      rule.check(
        makeBuild({
          cpu: makeCpu({ eccSupport: true }),
          motherboard: makeMotherboard({ eccSupport: true }),
          rams: [makeBuildRam(makeRam({ ecc: true }))],
        }),
      ),
    ).toBeNull();
  });
});

// ─── W03 – Included power supply ─────────────────────────────────────────────

describe('W03IncludedPowerSupplyWarning', () => {
  const rule = new W03IncludedPowerSupplyWarning();

  it('returns null when no pcCase', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns null when case has no included PSU', () => {
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ powerSupply: 'None' }),
        }),
      ),
    ).toBeNull();
  });

  it('returns null when case has null powerSupply field', () => {
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ powerSupply: null }),
        }),
      ),
    ).toBeNull();
  });

  it('returns warning when case includes a psu and no separate psu is selected', () => {
    const result = rule.check(
      makeBuild({
        pcCase: makePcCase({ powerSupply: '400W Included' }),
      }),
    );
    expect(result?.severity).toBe('warning');
    expect(result?.rule).toBe('W03_INCLUDED_POWER_SUPPLY');
  });

  it('returns null when case includes psu but a separate psu is also selected', () => {
    expect(
      rule.check(
        makeBuild({
          pcCase: makePcCase({ powerSupply: '400W Included' }),
          powerSupply: makePowerSupply(),
        }),
      ),
    ).toBeNull();
  });
});

// ─── W04 – M.2 PCIe gen downgrade ────────────────────────────────────────────

describe('W04M2SlotGenRule', () => {
  const rule = new W04M2SlotGenRule();

  it('returns null when no motherboard or no storage drives', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(
      rule.check(makeBuild({ motherboard: makeMotherboard() })),
    ).toBeNull();
  });

  it('returns null when motherboard has no m2 slots', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [] }),
          storageDrives: [makeBuildStorage(makeStorageDrive())],
        }),
      ),
    ).toBeNull();
  });

  it('returns null when build has no m2 drives', () => {
    const sata = makeStorageDrive({
      formFactor: '2.5"',
      storageInterface: 'SATA 6.0 Gb/s',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [makeM2Slot()] }),
          storageDrives: [makeBuildStorage(sata)],
        }),
      ),
    ).toBeNull();
  });

  it('returns warning when drive gen is higher than the best available slot gen', () => {
    const gen5Drive = makeStorageDrive({
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 5.0 x4',
    });
    const gen4Slot = makeM2Slot({
      m2Interface: 'PCIe 4.0 x4',
      size: '2280',
      key: 'M',
    });
    const result = rule.check(
      makeBuild({
        motherboard: makeMotherboard({ m2Slots: [gen4Slot] }),
        storageDrives: [makeBuildStorage(gen5Drive)],
      }),
    );
    expect(result?.severity).toBe('warning');
    expect(result?.rule).toBe('R11_M2_PCIE_GEN_DOWNGRADE');
  });

  it('returns null when drive gen matches available slot gen', () => {
    const gen4Drive = makeStorageDrive({
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 4.0 x4',
    });
    const gen4Slot = makeM2Slot({
      m2Interface: 'PCIe 4.0 x4',
      size: '2280',
      key: 'M',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [gen4Slot] }),
          storageDrives: [makeBuildStorage(gen4Drive)],
        }),
      ),
    ).toBeNull();
  });

  it('returns null when drive gen is lower than slot gen', () => {
    const gen3Drive = makeStorageDrive({
      formFactor: 'M.2 2280',
      storageInterface: 'M.2 PCIe 3.0 x4',
    });
    const gen4Slot = makeM2Slot({
      m2Interface: 'PCIe 4.0 x4',
      size: '2280',
      key: 'M',
    });
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ m2Slots: [gen4Slot] }),
          storageDrives: [makeBuildStorage(gen3Drive)],
        }),
      ),
    ).toBeNull();
  });
});

// ─── W05/W06 – CPU power connector ───────────────────────────────────────────

describe('W05W06CpuPowerConnectorWarning', () => {
  const rule = new W05W06CpuPowerConnectorWarning();

  it('returns null when motherboard or psu absent', () => {
    expect(rule.check(makeBuild())).toBeNull();
    expect(
      rule.check(makeBuild({ motherboard: makeMotherboard() })),
    ).toBeNull();
  });

  it('returns unverifiable when psu eps8Pin is null', () => {
    const result = rule.check(
      makeBuild({
        motherboard: makeMotherboard(),
        powerSupply: makePowerSupply({ eps8Pin: null }),
      }),
    );
    expect(result?.severity).toBe('unverifiable');
    expect(result?.rule).toBe('W05_W06_CPU_POWER_CONNECTOR');
  });

  it('returns warning when psu has zero 8-pin connectors', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard(),
          powerSupply: makePowerSupply({ eps8Pin: 0 }),
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns warning when psu has fewer 8-pin ports than mobo demands', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({
            cpuPowerConnectors: ['8-pin', '8-pin', '4-pin'],
          }),
          powerSupply: makePowerSupply({ eps8Pin: 1 }),
        }),
      )?.severity,
    ).toBe('warning');
  });

  it('returns null when psu satisfies mobo cpu power demand', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ cpuPowerConnectors: ['8-pin'] }),
          powerSupply: makePowerSupply({ eps8Pin: 2 }),
        }),
      ),
    ).toBeNull();
  });

  it('returns null when mobo has no cpu power connectors defined', () => {
    expect(
      rule.check(
        makeBuild({
          motherboard: makeMotherboard({ cpuPowerConnectors: null }),
          powerSupply: makePowerSupply({ eps8Pin: 2 }),
        }),
      ),
    ).toBeNull();
  });
});
