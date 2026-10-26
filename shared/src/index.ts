import type { IBoard, ITile, IPiece, IPieceType } from "./types.ts";

export * from "./types.ts"


const BACK_ROW_LAYOUT: IPieceType[] = [
  "scissors", "paper", "scissors", "rock", "paper",
  "paper", "rock", "scissors", "paper", "scissors",
];

// Starting piece for each column on the row in front of the back row.
const FRONT_ROW_LAYOUT: IPieceType[] = [
  "rock", "scissors", "rock", "scissors", "rock",
  "rock", "scissors", "rock", "scissors", "rock",
];

const PIECE_TYPE_EACH_TYPE_DEFEATS: Record<IPiece["type"], IPiece["type"]> = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp: minimum bound (${min}) cannot be greater than maximum bound (${max}).`);
  }
  return Math.min(Math.max(value, min), max);
}

export class Board implements IBoard {
  cols: number;
  rows: number;
  tiles: ITile[][];
  constructor(cols: number, rows: number) {
    this.cols = cols
    this.rows = rows
    this.tiles = this.setupInitialBoardState()

    this.updateZoneOfControlOfAllTiles()
  }

  private createPiece( pieceType: IPieceType, columnIndex: number, rowIndex: number, team: "red" | "blue"): IPiece { 
    const sharedStartingValues = {
      col: columnIndex,
      row: rowIndex,
      team,
      hasPromoted: false,
      killCountAfterPromotion: 0,
      killCount: 0,
    };

    switch (pieceType) {
      case "paper":
        return { ...sharedStartingValues, type: "paper", maxMovementPoints: 2, movement: "rook" };
      case "scissors":
        return { ...sharedStartingValues, type: "scissors", maxMovementPoints: 2, movement: "bishop" };
      case "rock":
        return { ...sharedStartingValues, type: "rock", maxMovementPoints: 1, movement: "king" };
    }
  }

  private updateTileZoneOfControl(col: number, row: number) {
    const controllingPieceTeam = this.tiles[row][col].piece;

    if (!controllingPieceTeam) {
      return;
    }

    for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
      for (let colOffset = -1; colOffset <= 1; colOffset++) {
        // Offset (0, 0) is the piece's own tile, which isn't part of its zone.
        if (rowOffset === 0 && colOffset === 0) {
          continue;
        }

        const neighborRow = row + rowOffset;
        const neighborCol = col + colOffset;

        const isOffBoard =
          neighborRow < 0 ||
          neighborRow >= this.rows ||
          neighborCol < 0 ||
          neighborCol >= this.cols;

        if (isOffBoard) {
          continue;
        }

        const neighborTile = this.tiles[neighborRow][neighborCol];

        const controllingTeamZone =
          controllingPieceTeam.team === "blue"
            ? neighborTile.blueZoneOfControl
            : neighborTile.redZoneOfControl;

        controllingTeamZone[controllingPieceTeam.type] = true;
      }
    }
  }

  private setupInitialBoardState(): ITile[][] {
    const tiles: ITile[][] = Array.from({ length: this.rows }, () => []);
    const lastRowIndex = this.rows - 1;

    for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
      for (let columnIndex = 0; columnIndex < this.cols; columnIndex++) {
        let startingPiece: IPiece | null = null;

        if (rowIndex === 0) {
          startingPiece = this.createPiece(BACK_ROW_LAYOUT[columnIndex], columnIndex, rowIndex, "blue");
        } else if (rowIndex === 1) {
          startingPiece = this.createPiece(FRONT_ROW_LAYOUT[columnIndex], columnIndex, rowIndex, "blue");
        } else if (rowIndex === lastRowIndex - 1) {
          startingPiece = this.createPiece(FRONT_ROW_LAYOUT[columnIndex], columnIndex, rowIndex, "red");
        } else if (rowIndex === lastRowIndex) {
          startingPiece = this.createPiece(BACK_ROW_LAYOUT[columnIndex], columnIndex, rowIndex, "red");
        }

        tiles[rowIndex].push({
          col: columnIndex,
          row: rowIndex,
          piece: startingPiece,
          blueZoneOfControl: {
            paper: false,
            rock: false,
            scissors: false,
          },
          redZoneOfControl: {
            paper: false,
            rock: false,
            scissors: false,
          }
        });
      }
    }

    return tiles
  }

  private updateZoneOfControlOfAllTiles() {
    for (const row of this.tiles) {
      for (const tile of row) {
        tile.blueZoneOfControl = {
          paper: false,
          rock: false,
          scissors: false,
        };

        tile.redZoneOfControl = {
          paper: false,
          rock: false,
          scissors: false,
        };
      }
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.updateTileZoneOfControl(col, row);
      }
    }
  }

  private getMovePenalty(piece: IPiece, targetCol: number, targetRow: number): number {
    const targetTile = this.tiles[targetRow][targetCol]  
    const targetTileZoc = piece.team == "blue" ? targetTile.redZoneOfControl : targetTile.blueZoneOfControl

    if(piece.type == "paper") {
      if(targetTileZoc.scissors) {
        return 2
      } 
      else if(targetTileZoc.paper) {
        return 1
      }
      else {
        return 0
      }
    }

    else if(piece.type == "scissors") {
      if(targetTileZoc.rock) {
        return 2
      } 
      else if(targetTileZoc.scissors) {
        return 1
      }
      else {
        return 0
      }
    }

    else if(piece.type == "rock") {
      if(targetTileZoc.paper) {
        return 2
      } 
      else if(targetTileZoc.rock) {
        return 1
      }
      else {
        return 0
      }
    }

    return 0
  }

  private checkMatchUp(piece1: IPiece, piece2: IPiece): { tie: false; winner: IPiece; loser: IPiece } | { tie: true } {
    if (piece1.type === piece2.type) {
      return { tie: true };
    }

    const Piece1Wins =
      PIECE_TYPE_EACH_TYPE_DEFEATS[piece1.type] === piece2.type;

    if (Piece1Wins) {
      return { tie: false, winner: piece1, loser: piece2 };
    }

    return { tie: false, winner: piece2, loser: piece1 };
  }

  private isMoveValid(piece: IPiece, targetCol: number, targetRow: number): boolean {

    if(targetCol < 0 || targetCol >= this.cols || targetRow < 0 || targetRow >= this.rows) {
      return false
    }

    const rowDirection = clamp(targetRow - piece.row, -1, 1) 
    const colDirection = clamp(targetCol - piece.col, -1, 1)
    
    let currentMovementPoints = piece.hasPromoted && piece.type != "rock" ? piece.maxMovementPoints + 1 + piece.killCountAfterPromotion : piece.maxMovementPoints

    if(piece.movement == "bishop") {

      //check if movement is diagonal
      const absRowDiff = Math.abs(targetRow - piece.row)
      const absColDiff = Math.abs(targetCol - piece.col)

      const totalSteps = absRowDiff
      
      if(absRowDiff != absColDiff || absRowDiff == 0) {
        return false
      } 

      let previousTileInZone = this.getMovePenalty(piece, piece.col, piece.row) > 0

      for(let step = 1; step <= totalSteps; step++) {
        if(currentMovementPoints < 1) { 
          return false
        }
        
        const stepTargetCol = piece.col + ( colDirection * step )
        const stepTargetRow = piece.row + ( rowDirection * step )

        const movementPenalty = this.getMovePenalty(piece, stepTargetCol, stepTargetRow)
        const movementCost = movementPenalty + 1

        const isEnteringZoneFromOutside = movementPenalty > 0 && !previousTileInZone

        if( currentMovementPoints - movementCost < 0 && !isEnteringZoneFromOutside ) {
          return false
        }
        
        //check if theres a piece blocking you
        const stepTargetTile = this.tiles[stepTargetRow][stepTargetCol]

        if(!stepTargetTile.piece) {}

        else if(stepTargetTile.piece?.team == piece.team) {
          return false
        } 

        else {
          //check if you can eat it
          const matchResult = this.checkMatchUp(piece, stepTargetTile.piece)
          if(matchResult.tie || matchResult.loser == piece) {
            return false
          }

          //a capture has to be the last step
          if(step < totalSteps) {
            return false
          }
        }

        currentMovementPoints -= movementCost
        previousTileInZone = movementPenalty > 0
      }

      return true
    }
    else if(piece.movement == "rook") {
      //check if movement if straight
      
      if(( rowDirection != 0 && colDirection != 0) || rowDirection == 0 && colDirection == 0) {
        return false
      } 
       
      const totalSteps = rowDirection == 0 ? Math.abs(targetCol - piece.col) : Math.abs(targetRow - piece.row) 

      let previousTileInZone = this.getMovePenalty(piece, piece.col, piece.row) > 0

      for(let step = 1; step <= totalSteps; step++) {
        if(currentMovementPoints < 1) { 
          return false
        }

        const stepTargetCol = piece.col + ( colDirection * step )
        const stepTargetRow = piece.row + ( rowDirection * step )

        const movementPenalty = this.getMovePenalty(piece, stepTargetCol, stepTargetRow)
        const movementCost = movementPenalty + 1

        const isEnteringZoneFromOutside = movementPenalty > 0 && !previousTileInZone

        if( currentMovementPoints - movementCost < 0 && !isEnteringZoneFromOutside ) {
          return false
        }
        
        //check if theres a piece blocking you
        const stepTargetTile = this.tiles[stepTargetRow][stepTargetCol]

        if(!stepTargetTile.piece) {}

        else if(stepTargetTile.piece?.team == piece.team) {
          return false
        } 

        else {
          //check if you can eat it
          const matchResult = this.checkMatchUp(piece, stepTargetTile.piece)
          if(matchResult.tie || matchResult.loser == piece) {
            return false
          }

          //a capture has to be the last step
          if(step < totalSteps) {
            return false
          }
        }

        currentMovementPoints -= movementCost
        previousTileInZone = movementPenalty > 0
      }

      return true
    }
    else if(piece.movement == "king") {
      const absRowDiff = Math.abs(targetRow - piece.row)
      const absColDiff = Math.abs(targetCol - piece.col)

      //check if movement is exactly one tile in any direction
      if(absRowDiff > 1 || absColDiff > 1 || (absRowDiff == 0 && absColDiff == 0)) {
        return false
      }

      const movementPenalty = this.getMovePenalty(piece, targetCol, targetRow)
      const movementCost = movementPenalty + 1

      //rock can step into a zone from outside no matter the cost, but can't go zone to zone
      const isStartingInZone = this.getMovePenalty(piece, piece.col, piece.row) > 0
      const isEnteringZoneFromOutside = movementPenalty > 0 && !isStartingInZone

      if(currentMovementPoints - movementCost < 0 && !isEnteringZoneFromOutside) {
        return false
      }

      const targetTile = this.tiles[targetRow][targetCol]

      if(targetTile.piece) {
        if(targetTile.piece.team == piece.team) {
          return false
        }

        const matchResult = this.checkMatchUp(piece, targetTile.piece)
        if(matchResult.tie || matchResult.loser == piece) {
          return false
        }
      }

      return true
    }

    return false
  }

  movePiece(col: number, row: number, targetCol: number, targetRow: number): void {

    const piece = this.tiles[row][col].piece

    if(!piece) {
      throw new Error("invalid movement")
    }

    if(!this.isMoveValid(piece, targetCol, targetRow)) {
      throw new Error("invalid movement")
    }

    //blue promotes on the top row, red on row 0
    const promotionRow = piece.team == "blue" ? this.rows - 1 : 0
    const targetTile = this.tiles[targetRow][targetCol]

    if(targetTile.piece) {
      piece.killCount += 1
      if(piece.hasPromoted) {
        piece.killCountAfterPromotion += 1
      }
    }

    if(targetRow == promotionRow) {
      piece.hasPromoted = true
    }

    this.tiles[piece.row][piece.col].piece = null
    targetTile.piece = piece

    piece.col = targetCol
    piece.row = targetRow

    this.updateZoneOfControlOfAllTiles()
  }

  getPieceMovements(piece: IPiece): { col: number; row: number; }[] {
    const legalMoves: { col: number; row: number; }[] = []

    for(let targetRow = 0; targetRow < this.rows; targetRow++) {
      for(let targetCol = 0; targetCol < this.cols; targetCol++) {
        if(this.isMoveValid(piece, targetCol, targetRow)) {
          legalMoves.push({ col: targetCol, row: targetRow })
        }
      }
    }

    return legalMoves
  }

  checkWinCondition(): { winner?: "blue" | "red"; } {
    let bluePieceCount = 0
    let redPieceCount = 0

    for(let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
      for(let colIndex = 0; colIndex < this.cols; colIndex++) {
        const pieceOnTile = this.tiles[rowIndex][colIndex].piece

        if(!pieceOnTile) {
          continue
        }

        if(pieceOnTile.team == "blue") {
          bluePieceCount += 1
        } else {
          redPieceCount += 1
        }
      }
    }

    if(redPieceCount == 0) {
      return { winner: "blue" }
    }

    if(bluePieceCount == 0) {
      return { winner: "red" }
    }

    return {}
  }
}
