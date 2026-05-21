import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Build } from './build.entity';
import { StorageDrive } from '../../components/entities/main-entities/storage.entity';

@Entity('build_storage_drives')
export class BuildStorageDrive {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Build, (b) => b.storageDrives, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'build_id' })
  build!: Build;

  @ManyToOne(() => StorageDrive, { nullable: false, eager: true })
  @JoinColumn({ name: 'storage_drive_id' })
  storageDrive!: StorageDrive;

  @Column({ type: 'int', nullable: false, default: 1 })
  quantity!: number;
}
