import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('scheduled_job_pkey', ['id'], { unique: true })
@Entity('scheduled_job', { schema: 'wizardlabs' })
export class ScheduledJob {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'name', length: 100 })
  name: string | undefined;

  @Column('character varying', { name: 'status', length: 20 })
  status: string | undefined;

  @Column('timestamp without time zone', {
    name: 'last_started_date',
    nullable: true,
  })
  lastStartedDate: Date | null | undefined;
}
