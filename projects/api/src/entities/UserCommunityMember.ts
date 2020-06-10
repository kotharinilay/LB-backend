import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserCommunity } from './UserCommunity';
import { User } from './User';

@Index(
  'user_community_member_community_id_member_id_key',
  ['communityId', 'userId'],
  { unique: true }
)
@Index('user_community_member_pkey', ['id'], { unique: true })
@Entity('user_community_member', { schema: 'wizardlabs' })
export class UserCommunityMember {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('integer', { name: 'community_id', unique: true })
  communityId: number | undefined;

  @Column('integer', { name: 'user_id', unique: true })
  userId: number | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(
    () => UserCommunity,
    (userCommunity) => userCommunity.userCommunityMembers
  )
  @JoinColumn([{ name: 'community_id', referencedColumnName: 'id' }])
  community: UserCommunity | undefined;

  @ManyToOne(() => User, (user) => user.userCommunityMembers)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
