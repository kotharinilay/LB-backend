import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserAccount } from './UserAccount';
import { User } from './User';
import { UserVideo } from './UserVideo';

@Index('user_video_publish_pkey', ['id'], { unique: true })
@Entity('user_video_publish', { schema: 'wizardlabs' })
export class UserVideoPublish {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'provider_type', length: 20 })
  providerType: string | undefined;

  @Column('character varying', {
    name: 'social_id',
    nullable: true,
    length: 256,
  })
  socialId: string | null | undefined;

  @Column('character varying', { name: 'status', nullable: true, length: 256 })
  status: string | null | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('integer', { name: 'like_count', nullable: true, default: () => '0' })
  likeCount: number | null | undefined;

  @Column('integer', { name: 'view_count', nullable: true, default: () => '0' })
  viewCount: number | null | undefined;

  @Column('integer', {
    name: 'share_count',
    nullable: true,
    default: () => '0',
  })
  shareCount: number | null | undefined;

  @Column('integer', {
    name: 'update_count',
    nullable: true,
    default: () => '0',
  })
  updateCount: number | null | undefined;

  @Column('timestamp without time zone', {
    name: 'last_update',
    nullable: true,
  })
  lastUpdate: Date | null | undefined;

  @Column('integer', {
    name: 'comment_count',
    nullable: true,
    default: () => '0',
  })
  commentCount: number | null | undefined;

  @ManyToOne(() => UserAccount, (userAccount) => userAccount.userVideoPublishes)
  @JoinColumn([{ name: 'user_account_id', referencedColumnName: 'id' }])
  userAccount: UserAccount | undefined;

  @ManyToOne(() => User, (user) => user.userVideoPublishes)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;

  @ManyToOne(() => UserVideo, (userVideo) => userVideo.userVideoPublishes)
  @JoinColumn([{ name: 'video_id', referencedColumnName: 'id' }])
  video: UserVideo | undefined;
}
