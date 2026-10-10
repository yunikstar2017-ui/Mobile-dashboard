
const wordInput = document.getElementById("wordInput");
const defineButton = document.getElementById("defineButton");
const dictionaryResult = document.getElementById("dictionaryResult");
const pronounceButton = document.getElementById("pronounceButton");
const synonymsButton = document.getElementById("synonymsButton");

let pronunciationAudioUrl = "";

async function defineWord() {
    const word = wordInput.value.trim();

    // Check whether the user entered a word
    if (!word) {
        dictionaryResult.textContent = "Please enter a word first.";
        return;
    }

    // Show a loading message
    dictionaryResult.textContent = `Looking up "${word}"...`;

    try {
        // Request the definition from the API
        const response = await fetch(
            `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
            throw new Error("Word not found");
        }

        // Convert the response into JavaScript data
        const data = await response.json();
        
        // Clear the previous result
        dictionaryResult.replaceChildren();

        // Display the word heading
        const title = document.createElement("h2");
        title.className = "dictionary-word";
        title.textContent = data.word || word;
        dictionaryResult.appendChild(title);

        let definitionCount = 0;

        // Display each dictionary entry
        data.entries?.forEach((entry) => {
            const heading = document.createElement("h3");
            heading.className = "dictionary-label";
            heading.textContent = entry.partOfSpeech || "Definition";
            dictionaryResult.appendChild(heading);

            entry.senses?.forEach((sense) => {
                if (!sense.definition) return;

                definitionCount++;

                const card = document.createElement("div");
                card.className = "definition-item";

                const definition = document.createElement("p");

                const number = document.createElement("span");
                number.className = "definition-number";
                number.textContent = `${definitionCount}.`;

                definition.appendChild(number);
                definition.appendChild(
                    document.createTextNode(` ${sense.definition}`)
                );

                card.appendChild(definition);

                // Display an example when available
                if (sense.examples?.length > 0) {
                    const example = document.createElement("p");
                    example.className = "definition-example";
                    example.textContent = `Example: ${sense.examples[0]}`;
                    card.appendChild(example);
                }

                dictionaryResult.appendChild(card);
            });
        });

        // Handle an empty response
        if (definitionCount === 0) {
            const message = document.createElement("p");
            message.className = "dictionary-message";
            message.textContent = "No definitions were found for that word.";
            dictionaryResult.appendChild(message);
        }
    } catch (error) {
        // Handle errors
        dictionaryResult.textContent = `Error: ${error.message}`;
    }
}


defineButton.addEventListener("click", defineWord);

wordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        defineWord();
    }
});

pronounceButton.addEventListener("click", () => {
    const word = wordInput.value.trim();

    if (!word) {
        alert("Please enter a word first.");
        return;
    }

    if (!("speechSynthesis" in window)) {
        alert("Your browser does not support speech playback.");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
});


async function findSynonyms() {
    const word = wordInput.value.trim();

    if (!word) {
        dictionaryResult.textContent = "Please enter a word first.";
        return;
    }

    dictionaryResult.textContent = `Finding synonyms for "${word}"...`;

    try {
        const response = await fetch(
            `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
            throw new Error("Word not found");
        }

        const data = await response.json();
        const synonyms = new Set();

        // Collect synonyms from the dictionary entries
        data.entries?.forEach((entry) => {
            entry.senses?.forEach((sense) => {
                sense.synonyms?.forEach((synonym) => {
                    // Support either text strings or objects
                    const value =
                        typeof synonym === "string"
                            ? synonym
                            : synonym.word;

                    if (value && value.toLowerCase() !== word.toLowerCase()) {
                        synonyms.add(value);
                    }
                });
            });
        });

        // Clear previous results
        dictionaryResult.replaceChildren();

        const title = document.createElement("h2");
        title.className = "dictionary-word";
        title.textContent = `Synonyms for "${word}"`;
        dictionaryResult.appendChild(title);

        if (synonyms.size === 0) {
            const message = document.createElement("p");
            message.className = "dictionary-message";
            message.textContent =
                "No synonyms were provided for this word by the dictionary.";
            dictionaryResult.appendChild(message);
            return;
        }

        const list = document.createElement("div");
        list.className = "definition-item";
        list.textContent = [...synonyms].join(" · ");

        dictionaryResult.appendChild(list);

    } catch (error) {
        dictionaryResult.textContent = `Error: ${error.message}`;
    }
}

synonymsButton.addEventListener("click", findSynonyms);


/* ===== POMODORO TIMER ===== */

const timerDisplay = document.getElementById("timerDisplay");
const timerMode = document.getElementById("timerMode");
const startTimerButton = document.getElementById("startTimer");
const resetTimerButton = document.getElementById("resetTimer");
const timerPresetButtons = document.querySelectorAll(".timer-presets [data-minutes]");

let pomodoroInterval = null;
let pomodoroEndTime = null;
let pomodoroDuration = 25 * 60;
let pomodoroRemaining = 25 * 60;
let pomodoroRunning = false;

function displayPomodoroTime() {
    const minutes = Math.floor(pomodoroRemaining / 60);
    const seconds = pomodoroRemaining % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopPomodoroInterval() {
    if (pomodoroInterval !== null) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }

    pomodoroRunning = false;
    startTimerButton.textContent = "▶ Start";
}

function updatePomodoro() {
    pomodoroRemaining = Math.max(
        0,
        Math.ceil((pomodoroEndTime - Date.now()) / 1000)
    );

    displayPomodoroTime();

    if (pomodoroRemaining <= 0) {
        stopPomodoroInterval();
        startTimerButton.textContent = "▶ Start";
        timerMode.textContent = "Session complete!";

        // Optional completion sound using the browser's built-in audio.
        try {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;

            if (AudioContextClass) {
                const audioContext = new AudioContextClass();
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                oscillator.frequency.value = 880;
                gain.gain.value = 0.15;

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.35);
                oscillator.onended = () => audioContext.close();
            }
        } catch (error) {
            console.warn("Completion sound unavailable:", error);
        }
    }
}

function startPomodoro() {
    if (pomodoroRunning) {
        // Pause the timer.
        pomodoroRemaining = Math.max(
            0,
            Math.ceil((pomodoroEndTime - Date.now()) / 1000)
        );

        stopPomodoroInterval();
        displayPomodoroTime();
        startTimerButton.textContent = "▶ Resume";
        return;
    }

    if (pomodoroRemaining <= 0) {
        pomodoroRemaining = pomodoroDuration;
        displayPomodoroTime();
    }

    pomodoroEndTime = Date.now() + pomodoroRemaining * 1000;
    pomodoroRunning = true;
    startTimerButton.textContent = "⏸ Pause";
    timerMode.textContent = `${timerMode.dataset.mode || "Focus"} in progress`;

    pomodoroInterval = setInterval(updatePomodoro, 250);
    updatePomodoro();
}

function resetPomodoro() {
    stopPomodoroInterval();
    pomodoroRemaining = pomodoroDuration;
    timerMode.textContent =
        `${timerMode.dataset.mode || "Focus"} timer`;
    displayPomodoroTime();
}

function selectPomodoroPreset(button) {
    stopPomodoroInterval();

    const minutes = Number(button.dataset.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;

    pomodoroDuration = minutes * 60;
    pomodoroRemaining = pomodoroDuration;

    const mode = button.dataset.mode || "Focus";
    timerMode.dataset.mode = mode;
    timerMode.textContent =
        mode === "Break" ? `${minutes} minute break` : `${minutes} minute focus`;

    startTimerButton.textContent = "▶ Start";
    displayPomodoroTime();
}

startTimerButton.addEventListener("click", startPomodoro);
resetTimerButton.addEventListener("click", resetPomodoro);

timerPresetButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectPomodoroPreset(button);
    });
});

timerMode.dataset.mode = "Focus";
displayPomodoroTime();