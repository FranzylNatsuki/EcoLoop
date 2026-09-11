<script setup lang="ts">

defineProps<{
  material: {
    name: string
    description: string
    current: number
    target: number
    unit: string
    image: string
  }
}>()

defineEmits<{
  donate: []
}>()

</script>

<template>
  <div class="material-row">

    <div class="material-header">

      <img
        :src="material.image"
        :alt="material.name"
        class="material-photo"
      />

      <div class="material-info">
        <h3>{{ material.name }}</h3>
        <p>{{ material.description }}</p>
      </div>

      <button
        class="donate-button"
        @click="$emit('donate')"
      >
        Donate
      </button>

    </div>

    <div class="material-progress-row">

      <span>
        {{ material.current }} of {{ material.target }}
        {{ material.unit }}
      </span>

      <span>
        {{ Math.round((material.current / material.target) * 100) }}%
      </span>

    </div>

    <div class="material-progress-track">
      <div
        class="material-progress-fill"
        :style="{
          width: `${Math.min(
            (material.current / material.target) * 100,
            100
          )}%`
        }"
      />
    </div>

  </div>
</template>
