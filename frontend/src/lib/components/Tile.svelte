<script lang="ts">
  import type { IPieceType, ITile } from '@rps/shared';

  interface Props {
    tile: ITile;
    isDark: boolean;
    isSelected?: boolean;
    isLegalMove?: boolean;
    col: number;
    row: number;
    onTileClick?: (tile: ITile) => void;
  }

  let {
    tile,
    isDark,
    isSelected = false,
    isLegalMove = false,
    col,
    row,
    onTileClick = () => {}
  }: Props = $props();

  let isHighlighted = $state(false);
  let showBlueZone = $state(false);
  let showRedZone = $state(false);

  export function highlightTile(shouldHighlight = true): void {
    isHighlighted = shouldHighlight;
  }

  export function toggleZone(team: 'blue' | 'red'): void {
    if (team === 'blue') {
      showBlueZone = !showBlueZone;
      showRedZone = false;
      return;
    }

    showRedZone = !showRedZone;
    showBlueZone = false;
  }

  const PIECE_LETTERS: Record<IPieceType, string> = {
    rock: 'R',
    paper: 'P',
    scissors: 'S'
  };

  const hasBlueZone = $derived(Object.values(tile.blueZoneOfControl).some(Boolean));
  const hasRedZone = $derived(Object.values(tile.redZoneOfControl).some(Boolean));

  const tileLabel = $derived(
    tile.piece
      ? `${tile.piece.type}${tile.piece.hasPromoted ? ', promoted' : ''}, ${tile.piece.team} team, column ${tile.col + 1}, row ${tile.row + 1}`
      : `Empty tile, column ${tile.col + 1}, row ${tile.row + 1}`
  );
</script>

<button
  type="button"
  onclick={() => onTileClick(tile)}
  aria-label={tileLabel}
  aria-pressed={isSelected}
  data-col={col}
  data-row={row}
  class="relative grid aspect-square place-items-center border border-[#17130f]/25 outline-none transition-[filter,box-shadow] focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#f6c945] {isDark
    ? 'bg-[#c9bda6]'
    : 'bg-[#f7f1e3]'}"
  class:ring-4={isSelected}
  class:ring-inset={isSelected}
  class:ring-[#f6c945]={isSelected}
>
  {#if isHighlighted}
    <span class="pointer-events-none absolute inset-0 bg-[#f6c945]/45 ring-4 ring-inset ring-[#17130f]" aria-hidden="true"></span>
  {/if}

  {#if showBlueZone && hasBlueZone}
    <span class="absolute left-1 top-1 size-1.5 bg-[#2563eb]" aria-hidden="true"></span>
  {/if}
  {#if showRedZone && hasRedZone}
    <span class="absolute bottom-1 right-1 size-1.5 bg-[#e4572e]" aria-hidden="true"></span>
  {/if}

  {#if tile.piece}
    <span
      class="grid size-[72%] place-items-center border-[3px] border-[#17130f] text-[clamp(0.7rem,3.5vw,1.5rem)] font-black leading-none shadow-[2px_2px_0_#17130f] {tile.piece.team ===
      'blue'
        ? 'bg-[#2563eb] text-[#fffaf0]'
        : 'bg-[#e4572e] text-[#fffaf0]'}"
      aria-hidden="true"
    >
      {PIECE_LETTERS[tile.piece.type]}
    </span>
  {/if}

  {#if isLegalMove}
    {#if tile.piece}
      <span class="pointer-events-none absolute inset-1 border-[3px] border-[#2a9d8f]" aria-hidden="true"></span>
    {:else}
      <span class="pointer-events-none absolute size-3 rounded-full border-2 border-[#17130f] bg-[#2a9d8f]" aria-hidden="true"></span>
    {/if}
  {/if}
</button>
