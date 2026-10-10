
const SUPABASE_URL = "https://lqhbmekvxwutmytuvhok.supabase.co/rest/v1/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vADKtfs1ze_kiwXlWYSTnA_LLK3GhqD";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
async function checkLogin() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("../login.html");
        return false;
    }

    return true;
}

const STORAGE_KEY = "mobileDashboardQuickNotes_v1";

const newNoteButton = document.getElementById("newNote");
const saveNoteButton = document.getElementById("saveNote");
const deleteNoteButton = document.getElementById("deleteNote");
const searchInput = document.getElementById("noteSearch");
const savedNotesContainer = document.getElementById("savedNotes");
const titleInput = document.getElementById("noteTitle");
const contentInput = document.getElementById("quickNote");
const statusLabel = document.getElementById("noteStatus");
const characterCount = document.getElementById("characterCount");

let notes = [];
let activeNoteId = null;
let saveTimer = null;

function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function setStatus(message) {
    statusLabel.textContent = message;
}

function loadNotes() {
    try {
        const storedNotes = localStorage.getItem(STORAGE_KEY);

        if (storedNotes) {
            const parsedNotes = JSON.parse(storedNotes);

            if (Array.isArray(parsedNotes)) {
                notes = parsedNotes.filter(note =>
                    note &&
                    typeof note.id === "string" &&
                    typeof note.title === "string" &&
                    typeof note.content === "string"
                );
            }
        }
    } catch (error) {
        console.error("Could not load notes:", error);
        setStatus("Could not load saved notes");
    }
}

function writeNotes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        return true;
    } catch (error) {
        console.error("Could not save notes:", error);
        setStatus("Save failed — check browser storage");
        return false;
    }
}

function getActiveNote() {
    return notes.find(note => note.id === activeNoteId);
}

function updateCharacterCount() {
    const count = contentInput.value.length;
    characterCount.textContent =
        `${count} character${count === 1 ? "" : "s"}`;
}

function formatDate(timestamp) {
    if (!timestamp) return "Not saved yet";

    return new Date(timestamp).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function updateNoteFromEditor() {
    const note = getActiveNote();
    if (!note) return;

    note.title = titleInput.value.trim();
    note.content = contentInput.value;
    note.updatedAt = Date.now();
}

function saveActiveNote(showMessage = true) {
    clearTimeout(saveTimer);

    if (!activeNoteId) return;

    updateNoteFromEditor();

    if (writeNotes()) {
        renderNotes();

        if (showMessage) {
            setStatus("Saved");
        }
    }
}

function scheduleAutoSave() {
    updateCharacterCount();
    setStatus("Saving…");

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveActiveNote(false);

        if (getActiveNote()) {
            setStatus("Auto-saved");
        }
    }, 400);
}

function createNote() {
    clearTimeout(saveTimer);

    if (activeNoteId) {
        saveActiveNote(false);
    }

    const note = {
        id: createId(),
        title: "",
        content: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    notes.unshift(note);
    activeNoteId = note.id;

    if (!writeNotes()) {
        notes = notes.filter(item => item.id !== note.id);
        activeNoteId = notes[0]?.id ?? null;
        renderNotes();
        openNote(activeNoteId);
        return;
    }

    openNote(note.id);
    titleInput.focus();
}

function openNote(noteId) {
    clearTimeout(saveTimer);

    if (!noteId) return;

    const note = notes.find(item => item.id === noteId);
    if (!note) return;

    activeNoteId = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content;

    updateCharacterCount();
    setStatus("Ready");
    renderNotes();
}

function renderNotes() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredNotes = [...notes]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm)
        );

    savedNotesContainer.replaceChildren();

    if (filteredNotes.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-notes";
        emptyMessage.textContent = searchTerm
            ? "No notes match your search."
            : "No notes yet. Select + New to create one.";

        savedNotesContainer.appendChild(emptyMessage);
        return;
    }

    filteredNotes.forEach(note => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "note-item";

        if (note.id === activeNoteId) {
            button.classList.add("active");
        }

        const title = document.createElement("span");
        title.className = "note-item-title";
        title.textContent = note.title || "Untitled note";

        const preview = document.createElement("span");
        preview.className = "note-item-preview";
        preview.textContent =
            note.content.trim().replace(/\s+/g, " ") ||
            "No additional text";

        const date = document.createElement("span");
        date.className = "note-item-date";
        date.textContent = formatDate(note.updatedAt);

        button.append(title, preview, date);
        button.addEventListener("click", () => openNote(note.id));

        savedNotesContainer.appendChild(button);
    });
}

function deleteActiveNote() {
    const note = getActiveNote();
    if (!note) return;

    const noteName = note.title.trim() || "Untitled note";

    if (!confirm(`Delete "${noteName}"? This cannot be undone.`)) {
        return;
    }

    clearTimeout(saveTimer);

    const previousNotes = [...notes];
    notes = notes.filter(item => item.id !== activeNoteId);

    if (!writeNotes()) {
        notes = previousNotes;
        renderNotes();
        return;
    }

    activeNoteId = null;

    if (notes.length > 0) {
        openNote(notes[0].id);
    } else {
        createNote();
    }

    setStatus("Note deleted");
}

newNoteButton.addEventListener("click", createNote);

saveNoteButton.addEventListener("click", () => {
    saveActiveNote(true);
});

deleteNoteButton.addEventListener("click", deleteActiveNote);

titleInput.addEventListener("input", scheduleAutoSave);
contentInput.addEventListener("input", scheduleAutoSave);

searchInput.addEventListener("input", renderNotes);


async function startApp() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("../login.html");
        return;
    }

    loadNotes();

    if (notes.length > 0) {
        notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        openNote(notes[0].id);
    } else {
        createNote();
    }
}

startApp();
