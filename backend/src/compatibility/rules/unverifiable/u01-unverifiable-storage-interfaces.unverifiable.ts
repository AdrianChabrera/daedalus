import { Injectable } from '@nestjs/common';
import { CompatibilityRule } from '../../interfaces/compatibility-rule.interface';
import { CompatibilityIssueDto } from '../../dtos/CompatibilityIssue.dto';
import { Build } from 'src/builds/entities/build';

@Injectable()
export class U01UnverifiableStorageInterfaces implements CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null {
    const { storageDrives } = build;
    if (!storageDrives || storageDrives.length === 0) return null;

    const unverifiableStorageInterfaces = [
      'mSATA',
      'PATA',
      'SAS',
      'SAS 12.0 Gb/s',
      'SAS 3.0 Gb/s',
      'SAS 6.0 Gb/s',
    ];

    if (
      storageDrives.some((sb) =>
        unverifiableStorageInterfaces.includes(
          sb.storageDrive.storageInterface ?? '',
        ),
      )
    ) {
      return {
        rule: 'U01_UNVERIFIABLE_STORAGE_INTERFACES',
        severity: 'unverifiable',
        message: `We are sorry, but our system isn't able to do compatibility verifications at the moment: ${unverifiableStorageInterfaces.join(',')}`,
        components: [
          storageDrives
            .map((bs) => bs.storageDrive?.name ?? 'Storage drive')
            .join(', '),
        ],
      };
    }

    return null;
  }
}
