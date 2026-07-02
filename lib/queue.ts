export type QueueState = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface QueueTask {
  id: string
  type: 'ats' | 'jd' | 'enhance' | 'builder' | 'copilot'
  status: QueueState
  payload: any
  result?: any
  error?: string
  progress: number // 0 to 100
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'buggedbrain_task_queue'

export function getQueue(): QueueTask[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveQueue(queue: QueueTask[]) {
  if (typeof window === 'undefined') return
  
  // 1. Strip large base64 fileData from COMPLETED or FAILED tasks to reclaim space
  const cleanedQueue = queue.map(task => {
    if ((task.status === 'COMPLETED' || task.status === 'FAILED') && task.payload) {
      const { fileData, ...restPayload } = task.payload
      return {
        ...task,
        payload: restPayload
      }
    }
    return task
  })

  // 2. Keep only the 5 most recent tasks to prevent infinite storage growth
  const prunedQueue = cleanedQueue
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prunedQueue))
  } catch (err) {
    console.warn("Storage quota exceeded, purging completed/failed tasks from queue", err)
    // Emergency fallback: keep only active PENDING or PROCESSING tasks
    const emergencyQueue = cleanedQueue.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING')
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emergencyQueue))
    } catch (criticalErr) {
      console.error("Critical storage quota failure:", criticalErr)
      localStorage.removeItem(STORAGE_KEY)
    }
  }
}

export function enqueueTask(
  type: QueueTask['type'],
  payload: any
): QueueTask {
  const newTask: QueueTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    type,
    status: 'PENDING',
    payload,
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const queue = getQueue()
  queue.push(newTask)
  saveQueue(queue)

  // Trigger task processing trigger event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bb_task_queued'))
  }

  return newTask
}

export function updateTask(taskId: string, updates: Partial<QueueTask>) {
  const queue = getQueue()
  const idx = queue.findIndex((t) => t.id === taskId)
  if (idx === -1) return

  queue[idx] = {
    ...queue[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveQueue(queue)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bb_task_updated', { detail: queue[idx] }))
  }
}

// Global active worker state to prevent parallel processing leaks
let isWorkerActive = false

export async function startWorker() {
  if (isWorkerActive) return
  isWorkerActive = true

  try {
    let queue = getQueue()
    let pendingTask = queue.find((t) => t.status === 'PENDING')

    while (pendingTask) {
      await processTask(pendingTask)
      queue = getQueue()
      pendingTask = queue.find((t) => t.status === 'PENDING')
    }
  } finally {
    isWorkerActive = false
  }
}

async function processTask(task: QueueTask) {
  updateTask(task.id, { status: 'PROCESSING', progress: 10 })

  // Simulation steps timer to show smooth micro-animations in the UI
  let progress = 10
  const progressTimer = setInterval(() => {
    if (progress < 90) {
      progress += Math.floor(Math.random() * 8) + 2
      updateTask(task.id, { progress: Math.min(progress, 90) })
    }
  }, 1000)

  try {
    let response: Response
    const headers: Record<string, string> = {}
    
    // Retrieve custom user headers if available in localStorage
    if (typeof window !== 'undefined') {
      const apiKey = localStorage.getItem('user_gemini_api_key')
      if (apiKey) {
        headers['x-gemini-api-key'] = apiKey
      }
    }

    if (task.type === 'ats') {
      const fd = new FormData()
      if (task.payload.fileData) {
        // Reconstruct File from base64 if needed, but payload holds files/text directly
        const fileObj = await base64ToFile(
          task.payload.fileData,
          task.payload.fileName,
          task.payload.fileType
        )
        fd.append('file', fileObj)
      } else {
        fd.append('text', task.payload.text || '')
      }
      if (task.payload.targetRole) {
        fd.append('targetRole', task.payload.targetRole)
      }

      response = await fetch('/api/resume/evaluate', {
        method: 'POST',
        body: fd,
        headers,
      })
    } else if (task.type === 'jd') {
      const fd = new FormData()
      if (task.payload.fileData) {
        const fileObj = await base64ToFile(
          task.payload.fileData,
          task.payload.fileName,
          task.payload.fileType
        )
        fd.append('file', fileObj)
      } else {
        fd.append('resumeText', task.payload.resumeText || '')
      }
      fd.append('jdText', task.payload.jdText || '')
      fd.append('targetRole', task.payload.targetRole || '')

      response = await fetch('/api/resume/jd-match', {
        method: 'POST',
        body: fd,
        headers,
      })
    } else if (task.type === 'enhance') {
      response = await fetch('/api/resume/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(task.payload),
      })
    } else if (task.type === 'builder') {
      response = await fetch('/api/resume/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(task.payload),
      })
    } else if (task.type === 'copilot') {
      response = await fetch('/api/placement/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(task.payload),
      })
    } else {
      throw new Error(`Unsupported task type: ${task.type}`)
    }

    clearInterval(progressTimer)

    const result = await response.json()
    if (!response.ok || result.success === false) {
      throw new Error(result.message || result.error || 'Request processing failed.')
    }

    updateTask(task.id, {
      status: 'COMPLETED',
      progress: 100,
      result: result.data || result,
    })
  } catch (err: any) {
    clearInterval(progressTimer)
    updateTask(task.id, {
      status: 'FAILED',
      progress: 100,
      error: err?.message || 'Unexpected task queue failure.',
    })
  }
}

// Utility to serialize files to base64 for localstorage storage
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Utility to convert base64 back to native browser File objects
async function base64ToFile(
  base64String: string,
  fileName: string,
  mimeType: string
): Promise<File> {
  const res = await fetch(base64String)
  const blob = await res.blob()
  return new File([blob], fileName, { type: mimeType })
}
