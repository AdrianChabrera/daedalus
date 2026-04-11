import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Build } from './build';
import { Monitor } from 'src/components/entities/main-entities/monitor.entity';

@Entity('build_monitors')
export class BuildMonitor {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Build, (b) => b.monitors, { nullable: false })
  @JoinColumn({ name: 'build_id' })
  build!: Build;

  @ManyToOne(() => Monitor, { nullable: false, eager: true })
  @JoinColumn({ name: 'monitor_id' })
  monitor!: Monitor;

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity!: number;
}
