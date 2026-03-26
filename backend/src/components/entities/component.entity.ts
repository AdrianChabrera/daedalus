import { Column, PrimaryColumn } from 'typeorm';

export abstract class Component {
  @PrimaryColumn({ type: 'uuid', name: 'buildcores_id' })
  buildcoresId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'int', nullable: true, name: 'release_year' })
  releaseYear: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  series: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  variant: string | null;
}
