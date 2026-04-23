import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Build } from './build';
import { Ram } from '../../components/entities/main-entities/ram.entity';

@Entity('build_rams')
export class BuildRam {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Build, (b) => b.rams, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'build_id' })
  build!: Build;

  @ManyToOne(() => Ram, { nullable: false, eager: true })
  @JoinColumn({ name: 'ram_id' })
  ram!: Ram;

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity!: number;
}
