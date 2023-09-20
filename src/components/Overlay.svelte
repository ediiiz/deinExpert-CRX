<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import DeinExpert from './deinExpert.svelte';

  function switchModal() {
    state == 'open' ? (state = 'close') : (state = 'open');
  }
  type modalState = 'open' | 'close';
  let state: modalState = 'close';
</script>

{#if window.location.pathname.startsWith('/shop')}
  <div class="fixed bottom-4 left-0 z-9999 text-white w-screen">
    <div class="flex place-content-center">
      <button class="bg-white p-2 rounded-2 border-2 border-primary" on:click={switchModal}>
        <div class="i-noto-man-detective-medium-light-skin-tone text-5xl" />
      </button>
    </div>
  </div>
{/if}

{#if state == 'open'}
  <div transition:fade={{ duration: 200 }}>
    <div
      class="fixed top-20 right-0 z-9999 bg-white text-black h-500px w-screen border-2 border-primary rounded-2 p-4 sm:max-w-sm sm:right-6 md:max-w-md 3xl:max-w-2xl"
    >
      <DeinExpert />
    </div>
  </div>
{/if}
