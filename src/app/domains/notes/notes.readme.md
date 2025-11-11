This is a simple note taking CRUD app.

The user can add notes by clicking the "Add Note" button and entering the note content in the text area. The notes are displayed in a list below the text area. Each note has a delete button that allows the user to remove the note from the list. And each note has an edit button that allows the user to edit the note.

Upon page load, the PRESENTATION Layer (notes.component.ts) calls the SERVICE Layer (notes.service.ts) to retrieve all notes from the database and displays them on the page. The SERVICE Layer interacts with the DATA Layer (notes.repository.ts) to handle data persistence and retrieval. A note is defined by the note.model.ts interface.

Starting in each layer:
- In the DATA Layer (notes.repository.ts) we have 2 methods: getAll() and saveAll(). The getAll() method retrieves all notes from the database and returns them as an array of Note objects. The saveAll() method takes an array of Note objects as input and saves them to the database. Both methods GET or POST the entire array. This is fine for this example, however it would be idea to add in getById and saveById for more efficiency.
- In the SERVICE Layer (notes.service.ts) we have 4 methods: getNotes(), add(note), update(note), and delete(id). The getNotes() method retrieves all notes from the repository and returns them as an array of Note objects. The add(note) method adds a new note to the repository by taking the existing array of objects and appending the new note to the end then saving the entire array. The update(note) method updates an existing note in the repository by filtering the existing array for the note we are updating, updating that item in the array, and then saving the entire array. The delete(id) method deletes a note from the repository based on its ID by filtering out the note with the matching ID and saving the updated array.
- In the PRESENTATION Layer (notes.component.ts) we have 6 methods: ngOnInit() which calls loadNotes() to load all notes from the service and display them on the page. The loadNotes() method calls the service's getNotes() method to retrieve all notes and assigns them to the notes array. The addOrUpdate() method checks if there is an editing note, if so it updates the note, otherwise it adds a new note. The deleteNote() method deletes a note from the service by calling the service's delete(id) method. The editNote() method sets the editing note to the note being edited. The cancelEdit() method clears the editing note.

Key Features of this currently:
- Utilizes local storage with a single key array
- Single page with index.html emitting app.component.ts which emits notes.component.ts which displays notes.component.html

Next Steps:
- Add in a lastUpdated field in addition to createdDate so track when a note was last updated with edits.
-- Done
- Add in a softdelete instead of hard delete so that it will still display in the presentation layer but be visually distinct.
-- Done
- Investigate bloated component
-- Moved substantial business/data logic from notes.component.ts to notes.service.ts
-- Done
- Add in a note count metric card that auto updates and this may be accomplished with RxJS interval/or signals.
-- Done
- Add in layout app-shell
-- Done
- Investigate adding in a STATE layer between PRESENTATION and SERVICE. Technically with our SIZE of this single use application, leveraging our current notesState.service.ts is best practice. Updated layers to leverage the stateservice, when user lands on the notes.component.ts page it does the inital GETALL() load and push into state service.
-- Done
- Added in Active Notes and Deleted Notes (Soft) metrics into component via state service. Next step is to look at "filtering" the list itself
-- Done
- Add in Date Utils to format Date/DateTime to standard
-- Done
- Next migrate RxJS Observables to SIGNALS for future proofing
-- Done
- Next look at incorporating a search bar


Layers Updated Version
----
notes.component.ts <-> notes.service.ts
- CRUD
notes.component.ts <-- notesState.service.ts
- pulls in SIGNALS from state
----
notes.service.ts <-> notesState.service.ts
- updates SIGNALS
notes.service.ts <-> notes.repository.ts
----
notes.repository.ts <-> date-formatter.util.ts
- date sets standard on GET ALL