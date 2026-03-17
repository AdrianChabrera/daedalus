import { Column, PrimaryColumn } from 'typeorm';

export abstract class Component {
  @PrimaryColumn({ type: 'uuid', name: 'buildcores_id' })
  buildcoresId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string;

  @Column({ type: 'int', nullable: true, name: 'release_year' })
  releaseYear: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  series: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variant: string;
}
