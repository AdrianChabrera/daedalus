import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('power_supplies')
export class PowerSupply extends Component {
  @Column({ type: 'int', nullable: true })
  wattage: number | null;

  @Column({ type: 'int', nullable: true, name: 'atx_24_pin' })
  atx24Pin: number | null;

  @Column({ type: 'int', nullable: true, name: 'eps_8_pin' })
  eps8Pin: number | null;

  @Column({ type: 'int', nullable: true, name: 'pcie_12vhpwr' })
  pcie12Vhpwr: number | null;

  @Column({ type: 'int', nullable: true, name: 'pcie_6_plus_2_pin' })
  pcie6Plus2Pin: number | null;

  @Column({ type: 'int', nullable: true })
  sata: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  length: number | null;

  @Column({ type: 'boolean', nullable: true })
  fanless: boolean | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'form_factor',
  })
  formFactor: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'efficency_rating',
  })
  efficencyRating: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  modular: string | null;
}
