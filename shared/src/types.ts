

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
  
  movePiece(piece: IPiece, targetCol: number, targetRow: number): void;
  getPieceMovements(piece: IPiece): {col: number; row: number}[]; 
  checkWinCondition(): {winner?: "red" | "blue"}
}


