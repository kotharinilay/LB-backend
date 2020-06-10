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
import { UserClipMetadata } from './UserClipMetadata';
import { UserVideo } from './UserVideo';

@Index('user_clip_pkey', ['id'], { unique: true })
@Entity('user_clip', { schema: 'wizardlabs' })
export class UserClip {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'name', nullable: true, length: 256 })
  name: string | null | undefined;

  @Column('character varying', {
    name: 'channel_id',
    nullable: true,
    length: 256,
  })
  channelId: string | null | undefined;

  @Column('character varying', {
    name: 'game_name',
    nullable: true,
    length: 256,
  })
  gameName: string | null | undefined;

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

  @Column('character varying', {
    name: 'stream_id',
    nullable: true,
    length: 50,
  })
  streamId: string | null | undefined;

  @Column('character varying', { name: 'type', nullable: true, length: 20 })
  type: string | null | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('character varying', { name: 'status', length: 20 })
  status: string | undefined;

  @Column('character varying', { name: 'ai_title', nullable: true, length: 50 })
  aiTitle: string | null | undefined;

  @Column('character varying', {
    name: 'streamer_name',
    nullable: true,
    length: 100,
  })
  streamerName: string | null | undefined;

  @Column('text', { name: 'labels', nullable: true, array: true })
  labels: string[] | null | undefined;

  @Column('character varying', {
    name: 'game_mode',
    nullable: true,
    length: 256,
    default: () => 'Battle Royale',
  })
  gameMode: string | null | undefined;

  @Column('timestamp without time zone', {
    name: 'stream_date',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  streamDate: Date | null | undefined;

  @ManyToOne(() => User, (user) => user.userClips)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;

  @OneToMany(
    () => UserClipMetadata,
    (userClipMetadata) => userClipMetadata.clip
  )
  userClipMetadata: UserClipMetadata[] | undefined;

  @OneToMany(() => UserVideo, (userVideo) => userVideo.clip)
  userVideos: UserVideo[] | undefined;
}
