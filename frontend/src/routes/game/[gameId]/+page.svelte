<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  const gameId = $derived(page.params.gameId ?? '');

  let playerTeam = $state<'blue' | 'red' | null>(null);

  onMount(() => {
    playerTeam = Math.random() < 0.5 ? 'red' : 'blue';
  });
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

  <section class="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-5 sm:p-8">
    <div class="flex aspect-square w-full max-w-2xl flex-col items-center justify-center border-[3px] border-[#17130f] bg-[#fffaf0] shadow-[8px_8px_0_#17130f]">
      <p class="text-[11px] font-black uppercase tracking-[0.25em] text-[#5b5148]">Board area</p>
      <p class="mt-2 text-sm font-bold">Tiles and board arrive in the next layer.</p>
    </div>
  </section>
</main>
