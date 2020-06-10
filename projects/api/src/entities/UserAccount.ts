import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { UserVideoPublish } from './UserVideoPublish';

@Index('user_account_pkey', ['id'], { unique: true })
@Entity('user_account', { schema: 'wizardlabs' })
export class UserAccount {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', {
    name: 'provider_type',
    nullable: true,
    length: 20,
  })
  providerType: string | null | undefined;

  @Column('jsonb', { name: 'auth', nullable: true })
  auth: object | null | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('jsonb', { name: 'user_data', nullable: true })
  userData: object | null | undefined;

  @Column('character varying', { name: 'status', length: 20 })
  status: string | undefined;

  @ManyToOne(() => User, (user) => user.userAccounts)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;

  @OneToMany(
    () => UserVideoPublish,
    (userVideoPublish) => userVideoPublish.userAccount
  )
  userVideoPublishes: UserVideoPublish[] | undefined;
}
