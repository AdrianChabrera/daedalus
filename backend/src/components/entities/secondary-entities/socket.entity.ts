import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sockets')
export class Socket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  name: string;
}
