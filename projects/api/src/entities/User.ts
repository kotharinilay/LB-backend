import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserAccount } from './UserAccount';
import { UserAccountState } from './UserAccountState';
import { UserBumper } from './UserBumper';
import { UserChannel } from './UserChannel';
import { UserClip } from './UserClip';
import { UserCommunity } from './UserCommunity';
import { UserCommunityMember } from './UserCommunityMember';
import { UserCommunityVideo } from './UserCommunityVideo';
import { UserGame } from './UserGame';
import { UserLink } from './UserLink';
import { UserOverlay } from './UserOverlay';
import { UserPasswordReset } from './UserPasswordReset';
import { UserVideo } from './UserVideo';
import { UserVideoPublish } from './UserVideoPublish';

@Index('user_pkey', ['id'], { unique: true })
@Entity('user', { schema: 'wizardlabs' })
export class User {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'old_id', nullable: true, length: 30 })
  oldId: string | null | undefined;

  @Column('character varying', { name: 'email', nullable: true, length: 100 })
  email: string | null | undefined;

  @Column('character varying', {
    name: 'password',
    nullable: true,
    length: 256,
  })
  password: string | null | undefined;

  @Column('character varying', { name: 'name', nullable: true, length: 256 })
  name: string | null | undefined;

  @Column('jsonb', { name: 'settings', nullable: true })
  settings: object | null | undefined;

  @Column('character varying', { name: 'status', nullable: true, length: 20 })
  status: string | null | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('character varying', {
    name: 'user_name',
    nullable: true,
    length: 50,
  })
  userName: string | null | undefined;

  @Column('jsonb', { name: 'avatar', nullable: true })
  avatar: object | null | undefined;

  @Column('jsonb', { name: 'background', nullable: true })
  background: object | null | undefined;

  @Column('character varying', { name: 'socialid', nullable: true })
  socialid: string | null | undefined;

  @Column('character varying', { name: 'socialplatform', nullable: true })
  socialplatform: string | null | undefined;

  @OneToMany(() => UserAccount, (userAccount) => userAccount.user)
  userAccounts: UserAccount[] | undefined;

  @OneToMany(
    () => UserAccountState,
    (userAccountState) => userAccountState.user
  )
  userAccountStates: UserAccountState[] | undefined;

  @OneToMany(() => UserBumper, (userBumper) => userBumper.user)
  userBumpers: UserBumper[] | undefined;

  @OneToMany(() => UserChannel, (userChannel) => userChannel.user)
  userChannels: UserChannel[] | undefined;

  @OneToMany(() => UserClip, (userClip) => userClip.user)
  userClips: UserClip[] | undefined;

  @OneToMany(() => UserCommunity, (userCommunity) => userCommunity.owner)
  userCommunities: UserCommunity[] | undefined;

  @OneToMany(
    () => UserCommunityMember,
    (userCommunityMember) => userCommunityMember.user
  )
  userCommunityMembers: UserCommunityMember[] | undefined;

  @OneToMany(
    () => UserCommunityVideo,
    (userCommunityVideo) => userCommunityVideo.user
  )
  userCommunityVideos: UserCommunityVideo[] | undefined;

  @OneToMany(() => UserGame, (userGame) => userGame.user)
  userGames: UserGame[] | undefined;

  @OneToMany(() => UserLink, (userLink) => userLink.user)
  userLinks: UserLink[] | undefined;

  @OneToMany(() => UserOverlay, (userOverlay) => userOverlay.user)
  userOverlays: UserOverlay[] | undefined;

  @OneToMany(
    () => UserPasswordReset,
    (userPasswordReset) => userPasswordReset.user
  )
  userPasswordResets: UserPasswordReset[] | undefined;

  @OneToMany(() => UserVideo, (userVideo) => userVideo.user)
  userVideos: UserVideo[] | undefined;

  @OneToMany(
    () => UserVideoPublish,
    (userVideoPublish) => userVideoPublish.user
  )
  userVideoPublishes: UserVideoPublish[] | undefined;
}