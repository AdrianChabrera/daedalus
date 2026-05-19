import { PcCase } from '../../components/entities/main-entities/pc-case.entity';
import { CpuCooler } from '../../components/entities/main-entities/cpu-cooler.entity';
import { Cpu } from '../../components/entities/main-entities/cpu.entity';
import { Gpu } from '../../components/entities/main-entities/gpu.entity';
import { Keyboard } from '../../components/entities/main-entities/keyboard.entity';
import { Motherboard } from '../../components/entities/main-entities/motherboard.entity';
import { Mouse } from '../../components/entities/main-entities/mouse.entity';
import { PowerSupply } from '../../components/entities/main-entities/power-supply.entity';
import { User } from '../../users/user.entity';
import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BuildRam } from './build-rams.entity';
import { BuildStorageDrive } from './build-storage-drives.entity';
import { BuildMonitor } from './build-monitors.entity';
import { BuildFan } from './build-fans.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('builds')
export class Build {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description?: string;

  @Column({ type: 'boolean', nullable: false })
  published!: boolean;

  @Column({ type: 'varchar', nullable: true })
  photoUrl?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => PcCase, { nullable: true })
  @JoinColumn({ name: 'pc_case_id' })
  pcCase?: PcCase | null;

  @ManyToOne(() => CpuCooler, { nullable: true })
  @JoinColumn({ name: 'cpu_cooler_id' })
  cpuCooler?: CpuCooler | null;

  @ManyToOne(() => Cpu, { nullable: true })
  @JoinColumn({ name: 'cpu_id' })
  cpu?: Cpu | null;

  @OneToMany(() => BuildFan, (f) => f.build, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  fans!: BuildFan[];

  @ManyToOne(() => Gpu, { nullable: true })
  @JoinColumn({ name: 'gpu_id' })
  gpu?: Gpu | null;

  @ManyToOne(() => Keyboard, { nullable: true })
  @JoinColumn({ name: 'keyboard_id' })
  keyboard?: Keyboard | null;

  @OneToMany(() => BuildMonitor, (m) => m.build, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  monitors!: BuildMonitor[];

  @ManyToOne(() => Motherboard, { nullable: true })
  @JoinColumn({ name: 'motherboard_id' })
  motherboard?: Motherboard | null;

  @ManyToOne(() => Mouse, { nullable: true })
  @JoinColumn({ name: 'mouse_id' })
  mouse?: Mouse | null;

  @ManyToOne(() => PowerSupply, { nullable: true })
  @JoinColumn({ name: 'power_supply_id' })
  powerSupply?: PowerSupply | null;

  @OneToMany(() => BuildRam, (r) => r.build, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  rams!: BuildRam[];

  @OneToMany(() => BuildStorageDrive, (s) => s.build, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  storageDrives!: BuildStorageDrive[];

  @ManyToOne(() => User, (u) => u.builds, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToMany(() => User, (user) => user.favoriteBuilds)
  likedBy!: User[];

  @OneToMany(() => Review, (r) => r.build)
  reviews!: Review[];

  averageRating?: number | null;
  reviewCount?: number;

  @AfterLoad()
  computeRatingStats() {
    if (this.reviews) {
      this.reviewCount = this.reviews.length;
      this.averageRating =
        this.reviews.length > 0
          ? parseFloat(
              (
                this.reviews.reduce((sum, r) => sum + r.stars, 0) /
                this.reviews.length
              ).toFixed(2),
            )
          : null;
    }
  }
}
