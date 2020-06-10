import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserCommunityVideo } from './UserCommunityVideo';
import { UserClip } from './UserClip';
import { User } from './User';
import { UserVideoPublish } from './UserVideoPublish';

@Index('user_video_pkey', ['id'], { unique: true })
@Entity('user_video', { schema: 'wizardlabs' })
export class UserVideo {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'name', nullable: true, length: 256 })
  name: string | null | undefined;

  @Column('character varying', { name: 'path', nullable: true, length: 256 })
  path: string | null | undefined;

  @Column('character varying', {
    name: 'thumbnail_path',
    nullable: true,
    length: 256,
  })
  thumbnailPath: string | null | undefined;

  @Column('character varying', { name: 'url', nullable: true, length: 512 })
  url: string | null | undefined;

  @Column('character varying', {
    name: 'thumbnail_url',
    nullable: true,
    length: 512,
  })
  thumbnailUrl: string | null | undefined;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata: object | null | undefined;

  @Column('text', { name: 'tags', nullable: true, array: true })
  tags: string[] | null | undefined;

  @Column('character varying', { name: 'status', length: 20 })
  status: string | undefined;

  @Column('character varying', { name: 'type', length: 20 })
  type: string | undefined;

  @Column('timestamp without time zone', {
    name: 'upload_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  uploadDate: Date | undefined;

  @Column('timestamp without time zone', { name: 'created_date' })
  createdDate: Date | undefined;

  @OneToMany(
    () => UserCommunityVideo,
    (userCommunityVideo) => userCommunityVideo.video
  )
  userCommunityVideos: UserCommunityVideo[] | undefined;

  @ManyToOne(() => UserClip, (userClip) => userClip.userVideos)
  @JoinColumn([{ name: 'clip_id', referencedColumnName: 'id' }])
  clip: UserClip | undefined;

  @ManyToOne(() => User, (user) => user.userVideos)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;

  @OneToMany(
    () => UserVideoPublish,
    (userVideoPublish) => userVideoPublish.video
  )
  userVideoPublishes: UserVideoPublish[] | undefined;
}
