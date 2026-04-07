import { Column, Entity } from 'typeorm';
import { Component } from '../component.entity';

@Entity('monitors')
export class Monitor extends Component {
  @Column({ type: 'int', nullable: true, name: 'horizontal_res' })
  horizontalRes!: number | null;

  @Column({ type: 'int', nullable: true, name: 'vertical_res' })
  verticalRes!: number | null;

  @Column({ type: 'int', nullable: true, name: 'refresh_rate' })
  refreshRate!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'response_time',
  })
  responseTime!: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'screen_size',
  })
  screenSize!: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'panel_type' })
  panelType!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'aspect_ratio',
  })
  aspectRatio!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  connectors!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'max_brightness',
  })
  maxBrightness!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'adaptive_sync',
  })
  adaptiveSync!: string | null;
}
