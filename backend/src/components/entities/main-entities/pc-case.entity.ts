import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('pc_cases')
export class PcCase extends Component {
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  width!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  depth!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'max_video_card_length',
  })
  maxVideoCardLength!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'max_cpu_cooler_height',
  })
  maxCpuCoolerHeight!: number | null;

  @Column({ type: 'int', nullable: true, name: 'internal_3_5_bays' })
  internal35bays!: number | null;

  @Column({ type: 'int', nullable: true, name: 'internal_2_5_bays' })
  internal25bays!: number | null;

  @Column({ type: 'int', nullable: true, name: 'expansion_slots' })
  expansionSlots!: number | null;

  @Column({ type: 'int', nullable: true, name: 'riser_expansion_slots' })
  riserExpansionSlots!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  volume!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weight!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'form_factor' })
  formFactor!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'power_supply',
  })
  powerSupply!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'side_panel' })
  sidePanel!: string | null;

  @Column({
    type: 'simple-array',
    nullable: true,
    name: 'supported_motherboard_form_factors',
  })
  supportedMotherboardFormFactors!: string[];

  @Column({ type: 'simple-array', nullable: true, name: 'front_usb_ports' })
  frontUsbPorts!: string[];

  @Column({ type: 'boolean', nullable: true, name: 'power_supply_shroud' })
  powerSupplyShroud!: boolean | null;
}
