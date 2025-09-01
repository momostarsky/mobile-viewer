<script setup lang="ts">

defineProps<{ error_info: string }>()
</script>

<template>
  <div class="error-content">
    <h2>Error</h2>
    <p>{{ error_info }}</p>
  </div>
</template>

