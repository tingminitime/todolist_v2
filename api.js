// ----- Todolist 存取 api -----
// base link
export const taskRequest = axios.create({
  baseURL: 'https://guarded-hamlet-24255.herokuapp.com/'
})

// get data
export const apiTaskRequest = () => taskRequest.get('/todo7')
// post data
export const apiTaskAdd = data => taskRequest.post('/todo7', data)
// patch data
export const apiTaskUpdate = (id, data) => taskRequest.patch(`/todo7/${id}`, data)
// delete data
export const apiTaskDelete = id => taskRequest.delete(`/todo7/${id}`)
// clear multiple data