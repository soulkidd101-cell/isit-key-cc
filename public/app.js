
const API_URL = 'https://week8.test/api/notes'

const noteForm = document.querySelector('#note-form')
const noteBody = document.querySelector('#note-body')
const notesList = document.querySelector('#notes-list')
const statusMessage = document.querySelector('#status-message')

// Retrieve notes
async function loadNotes() {
  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error('Failed to retrieve notes')
    }

    const data = await response.json()

    // Sort by created_at, newest first
    const notes = data.notes.sort((a, b) => {
      const dateA = Date.parse(a.created_at.replace(' ', 'T') + 'Z')
      const dateB = Date.parse(b.created_at.replace(' ', 'T') + 'Z')

      return dateB - dateA || b.id - a.id
    })

    displayNotes(notes)

  } catch (error) {
    statusMessage.textContent = 'Unable to load notes.'
    console.error(error)
  }
}

// Display notes
function displayNotes(notes) {
  notesList.replaceChildren()

  if (notes.length === 0) {
    const emptyMessage = document.createElement('p')
    emptyMessage.className = 'empty-state'
    emptyMessage.textContent = 'No notes yet. Add your first note above!'

    notesList.appendChild(emptyMessage)
    return
  }

  notes.forEach(note => {
    const card = document.createElement('article')
    card.className = 'note-card'

    const body = document.createElement('p')
    body.textContent = note.body

    const date = document.createElement('span')
    date.className = 'note-date'
    date.textContent = note.created_at

    const deleteButton = document.createElement('button')
    deleteButton.className = 'delete-button'
    deleteButton.textContent = 'Delete'

    deleteButton.addEventListener('click', () => {
      deleteNote(note.id)
    })

    card.appendChild(body)
    card.appendChild(date)
    card.appendChild(deleteButton)

    notesList.appendChild(card)
  })
}

// Create notes
noteForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const body = noteBody.value.trim()

  if (!body) {
    statusMessage.textContent = 'Please enter a note.'
    return
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ body })
    })

    if (!response.ok) {
      throw new Error('Failed to create note')
    }

    noteForm.reset()
    statusMessage.textContent = 'Note created successfully!'

    await loadNotes()

  } catch (error) {
    statusMessage.textContent = 'Unable to create note.'
    console.error(error)
  }
})

// Delete notes
async function deleteNote(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete note')
    }

    statusMessage.textContent = 'Note deleted successfully!'

    await loadNotes()

  } catch (error) {
    statusMessage.textContent = 'Unable to delete note.'
    console.error(error)
  }
}

// Load notes when the page opens
loadNotes()
