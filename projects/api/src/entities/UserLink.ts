import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Index('user_link_pkey', ['id'], { unique: true })
@Entity('user_link', { schema: 'wizardlabs' })
export class UserLink {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'token', length: 50 })
  token: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(() => User, (user) => user.userLinks)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
