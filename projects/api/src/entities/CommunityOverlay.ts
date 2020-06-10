import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('community_overlay_pkey', ['id'], { unique: true })
@Entity('community_overlay', { schema: 'wizardlabs' })
export class CommunityOverlay {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

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

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;
}
