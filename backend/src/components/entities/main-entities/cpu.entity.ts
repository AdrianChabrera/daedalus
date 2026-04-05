import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('cpus')
export class Cpu extends Component {
  @Column({ type: 'int', nullable: true, name: 'core_count' })
  coreCount: number | null;

  @Column({ type: 'int', nullable: true, name: 'thread_count' })
  threadCount: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'base_clock',
  })
  baseClock: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'boost_clock',
  })
  boostClock: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'cache_l1' })
  cachel1: string | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'cache_l2',
  })
  cachel2: number | null;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    name: 'cache_l3',
  })
  cachel3: number | null;

  @Column({ type: 'int', nullable: true, name: 'tdp' })
  tdp: number | null;

  @Column({ type: 'int', nullable: true, name: 'ppt'})
  ppt: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  socket: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'integrated_graphics',
  })
  integratedGraphics: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  microarchitecture: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'core_family' })
  coreFamily: string | null;

  @Column({ type: 'int', nullable: true, name: 'max_supported_memory' })
  maxSupportedMemory: number | null;

  @Column({
    type: 'simple-array',
    nullable: true,
    name: 'supported_memory_types',
  })
  supportedMemoryTypes: string[] | null;

  @Column({ type: 'boolean', nullable: true, name: 'ecc_support' })
  eccSupport: boolean | null;

  @Column({ type: 'boolean', nullable: true, name: 'includes_cooler' })
  includesCooler: boolean | null;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'simultaneous_multithreading',
  })
  simultaneousMultithreading: boolean | null;
}
