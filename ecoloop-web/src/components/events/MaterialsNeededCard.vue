<script setup lang="ts">
import MaterialRow from './MaterialRow.vue'

const materials = [
  {
    name: 'Reclaimed Wood Planks',
    description: 'For the frame, benches, and shelving',
    current: 87,
    target: 120,
    unit: 'planks',
    image: 'https://placehold.co/80x80'
  },
  {
    name: 'Glass Bottles',
    description: 'For the bottle wall and decorative accents',
    current: 210,
    target: 500,
    unit: 'bottles',
    image: 'https://placehold.co/80x80'
  },
  {
    name: 'Wooden Pallets',
    description: 'For decking, planters, and base layers',
    current: 32,
    target: 40,
    unit: 'pallets',
    image: 'https://placehold.co/80x80'
  },
  {
    name: 'Metal Pipes',
    description: 'For structural supports and irrigation',
    current: 18,
    target: 30,
    unit: 'pipes',
    image: 'https://placehold.co/80x80'
  },
  {
    name: 'Old Tires',
    description: 'For planters and garden seating',
    current: 9,
    target: 12,
    unit: 'tires',
    image: 'https://placehold.co/80x80'
  }
]

function donate(material: typeof materials[number]) {
  console.log('Donate:', material.name)
}
</script>

<template>
  <section class="materials-card">

    <div class="section-heading">
      <h2>Materials Needed</h2>

      <p>
        We're collecting materials for the pavilion structure, walls,
        and details. Every donation helps us build faster.
      </p>
    </div>

    <div class="materials-grid">

      <MaterialRow
        v-for="material in materials"
        :key="material.name"
        :material="material"
        @donate="donate(material)"
      />

    </div>

  </section>
</template>

<style scoped>
.materials-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* Fallback to single column on mobile screens */
@media (max-width: 640px) {
  .materials-grid {
    grid-template-columns: 1fr;
  }
}
</style>
