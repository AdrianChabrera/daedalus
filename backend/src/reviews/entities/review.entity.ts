import { Max, Min } from 'class-validator';
import { User } from '../../users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Build } from 'src/builds/entities/build';

@Unique('UQ_review_user_build', ['user', 'build'])
@Unique('UQ_review_user_component', ['user', 'componentId', 'componentType'])
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  text?: string;

  @Column({ type: 'int', nullable: false })
  @Min(1)
  @Max(5)
  stars!: number;

  @ManyToOne(() => User, (u) => u.reviews, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user!: User;

  @ManyToOne(() => Build, (b) => b.reviews, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  build?: Build;

  @Column({ name: 'component_type', nullable: true })
  componentType!: string;

  @Column({ type: 'uuid', name: 'component_id', nullable: true })
  componentId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
