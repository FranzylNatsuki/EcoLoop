import { ref } from 'vue'

const selectedSort = ref('Hot')

export function getHotnessScore(item: any): number {
  if (!item) return 0
  
  const comments = Number(item.comment_count) || 0
  const votes = Number(item.vote_count) || Number(item.likes_count) || Number(item.upvotes) || 0
  const rating = Number(item.author?.score) || Number(item.organizer?.score) || 0
  const fulfillment = Number(item.fulfillment_percent) || 0
  
  // Weights to balance different metrics across post types
  return (comments * 2) + (votes * 1.5) + (rating * 5) + (fulfillment * 0.5)
}

export function useSort() {
  function setSort(sort: string) {
    selectedSort.value = sort
  }

  return {
    selectedSort,
    setSort,
    getHotnessScore
  }
}
