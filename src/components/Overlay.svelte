<script lang="ts">
  import { fade, fly, slide } from 'svelte/transition';
  import DeinExpert from './deinExpert.svelte';
  import { onMount } from 'svelte';

  console.log(window.location.pathname);

  function switchModal() {
    state == 'open' ? (state = 'close') : (state = 'open');
  }
  type modalState = 'open' | 'close';
  let state: modalState = 'close';

  function setCookieFromUrlParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const branchId = urlParams.get('branch_id');

    if (branchId) {
      // Call the function to set the cookie
      setCookie('fmarktcookie', branchId, 7); // Set cookie for 7 days
    }
  }

  function setCookie(name, value, daysToLive) {
    // Encode value in order to escape semicolons, commas, and whitespace
    const cookieValue = encodeURIComponent(value);

    // Set a far future expiry date if daysToLive is not provided
    let expires = '';
    if (daysToLive) {
      const date = new Date();
      date.setTime(date.getTime() + daysToLive * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }

    document.cookie = name + '=' + cookieValue + expires + '; path=/';
  }

  function removeUrlParametersAndReload() {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Flags to check if parameters exist
    let isCampaignPresent = params.has('campaign');
    let isCampaignIdPresent = params.has('campaignid');
    let isDtCowlPresent = params.has('dt_cowl');
    let isAwcPresent = params.has('awc');

    // Remove parameters if they exist
    if (isCampaignPresent) params.delete('campaign');
    if (isCampaignIdPresent) params.delete('campaignid');
    if (isDtCowlPresent) params.delete('dt_cowl');
    if (isAwcPresent) params.delete('awc');

    // If any of the parameters were present, reload the page without them
    if (isCampaignPresent || isCampaignIdPresent || isDtCowlPresent || isAwcPresent) {
      // Update the URL without reloading the page
      window.history.replaceState({}, '', url.toString());

      // Reload the page for the changes to take effect
      window.location.reload();
    }
  }

  // Call the function to remove the parameters and reload
  onMount(() => {
    setCookieFromUrlParam();
    removeUrlParametersAndReload();
  });
</script>

{#if window.location.pathname.startsWith('/shop/unsere-produkte') && state == 'close'}
  <div transition:fade class="fixed bottom-4 left-0 z-9999 text-white w-screen">
    <div class="flex place-content-center">
      <button
        class="bg-gray-600 p-2 rounded-2 animate-swing animate-delay-1000 animate-count-2 hover:animate-none"
        on:click={switchModal}
      >
        <div class="i-noto-man-detective-medium-light-skin-tone text-5xl" />
      </button>
    </div>
  </div>
{/if}

{#if state == 'open'}
  <div transition:fade>
    <div
      id="Overlay"
      class="fixed top-24 right-0 z-9999 bg-gray-200 text-black rounded-2 h-500px w-screen p-4 sm:max-w-sm sm:right-6 md:max-w-md 3xl:max-w-2xl"
    >
      <div class="flex place-content-between pb-4">
        <div class="relative font-bold text-xl text-gray-500 top-0.5">deinExpert</div>
        <button class="i-ion-close-sharp text-3xl text-gray-400" on:click={switchModal} />
      </div>
      <DeinExpert />
    </div>
  </div>
{/if}

