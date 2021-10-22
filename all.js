import { apiTaskRequest, apiTaskAdd, apiTaskUpdate, apiTaskDelete } from "./api.js";

// ----- 變數 -----
const taskInput = document.querySelector('.input__taskInput')
const addBtn = document.querySelector('.input__add')

const clearAllCompletedTaskBtn = document.querySelector('.clearAllCompletedTask__btn')

const statusFilter = document.querySelector('.statusFilter')
const filters = document.querySelectorAll('.filter__changeStatus')
const filterAll = document.querySelector('.filter__changeStatus-all')
const filterSelectBlock = document.querySelector('.filter__selectBlock')

const filterAllCount = document.querySelector('.filter__allTaskCount')
const filterUncompletedCount = document.querySelector('.filter__uncompletedTaskCount')
const filterCompletedCount = document.querySelector('.filter__completedTaskCount')

const taskList = document.querySelector('.taskList')

let localData = [] // 全部資料
let taskObj = {}
let completedTaskData = [] // 已完成資料
let uncompletedTaskData = [] // 未完成資料
let editMode = false // 是否在編輯模式
let editBlock = null // editBlock 選取暫存器
let prevEditBlock = null // 上一個 editBlock 暫存器
let editInput = null // editInput 選取暫存器
let currentTaskText = null // 待辦事項文字 id 暫存器
let checkInput = null // checkInput 選取暫存器
let filterStatus = 'all' // 篩選狀態 all / uncompleted / completed

// ----- HTML載入完畢預設執行 -----
window.onload = function () {
  // 預設待辦事項 focus
  taskInput.focus()
}

// ----- filterSelectBlock 初始化 -----
setTimeout(() => {
  filterSelectBlockInit()
  window.addEventListener('resize', filterSelectBlockInit, false)
}, 200)

// ----- 篩選文字顏色初始化 -----
if (filterStatus === 'all') filterAll.classList.add('active')

// ----- 產生ID -----
function generateId() {
  let nowTime = Date.now()
  let timestamp = Math.floor(nowTime / 100)
  return timestamp
}

// ----- API抓資料 - 渲染(初始化)待辦事項 -----
apiTaskRequest()
  .then(res => {
    localData = res.data
    render(localData)
    updateUncompletedTaskData()
    updateCompletedTaskData()
    changeTaskCount()
  })
  .catch(err => console.error(err))

function render(localData) {
  let renderData = ''
  localData.forEach(item => {
    let newContent = `
      <li class="taskList__item">
        <div class="taskList__itemReveal">
          <label class="taskList__label">
            <input
              class="taskList__checkbox"
              type="checkbox"
              data-checkInputId="${item['id']}"
              data-id="${item['id']}"
              ${item['isCompleted'] ? "checked" : ""}
            >
            <span class="taskList__text ${item['isCompleted'] ? 'taskChecked' : ''}" data-taskTextId="${item['id']}">${item['content']}</span>
          </label>
          <button
            class="taskList__editBtn"
            data-id="${item['id']}"
          >編輯</button>
          <button class="taskList__deleteBtn" data-id="${item['id']}">刪除</button>
        </div>
        <div class="taskList__itemEdit" data-editId="${item['id']}">
          <input
            type="text"
            class="taskList__editInput"
            data-editInputId="${item['id']}"
            data-id="${item['id']}"
          >
          <div class="taskList__editControl">
            <button class="taskList__confirmBtn" data-id="${item['id']}">確定</button>
            <span> | </span>
            <button class="taskList__cancelBtn" data-id="${item['id']}">取消</button>
          </div>
        </div>
      </li>
    `
    renderData += newContent
  })
  taskList.innerHTML = renderData
}

// ----- 新增待辦事項 -----
function addTask(e) {
  // 若無輸入任何東西按新增 => 警告視窗並 focus
  if (taskInput.value.trim() === '') {
    alert('請輸入待辦事項')
    taskInput.focus()
    return
  }
  // 將要新增的 Task 包裝成物件
  taskObj = {
    content: taskInput.value,
    isCompleted: false,
    id: generateId()
  }
  // data 新增 Task 物件
  localData.push(taskObj)
  // 更新待完成、未完成的 data 資料
  updateUncompletedTaskData()
  updateCompletedTaskData()
  // 渲染
  rerenderHandler()
  // 改變 filter 上的 task count
  changeTaskCount()
  // taskInput 清空並 focus
  taskInput.value = ''
  taskInput.focus()
  // api 更新資料
  apiTaskAddHandler()
  console.log(localData)
}

// api 更新資料
function apiTaskAddHandler() {
  apiTaskAdd(taskObj)
    .then(res => {
      console.log('成功寫入資料', res.data)
    })
    .catch(err => console.error('寫入失敗', err))
}

// ----- 編輯待辦事項 -----
function editTaskHandler(e) {
  // 區域變數
  let targetId = e.target.dataset.id
  let targetClass = e.target.className
  // 選取到當下點擊的 editBlock
  editBlock = document.querySelector(`div[data-editId="${e.target.dataset.id}"]`)
  // 如果 editBlock 是 null，不執行編輯功能，避免 prevEditBlock 因為點擊其他地方被誤存
  if (editBlock === null) return
  // 點擊編輯按鈕 => 顯示/隱藏 編輯區塊
  editBtnHandler(targetClass, editBlock)
  // 點擊取消按鈕 => 隱藏 編輯區塊
  cancelEditBtnHandler(targetClass, editBlock)
  // 判斷選取到的 editBlock 有無 active 這個 class，editMode 為 true / false
  if (editBlock.classList.contains('active')) editMode = true
  else editMode = false
  // 將當前的 Task 文字帶入編輯的 input 並全選
  editInputAutoEmbed(e, targetId)
  // 確定編輯
  confirmEditBtnHandler(e, targetId, editBlock)
  // 使用 enter 按鍵確定編輯
  editEnterHandler()
}

// 點擊編輯按鈕 => 顯示/隱藏 編輯區塊
function editBtnHandler(targetClass, editBlock) {
  if (targetClass === 'taskList__editBtn') {
    editBlock.classList.toggle('active')
    // 點擊編輯後 => 隱藏 上一個編輯區塊
    if (prevEditBlock !== null && prevEditBlock !== editBlock) {
      prevEditBlock.classList.remove('active')
    }
    // 將當前的 編輯區塊儲存成 prevEditBlock
    prevEditBlock = editBlock
  }
}

// 將當前的 Task 文字帶入編輯的 input 並全選
function editInputAutoEmbed(e, targetId) {
  editInput = document.querySelector(`input[data-editInputId="${e.target.dataset.id}"]`)
  if (e.target.classList.contains('taskList__editBtn') && editInput) {
    localData.forEach(item => {
      if (parseInt(targetId) === item['id']) {
        editInput.value = item['content']
      }
    })
    editInput.select()
  }
}

// 點擊取消按鈕 => 隱藏 編輯區塊
function cancelEditBtnHandler(targetClass, editBlock) {
  if (targetClass === 'taskList__cancelBtn') {
    editBlock.classList.toggle('active')
    editMode = false
  }
}

// 點擊 確定編輯 按鈕
function confirmEditBtnHandler(e, targetId) {
  currentTaskText = document.querySelector(`span[data-taskTextId="${e.target.dataset.id}"]`)
  if (e.target.classList.contains('taskList__confirmBtn') && currentTaskText) {
    // 在 localData 找出與 targetId 符合的 id，並將編輯輸入的內容更新到 localData，以及將待辦事項渲染為編輯後的內容
    localData.forEach(item => {
      if (parseInt(targetId) === item['id']) {
        item['content'] = editInput.value
        currentTaskText.textContent = item['content']
      }
    })
    editInput.value = ''
    editBlock.classList.toggle('active')
    editMode = false
    apiUpdateTaskText(targetId)
  }
}

// 編輯待辦事項 => 更新 API 的 content
function apiUpdateTaskText(targetId) {
  apiTaskUpdate(targetId, {
    content: currentTaskText.textContent
  })
    .then(res => {
      console.log('成功更新待辦事項', res.data)
    })
    .catch(err => console.error('更新失敗', err))
}

// 若 editInput 存在、editMode 為 true，
// 則監聽 editInput 的 keyup 事件，否則移除監聽 editInput 的 keyup 事件
function editEnterHandler() {
  if (editInput && editMode) {
    editInput.addEventListener('keyup', editUseEnter, false)
  } else {
    editInput.removeEventListener('keyup', editUseEnter, false)
  }
}

// editInput 按 enter 確定編輯
function editUseEnter(e) {
  if (e.keyCode === 13) {
    localData.forEach(item => {
      if (parseInt(editInput.dataset.id) === item['id']) {
        item['content'] = editInput.value
        currentTaskText.textContent = item['content']
      }
    })
    editInput.value = ''
    editBlock.classList.toggle('active')
    editMode = false
    apiUpdateTaskText(e.target.dataset.id)
  }
}

// ----- check 完成代辦事項 -----
function taskStatusHandler(e) {
  if (!e.target.classList.contains('taskList__checkbox')) return
  checkInput = document.querySelector(`input[data-checkInputId="${e.target.dataset.id}"]`)
  changeTaskStatus()
  updateUncompletedTaskData()
  updateCompletedTaskData()
  rerenderHandler()
  changeTaskCount()
  // api patch
  let targetId = parseInt(checkInput.dataset.id)
  let status = {
    isCompleted: checkInput.checked ? true : false
  }
  apiChangeTaskStatus(targetId, status)
}

// 原始全部資料 => 切換 isCompleted 狀態
function changeTaskStatus() {
  localData.forEach(item => {
    if (parseInt(checkInput.dataset.id) === item.id) {
      if (checkInput.checked) item['isCompleted'] = true
      else item['isCompleted'] = false
    }
  })
}

// API 更新 isCompleted 狀態
function apiChangeTaskStatus(targetId, status) {
  // api patch
  apiTaskUpdate(targetId, status)
    .then(res => {
      console.log('成功寫入資料', res.data)
    })
    .catch(err => console.error('寫入失敗', err))
}

// 更新未完成資料 uncompletedTaskData 內容
function updateUncompletedTaskData() {
  uncompletedTaskData = localData.filter(item => item['isCompleted'] === false)
}

// 更新已完成資料 completedTaskData 內容
function updateCompletedTaskData() {
  completedTaskData = localData.filter(item => item['isCompleted'] === true)
}

// 更新篩選文字的計數 Count
function changeTaskCount() {
  filterAllCount.textContent = `(${localData.length})`
  filterUncompletedCount.textContent = `(${uncompletedTaskData.length})`
  filterCompletedCount.textContent = `(${completedTaskData.length})`
}

// ----- 篩選待辦事項 -----
function taskFilterHandler(e) {
  e.preventDefault()
  let target = e.target
  allTaskFilter(e)
  uncompletedTaskFilter(e)
  completedTaskFilter(e)
  filterSelectBlockHandler(target)
  filterTextColorChange(target)
}

// filterSelectBlock 初始化
function filterSelectBlockInit() {
  filterTextColorChange(filterAll)
  filterSelectBlock.style.width = `${filterAll.closest('.filter').getBoundingClientRect().width}px`
  filterSelectBlock.style.height = `${filterAll.closest('.filter').getBoundingClientRect().height}px`
  filterSelectBlock.style.left = `${filterAll.closest('.filter').offsetLeft}px`
  filterSelectBlock.style.top = `${filterAll.closest('.filter').offsetTop}px`
}

// 點擊 filterSelectBlock 移動效果
function filterSelectBlockHandler(target) {
  if (!target.closest('.filter')) return
  filterSelectBlock.style.width = `${target.closest('.filter').getBoundingClientRect().width}px`
  filterSelectBlock.style.height = `${target.closest('.filter').getBoundingClientRect().height}px`
  filterSelectBlock.style.left = `${target.closest('.filter').offsetLeft}px`
  filterSelectBlock.style.top = `${target.closest('.filter').offsetTop}px`
}

// 篩選文字顏色變換
function filterTextColorChange(target) {
  filters.forEach(item => {
    item.classList.remove('active')
  })
  target.closest('.filter .filter__changeStatus').classList.add('active')
}

// 點擊 全部 => 更新篩選狀態並重新渲染 data
function allTaskFilter(e) {
  if (e.target.classList.contains('filter__changeStatus-all') ||
    e.target.classList.contains('filter__allTaskCount')) {
    filterStatus = 'all'
    render(localData)
  }
}

// 點擊 待完成 => 更新篩選狀態並重新渲染 uncompletedTaskData
function uncompletedTaskFilter(e) {
  if (e.target.classList.contains('filter__changeStatus-uncompleted') ||
    e.target.classList.contains('filter__uncompletedTaskCount')) {
    filterStatus = 'uncompleted'
    render(uncompletedTaskData)
  }
}

// 點擊 完成 => 更新篩選狀態並重新渲染 completedTaskData
function completedTaskFilter(e) {
  if (e.target.classList.contains('filter__changeStatus-completed') ||
    e.target.classList.contains('filter__completedTaskCount')) {
    filterStatus = 'completed'
    render(completedTaskData)
  }
}

// 新增、刪除、check 待辦事項時 => 根據篩選狀態重新渲染
function rerenderHandler() {
  if (filterStatus === 'all') render(localData)
  if (filterStatus === 'uncompleted') render(uncompletedTaskData)
  if (filterStatus === 'completed') render(completedTaskData)
}

// ----- 刪除待辦事項 -----
// 是否確認刪除 ?
function deleteDoubleCheck(e) {
  if (!e.target.classList.contains('taskList__deleteBtn')) return
  let deleteDoubleCheck = confirm('確定刪除這一筆 ?')
  if (deleteDoubleCheck) deleteTask(e)
  else return
}

// 使用 target id 從原始資料找到目標 index => 刪除並根據篩選狀態重新渲染
function deleteTask(e) {
  let deleteTargetId = parseInt(e.target.dataset.id)
  let deleteIndex = localData.findIndex(item => {
    return item['id'] === deleteTargetId
  })
  localData.splice(deleteIndex, 1)
  updateUncompletedTaskData()
  updateCompletedTaskData()
  rerenderHandler()
  changeTaskCount()
  apiDeleteTask(deleteTargetId)
}

// API 刪除待辦事項
function apiDeleteTask(deleteTargetId) {
  apiTaskDelete(deleteTargetId)
    .then(res => {
      console.log(`成功刪除資料ID: ${deleteTargetId}`)
    })
    .catch(err => console.error('刪除失敗', err))
}

// ----- 清除全部已完成待辦事項 -----
// 檢查是否所有待辦事項都是未完成 false
function checkHaveCompletedTask() {
  let haveCompletedTask = localData.some(item => item['isCompleted'])
  if (!haveCompletedTask) alert('找不到「已完成」的待辦事項哦 !')
  else clearDoubleCheck()
}

// 是否確認清空 ?
function clearDoubleCheck() {
  let clearDoubleCheck = confirm('確定清空已完成待辦事項 ?')
  if (clearDoubleCheck) clearAllCompletedTask()
  else return
}

// 清空排程
function clearAllCompletedTask() {
  // 將 isCompleted 為 true 的待辦事項留住
  localData = localData.filter(item => item['isCompleted'] === false)
  updateUncompletedTaskData()
  updateCompletedTaskData()
  rerenderHandler()
  changeTaskCount()
  apiClearHandler()
}

// API 批量刪除已完成的待辦事項
function apiClearHandler() {
  // 先從 api get 資料
  apiTaskRequest()
    .then(res => {
      let apiData = res.data
      // 拿到資料後 => 找到 isCompleted 狀態為 true 的刪除
      apiClearAllCompletedTask(apiData)
    })
}

// API 批量刪除功能
function apiClearAllCompletedTask(apiData) {
  apiData.forEach(item => {
    if (item['isCompleted'] === true) {
      apiTaskDelete(item.id)
        .then(res => {
          console.log(
            `(批量刪除成功) ID: ${item.id}, Content:${item.content}`
          )
        })
        .catch(err => console.error('(批量刪除失敗)', err))
    }
  })
}

// ----- 監聽 -----
addBtn.addEventListener('click', addTask, false)
taskInput.addEventListener('keyup', function (e) {
  if (e.keyCode === 13) addTask()
}, false)
clearAllCompletedTaskBtn.addEventListener('click', checkHaveCompletedTask, false)
statusFilter.addEventListener('click', taskFilterHandler, false)
taskList.addEventListener('click', editTaskHandler, false)
taskList.addEventListener('click', taskStatusHandler, false)
taskList.addEventListener('click', deleteDoubleCheck, false)