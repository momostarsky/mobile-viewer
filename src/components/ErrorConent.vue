<script setup lang="ts">

defineProps<{ error_info: string }>()
</script>

<template>
  <h1>{{ error_info }}</h1>
</template>

<style scoped>

</style>