import { IsNotEmpty } from 'class-validator';
import { Build } from '../builds/entities/build';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UserFavoriteComponent } from '../favorites/entities/userFavoriteComponent.entity';
import { Review } from '../reviews/entities/review.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @IsNotEmpty()
  username!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Build, (b) => b.user)
  builds!: Build[];

  @OneToMany(() => Review, (r) => r.user)
  reviews!: Review[];

  @ManyToMany(() => Build, (build) => build.likedBy)
  @JoinTable({
    name: 'users_favorite_builds',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'build_id', referencedColumnName: 'id' },
  })
  favoriteBuilds!: Build[];

  @OneToMany(() => UserFavoriteComponent, (fav) => fav.user)
  favoriteComponents!: UserFavoriteComponent[];
}
