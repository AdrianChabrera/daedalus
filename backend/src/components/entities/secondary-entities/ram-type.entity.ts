import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ram_types')
export class RamType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  name: string;
}
