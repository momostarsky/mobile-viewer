// src/stores/studyStore.ts
import { defineStore } from 'pinia'

export const useStudyStore = defineStore('study', {
  state: () => ({
    studyMetadata: null as any,
    studyUid: '' as string,
    loading: false as boolean,
    error: '' as string
  }),

  getters: {
    hasStudyData: (state) => !!state.studyMetadata && !!state.studyUid
  },

  actions: {
    setStudyData(metadata: any, uid: string) {
      this.studyMetadata = metadata;
      this.studyUid = uid;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    setError(error: string) {
      this.error = error;
    }
  }
})
