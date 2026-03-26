import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('fans')
export class Fan extends Component {
  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'min_noise_level',
  })
  minNoiseLevel: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'max_noise_level',
  })
  maxNoiseLevel: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'min_airflow',
  })
  minAirflow: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'max_airflow',
  })
  maxAirflow: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  size: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'static_pressure',
  })
  staticPressure: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  led: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  connector: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  controller: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'flow_direction',
  })
  flowDirection: string | null;

  @Column({ type: 'boolean', nullable: true })
  pwm: boolean | null;
}
