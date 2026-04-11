import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Build } from './build';
import { Fan } from 'src/components/entities/main-entities/fan.entity';

@Entity('build_fans')
export class BuildFan {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Build, (b) => b.fans, { nullable: false })
  @JoinColumn({ name: 'build_id' })
  build!: Build;

  @ManyToOne(() => Fan, { nullable: false, eager: true })
  @JoinColumn({ name: 'fan_id' })
  fan!: Fan;

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity!: number;
}
