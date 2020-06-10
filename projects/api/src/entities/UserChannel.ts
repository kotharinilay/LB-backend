import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Index('user_channel_pkey', ['id'], { unique: true })
@Entity('user_channel', { schema: 'wizardlabs' })
export class UserChannel {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'external_id', length: 256 })
  externalId: string | undefined;

  @Column('character varying', { name: 'name', length: 512 })
  name: string | undefined;

  @Column('character varying', { name: 'original_name', length: 512 })
  originalName: string | undefined;

  @Column('character varying', { name: 'provider_type', length: 20 })
  providerType: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(() => User, (user) => user.userChannels)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
