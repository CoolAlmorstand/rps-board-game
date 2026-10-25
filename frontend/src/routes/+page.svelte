<script lang="ts">
  import { onMount } from 'svelte';
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

<main class="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-6">
  <div class="w-full max-w-sm">
    <div class="flex justify-center gap-3 text-3xl" aria-hidden="true">
      <span class="grid place-items-center size-14 rounded-full bg-white shadow-sm">✊</span>
      <span class="grid place-items-center size-14 rounded-full bg-white shadow-sm">✋</span>
      <span class="grid place-items-center size-14 rounded-full bg-white shadow-sm">✌️</span>
    </div>

    <h1 class="mt-6 text-center text-3xl font-bold tracking-tight">Rock Paper Scissors</h1>
    <p class="mt-2 text-center text-slate-600">A checkers-style strategy game for two players.</p>

    <div class="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      {#if !savedUsername}
        <form onsubmit={saveUsername} class="space-y-4">
          <label class="block">
            <span class="text-sm font-medium">Pick a username</span>
            <input
              bind:value={usernameInput}
              maxlength="16"
              autocomplete="off"
              required
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </label>
          <button
            type="submit"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Continue
          </button>
        </form>
      {:else}
        <p class="text-center text-slate-600">
          Playing as <span class="font-semibold text-slate-900">{savedUsername}</span>
          <button
            type="button"
            onclick={changeUsername}
            class="ml-1 text-sm text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
          >
            Change
          </button>
        </p>

        <div class="mt-5 space-y-3">
          <button
            type="button"
            onclick={createGame}
            class="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Create game
          </button>

          {#if !isJoinFormOpen}
            <button
              type="button"
              onclick={() => (isJoinFormOpen = true)}
              class="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Join game
            </button>
          {:else}
            <form onsubmit={joinGame} class="space-y-3">
              <label class="block">
                <span class="text-sm font-medium">Room code</span>
                <!-- svelte-ignore a11y_autofocus -->
                <input
                  bind:value={roomCodeInput}
                  maxlength={ROOM_CODE_LENGTH}
                  autocomplete="off"
                  autocapitalize="characters"
                  autofocus
                  class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg font-semibold uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </label>
              {#if roomCodeErrorMessage}
                <p class="text-sm text-red-600" role="alert">{roomCodeErrorMessage}</p>
              {/if}
              <button
                type="submit"
                class="w-full rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Join room
              </button>
            </form>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</main>
