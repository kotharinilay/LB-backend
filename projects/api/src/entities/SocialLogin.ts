import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('social_login_pkey', ['id'], { unique: true })
@Entity('social_login', { schema: 'wizardlabs' })
export class SocialLogin {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'action', length: 20 })
  action: string | undefined;

  @Column('character varying', { name: 'provider_type', length: 20 })
  providerType: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('character varying', { name: 'token', length: 50 })
  token: string | undefined;
}
