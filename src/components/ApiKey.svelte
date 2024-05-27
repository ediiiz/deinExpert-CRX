<script lang="ts">
    import { fade } from "svelte/transition";
    export let apiKey: string;
    export let handleSubmit: (event: Event) => void;
</script>

<div
    transition:fade={{ duration: 500 }}
    class="p-4 grid justify-center items-center text-center bg-red rounded-2 gap-4">
    <p class="">Der hinterlegte API-Schlüssel ist falsch oder fehlt.</p>
    <a
        class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
        href="https://dein.Expert/user"
        target="_blank"
        >Melde dich bitte an und generiere unter Konto einen neuen API-Schlüssel
    </a>
    <form on:submit={handleSubmit} class="flex flex-row gap-4">
        <input
            bind:value={apiKey}
            class="p-4 rounded-2 shadow-dark shadow-2xl w-full"
            type="text"
        />
        <button
            type="submit"
            class="p-4 bg-dark rounded-2 shadow-dark shadow-2xl text-white"
            >Speichern
        </button>
    </form>
</div>
