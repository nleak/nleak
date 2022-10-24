const express = require('express');
const bodyParser = require('body-parser');

const NoteManager = require('./notes');

class TestTargetState {
  constructor() {
    this.noteManager = new NoteManager();
    this.iterations = 8;
    const noteManager = this.noteManager;
    this.loop = [{
      name: "add note",
      check: function (args) {
        return { synced: true }
      },
      next: function (args) {
        const noteId = noteManager.addNote("test note content");
        return { noteId };
      }
    }, {
      name: "get note",
      check: function (args) {
        return { synced: true }
      },
      next: function (args) {
        const note = noteManager.getNote(args.noteId);
        return { note };
      }
    }, {
      name: "delete note",
      check: function (args) {
        return { synced: true }
      },
      next: function (args) {
        noteManager.deleteNote(args.noteId);
      }
    }]
  }
}

const testTargetState = new TestTargetState();

const app = express();
const port = 6701;
app.use(bodyParser.json());

app.use(bodyParser.json());

app.get("/loop/steps", (request, response) => {
  response.json({ steps: testTargetState.loop.length });
});

app.get("/loop/iterations", (request, response) => {
  response.json({ iterations: testTargetState.iterations });
});

app.post("/loop/:stepIndex/:operationName", (request, response) => {
  if (request.params.operationName === "check") {
    response.json(testTargetState.loop[parseInt(request.params.stepIndex)].check(request.body.args));
  } else if (request.params.operationName === "next") {
    response.json(testTargetState.loop[parseInt(request.params.stepIndex)].next(request.body.args));
  } else {
    response.status(404).send();
  }
});

app.listen(port, () => {
  console.log(`nleak wrapper port listening at http://localhost:${port}`);
});
