import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Index('user_account_state_pkey', ['id'], { unique: true })
@Entity('user_account_state', { schema: 'wizardlabs' })
export class UserAccountState {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'provider_type', length: 20 })
  providerType: string | undefined;

  @Column('character varying', { name: 'token', length: 50 })
  token: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(() => User, (user) => user.userAccountStates)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
