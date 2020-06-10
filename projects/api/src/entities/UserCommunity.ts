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
import { UserCommunityInvite } from './UserCommunityInvite';
import { UserCommunityMember } from './UserCommunityMember';
import { UserCommunityVideo } from './UserCommunityVideo';

@Index('user_community_pkey', ['id'], { unique: true })
@Entity('user_community', { schema: 'wizardlabs' })
export class UserCommunity {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'name', nullable: true, length: 256 })
  name: string | null | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('character varying', {
    name: 'description',
    nullable: true,
    length: 500,
  })
  description: string | null | undefined;

  @Column('varchar', { name: 'tags', nullable: true, array: true })
  tags: string[] | null | undefined;

  @Column('varchar', { name: 'other_links', nullable: true, array: true })
  otherLinks: string[] | null | undefined;

  @Column('character varying', {
    name: 'logo_url',
    nullable: true,
    length: 256,
  })
  logoUrl: string | null | undefined;

  @Column('jsonb', { name: 'social', nullable: true })
  social: object | null | undefined;

  @ManyToOne(() => User, (user) => user.userCommunities)
  @JoinColumn([{ name: 'owner_id', referencedColumnName: 'id' }])
  owner: User | undefined;

  @OneToMany(
    () => UserCommunityInvite,
    (userCommunityInvite) => userCommunityInvite.community
  )
  userCommunityInvites: UserCommunityInvite[] | undefined;

  @OneToMany(
    () => UserCommunityMember,
    (userCommunityMember) => userCommunityMember.community
  )
  userCommunityMembers: UserCommunityMember[] | undefined;

  @OneToMany(
    () => UserCommunityVideo,
    (userCommunityVideo) => userCommunityVideo.community
  )
  userCommunityVideos: UserCommunityVideo[] | undefined;
}
