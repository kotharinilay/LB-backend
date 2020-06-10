import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Index('user_password_reset_pkey', ['id'], { unique: true })
@Entity('user_password_reset', { schema: 'wizardlabs' })
export class UserPasswordReset {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('character varying', { name: 'token', nullable: true, length: 50 })
  token: string | null | undefined;

  @ManyToOne(() => User, (user) => user.userPasswordResets)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
