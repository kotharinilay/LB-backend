import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Index('user_overlay_pkey', ['id'], { unique: true })
@Entity('user_overlay', { schema: 'wizardlabs' })
export class UserOverlay {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('timestamp without time zone', {
    name: 'last_used_date',
    default: () => '1970-01-01 00:00:00',
  })
  lastUsedDate: Date | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @Column('character varying', { name: 'path', nullable: true, length: 256 })
  path: string | null | undefined;

  @Column('character varying', { name: 'url', nullable: true, length: 512 })
  url: string | null | undefined;

  @Column('character varying', {
    name: 'thumbnail_path',
    nullable: true,
    length: 256,
  })
  thumbnailPath: string | null | undefined;

  @Column('character varying', {
    name: 'thumbnail_url',
    nullable: true,
    length: 512,
  })
  thumbnailUrl: string | null | undefined;

  @ManyToOne(() => User, (user) => user.userOverlays)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
