<script lang="ts">
  import { fade, fly, slide } from 'svelte/transition';
  import DeinExpert from './deinExpert.svelte';

  function switchModal() {
    state == 'open' ? (state = 'close') : (state = 'open');
  }
  type modalState = 'open' | 'close';
  let state: modalState = 'close';
</script>

{#if window.location.pathname.startsWith('/shop') && state == 'close'}
  <div transition:fade class="fixed bottom-4 left-0 z-9999 text-white w-screen">
    <div class="flex place-content-center">
      <button class="bg-gray-400 p-2 rounded-2 border-2" on:click={switchModal}>
        <div class="i-noto-man-detective-medium-light-skin-tone text-5xl" />
      </button>
    </div>
  </div>
{/if}

{#if state == 'open'}
  <div transition:fade>
    <div
      class="fixed top-24 right-0 z-9999 bg-gray-200 text-black rounded-2 h-500px w-screen p-4 sm:max-w-sm sm:right-6 md:max-w-md 3xl:max-w-2xl"
    >
      <div class="flex place-content-end pb-4">
        <button class="i-ion-close-sharp text-3xl text-gray-400" on:click={switchModal} />
      </div>
      <DeinExpert />
    </div>
  </div>
{/if}
