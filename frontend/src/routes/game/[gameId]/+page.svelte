<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { SERVER_URL } from '$app/env/public';
  import {
    Board,
    type ClientToServerEvents,
    type GameState,
    type GameStatus,
    type IPiece,
    type ITile,
    type ServerToClientEvents,
    type SocketAck,
    type Team
  } from '@rps/shared';
  import { io, type Socket } from 'socket.io-client';
  import BoardView from '#lib/components/Board.svelte';

  const gameId = $derived(page.params.gameId ?? '');
  const isPassAndPlay = $derived(page.url.searchParams.get('mode') === 'pass-and-play');
  const isOnline = $derived(!isPassAndPlay);
  const isCreator = $derived(page.url.searchParams.get('create') === '1');

  let activeTeam = $state<Team | null>(null);
  let board = $state.raw(new Board(10, 10));
  let selectedPiece = $state<IPiece | null>(null);
  let legalMoves = $state<{ col: number; row: number }[]>([]);
  let winner = $state<Team | null>(null);
  let autoFlip = $state(true);
  let playerTeam = $state<Team | null>(null);
  let gameStatus = $state<GameStatus>('waiting');
  let players = $state<Record<Team, string | null>>({ blue: null, red: null });
  let gameError = $state('');
  let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  const perspectiveTeam = $derived(isPassAndPlay ? (autoFlip ? activeTeam : 'blue') : playerTeam);
  const displayTeam = $derived(isPassAndPlay ? activeTeam : playerTeam);
  const opponentUsername = $derived(
    playerTeam === 'blue' ? players.red : playerTeam === 'red' ? players.blue : null
  );
  const isWaiting = $derived(isOnline && gameStatus === 'waiting');
  const isMyTurn = $derived(
    isPassAndPlay || (gameStatus === 'playing' && activeTeam === playerTeam)
  );
  const statusText = $derived.by(() => {
    if (winner) return `${winner} wins`;
    if (isWaiting) return opponentUsername ? 'Opponent disconnected. Waiting…' : 'Waiting for opponent…';
    if (isOnline && !isMyTurn) return `${activeTeam ?? 'Opponent'} is thinking…`;
    if (selectedPiece) return 'Pick a highlighted tile';
    return `Select a ${activeTeam ?? 'blue'} piece`;
  });

  type BoardApi = {
    highlightTile: (col: number, row: number, shouldHighlight?: boolean) => void;
    clearHighlights: () => void;
    toggleZone: (team: 'blue' | 'red') => void;
  };

  let boardView = $state<BoardApi>();

  function getServerUrl(): string {
    const configuredUrl = SERVER_URL.trim();
    if (!configuredUrl) return 'http://localhost:3000';
    return /^https?:\/\//.test(configuredUrl) ? configuredUrl : `http://${configuredUrl}`;
  }

  function handleJoinResponse(response: SocketAck): void {
    if (!response.ok) {
      gameError = response.error;
      return;
    }

    gameError = '';
    playerTeam = response.team ?? null;
  }

  function enterRoom(): void {
    if (!socket) return;

    const username = sessionStorage.getItem('rps-username')?.trim() || 'Player';
    const payload = { roomCode: gameId, username };

    socket.emit('join_game', payload, (response) => {
      if (response.ok) {
        handleJoinResponse(response);
        return;
      }

      if (isCreator && response.error === 'Room not found.') {
        socket?.emit('create_game', payload, handleJoinResponse);
        return;
      }

      gameError = response.error;
    });
  }

  function applyGameState(state: GameState): void {
    board = Board.fromState(state.board);
    activeTeam = state.activeTeam;
    winner = state.winner;
    gameStatus = state.status;
    players = state.players;
    clearSelection();
  }

  onMount(() => {
    if (isPassAndPlay) {
      activeTeam = 'blue';
      return;
    }

    socket = io(getServerUrl());

    socket.on('connect', () => {
      gameError = '';
      enterRoom();
    });

    socket.on('game_state', (state) => {
      if (state.roomCode === gameId) applyGameState(state);
    });

    socket.on('game_error', (message) => {
      gameError = message;
    });

    socket.on('connect_error', () => {
      gameError = 'Could not connect to the game server. Retrying…';
    });

    socket.on('disconnect', () => {
      if (!winner) gameError = 'Connection lost. Reconnecting…';
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
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
    if (winner || !activeTeam || (isOnline && !isMyTurn)) return;

    const isLegalTarget = legalMoves.some(
      (move) => move.col === tile.col && move.row === tile.row
    );

    if (selectedPiece && isLegalTarget) {
      if (isOnline) {
        const move = {
          fromCol: selectedPiece.col,
          fromRow: selectedPiece.row,
          toCol: tile.col,
          toRow: tile.row
        };

        socket?.emit('make_move', move, (response) => {
          if (!response.ok) {
            gameError = response.error;
            return;
          }

          gameError = '';
          clearSelection();
        });
        return;
      }

      board.movePiece(selectedPiece.col, selectedPiece.row, tile.col, tile.row);
      clearSelection();
      winner = board.checkWinCondition().winner ?? null;

      if (!winner && isPassAndPlay) {
        activeTeam = activeTeam === 'blue' ? 'red' : 'blue';
      }
      return;
    }

    if (tile.piece?.team === activeTeam) {
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
        {#if isPassAndPlay}
          <p class="mt-1 inline-block border-2 border-[#17130f] bg-[#f6c945] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em]">Pass &amp; play</p>
        {:else}
          <p class="mt-1 inline-block border-2 border-[#17130f] bg-[#2a9d8f] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#fffaf0]">Online</p>
        {/if}
      </div>

      <div class="min-w-24 text-right">
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b5148]">{isPassAndPlay ? 'Turn' : 'You are'}</p>
        {#if displayTeam}
          <p
            class="mt-1 inline-block border-2 border-[#17130f] px-2 py-1 text-[11px] font-black uppercase tracking-[0.15em] text-[#fffaf0] shadow-[2px_2px_0_#17130f]"
            class:bg-[#2563eb]={displayTeam === 'blue'}
            class:bg-[#e4572e]={displayTeam === 'red'}
          >
            {displayTeam}
          </p>
        {:else}
          <p class="mt-1 text-[11px] font-bold uppercase tracking-[0.15em]">Connecting…</p>
        {/if}
      </div>
    </div>
  </header>

  <section class="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 p-5 sm:p-8">
    {#if gameError}
      <p class="w-full max-w-2xl border-l-4 border-[#e4572e] bg-[#fffaf0] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#e4572e]" role="alert">
        {gameError}
      </p>
    {/if}

    {#if isPassAndPlay ? activeTeam : playerTeam && (gameStatus === 'playing' || gameStatus === 'finished')}
      <div class="relative w-full max-w-2xl">
        <BoardView
          {board}
          playerTeam={perspectiveTeam ?? 'blue'}
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
          {statusText}
        </p>

        <div class="flex gap-2">
          {#if isPassAndPlay}
            <button
              type="button"
              role="switch"
              aria-checked={autoFlip}
              onclick={() => (autoFlip = !autoFlip)}
              class="flex items-center gap-2 border-2 border-[#17130f] bg-[#fffaf0] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-[2px_2px_0_#17130f] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17130f]"
            >
              Auto flip
              <span class="border border-[#17130f] px-1 {autoFlip ? 'bg-[#2a9d8f] text-[#fffaf0]' : 'bg-[#e8dfcd]'}">
                {autoFlip ? 'On' : 'Off'}
              </span>
            </button>
          {/if}

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
        {#if isWaiting}
          <div class="text-center">
            <p class="text-[11px] font-black uppercase tracking-[0.25em] text-[#5b5148]">Waiting for opponent</p>
            <p class="mt-3 border-2 border-[#17130f] bg-[#f6c945] px-4 py-2 text-2xl font-black tracking-[0.25em] shadow-[3px_3px_0_#17130f]">{gameId}</p>
            <p class="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b5148]">Share this room code</p>
          </div>
        {:else}
          <p class="text-[11px] font-black uppercase tracking-[0.25em] text-[#5b5148]">Connecting to game…</p>
        {/if}
      </div>
    {/if}
  </section>
</main>
