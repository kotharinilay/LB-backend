import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserCommunity } from './UserCommunity';

@Index('user_community_invite_pkey', ['id'], { unique: true })
@Entity('user_community_invite', { schema: 'wizardlabs' })
export class UserCommunityInvite {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'token', length: 50 })
  token: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(
    () => UserCommunity,
    (userCommunity) => userCommunity.userCommunityInvites
  )
  @JoinColumn([{ name: 'community_id', referencedColumnName: 'id' }])
  community: UserCommunity | undefined;
}
