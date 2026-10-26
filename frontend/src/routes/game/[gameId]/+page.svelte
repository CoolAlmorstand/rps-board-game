<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Board, type IPiece, type ITile } from '@rps/shared';
  import BoardView from '#lib/components/Board.svelte';

  const gameId = $derived(page.params.gameId ?? '');

  let playerTeam = $state<'blue' | 'red' | null>(null);
  let board = new Board(10, 10);
  let boardTiles = $state(board.tiles);
  board.tiles = boardTiles;
  let selectedPiece = $state<IPiece | null>(null);
  let legalMoves = $state<{ col: number; row: number }[]>([]);
  let winner = $state<'blue' | 'red' | null>(null);

  type BoardApi = {
    highlightTile: (col: number, row: number, shouldHighlight?: boolean) => void;
    clearHighlights: () => void;
    toggleZone: (team: 'blue' | 'red') => void;
  };

  let boardView = $state<BoardApi>();

  onMount(() => {
    playerTeam = Math.random() < 0.5 ? 'red' : 'blue';
  });

  function clearSelection(): void {
    selectedPiece = null;
    legalMoves = [];
    boardView?.clearHighlights();
  }

  function selectPiece(tile: ITile): void {
    if (!tile.piece) return;

    selectedPiece = tile.piece;
    legalMoves = board.getPieceMovements(tile.piece);
    boardView?.clearHighlights();
    boardView?.highlightTile(tile.col, tile.row);
  }

  function handleTileClick(tile: ITile): void {
    if (winner || !playerTeam) return;

    const isLegalTarget = legalMoves.some(
      (move) => move.col === tile.col && move.row === tile.row
    );

    if (selectedPiece && isLegalTarget) {
      board.movePiece(selectedPiece.col, selectedPiece.row, tile.col, tile.row);
      clearSelection();
      winner = board.checkWinCondition().winner ?? null;
      return;
    }

    if (tile.piece?.team === playerTeam) {
      if (selectedPiece?.col === tile.col && selectedPiece?.row === tile.row) {
        clearSelection();
        return;
      }

      selectPiece(tile);
      return;
    }

    clearSelection();
  }
</script>

<main class="relative flex min-h-screen flex-col overflow-hidden bg-[#f3ecdc] text-[#17130f]">
  <div class="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#17130f_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true"></div>

  <header class="relative border-b-[3px] border-[#17130f] bg-[#fffaf0]">
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <a
        href="/"
        class="border-b-2 border-[#17130f] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#17130f] hover:text-[#fffaf0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17130f]"
      >
        Back
      </a>

      <div class="text-center">
        <p class="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5b5148]">Game</p>
        <h1 class="text-lg font-black uppercase tracking-tight">{gameId}</h1>
      </div>

      <div class="min-w-24 text-right">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b5148]">You are</p>
        {#if playerTeam}
          <p
            class="mt-1 inline-block border-2 border-[#17130f] px-2 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-[#fffaf0] shadow-[2px_2px_0_#17130f]"
            class:bg-[#2563eb]={playerTeam === 'blue'}
            class:bg-[#e4572e]={playerTeam === 'red'}
          >
            {playerTeam}
          </p>
        {:else}
          <p class="mt-1 text-[11px] font-bold uppercase tracking-[0.15em]">Assigning…</p>
        {/if}
      </div>
    </div>
  </header>

  <section class="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 p-5 sm:p-8">
    {#if playerTeam}
      <div class="relative w-full max-w-2xl">
        <BoardView
          {board}
          {playerTeam}
          {selectedPiece}
          {legalMoves}
          onTileClick={handleTileClick}
          bind:this={boardView}
        />

        {#if winner}
          <div class="absolute inset-0 grid place-items-center bg-[#f3ecdc]/80 p-6">
            <div class="border-[3px] border-[#17130f] bg-[#f6c945] px-8 py-6 text-center shadow-[6px_6px_0_#17130f]">
              <p class="text-[11px] font-black uppercase tracking-[0.25em]">Winner</p>
              <p class="mt-2 text-4xl font-black uppercase tracking-tight">{winner}</p>
            </div>
          </div>
        {/if}
      </div>

      <div class="flex w-full max-w-2xl flex-wrap items-center justify-between gap-3">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5b5148]">
          {selectedPiece ? 'Pick a highlighted tile' : 'Select one of your pieces'}
        </p>

        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => boardView?.toggleZone('blue')}
            class="flex items-center gap-2 border-2 border-[#17130f] bg-[#fffaf0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-[2px_2px_0_#17130f] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17130f]"
          >
            <span class="size-2.5 bg-[#2563eb]" aria-hidden="true"></span>
            Blue zone
          </button>
          <button
            type="button"
            onclick={() => boardView?.toggleZone('red')}
            class="flex items-center gap-2 border-2 border-[#17130f] bg-[#fffaf0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-[2px_2px_0_#17130f] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17130f]"
          >
            <span class="size-2.5 bg-[#e4572e]" aria-hidden="true"></span>
            Red zone
          </button>
        </div>
      </div>
    {:else}
      <div class="flex aspect-square w-full max-w-2xl items-center justify-center border-[3px] border-[#17130f] bg-[#fffaf0] shadow-[8px_8px_0_#17130f]">
        <p class="text-[11px] font-black uppercase tracking-[0.25em] text-[#5b5148]">Assigning side…</p>
      </div>
    {/if}
  </section>
</main>
