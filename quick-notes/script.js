

// 1. Supabase connection
const SUPABASE_URL = "https://lqhbmekvxwutmytuvhok.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vADKtfs1ze_kiwXlWYSTnA_LLK3GhqD";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

// 2. Check whether the user is signed in
async function checkLogin() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("../login.html");
        return false;
    }

    return true;
}

// 3. Your existing code continues here
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
const signOutButton = document.getElementById("signOut")

let notes = [];
let activeNoteId = null;
let saveTimer = null;
let currentUserId = null;

function setStatus(message) {
    statusLabel.textContent = message;
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

function getActiveNote() {
    return notes.find(note => note.id === activeNoteId);
}

function renderNotes() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filteredNotes = [...notes]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
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

async function loadNotes() {
    setStatus("Loading cloud notes...");

    const { data, error } = await supabaseClient
        .from("notes")
        .select("id, user_id, title, content, created_at, updated_at")
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud notes:", error.message);
        setStatus("Could not load notes");
        return;
    }

    notes = data.map(row => ({
        id: row.id,
        title: row.title ?? "",
        content: row.content ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));

    if (notes.length > 0) {
        openNote(notes[0].id);
    } else {
        activeNoteId = null;
        titleInput.value = "";
        contentInput.value = "";
        updateCharacterCount();
        renderNotes();
        setStatus("Ready — create your first cloud note");
    }
}

function openNote(noteId) {
    clearTimeout(saveTimer);

    const note = notes.find(item => item.id === noteId);
    if (!note) return;

    activeNoteId = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content;

    updateCharacterCount();
    setStatus("Ready");
    renderNotes();
}

async function saveActiveNote(showMessage = true) {
    clearTimeout(saveTimer);

    const note = getActiveNote();
    if (!note) return;

    note.title = titleInput.value.trim();
    note.content = contentInput.value;

    setStatus("Saving to cloud...");

    const { data, error } = await supabaseClient
        .from("notes")
        .update({
            title: note.title,
            content: note.content,
            updated_at: new Date().toISOString()
        })
        .eq("id", note.id)
        .eq("user_id", currentUserId)
        .select("id, updated_at")
        .maybeSingle();

    if (error) {
        console.error("Could not save cloud note:", error.message);
        setStatus("Cloud save failed — try again");
        return;
    }

    if (!data) {
        setStatus("Note not found or access denied");
        return;
    }

    note.updatedAt = data.updated_at;
    renderNotes();

    if (showMessage) {
        setStatus("Saved to cloud");
    }
}

function scheduleAutoSave() {
    updateCharacterCount();
    setStatus("Unsaved changes...");

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveActiveNote(false);
    }, 700);
}

async function createNote() {
    clearTimeout(saveTimer);

    if (activeNoteId) {
        await saveActiveNote(false);
    }

    setStatus("Creating cloud note...");

    const { data, error } = await supabaseClient
        .from("notes")
        .insert({
            user_id: currentUserId,
            title: "",
            content: ""
        })
        .select("id, user_id, title, content, created_at, updated_at")
        .single();

    if (error) {
        console.error("Could not create cloud note:", error.message);
        setStatus("Could not create note");
        return;
    }

    const note = {
        id: data.id,
        title: data.title,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };

    notes.unshift(note);
    openNote(note.id);
    titleInput.focus();
    setStatus("New cloud note created");
}

async function signOut () {
     // Ask Supabase to sign out the current user
    const { error } = await ____________________;
    if (error) {
        console.error("Sign out failed:", error.message);
        return;
    }
      // Send the user back to the login page
    window.location.href = "login.html";
}


// Run the function when the button is clicked
signOutButton.addEventListener("click", signOut);

    
async function deleteActiveNote() {
    const note = getActiveNote();
    if (!note) return;

    const noteName = note.title.trim() || "Untitled note";

    if (!confirm(`Delete "${noteName}"? This cannot be undone.`)) {
        return;
    }

    clearTimeout(saveTimer);
    setStatus("Deleting note...");

    const { data, error } = await supabaseClient
        .from("notes")
        .delete()
        .eq("id", note.id)
        .eq("user_id", currentUserId)
        .select("id");

    if (error) {
        console.error("Could not delete cloud note:", error.message);
        setStatus("Delete failed — try again");
        return;
    }

    if (!data || data.length === 0) {
        setStatus("Note not found or access denied");
        return;
    }

    notes = notes.filter(item => item.id !== note.id);
    activeNoteId = null;

    if (notes.length > 0) {
        openNote(notes[0].id);
    } else {
        titleInput.value = "";
        contentInput.value = "";
        updateCharacterCount();
        renderNotes();
    }

    setStatus("Note deleted from cloud");
}

async function startApp() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        window.location.replace("../login.html");
        return;
    }

    currentUserId = data.session.user.id;

    await loadNotes();
}

newNoteButton.addEventListener("click", createNote);

saveNoteButton.addEventListener("click", () => {
    saveActiveNote(true);
});

deleteNoteButton.addEventListener("click", deleteActiveNote);

titleInput.addEventListener("input", scheduleAutoSave);
contentInput.addEventListener("input", scheduleAutoSave);
searchInput.addEventListener("input", renderNotes);

startApp();
