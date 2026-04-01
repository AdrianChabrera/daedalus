import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('rams')
export class Ram extends Component {
  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ type: 'int', nullable: true })
  speed: number | null;

  @Column({ type: 'int', nullable: true, name: 'cas_latency' })
  casLatency: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'voltage',
  })
  voltage: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'memory_type' })
  memoryType: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'form_factor' })
  formFactor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timings: string | null;

  @Column({ type: 'boolean', nullable: true, name: 'heat_spreader' })
  heatSpreader: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  rgb: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  ecc: boolean | null;
}
