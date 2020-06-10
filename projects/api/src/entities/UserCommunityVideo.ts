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
import { UserVideo } from './UserVideo';

@Index('user_community_video_pkey', ['id'], { unique: true })
@Entity('user_community_video', { schema: 'wizardlabs' })
export class UserCommunityVideo {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(
    () => UserCommunity,
    (userCommunity) => userCommunity.userCommunityVideos
  )
  @JoinColumn([{ name: 'community_id', referencedColumnName: 'id' }])
  community: UserCommunity | undefined;

  @ManyToOne(() => User, (user) => user.userCommunityVideos)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;

  @ManyToOne(() => UserVideo, (userVideo) => userVideo.userCommunityVideos)
  @JoinColumn([{ name: 'video_id', referencedColumnName: 'id' }])
  video: UserVideo | undefined;
}
