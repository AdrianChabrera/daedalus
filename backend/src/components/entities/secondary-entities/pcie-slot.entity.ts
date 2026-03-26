import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Motherboard } from '../main-entities/motherboard.entity';

@Entity('pcie_slots')
export class PcieSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gen: string | null;

  @Column({ type: 'int', nullable: true })
  quantity: number | null;

  @Column({ type: 'int', nullable: true })
  lanes: number | null;

  @ManyToOne(() => Motherboard, (m) => m.pcieSlots)
  @JoinColumn({ name: 'motherboard_id' })
  motherboard: Motherboard;
}
