<script lang="ts">
	import { invoke } from '@tauri-apps/api/core';

	interface HelloWorldResponse {
		message: string;
		timestamp: number;
	}

	let message = $state('Click the button to test Tauri integration');
	let loading = $state(false);

	async function greet() {
		loading = true;
		try {
			const response = await invoke<HelloWorldResponse>('hello_world');
			message = response.message;
			console.log('Response from Rust:', response);
		} catch (error) {
			message = `Error: ${error}`;
			console.error('Error calling Rust command:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="container">
	<h1>Welcome to Runi</h1>
	<p>{message}</p>
	<button onclick={greet} disabled={loading} aria-label="Test Tauri integration">
		{loading ? 'Loading...' : 'Test Tauri Command'}
	</button>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.2rem;
		margin-bottom: 2rem;
		color: #666;
	}

	button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}
</style>
