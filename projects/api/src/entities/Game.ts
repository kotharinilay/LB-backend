import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserGame } from './UserGame';

@Index('game_pkey', ['id'], { unique: true })
@Entity('game', { schema: 'wizardlabs' })
export class Game {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('character varying', { name: 'name', nullable: true, length: 256 })
  name: string | null | undefined;

  @Column('character varying', {
    name: 'thumbnail_url',
    nullable: true,
    length: 512,
  })
  thumbnailUrl: string | null | undefined;

  @Column('character varying', {
    name: 'twitch_id',
    nullable: true,
    length: 20,
  })
  twitchId: string | null | undefined;

  @OneToMany(() => UserGame, (userGame) => userGame.game)
  userGames: UserGame[] | undefined;
}
