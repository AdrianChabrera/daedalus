import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('gpus')
export class Gpu extends Component {
  @Column({ type: 'int', nullable: true })
  memory: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'core_base_clock',
  })
  coreBaseClock: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'core_boost_clock',
  })
  coreBoostClock: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'effective_memory_clock',
  })
  effectiveMemoryClock: number | null;

  @Column({ type: 'int', nullable: true, name: 'memory_bus' })
  memoryBus: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  length: number | null;

  @Column({ type: 'int', nullable: true })
  tdp: number | null;

  @Column({ type: 'int', nullable: true, name: 'pcie_6_pin' })
  pcie6Pin: number | null;

  @Column({ type: 'int', nullable: true, name: 'pcie_8_pin' })
  pcie8Pin: number | null;

  @Column({ type: 'int', nullable: true, name: 'pcie_12vhpwr' })
  pcie12VHPWR: number | null;

  @Column({ type: 'int', nullable: true, name: 'pcie_12v_2x6' })
  pcie12V2x6: number | null;

  @Column({ type: 'int', nullable: true, name: 'hdmi_2_1' })
  hdmi21: number | null;

  @Column({ type: 'int', nullable: true, name: 'hdmi_2_0' })
  hdmi20: number | null;

  @Column({ type: 'int', nullable: true, name: 'displayport_2_1' })
  displayPort21: number | null;

  @Column({ type: 'int', nullable: true, name: 'displayport_2_1a' })
  displayPort21a: number | null;

  @Column({ type: 'int', nullable: true, name: 'displayport_1_4a' })
  displayPort14a: number | null;

  @Column({ type: 'int', nullable: true, name: 'dvi_d' })
  dvid: number | null;

  @Column({ type: 'int', nullable: true })
  vga: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  chipset: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'memory_type' })
  memoryType: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'gpu_interface',
  })
  gpuInterface: string | null;
}
