const uuid = require('uuid');

class NoteManager {
  constructor() {
    this.notes = {};
  }

  addNote(noteContent) {
    const noteId = uuid.v4();
    this.notes[noteId] = noteContent;
    return noteId;
  }

  getNote(noteId) {
    return this.notes[noteId];
  }

  getNotes() {
    return this.notes;
  }

  deleteNote(noteId) {
    delete this.notes[noteId];
  }
}

module.exports = NoteManager;
