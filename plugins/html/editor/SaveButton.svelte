<script>
  let saving = false
  let message = ""

  async function save() {
    saving = true
    message = ""
    const filePath = `${Date.now()}.txt`

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "file",
          filePath,
          data: `Saved from ${window.location.pathname} at ${new Date().toISOString()}`
        })
      })

      const body = await response.json()
      message = response.ok ? `Saved ${body.path}` : `Error: ${body.error}`
    } catch (error) {
      message = `Error: ${error.message}`
    }

    saving = false
  }
</script>

<div class="vowel-save-widget">
  <button onclick={save} disabled={saving}>
    {saving ? "Saving…" : "Save timestamped file"}
  </button>
  {#if message}<span class="vowel-save-message">{message}</span>{/if}
</div>

<style>
  .vowel-save-widget {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    background: white;
    color: #111;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
  }

  button {
    cursor: pointer;
    border: 1px solid #888;
    border-radius: 6px;
    background: #f5f5f5;
    padding: 4px 10px;
    font: inherit;
  }

  button:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .vowel-save-message {
    max-width: 220px;
    overflow-wrap: break-word;
  }
</style>
