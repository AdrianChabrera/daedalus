import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('storages')
export class StorageDrive extends Component {
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'type',
  })
  storageType: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'form_factor',
  })
  formFactor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  storageInterface: string | null;

  @Column({ type: 'boolean', nullable: true })
  nvme: boolean | null;
}
