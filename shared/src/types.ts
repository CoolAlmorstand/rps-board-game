

export type IPieceType = "paper" | "rock" | "scissors"

export type IPiece = {
  type: "paper"
  col: number;
  row: number;
  hasPromoted: boolean;
  killCountAfterPromotion: number;
  killCount: number;
  maxMovementPoints: number;
  team: "blue" | "red";
  movement: "rook";
} | {
  type: "scissors"
  col: number;
  row: number;
  hasPromoted: boolean; 
  killCountAfterPromotion: number;
  killCount: number;
  maxMovementPoints: number;
  team: "blue" | "red";
  movement: "bishop";
} | {
  type: "rock"
  team: "blue" | "red";
  col: number;
  row: number;
  hasPromoted: boolean;
  killCountAfterPromotion: number;
  killCount: number;
  maxMovementPoints: number;
  movement: "king";
}

export type ITile = {
  col: number;
  row: number;
  piece: null | IPiece; 
  blueZoneOfControl: Record<IPieceType, boolean>;
  redZoneOfControl: Record<IPieceType, boolean>;
}


export interface IBoard {
  tiles: ITile[][];
  cols: number;
  rows: number;
  
  movePiece(col: number, row: number, targetCol: number, targetRow: number): void;
  getState(): BoardState;
  getPieceMovements(piece: IPiece): {col: number; row: number}[]; 
  checkWinCondition(): {winner?: "red" | "blue"}
}

export type Team = "blue" | "red";

export type BoardState = Pick<IBoard, "tiles" | "cols" | "rows">;

export type GameStatus = "waiting" | "playing" | "finished";

export type GameState = {
  roomCode: string;
  board: BoardState;
  activeTeam: Team | null;
  winner: Team | null;
  status: GameStatus;
  players: Record<Team, string | null>;
};

export type CreateGamePayload = {
  roomCode: string;
  username: string;
};

export type JoinGamePayload = CreateGamePayload;

export type MovePayload = {
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
};

export type SocketAck = { ok: true; team?: Team } | { ok: false; error: string };

export interface ClientToServerEvents {
  create_game: (payload: CreateGamePayload, acknowledge: (response: SocketAck) => void) => void;
  join_game: (payload: JoinGamePayload, acknowledge: (response: SocketAck) => void) => void;
  make_move: (payload: MovePayload, acknowledge: (response: SocketAck) => void) => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  game_error: (message: string) => void;
}
