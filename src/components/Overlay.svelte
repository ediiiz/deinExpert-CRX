<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import Options from './Options.svelte';

  function switchModal() {
    state == 'open' ? (state = 'close') : (state = 'open');
  }
  type modalState = 'open' | 'close';
  let state: modalState = 'close';
</script>

<div class="fixed bottom-4 left-0 z-9999 text-white w-screen">
  <div class="flex place-content-center">
    <button class="p-4 bg-dark rounded-4 shadow-dark shadow-2xl" on:click={switchModal}>
      <div class="i-fluent-mdl2-collapse-menu text-2xl" />
    </button>
  </div>
</div>

{#if state == 'open'}
  <div transition:fade={{ duration: 200 }}>
    <div
      class="fixed top-10 right-0 z-9999 bg-white text-black w-screen h-500px border-2 rounded-2 p-4 sm:max-w-sm sm:right-6 md:max-w-md 3xl:max-w-2xl"
    >
      <Options />
    </div>
  </div>
{/if}
