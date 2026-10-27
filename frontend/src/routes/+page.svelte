<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { SERVER_URL } from "$app/env/public"

  console.log(`SERVER_URL: ${SERVER_URL}`)

  interface Props {
    onCreateGame?: (username: string, roomCode: string) => void;
    onJoinGame?: (username: string, roomCode: string) => void;
  }

  let {
    onCreateGame = (username, roomCode) => console.log('create', username, roomCode),
    onJoinGame = (username, roomCode) => console.log('join', username, roomCode)
  }: Props = $props();

  const USERNAME_STORAGE_KEY = 'rps-username';
  const ROOM_CODE_LENGTH = 5;
  // No 0/O or 1/I so codes are easy to read out loud
  const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let savedUsername = $state<string>('');
  let usernameInput = $state<string>('');
  let isJoinFormOpen = $state<boolean>(false);
  let roomCodeInput = $state<string>('');
  let roomCodeErrorMessage = $state<string>('');

  onMount(() => {
    savedUsername = sessionStorage.getItem(USERNAME_STORAGE_KEY) ?? '';
  });

  function saveUsername(event: SubmitEvent): void {
    event.preventDefault();
    const cleanedUsername = usernameInput.trim();
    if (!cleanedUsername) return;
    sessionStorage.setItem(USERNAME_STORAGE_KEY, cleanedUsername);
    savedUsername = cleanedUsername;
  }

  function changeUsername(): void {
    sessionStorage.removeItem(USERNAME_STORAGE_KEY);
    usernameInput = savedUsername;
    savedUsername = '';
    isJoinFormOpen = false;
    roomCodeInput = '';
    roomCodeErrorMessage = '';
  }

  function generateRoomCode(): string {
    let generatedRoomCode = '';
    for (let characterIndex = 0; characterIndex < ROOM_CODE_LENGTH; characterIndex++) {
      const randomAlphabetIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
      generatedRoomCode += ROOM_CODE_ALPHABET[randomAlphabetIndex];
    }
    return generatedRoomCode;
  }

  function createGame(): void {
    onCreateGame(savedUsername, generateRoomCode());
  }

  function startPassAndPlay(): void {
    void goto(`/game/${generateRoomCode()}?mode=pass-and-play`);
  }

  function joinGame(event: SubmitEvent): void {
    event.preventDefault();
    const cleanedRoomCode = roomCodeInput.trim().toUpperCase();
    if (cleanedRoomCode.length !== ROOM_CODE_LENGTH) {
      roomCodeErrorMessage = `Room codes are ${ROOM_CODE_LENGTH} characters long.`;
      return;
    }
    roomCodeErrorMessage = '';
    onJoinGame(savedUsername, cleanedRoomCode);
  }
</script>

<main class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3ecdc] p-5 text-[#17130f] sm:p-8">
  <div class="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#17130f_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true"></div>
  <div class="pointer-events-none absolute -left-20 top-16 size-64 rounded-full border-[3px] border-[#17130f]/20" aria-hidden="true"></div>
  <div class="pointer-events-none absolute -bottom-24 -right-16 size-72 rotate-12 border-[3px] border-dashed border-[#17130f]/20" aria-hidden="true"></div>

  <div class="relative w-full max-w-md">
    <div class="mb-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em]">
      <span>RPS / Table Game</span>
      <span class="border-2 border-[#17130f] bg-[#f6c945] px-2 py-1 shadow-[2px_2px_0_#17130f]">2 Players</span>
    </div>

    <div class="border-[3px] border-[#17130f] bg-[#fffaf0] p-6 shadow-[8px_8px_0_#17130f] sm:p-8">
      <h1 class="text-5xl font-black uppercase leading-[0.85] tracking-tighter sm:text-6xl">
        <span class="block">Rock</span>
        <span class="block text-[#e4572e]">Paper</span>
        <span class="block">Scissors</span>
      </h1>

      <p class="mt-4 max-w-xs text-sm font-medium leading-relaxed text-[#5b5148]">
        A checkers-style strategy game for two. Claim the board, outthink your rival.
      </p>

      <div class="mt-6 flex gap-3" aria-hidden="true">
        <div class="flex w-20 -rotate-3 flex-col items-center border-[3px] border-[#17130f] bg-[#e4572e] py-2 text-[#fffaf0] shadow-[3px_3px_0_#17130f]">
          <span class="text-3xl font-black leading-none">R</span>
          <span class="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]">Rock</span>
        </div>
        <div class="flex w-20 rotate-2 flex-col items-center border-[3px] border-[#17130f] bg-[#2a9d8f] py-2 text-[#fffaf0] shadow-[3px_3px_0_#17130f]">
          <span class="text-3xl font-black leading-none">P</span>
          <span class="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]">Paper</span>
        </div>
        <div class="flex w-20 -rotate-1 flex-col items-center border-[3px] border-[#17130f] bg-[#f6c945] py-2 shadow-[3px_3px_0_#17130f]">
          <span class="text-3xl font-black leading-none">S</span>
          <span class="mt-1 text-[9px] font-bold uppercase tracking-[0.18em]">Scissors</span>
        </div>
      </div>

      <div class="mt-7 border-t-[3px] border-dashed border-[#17130f]/30 pt-6">
        {#if !savedUsername}
          <form onsubmit={saveUsername} class="space-y-4">
            <label class="block">
              <span class="text-[11px] font-bold uppercase tracking-[0.2em]">Pick a username</span>
              <input
                bind:value={usernameInput}
                maxlength="16"
                autocomplete="off"
                required
                class="mt-2 w-full border-[3px] border-[#17130f] bg-white px-3 py-2.5 font-bold outline-none placeholder:font-medium placeholder:text-[#a49a8d] focus-visible:bg-[#fff4c9] focus-visible:ring-4 focus-visible:ring-[#17130f]/15"
              />
            </label>
            <button
              type="submit"
              class="w-full border-[3px] border-[#17130f] bg-[#17130f] px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#fffaf0] shadow-[4px_4px_0_#e4572e] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2a9d8f]"
            >
              Continue
            </button>
          </form>
        {:else}
          <div class="flex items-center gap-3 border-[3px] border-[#17130f] bg-[#f6c945] p-3">
            <span class="grid size-10 shrink-0 place-items-center border-[3px] border-[#17130f] bg-[#17130f] text-lg font-black uppercase text-[#f6c945]" aria-hidden="true">
              {savedUsername.charAt(0)}
            </span>
            <p class="min-w-0 text-xs font-bold uppercase tracking-[0.15em]">
              Playing as
              <span class="block truncate text-base normal-case tracking-normal">{savedUsername}</span>
            </p>
            <button
              type="button"
              onclick={changeUsername}
              class="ml-auto shrink-0 border-b-2 border-[#17130f] text-[11px] font-bold uppercase tracking-wider hover:bg-[#17130f] hover:text-[#f6c945] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17130f]"
            >
              Change
            </button>
          </div>

          <div class="mt-4 space-y-3">
            <button
              type="button"
              onclick={createGame}
              class="w-full border-[3px] border-[#17130f] bg-[#e4572e] px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#fffaf0] shadow-[4px_4px_0_#17130f] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2a9d8f]"
            >
              Create game
            </button>

            <button
              type="button"
              onclick={startPassAndPlay}
              class="w-full border-[3px] border-[#17130f] bg-[#f6c945] px-4 py-3 text-sm font-black uppercase tracking-[0.15em] shadow-[4px_4px_0_#17130f] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2a9d8f]"
            >
              Pass &amp; play
            </button>

            {#if !isJoinFormOpen}
              <button
                type="button"
                onclick={() => (isJoinFormOpen = true)}
                class="w-full border-[3px] border-[#17130f] bg-[#2a9d8f] px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#fffaf0] shadow-[4px_4px_0_#17130f] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#e4572e]"
              >
                Join game
              </button>
            {:else}
              <form onsubmit={joinGame} class="space-y-3">
                <label class="block">
                  <span class="text-[11px] font-bold uppercase tracking-[0.2em]">Room code</span>
                  <!-- svelte-ignore a11y_autofocus -->
                  <input
                    bind:value={roomCodeInput}
                    maxlength={ROOM_CODE_LENGTH}
                    autocomplete="off"
                    autocapitalize="characters"
                    autofocus
                    class="mt-2 w-full border-[3px] border-[#17130f] bg-white px-3 py-2.5 text-center text-xl font-black uppercase tracking-[0.35em] outline-none focus-visible:bg-[#fff4c9] focus-visible:ring-4 focus-visible:ring-[#17130f]/15"
                  />
                </label>
                {#if roomCodeErrorMessage}
                  <p class="border-l-4 border-[#e4572e] pl-2 text-xs font-bold uppercase tracking-wide text-[#e4572e]" role="alert">{roomCodeErrorMessage}</p>
                {/if}
                <button
                  type="submit"
                  class="w-full border-[3px] border-[#17130f] bg-[#17130f] px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-[#fffaf0] shadow-[4px_4px_0_#f6c945] transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2a9d8f]"
                >
                  Join room
                </button>
              </form>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <p class="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#5b5148]">
      No downloads. Just brains.
    </p>
  </div>
</main>
