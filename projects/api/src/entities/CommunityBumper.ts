import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('community_bumper_pkey', ['id'], { unique: true })
@Entity('community_bumper', { schema: 'wizardlabs' })
export class CommunityBumper {
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

  @Column('integer', { name: 'size', nullable: true })
  size: number | null | undefined;

  @Column('character varying', { name: 'type', length: 20 })
  type: string | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;
}
