export class CompatibilityIssueDto {
  rule!: string;
  severity!: 'error' | 'warning' | 'unverifiable';
  message!: string;
  components!: string[];
}
