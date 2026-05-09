import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('user_favorite_components')
@Unique(['user', 'componentId'])
export class UserFavoriteComponent {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.favoriteComponents)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'component_type' })
  componentType!: string;

  @Column({ type: 'uuid', name: 'component_id' })
  componentId!: string;
}
