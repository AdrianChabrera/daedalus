import { Max, Min } from 'class-validator';
import { User } from '../../users/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Build } from 'src/builds/entities/build';

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

  @Column({ name: 'component_type' })
  componentType!: string;

  @Column({ type: 'uuid', name: 'component_id' })
  componentId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  validateExclusivity() {
    const hasBuild = this.build != null;
    const hasComponentId = this.componentId != null;

    if (hasBuild === hasComponentId) {
      throw new Error(
        'A review must be associated with either a build or a component, not both or neither.',
      );
    }
  }
}
