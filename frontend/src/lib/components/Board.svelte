<script lang="ts">
  import type { Board, IPiece, ITile } from '@rps/shared';
  import Tile from './Tile.svelte';

  interface Props {
    board: Board;
    playerTeam: 'blue' | 'red';
    selectedPiece?: IPiece | null;
    legalMoves?: { col: number; row: number }[];
    onTileClick?: (tile: ITile) => void;
  }

  let {
    board,
    playerTeam,
    selectedPiece = null,
    legalMoves = [],
    onTileClick = () => {}
  }: Props = $props();

  type TileApi = {
    highlightTile: (shouldHighlight?: boolean) => void;
    toggleZone: (team: 'blue' | 'red') => void;
  };

  const displayRows = $derived.by(() => {
    const rows: number[] = [];

    if (playerTeam === 'red') {
      for (let row = 0; row < board.rows; row++) {
        rows.push(row);
      }
    } else {
      for (let row = board.rows - 1; row >= 0; row--) {
        rows.push(row);
      }
    }

    return rows;
  });

  const legalMoveKeys = $derived(new Set(legalMoves.map((move) => `${move.col}:${move.row}`)));

  let tileRefs = $state<Record<string, TileApi | undefined>>({});
  let activeZone = $state<'blue' | 'red' | null>(null);

  function tileKey(col: number, row: number): string {
    return `${col}:${row}`;
  }

  export function highlightTile(col: number, row: number, shouldHighlight = true): void {
    tileRefs[tileKey(col, row)]?.highlightTile(shouldHighlight);
  }

  export function clearHighlights(): void {
    for (const tile of Object.values(tileRefs)) {
      tile?.highlightTile(false);
    }
  }

  export function toggleZone(team: 'blue' | 'red'): void {
    if (activeZone === team) {
      for (const tile of Object.values(tileRefs)) {
        tile?.toggleZone(team);
      }
      activeZone = null;
      return;
    }

    if (activeZone) {
      for (const tile of Object.values(tileRefs)) {
        tile?.toggleZone(activeZone);
      }
    }

    for (const tile of Object.values(tileRefs)) {
      tile?.toggleZone(team);
    }

    activeZone = team;
  }
</script>

<div
  class="grid aspect-square w-full border-[3px] border-[#17130f] bg-[#17130f] p-1.5 shadow-[8px_8px_0_#17130f]"
  style="grid-template-columns: repeat({board.cols}, minmax(0, 1fr))"
  role="grid"
  aria-label="Game board"
>
  {#each displayRows as row (row)}
    <div class="contents" role="row">
      {#each Array(board.cols) as _, col (col)}
        {@const tile = board.tiles[row][col]}
        <Tile
          {tile}
          {col}
          {row}
          isDark={(row + col) % 2 === 1}
          isSelected={selectedPiece?.col === col && selectedPiece?.row === row}
          isLegalMove={legalMoveKeys.has(tileKey(col, row))}
          onTileClick={onTileClick}
          bind:this={tileRefs[tileKey(col, row)]}
        />
      {/each}
    </div>
  {/each}
</div>
