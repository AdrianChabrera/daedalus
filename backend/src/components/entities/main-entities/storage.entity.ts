import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('storages')
export class Storage extends Component {
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'type',
  })
  type: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'form_factor',
  })
  formFactor: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  interface: string | null;

  @Column({ type: 'boolean', nullable: true })
  nvme: boolean | null;
}
