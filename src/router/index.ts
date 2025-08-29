// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import MainContent from '../components/MainContent.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: MainContent,
    props: { msg: 'Vite + Vue' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
