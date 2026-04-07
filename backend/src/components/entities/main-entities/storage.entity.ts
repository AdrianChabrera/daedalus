import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('storage_drives')
export class StorageDrive extends Component {
  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'storage_type',
  })
  storageType!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'form_factor',
  })
  formFactor!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'storage_interface',
  })
  storageInterface!: string | null;

  @Column({ type: 'boolean', nullable: true })
  nvme!: boolean | null;
}
