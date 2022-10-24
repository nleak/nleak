const express = require('express');
const bodyParser = require('body-parser');
const NoteManager = require('./notes');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const noteManager = new NoteManager();

app.get('/notes', (req, res) => {
  res.json(noteManager.getNotes());
});

app.post('/notes', (req, res) => {
  const noteId = noteManager.addNote(req.body.noteContent);
  res.json({ noteId });
});

app.get('/notes/:noteId', (req, res) => {
  const note = noteManager.getNote(req.params.noteId);
  if (note) {
    res.json(note);
  } else {
    res.status(404).send();
  }
});

app.delete('/notes/:noteId', (req, res) => {
  noteManager.deleteNote(req.params.noteId);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
