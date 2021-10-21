// ----- Todolist 存取 api -----
export const taskRequest = axios.create({
  baseURL: 'https://guarded-hamlet-24255.herokuapp.com/'
})

export const apiTaskRequest = () => taskRequest.get('/todo6')

export const apiTaskAdd = data => taskRequest.post('/todo6', data)

export const apiTaskUpdate = (id, data) => taskRequest.patch(`/todo6/${id}`, data)

export const apiTaskDelete = id => taskRequest.delete(`/todo6/${id}`)