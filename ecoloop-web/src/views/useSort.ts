import { ref } from 'vue'

const selectedSort = ref('Hot')

export function useSort() {
  function setSort(sort: string) {
    selectedSort.value = sort
  }

  return {
    selectedSort,
    setSort,
  }
}
