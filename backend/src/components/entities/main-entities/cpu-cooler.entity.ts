import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('cpu_coolers')
export class CpuCooler extends Component {
  @Column({ type: 'int', nullable: true, name: 'min_fan_rpm' })
  minFanRpm!: number | null;

  @Column({ type: 'int', nullable: true, name: 'max_fan_rpm' })
  maxFanRpm!: number | null;

  @Column({ type: 'int', nullable: true, name: 'fan_size' })
  fanSize!: number | null;

  @Column({ type: 'int', nullable: true, name: 'fan_quantity' })
  fanQuantity!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'min_noise_level',
  })
  minNoiseLevel!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'max_noise_level',
  })
  maxNoiseLevel!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  height!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'radiator_size',
  })
  radiatorSize!: number | null;

  @Column({ type: 'simple-array', nullable: true, name: 'supported_sockets' })
  supportedSockets!: string[];

  @Column({ type: 'boolean', nullable: true, name: 'water_cooled' })
  waterCooled!: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  fanless!: boolean | null;
}
