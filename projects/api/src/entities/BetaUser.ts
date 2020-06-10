import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('beta_user_pkey', ['id'], { unique: true })
@Entity('beta_user', { schema: 'wizardlabs' })
export class BetaUser {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'email', length: 100 })
  email: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;
}
