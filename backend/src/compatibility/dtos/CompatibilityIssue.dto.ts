export class CompatibilityIssueDto {
  rule!: string;
  severity!: 'error' | 'dependency' | 'warning' | 'unverifiable';
  message!: string;
  components!: string[];
}
