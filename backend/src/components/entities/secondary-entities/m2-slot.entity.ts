import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Motherboard } from '../main-entities/motherboard.entity';

@Entity('m2_slots')
export class M2Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  key: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  m2Interface: string | null;

  @ManyToOne(() => Motherboard, (m) => m.m2Slots)
  @JoinColumn({ name: 'motherboard_id' })
  motherboard: Motherboard;
}
