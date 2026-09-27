import { ref } from 'vue'

const selectedSort = ref('Hot')

export function getHotnessScore(item: any): number {
  if (!item) return 0
  
  const type = item.type || item.post_type || 'post'
  
  const comments = Number(item.comment_count) || 0
  const votes = Number(item.vote_count) || Number(item.likes_count) || Number(item.upvotes) || 0
  const rating = Number(item.author?.score) || Number(item.organizer?.score) || 0
  const fulfillment = Number(item.fulfillment_percent) || 0
  const followers = Number(item.followers_count) || 0
  
  let score = 0
  
  if (type === 'event') {
    // Events: Prioritize followers (people notified), fulfillment, and give mild rating boost
    score += (followers * 5)
    score += (fulfillment * 0.3) // Max 30 for 100%
    score += (rating * 2) // Max 10 for 5-star
  } else if (type === 'marketplace') {
    // Marketplace: Don't overpower. Mild rating, maybe votes if they have them.
    score += (votes * 1.5)
    score += (rating * 2.5) // Max 12.5 points from rating alone so it doesn't flood feed
  } else {
    // Posts / Cause Requests: Comments, Upvotes, and Fulfillment
    score += (comments * 2)
    score += (votes * 1.5)
    score += (fulfillment * 0.3)
    score += (rating * 2)
  }
  
  // Recent posts get a baseline boost so old 100% filled things aren't glued to the top forever
  const createdDate = new Date(item.created_at || item.schedule || 0).getTime()
  const daysOld = Math.max(0, (Date.now() - createdDate) / (1000 * 60 * 60 * 24))
  const recencyBoost = Math.max(0, 15 - daysOld) // Up to 15 points if brand new

  return score + recencyBoost
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
