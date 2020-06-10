import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserClip } from './UserClip';

@Index('user_clip_metadata_pkey', ['id'], { unique: true })
@Entity('user_clip_metadata', { schema: 'wizardlabs' })
export class UserClipMetadata {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('jsonb', { name: 'metadata' })
  metadata: object | undefined;

  @ManyToOne(() => UserClip, (userClip) => userClip.userClipMetadata)
  @JoinColumn([{ name: 'clip_id', referencedColumnName: 'id' }])
  clip: UserClip | undefined;
}
