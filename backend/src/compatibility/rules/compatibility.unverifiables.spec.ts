import {
  makeBuild,
  makeStorageDrive,
  makeBuildStorage,
} from '../utils/test-factories';
import { U01UnverifiableStorageInterfaces } from './unverifiable/u01-unverifiable-storage-interfaces.unverifiable';

describe('U01UnverifiableStorageInterfaces', () => {
  const rule = new U01UnverifiableStorageInterfaces();

  it('returns null when no storage drives in build', () => {
    expect(rule.check(makeBuild())).toBeNull();
  });

  it('returns null for SATA 6.0 Gb/s (verifiable interface)', () => {
    expect(
      rule.check(
        makeBuild({
          storageDrives: [
            makeBuildStorage(
              makeStorageDrive({ storageInterface: 'SATA 6.0 Gb/s' }),
            ),
          ],
        }),
      ),
    ).toBeNull();
  });

  it('returns null for M.2 PCIe (verifiable interface)', () => {
    expect(
      rule.check(
        makeBuild({
          storageDrives: [
            makeBuildStorage(
              makeStorageDrive({ storageInterface: 'M.2 PCIe 4.0 x4' }),
            ),
          ],
        }),
      ),
    ).toBeNull();
  });

  it('returns null for U.2 (verifiable interface)', () => {
    expect(
      rule.check(
        makeBuild({
          storageDrives: [
            makeBuildStorage(
              makeStorageDrive({ storageInterface: 'U.2', formFactor: '2.5"' }),
            ),
          ],
        }),
      ),
    ).toBeNull();
  });

  it.each([
    'mSATA',
    'PATA',
    'SAS',
    'SAS 12.0 Gb/s',
    'SAS 3.0 Gb/s',
    'SAS 6.0 Gb/s',
  ])('returns unverifiable for "%s" interface', (iface) => {
    const result = rule.check(
      makeBuild({
        storageDrives: [
          makeBuildStorage(makeStorageDrive({ storageInterface: iface })),
        ],
      }),
    );
    expect(result?.severity).toBe('unverifiable');
    expect(result?.rule).toBe('U01_UNVERIFIABLE_STORAGE_INTERFACES');
  });

  it('returns unverifiable even when a build also contains a verifiable drive', () => {
    const result = rule.check(
      makeBuild({
        storageDrives: [
          makeBuildStorage(
            makeStorageDrive({ storageInterface: 'SATA 6.0 Gb/s' }),
          ),
          makeBuildStorage(
            makeStorageDrive({ storageInterface: 'SAS 12.0 Gb/s' }),
          ),
        ],
      }),
    );
    expect(result?.severity).toBe('unverifiable');
  });

  it('includes the drive name in the components list', () => {
    const result = rule.check(
      makeBuild({
        storageDrives: [
          makeBuildStorage(
            makeStorageDrive({ name: 'My SAS Drive', storageInterface: 'SAS' }),
          ),
        ],
      }),
    );
    expect(result?.components[0]).toContain('My SAS Drive');
  });
});
