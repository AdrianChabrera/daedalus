import { Build } from '../../builds/entities/build.entity';
import { CompatibilityIssueDto } from '../dtos/CompatibilityIssue.dto';

export interface CompatibilityRule {
  check(build: Build): CompatibilityIssueDto | null;
}

export const COMPATIBILITY_RULES = Symbol('COMPATIBILITY_RULES');
