import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Game } from './Game';
import { User } from './User';

@Index('user_game_pkey', ['id'], { unique: true })
@Entity('user_game', { schema: 'wizardlabs' })
export class UserGame {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number | undefined;

  @Column('timestamp without time zone', {
    name: 'created_date',
    default: () => 'CURRENT_TIMESTAMP(0)',
  })
  createdDate: Date | undefined;

  @ManyToOne(() => Game, (game) => game.userGames)
  @JoinColumn([{ name: 'game_id', referencedColumnName: 'id' }])
  game: Game | undefined;

  @ManyToOne(() => User, (user) => user.userGames)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: User | undefined;
}
