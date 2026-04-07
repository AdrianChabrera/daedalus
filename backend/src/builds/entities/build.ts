import { Case } from '../../components/entities/main-entities/case.entity';
import { CpuCooler } from '../../components/entities/main-entities/cpu-cooler.entity';
import { Cpu } from '../../components/entities/main-entities/cpu.entity';
import { Fan } from '../../components/entities/main-entities/fan.entity';
import { Gpu } from '../../components/entities/main-entities/gpu.entity';
import { Keyboard } from '../../components/entities/main-entities/keyboard.entity';
import { Monitor } from '../../components/entities/main-entities/monitor.entity';
import { Motherboard } from '../../components/entities/main-entities/motherboard.entity';
import { Mouse } from '../../components/entities/main-entities/mouse.entity';
import { PowerSupply } from '../../components/entities/main-entities/power-supply.entity';
import { Ram } from '../../components/entities/main-entities/ram.entity';
import { StorageDrive } from '../../components/entities/main-entities/storage.entity';
import { User } from '../../users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Case, { nullable: true })
  @JoinColumn({ name: 'case_id' })
  case?: Case;

  @ManyToOne(() => CpuCooler, { nullable: true })
  @JoinColumn({ name: 'cpu_cooler_id' })
  cpuCooler?: CpuCooler;

  @ManyToOne(() => Cpu, { nullable: true })
  @JoinColumn({ name: 'cpu_id' })
  cpu?: Cpu;

  @ManyToMany(() => Fan)
  @JoinTable({
    name: 'build_fans',
    joinColumn: {
      name: 'build_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'fan_id',
      referencedColumnName: 'buildcoresId',
    },
  })
  fans?: Fan[];

  @ManyToOne(() => Gpu, { nullable: true })
  @JoinColumn({ name: 'gpu_id' })
  gpu?: Gpu;

  @ManyToOne(() => Keyboard, { nullable: true })
  @JoinColumn({ name: 'keyboard_id' })
  keyboard?: Keyboard;

  @ManyToMany(() => Monitor)
  @JoinTable({
    name: 'build_monitors',
    joinColumn: {
      name: 'build_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'monitor_id',
      referencedColumnName: 'buildcoresId',
    },
  })
  monitors?: Monitor[];

  @ManyToOne(() => Motherboard, { nullable: true })
  @JoinColumn({ name: 'motherboard_id' })
  motherboard!: Motherboard;

  @ManyToOne(() => Mouse, { nullable: true })
  @JoinColumn({ name: 'mouse_id' })
  mouse?: Mouse;

  @ManyToOne(() => PowerSupply, { nullable: true })
  @JoinColumn({ name: 'power_supply_id' })
  powerSupply?: PowerSupply;

  @ManyToMany(() => Ram)
  @JoinTable({
    name: 'build_rams',
    joinColumn: {
      name: 'build_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'ram_id',
      referencedColumnName: 'buildcoresId',
    },
  })
  rams?: Ram[];

  @ManyToMany(() => StorageDrive)
  @JoinTable({
    name: 'build_storage_drives',
    joinColumn: {
      name: 'build_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'storage_drive_id',
      referencedColumnName: 'buildcoresId',
    },
  })
  storageDrives?: StorageDrive[];

  @ManyToOne(() => User, (u) => u.builds)
  user!: User;
}
